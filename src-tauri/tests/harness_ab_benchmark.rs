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

    // 3. Ejecutar Run B (CON HARNESS AEGIS — Prompt Podado ACI + Plan-Then-Act + Nivel Dominante)
    println!("⏳ Ejecutando RUN B (CON Aegis Harness — Poda ACI + Plan-Then-Act + {})...", plan.dominant_effort.to_uppercase());
    let run_b = execute_agy_run(&plan.transformed_prompt, &plan.dominant_effort);

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

fn setup_complex_bench_crate(dir: &std::path::Path) {
    let _ = std::fs::remove_dir_all(dir);
    std::fs::create_dir_all(dir.join("src")).unwrap();
    std::fs::write(
        dir.join("Cargo.toml"),
        "[package]\nname = \"complex_bench\"\nversion = \"0.1.0\"\nedition = \"2021\"\n",
    )
    .unwrap();
    std::fs::write(
        dir.join("src/lib.rs"),
        r#"use std::collections::BinaryHeap;
use std::cmp::Ordering;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Job {
    pub id: u64,
    pub priority: u8,
    pub seq: u64,
}

impl Ord for Job {
    fn cmp(&self, other: &Self) -> Ordering {
        // BUG 1: ordena seq DESC en vez de FIFO (seq ASC) a igual prioridad
        self.priority.cmp(&other.priority).then_with(|| self.seq.cmp(&other.seq))
    }
}
impl PartialOrd for Job {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

pub struct Scheduler {
    queue: BinaryHeap<Job>,
    max_concurrent: usize,
    in_flight: Vec<u64>,
    tokens: u64,
    capacity: u64,
    refill_per_sec: u64,
    last_ts_ms: u64,
    next_seq: u64,
}

impl Scheduler {
    pub fn new(max_concurrent: usize, capacity: u64, refill_per_sec: u64, now_ms: u64) -> Self {
        Self {
            queue: BinaryHeap::new(),
            max_concurrent,
            in_flight: Vec::new(),
            tokens: capacity,
            capacity,
            refill_per_sec,
            last_ts_ms: now_ms,
            next_seq: 0,
        }
    }

    pub fn refill(&mut self, now_ms: u64) {
        // BUG 2: underflow en release / saturación incorrecta si now_ms < last_ts_ms (clock skew)
        // y truncado entero si elapsed < 1000ms pero acumulado debería avanzar
        let elapsed_ms = now_ms - self.last_ts_ms;
        let added = (elapsed_ms / 1000) * self.refill_per_sec;
        self.tokens = (self.tokens + added).min(self.capacity);
        self.last_ts_ms = now_ms;
    }

    pub fn enqueue(&mut self, id: u64, priority: u8) {
        let seq = self.next_seq;
        self.next_seq += 1;
        self.queue.push(Job { id, priority, seq });
    }

    pub fn dispatch(&mut self, now_ms: u64) -> Option<Job> {
        self.refill(now_ms);
        if self.in_flight.len() >= self.max_concurrent || self.tokens == 0 {
            return None;
        }
        let job = self.queue.pop()?;
        self.tokens -= 1;
        self.in_flight.push(job.id);
        Some(job)
    }

    pub fn cancel_or_finish(&mut self, job_id: u64) -> bool {
        // BUG 3: si estaba in_flight no libera el slot correctamente cuando hay duplicados o solo busca en queue
        let before = self.queue.len();
        let kept: Vec<Job> = self.queue.drain().filter(|j| j.id != job_id).collect();
        for j in kept {
            self.queue.push(j);
        }
        self.queue.len() < before
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fifo_tiebreak_on_equal_priority() {
        let mut s = Scheduler::new(4, 10, 1, 1000);
        s.enqueue(10, 5);
        s.enqueue(20, 5);
        s.enqueue(30, 9);
        assert_eq!(s.dispatch(1000).unwrap().id, 30);
        assert_eq!(s.dispatch(1000).unwrap().id, 10);
        assert_eq!(s.dispatch(1000).unwrap().id, 20);
    }

    #[test]
    fn cancel_in_flight_frees_concurrency_slot() {
        let mut s = Scheduler::new(1, 10, 1, 1000);
        s.enqueue(1, 5);
        s.enqueue(2, 5);
        assert_eq!(s.dispatch(1000).unwrap().id, 1);
        assert!(s.dispatch(1000).is_none());
        assert!(s.cancel_or_finish(1));
        assert_eq!(s.dispatch(1000).unwrap().id, 2);
    }

    #[test]
    fn clock_skew_does_not_panic_or_lose_tokens() {
        let mut s = Scheduler::new(2, 5, 2, 5000);
        s.tokens = 1;
        s.refill(3000);
        assert_eq!(s.tokens, 1);
    }
}
"#,
    )
    .unwrap();
}

fn execute_agy_in_dir(dir: &std::path::Path, prompt: &str, effort: &str) -> (RunMetrics, usize) {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let agy_bin = format!("{}/.local/bin/agy", home);

    let start = Instant::now();
    let output = Command::new(&agy_bin)
        .arg("-p")
        .arg(prompt)
        .arg("--output-format")
        .arg("stream-json")
        .arg("--effort")
        .arg(effort)
        .current_dir(dir)
        .output()
        .expect("Failed to execute agy binary");
    let wall_time_secs = start.elapsed().as_secs_f64();

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let mut response_text = String::new();
    let mut input_tokens = 0u64;
    let mut output_tokens = 0u64;
    let mut total_tokens = 0u64;
    let mut tool_calls = 0usize;

    for line in stdout_str.lines() {
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(line) {
            if let Some(ev) = val.get("event").and_then(|e| e.as_str()) {
                if ev == "step_update" {
                    if let Some(su) = val.get("step_update") {
                        if su.get("step_type").and_then(|s| s.as_str()) == Some("tool")
                            && su.get("state").and_then(|s| s.as_str()) == Some("DONE")
                        {
                            tool_calls += 1;
                        }
                        if let Some(delta) = su.get("text_delta").and_then(|d| d.as_str()) {
                            response_text.push_str(delta);
                        }
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

    (
        RunMetrics {
            wall_time_secs,
            prompt_chars: prompt.len(),
            input_tokens,
            output_tokens,
            total_tokens,
            response_text,
        },
        tool_calls,
    )
}

#[test]
#[ignore]
fn benchmark_complex_repo_raw_vs_harness() {
    let raw_dir = std::env::temp_dir().join("aegis_bench_complex_raw");
    let harness_dir = std::env::temp_dir().join("aegis_bench_complex_harness");
    setup_complex_bench_crate(&raw_dir);
    setup_complex_bench_crate(&harness_dir);

    let prompt = "Analiza el crate Rust en este directorio, identifica y corrige todos los bugs de ordenamiento de prioridad, clock skew/overflow y liberación de slots en `src/lib.rs`, agrega además un test para saturación de `capacity` y `enqueue` duplicado si aplica, y asegúrate de que compile sin warnings y pasen todos los tests.";

    let cfg = HarnessConfig::default();
    let plan = build_harness_plan(prompt, harness_dir.to_str(), "caveman", &cfg);

    let (run_a, tools_a) = execute_agy_in_dir(&raw_dir, prompt, "high");
    let (run_b, tools_b) = execute_agy_in_dir(&harness_dir, &plan.transformed_prompt, &plan.dominant_effort);

    let test_a = Command::new("cargo").arg("test").current_dir(&raw_dir).output().unwrap();
    let test_b = Command::new("cargo").arg("test").current_dir(&harness_dir).output().unwrap();

    let warn_a = String::from_utf8_lossy(&test_a.stderr).matches("warning:").count();
    let warn_b = String::from_utf8_lossy(&test_b.stderr).matches("warning:").count();

    println!("\n=======================================================");
    println!("📊 BENCHMARK COMPLEJO EN REPO REAL (1 ITERACIÓN)");
    println!("=======================================================");
    println!("Métrica                | SIN Harness (Raw) | CON Aegis Harness ({})", plan.dominant_effort.to_uppercase());
    println!("-----------------------|-------------------|-------------------------");
    println!("cargo test OK?         | {:>17} | {:>23}", test_a.status.success(), test_b.status.success());
    println!("Warnings               | {:>17} | {:>23}", warn_a, warn_b);
    println!("Tool Calls             | {:>17} | {:>23}", tools_a, tools_b);
    println!("Tiempo Total (s)       | {:>16.2}s | {:>22.2}s", run_a.wall_time_secs, run_b.wall_time_secs);
    println!("Input Tokens           | {:>17} | {:>23}", run_a.input_tokens, run_b.input_tokens);
    println!("Output Tokens          | {:>17} | {:>23}", run_a.output_tokens, run_b.output_tokens);
    println!("Total Tokens           | {:>17} | {:>23}", run_a.total_tokens, run_b.total_tokens);
}
