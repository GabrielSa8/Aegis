use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HarnessConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_true")]
    pub dynamic_step_scaling: bool,
    #[serde(default = "default_true")]
    pub aci_context_pruning: bool,
    #[serde(default = "default_true")]
    pub enforce_surgical_edits: bool,
    #[serde(default = "default_true")]
    pub auto_heal_escalation: bool,
}

fn default_true() -> bool {
    true
}

impl Default for HarnessConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            dynamic_step_scaling: true,
            aci_context_pruning: true,
            enforce_surgical_edits: true,
            auto_heal_escalation: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HarnessStep {
    pub step_number: usize,
    pub label: String,
    pub level: String, // "low" (L1), "medium" (L2), "high" (L3)
    pub badge: String, // "L1", "L2", "L3"
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HarnessPlan {
    pub active: bool,
    pub initial_effort: String, // "low", "medium", "high"
    pub dominant_effort: String,
    pub steps: Vec<HarnessStep>,
    pub original_tokens_est: usize,
    pub pruned_tokens_est: usize,
    pub tokens_saved: usize,
    pub reduction_percent: u8,
    pub pruned_files_count: usize,
    pub cache_aligned: bool,
    pub transformed_prompt: String,
}

const NOISY_LOCKFILES: &[&str] = &[
    "Cargo.lock",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "bun.lockb",
    "composer.lock",
    "poetry.lock",
    ".min.js",
    ".min.css",
    "node_modules/",
    "dist/",
    "target/debug/",
    "target/release/",
];

/// Pilar 1: Poda ACI de diffs Git y truncado inteligente de logs masivos (`[Head + Error + Tail]`).
pub fn prune_aci_context(raw: &str) -> (String, usize) {
    let mut pruned_files = 0usize;
    let mut out = String::with_capacity(raw.len());

    // 1. Filtrar secciones de diff de lockfiles o artefactos compilados
    let mut skipping_diff_file = false;
    let mut current_chunk: Vec<&str> = Vec::new();

    for line in raw.lines() {
        if line.starts_with("diff --git ") {
            if !current_chunk.is_empty() {
                append_truncated_chunk(&mut out, &current_chunk);
                current_chunk.clear();
            }
            skipping_diff_file = NOISY_LOCKFILES.iter().any(|lock| line.contains(lock));
            if skipping_diff_file {
                pruned_files += 1;
                out.push_str(&format!(
                    "// [⚡ ACI Harness: Omitido diff de archivo autogenerado/lockfile: {}]\n",
                    line
                ));
                continue;
            }
        } else if skipping_diff_file {
            // Salir del modo skip si termina el bloque diff (ej. cierre de bloque ``` o texto normal fuera de diff)
            let is_diff_line = line.starts_with("index ")
                || line.starts_with("--- ")
                || line.starts_with("+++ ")
                || line.starts_with("@@ ")
                || line.starts_with('+')
                || line.starts_with('-')
                || line.starts_with("Binary files ");
            if !is_diff_line {
                skipping_diff_file = false;
            }
        }
        if !skipping_diff_file {
            current_chunk.push(line);
        }
    }
    if !current_chunk.is_empty() {
        append_truncated_chunk(&mut out, &current_chunk);
    }

    (out.trim().to_string(), pruned_files)
}

fn append_truncated_chunk(out: &mut String, lines: &[&str]) {
    const MAX_CHUNK_LINES: usize = 140;
    const HEAD_LINES: usize = 45;
    const TAIL_LINES: usize = 45;

    if lines.len() <= MAX_CHUNK_LINES {
        for l in lines {
            out.push_str(l);
            out.push('\n');
        }
        return;
    }

    for l in &lines[..HEAD_LINES] {
        out.push_str(l);
        out.push('\n');
    }

    let middle = &lines[HEAD_LINES..lines.len() - TAIL_LINES];
    let error_lines: Vec<&&str> = middle
        .iter()
        .filter(|l| {
            let lower = l.to_ascii_lowercase();
            lower.contains("error")
                || lower.contains("panic")
                || lower.contains("failed")
                || lower.contains("exception")
                || lower.contains("warn")
        })
        .take(12)
        .collect();

    out.push_str(&format!(
        "\n... [⚡ ACI Harness: {} líneas intermedias podadas para preservar ventana de contexto] ...\n",
        middle.len()
    ));
    for el in error_lines {
        out.push_str("[ACI-SIGNAL] ");
        out.push_str(el);
        out.push('\n');
    }
    out.push('\n');

    for l in &lines[lines.len() - TAIL_LINES..] {
        out.push_str(l);
        out.push('\n');
    }
}

/// Extrae firmas AST ligeras (`pub fn`, `pub struct`, `export function`, `def`, `class`) de un archivo fuente en <1ms.
pub fn extract_file_ast_signatures(file_path: &Path, max_symbols: usize) -> Vec<String> {
    let ext = file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");
    if !matches!(ext, "rs" | "ts" | "tsx" | "js" | "jsx" | "py" | "go" | "kt") {
        return Vec::new();
    }
    let content = match std::fs::read_to_string(file_path) {
        Ok(c) => c,
        Err(_) => return Vec::new(),
    };

    let mut symbols = Vec::new();
    for line in content.lines().take(260) {
        let trimmed = line.trim();
        let is_sig = trimmed.starts_with("pub fn ")
            || trimmed.starts_with("pub async fn ")
            || trimmed.starts_with("pub struct ")
            || trimmed.starts_with("pub enum ")
            || trimmed.starts_with("fn ")
            || trimmed.starts_with("export function ")
            || trimmed.starts_with("export async function ")
            || trimmed.starts_with("export default function ")
            || trimmed.starts_with("export class ")
            || trimmed.starts_with("def ")
            || trimmed.starts_with("async def ")
            || trimmed.starts_with("class ")
            || trimmed.starts_with("func ");

        if is_sig {
            let clean = trimmed
                .split('{')
                .next()
                .unwrap_or(trimmed)
                .trim_end_matches(':')
                .trim();
            let capped: String = clean.chars().take(72).collect();
            if !capped.is_empty() {
                symbols.push(capped);
                if symbols.len() >= max_symbols {
                    break;
                }
            }
        }
    }
    symbols
}

/// Pilar 1b: Mapa compacto de repositorio con firmas AST clave (estilo Aider Repo-Map en <3ms).
pub fn build_compact_repo_map(context_path: Option<&str>) -> Option<String> {
    let path_str = context_path?.trim();
    if path_str.is_empty() {
        return None;
    }
    let root = Path::new(path_str);
    if !root.exists() || !root.is_dir() {
        return None;
    }

    let mut entries_summary = Vec::new();
    let mut candidate_files = Vec::new();

    if let Ok(entries) = std::fs::read_dir(root) {
        for entry in entries.flatten().take(28) {
            let name = entry.file_name().to_string_lossy().to_string();
            if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" {
                continue;
            }
            let p = entry.path();
            if p.is_dir() {
                entries_summary.push(format!("{}/", name));
            } else {
                entries_summary.push(name);
                candidate_files.push(p);
            }
        }
    }

    // Explorar hasta 1 nivel en subdirectorios clave de código fuente (src, src-tauri/src, backend, lib)
    for subdir in ["src", "src-tauri/src", "backend", "lib"] {
        let sub_path = root.join(subdir);
        if sub_path.is_dir() {
            if let Ok(sub_entries) = std::fs::read_dir(&sub_path) {
                for entry in sub_entries.flatten().take(12) {
                    let p = entry.path();
                    if p.is_file() {
                        candidate_files.push(p);
                    }
                }
            }
        }
    }

    if entries_summary.is_empty() {
        return None;
    }
    entries_summary.sort();

    let mut ast_summaries = Vec::new();
    for file_path in candidate_files.into_iter().take(8) {
        let sigs = extract_file_ast_signatures(&file_path, 3);
        if !sigs.is_empty() {
            let rel = file_path
                .strip_prefix(root)
                .unwrap_or(&file_path)
                .to_string_lossy();
            ast_summaries.push(format!("{} -> [{}]", rel, sigs.join(" | ")));
        }
    }

    let mut map_out = format!(
        "[Repo-Map `{}`]: {}",
        root.file_name().unwrap_or_default().to_string_lossy(),
        entries_summary.join(", ")
    );
    if !ast_summaries.is_empty() {
        map_out.push_str("\n[AST-Signatures]: ");
        map_out.push_str(&ast_summaries.join(" ; "));
    }
    Some(map_out)
}

