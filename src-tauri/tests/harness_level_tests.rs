use aegis_lib::harness::{
    binary_supports_effort_flag, build_compact_repo_map, build_harness_plan,
    classify_step_complexity, extract_and_route_steps, needs_auto_heal_escalation,
    resolve_tier_model_for_provider, HarnessConfig, RuntimeProcessState,
};
use std::process::Command;
use std::time::Instant;

#[test]
fn test_01_single_step_l1_detection() {
    let cases = [
        "Lista los archivos de la carpeta actual",
        "Traduce este label al inglés",
        "Genera el mensaje de commit para este cambio",
        "Muestra el status del repositorio",
        "Renombra la variable x a total_count",
        "Resumen corto de 1 línea sobre qué es JSON",
    ];

    for prompt in cases {
        let (level, badge, _) = classify_step_complexity(prompt);
        assert_eq!(
            (level, badge),
            ("low", "L1"),
            "Se esperaba L1 (low) para: {}",
            prompt
        );
    }
}

#[test]
fn test_02_single_step_l2_detection_with_accents() {
    let cases = [
        "Implementa una función en Rust para calcular el IVA",
        "Crea un componente modal en React con validación de estado",
        "Corrige el bug en la lógica del custom hook useSettings",
        "Escribe una prueba unitaria para el endpoint de pagos",
        "Integra la query SQLite para filtrar transacciones por mes",
    ];

    for prompt in cases {
        let (level, badge, _) = classify_step_complexity(prompt);
        assert_eq!(
            (level, badge),
            ("medium", "L2"),
            "Se esperaba L2 (medium) para: {}",
            prompt
        );
    }
}

#[test]
fn test_03_single_step_l3_detection_with_accents() {
    let cases = [
        "Haz una auditoría de seguridad e identifica la vulnerabilidad",
        "Analiza la causa raíz del deadlock en concurrencia asíncrona",
        "Rediseña la arquitectura de sincronización P2P entre nodos",
        "Refactoriza el motor criptográfico para evitar race conditions",
        "Optimiza el benchmark multi-archivo del compilador",
    ];

    for prompt in cases {
        let (level, badge, _) = classify_step_complexity(prompt);
        assert_eq!(
            (level, badge),
            ("high", "L3"),
            "Se esperaba L3 (high) para: {}",
            prompt
        );
    }
}

#[test]
fn test_04_oscillating_steps_l1_l2_l1_l3_l1() {
    let prompt = "\
1. Lista las variables de configuración actuales
2. Implementa una función validadora para el puerto TCP
3. Renombra la constante del puerto por claridad
4. Audita la causa raíz de seguridad y concurrencia en el socket P2P
5. Escribe el mensaje de commit en 1 línea";

    let steps = extract_and_route_steps(prompt);
    let badges: Vec<&str> = steps.iter().map(|s| s.badge.as_str()).collect();
    assert_eq!(
        badges,
        vec!["L1", "L2", "L1", "L3", "L1"],
        "La oscilación paso a paso debe ser exactamente L1 -> L2 -> L1 -> L3 -> L1"
    );

    let cfg = HarnessConfig::default();
    let plan = build_harness_plan(prompt, None, "caveman", &cfg);
    assert_eq!(plan.initial_effort, "low");
    assert_eq!(plan.dominant_effort, "high");
    assert!(plan
        .transformed_prompt
        .contains("Paso 1 [L1] -> Paso 2 [L2] -> Paso 3 [L1] -> Paso 4 [L3] -> Paso 5 [L1]"));
}

#[test]
fn test_05_inline_connectors_splitting() {
    let prompt = "Muestra la versión actual luego implementa la función de validación de tokens y finalmente genera el commit";
    let steps = extract_and_route_steps(prompt);
    let badges: Vec<&str> = steps.iter().map(|s| s.badge.as_str()).collect();
    assert_eq!(badges, vec!["L1", "L2", "L1"]);
}

#[test]
fn test_06_code_block_immunity() {
    let prompt = "\
1. Muestra el estado del módulo
```rust
// 1. Audita la arquitectura de seguridad y concurrencia P2P
// 2. Implementa una función compleja
```
2. Escribe el commit corto";

    let steps = extract_and_route_steps(prompt);
    let badges: Vec<&str> = steps.iter().map(|s| s.badge.as_str()).collect();
    assert_eq!(
        badges,
        vec!["L1", "L1"],
        "Las líneas dentro de bloques ``` no deben contaminar la detección de pasos"
    );
}

