use aegis_lib::harness::{build_harness_plan, HarnessConfig};
use std::process::Command;
use std::time::Instant;

struct RunMetrics {
    wall_time_secs: f64,
    prompt_chars: usize,
    input_tokens: u64,
    output_tokens: u64,
    total_tokens: u64,
    response_text: String,
}

fn execute_agy_run(prompt: &str, effort: &str) -> RunMetrics {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let agy_bin = format!("{}/.local/bin/agy", home);

    // Ejecutar en un directorio limpio temporal sin herramientas innecesarias para medir inferencia pura
    let temp_dir = std::env::temp_dir().join("aegis_harness_bench");
    let _ = std::fs::create_dir_all(&temp_dir);

    let start = Instant::now();
    let output = Command::new(&agy_bin)
        .arg("-p")
        .arg(prompt)
        .arg("--output-format")
        .arg("stream-json")
        .arg("--effort")
        .arg(effort)
        .current_dir(&temp_dir)
        .output()
        .expect("Failed to execute agy binary");
    let wall_time_secs = start.elapsed().as_secs_f64();

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let mut response_text = String::new();
    let mut input_tokens = 0u64;
    let mut output_tokens = 0u64;
    let mut total_tokens = 0u64;

    for line in stdout_str.lines() {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(line) {
            if let Some(ev) = val.get("event").and_then(|e| e.as_str()) {
                if ev == "step_update" {
                    if let Some(delta) = val
                        .get("step_update")
                        .and_then(|s| s.get("text_delta"))
                        .and_then(|d| d.as_str())
                    {
                        response_text.push_str(delta);
                    }
                } else if ev == "result" {
                    if let Some(res) = val.get("result") {
                        if let Some(u) = res.get("usage") {
                            input_tokens = u.get("input_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                            output_tokens = u.get("output_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                            total_tokens = u.get("total_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
                        }
                    }
                }
            }
        }
    }

    RunMetrics {
        wall_time_secs,
        prompt_chars: prompt.len(),
        input_tokens,
        output_tokens,
        total_tokens,
        response_text,
    }
}

#[test]
#[ignore]
fn benchmark_ab_aegis_harness_vs_raw() {
    // Construir un prompt realista multi-nivel (L1 -> L2 -> L3 -> L1) con diff sucio (Cargo.lock) y log largo
    let mut lockfile_noise = String::from("diff --git a/Cargo.lock b/Cargo.lock\nindex 1111111..2222222 100644\n--- a/Cargo.lock\n+++ b/Cargo.lock\n@@ -1,180 +1,180 @@\n");
    for i in 1..=180 {
        lockfile_noise.push_str(&format!(
            "+[[package]]\n+name = \"dep-crate-{}\"\n+version = \"0.4.{}\"\n+checksum = \"a8f9d87e65b4c3a2109876543210fedcba9876543210fedcba9876543210{:04}\"\n",
            i, i, i
        ));
    }

    let mut massive_log = String::new();
    for i in 1..=165 {
        if i == 88 {
            massive_log.push_str("[2026-11-08T15:40:00Z ERROR sync::tcp] panic: Content-Length mismatch: body truncated at 4096 bytes before EOF\n");
        } else {
            massive_log.push_str(&format!(
                "[2026-11-08T15:39:{:02}Z INFO  telemetry::heartbeat] worker_id={} status=IDLE mem_rss_kb=18420 cpu_pct=0.2\n",
                i % 60,
                i
            ));
        }
    }

    let raw_multi_level_prompt = format!(
        "No uses herramientas ni leas archivos externos; responde únicamente con la información de este prompt:\n\
        1. Lista en una sola línea los 3 módulos base que quedan activos en modo mínimo de Aegis (agent, vault, settings).\n\
        2. Implementa una función pura en Rust `pub fn check_budget_state(used: u64, limit: u64, warn_pct: u8) -> &'static str` que devuelva `\"exceeded\"`, `\"warn\"` o `\"ok\"`.\n\
        3. Audita la arquitectura de concurrencia y seguridad de este diff y log de servidor TCP P2P, identifica la causa raíz del bug de truncado y escribe el fix en Rust:\n\
        ```diff\n\
        {}\
        diff --git a/src/sync.rs b/src/sync.rs\n\
        --- a/src/sync.rs\n\
        +++ b/src/sync.rs\n\
        @@ -10,9 +10,9 @@\n\
        pub async fn read_http_post(stream: &mut TcpStream) -> Vec<u8> {{\n\
            let mut buf = [0u8; 4096];\n\
            let n = stream.read(&mut buf).await.unwrap_or(0);\n\
            // BUG: retorna en el primer paquete TCP al ver \\r\\n\\r\\n sin leer Content-Length completo\n\
            buf[..n].to_vec()\n\
        }}\n\
        ```\n\
        Log de ejecución:\n\
        ```\n\
        {}\
        ```\n\
        4. Escribe el mensaje de commit en formato Conventional Commits en 1 sola línea.",
        lockfile_noise, massive_log
    );

    // 1. Generar plan con Aegis Harness Activo
    let harness_cfg = HarnessConfig::default();
    let current_dir = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
    let plan = build_harness_plan(
        &raw_multi_level_prompt,
        current_dir.to_str(),
        "caveman",
        &harness_cfg,
    );

    println!("\n=======================================================");
    println!("🧪 PRE-ANÁLISIS DEL AEGIS HARNESS (RUST NATIVO)");
    println!("=======================================================");
    println!("Pasos detectados ({}):", plan.steps.len());
    for s in &plan.steps {
        println!("  • Paso {} [{}] ({}): {}", s.step_number, s.badge, s.reason, s.label);
    }
    println!("Caracteres Prompt Crudo : {} chars (~{} tokens)", raw_multi_level_prompt.len(), plan.original_tokens_est);
    println!("Caracteres Prompt Podado: {} chars (~{} tokens)", plan.transformed_prompt.len(), plan.pruned_tokens_est);
    println!("Archivos Lockfile Podados: {}", plan.pruned_files_count);
    println!("Reducción Estimada Pre-LLM: -{}% ({} tokens ahorrados)", plan.reduction_percent, plan.tokens_saved);

    // 2. Ejecutar Run A (SIN HARNESS - Modo Estándar / Manual Profundo como haría el usuario para no fallar la tarea 3)
    println!("\n⏳ Ejecutando RUN A (SIN Harness — Prompt Crudo + Nivel Fijo High)...");
    let run_a = execute_agy_run(&raw_multi_level_prompt, "high");

    // 3. Ejecutar Run B (CON HARNESS AEGIS — Prompt Podado ACI + Escalado Dinámico por Paso)
    println!("⏳ Ejecutando RUN B (CON Aegis Harness — Poda ACI + Ruta L1⇄L2⇄L3)...");
    let run_b = execute_agy_run(&plan.transformed_prompt, &plan.initial_effort);

    println!("\n=======================================================");
    println!("📊 RESULTADOS COMPARATIVOS A/B (REAL EXECUTION)");
    println!("=======================================================");
    println!(
        "Métrica                | SIN Harness (Raw) | CON Aegis Harness | Diferencia"
    );
    println!("-----------------------|-------------------|-------------------|-------------------");
    println!(
        "Tiempo Total (s)       | {:>15.2}s | {:>15.2}s | {:>+.2}s ({:+.1}%)",
        run_a.wall_time_secs,
        run_b.wall_time_secs,
        run_b.wall_time_secs - run_a.wall_time_secs,
        ((run_b.wall_time_secs - run_a.wall_time_secs) / run_a.wall_time_secs) * 100.0
    );
    println!(
        "Tamaño Payload (chars) | {:>16} | {:>16} | {:>+} ({:+.1}%)",
        run_a.prompt_chars,
        run_b.prompt_chars,
        run_b.prompt_chars as isize - run_a.prompt_chars as isize,
        ((run_b.prompt_chars as f64 - run_a.prompt_chars as f64) / run_a.prompt_chars as f64) * 100.0
    );
    println!(
        "Input Tokens (LLM)     | {:>16} | {:>16} | {:>+}",
        run_a.input_tokens,
        run_b.input_tokens,
        run_b.input_tokens as i64 - run_a.input_tokens as i64
    );
    println!(
        "Output Tokens (LLM)    | {:>16} | {:>16} | {:>+} ({:+.1}%)",
        run_a.output_tokens,
        run_b.output_tokens,
        run_b.output_tokens as i64 - run_a.output_tokens as i64,
        if run_a.output_tokens > 0 {
            ((run_b.output_tokens as f64 - run_a.output_tokens as f64) / run_a.output_tokens as f64) * 100.0
        } else {
            0.0
        }
    );
    println!(
        "Total Tokens (LLM)     | {:>16} | {:>16} | {:>+}",
        run_a.total_tokens,
        run_b.total_tokens,
        run_b.total_tokens as i64 - run_a.total_tokens as i64
    );
    println!(
        "Longitud Output (chars)| {:>16} | {:>16} | {:>+} ({:+.1}%)",
        run_a.response_text.len(),
        run_b.response_text.len(),
        run_b.response_text.len() as isize - run_a.response_text.len() as isize,
        ((run_b.response_text.len() as f64 - run_a.response_text.len() as f64) / run_a.response_text.len().max(1) as f64) * 100.0
    );

    println!("\n--- [OUTPUT RUN A: SIN HARNESS] ---\n{}\n", run_a.response_text);
    println!("\n--- [OUTPUT RUN B: CON AEGIS HARNESS] ---\n{}\n", run_b.response_text);
}