fn normalize_accents_lower(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'á' | 'Á' | 'à' | 'ä' => 'a',
            'é' | 'É' | 'è' | 'ë' => 'e',
            'í' | 'Í' | 'ì' | 'ï' => 'i',
            'ó' | 'Ó' | 'ò' | 'ö' => 'o',
            'ú' | 'Ú' | 'ù' | 'ü' => 'u',
            _ => c.to_ascii_lowercase(),
        })
        .collect()
}

/// Pilar 3: Clasificación de nivel por paso individual (`L1 ⇄ L2 ⇄ L3`).
pub fn classify_step_complexity(step_text: &str) -> (&'static str, &'static str, &'static str) {
    let lower = normalize_accents_lower(step_text);
    let len = step_text.chars().count();

    let high_keywords = [
        "arquitectura", "architecture", "refactor", "seguridad", "security", "concurrencia",
        "deadlock", "race condition", "optimiza", "migra", "cripto", "p2p", "benchmark",
        "causa raiz", "root cause", "multi-archivo", "rediseñ", "auditoria", "audita",
        "vulnerabilidad", "escalabilidad", "sincronizacion",
    ];
    let build_or_fix_verbs = [
        "implementa", "crea ", "construye", "corrige", "fix", "integra", "valida", "calcula",
        "desarrolla", "programa", "codifica", "agrega una funcion", "escribe una funcion",
        "escribe una prueba", "escribe un test", "arregla", "repara", "compon", "soluciona",
        "ponle", "quitale", "cambiale", "modificale", "agregale", "haz que ", "hacer que ",
        "no sirve", "no funciona", "no jala", "no anda", "se traba", "se rompe", "se cierra",
        "no carga", "no guarda", "sale error", "me da error", "tiene un fallo",
    ];
    let medium_keywords = [
        "implementa", "crea ", "construye", "componente", "endpoint", "test", "prueba",
        "funcion", "hook", "sql", "query", "corrige", "fix", "bug", "integra",
        "logica", "modal", "valida", "calcula", "handler", "arregla", "repara", "soluciona",
        "ponle", "quitale", "cambiale", "modificale", "agregale", "haz que ", "hacer que ",
        "no sirve", "no funciona", "no jala", "no anda", "se traba", "se rompe", "se cierra",
        "no carga", "no guarda", "sale error", "me da error", "tiene un fallo", "esta roto",
    ];
    let low_action_keywords = [
        "lista", "muestra", "lee ", "formato", "traduce", "renombra",
        "explica brevemente", "resumen", "resume", "commit", "imprime", "dime ", "que es ",
        "cual es ",
    ];

    if high_keywords.iter().any(|k| lower.contains(k)) || len > 550 {
        ("high", "L3", "Arquitectura / Alta complejidad")
    } else if low_action_keywords.iter().any(|k| lower.contains(k))
        && !build_or_fix_verbs.iter().any(|v| lower.contains(v))
        && len <= 160
    {
        ("low", "L1", "Operación directa / Baja complejidad")
    } else if medium_keywords.iter().any(|k| lower.contains(k)) || len > 160 {
        ("medium", "L2", "Lógica e implementación modular")
    } else {
        ("low", "L1", "Operación directa / Baja complejidad")
    }
}

