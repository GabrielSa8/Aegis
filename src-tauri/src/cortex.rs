use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::Path;

const PROPOSAL_THRESHOLD: i64 = 5;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CortexHabit {
    pub topic: String,
    pub category: String,
    pub hit_count: i64,
    pub error_count: i64,
    pub sample_prompt: Option<String>,
    pub last_context: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CortexProposal {
    pub id: String,
    pub topic: String,
    pub title: String,
    pub reason: String,
    pub skill_slug: String,
    pub skill_markdown: String,
    pub profile_note: String,
    pub hit_count: i64,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CortexTelemetry {
    pub total_events: i64,
    pub total_errors: i64,
    pub top_habits: Vec<CortexHabit>,
    pub proposals: Vec<CortexProposal>,
}

const STOPWORDS: &[&str] = &[
    "para", "como", "este", "esta", "estos", "estas", "pero", "porque", "cuando", "donde",
    "hacer", "hace", "quiero", "puedes", "puede", "solo", "todo", "todos", "toda", "todas",
    "algo", "algun", "alguna", "sobre", "entre", "desde", "hasta", "sin", "con", "por", "una",
    "uno", "unos", "unas", "del", "las", "los", "que", "qué", "cómo", "cuál", "cual", "esto",
    "eso", "aquí", "aqui", "ahora", "bien", "mal", "mas", "más", "menos", "muy", "también",
    "tambien", "otro", "otra", "otros", "otras", "mismo", "misma", "tengo", "tiene", "tienen",
    "vamos", "dale", "revisa", "mira", "crea", "edita", "cambia", "agrega", "quita", "borra",
    "archivo", "archivos", "codigo", "código", "funcion", "función", "error", "falla", "with",
    "from", "that", "this", "have", "what", "when", "where", "which", "into", "your", "explica",
    "explicame", "explícame", "ayuda", "ayudame", "ayúdame", "necesito", "podrias", "podrías",
    "dime", "muestra", "muestrame", "muéstrame", "favor", "hacerlo", "usando", "usar", "nuevo",
    "nueva", "nuevos", "nuevas", "mejor", "forma", "manera", "ejemplo", "parte", "punto",
    "entonces", "ademas", "además", "luego", "despues", "después", "antes", "siempre", "nunca",
    "please", "could", "would", "should", "about", "there", "their", "these", "those",
    "estoy", "estas", "estamos", "estan", "seria", "tener", "vamos", "puedo", "quieres",
    "buen", "buena", "buenos", "buenas", "viable", "duda", "paso", "pudiste", "nueva", "nuevo",
    "cuales", "como", "cuando", "donde", "quien", "hola", "tarde", "noche", "noches", "dias",
];

/// Verbos comunes de acción/intención que acompañan al tema pero NO son el tema en sí.
const ACTION_VERBS: &[&str] = &[
    "estudiar", "estudio", "aprender", "aprendo", "practicar", "practico", "repasar", "repaso",
    "entender", "comprender", "resolver", "calcular", "analizar", "investigar", "preparar",
    "configurar", "instalar", "implementar", "desarrollar", "programar", "escribir", "generar",
    "mejorar", "optimizar", "corregir", "arreglar", "revisar", "probar", "ejecutar", "iniciar",
    "empezar", "comenzar", "terminar", "continuar", "usar", "utilizar", "aplicar", "construir",
    "disenar", "organizar", "planificar", "resumir", "traducir", "buscar", "encontrar",
];

fn is_generic_verb(norm: &str) -> bool {
    if ACTION_VERBS.contains(&norm) {
        return true;
    }
    // Infinitivos regulares en español (-ar, -er, -ir) de uso verbal común (>= 6 letras)
    // Excepciones de sustantivos técnicos que terminan en ar/er/ir (docker, pulsar, elixir, angular, ledger, shader, router, server, cluster)
    const NOUN_EXCEPTIONS: &[&str] = &[
        "docker", "angular", "elixir", "pulsar", "shader", "router", "server", "cluster",
        "render", "buffer", "driver", "linter", "parser", "worker", "helper", "header",
        "footer", "slider", "drawer", "ledger", "bezier", "fourier", "euler", "tensor",
    ];
    if NOUN_EXCEPTIONS.contains(&norm) {
        return false;
    }
    norm.len() >= 6 && (norm.ends_with("ar") || norm.ends_with("er") || norm.ends_with("ir"))
}

fn normalize_word(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'á' | 'à' | 'ä' => 'a',
            'é' | 'è' | 'ë' => 'e',
            'í' | 'ì' | 'ï' => 'i',
            'ó' | 'ò' | 'ö' => 'o',
            'ú' | 'ù' | 'ü' => 'u',
            _ => c.to_ascii_lowercase(),
        })
        .collect()
}

