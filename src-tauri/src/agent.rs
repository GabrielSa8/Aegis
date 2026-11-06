use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, OnceLock};
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

static AGENT_STDIN_MAP: OnceLock<Arc<Mutex<HashMap<String, tokio::process::ChildStdin>>>> = OnceLock::new();

static AGENT_PID_MAP: OnceLock<Arc<Mutex<HashMap<String, u32>>>> = OnceLock::new();

fn get_pid_map() -> &'static Arc<Mutex<HashMap<String, u32>>> {
    AGENT_PID_MAP.get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
}

/// Interrumpe el agente activo (SIGTERM al grupo de procesos).
#[tauri::command]
pub async fn cancel_agent_stream(stream_id: String) -> Result<(), String> {
    let pid = get_pid_map().lock().await.remove(&stream_id);
    get_stdin_map().lock().await.remove(&stream_id);
    let pid = pid.ok_or_else(|| format!("No hay proceso activo para {}", stream_id))?;
    let _ = std::process::Command::new("kill")
        .arg("-TERM")
        .arg(format!("-{}", pid))
        .status();
    Ok(())
}

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

/// Extrae nombres de skills cuyos `SKILL.md` fueron abiertos en un bloque JSON de tool_calls o parámetros.
fn detect_read_skills(raw: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest = raw;
    while let Some(idx) = rest.find("/skills/") {
        let after = &rest[idx + 8..];
        if let Some(slash) = after.find('/') {
            let name = &after[..slash];
            let tail = &after[slash..];
            if !name.is_empty()
                && name
                    .chars()
                    .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
                && tail.starts_with("/SKILL.md")
                && !out.iter().any(|s| s == name)
            {
                out.push(name.to_string());
            }
        }
        rest = after;
    }
    out
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
                let mut tool_calls_str = entry.get("tool_calls").map(|tc| tc.to_string());

                let is_truncated = entry
                    .get("truncated_fields")
                    .and_then(|tf| tf.as_array())
                    .map(|arr| {
                        arr.iter().any(|v| {
                            v.as_str() == Some("thinking") || v.as_str() == Some("tool_calls")
                        })
                    })
                    .unwrap_or(false);

                if is_truncated {
                    let full_path = base_logs.join("transcript_full.jsonl");
                    if let Ok(full_content) = tokio::fs::read_to_string(&full_path).await {
                        if let Some(full_line) = full_content.lines().nth(line_idx) {
                            if let Ok(full_entry) = serde_json::from_str::<serde_json::Value>(full_line) {
                                if let Some(ft) = full_entry.get("thinking").and_then(|t| t.as_str()) {
                                    thinking_text = Some(ft.to_string());
                                }
                                if let Some(tc) = full_entry.get("tool_calls") {
                                    tool_calls_str = Some(tc.to_string());
                                }
                            }
                        }
                    }
                }

                let mut step_recorded = false;
                if let Some(th) = thinking_text {
                    let trimmed = th.trim();
                    if !trimmed.is_empty() {
                        step_recorded = true;
                        new_thoughts.push(trimmed.to_string());
                    }
                }

                if let Some(tc_raw) = tool_calls_str {
                    for sk in detect_read_skills(&tc_raw) {
                        step_recorded = true;
                        new_thoughts.push(format!("🧩 [Skill Leída: {}]", sk));
                    }
                }

                if step_recorded {
                    processed_steps.insert(step_idx);
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
    model: Option<String>,
) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let cfg = crate::config::get_aegis_config().ok();

    // Resolver motor de IA según configuración
    let agent_type = cfg.as_ref().map(|c| c.agent_type.as_str()).unwrap_or("agy");
    let custom_cmd = cfg.as_ref().and_then(|c| c.agent_custom_cmd.clone());

    let agent_binary = match agent_type {
        "claude" | "anthropic" => "claude".to_string(),
        "codex" | "openai" => "codex".to_string(),
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

    let mut mounted_skills: Vec<String> = Vec::new();
    let mut auto_cortex_skills: Vec<String> = Vec::new();
    let global_skills_dir = Path::new(&home).join(".agents/skills");
    let prompt_norm: String = prompt
        .chars()
        .map(|c| match c {
            'á' | 'Á' => 'a',
            'é' | 'É' => 'e',
            'í' | 'Í' => 'i',
            'ó' | 'Ó' => 'o',
            'ú' | 'Ú' => 'u',
            _ => c.to_ascii_lowercase(),
        })
        .collect();

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

        // 1. Crear symlinks para las skills seleccionadas en el perfil de Aegis
        if let Some(ref selected_skills) = skills {
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
                    if !mounted_skills.iter().any(|s| s == clean) {
                        mounted_skills.push(clean.to_string());
                    }
                }
            }
        }

        // 2. Auto-montar skills `cortex-<tema>` si el prompt menciona `<tema>`
        if let Ok(entries) = std::fs::read_dir(&global_skills_dir) {
            for entry in entries.flatten() {
                let fname = entry.file_name().to_string_lossy().to_string();
                if let Some(topic) = fname.strip_prefix("cortex-") {
                    let topic_space = topic.replace('-', " ");
                    if !topic.is_empty()
                        && (prompt_norm.contains(topic) || prompt_norm.contains(&topic_space))
                    {
                        let dst = skills_dir.join(&fname);
                        if !dst.exists() {
                            #[cfg(unix)]
                            let _ = std::os::unix::fs::symlink(entry.path(), &dst);
                        }
                        if !auto_cortex_skills.contains(&fname) {
                            auto_cortex_skills.push(fname);
                        }
                    }
                }
            }
        }
    }

    // Si se auto-activó alguna skill de Hermes Cortex para este tema, inyectar su síntesis
    let mut effective_prompt = prompt.clone();
    for c_skill in &auto_cortex_skills {
        let md_path = global_skills_dir.join(c_skill).join("SKILL.md");
        if let Ok(md_content) = std::fs::read_to_string(&md_path) {
            effective_prompt.push_str(&format!(
                "\n\n[Contexto de Skill Activa `{}`]:\n{}",
                c_skill,
                md_content.trim()
            ));
        }
    }

    let mut chain: Vec<String> = Vec::new();
    if let Some(c) = cfg.as_ref() {
        for e in c.fallback_entries.iter().filter(|e| e.engine == agent_type) {
            let m = e.model.trim();
            if !m.is_empty() && Some(m) != model.as_deref().map(str::trim) && !chain.iter().any(|x| x == m) {
                chain.push(m.to_string());
            }
        }
    }

    let ctx = AttemptCtx {
        app,
        agent_binary,
        prompt: effective_prompt,
        effort,
        ctx_workspace,
        context_path,
        home,
        stream_id: stream_id.clone(),
        chunk_seq: Arc::new(AtomicU64::new(0)),
        mounted_skills,
        auto_cortex_skills,
    };
    spawn_attempt(ctx, model, chain).await?;
    Ok(format!("Stream iniciado ({})", stream_id))
}