/// Descompone un prompt en pasos secuenciales y asigna nivel dinámico a cada uno (`L1 ⇄ L2 ⇄ L3`).
pub fn extract_and_route_steps(prompt: &str) -> Vec<HarnessStep> {
    let mut raw_segments: Vec<String> = Vec::new();
    let mut in_code_block = false;

    // Detectar listas numeradas, viñetas o conectores secuenciales fuera de bloques de código
    for line in prompt.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("```") {
            in_code_block = !in_code_block;
            continue;
        }
        if in_code_block || trimmed.is_empty() {
            continue;
        }
        if trimmed.len() > 6
            && (trimmed.starts_with("- ")
                || trimmed.starts_with("* ")
                || (trimmed.chars().next().map_or(false, |c| c.is_ascii_digit())
                    && (trimmed.contains(". ") || trimmed.contains(") "))))
        {
            raw_segments.push(trimmed.to_string());
        }
    }

    if raw_segments.is_empty() {
        // Separar por conectores secuenciales explícitos si es un párrafo compuesto
        let connectors = [" luego ", " después ", " despues ", " finalmente ", " y luego ", "; luego "];
        let mut working = prompt.to_string();
        for conn in connectors {
            working = working.replace(conn, "\n__STEP_SPLIT__\n");
        }
        for part in working.split("\n__STEP_SPLIT__\n") {
            let p = part.trim();
            if !p.is_empty() {
                raw_segments.push(p.to_string());
            }
        }
    }

    if raw_segments.is_empty() {
        raw_segments.push(prompt.trim().to_string());
    }

    raw_segments
        .into_iter()
        .take(6)
        .enumerate()
        .map(|(idx, seg)| {
            let (level, badge, reason) = classify_step_complexity(&seg);
            let clean_label: String = seg.chars().take(68).collect();
            HarnessStep {
                step_number: idx + 1,
                label: if seg.chars().count() > 68 {
                    format!("{}…", clean_label)
                } else {
                    clean_label
                },
                level: level.to_string(),
                badge: badge.to_string(),
                reason: reason.to_string(),
            }
        })
        .collect()
}