#[test]
fn test_07_multi_provider_tier_mapping() {
    for provider in ["deepseek", "anthropic", "openai", "openrouter", "ollama"] {
        let m_low = resolve_tier_model_for_provider(provider, "low", None);
        let m_mid = resolve_tier_model_for_provider(provider, "medium", None);
        let m_high = resolve_tier_model_for_provider(provider, "high", None);
        assert!(m_low.is_some(), "Proveedor {} debe resolver L1", provider);
        assert!(m_mid.is_some(), "Proveedor {} debe resolver L2", provider);
        assert!(m_high.is_some(), "Proveedor {} debe resolver L3", provider);
    }
    assert!(binary_supports_effort_flag("/home/user/.local/bin/agy"));
    assert!(binary_supports_effort_flag("claude"));
    assert!(!binary_supports_effort_flag("ollama"));
}

#[test]
fn test_08_auto_heal_escalation_chain() {
    let broken_output = "Aquí está el código:\n```rust\nfn main() {\n"; // Bloque sin cerrar
    assert_eq!(needs_auto_heal_escalation(broken_output, "low"), Some("medium"));
    assert_eq!(needs_auto_heal_escalation(broken_output, "medium"), Some("high"));
    assert_eq!(needs_auto_heal_escalation(broken_output, "high"), None);

    let clean_output = "```rust\nfn main() {}\n```";
    assert_eq!(needs_auto_heal_escalation(clean_output, "low"), None);
}

#[test]
#[ignore]
fn test_09_live_micro_executions_across_levels() {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/zabrielsa".to_string());
    let agy_bin = format!("{}/.local/bin/agy", home);
    let temp_dir = std::env::temp_dir().join("aegis_harness_micro");
    let _ = std::fs::create_dir_all(&temp_dir);
    let cfg = HarnessConfig::default();

    let micro_cases = [
        (
            "Caso 1 (Puro L1)",
            "Sin usar herramientas: dime en 1 línea cuántos bits tiene un u32 en Rust.",
            vec!["L1"],
            "low",
        ),
        (
            "Caso 2 (Puro L2)",
            "Sin usar herramientas: implementa una función pura en Rust `pub fn clamp_pct(v: u8) -> u8` que limite a 100.",
            vec!["L2"],
            "medium",
        ),
        (
            "Caso 3 (Oscilación L1 -> L3 -> L1)",
            "Sin usar herramientas:\n1. Dime el comando cargo para correr tests.\n2. Audita la causa raíz de seguridad al usar `unsafe { std::slice::from_raw_parts(ptr::null(), 10) }` en Rust (máximo 2 líneas).\n3. Escribe un mensaje de commit en 1 línea.",
            vec!["L1", "L3", "L1"],
            "low",
        ),
    ];

    println!("\n=====================================================================");
    println!("⚡ BATERÍA DE MICRO-TESTS EN VIVO: DETECCIÓN Y EJECUCIÓN POR NIVELES");
    println!("=====================================================================");

    for (name, prompt, expected_badges, expected_initial_effort) in micro_cases {
        let plan = build_harness_plan(prompt, None, "caveman", &cfg);
        let actual_badges: Vec<&str> = plan.steps.iter().map(|s| s.badge.as_str()).collect();
        assert_eq!(actual_badges, expected_badges, "Fallo de ruta en {}", name);
        assert_eq!(plan.initial_effort, expected_initial_effort, "Fallo de effort inicial en {}", name);

        let start = Instant::now();
        let out = Command::new(&agy_bin)
            .arg("-p")
            .arg(&plan.transformed_prompt)
            .arg("--output-format")
            .arg("stream-json")
            .arg("--effort")
            .arg(&plan.initial_effort)
            .current_dir(&temp_dir)
            .output()
            .expect("Fallo ejecutando agy");
        let elapsed = start.elapsed().as_secs_f64();

        let stdout_s = String::from_utf8_lossy(&out.stdout);
        let mut text = String::new();
        let mut out_tokens = 0u64;
        for line in stdout_s.lines() {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
                if v.get("event").and_then(|e| e.as_str()) == Some("step_update") {
                    if let Some(d) = v.get("step_update").and_then(|s| s.get("text_delta")).and_then(|d| d.as_str()) {
                        text.push_str(d);
                    }
                } else if v.get("event").and_then(|e| e.as_str()) == Some("result") {
                    out_tokens = v
                        .get("result")
                        .and_then(|r| r.get("usage"))
                        .and_then(|u| u.get("output_tokens"))
                        .and_then(|t| t.as_u64())
                        .unwrap_or(0);
                }
            }
        }

        println!(
            "\n▶ {} | Ruta Detectada: {:?} | Effort CLI: `{}` | Tiempo: {:.2}s | Output Tokens: {}",
            name, actual_badges, plan.initial_effort, elapsed, out_tokens
        );
        println!("Respuesta:\n{}", text.trim());
        assert!(!text.trim().is_empty(), "Respuesta vacía en {}", name);
    }
}