#[derive(Clone)]
struct AttemptCtx {
    app: AppHandle,
    agent_binary: String,
    prompt: String,
    effort: Option<String>,
    ctx_workspace: std::path::PathBuf,
    context_path: Option<String>,
    home: String,
    stream_id: String,
    chunk_seq: Arc<AtomicU64>,
    mounted_skills: Vec<String>,
    auto_cortex_skills: Vec<String>,
}

/// Detecta errores de cuota/rate-limit (429) del proveedor en un fragmento de salida.
fn is_quota_error(text: &str) -> bool {
    let t = text.to_lowercase();
    t.contains("resource_exhausted")
        || t.contains("code 429")
        || t.contains("quota reached")
        || t.contains("quota exceeded")
        || t.contains("rate limit")
        || t.contains("rate_limit")
        || t.contains("too many requests")
}

fn emit_tracked(app: &AppHandle, chunk: AgentStreamChunk, emitted: &AtomicBool, done: &AtomicBool) {
    match chunk.event_type.as_str() {
        "delta" => emitted.store(true, Ordering::SeqCst),
        "done" => done.store(true, Ordering::SeqCst),
        _ => {}
    }
    let _ = app.emit("agent-stream", chunk);
}

type AttemptFuture = std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send>>;

/// Lanza un intento del agente con `model`; `remaining` es la cadena de fallback restante.
fn spawn_attempt(ctx: AttemptCtx, model: Option<String>, remaining: Vec<String>) -> AttemptFuture {
    Box::pin(async move {
    let app = ctx.app.clone();
    let agent_binary = ctx.agent_binary.clone();
    let prompt = ctx.prompt.clone();
    let effort = ctx.effort.clone();
    let ctx_workspace = ctx.ctx_workspace.clone();
    let context_path = ctx.context_path.clone();
    let home = ctx.home.clone();
    let stream_id = ctx.stream_id.clone();

    let mut cmd = Command::new(&agent_binary);
    cmd.arg("-p")
        .arg(&prompt)
        .arg("--output-format")
        .arg("stream-json");

    // Inyección de modelo específico del proveedor si está seleccionado
    if let Some(ref m) = model {
        let clean = m.trim();
        if !clean.is_empty() {
            cmd.arg("--model").arg(clean);
        }
    }

    // Inyección de nivel de esfuerzo/razonamiento (low para flash, high para profundo)
    // Si el id del modelo ya trae intensidad (-low/-medium/-high), --effort entra en conflicto y se omite.
    let model_has_level = model.as_deref().map_or(false, |m| {
        let m = m.trim();
        m.ends_with("-low") || m.ends_with("-medium") || m.ends_with("-high")
    });
    if let Some(ref eff) = effort {
        if !eff.trim().is_empty() && !model_has_level {
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
    #[cfg(unix)]
    cmd.process_group(0);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Error iniciando agente ({:?}): {}", agent_binary, e))?;

    if let Some(pid) = child.id() {
        get_pid_map().lock().await.insert(stream_id.clone(), pid);
    }

    if let Some(stdin) = child.stdin.take() {
        let map = get_stdin_map();
        map.lock().await.insert(stream_id.clone(), stdin);
    }

    let stdout = child.stdout.take().ok_or("Fallo al capturar stdout")?;
    let stderr = child.stderr.take().ok_or("Fallo al capturar stderr")?;

    // Emitir evento "init" inmediato para confirmar que el agente está trabajando
    let chunk_seq = Arc::clone(&ctx.chunk_seq);
    let has_fallback = !remaining.is_empty();
    let quota_hit = Arc::new(AtomicBool::new(false));
    let emitted = Arc::new(AtomicBool::new(false));
    let done_emitted = Arc::new(AtomicBool::new(false));
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

    // Emitir telemetría de skills montadas en el contexto y auto-activadas por Hermes Cortex
    if !ctx.mounted_skills.is_empty() || !ctx.auto_cortex_skills.is_empty() {
        let mut lines = Vec::new();
        if !ctx.mounted_skills.is_empty() {
            lines.push(format!("🧩 [Skills Montadas: {}]", ctx.mounted_skills.join(", ")));
        }
        for cs in &ctx.auto_cortex_skills {
            lines.push(format!("🧩 [Skill Leída: {}]", cs));
        }
        let skills_chunk = AgentStreamChunk {
            stream_id: stream_id.clone(),
            seq: chunk_seq.fetch_add(1, Ordering::SeqCst),
            event_type: "delta".into(),
            content: format!("<thought>\n{}\n</thought>\n", lines.join("\n")),
            step_type: Some("thinking".into()),
            duration_seconds: None,
            input_tokens: None,
            output_tokens: None,
            total_tokens: None,
        };
        let _ = app.emit("agent-stream", skills_chunk);
    }

    // Streaming de stdout
    let app_stdout = app.clone();
    let stream_id_stdout = stream_id.clone();
    let home_stream = home.clone();
    let chunk_seq_stdout = Arc::clone(&chunk_seq);
    let quota_stdout = Arc::clone(&quota_hit);
    let emitted_stdout = Arc::clone(&emitted);
    let done_stdout = Arc::clone(&done_emitted);
    tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        let mut captured_conv_id: Option<String> = None;
        let mut processed_thinking_steps: std::collections::HashSet<i64> = std::collections::HashSet::new();

        while let Ok(Some(line)) = reader.next_line().await {
            if line.trim().is_empty() {
                continue;
            }

            // Cuota agotada: solo cuenta mientras el usuario aún no vio contenido (reintento seguro)
            if !emitted_stdout.load(Ordering::SeqCst) && is_quota_error(&line) {
                quota_stdout.store(true, Ordering::SeqCst);
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
                                    let _ = emit_tracked(&app_stdout, chunk, &emitted_stdout, &done_stdout);
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
                                            let _ = emit_tracked(&app_stdout, chunk, &emitted_stdout, &done_stdout);
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

                                            let read_skills = detect_read_skills(&params_str);
                                            let skill_tag = if read_skills.is_empty() {
                                                String::new()
                                            } else {
                                                read_skills
                                                    .iter()
                                                    .map(|s| format!("\n🧩 [Skill Leída: {}]", s))
                                                    .collect::<Vec<_>>()
                                                    .join("")
                                            };

                                            let formatted_tool = format!(
                                                "<thought>\n⚙️ [Herramienta: {} ({:.2}s)]{}\nParámetros:\n{}\n\nResultado:\n{}\n</thought>\n",
                                                tool_name, duration, skill_tag, params_str.trim(), output_str.trim()
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
                                            let _ = emit_tracked(&app_stdout, chunk, &emitted_stdout, &done_stdout);
                                        }
                                    }
                                }
                            }
                        }
                        "result" => {
                            let suppress_done = has_fallback
                                && quota_stdout.load(Ordering::SeqCst)
                                && !emitted_stdout.load(Ordering::SeqCst);
                            if let Some(res) = val.get("result").filter(|_| !suppress_done) {
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
                                        let _ = emit_tracked(&app_stdout, chunk, &emitted_stdout, &done_stdout);
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
                                let _ = emit_tracked(&app_stdout, chunk, &emitted_stdout, &done_stdout);
                                let map = get_stdin_map();
                                map.lock().await.remove(&stream_id_stdout);
                            }
                        }
                        _ => {}
                    }
                }
            } else {
                if has_fallback && !emitted_stdout.load(Ordering::SeqCst) && is_quota_error(&line) {
                    continue;
                }
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
                let _ = emit_tracked(&app_stdout, chunk, &emitted_stdout, &done_stdout);
            }
        }
        let map = get_stdin_map();
        map.lock().await.remove(&stream_id_stdout);
    });

    // Monitoreo de stderr y terminación
    let app_stderr = app.clone();
    let stream_id_stderr = stream_id.clone();
    let chunk_seq_stderr = Arc::clone(&chunk_seq);
    let quota_stderr = Arc::clone(&quota_hit);
    let emitted_stderr = Arc::clone(&emitted);
    let done_stderr = Arc::clone(&done_emitted);
    let ctx_retry = ctx.clone();
    let model_failed = model.clone();
    tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        let mut err_buffer = String::new();
        while let Ok(Some(line)) = reader.next_line().await {
            err_buffer.push_str(&line);
            err_buffer.push('\n');
        }

        let map = get_stdin_map();
        map.lock().await.remove(&stream_id_stderr);
        get_pid_map().lock().await.remove(&stream_id_stderr);

        let status = child.wait().await;

        // Fallback Chain: cuota agotada sin contenido previo -> mismo prompt con el siguiente modelo
        let quota = quota_stderr.load(Ordering::SeqCst) || is_quota_error(&err_buffer);
        if quota && !emitted_stderr.load(Ordering::SeqCst) && !done_stderr.load(Ordering::SeqCst) {
            if let Some((next, rest)) = remaining.split_first() {
                let notice = AgentStreamChunk {
                    stream_id: stream_id_stderr.clone(),
                    seq: chunk_seq_stderr.fetch_add(1, Ordering::SeqCst),
                    event_type: "delta".into(),
                    content: format!(
                        "> [!WARNING]\n> Cuota agotada en `{}`. Reintentando con `{}`…\n\n",
                        model_failed.as_deref().unwrap_or("modelo activo"),
                        next
                    ),
                    step_type: None,
                    duration_seconds: None,
                    input_tokens: None,
                    output_tokens: None,
                    total_tokens: None,
                };
                let _ = app_stderr.emit("agent-stream", notice);
                if let Err(e) = spawn_attempt(ctx_retry, Some(next.clone()), rest.to_vec()).await {
                    let fail = AgentStreamChunk {
                        stream_id: stream_id_stderr.clone(),
                        seq: chunk_seq_stderr.fetch_add(1, Ordering::SeqCst),
                        event_type: "error".into(),
                        content: e,
                        step_type: None,
                        duration_seconds: None,
                        input_tokens: None,
                        output_tokens: None,
                        total_tokens: None,
                    };
                    let _ = app_stderr.emit("agent-stream", fail);
                }
                return;
            }
        }
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

    Ok(())
    })
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
    pub message_count: Option<u32>,
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
        .prepare(
            "SELECT s.id, s.title, s.context_id, s.effort, s.created_at, s.updated_at, COUNT(m.id) as message_count
             FROM chat_sessions s
             LEFT JOIN chat_messages m ON s.id = m.session_id
             GROUP BY s.id
             ORDER BY s.updated_at DESC"
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            let count: u32 = r.get(6).unwrap_or(0);
            Ok(ChatSession {
                id: r.get(0)?,
                title: r.get(1)?,
                context_id: r.get(2)?,
                effort: r.get(3)?,
                created_at: r.get(4)?,
                updated_at: r.get(5)?,
                message_count: Some(count),
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenUsageTelemetry {
    pub session_tokens: u64,
    pub session_messages: usize,
    pub five_hour_tokens: u64,
    pub five_hour_limit: u64,
    pub five_hour_percent_remaining: f32,
    pub five_hour_resets_in_minutes: u32,
    pub weekly_tokens: u64,
    pub weekly_limit: u64,
    pub weekly_percent_remaining: f32,
    pub weekly_resets_day: String,
}

#[tauri::command]
pub fn sqlite_get_token_usage_telemetry(session_id: Option<String>) -> Result<TokenUsageTelemetry, String> {
    let conn = crate::db::get_db_connection()?;
    let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());

    let weekly_limit = if cfg.token_budget.weekly_limit > 0 {
        cfg.token_budget.weekly_limit
    } else {
        500_000
    };

    let five_hour_limit = if cfg.token_budget.daily_limit > 0 {
        std::cmp::max((cfg.token_budget.daily_limit as f64 * 0.5) as u64, 50_000)
    } else {
        100_000
    };

    // 1. Tokens en la ventana de 5 horas
    let five_hour_tokens: u64 = conn
        .query_row(
            "SELECT COALESCE(SUM(CASE WHEN total_tokens IS NOT NULL AND total_tokens > 0 THEN total_tokens ELSE LENGTH(content) / 4 END), 0)
             FROM chat_messages
             WHERE created_at >= datetime('now', '-5 hours')",
            [],
            |r| {
                let v: i64 = r.get(0)?;
                Ok(v.max(0) as u64)
            },
        )
        .unwrap_or(0);

    let five_hour_resets_in_minutes: u32 = conn
        .query_row(
            "SELECT CAST(MAX(1, 300 - (strftime('%s', 'now') - strftime('%s', created_at)) / 60) AS INTEGER)
             FROM chat_messages
             WHERE created_at >= datetime('now', '-5 hours')
             ORDER BY created_at ASC LIMIT 1",
            [],
            |r| {
                let m: i64 = r.get(0)?;
                Ok(m.max(1) as u32)
            },
        )
        .unwrap_or(300);

    // 2. Tokens en la ventana semanal (7 días)
    let weekly_tokens: u64 = conn
        .query_row(
            "SELECT COALESCE(SUM(CASE WHEN total_tokens IS NOT NULL AND total_tokens > 0 THEN total_tokens ELSE LENGTH(content) / 4 END), 0)
             FROM chat_messages
             WHERE created_at >= datetime('now', '-7 days')",
            [],
            |r| {
                let v: i64 = r.get(0)?;
                Ok(v.max(0) as u64)
            },
        )
        .unwrap_or(0);

    // 3. Tokens de la sesión activa
    let (session_tokens, session_messages): (u64, usize) = if let Some(ref sid) = session_id {
        conn.query_row(
            "SELECT COALESCE(SUM(CASE WHEN total_tokens IS NOT NULL AND total_tokens > 0 THEN total_tokens ELSE LENGTH(content) / 4 END), 0),
                    COUNT(id)
             FROM chat_messages
             WHERE session_id = ?1",
            rusqlite::params![sid],
            |r| {
                let tok: i64 = r.get(0)?;
                let count: i64 = r.get(1)?;
                Ok((tok.max(0) as u64, count.max(0) as usize))
            },
        )
        .unwrap_or((0, 0))
    } else {
        (0, 0)
    };

    let five_hour_percent_remaining = if five_hour_limit > 0 {
        let rem = five_hour_limit.saturating_sub(five_hour_tokens);
        ((rem as f64 / five_hour_limit as f64) * 100.0) as f32
    } else {
        100.0
    };

    let weekly_percent_remaining = if weekly_limit > 0 {
        let rem = weekly_limit.saturating_sub(weekly_tokens);
        ((rem as f64 / weekly_limit as f64) * 100.0) as f32
    } else {
        100.0
    };

    Ok(TokenUsageTelemetry {
        session_tokens,
        session_messages,
        five_hour_tokens,
        five_hour_limit,
        five_hour_percent_remaining,
        five_hour_resets_in_minutes,
        weekly_tokens,
        weekly_limit,
        weekly_percent_remaining,
        weekly_resets_day: "Domingo 00:00".to_string(),
    })
}

#[tauri::command]
pub fn execute_provider_command(command: String) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let cfg = crate::config::get_aegis_config().ok();
    let agent_type = cfg.as_ref().map(|c| c.agent_type.as_str()).unwrap_or("agy");
    let custom_cmd = cfg.as_ref().and_then(|c| c.agent_custom_cmd.clone());

    let agent_binary = match agent_type {
        "claude" | "anthropic" => "claude".to_string(),
        "codex" | "openai" => "codex".to_string(),
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

    let mut cmd = std::process::Command::new(&agent_binary);

    // Ajuste de argumentos según el CLI específico
    if agent_binary.ends_with("codex") {
        if command == "/usage" || command == "usage" || command == "/cost" {
            // Codex usa 'exec' no interactivo
            cmd.arg("exec")
                .arg("--skip-git-repo-check")
                .arg("/cost");
        } else {
            cmd.arg("exec")
                .arg("--skip-git-repo-check")
                .arg(&command);
        }
    } else {
        // agy y claude aceptan -p "<command>"
        cmd.arg("-p").arg(&command);
    }

    let output = cmd
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("Error ejecutando comando en {}: {}", agent_binary, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if !output.status.success() && stdout.trim().is_empty() {
        return Err(if !stderr.trim().is_empty() {
            stderr
        } else {
            format!("Comando falló con status {:?}", output.status)
        });
    }

    // Si es Claude / Anthropic, inyectar metadatos locales de credenciales si están disponibles
    if (agent_type == "claude" || agent_type == "anthropic") && (command == "/cost" || command == "/usage") {
        let cred_file = Path::new(&home).join(".claude/.credentials.json");
        if cred_file.exists() {
            if let Ok(content) = std::fs::read_to_string(&cred_file) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                    let sub_type = val.pointer("/claudeAiOauth/subscriptionType")
                        .and_then(|v| v.as_str())
                        .unwrap_or("pro");
                    let tier = val.pointer("/claudeAiOauth/rateLimitTier")
                        .and_then(|v| v.as_str())
                        .unwrap_or("default");
                    let enriched = format!("{}\nSubscription: {}\nRateLimitTier: {}", stdout, sub_type, tier);
                    return Ok(enriched);
                }
            }
        }
    }

    Ok(if !stdout.trim().is_empty() { stdout } else { stderr })
}


/// Guarda un adjunto (imagen/archivo) en el workspace del contexto y devuelve su ruta absoluta.
#[tauri::command]
pub fn save_attachment(
    context_id: Option<String>,
    name: String,
    data: Vec<u8>,
) -> Result<String, String> {
    const MAX_BYTES: usize = 25 * 1024 * 1024;
    if data.len() > MAX_BYTES {
        return Err("Adjunto excede 25 MB".to_string());
    }
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let ctx = context_id.unwrap_or_else(|| "general".to_string());
    let dir = Path::new(&home)
        .join(".local/share/aegis/contexts")
        .join(&ctx)
        .join("attachments");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    // Sanitiza el nombre: solo el basename, sin separadores ni caracteres de control
    let base = Path::new(&name)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "adjunto".to_string());
    let safe: String = base
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect();
    let stamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    let path = dir.join(format!("{}_{}", stamp, safe));
    std::fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

/// Copia un archivo soltado (ruta nativa) al workspace del contexto. Devuelve (ruta, tamaño).
#[tauri::command]
pub fn import_attachment(
    context_id: Option<String>,
    source_path: String,
) -> Result<(String, u64), String> {
    let src = Path::new(&source_path);
    let meta = std::fs::metadata(src).map_err(|e| e.to_string())?;
    if !meta.is_file() {
        return Err("Solo se admiten archivos".to_string());
    }
    let data = std::fs::read(src).map_err(|e| e.to_string())?;
    let name = src
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "adjunto".to_string());
    let size = data.len() as u64;
    let path = save_attachment(context_id, name, data)?;
    Ok((path, size))
}