/// Construye el plan completo del Harness aplicando los 6 pilares.
pub fn build_harness_plan(
    prompt: &str,
    context_path: Option<&str>,
    response_style: &str,
    cfg: &HarnessConfig,
) -> HarnessPlan {
    let orig_tokens = (prompt.len() / 4).max(1);

    if !cfg.enabled {
        return HarnessPlan {
            active: false,
            initial_effort: "low".to_string(),
            dominant_effort: "low".to_string(),
            steps: vec![],
            original_tokens_est: orig_tokens,
            pruned_tokens_est: orig_tokens,
            tokens_saved: 0,
            reduction_percent: 0,
            pruned_files_count: 0,
            cache_aligned: false,
            transformed_prompt: prompt.to_string(),
        };
    }

    let (pruned_body, pruned_files_count) = if cfg.aci_context_pruning {
        prune_aci_context(prompt)
    } else {
        (prompt.to_string(), 0)
    };

    let steps = extract_and_route_steps(&pruned_body);
    let initial_effort = steps
        .first()
        .map(|s| s.level.clone())
        .unwrap_or_else(|| "low".to_string());

    let dominant_effort = if steps.iter().any(|s| s.level == "high") {
        "high".to_string()
    } else if steps.iter().any(|s| s.level == "medium") {
        "medium".to_string()
    } else {
        "low".to_string()
    };

    // Pilar 2 & 4: Prefijo estático alineado para KV-Cache + Contrato de edición quirúrgica
    let mut static_prefix = String::from("[AEGIS-HARNESS-STATIC-CONTRACT]\n");
    if response_style == "caveman" {
        static_prefix.push_str("- Estilo: Directo al código/solución. Cero saludos, preámbulos o relleno.\n");
    }
    if cfg.enforce_surgical_edits {
        static_prefix.push_str("- Edición Quirúrgica: Modifica únicamente los bloques afectados; no reescribas archivos completos innecesariamente.\n");
    }
    if let Some(repo_map) = build_compact_repo_map(context_path) {
        static_prefix.push_str(&format!("{}\n", repo_map));
    }

    let step_routing_header = if cfg.dynamic_step_scaling && !steps.is_empty() {
        let route_str = steps
            .iter()
            .map(|s| format!("Paso {} [{}]", s.step_number, s.badge))
            .collect::<Vec<_>>()
            .join(" -> ");
        format!(
            "[Escalado Dinámico por Paso: {}]\n- En pasos [L1]: respuesta directa inmediata (0 explicación).\n- En pasos [L2]: código/solución limpia y concisa.\n- En pasos [L3]: análisis de causa raíz + fix quirúrgico exacto.\n- Escalado de Proceso en Vivo: Si el prompt es ambiguo [L1] pero durante la inspección requiere editar código, implementar lógica o corregir un fallo, escala automáticamente tu ejecución en vivo a [L2] (implementación quirúrgica) o [L3] (causa raíz + fix).\n",
            route_str
        )
    } else {
        String::new()
    };

    let transformed_prompt = format!("{}{}\n{}", static_prefix, step_routing_header, pruned_body);
    let pruned_tokens = (pruned_body.len() / 4).max(1);
    let style_savings = if response_style == "caveman" {
        (pruned_tokens as f32 * 0.25) as usize
    } else {
        0
    };
    let raw_saved = orig_tokens.saturating_sub(pruned_tokens) + style_savings;
    let reduction_percent = ((raw_saved as f32 / orig_tokens as f32) * 100.0)
        .round()
        .clamp(0.0, 85.0) as u8;

    HarnessPlan {
        active: true,
        initial_effort,
        dominant_effort,
        steps,
        original_tokens_est: orig_tokens,
        pruned_tokens_est: pruned_tokens,
        tokens_saved: raw_saved,
        reduction_percent,
        pruned_files_count,
        cache_aligned: true,
        transformed_prompt,
    }
}