#[test]
fn test_10_colloquial_non_technical_prompts_l2() {
    let cases = [
        "Oye no jala el botón de guardar",
        "Ponle un filtro para buscar por fecha",
        "Cámbiale esa parte para que no se cierre sola",
        "Se traba cuando abro la ventana de pagos",
        "Haz que guarde los datos cuando le doy enter",
    ];

    for prompt in cases {
        let (level, badge, _) = classify_step_complexity(prompt);
        assert_eq!(
            (level, badge),
            ("medium", "L2"),
            "Se esperaba L2 (medium) para prompt coloquial: {}",
            prompt
        );
    }
}

#[test]
fn test_11_runtime_process_escalator_on_vague_prompt() {
    // Usuario da un prompt totalmente vago ("Oye mira esto") -> Arranca en L1 (low)
    let (init_level, init_badge, _) = classify_step_complexity("Oye mira esto en el proyecto");
    assert_eq!((init_level, init_badge), ("low", "L1"));

    let mut rt = RuntimeProcessState::new(init_level);

    // 1. El agente solo lee un archivo -> Se mantiene en L1
    let ev1 = rt.inspect_tool_action("read_file", r#"{"Path":"src/main.rs"}"#, "fn main() {}");
    assert!(ev1.is_none(), "Una sola lectura debe mantenerse en L1");
    assert_eq!(rt.current_level, "low");

    // 2. El agente decide editar el archivo (sin que el usuario haya escrito "implementa") -> Escala a L2 en vivo
    let ev2 = rt.inspect_tool_action(
        "edit_file",
        r#"{"Path":"src/main.rs","Target":"fn main() {}","Replacement":"fn main() { println!(\"ok\"); }"}"#,
        "Made 1 replacement",
    );
    assert!(ev2.is_some(), "Llamar a edit_file debe escalar el proceso a L2");
    let esc2 = ev2.unwrap();
    assert_eq!(esc2.from_badge, "L1");
    assert_eq!(esc2.to_badge, "L2");
    assert_eq!(rt.current_level, "medium");

    // 3. El agente corre cargo check y sale un error de compilación -> Escala a L3 en vivo
    let ev3 = rt.inspect_tool_action(
        "run_command",
        r#"{"CommandLine":"cargo check"}"#,
        "error[E0308]: mismatched types\n --> src/main.rs:1:1",
    );
    assert!(ev3.is_some(), "Un fallo de compilación en herramienta debe escalar a L3");
    let esc3 = ev3.unwrap();
    assert_eq!(esc3.from_badge, "L2");
    assert_eq!(esc3.to_badge, "L3");
    assert_eq!(rt.current_level, "high");
    assert!(rt.unresolved_tool_error);
}

#[test]
#[ignore]
fn test_12_live_vague_prompt_process_escalation() {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/zabrielsa".to_string());
    let agy_bin = format!("{}/.local/bin/agy", home);
    let temp_dir = std::env::temp_dir().join("aegis_vague_process_test");
    let _ = std::fs::create_dir_all(&temp_dir);
    let buggy_file = temp_dir.join("calc.rs");
    std::fs::write(
        &buggy_file,
        "pub fn discount(price: u32, disc: u32) -> u32 {\n    price - disc\n}\n",
    )
    .expect("No se pudo crear calc.rs");

    // Prompt totalmente vago, sin ningún verbo técnico ("implementa", "corrige", "función", "bug", etc.)
    let vague_prompt = "Oye échale un ojo al archivo calc.rs aquí mismo y déjalo bien en el archivo por si disc es mayor que price.";
    let cfg = HarnessConfig::default();
    let plan = build_harness_plan(
        vague_prompt,
        Some(&temp_dir.to_string_lossy()),
        "caveman",
        &cfg,
    );

    println!("\n=====================================================================");
    println!("🧪 TEST EN VIVO: PROMPT VAGO (L1) -> ESCALADO DE PROCESO EN VIVO (L2)");
    println!("=====================================================================");
    println!("Prompt del usuario: {:?}", vague_prompt);
    println!("Nivel inicial detectado en prompt: {} ({})", plan.steps[0].badge, plan.initial_effort);
    assert_eq!(plan.initial_effort, "low", "El prompt vago debe iniciar en L1 (low)");

    let mut rt = RuntimeProcessState::new(&plan.initial_effort);
    let start = Instant::now();
    let out = Command::new(&agy_bin)
        .arg("-p")
        .arg(&plan.transformed_prompt)
        .arg("--output-format")
        .arg("stream-json")
        .arg("--effort")
        .arg(&plan.initial_effort)
        .current_dir(&temp_dir)
        .output()
        .expect("Fallo ejecutando agy");
    let elapsed = start.elapsed().as_secs_f64();

    let stdout_s = String::from_utf8_lossy(&out.stdout);
    let mut tool_calls_seen = Vec::new();
    let mut escalations_seen = Vec::new();

    for line in stdout_s.lines() {
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
            if v.get("event").and_then(|e| e.as_str()) == Some("step_update") {
                if let Some(step) = v.get("step_update") {
                    if step.get("step_type").and_then(|s| s.as_str()) == Some("tool")
                        && step.get("state").and_then(|s| s.as_str()) == Some("DONE")
                    {
                        if let Some(tinfo) = step.get("tool_info") {
                            let tname = step.get("tool_name").and_then(|n| n.as_str()).unwrap_or("tool");
                            let params = tinfo
                                .get("parameters")
                                .map(|p| p.to_string())
                                .unwrap_or_default();
                            let output = tinfo.get("output").and_then(|o| o.as_str()).unwrap_or("");
                            tool_calls_seen.push(tname.to_string());
                            if let Some(esc) = rt.inspect_tool_action(tname, &params, output) {
                                println!(
                                    "⚡ [Escalado de Proceso en Vivo Detectado]: {} -> {} ({})",
                                    esc.from_badge, esc.to_badge, esc.reason
                                );
                                escalations_seen.push(esc);
                            }
                        }
                    }
                }
            }
        }
    }

    let final_code = std::fs::read_to_string(&buggy_file).unwrap_or_default();
    println!("Herramientas ejecutadas por el agente: {:?}", tool_calls_seen);
    println!("Nivel final del proceso en vivo: {} ({})", RuntimeProcessState::level_to_badge(&rt.current_level), rt.current_level);
    println!("Tiempo total: {:.2}s", elapsed);
    println!("Archivo calc.rs resultante:\n{}", final_code.trim());

    assert!(
        !escalations_seen.is_empty(),
        "El monitor de proceso en vivo debió detectar la edición de archivo y escalar de L1 a L2"
    );
    assert_eq!(rt.current_level, "medium");
    assert!(
        final_code.contains("saturating_sub") || final_code.contains("if ") || final_code.contains("checked_sub"),
        "El archivo calc.rs debió quedar protegido contra underflow"
    );
}

