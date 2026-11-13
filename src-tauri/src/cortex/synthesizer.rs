use rusqlite::{params, Connection};
use std::fs;
use std::path::Path;

use super::extractor::normalize_word;
use super::CortexProposal;

pub const CORTEX_SECTION_HEADER: &str = "## 🧠 Directrices y Aprendizajes Locales (Hermes Cortex)";

/// Extrae de `chat_messages` las consultas reales del usuario y conclusiones del asistente sobre `topic` sin contaminar con otros temas.
pub fn synthesize_from_history(
    conn: &Connection,
    topic: &str,
    fallback_sample: &str,
) -> (Vec<String>, Vec<String>) {
    let raw_key = topic
        .trim_start_matches("ext:.")
        .trim_start_matches("skill:");

    // Evitar tokens genéricos en la búsqueda histórica
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
        !needles.is_empty() && needles.iter().any(|n| norm_text.contains(n))
    };

    let mut expect_assistant = false;
    for (role, content) in rows {
        let norm_content = normalize_word(&content);
        if role == "user" {
            if matches_topic(&norm_content) && !content.trim_start().starts_with('/') {
                let clean_q: String = content
                    .lines()
                    .next()
                    .unwrap_or("")
                    .trim()
                    .chars()
                    .take(160)
                    .collect();
                if !clean_q.is_empty() && !user_queries.contains(&clean_q) {
                    user_queries.push(clean_q);
                }
                expect_assistant = true;
            } else {
                expect_assistant = false;
            }
        } else if role == "assistant" && expect_assistant {
            // Solo sintetizar respuestas del asistente inmediatamente asociadas al turno donde el usuario preguntó por `topic`
            expect_assistant = false;
            let mut body = content.as_str();
            while let Some(end_idx) = body.find("</thought>") {
                body = &body[end_idx + 10..];
            }
            for line in body.lines() {
                let t = line.trim();
                // Ignorar metadatos efímeros de commits/tags/rutas sueltas
                if t.starts_with("- **Commit**:")
                    || t.starts_with("- **Tag**:")
                    || t.starts_with("- [`")
                    || t.starts_with("- **PID")
                {
                    continue;
                }
                let is_bullet = t.starts_with("- ")
                    || t.starts_with("* ")
                    || (t.len() > 3
                        && t.chars().next().unwrap_or(' ').is_ascii_digit()
                        && t.contains(". "));
                let is_important = t.contains("**") || t.starts_with("### ");
                if (is_bullet || is_important) && t.len() >= 22 && t.len() <= 200 {
                    // Verificar que el punto realmente mencione o tenga relación semántica o sea regla arquitectónica
                    let formatted = if t.starts_with("### ") {
                        format!("- **Sección clave:** {}", t.trim_start_matches('#').trim())
                    } else if t.starts_with("- ") || t.starts_with("* ") {
                        format!("- {}", &t[2..].trim())
                    } else {
                        format!("- {}", t)
                    };
                    if !assistant_points.contains(&formatted) && assistant_points.len() < 8 {
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

    let existing_skill_path = skills_root.join(trimmed_slug).join("SKILL.md");
    let is_existing_non_cortex =
        !trimmed_slug.starts_with("cortex-") && existing_skill_path.exists();

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
        "- Sin acuerdos previos sintetizados aún; registrar conclusiones clave en próximas sesiones."
            .to_string()
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
            "---\nname: {slug}\ndescription: Contexto acumulado y directrices de Hermes Cortex para {topic} ({category}). Activar siempre que el usuario consulte o trabaje sobre {topic}.\n---\n\n# {t}\n\n## 1. Intención y Consultas Recurrentes del Usuario\n- **Dominio:** {category} ({hits} interacciones registradas, {errors} fricciones)\n{queries_md}\n\n## 2. Base de Conocimiento y Acuerdos Previos (Síntesis SQLite)\n{takeaways_md}\n\n## 3. Reglas de Ejecución al Activar esta Skill\n1. **Continuidad sin repetir lo básico:** Tomar como base los acuerdos de la sección 2 sin volver a explicar desde cero lo ya acordado.\n2. **Acción directa al dominio (`{topic}`):** Entregar implementaciones limpias, directrices técnicas, esquemas o soluciones ejecutables alineadas al objetivo del usuario.\n3. **Memoria en Bóveda:** Si se definen nuevos planes, recursos o avances sobre `{topic}`, documentarlos en la nota correspondiente de Obsidian.\n"
        );
        (t, r, md)
    };

    let profile_note = format!(
        "- **Patrón Hermes Cortex (`{topic}` — {category}):** Frecuencia alta ({hits} consultas). Skill especializada `{slug}` activa."
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
