use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

const DB_DIR: &str = "/home/zabrielsa/.local/share/aegis";
const DB_PATH: &str = "/home/zabrielsa/.local/share/aegis/aegis_lifeos.db";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transaction {
    pub id: String,
    pub amount: f64,
    pub r#type: String,
    pub category: String,
    pub payment_method: String,
    pub date: String,
    pub description: Option<String>,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimelineEvent {
    pub id: String,
    pub title: String,
    pub domain: String,
    pub event_type: String,
    pub date: String,
    pub time: Option<String>,
    pub location: Option<String>,
    pub details: Option<String>,
    pub status: String,
    pub priority: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotItem {
    pub id: String,
    pub timestamp: i64,
    pub date: String,
    pub transactions_count: usize,
    pub data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct BackupPayload {
    pub transactions: Vec<Transaction>,
    pub budgets: Option<HashMap<String, f64>>,
    pub categories: Option<Vec<String>>,
    pub timeline_events: Option<Vec<TimelineEvent>>,
    pub version: Option<String>,
    pub exported_at: Option<String>,
}

fn get_db_connection() -> Result<Connection, String> {
    if !Path::new(DB_DIR).exists() {
        fs::create_dir_all(DB_DIR).map_err(|e| format!("Error creando carpeta {}: {}", DB_DIR, e))?;
    }
    let conn = Connection::open(DB_PATH).map_err(|e| format!("Error abriendo SQLite {}: {}", DB_PATH, e))?;
    init_db_schema(&conn)?;
    Ok(conn)
}

fn init_db_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

        CREATE TABLE IF NOT EXISTS budgets (
            category TEXT PRIMARY KEY,
            amount REAL NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            name TEXT PRIMARY KEY,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS snapshots (
            id TEXT PRIMARY KEY,
            timestamp INTEGER NOT NULL,
            date TEXT NOT NULL,
            transactions_count INTEGER NOT NULL,
            data_json TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS timeline_events (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            domain TEXT NOT NULL,
            event_type TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT,
            location TEXT,
            details TEXT,
            status TEXT NOT NULL,
            priority TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON timeline_events(date);
        ",
    )
    .map_err(|e| format!("Error inicializando tablas SQLite: {}", e))?;

    // Seed categorías si está vacía
    let cat_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM categories", [], |r| r.get(0))
        .unwrap_or(0);

    if cat_count == 0 {
        let defaults = [
            "Comida & Bebida",
            "Vivienda & Renta",
            "Servicios (Luz, Internet, etc.)",
            "Transporte & Gasolina",
            "Salud & Médico",
            "Entretenimiento & Ocio",
            "Suscripciones",
            "Educación & Certs",
            "Nómina MELI",
            "Ingresos TADÚ",
            "Otros",
        ];
        for cat in defaults {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO categories (name, created_at) VALUES (?1, datetime('now'))",
                params![cat],
            );
        }
    }

    // Seed timeline maestro si está vacía
    let event_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM timeline_events", [], |r| r.get(0))
        .unwrap_or(0);

    if event_count == 0 {
        let seed_events = [
            (
                "evt_meli_cierre",
                "Cierre de Ciclo Facturación MELI",
                "meli",
                "cierre_ciclo",
                "2026-11-22",
                Some("18:00"),
                Some("Hub Last Mile MELI"),
                Some("Corte financiero quincenal, exportación de horas extra y conciliación."),
                "pending",
                "high",
            ),
            (
                "evt_meli_layout",
                "Auditoría Layout & Ambulancias",
                "meli",
                "shift",
                "2026-10-28",
                Some("06:30"),
                Some("Nave Operativa C1/C2"),
                Some("Balanceo de 4 islas, control HandHeld/BPP y rescate de paquetes."),
                "pending",
                "medium",
            ),
            (
                "evt_tadu_sprint",
                "Sprint Review SAM Backend & DynamoDB",
                "tadu",
                "sprint",
                "2026-10-29",
                Some("10:00"),
                Some("Localhost / AWS SAM"),
                Some("Tests pytest de latencia en Lambdas Python 3.12 y validación Single-Table."),
                "pending",
                "high",
            ),
            (
                "evt_aws_exam",
                "Simulacro Certificación AWS Developer",
                "certs",
                "exam",
                "2026-10-31",
                Some("16:00"),
                Some("Estudio Personal"),
                Some("Simulacro cronometrado 65 preguntas y repaso de flashcards en Obsidian."),
                "pending",
                "high",
            ),
            (
                "evt_uni_entrega",
                "Entrega Proyecto Modular Ingeniería",
                "uni",
                "delivery",
                "2026-11-03",
                Some("23:59"),
                Some("Portal Universidad"),
                Some("Subida de memoria técnica, arquitectura C4 y manuales de usuario."),
                "pending",
                "medium",
            ),
        ];

        for evt in seed_events {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO timeline_events 
                 (id, title, domain, event_type, date, time, location, details, status, priority, created_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'))",
                params![
                    evt.0, evt.1, evt.2, evt.3, evt.4, evt.5, evt.6, evt.7, evt.8, evt.9
                ],
            );
        }
    }

    Ok(())
}

// ================= TRANSACCIONES =================

#[tauri::command]
pub fn sqlite_get_transactions() -> Result<Vec<Transaction>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, amount, type, category, payment_method, date, description, created_at FROM transactions ORDER BY date DESC, created_at DESC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Transaction {
                id: row.get(0)?,
                amount: row.get(1)?,
                r#type: row.get(2)?,
                category: row.get(3)?,
                payment_method: row.get(4)?,
                date: row.get(5)?,
                description: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        if let Ok(tx) = r {
            list.push(tx);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn sqlite_save_transaction(mut tx: Transaction) -> Result<Vec<Transaction>, String> {
    let conn = get_db_connection()?;
    if tx.id.trim().is_empty() {
        tx.id = format!("tx_{}_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis(), fastrand_suffix());
    }
    let created_at = tx.created_at.clone().unwrap_or_else(|| chrono_like_now());

    conn.execute(
        "INSERT INTO transactions (id, amount, type, category, payment_method, date, description, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET
            amount = excluded.amount,
            type = excluded.type,
            category = excluded.category,
            payment_method = excluded.payment_method,
            date = excluded.date,
            description = excluded.description",
        params![
            tx.id,
            tx.amount,
            tx.r#type,
            tx.category,
            tx.payment_method,
            tx.date,
            tx.description,
            created_at
        ],
    )
    .map_err(|e| format!("Error guardando transacción {}: {}", tx.id, e))?;

    sqlite_get_transactions()
}

#[tauri::command]
pub fn sqlite_delete_transaction(id: String) -> Result<Vec<Transaction>, String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM transactions WHERE id = ?1", params![id])
        .map_err(|e| format!("Error eliminando transacción {}: {}", id, e))?;
    sqlite_get_transactions()
}

// ================= PRESUPUESTOS =================

#[tauri::command]
pub fn sqlite_get_budgets() -> Result<HashMap<String, f64>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT category, amount FROM budgets")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, f64>(1)?)))
        .map_err(|e| e.to_string())?;

    let mut map = HashMap::new();
    for r in rows {
        if let Ok((cat, amt)) = r {
            map.insert(cat, amt);
        }
    }
    Ok(map)
}

#[tauri::command]
pub fn sqlite_save_budget(category: String, amount: f64) -> Result<HashMap<String, f64>, String> {
    let conn = get_db_connection()?;
    conn.execute(
        "INSERT INTO budgets (category, amount, updated_at) VALUES (?1, ?2, datetime('now'))
         ON CONFLICT(category) DO UPDATE SET amount = excluded.amount, updated_at = datetime('now')",
        params![category, amount],
    )
    .map_err(|e| format!("Error guardando presupuesto {}: {}", category, e))?;

    sqlite_get_budgets()
}

#[tauri::command]
pub fn sqlite_delete_budget(category: String) -> Result<HashMap<String, f64>, String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM budgets WHERE category = ?1", params![category])
        .map_err(|e| format!("Error eliminando presupuesto {}: {}", category, e))?;
    sqlite_get_budgets()
}

// ================= CATEGORÍAS =================

#[tauri::command]
pub fn sqlite_get_categories() -> Result<Vec<String>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT name FROM categories ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        if let Ok(cat) = r {
            list.push(cat);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn sqlite_add_category(category: String) -> Result<Vec<String>, String> {
    let trimmed = category.trim().to_string();
    if !trimmed.is_empty() {
        let conn = get_db_connection()?;
        let _ = conn.execute(
            "INSERT OR IGNORE INTO categories (name, created_at) VALUES (?1, datetime('now'))",
            params![trimmed],
        );
    }
    sqlite_get_categories()
}

#[tauri::command]
pub fn sqlite_update_category(old_name: String, new_name: String) -> Result<Vec<String>, String> {
    let trimmed_new = new_name.trim().to_string();
    if trimmed_new.is_empty() || old_name == trimmed_new {
        return sqlite_get_categories();
    }
    let conn = get_db_connection()?;
    conn.execute("INSERT OR IGNORE INTO categories (name, created_at) VALUES (?1, datetime('now'))", params![trimmed_new])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM categories WHERE name = ?1", params![old_name])
        .map_err(|e| e.to_string())?;
    let _ = conn.execute("UPDATE transactions SET category = ?1 WHERE category = ?2", params![trimmed_new, old_name]);
    let _ = conn.execute("UPDATE budgets SET category = ?1 WHERE category = ?2", params![trimmed_new, old_name]);

    sqlite_get_categories()
}

#[tauri::command]
pub fn sqlite_delete_category(category: String) -> Result<Vec<String>, String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM categories WHERE name = ?1", params![category])
        .map_err(|e| e.to_string())?;
    let _ = conn.execute("INSERT OR IGNORE INTO categories (name, created_at) VALUES ('Otros', datetime('now'))", []);
    let _ = conn.execute("UPDATE transactions SET category = 'Otros' WHERE category = ?1", params![category]);
    let _ = conn.execute("DELETE FROM budgets WHERE category = ?1", params![category]);

    sqlite_get_categories()
}

// ================= SNAPSHOTS & AUTO-RESPALDOS =================

#[tauri::command]
pub fn sqlite_get_snapshots() -> Result<Vec<SnapshotItem>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, timestamp, date, transactions_count, data_json FROM snapshots ORDER BY timestamp DESC LIMIT 10")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let data_str: String = row.get(4)?;
            let parsed_json = serde_json::from_str(&data_str).unwrap_or(serde_json::Value::Null);
            Ok(SnapshotItem {
                id: row.get(0)?,
                timestamp: row.get(1)?,
                date: row.get(2)?,
                transactions_count: row.get::<_, i64>(3)? as usize,
                data: parsed_json,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        if let Ok(snap) = r {
            list.push(snap);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn sqlite_create_snapshot() -> Result<(), String> {
    let conn = get_db_connection()?;
    let txs = sqlite_get_transactions()?;
    let budgets = sqlite_get_budgets()?;
    let categories = sqlite_get_categories()?;

    let now_millis = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64;

    let date_str = chrono_like_today();

    let full_data = serde_json::json!({
        "transactions": txs,
        "budgets": budgets,
        "categories": categories,
    });

    let data_json = serde_json::to_string(&full_data).map_err(|e| e.to_string())?;
    let snap_id = format!("snap_{}", now_millis);

    // Si ya existe uno para hoy, sobrescribir
    conn.execute(
        "DELETE FROM snapshots WHERE date = ?1",
        params![date_str],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO snapshots (id, timestamp, date, transactions_count, data_json)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![snap_id, now_millis, date_str, txs.len() as i64, data_json],
    )
    .map_err(|e| e.to_string())?;

    // Mantener solo los últimos 10
    let _ = conn.execute(
        "DELETE FROM snapshots WHERE id NOT IN (SELECT id FROM snapshots ORDER BY timestamp DESC LIMIT 10)",
        [],
    );

    Ok(())
}

#[tauri::command]
pub fn sqlite_restore_snapshot(snapshot_id: String) -> Result<(), String> {
    let conn = get_db_connection()?;
    let data_json: String = conn
        .query_row("SELECT data_json FROM snapshots WHERE id = ?1", params![snapshot_id], |r| r.get(0))
        .map_err(|e| format!("Snapshot no encontrado: {}", e))?;

    let parsed: serde_json::Value = serde_json::from_str(&data_json).map_err(|e| e.to_string())?;

    if let Some(tx_arr) = parsed.get("transactions").and_then(|v| v.as_array()) {
        conn.execute("DELETE FROM transactions", []).map_err(|e| e.to_string())?;
        for t in tx_arr {
            if let Ok(tx) = serde_json::from_value::<Transaction>(t.clone()) {
                let _ = sqlite_save_transaction(tx);
            }
        }
    }

    if let Some(budgets) = parsed.get("budgets").and_then(|v| v.as_object()) {
        conn.execute("DELETE FROM budgets", []).map_err(|e| e.to_string())?;
        for (k, v) in budgets {
            if let Some(amt) = v.as_f64() {
                let _ = sqlite_save_budget(k.clone(), amt);
            }
        }
    }

    Ok(())
}

// ================= TIMELINE MAESTRO CRUZADO (MELI, TADÚ, CERTS, UNI) =================

#[tauri::command]
pub fn sqlite_get_timeline_events() -> Result<Vec<TimelineEvent>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, title, domain, event_type, date, time, location, details, status, priority, created_at FROM timeline_events ORDER BY date ASC, time ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(TimelineEvent {
                id: row.get(0)?,
                title: row.get(1)?,
                domain: row.get(2)?,
                event_type: row.get(3)?,
                date: row.get(4)?,
                time: row.get(5)?,
                location: row.get(6)?,
                details: row.get(7)?,
                status: row.get(8)?,
                priority: row.get(9)?,
                created_at: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        if let Ok(evt) = r {
            list.push(evt);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn sqlite_save_timeline_event(mut event: TimelineEvent) -> Result<Vec<TimelineEvent>, String> {
    let conn = get_db_connection()?;
    if event.id.trim().is_empty() {
        event.id = format!("evt_{}_{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis(), fastrand_suffix());
    }
    let created_at = event.created_at.clone().unwrap_or_else(|| chrono_like_now());

    conn.execute(
        "INSERT INTO timeline_events (id, title, domain, event_type, date, time, location, details, status, priority, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
         ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            domain = excluded.domain,
            event_type = excluded.event_type,
            date = excluded.date,
            time = excluded.time,
            location = excluded.location,
            details = excluded.details,
            status = excluded.status,
            priority = excluded.priority",
        params![
            event.id,
            event.title,
            event.domain,
            event.event_type,
            event.date,
            event.time,
            event.location,
            event.details,
            event.status,
            event.priority,
            created_at
        ],
    )
    .map_err(|e| format!("Error guardando evento {}: {}", event.id, e))?;

    sqlite_get_timeline_events()
}

#[tauri::command]
pub fn sqlite_toggle_timeline_event(id: String, completed: bool) -> Result<Vec<TimelineEvent>, String> {
    let conn = get_db_connection()?;
    let new_status = if completed { "completed" } else { "pending" };
    conn.execute("UPDATE timeline_events SET status = ?1 WHERE id = ?2", params![new_status, id])
        .map_err(|e| format!("Error actualizando estado del evento {}: {}", id, e))?;
    sqlite_get_timeline_events()
}

#[tauri::command]
pub fn sqlite_delete_timeline_event(id: String) -> Result<Vec<TimelineEvent>, String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM timeline_events WHERE id = ?1", params![id])
        .map_err(|e| format!("Error eliminando evento {}: {}", id, e))?;
    sqlite_get_timeline_events()
}

// ================= BACKUPS JSON =================

#[tauri::command]
pub fn sqlite_export_backup() -> Result<String, String> {
    let txs = sqlite_get_transactions()?;
    let budgets = sqlite_get_budgets()?;
    let categories = sqlite_get_categories()?;
    let timeline = sqlite_get_timeline_events()?;

    let payload = serde_json::json!({
        "version": "2.0.0-sqlite",
        "exportedAt": chrono_like_now(),
        "transactions": txs,
        "budgets": budgets,
        "categories": categories,
        "timelineEvents": timeline
    });

    serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn sqlite_import_backup(json_str: String) -> Result<usize, String> {
    let parsed: serde_json::Value = serde_json::from_str(&json_str)
        .map_err(|e| format!("Formato JSON no válido: {}", e))?;

    let tx_arr = parsed
        .get("transactions")
        .and_then(|v| v.as_array())
        .ok_or_else(|| "El archivo no contiene un arreglo 'transactions' válido.".to_string())?;

    let mut imported_count = 0;
    for t in tx_arr {
        if let Ok(tx) = serde_json::from_value::<Transaction>(t.clone()) {
            let _ = sqlite_save_transaction(tx);
            imported_count += 1;
        }
    }

    if let Some(budgets) = parsed.get("budgets").and_then(|v| v.as_object()) {
        for (k, v) in budgets {
            if let Some(amt) = v.as_f64() {
                let _ = sqlite_save_budget(k.clone(), amt);
            }
        }
    }

    if let Some(cats) = parsed.get("categories").and_then(|v| v.as_array()) {
        for c in cats {
            if let Some(s) = c.as_str() {
                let _ = sqlite_add_category(s.to_string());
            }
        }
    }

    if let Some(events) = parsed.get("timelineEvents").and_then(|v| v.as_array()) {
        for e in events {
            if let Ok(evt) = serde_json::from_value::<TimelineEvent>(e.clone()) {
                let _ = sqlite_save_timeline_event(evt);
            }
        }
    }

    Ok(imported_count)
}

// Helpers
fn fastrand_suffix() -> String {
    use std::time::SystemTime;
    let nanos = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().subsec_nanos();
    format!("{:x}", nanos)
}

fn chrono_like_today() -> String {
    // Simple local date representation via /bin/date or safe fallback
    if let Ok(output) = std::process::Command::new("date").arg("+%Y-%m-%d").output() {
        if let Ok(s) = String::from_utf8(output.stdout) {
            let trimmed = s.trim().to_string();
            if !trimmed.is_empty() {
                return trimmed;
            }
        }
    }
    "2026-10-27".to_string()
}

fn chrono_like_now() -> String {
    if let Ok(output) = std::process::Command::new("date").arg("-Iseconds").output() {
        if let Ok(s) = String::from_utf8(output.stdout) {
            let trimmed = s.trim().to_string();
            if !trimmed.is_empty() {
                return trimmed;
            }
        }
    }
    "2026-10-27T19:00:00".to_string()
}