/// Clasificador universal de 0 tokens (agnóstico de dominio: software, estudios, cocina, finanzas, etc.).
fn extract_topics(text: &str) -> Vec<(String, &'static str)> {
    let mut found: Vec<(String, &'static str)> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    let stop: HashSet<&str> = STOPWORDS.iter().copied().collect();

    // 1. Notas [[Nota]] o términos resaltados entre `backticks`
    for chunk in text.split('`').skip(1).step_by(2) {
        let clean = normalize_word(chunk.trim());
        if clean.len() >= 3
            && clean.len() <= 28
            && !clean.contains(char::is_whitespace)
            && !stop.contains(clean.as_str())
        {
            if seen.insert(clean.clone()) {
                found.push((clean, "Término Explícito"));
            }
        }
    }

    // 2. Extensiones de archivo reales (cualquier archivo con punto: .rs, .py, .pdf, .csv, .xlsx, .ino, etc.)
    for token in text.split(|c: char| c.is_whitespace() || ",;()[]{}<>\"'`".contains(c)) {
        if let Some(dot_idx) = token.rfind('.') {
            let name = &token[..dot_idx];
            let ext = normalize_word(&token[dot_idx + 1..]);
            if !name.is_empty()
                && (2..=5).contains(&ext.len())
                && ext.chars().all(|c| c.is_ascii_alphabetic())
            {
                let key = format!("ext:.{}", ext);
                if seen.insert(key.clone()) {
                    found.push((key, "Formato / Archivo"));
                }
            }
        }
    }

    // 3. Extracción abierta de conceptos/sustantivos de cualquier tema (siempre activa)
    let mut candidates: Vec<String> = Vec::new();
    for raw in text.split(|c: char| !c.is_alphanumeric() && c != '-' && c != '_') {
        let trimmed = raw.trim_matches(|c: char| c == '-' || c == '_');
        let norm = normalize_word(trimmed);
        if norm.len() >= 4
            && norm.len() <= 26
            && !stop.contains(norm.as_str())
            && !STOPWORDS.contains(&trimmed.to_lowercase().as_str())
            && !is_generic_verb(&norm)
            && norm.chars().any(|c| c.is_alphabetic())
            // Descartar gerundios y adverbios comunes
            && !norm.ends_with("ando")
            && !norm.ends_with("iendo")
            && !norm.ends_with("mente")
        {
            if !candidates.contains(&norm) {
                candidates.push(norm);
            }
        }
    }

    // Priorizar términos compuestos (con guión/underscore) conservando el orden de aparición del sustantivo
    candidates.sort_by_key(|w| {
        let has_sep = w.contains('-') || w.contains('_');
        if has_sep { 0 } else { 1 }
    });

    // Registrar hasta 6 sustantivos/conceptos por turno para que SQLite intersecte el tema común entre prompts
    for concept in candidates.into_iter().take(6) {
        if seen.insert(concept.clone()) {
            found.push((concept, "Concepto / Dominio"));
        }
    }

    found
}

/// Detecta si el operador está dictando una regla, restricción o corrección explícita.
fn is_directive_or_correction(text: &str) -> bool {
    let norm = normalize_word(text);
    const MARKERS: &[&str] = &[
        "prohibido", "siempre", "nunca", "regla", "directriz", "directrices", "no uses",
        "no hagas", "debe ser", "deberia", "va trabado", "tiene lag", "monolito", "hardcode",
        "en vez de", "corrige", "evita", "obligatorio", "sin usar", "no me gusta", "no me convence",
    ];
    MARKERS.iter().any(|m| norm.contains(m))
}

/// Asocia el prompt con skills ya instaladas en `~/.agents/skills/` (por tokens del nombre o skills activas en el contexto cuando hay corrección).
fn match_installed_skills(text: &str, active_skills: &[String]) -> Vec<String> {
    let norm = normalize_word(text);
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let skills_dir = Path::new(&home).join(".agents/skills");
    let mut matched: Vec<String> = Vec::new();

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            let slug = entry.file_name().to_string_lossy().to_string();
            if slug.starts_with("cortex-") || !entry.path().join("SKILL.md").exists() {
                continue;
            }
            let tokens: Vec<&str> = slug
                .split('-')
                .filter(|t| t.len() >= 4 && !matches!(*t, "patterns" | "mentor" | "generator" | "practitioner"))
                .collect();
            if !tokens.is_empty() && tokens.iter().any(|tk| norm.contains(tk)) {
                matched.push(slug);
            }
        }
    }

    // Si el usuario lanza una directriz/corrección y hay skills activas en su contexto actual, vincularlas
    if is_directive_or_correction(text) {
        for sk in active_skills {
            let clean = sk.trim().to_string();
            if !clean.is_empty() && !matched.contains(&clean) {
                matched.push(clean);
            }
        }
    }

    matched
}

