use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::sync::{Arc, OnceLock};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

static AGENT_STDIN_MAP: OnceLock<Arc<Mutex<HashMap<String, tokio::process::ChildStdin>>>> = OnceLock::new();

fn get_stdin_map() -> &'static Arc<Mutex<HashMap<String, tokio::process::ChildStdin>>> {
    AGENT_STDIN_MAP.get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AgentStreamChunk {
    pub stream_id: String,
    pub event_type: String, // "init", "delta", "step", "permission", "done", "error"
    pub content: String,
    pub step_type: Option<String>,
    pub duration_seconds: Option<f64>,
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub total_tokens: Option<u64>,
}

#[tauri::command]
pub async fn send_agent_input(stream_id: String, input: String) -> Result<(), String> {
    let map = get_stdin_map();
    let mut lock = map.lock().await;
    if let Some(stdin) = lock.get_mut(&stream_id) {
        let payload = format!("{}\n", input.trim());
        stdin
            .write_all(payload.as_bytes())
            .await
            .map_err(|e| format!("Error escribiendo a stdin: {}", e))?;
        stdin
            .flush()
            .await
            .map_err(|e| format!("Error vaciando stdin: {}", e))?;
        Ok(())
    } else {
        Err(format!("No hay proceso de agente activo para el stream {}", stream_id))
    }
}

