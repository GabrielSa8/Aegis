use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Stdio;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AgentStreamChunk {
    pub stream_id: String,
    pub event_type: String, // "init", "delta", "step", "done", "error"
    pub content: String,
    pub step_type: Option<String>,
    pub duration_seconds: Option<f64>,
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
    pub total_tokens: Option<u64>,
}

#[tauri::command]
pub async fn execute_agent_prompt(
    app: AppHandle,
    prompt: String,
    context_path: Option<String>,
    stream_id: String,
    effort: Option<String>,
) -> Result<String, String> {
    let agy_path = if Path::new("/home/zabrielsa/.local/bin/agy").exists() {
        "/home/zabrielsa/.local/bin/agy"
    } else {
        "agy"
    };

    let mut cmd = Command::new(agy_path);
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

    if let Some(ref path) = context_path {
        if Path::new(path).exists() {
            cmd.current_dir(path);
        }
    }

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Error iniciando agy ({:?}): {}", agy_path, e))?;

    let stdout = child.stdout.take().ok_or("Fallo al capturar stdout")?;
    let stderr = child.stderr.take().ok_or("Fallo al capturar stderr")?;

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
                            }
                        }
                        _ => {}
                    }
                }
            } else {
                // Si agy devuelve texto plano o advertencia
                let chunk = AgentStreamChunk {
                    stream_id: stream_id_stdout.clone(),
                    event_type: "delta".into(),
                    content: format!("{}\n", line),
                    step_type: None,
                    duration_seconds: None,
                    input_tokens: None,
                    output_tokens: None,
                    total_tokens: None,
                };
                let _ = app_stdout.emit("agent-stream", chunk);
            }
        }
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