/// Lista archivos del workspace (rutas relativas) que coinciden con `query`; base del autocompletado `@file:`.
#[tauri::command]
pub fn list_workspace_files(root: String, query: String) -> Result<Vec<String>, String> {
    const MAX_RESULTS: usize = 30;
    const MAX_SCANNED: usize = 20_000;
    const MAX_DEPTH: usize = 6;
    const SKIP_DIRS: [&str; 5] = ["node_modules", "target", "dist", "build", "__pycache__"];

    let base = Path::new(&root);
    if !base.is_dir() {
        return Err("Directorio de workspace inválido".to_string());
    }
    let needle = query.trim().to_lowercase();
    let mut results = Vec::new();
    let mut scanned = 0usize;
    let mut stack = vec![(base.to_path_buf(), 0usize)];

    while let Some((dir, depth)) = stack.pop() {
        let Ok(entries) = std::fs::read_dir(&dir) else { continue };
        for entry in entries.flatten() {
            scanned += 1;
            if scanned > MAX_SCANNED || results.len() >= MAX_RESULTS {
                return Ok(results);
            }
            let path = entry.path();
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') {
                continue;
            }
            if path.is_dir() {
                if depth < MAX_DEPTH && !SKIP_DIRS.contains(&name.as_str()) {
                    stack.push((path, depth + 1));
                }
                continue;
            }
            let rel = path.strip_prefix(base).unwrap_or(&path).to_string_lossy().to_string();
            if needle.is_empty() || rel.to_lowercase().contains(&needle) {
                results.push(rel);
            }
        }
    }
    results.sort();
    Ok(results)
}

#[cfg(test)]
mod fallback_tests {
    use super::is_quota_error;

    #[test]
    fn detects_quota_errors() {
        assert!(is_quota_error("generating and executing: RESOURCE_EXHAUSTED (code 429): Individual quota reached."));
        assert!(is_quota_error("Error: Too Many Requests"));
        assert!(!is_quota_error("Hola, aquí está tu respuesta"));
    }
}