#[tauri::command]
pub async fn execute_agent_prompt(
    app: AppHandle,
    prompt: String,
    context_id: Option<String>,
    context_path: Option<String>,
    skills: Option<Vec<String>>,
    stream_id: String,
    effort: Option<String>,
) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let cfg = crate::config::get_aegis_config().ok();

    // Resolver motor de IA según configuración
    let agent_type = cfg.as_ref().map(|c| c.agent_type.as_str()).unwrap_or("agy");
    let custom_cmd = cfg.as_ref().and_then(|c| c.agent_custom_cmd.clone());

    let agent_binary = match agent_type {
        "claude" => "claude".to_string(),
        "ollama" => "ollama".to_string(),
        "custom" => custom_cmd.unwrap_or_else(|| "agy".to_string()),
        _ => {
            let local_agy = Path::new(&home).join(".local/bin/agy");
            if local_agy.exists() {
                local_agy.to_string_lossy().to_string()
            } else if Path::new("/usr/local/bin/agy").exists() {
                "/usr/local/bin/agy".to_string()
            } else {
                "agy".to_string()
            }
        }
    };

    let ctx_name = context_id.unwrap_or_else(|| "general".to_string());

    // Crear workspace aislado para el contexto de Aegis (~/.local/share/aegis/contexts/<id>)
    let ctx_workspace = Path::new(&home)
        .join(".local/share/aegis/contexts")
        .join(&ctx_name);
    let skills_dir = ctx_workspace.join(".agents/skills");

    if let Err(e) = std::fs::create_dir_all(&skills_dir) {
        eprintln!("Aegis Context Warning: no se pudo crear skills_dir: {}", e);
    } else {
        // Limpiar symlinks previos en el contexto
        if let Ok(entries) = std::fs::read_dir(&skills_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                let _ = std::fs::remove_file(&p);
                let _ = std::fs::remove_dir_all(&p);
            }
        }

        // Crear symlinks únicamente para las skills seleccionadas en Aegis
        if let Some(ref selected_skills) = skills {
            let global_skills_dir = Path::new(&home).join(".agents/skills");
            for skill in selected_skills {
                let clean = skill.trim();
                if clean.is_empty() {
                    continue;
                }
                let src = global_skills_dir.join(clean);
                let dst = skills_dir.join(clean);
                if src.exists() {
                    #[cfg(unix)]
                    let _ = std::os::unix::fs::symlink(&src, &dst);
                }
            }
        }
    }

    let mut cmd = Command::new(&agent_binary);
    cmd.arg("-p")
        .arg(&prompt)
        .arg("--output-format")
        .arg("stream-json");

    // Inyección de nivel de esfuerzo/razonamiento (low para flash, high para profundo)
    if let Some(ref eff) = effort {
        if !eff.trim().is_empty() {
            cmd.arg("--effort").arg(eff.trim());
        }
    }

    // Siempre establecemos el workspace del contexto como cwd principal.
    // Esto garantiza al 100% que agy descubra EXCLUSIVAMENTE los symlinks de skills
    // que el usuario activó o desactivó en la interfaz de Aegis.
    cmd.current_dir(&ctx_workspace);

    // Si el contexto define una ruta de proyecto (ej: TADU, Granja, Bóveda) y no es HOME ni el workspace,
    // se agrega con --add-dir para que el agente tenga acceso inmediato a sus archivos y repositorios.
    if let Some(ref path) = context_path {
        let clean = path.trim();
        if !clean.is_empty()
            && clean != home.as_str()
            && Path::new(clean).exists()
            && Path::new(clean) != ctx_workspace.as_path()
        {
            cmd.arg("--add-dir").arg(clean);
        }
    }

    cmd.stdin(Stdio::piped());
    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Error iniciando agente ({:?}): {}", agent_binary, e))?;

    if let Some(stdin) = child.stdin.take() {
        let map = get_stdin_map();
        map.lock().await.insert(stream_id.clone(), stdin);
    }

    let stdout = child.stdout.take().ok_or("Fallo al capturar stdout")?;
    let stderr = child.stderr.take().ok_or("Fallo al capturar stderr")?;

    // Emitir evento "init" inmediato para confirmar que el agente está trabajando
    let init_chunk = AgentStreamChunk {
        stream_id: stream_id.clone(),
        event_type: "init".into(),
        content: "Iniciando motor de razonamiento y montando contexto...".into(),
        step_type: Some("init".into()),
        duration_seconds: None,
        input_tokens: None,
        output_tokens: None,
        total_tokens: None,
    };
    let _ = app.emit("agent-stream", init_chunk);

    // Streaming de stdout
    let app_stdout = app.clone();
    let stream_id_stdout = stream_id.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            if line.trim().is_empty() {
                continue;
            }

            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                if let Some(event) = val.get("event").and_then(|e| e.as_str()) {
                    match event {
                        "step_update" => {
                            if let Some(step) = val.get("step_update") {
                                let step_type = step
                                    .get("step_type")
                                    .and_then(|s| s.as_str())
                                    .map(|s| s.to_string());

                                if let Some(delta) = step.get("text_delta").and_then(|d| d.as_str()) {
                                    let chunk = AgentStreamChunk {
                                        stream_id: stream_id_stdout.clone(),
                                        event_type: "delta".into(),
                                        content: delta.to_string(),
                                        step_type,
                                        duration_seconds: None,
                                        input_tokens: None,
                                        output_tokens: None,
                                        total_tokens: None,
                                    };
                                    let _ = app_stdout.emit("agent-stream", chunk);
                                }
                            }
                        }
                        "result" => {
                            if let Some(res) = val.get("result") {
                                let duration = res.get("duration_seconds").and_then(|d| d.as_f64());
                                let usage = res.get("usage");
                                let input_tokens = usage
                                    .and_then(|u| u.get("input_tokens"))
                                    .and_then(|t| t.as_u64());
                                let output_tokens = usage
                                    .and_then(|u| u.get("output_tokens"))
                                    .and_then(|t| t.as_u64());
                                let total_tokens = usage
                                    .and_then(|u| u.get("total_tokens"))
                                    .and_then(|t| t.as_u64());

                                let chunk = AgentStreamChunk {
                                    stream_id: stream_id_stdout.clone(),
                                    event_type: "done".into(),
                                    content: "".into(),
                                    step_type: None,
                                    duration_seconds: duration,
                                    input_tokens,
                                    output_tokens,
                                    total_tokens,
                                };
                                let _ = app_stdout.emit("agent-stream", chunk);
                                let map = get_stdin_map();
                                map.lock().await.remove(&stream_id_stdout);
                            }
                        }
                        _ => {}
                    }
                }
            } else {
                // Detectar si el CLI está solicitando confirmación interactiva (Human-in-the-loop)
                let is_permission_prompt = line.contains("[y/N]")
                    || line.contains("[Y/n]")
                    || line.contains("Allow execution")
                    || line.contains("Do you want to proceed")
                    || line.contains("Permitir ejecuci");

                let event_type = if is_permission_prompt {
                    "permission".to_string()
                } else {
                    "delta".to_string()
                };

                let chunk = AgentStreamChunk {
                    stream_id: stream_id_stdout.clone(),
                    event_type,
                    content: format!("{}\n", line),
                    step_type: if is_permission_prompt { Some("permission_request".into()) } else { None },
                    duration_seconds: None,
                    input_tokens: None,
                    output_tokens: None,
                    total_tokens: None,
                };
                let _ = app_stdout.emit("agent-stream", chunk);
            }
        }
        let map = get_stdin_map();
        map.lock().await.remove(&stream_id_stdout);
    });

    // Monitoreo de stderr y terminación
    let app_stderr = app.clone();
    let stream_id_stderr = stream_id.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        let mut err_buffer = String::new();
        while let Ok(Some(line)) = reader.next_line().await {
            err_buffer.push_str(&line);
            err_buffer.push('\n');
        }

        let map = get_stdin_map();
        map.lock().await.remove(&stream_id_stderr);

        let status = child.wait().await;
        if let Ok(exit_status) = status {
            if !exit_status.success() && !err_buffer.is_empty() {
                let chunk = AgentStreamChunk {
                    stream_id: stream_id_stderr.clone(),
                    event_type: "error".into(),
                    content: err_buffer,
                    step_type: None,
                    duration_seconds: None,
                    input_tokens: None,
                    output_tokens: None,
                    total_tokens: None,
                };
                let _ = app_stderr.emit("agent-stream", chunk);
            }
        }
    });

    Ok(format!("Stream iniciado ({})", stream_id))
}