#[test]
fn test_13_ast_repo_map_symbol_extraction() {
    let temp_dir = std::env::temp_dir().join("aegis_ast_repomap_test");
    let src_dir = temp_dir.join("src");
    let _ = std::fs::create_dir_all(&src_dir);

    std::fs::write(
        src_dir.join("math.rs"),
        "pub struct Matrix {\n    pub rows: usize,\n}\n\npub fn multiply(a: i32, b: i32) -> i32 {\n    a * b\n}\n",
    )
    .unwrap();
    std::fs::write(
        src_dir.join("Button.tsx"),
        "export function PrimaryButton({ label }: Props) {\n  return <button>{label}</button>;\n}\n",
    )
    .unwrap();

    let map = build_compact_repo_map(Some(&temp_dir.to_string_lossy())).expect("Debe generar Repo-Map");
    assert!(map.contains("[AST-Signatures]:"), "Debe incluir sección de firmas AST");
    assert!(map.contains("pub struct Matrix"), "Debe extraer struct de Rust");
    assert!(map.contains("pub fn multiply(a: i32, b: i32) -> i32"), "Debe extraer firma de función Rust sin cuerpo");
    assert!(map.contains("export function PrimaryButton"), "Debe extraer componente TSX exportado");
}

#[test]
fn test_14_in_flight_hot_handoff_l1_to_l3() {
    let mut rt = RuntimeProcessState::new("low");
    let esc = rt
        .inspect_tool_action(
            "run_command",
            r#"{"CommandLine":"cargo check"}"#,
            "error[E0502]: cannot borrow `x` as mutable because it is also borrowed as immutable\n --> src/lib.rs:42:9",
        )
        .expect("Debe escalar a L3 al detectar error de borrow checker");

    assert_eq!(esc.from_badge, "L1");
    assert_eq!(esc.to_badge, "L3");
    assert!(
        esc.trigger_hot_handoff,
        "Si arrancó en L1 (low) y chocó con fallo de compilación L3, debe activar Hot-Handoff en caliente"
    );

    let handoff_prompt = rt
        .take_hot_handoff_prompt("Oye revisa por qué no compila el módulo")
        .expect("Debe construir el prompt enriquecido para el proceso L3");
    assert!(handoff_prompt.contains("[AEGIS-HOT-HANDOFF L1 -> L3]:"));
    assert!(handoff_prompt.contains("error[E0502]"));
}
