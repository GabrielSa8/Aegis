use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::db::get_db_connection;

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
#[serde(rename_all = "camelCase")]
pub struct PaymentMethod {
    pub id: String,
    pub name: String,
    pub r#type: String,
    pub color: Option<String>,
    pub cutoff_day: Option<u32>,
    pub payment_day: Option<u32>,
    pub balance: f64,
    pub credit_limit: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MsiPlan {
    pub id: String,
    pub description: String,
    pub payment_method: String,
    pub total_amount: f64,
    pub total_installments: u32,
    pub remaining_installments: u32,
    pub monthly_amount: f64,
    pub start_date: String,
    pub next_due_date: String,
    pub status: String,
    pub category: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RecurringExpense {
    pub id: String,
    pub description: String,
    pub amount: f64,
    pub category: String,
    pub payment_method: String,
    pub frequency: String,
    pub due_day: u32,
    pub auto_approve: bool,
    pub last_paid_date: Option<String>,
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

// ================= V2.2.0: MÉTODOS DE PAGO =================

#[tauri::command]
pub fn sqlite_get_payment_methods() -> Result<Vec<PaymentMethod>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, name, type, color, cutoff_day, payment_day, balance, credit_limit FROM payment_methods ORDER BY type, name")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            let cutoff: Option<i64> = r.get(4)?;
            let pay_day: Option<i64> = r.get(5)?;
            Ok(PaymentMethod {
                id: r.get(0)?,
                name: r.get(1)?,
                r#type: r.get(2)?,
                color: r.get(3)?,
                cutoff_day: cutoff.map(|v| v as u32),
                payment_day: pay_day.map(|v| v as u32),
                balance: r.get(6)?,
                credit_limit: r.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in rows {
        if let Ok(m) = item {
            list.push(m);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn sqlite_save_payment_method(method: PaymentMethod) -> Result<(), String> {
    let conn = get_db_connection()?;
    conn.execute(
        "INSERT INTO payment_methods (id, name, type, color, cutoff_day, payment_day, balance, credit_limit)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            type = excluded.type,
            color = excluded.color,
            cutoff_day = excluded.cutoff_day,
            payment_day = excluded.payment_day,
            balance = excluded.balance,
            credit_limit = excluded.credit_limit",
        params![
            method.id,
            method.name,
            method.r#type,
            method.color,
            method.cutoff_day.map(|v| v as i64),
            method.payment_day.map(|v| v as i64),
            method.balance,
            method.credit_limit
        ],
    )
    .map_err(|e| format!("Error guardando método de pago: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn sqlite_delete_payment_method(id: String) -> Result<(), String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM payment_methods WHERE id = ?1", params![id])
        .map_err(|e| format!("Error eliminando método de pago: {}", e))?;
    Ok(())
}

// ================= V2.2.0: PLANES MSI =================

#[tauri::command]
pub fn sqlite_get_msi_plans() -> Result<Vec<MsiPlan>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, description, payment_method, total_amount, total_installments, remaining_installments, monthly_amount, start_date, next_due_date, status, category FROM msi_plans ORDER BY next_due_date ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            let total_inst: i64 = r.get(4)?;
            let rem_inst: i64 = r.get(5)?;
            Ok(MsiPlan {
                id: r.get(0)?,
                description: r.get(1)?,
                payment_method: r.get(2)?,
                total_amount: r.get(3)?,
                total_installments: total_inst as u32,
                remaining_installments: rem_inst as u32,
                monthly_amount: r.get(6)?,
                start_date: r.get(7)?,
                next_due_date: r.get(8)?,
                status: r.get(9)?,
                category: r.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in rows {
        if let Ok(p) = item {
            list.push(p);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn sqlite_save_msi_plan(plan: MsiPlan) -> Result<(), String> {
    let conn = get_db_connection()?;
    conn.execute(
        "INSERT INTO msi_plans (id, description, payment_method, total_amount, total_installments, remaining_installments, monthly_amount, start_date, next_due_date, status, category)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
         ON CONFLICT(id) DO UPDATE SET
            description = excluded.description,
            payment_method = excluded.payment_method,
            total_amount = excluded.total_amount,
            total_installments = excluded.total_installments,
            remaining_installments = excluded.remaining_installments,
            monthly_amount = excluded.monthly_amount,
            start_date = excluded.start_date,
            next_due_date = excluded.next_due_date,
            status = excluded.status,
            category = excluded.category",
        params![
            plan.id,
            plan.description,
            plan.payment_method,
            plan.total_amount,
            plan.total_installments as i64,
            plan.remaining_installments as i64,
            plan.monthly_amount,
            plan.start_date,
            plan.next_due_date,
            plan.status,
            plan.category
        ],
    )
    .map_err(|e| format!("Error guardando plan MSI: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn sqlite_pay_msi_installment(id: String) -> Result<(), String> {
    let conn = get_db_connection()?;
    let plan = conn.query_row(
        "SELECT id, description, payment_method, remaining_installments, monthly_amount, category FROM msi_plans WHERE id = ?1",
        params![id],
        |r| {
            let rem: i64 = r.get(3)?;
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                rem,
                r.get::<_, f64>(4)?,
                r.get::<_, String>(5)?,
            ))
        },
    ).map_err(|e| format!("Plan MSI no encontrado: {}", e))?;

    let (plan_id, desc, pm, rem, amount, cat) = plan;
    if rem <= 0 {
        return Err("El plan ya está liquidado al 100%".to_string());
    }

    let new_rem = rem - 1;
    let new_status = if new_rem == 0 { "completed" } else { "active" };

    // Registrar transacción de gasto
    let today = chrono_like_today();
    let tx_id = format!("tx_msi_{}_{}", plan_id, fastrand_suffix());
    let tx_desc = format!("Mensualidad MSI: {}", desc);

    conn.execute(
        "INSERT INTO transactions (id, amount, type, category, payment_method, date, description, created_at)
         VALUES (?1, ?2, 'expense', ?3, ?4, ?5, ?6, ?7)",
        params![tx_id, amount, cat, pm, today, tx_desc, chrono_like_now()],
    ).map_err(|e| format!("Error creando transacción de mensualidad: {}", e))?;

    conn.execute(
        "UPDATE msi_plans SET remaining_installments = ?1, status = ?2 WHERE id = ?3",
        params![new_rem, new_status, plan_id],
    ).map_err(|e| format!("Error actualizando cuotas MSI: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn sqlite_delete_msi_plan(id: String) -> Result<(), String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM msi_plans WHERE id = ?1", params![id])
        .map_err(|e| format!("Error eliminando plan MSI: {}", e))?;
    Ok(())
}

// ================= V2.2.0: GASTOS RECURRENTES =================

#[tauri::command]
pub fn sqlite_get_recurring_expenses() -> Result<Vec<RecurringExpense>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare("SELECT id, description, amount, category, payment_method, frequency, due_day, auto_approve, last_paid_date FROM recurring_expenses ORDER BY due_day ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            let due: i64 = r.get(6)?;
            let auto: i64 = r.get(7)?;
            Ok(RecurringExpense {
                id: r.get(0)?,
                description: r.get(1)?,
                amount: r.get(2)?,
                category: r.get(3)?,
                payment_method: r.get(4)?,
                frequency: r.get(5)?,
                due_day: due as u32,
                auto_approve: auto != 0,
                last_paid_date: r.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for item in rows {
        if let Ok(r) = item {
            list.push(r);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn sqlite_save_recurring_expense(item: RecurringExpense) -> Result<(), String> {
    let conn = get_db_connection()?;
    conn.execute(
        "INSERT INTO recurring_expenses (id, description, amount, category, payment_method, frequency, due_day, auto_approve, last_paid_date)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
         ON CONFLICT(id) DO UPDATE SET
            description = excluded.description,
            amount = excluded.amount,
            category = excluded.category,
            payment_method = excluded.payment_method,
            frequency = excluded.frequency,
            due_day = excluded.due_day,
            auto_approve = excluded.auto_approve,
            last_paid_date = excluded.last_paid_date",
        params![
            item.id,
            item.description,
            item.amount,
            item.category,
            item.payment_method,
            item.frequency,
            item.due_day as i64,
            if item.auto_approve { 1 } else { 0 },
            item.last_paid_date
        ],
    )
    .map_err(|e| format!("Error guardando gasto recurrente: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn sqlite_approve_recurring_expense(id: String, date: String) -> Result<Transaction, String> {
    let conn = get_db_connection()?;
    let item = conn.query_row(
        "SELECT id, description, amount, category, payment_method FROM recurring_expenses WHERE id = ?1",
        params![id],
        |r| {
            Ok((
                r.get::<_, String>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, f64>(2)?,
                r.get::<_, String>(3)?,
                r.get::<_, String>(4)?,
            ))
        },
    ).map_err(|e| format!("Gasto recurrente no encontrado: {}", e))?;

    let (item_id, desc, amount, cat, pm) = item;
    let tx_id = format!("tx_rec_{}_{}", item_id, fastrand_suffix());
    let tx_date = if date.trim().is_empty() { chrono_like_today() } else { date };
    let now = chrono_like_now();

    conn.execute(
        "INSERT INTO transactions (id, amount, type, category, payment_method, date, description, created_at)
         VALUES (?1, ?2, 'expense', ?3, ?4, ?5, ?6, ?7)",
        params![tx_id, amount, cat, pm, tx_date, desc, now],
    ).map_err(|e| format!("Error creando transacción para gasto recurrente: {}", e))?;

    conn.execute(
        "UPDATE recurring_expenses SET last_paid_date = ?1 WHERE id = ?2",
        params![tx_date, item_id],
    ).map_err(|e| format!("Error actualizando fecha de pago recurrente: {}", e))?;

    Ok(Transaction {
        id: tx_id,
        amount,
        r#type: "expense".to_string(),
        category: cat,
        payment_method: pm,
        date: tx_date,
        description: Some(desc),
        created_at: Some(now),
    })
}

#[tauri::command]
pub fn sqlite_delete_recurring_expense(id: String) -> Result<(), String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM recurring_expenses WHERE id = ?1", params![id])
        .map_err(|e| format!("Error eliminando gasto recurrente: {}", e))?;
    Ok(())
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
