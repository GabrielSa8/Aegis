pub mod extractor;
pub mod synthesizer;

use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use extractor::{
    extract_topics_with_context, is_directive_or_correction, match_installed_skills,
    strip_code_and_noise,
};
use synthesizer::upsert_or_evolve_proposal;

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

    // No registrar errores crudos de transporte/CLI como si fueran prompts del operador
    if is_error && !is_directive_or_correction(trimmed) {
        return Ok(None);
    }

    let mut topics = extract_topics_with_context(trimmed, context_label.as_deref());
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
    let clean_sample: String = strip_code_and_noise(trimmed)
        .lines()
        .find(|l| !l.trim().is_empty())
        .unwrap_or(trimmed)
        .trim()
        .chars()
        .take(200)
        .collect();
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
            params![topic, category, hit_inc, err_inc, clean_sample, ctx, now],
        )
        .map_err(|e| e.to_string())?;

        let (hits, errors): (i64, i64) = conn
            .query_row(
                "SELECT hit_count, error_count FROM cortex_habits WHERE topic = ?1",
                params![topic],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap_or((1, 0));

        if (hits >= PROPOSAL_THRESHOLD || (hits >= 3 && errors >= 2)) && triggered_proposal.is_none()
        {
            triggered_proposal = upsert_or_evolve_proposal(
                &conn,
                &topic,
                category,
                hits,
                errors,
                &clean_sample,
                &now,
                PROPOSAL_THRESHOLD,
            );
        }
    }

    Ok(triggered_proposal)
}