/// Extrae de `chat_messages` las consultas reales del usuario y las conclusiones clave del asistente sobre `topic`.
fn synthesize_from_history(conn: &rusqlite::Connection, topic: &str, fallback_sample: &str) -> (Vec<String>, Vec<String>) {
    let raw_key = topic
        .trim_start_matches("ext:.")
        .trim_start_matches("skill:");
    let needles: Vec<String> = raw_key
        .split('-')
        .map(normalize_word)
        .filter(|s| s.len() >= 4)
        .collect();
    let primary_needle = normalize_word(raw_key);
    let mut user_queries: Vec<String> = Vec::new();
    let mut assistant_points: Vec<String> = Vec::new();

    let Ok(mut stmt) = conn.prepare(
        "SELECT role, content FROM chat_messages ORDER BY created_at ASC LIMIT 300",
    ) else {
        if !fallback_sample.is_empty() {
            user_queries.push(fallback_sample.to_string());
        }
        return (user_queries, assistant_points);
    };

    let rows: Vec<(String, String)> = stmt
        .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
        .ok()
        .into_iter()
        .flatten()
        .flatten()
        .collect();

    let matches_topic = |norm_text: &str| -> bool {
        if !primary_needle.is_empty() && norm_text.contains(&primary_needle) {
            return true;
        }
        needles.iter().any(|n| norm_text.contains(n))
    };

    let mut expect_assistant = false;
    for (role, content) in rows {
        let norm_content = normalize_word(&content);
        if role == "user" {
            if matches_topic(&norm_content) && !content.trim_start().starts_with('/') {
                let clean_q: String = content.lines().next().unwrap_or("").trim().chars().take(160).collect();
                if !clean_q.is_empty() && !user_queries.contains(&clean_q) {
                    user_queries.push(clean_q);
                }
                expect_assistant = true;
            } else {
                expect_assistant = false;
            }
        } else if role == "assistant" && (expect_assistant || matches_topic(&norm_content)) {
            expect_assistant = false;
            // Limpiar bloques <thought>...</thought>
            let mut body = content.as_str();
            while let Some(end_idx) = body.find("</thought>") {
                body = &body[end_idx + 10..];
            }
            for line in body.lines() {
                let t = line.trim();
                let is_bullet = t.starts_with("- ") || t.starts_with("* ") || (t.len() > 3 && t.chars().next().unwrap_or(' ').is_ascii_digit() && t.contains(". "));
                let is_important = t.contains("**") || t.starts_with("### ");
                if (is_bullet || is_important) && t.len() >= 18 && t.len() <= 200 {
                    let formatted = if t.starts_with("### ") {
                        format!("- **Sección clave:** {}", t.trim_start_matches('#').trim())
                    } else if t.starts_with("- ") || t.starts_with("* ") {
                        format!("- {}", &t[2..].trim())
                    } else {
                        format!("- {}", t)
                    };
                    if !assistant_points.contains(&formatted) && assistant_points.len() < 10 {
                        assistant_points.push(formatted);
                    }
                }
            }
        }
    }

    if user_queries.is_empty() && !fallback_sample.is_empty() {
        user_queries.push(fallback_sample.chars().take(160).collect());
    }

    (user_queries, assistant_points)
}

const CORTEX_SECTION_HEADER: &str = "## 🧠 Directrices y Aprendizajes Locales (Hermes Cortex)";