/// Estado en tiempo real del proceso para detectar escalado de complejidad (`L1 -> L2 -> L3`)
/// basado en las herramientas ejecutadas y el razonamiento del agente aunque el prompt inicial sea vago.
#[derive(Debug, Clone)]
pub struct RuntimeProcessState {
    pub initial_level: String,
    pub current_level: String,
    pub files_read_count: usize,
    pub files_edited_count: usize,
    pub commands_run_count: usize,
    pub unresolved_tool_error: bool,
    pub hot_handoff_context: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RuntimeEscalationEvent {
    pub from_badge: String,
    pub to_level: String,
    pub to_badge: String,
    pub reason: String,
    pub trigger_hot_handoff: bool,
}

impl RuntimeProcessState {
    pub fn new(initial_level: &str) -> Self {
        let lvl = match initial_level {
            "high" => "high",
            "medium" => "medium",
            _ => "low",
        };
        Self {
            initial_level: lvl.to_string(),
            current_level: lvl.to_string(),
            files_read_count: 0,
            files_edited_count: 0,
            commands_run_count: 0,
            unresolved_tool_error: false,
            hot_handoff_context: None,
        }
    }

    pub fn level_to_badge(level: &str) -> &'static str {
        match level {
            "high" => "L3",
            "medium" => "L2",
            _ => "L1",
        }
    }

    fn rank(level: &str) -> u8 {
        match level {
            "high" => 3,
            "medium" => 2,
            _ => 1,
        }
    }

    fn escalate_to(
        &mut self,
        target_level: &str,
        reason: &str,
        trigger_hot_handoff: bool,
    ) -> Option<RuntimeEscalationEvent> {
        if Self::rank(target_level) <= Self::rank(&self.current_level) {
            return None;
        }
        let from_badge = Self::level_to_badge(&self.current_level).to_string();
        self.current_level = target_level.to_string();
        let to_badge = Self::level_to_badge(target_level).to_string();
        Some(RuntimeEscalationEvent {
            from_badge,
            to_level: target_level.to_string(),
            to_badge,
            reason: reason.to_string(),
            trigger_hot_handoff,
        })
    }

    /// Construye el prompt enriquecido para Hot-Handoff (`L1 -> L3`) inyectando el error exacto capturado en la herramienta.
    pub fn take_hot_handoff_prompt(&mut self, original_prompt: &str) -> Option<String> {
        let err_ctx = self.hot_handoff_context.take()?;
        Some(format!(
            "{}\n\n[AEGIS-HOT-HANDOFF L1 -> L3]:\nEl proceso rápido inicial (L1) encontró el siguiente fallo crítico de compilación/ejecución en herramienta. Analiza la causa raíz y resuélvelo directamente en modo profundo [L3]:\n{}",
            original_prompt, err_ctx
        ))
    }