/// Obtiene el estado completo de Hermes Cortex y sintetiza/evoluciona propuestas que cumplan umbral real.
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

    for h in habits
        .iter()
        .filter(|h| h.hit_count >= PROPOSAL_THRESHOLD || (h.hit_count >= 3 && h.error_count >= 2))
    {
        let sample = h.sample_prompt.clone().unwrap_or_default();
        let _ = upsert_or_evolve_proposal(
            &conn,
            &h.topic,
            &h.category,
            h.hit_count,
            h.error_count,
            &sample,
            &now,
            PROPOSAL_THRESHOLD,
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

    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let skill_dir = Path::new(&home).join(".agents/skills").join(&prop.skill_slug);
    fs::create_dir_all(&skill_dir)
        .map_err(|e| format!("No se pudo crear directorio de skill: {}", e))?;
    let skill_file = skill_dir.join("SKILL.md");
    fs::write(&skill_file, &prop.skill_markdown)
        .map_err(|e| format!("No se pudo escribir SKILL.md: {}", e))?;

    if let Ok(cfg) = crate::config::get_aegis_config() {
        let vault = Path::new(&cfg.vault_path);
        if vault.exists() {
            let backup_dir = vault.join("00 Sistema/Skills").join(&prop.skill_slug);
            if fs::create_dir_all(&backup_dir).is_ok() {
                let _ = fs::write(backup_dir.join("SKILL.md"), &prop.skill_markdown);
            }

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
    use super::extractor::{extract_topics, extract_topics_with_context};
    use super::synthesizer::{upsert_or_evolve_proposal, CORTEX_SECTION_HEADER};
    use rusqlite::{params, Connection};

    fn setup_memory_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        crate::db::init_db_schema(&conn).unwrap();
        conn.execute(
            "INSERT INTO chat_sessions (id, title, context_id, effort, created_at, updated_at)
             VALUES ('s1', 'Test Session', 'ctx1', 'medium', '2026-11-14T10:00:00Z', '2026-11-14T10:00:00Z')",
            [],
        )
        .unwrap();
        conn
    }

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

        let noise = extract_topics("ejecuta una tarea que te pida reiniciarte para ver si eres capaz de lanzar el output tras reinicio");
        assert!(!noise.iter().any(|(t, _)| matches!(t.as_str(), "ejecuta" | "eres" | "capaz" | "tarea" | "output" | "reinicio" | "reiniciarte" | "lanzar")));
    }

    #[test]
    fn blocks_pasted_code_and_attributes_coding_rules_to_active_context() {
        let pasted = extract_topics(
            "Este es el código original, modificalo con el arreglo\n```js\nconst REGEX_DIACRITICS = /a/;\nconst MONITOREO_TOC = 1;\n```",
        );
        assert!(!pasted
            .iter()
            .any(|(t, _)| t.contains("regex") || t.contains("monitoreo")));

        let git_rule = extract_topics_with_context(
            "Recuerda, solo commits en ingles, trabajamos en ramas",
            Some("Kaboom"),
        );
        assert_eq!(git_rule[0].0, "kaboom");
        assert!(!git_rule
            .iter()
            .any(|(t, _)| matches!(t.as_str(), "ingles" | "commits" | "ramas")));
    }

    #[test]
    fn synthesizes_high_signal_new_skill_without_noise() {
        let conn = setup_memory_db();

        // Turno 1: Directriz multilínea + bloque de código pegado (ruido que debe ignorarse)
        conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, context, created_at)
             VALUES ('m1', 's1', 'user', ?1, 'BillingEngine', '2026-11-14T10:01:00Z')",
            params![
                "Vamos a estructurar el módulo de facturación.\nProhibido usar flotantes IEEE 754 para dinero, siempre usa centavos enteros en i64.\n```rust\nlet BAD_FLOAT_VAR = 19.99;\n```"
            ],
        )
        .unwrap();

        // Respuesta del asistente con acuerdo técnico real + ruido de commits/links que debe filtrarse
        conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, context, created_at)
             VALUES ('m2', 's1', 'assistant', ?1, 'BillingEngine', '2026-11-14T10:01:10Z')",
            params![
                "<thought>Pensando...</thought>\nListo:\n- **Aritmética Monetaria Exacta:** Todos los montos en BillingEngine se almacenan en centavos (`i64`) con redondeo bancario explícito.\n- **Commit**: `34ed1ed` — fix\n- [`src/main.rs`](file:///home/user/src/main.rs)"
            ],
        )
        .unwrap();

        // Turno 2: Segunda directriz en el mismo contexto
        conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, context, created_at)
             VALUES ('m3', 's1', 'user', 'Recuerda que toda factura cancelada debe conservar su folio fiscal por auditoría (soft-delete obligatorio).', 'BillingEngine', '2026-11-14T10:02:00Z')",
            [],
        )
        .unwrap();

        let prop = upsert_or_evolve_proposal(
            &conn,
            "billingengine",
            "Concepto / Dominio",
            5,
            2,
            "Prohibido usar flotantes IEEE 754",
            "1700000000",
            5,
        )
        .expect("Debe generar propuesta al cruzar umbral");

        println!("\n=== SKILL NUEVA GENERADA ===\n{}\n============================", prop.skill_markdown);

        assert_eq!(prop.skill_slug, "cortex-billingengine");
        assert!(prop.skill_markdown.contains("Prohibido usar flotantes IEEE 754 para dinero"));
        assert!(prop.skill_markdown.contains("soft-delete obligatorio"));
        assert!(prop.skill_markdown.contains("**Aritmética Monetaria Exacta:**"));
        // Verificar que NO incluyó variables de código pegado, ni hashes de commit, ni links file:///
        assert!(!prop.skill_markdown.contains("BAD_FLOAT_VAR"));
        assert!(!prop.skill_markdown.contains("34ed1ed"));
        assert!(!prop.skill_markdown.contains("file:///"));
    }

    #[test]
    fn evolves_curated_skill_non_destructively() {
        let conn = setup_memory_db();

        // 1. Registrar que cortex-kaboom ya fue aprobada previamente con 5 hits
        conn.execute(
            "INSERT INTO cortex_proposals (id, topic, title, reason, skill_slug, skill_markdown, profile_note, hit_count, status, created_at)
             VALUES ('prop_cortex-kaboom', 'kaboom', 'Especialización Autónoma: kaboom', 'Base', 'cortex-kaboom', 'Base', 'Note', 5, 'approved', '1700000000')",
            [],
        )
        .unwrap();

        // 2. Con +2 hits (total 7 < 5 + 5), NO debe disparar spam de re-evolución
        let too_early = upsert_or_evolve_proposal(
            &conn,
            "kaboom",
            "Concepto / Dominio",
            7,
            2,
            "Muestra el tablero",
            "1700000100",
            5,
        );
        assert!(too_early.is_none(), "No debe re-evolucionar antes de cumplir el delta mínimo de +5 señales");

        // 3. Simular nuevas directrices del operador sobre Kaboom y cruzar a 10 hits (+5 nuevas)
        conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, context, created_at)
             VALUES ('mk1', 's1', 'user', 'Recuerda: en Kaboom solo commits en ingles y siempre trabajamos en ramas antes de hacer merge.', 'Kaboom', '2026-11-14T11:00:00Z')",
            [],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO chat_messages (id, session_id, role, content, context, created_at)
             VALUES ('mk2', 's1', 'assistant', '- **Validación de Concurrencia:** Bloqueo optimista mediante campo `version INT` en cada movimiento de tarjeta.', 'Kaboom', '2026-11-14T11:00:05Z')",
            [],
        )
        .unwrap();

        let evolved = upsert_or_evolve_proposal(
            &conn,
            "kaboom",
            "Concepto / Dominio",
            10,
            3,
            "Recuerda: en Kaboom solo commits en ingles",
            "1700000200",
            5,
        )
        .expect("Debe disparar evolución al acumular +5 nuevas señales");

        println!("\n=== SKILL EVOLUCIONADA (NO-DESTRUCTIVA) ===\n{}\n===========================================", evolved.skill_markdown);

        assert!(evolved.title.starts_with("Evolución Autónoma: kaboom (+5 nuevas)"));
        // Verificar que conserva intactas las secciones curadas de cortex-kaboom/SKILL.md en disco
        assert!(evolved.skill_markdown.contains("## 2. Directrices Obligatorias de Ingeniería"));
        assert!(evolved.skill_markdown.contains("HTTP 409 Conflict"));
        // Y que anexó limpiamente la nueva sección incremental de Cortex con la regla recién capturada
        assert!(evolved.skill_markdown.contains(CORTEX_SECTION_HEADER));
        assert!(evolved.skill_markdown.contains("en Kaboom solo commits en ingles"));
        assert!(evolved.skill_markdown.contains("**Validación de Concurrencia:**"));
    }
}
