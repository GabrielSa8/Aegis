use rusqlite::{params, Connection};
use std::fs;
use std::path::Path;

use super::extractor::{is_directive_or_correction, normalize_word, strip_code_and_noise};
use super::CortexProposal;

pub const CORTEX_SECTION_HEADER: &str = "## 🧠 Directrices y Aprendizajes Locales (Hermes Cortex)";

/// Extrae de `chat_messages` las directivas del operador, consultas limpias y acuerdos técnicos reales sobre `topic`.
pub fn synthesize_from_history(
    conn: &Connection,
    topic: &str,
    fallback_sample: &str,
) -> (Vec<String>, Vec<String>, Vec<String>) {
    let raw_key = topic
        .trim_start_matches("ext:.")
        .trim_start_matches("skill:");

    const GENERIC_NEEDLES: &[&str] = &[
        "skill", "skills", "find", "create", "update", "code", "clean", "design", "input",
        "filter", "optimization", "project", "router",
    ];
    let needles: Vec<String> = raw_key
        .split('-')
        .map(normalize_word)
        .filter(|s| s.len() >= 5 && !GENERIC_NEEDLES.contains(&s.as_str()))
        .collect();
    let primary_needle = normalize_word(raw_key);

    let mut directives: Vec<String> = Vec::new();
    let mut user_queries: Vec<String> = Vec::new();
    let mut assistant_points: Vec<String> = Vec::new();

    let Ok(mut stmt) = conn.prepare(
        "SELECT role, content, COALESCE(context, '') FROM chat_messages ORDER BY created_at ASC LIMIT 350",
    ) else {
        if !fallback_sample.is_empty() {
            user_queries.push(fallback_sample.to_string());
        }
        return (directives, user_queries, assistant_points);
    };

    let rows: Vec<(String, String, String)> = stmt
        .query_map([], |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
            ))
        })
        .ok()
        .into_iter()
        .flatten()
        .flatten()
        .collect();

    let matches_topic = |norm_text: &str, norm_ctx: &str| -> bool {
        if !primary_needle.is_empty()
            && (norm_text.contains(&primary_needle) || norm_ctx == primary_needle)
        {
            return true;
        }
        !needles.is_empty() && needles.iter().any(|n| norm_text.contains(n))
    };

    let mut expect_assistant = false;
    for (role, content, msg_ctx) in rows {
        let stripped = strip_code_and_noise(&content);
        let norm_content = normalize_word(&stripped);
        let norm_ctx = normalize_word(msg_ctx.trim());

        if role == "user" {
            if matches_topic(&norm_content, &norm_ctx) && !content.trim_start().starts_with('/') {
                let mut captured_directive = false;
                for raw_line in stripped.lines() {
                    let clean_line: String = raw_line.trim().chars().take(180).collect();
                    if clean_line.len() >= 10 && is_directive_or_correction(&clean_line) {
                        if !directives.contains(&clean_line) {
                            directives.push(clean_line);
                        }
                        captured_directive = true;
                    }
                }
                if !captured_directive {
                    let first_line: String = stripped
                        .lines()
                        .find(|l| !l.trim().is_empty())
                        .unwrap_or("")
                        .trim()
                        .chars()
                        .take(180)
                        .collect();
                    if first_line.len() >= 10 && !user_queries.contains(&first_line) {
                        user_queries.push(first_line);
                    }
                }
                expect_assistant = true;
            } else {
                expect_assistant = false;
            }
        } else if role == "assistant" && expect_assistant {
            expect_assistant = false;
            let mut body = content.as_str();
            while let Some(end_idx) = body.find("</thought>") {
                body = &body[end_idx + 10..];
            }
            let clean_body = strip_code_and_noise(body);
            let norm_body = normalize_word(&clean_body);
            // Exigir que la respuesta del asistente también tenga relación con el tópico o su contexto
            if !matches_topic(&norm_body, &norm_ctx) {
                continue;
            }
            for line in clean_body.lines() {
                let t = line.trim();
                // Descartar metadatos efímeros, rutas de archivos, hashes o conversación volátil
                if t.starts_with("- **Commit")
                    || t.starts_with("- **Tag")
                    || t.starts_with("- [`")
                    || t.starts_with("- [")
                    || t.starts_with("- **PID")
                    || t.starts_with("- **Estado")
                    || t.starts_with("- **Rama")
                    || t.contains("file:///")
                    || t.contains("memoria volátil")
                    || t.starts_with('|')
                {
                    continue;
                }
                let is_bullet = t.starts_with("- **") || t.starts_with("* **");
                if is_bullet && t.len() >= 28 && t.len() <= 200 {
                    let formatted = format!("- {}", &t[2..].trim());
                    if !assistant_points.contains(&formatted) && assistant_points.len() < 6 {
                        assistant_points.push(formatted);
                    }
                }
            }
        }
    }

    if user_queries.is_empty() && directives.is_empty() && !fallback_sample.is_empty() {
        let clean_fb: String = strip_code_and_noise(fallback_sample)
            .chars()
            .take(160)
            .collect();
        if !clean_fb.trim().is_empty() {
            user_queries.push(clean_fb.trim().to_string());
        }
    }

    (directives, user_queries, assistant_points)
}