fn build_skill_draft(
    conn: &rusqlite::Connection,
    topic: &str,
    category: &str,
    hits: i64,
    errors: i64,
    sample: &str,
) -> (String, String, String, String) {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let skills_root = Path::new(&home).join(".agents/skills");

    let explicit_skill = topic.strip_prefix("skill:");
    let clean_slug: String = explicit_skill
        .unwrap_or(topic)
        .replace(':', "-")
        .replace('.', "")
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' { c.to_ascii_lowercase() } else { '-' })
        .collect();
    let trimmed_slug = clean_slug.trim_matches('-');

    // Verificar si corresponde a una skill existente en ~/.agents/skills/<slug>/SKILL.md
    let existing_skill_path = skills_root.join(trimmed_slug).join("SKILL.md");
    let is_existing_non_cortex = !trimmed_slug.starts_with("cortex-") && existing_skill_path.exists();

    let slug = if is_existing_non_cortex || trimmed_slug.starts_with("cortex-") {
        trimmed_slug.to_string()
    } else {
        format!("cortex-{}", trimmed_slug)
    };

    let (queries, takeaways) = synthesize_from_history(conn, topic, sample);
    let queries_md = if queries.is_empty() {
        format!("- `{}`", sample.chars().take(160).collect::<String>())
    } else {
        queries
            .iter()
            .rev()
            .take(5)
            .map(|q| format!("- \"{}\"", q))
            .collect::<Vec<_>>()
            .join("\n")
    };

    let takeaways_md = if takeaways.is_empty() {
        "- Sin acuerdos previos sintetizados aún; registrar conclusiones clave en próximas sesiones.".to_string()
    } else {
        takeaways.join("\n")
    };

    let (title, reason, skill_md) = if is_existing_non_cortex {
        let base_md = fs::read_to_string(&existing_skill_path).unwrap_or_default();
        let clean_base = base_md
            .split(CORTEX_SECTION_HEADER)
            .next()
            .unwrap_or(&base_md)
            .trim_end();
        let appended = format!(
            "{clean_base}\n\n{CORTEX_SECTION_HEADER}\n> Reglas locales y correcciones extraídas de tus sesiones en Aegis ({hits} señales, {errors} correcciones/fricciones):\n\n### Directrices y Consultas del Operador\n{queries_md}\n\n### Acuerdos Técnicos Aplicados\n{takeaways_md}\n"
        );
        (
            format!("Evolución de Skill Instalada: {}", slug),
            format!(
                "Hermes Cortex detectó {} interacciones ({} correcciones/directrices) vinculadas a tu skill `{}` y anexó las reglas al final de su SKILL.md sin alterar el manual original.",
                hits, errors, slug
            ),
            appended,
        )
    } else {
        let t = format!("Especialización Autónoma: {}", topic);
        let r = if errors > 0 {
            format!(
                "Hermes Cortex detectó {} consultas y {} fricciones/errores en `{}` ({}).",
                hits, errors, topic, category
            )
        } else {
            format!(
                "Hermes Cortex detectó {} consultas recurrentes sobre `{}` ({}).",
                hits, topic, category
            )
        };
        let md = format!(
            "---\nname: {slug}\ndescription: Contexto acumulado y directrices de Hermes Cortex para {topic} ({category}). Activar siempre que el usuario consulte o trabaje sobre {topic}.\n---\n\n# {t}\n\n## 1. Intención y Consultas Recurrentes del Usuario\n- **Dominio:** {category} ({hits} interacciones registradas, {errors} fricciones)\n{queries_md}\n\n## 2. Base de Conocimiento y Acuerdos Previos (Síntesis SQLite)\n{takeaways_md}\n\n## 3. Reglas de Ejecución al Activar esta Skill\n1. **Continuidad sin repetir lo básico:** Tomar como base los acuerdos de la sección 2 sin volver a explicar desde cero lo ya respondido.\n2. **Acción directa al dominio (`{topic}`):** Entregar ejercicios, plantillas, tarjetas Anki (`Q::A`), esquemas o soluciones ejecutables alineadas al objetivo del usuario.\n3. **Memoria en Bóveda:** Si se definen nuevos planes, recursos o avances sobre `{topic}`, documentarlos en la nota correspondiente de Obsidian.\n"
        );
        (t, r, md)
    };

    let profile_note = format!(
        "- **Patrón Hermes Cortex (`{topic}` — {category}):** Frecuencia alta ({hits} consultas). Skill especializada `{slug}` activa."
    );

    (slug, title, reason, skill_md + "\n<!-- PROFILE_NOTE: " + &profile_note + " -->")
}