    /// Inspecciona en tiempo real una herramienta ejecutada por el agente (`tool_name`, `params`, `output`).
    /// Si el usuario dio un prompt vago (`L1`) pero el agente comienza a editar código o ejecutar comandos,
    /// sube automáticamente el estado del proceso a `L2` o `L3`.
    pub fn inspect_tool_action(
        &mut self,
        tool_name: &str,
        params_str: &str,
        output_str: &str,
    ) -> Option<RuntimeEscalationEvent> {
        let tool_lower = tool_name.to_ascii_lowercase();
        let params_lower = params_str.to_ascii_lowercase();
        let output_lower = output_str.to_ascii_lowercase();

        let is_edit_tool = tool_lower.contains("edit")
            || tool_lower.contains("write")
            || tool_lower.contains("replace")
            || tool_lower.contains("patch")
            || tool_lower.contains("create_file");

        let is_cmd_tool = tool_lower.contains("run_command")
            || tool_lower.contains("bash")
            || tool_lower.contains("shell")
            || tool_lower.contains("terminal")
            || tool_lower.contains("exec");

        let is_read_tool = tool_lower.contains("read")
            || tool_lower.contains("view")
            || tool_lower.contains("grep")
            || tool_lower.contains("search")
            || tool_lower.contains("find")
            || tool_lower.contains("list");

        if is_edit_tool {
            self.files_edited_count += 1;
        }
        if is_cmd_tool {
            self.commands_run_count += 1;
        }
        if is_read_tool {
            self.files_read_count += 1;
        }

        // 1. Detectar error de compilación/test/ejecución en salida de herramienta -> L3 + Hot-Handoff si arrancó en L1 (low)
        let has_tool_failure = (is_cmd_tool || is_edit_tool)
            && (output_lower.contains("error[")
                || output_lower.contains("error:")
                || output_lower.contains("failed")
                || output_lower.contains("panic")
                || output_lower.contains("syntaxerror")
                || output_lower.contains("traceback")
                || output_lower.contains("command failed")
                || output_lower.contains("exit code 1")
                || output_lower.contains("exit status: 1"));

        if has_tool_failure {
            self.unresolved_tool_error = true;
            let should_handoff = self.initial_level == "low" && self.hot_handoff_context.is_none();
            if should_handoff {
                let err_excerpt: String = output_str
                    .lines()
                    .take(12)
                    .collect::<Vec<_>>()
                    .join("\n");
                self.hot_handoff_context = Some(format!(
                    "- Herramienta: `{}`\n- Parámetros: `{}`\n- Diagnóstico `[ACI-SIGNAL]`:\n```\n{}\n```",
                    tool_name,
                    params_str.chars().take(160).collect::<String>(),
                    err_excerpt
                ));
            }
            return self.escalate_to(
                "high",
                "Fallo o error de compilación detectado en ejecución de herramienta",
                should_handoff,
            );
        } else if is_cmd_tool && self.unresolved_tool_error {
            self.unresolved_tool_error = false;
        }

        // 2. Orquestación de subagentes o edición multi-archivo (>= 3 ediciones) -> L3
        if tool_lower.contains("subagent") {
            return self.escalate_to(
                "high",
                "Orquestación de subagente activada en el proceso",
                false,
            );
        }
        if self.files_edited_count >= 3 {
            return self.escalate_to(
                "high",
                "Implementación multi-archivo detectada en vivo (>= 3 ediciones)",
                false,
            );
        }

        // 3. Herramienta de edición/escritura de código -> L2 (aunque el prompt haya sido vago L1)
        if is_edit_tool {
            return self.escalate_to(
                "medium",
                &format!("Agente inició implementación en vivo (`{}`)", tool_name),
                false,
            );
        }

        // 4. Ejecución de comando de build/test/modificación -> L2
        if is_cmd_tool {
            let is_build_or_test = params_lower.contains("cargo")
                || params_lower.contains("npm")
                || params_lower.contains("pnpm")
                || params_lower.contains("pytest")
                || params_lower.contains("vitest")
                || params_lower.contains("jest")
                || params_lower.contains("tsc")
                || params_lower.contains("build")
                || params_lower.contains("test");
            if is_build_or_test {
                return self.escalate_to(
                    "medium",
                    "Agente ejecutó comando de compilación/pruebas en vivo",
                    false,
                );
            }
        }

        // 5. Investigación extensa (>= 4 lecturas/búsquedas) en prompt ambiguo -> L2
        if self.files_read_count >= 4 {
            return self.escalate_to(
                "medium",
                "Inspección multi-archivo detectada en proceso (>= 4 lecturas)",
                false,
            );
        }

        None
    }