pub fn build_skill_draft(
    conn: &Connection,
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
        .map(|c| {
            if c.is_ascii_alphanumeric() || c == '-' {
                c.to_ascii_lowercase()
            } else {
                '-'
            }
        })
        .collect();
    let trimmed_slug = clean_slug.trim_matches('-');

    let non_cortex_path = skills_root.join(trimmed_slug).join("SKILL.md");
    let is_existing_non_cortex = !trimmed_slug.starts_with("cortex-") && non_cortex_path.exists();

    let slug = if is_existing_non_cortex || trimmed_slug.starts_with("cortex-") {
        trimmed_slug.to_string()
    } else {
        format!("cortex-{}", trimmed_slug)
    };
    let target_skill_path = skills_root.join(&slug).join("SKILL.md");

    let (directives, queries, takeaways) = synthesize_from_history(conn, topic, sample);

    let directives_md = if directives.is_empty() {
        "- Sin restricciones explícitas dictadas aún; respetar convenciones del repositorio y BRAIN.md."
            .to_string()
    } else {
        directives
            .iter()
            .rev()
            .take(6)
            .map(|d| format!("- **Regla del Operador:** \"{}\"", d))
            .collect::<Vec<_>>()
            .join("\n")
    };

    let queries_md = if queries.is_empty() {
        "- Sin consultas adicionales registradas.".to_string()
    } else {
        queries
            .iter()
            .rev()
            .take(4)
            .map(|q| format!("- \"{}\"", q))
            .collect::<Vec<_>>()
            .join("\n")
    };

    let takeaways_md = if takeaways.is_empty() {
        "- Sin acuerdos técnicos adicionales sintetizados aún.".to_string()
    } else {
        takeaways.join("\n")
    };

    // Si el archivo SKILL.md ya existe en disco y tiene reglas curadas (no generadas por plantilla básica), preservarlas intactas
    let has_curated_file = target_skill_path.exists()
        && fs::read_to_string(&target_skill_path)
            .map(|c| {
                !c.contains("## 1. Intención y Consultas Recurrentes del Usuario")
                    || c.contains("## 2. Directrices Obligatorias")
                    || c.contains("## 2. Directrices Operativas Capturadas")
            })
            .unwrap_or(false);

    let (title, reason, skill_md) = if is_existing_non_cortex || has_curated_file {
        let base_md = fs::read_to_string(&target_skill_path).unwrap_or_default();
        let clean_base = base_md
            .split(CORTEX_SECTION_HEADER)
            .next()
            .unwrap_or(&base_md)
            .trim_end();
        let appended = format!(
            "{clean_base}\n\n{CORTEX_SECTION_HEADER}\n> Reglas operativas y acuerdos extraídos de tus sesiones en Aegis ({hits} señales, {errors} correcciones):\n\n### Directrices Imperativas del Operador\n{directives_md}\n\n### Acuerdos Técnicos Sintetizados\n{takeaways_md}\n"
        );
        (
            format!("Evolución de Skill: {}", slug),
            format!(
                "Hermes Cortex detectó {} señales ({} directrices/correcciones) en `{}` y actualizó la sección incremental preservando tus reglas curadas.",
                hits, errors, slug
            ),
            appended,
        )
    } else {
        let t = format!("Especialización Autónoma: {}", topic);
        let r = format!(
            "Hermes Cortex detectó {} interacciones ({} directrices/correcciones) sobre `{}` ({}).",
            hits, errors, topic, category
        );
        let md = format!(
            "---\nname: {slug}\ndescription: Contexto acumulado y directrices operativas de Hermes Cortex para {topic} ({category}). Activar siempre que el usuario consulte o trabaje sobre {topic}.\n---\n\n# {t}\n\n## 1. Directrices y Restricciones del Operador\n- **Dominio:** {category} ({hits} señales registradas, {errors} directrices/correcciones)\n{directives_md}\n\n## 2. Acuerdos Técnicos y Base de Conocimiento\n{takeaways_md}\n\n## 3. Foco de Consultas Recientes\n{queries_md}\n\n## 4. Reglas de Ejecución al Activar esta Skill\n1. **Aplicación estricta de directrices:** Cumplir las reglas de la sección 1 y 2 sin repetir preguntas ya resueltas.\n2. **Acción directa al dominio (`{topic}`):** Entregar código, esquemas o soluciones ejecutables alineadas al stack del proyecto.\n3. **Memoria en Bóveda:** Documentar decisiones arquitectónicas nuevas en la nota correspondiente de Obsidian.\n"
        );
        (t, r, md)
    };

    let profile_note = format!(
        "- **Patrón Hermes Cortex (`{topic}` — {category}):** {hits} señales ({errors} directrices). Skill `{slug}` activa."
    );

    (
        slug,
        title,
        reason,
        skill_md + "\n<!-- PROFILE_NOTE: " + &profile_note + " -->",
    )
}

pub fn upsert_or_evolve_proposal(
    conn: &Connection,
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
                "Hermes Cortex detectó +{} nuevas señales en `{}` ({} → {} total). Skill `{}` re-sintetizada preservando reglas base.",
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