/// Crea la propuesta inicial o evoluciona una ya aprobada cuando acumula `min_delta` nuevas interacciones.
fn upsert_or_evolve_proposal(
    conn: &rusqlite::Connection,
    topic: &str,
    category: &str,
    hits: i64,
    errors: i64,
    sample: &str,
    now: &str,
    min_delta: i64,
) -> Option<CortexProposal> {
    let existing: Option<(String, i64)> = conn
        .query_row(
            "SELECT status, hit_count FROM cortex_proposals WHERE topic = ?1",
            params![topic],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .ok();

    if let Some((ref status, prev_hits)) = existing {
        if status == "dismissed" {
            return None;
        }
        if status == "approved" && (hits - prev_hits) < min_delta {
            return None;
        }
    }

    let (slug, mut title, mut reason, combined_md) =
        build_skill_draft(conn, topic, category, hits, errors, sample);

    if let Some((ref status, prev_hits)) = existing {
        if status == "approved" {
            let delta = hits - prev_hits;
            title = format!("Evolución Autónoma: {} (+{} nuevas)", topic, delta);
            reason = format!(
                "Hermes Cortex detectó +{} nuevas consultas en `{}` ({} → {} total). Skill `{}` re-sintetizada con los acuerdos más recientes.",
                delta, topic, prev_hits, hits, slug
            );
        }
    }

    let clean_md = combined_md
        .split("\n<!-- PROFILE_NOTE:")
        .next()
        .unwrap_or(&combined_md)
        .to_string();
    let profile_note = format!(
        "- **Hermes Cortex (`{}` · {}):** {} interacciones registradas → skill `{}`.",
        topic, category, hits, slug
    );

    let prop = CortexProposal {
        id: format!("prop_{}", slug),
        topic: topic.to_string(),
        title,
        reason,
        skill_slug: slug,
        skill_markdown: clean_md,
        profile_note,
        hit_count: hits,
        status: "pending".to_string(),
        created_at: now.to_string(),
    };

    let _ = conn.execute(
        "INSERT INTO cortex_proposals (id, topic, title, reason, skill_slug, skill_markdown, profile_note, hit_count, status, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'pending', ?9)
         ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            reason = excluded.reason,
            skill_markdown = excluded.skill_markdown,
            profile_note = excluded.profile_note,
            hit_count = excluded.hit_count,
            status = 'pending',
            created_at = excluded.created_at",
        params![
            prop.id,
            prop.topic,
            prop.title,
            prop.reason,
            prop.skill_slug,
            prop.skill_markdown,
            prop.profile_note,
            prop.hit_count,
            prop.created_at
        ],
    );

    Some(prop)
}

/// Registra silenciosamente un turno (0 tokens) y devuelve una propuesta si cruzó el umbral (nueva o evolución).
#[tauri::command]
pub fn cortex_record_signal(
    prompt: String,
    context_label: Option<String>,
    is_error: bool,
    active_skills: Option<Vec<String>>,
) -> Result<Option<CortexProposal>, String> {
    let trimmed = prompt.trim();
    if trimmed.is_empty() || trimmed.starts_with('/') {
        return Ok(None);
    }

    let mut topics = extract_topics(trimmed);
    let ctx_skills = active_skills.unwrap_or_default();
    let matched_skills = match_installed_skills(trimmed, &ctx_skills);
    for sk in matched_skills {
        let key = format!("skill:{}", sk);
        if !topics.iter().any(|(t, _)| t == &key) {
            topics.insert(0, (key, "Skill Instalada"));
        }
    }

    if topics.is_empty() {
        return Ok(None);
    }

    let conn = crate::db::get_db_connection()?;
    let now = chrono_iso_now();
    let ctx = context_label.unwrap_or_else(|| "General".to_string());
    let sample: String = trimmed.chars().take(200).collect();
    let is_directive = is_directive_or_correction(trimmed);
    let hit_inc: i64 = if is_directive { 2 } else { 1 };
    let err_inc: i64 = if is_error || is_directive { 1 } else { 0 };

    let mut triggered_proposal: Option<CortexProposal> = None;

    for (topic, category) in topics {
        conn.execute(
            "INSERT INTO cortex_habits (topic, category, hit_count, error_count, sample_prompt, last_context, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(topic) DO UPDATE SET
                hit_count = hit_count + ?3,
                error_count = error_count + ?4,
                sample_prompt = ?5,
                last_context = ?6,
                updated_at = ?7",
            params![topic, category, hit_inc, err_inc, sample, ctx, now],
        )
        .map_err(|e| e.to_string())?;

        let (hits, errors): (i64, i64) = conn
            .query_row(
                "SELECT hit_count, error_count FROM cortex_habits WHERE topic = ?1",
                params![topic],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((1, 0));

        if (hits >= PROPOSAL_THRESHOLD || (hits >= 3 && errors >= 2)) && triggered_proposal.is_none() {
            triggered_proposal = upsert_or_evolve_proposal(
                &conn,
                &topic,
                category,
                hits,
                errors,
                &sample,
                &now,
                PROPOSAL_THRESHOLD,
            );
        }
    }

    Ok(triggered_proposal)
}

/// Obtiene el estado completo de Hermes Cortex y sintetiza/evoluciona propuestas maduras.
#[tauri::command]
pub fn cortex_get_telemetry() -> Result<CortexTelemetry, String> {
    let conn = crate::db::get_db_connection()?;
    let now = chrono_iso_now();

    let (total_events, total_errors): (i64, i64) = conn
        .query_row(
            "SELECT COALESCE(SUM(hit_count), 0), COALESCE(SUM(error_count), 0) FROM cortex_habits",
            [],
            |r| Ok((r.get(0)?, r.get(1)?)),
        )
        .unwrap_or((0, 0));

    let mut stmt = conn
        .prepare(
            "SELECT topic, category, hit_count, error_count, sample_prompt, last_context, updated_at
             FROM cortex_habits
             ORDER BY hit_count DESC, updated_at DESC
             LIMIT 10",
        )
        .map_err(|e| e.to_string())?;

    let habits: Vec<CortexHabit> = stmt
        .query_map([], |r| {
            Ok(CortexHabit {
                topic: r.get(0)?,
                category: r.get(1)?,
                hit_count: r.get(2)?,
                error_count: r.get(3)?,
                sample_prompt: r.get(4)?,
                last_context: r.get(5)?,
                updated_at: r.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .flatten()
        .collect();

    // En reflexión bajo demanda (/cortex), crear o evolucionar hábitos con >= 2 hits que tengan nuevas consultas
    for h in habits.iter().filter(|h| h.hit_count >= 2) {
        let sample = h.sample_prompt.clone().unwrap_or_default();
        let _ = upsert_or_evolve_proposal(
            &conn,
            &h.topic,
            &h.category,
            h.hit_count,
            h.error_count,
            &sample,
            &now,
            2,
        );
    }

    let mut p_stmt = conn
        .prepare(
            "SELECT id, topic, title, reason, skill_slug, skill_markdown, profile_note, hit_count, status, created_at
             FROM cortex_proposals
             ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC
             LIMIT 8",
        )
        .map_err(|e| e.to_string())?;

    let proposals: Vec<CortexProposal> = p_stmt
        .query_map([], |r| {
            Ok(CortexProposal {
                id: r.get(0)?,
                topic: r.get(1)?,
                title: r.get(2)?,
                reason: r.get(3)?,
                skill_slug: r.get(4)?,
                skill_markdown: r.get(5)?,
                profile_note: r.get(6)?,
                hit_count: r.get(7)?,
                status: r.get(8)?,
                created_at: r.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .flatten()
        .collect();

    Ok(CortexTelemetry {
        total_events,
        total_errors,
        top_habits: habits,
        proposals,
    })
}

/// Aprueba o descarta una propuesta. Si se aprueba, crea `~/.agents/skills/<slug>/SKILL.md`
/// y sincroniza el aprendizaje en el perfil de la bóveda configurada.
#[tauri::command]
pub fn cortex_resolve_proposal(
    proposal_id: String,
    approve: bool,
    custom_markdown: Option<String>,
) -> Result<String, String> {
    let conn = crate::db::get_db_connection()?;
    let mut prop: CortexProposal = conn
        .query_row(
            "SELECT id, topic, title, reason, skill_slug, skill_markdown, profile_note, hit_count, status, created_at
             FROM cortex_proposals WHERE id = ?1",
            params![proposal_id],
            |r| {
                Ok(CortexProposal {
                    id: r.get(0)?,
                    topic: r.get(1)?,
                    title: r.get(2)?,
                    reason: r.get(3)?,
                    skill_slug: r.get(4)?,
                    skill_markdown: r.get(5)?,
                    profile_note: r.get(6)?,
                    hit_count: r.get(7)?,
                    status: r.get(8)?,
                    created_at: r.get(9)?,
                })
            },
        )
        .map_err(|e| format!("Propuesta no encontrada: {}", e))?;

    if !approve {
        conn.execute(
            "UPDATE cortex_proposals SET status = 'dismissed' WHERE id = ?1",
            params![proposal_id],
        )
        .map_err(|e| e.to_string())?;
        return Ok("dismissed".to_string());
    }

    if let Some(edited) = custom_markdown {
        if !edited.trim().is_empty() {
            prop.skill_markdown = edited;
            let _ = conn.execute(
                "UPDATE cortex_proposals SET skill_markdown = ?1 WHERE id = ?2",
                params![prop.skill_markdown, proposal_id],
            );
        }
    }

    // 1. Escribir SKILL.md en ~/.agents/skills/<slug>/SKILL.md
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let skill_dir = Path::new(&home).join(".agents/skills").join(&prop.skill_slug);
    fs::create_dir_all(&skill_dir)
        .map_err(|e| format!("No se pudo crear directorio de skill: {}", e))?;
    let skill_file = skill_dir.join("SKILL.md");
    fs::write(&skill_file, &prop.skill_markdown)
        .map_err(|e| format!("No se pudo escribir SKILL.md: {}", e))?;

    // 2. Respaldo en la bóveda de Obsidian configurada (si existe) + actualización de perfil
    if let Ok(cfg) = crate::config::get_aegis_config() {
        let vault = Path::new(&cfg.vault_path);
        if vault.exists() {
            // Respaldo de la skill en 00 Sistema/Skills/<slug>/SKILL.md
            let backup_dir = vault.join("00 Sistema/Skills").join(&prop.skill_slug);
            if fs::create_dir_all(&backup_dir).is_ok() {
                let _ = fs::write(backup_dir.join("SKILL.md"), &prop.skill_markdown);
            }

            // Sincronizar aprendizaje en el primer archivo de perfil encontrado en 00 Sistema/Cerebro IA/
            let cerebro_dir = vault.join("00 Sistema/Cerebro IA");
            if let Ok(entries) = fs::read_dir(&cerebro_dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    let fname = p.file_name().and_then(|s| s.to_str()).unwrap_or("");
                    if fname.starts_with("Perfil") && fname.ends_with(".md") {
                        if let Ok(existing) = fs::read_to_string(&p) {
                            if !existing.contains(&prop.skill_slug) {
                                let marker = "## 🧠 Aprendizajes Hermes Cortex";
                                let updated = if existing.contains(marker) {
                                    format!("{}\n{}", existing.trim_end(), prop.profile_note)
                                } else {
                                    format!(
                                        "{}\n\n---\n\n{}\n{}\n",
                                        existing.trim_end(),
                                        marker,
                                        prop.profile_note
                                    )
                                };
                                let _ = fs::write(&p, updated);
                            }
                        }
                        break;
                    }
                }
            }
        }
    }

    conn.execute(
        "UPDATE cortex_proposals SET status = 'approved' WHERE id = ?1",
        params![proposal_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(skill_file.to_string_lossy().to_string())
}

fn chrono_iso_now() -> String {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    format!("{}", secs)
}

#[cfg(test)]
mod tests {
    use super::extract_topics;

    #[test]
    fn extracts_universal_topics_across_any_domain() {
        let code = extract_topics("Corrige el handler de dynamodb en template.yaml y agent.rs");
        assert!(code.iter().any(|(t, _)| t == "ext:.yaml" || t == "ext:.rs"));
        assert!(code.iter().any(|(t, _)| t == "dynamodb"));

        let open = extract_topics("Explícame cómo calcular integrales impropias en termodinámica");
        assert!(open.iter().any(|(t, _)| t == "termodinamica" || t == "integrales"));
        assert!(!open.iter().any(|(t, _)| t == "explicame" || t == "calcular"));

        let study = extract_topics("Quiero estudiar inglés conversacional todos los días");
        assert_eq!(study[0].0, "ingles");
        assert!(!study.iter().any(|(t, _)| t == "estudiar"));
    }
}