    /// Inspecciona el razonamiento interno (`<thought>`) del agente en tiempo real.
    /// Si el agente decide implementar o corregir un bug a partir de un prompt vago, sube a `L2` o `L3` antes de editar.
    pub fn inspect_thought_action(&mut self, thought: &str) -> Option<RuntimeEscalationEvent> {
        let lower = normalize_accents_lower(thought);

        let deep_signals = [
            "causa raiz", "root cause", "race condition", "deadlock",
            "vulnerabilidad", "rediseñar", "refactorizar la arquitectura",
        ];
        if deep_signals.iter().any(|s| lower.contains(s)) {
            return self.escalate_to(
                "high",
                "Razonamiento del agente identificó problema de causa raíz/arquitectura",
                false,
            );
        }

        let impl_signals = [
            "voy a implementar", "voy a editar", "voy a modificar", "necesito editar",
            "necesito modificar", "procedo a editar", "vamos a corregir", "vamos a implementar",
            "i will implement", "i will edit", "i will modify", "let's edit", "let's fix",
            "let's implement", "need to edit", "need to modify", "usare edit_file", "usare write_file",
        ];
        if impl_signals.iter().any(|s| lower.contains(s)) {
            return self.escalate_to(
                "medium",
                "Razonamiento del agente decidió iniciar implementación/edición de código",
                false,
            );
        }

        None
    }
}

/// Pilar 5 & 6: Verificador determinista post-respuesta y criterio de escalado Auto-Heal.
pub fn needs_auto_heal_escalation(output: &str, current_effort: &str) -> Option<&'static str> {
    if current_effort == "high" {
        return None;
    }
    let fence_count = output.matches("```").count();
    let has_unclosed_code_fence = fence_count % 2 != 0;
    let lower = output.to_ascii_lowercase();
    let has_syntax_panic = lower.contains("syntaxerror:")
        || lower.contains("referenceerror:")
        || lower.contains("unexpected end of json input");

    if has_unclosed_code_fence || has_syntax_panic {
        Some(if current_effort == "low" { "medium" } else { "high" })
    } else {
        None
    }
}

/// Indica si el binario CLI soporta el flag nativo `--effort`.
pub fn binary_supports_effort_flag(agent_binary: &str) -> bool {
    let bin = Path::new(agent_binary)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or(agent_binary);
    matches!(bin, "agy" | "claude" | "codex")
}

/// Resuelve dinámicamente el modelo óptimo del proveedor activo según el nivel detectado (`low`/`medium`/`high`)
/// cuando el usuario no fijó manualmente un modelo específico.
pub fn resolve_tier_model_for_provider(
    agent_type: &str,
    effort_level: &str,
    explicit_model: Option<&str>,
) -> Option<String> {
    if let Some(m) = explicit_model {
        let trimmed = m.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }

    let target_tier = match effort_level {
        "high" => "deep",
        "medium" => "balanced",
        _ => "flash",
    };

    let catalog = crate::ai_providers::get_all_providers_catalog();
    let provider = catalog.into_iter().find(|p| p.id == agent_type)?;
    provider
        .models
        .iter()
        .find(|m| m.tier == target_tier)
        .or_else(|| provider.models.first())
        .map(|m| m.id.clone())
}

#[tauri::command]
pub fn analyze_prompt_harness(
    prompt: String,
    context_path: Option<String>,
) -> Result<HarnessPlan, String> {
    let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    Ok(build_harness_plan(
        &prompt,
        context_path.as_deref(),
        &cfg.profile.response_style,
        &cfg.harness,
    ))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aci_prunes_lockfiles_and_truncates_logs() {
        let fake_diff = "diff --git a/Cargo.lock b/Cargo.lock\n+lots of lockfile lines\ndiff --git a/src/main.rs b/src/main.rs\n+fn main() {}";
        let (pruned, count) = prune_aci_context(fake_diff);
        assert_eq!(count, 1);
        assert!(pruned.contains("src/main.rs"));
        assert!(!pruned.contains("+lots of lockfile lines"));
    }

    #[test]
    fn test_dynamic_step_routing_l1_l2_l3() {
        let prompt = "1. Lista los archivos del directorio\n2. Implementa un componente modal con validación\n3. Audita la arquitectura de seguridad y concurrencia P2P";
        let steps = extract_and_route_steps(prompt);
        assert_eq!(steps.len(), 3);
        assert_eq!(steps[0].badge, "L1");
        assert_eq!(steps[1].badge, "L2");
        assert_eq!(steps[2].badge, "L3");
    }
}
