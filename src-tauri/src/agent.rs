use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicU64, Ordering};
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
    pub seq: u64,
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

async fn extract_unseen_thoughts(
    home: &str,
    conv_id: &str,
    processed_steps: &mut std::collections::HashSet<i64>,
) -> Vec<String> {
    let base_logs = std::path::PathBuf::from(home)
        .join(".gemini/antigravity-cli/brain")
        .join(conv_id)
        .join(".system_generated/logs");
    let tpath = base_logs.join("transcript.jsonl");
    if !tpath.exists() {
        return Vec::new();
    }
    let Ok(content) = tokio::fs::read_to_string(&tpath).await else {
        return Vec::new();
    };

    let mut new_thoughts = Vec::new();
    for (line_idx, line) in content.lines().enumerate() {
        if line.trim().is_empty() {
            continue;
        }
        if let Ok(entry) = serde_json::from_str::<serde_json::Value>(line) {
            let step_idx = entry.get("step_index").and_then(|i| i.as_i64()).unwrap_or(-1);
            if step_idx >= 0 && !processed_steps.contains(&step_idx) {
                let mut thinking_text = entry.get("thinking").and_then(|t| t.as_str()).map(|s| s.to_string());

                let is_truncated = entry
                    .get("truncated_fields")
                    .and_then(|tf| tf.as_array())
                    .map(|arr| arr.iter().any(|v| v.as_str() == Some("thinking")))
                    .unwrap_or(false);

                if is_truncated {
                    let full_path = base_logs.join("transcript_full.jsonl");
                    if let Ok(full_content) = tokio::fs::read_to_string(&full_path).await {
                        if let Some(full_line) = full_content.lines().nth(line_idx) {
                            if let Ok(full_entry) = serde_json::from_str::<serde_json::Value>(full_line) {
                                if let Some(ft) = full_entry.get("thinking").and_then(|t| t.as_str()) {
                                    thinking_text = Some(ft.to_string());
                                }
                            }
                        }
                    }
                }

                if let Some(th) = thinking_text {
                    let trimmed = th.trim();
                    if !trimmed.is_empty() {
                        processed_steps.insert(step_idx);
                        new_thoughts.push(trimmed.to_string());
                    }
                }
            }
        }
    }
    new_thoughts
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
    let chunk_seq = Arc::new(AtomicU64::new(0));
    let init_chunk = AgentStreamChunk {
        stream_id: stream_id.clone(),
        seq: chunk_seq.fetch_add(1, Ordering::SeqCst),
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
    let home_stream = home.clone();
    let chunk_seq_stdout = Arc::clone(&chunk_seq);
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        let mut captured_conv_id: Option<String> = None;
        let mut processed_thinking_steps: std::collections::HashSet<i64> = std::collections::HashSet::new();

        while let Ok(Some(line)) = reader.next_line().await {
            if line.trim().is_empty() {
                continue;
            }

            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&line) {
                if let Some(event) = val.get("event").and_then(|e| e.as_str()) {
                    match event {
                        "init" => {
                            if let Some(cid) = val.get("conversation_id").and_then(|c| c.as_str()) {
                                captured_conv_id = Some(cid.to_string());
                            }
                        }
                        "step_update" => {
                            if let Some(step) = val.get("step_update") {
                                let step_type = step
                                    .get("step_type")
                                    .and_then(|s| s.as_str())
                                    .map(|s| s.to_string());
                                let state = step.get("state").and_then(|s| s.as_str());

                                // 1. Emisión de deltas de texto normales
                                if let Some(delta) = step.get("text_delta").and_then(|d| d.as_str()) {
                                    let chunk = AgentStreamChunk {
                                        stream_id: stream_id_stdout.clone(),
                                        seq: chunk_seq_stdout.fetch_add(1, Ordering::SeqCst),
                                        event_type: "delta".into(),
                                        content: delta.to_string(),
                                        step_type: step_type.clone(),
                                        duration_seconds: None,
                                        input_tokens: None,
                                        output_tokens: None,
                                        total_tokens: None,
                                    };
                                    let _ = app_stdout.emit("agent-stream", chunk);
                                }

                                // 2. Captura y streaming de razonamiento interno (Chain of Thought)
                                if state == Some("DONE") {
                                    if let Some(ref cid) = captured_conv_id {
                                        let thoughts = extract_unseen_thoughts(&home_stream, cid, &mut processed_thinking_steps).await;
                                        for th in thoughts {
                                            let formatted_thinking = format!(
                                                "<thought>\n🧠 [Razonamiento Técnico]\n{}\n</thought>\n",
                                                th
                                            );
                                            let chunk = AgentStreamChunk {
                                                stream_id: stream_id_stdout.clone(),
                                                seq: chunk_seq_stdout.fetch_add(1, Ordering::SeqCst),
                                                event_type: "delta".into(),
                                                content: formatted_thinking,
                                                step_type: Some("thinking".into()),
                                                duration_seconds: None,
                                                input_tokens: None,
                                                output_tokens: None,
                                                total_tokens: None,
                                            };
                                            let _ = app_stdout.emit("agent-stream", chunk);
                                        }
                                    }
                                }

                                // 3. Captura y formateo de llamadas y ejecuciones de herramientas
                                if step_type.as_deref() == Some("tool") {
                                    if state == Some("DONE") {
                                        if let Some(tool_info) = step.get("tool_info") {
                                            let tool_name = step.get("tool_name").and_then(|n| n.as_str()).unwrap_or("herramienta");
                                            let params_str = tool_info
                                                .get("parameters")
                                                .map(|p| serde_json::to_string_pretty(p).unwrap_or_default())
                                                .unwrap_or_default();
                                            let output_str = tool_info.get("output").and_then(|o| o.as_str()).unwrap_or("");
                                            let duration = step.get("duration_seconds").and_then(|d| d.as_f64()).unwrap_or(0.0);

                                            let formatted_tool = format!(
                                                "<thought>\n⚙️ [Herramienta: {} ({:.2}s)]\nParámetros:\n{}\n\nResultado:\n{}\n</thought>\n",
                                                tool_name, duration, params_str.trim(), output_str.trim()
                                            );

                                            let chunk = AgentStreamChunk {
                                                stream_id: stream_id_stdout.clone(),
                                                seq: chunk_seq_stdout.fetch_add(1, Ordering::SeqCst),
                                                event_type: "delta".into(),
                                                content: formatted_tool,
                                                step_type: Some("tool".into()),
                                                duration_seconds: None,
                                                input_tokens: None,
                                                output_tokens: None,
                                                total_tokens: None,
                                            };
                                            let _ = app_stdout.emit("agent-stream", chunk);
                                        }
                                    }
                                }
                            }
                        }
                        "result" => {
                            if let Some(res) = val.get("result") {
                                // Barrido final de pensamientos antes de emitir done
                                if let Some(ref cid) = captured_conv_id {
                                    let thoughts = extract_unseen_thoughts(&home_stream, cid, &mut processed_thinking_steps).await;
                                    for th in thoughts {
                                        let formatted_thinking = format!(
                                            "<thought>\n🧠 [Razonamiento Técnico]\n{}\n</thought>\n",
                                            th
                                        );
                                        let chunk = AgentStreamChunk {
                                            stream_id: stream_id_stdout.clone(),
                                            seq: chunk_seq_stdout.fetch_add(1, Ordering::SeqCst),
                                            event_type: "delta".into(),
                                            content: formatted_thinking,
                                            step_type: Some("thinking".into()),
                                            duration_seconds: None,
                                            input_tokens: None,
                                            output_tokens: None,
                                            total_tokens: None,
                                        };
                                        let _ = app_stdout.emit("agent-stream", chunk);
                                    }
                                }

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
                                    seq: chunk_seq_stdout.fetch_add(1, Ordering::SeqCst),
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
                    seq: chunk_seq_stdout.fetch_add(1, Ordering::SeqCst),
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
    let chunk_seq_stderr = Arc::clone(&chunk_seq);
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
                    seq: chunk_seq_stderr.fetch_add(1, Ordering::SeqCst),
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

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChatSession {
    pub id: String,
    pub title: String,
    pub context_id: String,
    pub effort: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub id: String,
    pub session_id: String,
    pub role: String,
    pub content: String,
    pub context: Option<String>,
    pub effort: Option<String>,
    pub created_at: String,
    pub duration_seconds: Option<f64>,
    pub total_tokens: Option<u64>,
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
}

#[tauri::command]
pub fn sqlite_get_chat_sessions() -> Result<Vec<ChatSession>, String> {
    let conn = crate::db::get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, title, context_id, effort, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(ChatSession {
                id: r.get(0)?,
                title: r.get(1)?,
                context_id: r.get(2)?,
                effort: r.get(3)?,
                created_at: r.get(4)?,
                updated_at: r.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut sessions = Vec::new();
    for item in rows {
        if let Ok(s) = item {
            sessions.push(s);
        }
    }
    Ok(sessions)
}

#[tauri::command]
pub fn sqlite_save_chat_session(session: ChatSession) -> Result<ChatSession, String> {
    let conn = crate::db::get_db_connection()?;
    conn.execute(
        "INSERT INTO chat_sessions (id, title, context_id, effort, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            context_id = excluded.context_id,
            effort = excluded.effort,
            updated_at = excluded.updated_at",
        rusqlite::params![
            session.id,
            session.title,
            session.context_id,
            session.effort,
            session.created_at,
            session.updated_at
        ],
    )
    .map_err(|e| format!("Error guardando sesión de chat: {}", e))?;

    Ok(session)
}

#[tauri::command]
pub fn sqlite_delete_chat_session(id: String) -> Result<(), String> {
    let conn = crate::db::get_db_connection()?;
    conn.execute("DELETE FROM chat_messages WHERE session_id = ?1", rusqlite::params![id])
        .map_err(|e| format!("Error eliminando mensajes de sesión: {}", e))?;
    conn.execute("DELETE FROM chat_sessions WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| format!("Error eliminando sesión de chat: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn sqlite_get_chat_messages(session_id: String) -> Result<Vec<ChatMessage>, String> {
    let conn = crate::db::get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, session_id, role, content, context, effort, created_at, duration_seconds, total_tokens, input_tokens, output_tokens
             FROM chat_messages
             WHERE session_id = ?1
             ORDER BY created_at ASC"
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(rusqlite::params![session_id], |r| {
            let total_tokens_i64: Option<i64> = r.get(8)?;
            let input_tokens_i64: Option<i64> = r.get(9)?;
            let output_tokens_i64: Option<i64> = r.get(10)?;
            Ok(ChatMessage {
                id: r.get(0)?,
                session_id: r.get(1)?,
                role: r.get(2)?,
                content: r.get(3)?,
                context: r.get(4)?,
                effort: r.get(5)?,
                created_at: r.get(6)?,
                duration_seconds: r.get(7)?,
                total_tokens: total_tokens_i64.map(|v| v as u64),
                input_tokens: input_tokens_i64.map(|v| v as u64),
                output_tokens: output_tokens_i64.map(|v| v as u64),
            })
        })
        .map_err(|e| e.to_string())?;

    let mut messages = Vec::new();
    for item in rows {
        if let Ok(m) = item {
            messages.push(m);
        }
    }
    Ok(messages)
}

#[tauri::command]
pub fn sqlite_save_chat_message(message: ChatMessage) -> Result<(), String> {
    let conn = crate::db::get_db_connection()?;
    conn.execute(
        "INSERT INTO chat_messages
         (id, session_id, role, content, context, effort, created_at, duration_seconds, total_tokens, input_tokens, output_tokens)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
         ON CONFLICT(id) DO UPDATE SET
            content = excluded.content,
            duration_seconds = excluded.duration_seconds,
            total_tokens = excluded.total_tokens,
            input_tokens = excluded.input_tokens,
            output_tokens = excluded.output_tokens",
        rusqlite::params![
            message.id,
            message.session_id,
            message.role,
            message.content,
            message.context,
            message.effort,
            message.created_at,
            message.duration_seconds,
            message.total_tokens.map(|v| v as i64),
            message.input_tokens.map(|v| v as i64),
            message.output_tokens.map(|v| v as i64)
        ],
    )
    .map_err(|e| format!("Error guardando mensaje de chat: {}", e))?;

    // Actualizar updated_at de la sesión
    let _ = conn.execute(
        "UPDATE chat_sessions SET updated_at = ?1 WHERE id = ?2",
        rusqlite::params![message.created_at, message.session_id],
    );

    Ok(())
}

