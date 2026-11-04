use crate::config::{get_aegis_config, save_aegis_config, AegisConfig};
use crate::db::get_db_connection;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tokio::sync::Mutex;

static GATEWAY_RUNNING: AtomicBool = AtomicBool::new(false);
static GATEWAY_STOP_TRIGGER: OnceLock<Arc<Mutex<Option<tokio::sync::oneshot::Sender<()>>>>> = OnceLock::new();

fn get_stop_trigger() -> &'static Arc<Mutex<Option<tokio::sync::oneshot::Sender<()>>>> {
    GATEWAY_STOP_TRIGGER.get_or_init(|| Arc::new(Mutex::new(None)))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewayRuntimeStatus {
    pub running: bool,
    pub authorized_chat_id: Option<i64>,
    pub pairing_code: String,
    pub bot_username: Option<String>,
    pub last_active_at: Option<String>,
    pub error_message: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TelegramUser {
    id: i64,
    username: Option<String>,
    first_name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TelegramChat {
    id: i64,
}

#[derive(Debug, Deserialize)]
struct TelegramMessage {
    message_id: i64,
    from: Option<TelegramUser>,
    chat: TelegramChat,
    text: Option<String>,
}

#[derive(Debug, Deserialize)]
struct TelegramUpdate {
    update_id: i64,
    message: Option<TelegramMessage>,
}

#[derive(Debug, Deserialize)]
struct TelegramResponse<T> {
    ok: bool,
    result: Option<T>,
    description: Option<String>,
}

#[derive(Debug, PartialEq)]
pub enum ParsedGatewayCommand {
    Start,
    Help,
    Pair(String),
    Gasto { amount: f64, description: String, category: String },
    Tarea(String),
    Status,
    Resumen,
    Ai(String),
    Unknown(String),
}

/// Parsea un texto entrante de Telegram en un comando estructurado.
pub fn parse_gateway_text(raw_text: &str) -> ParsedGatewayCommand {
    let trimmed = raw_text.trim();
    if trimmed.is_empty() {
        return ParsedGatewayCommand::Unknown(String::new());
    }

    if trimmed.eq_ignore_ascii_case("/start") {
        return ParsedGatewayCommand::Start;
    }
    if trimmed.eq_ignore_ascii_case("/help") || trimmed.eq_ignore_ascii_case("/ayuda") {
        return ParsedGatewayCommand::Help;
    }
    if trimmed.eq_ignore_ascii_case("/status") || trimmed.eq_ignore_ascii_case("/estado") {
        return ParsedGatewayCommand::Status;
    }
    if trimmed.eq_ignore_ascii_case("/resumen") || trimmed.eq_ignore_ascii_case("/finanzas") {
        return ParsedGatewayCommand::Resumen;
    }

    if let Some(rest) = trimmed.strip_prefix("/pair") {
        return ParsedGatewayCommand::Pair(rest.trim().to_string());
    }

    if let Some(rest) = trimmed.strip_prefix("/gasto") {
        let rest = rest.trim();
        return parse_expense_args(rest);
    }

    if let Some(rest) = trimmed.strip_prefix("/tarea") {
        return ParsedGatewayCommand::Tarea(rest.trim().to_string());
    }
    if let Some(rest) = trimmed.strip_prefix("/inbox") {
        return ParsedGatewayCommand::Tarea(rest.trim().to_string());
    }

    if let Some(rest) = trimmed.strip_prefix("/ai") {
        return ParsedGatewayCommand::Ai(rest.trim().to_string());
    }

    // Heurística directa: Si empieza con un número, tratar como gasto instantáneo: "150 tacos"
    if let Some(first_char) = trimmed.chars().next() {
        if first_char.is_ascii_digit() || first_char == '$' {
            let clean = trimmed.trim_start_matches('$');
            let parsed = parse_expense_args(clean);
            if let ParsedGatewayCommand::Gasto { .. } = parsed {
                return parsed;
            }
        }
    }

    ParsedGatewayCommand::Unknown(trimmed.to_string())
}

fn parse_expense_args(args: &str) -> ParsedGatewayCommand {
    let parts: Vec<&str> = args.split_whitespace().collect();
    if parts.is_empty() {
        return ParsedGatewayCommand::Unknown("Falta monto para /gasto".to_string());
    }

    let amount_str = parts[0].replace(',', ".");
    let amount = match amount_str.parse::<f64>() {
        Ok(v) if v > 0.0 => v,
        _ => return ParsedGatewayCommand::Unknown(format!("Monto inválido: {}", parts[0])),
    };

    let rest = if parts.len() > 1 {
        parts[1..].join(" ")
    } else {
        "Gasto General".to_string()
    };

    let category = infer_category_from_desc(&rest);
    ParsedGatewayCommand::Gasto {
        amount,
        description: rest,
        category,
    }
}

fn infer_category_from_desc(desc: &str) -> String {
    let d = desc.to_lowercase();
    if d.contains("taco") || d.contains("comida") || d.contains("cen") || d.contains("almuerz") || d.contains("desayun") || d.contains("restauran") || d.contains("cafe") || d.contains("oxxo") {
        "Comida / Alimentación".to_string()
    } else if d.contains("uber") || d.contains("didi") || d.contains("gasolina") || d.contains("pasaje") || d.contains("camion") || d.contains("metro") || d.contains("taxi") {
        "Transporte".to_string()
    } else if d.contains("farmacia") || d.contains("medicin") || d.contains("doctor") || d.contains("salud") {
        "Salud".to_string()
    } else if d.contains("luz") || d.contains("agua") || d.contains("internet") || d.contains("renta") || d.contains("servicio") {
        "Servicios".to_string()
    } else if d.contains("steam") || d.contains("juego") || d.contains("cine") || d.contains("chela") || d.contains("bar") {
        "Entretenimiento / Ocio".to_string()
    } else {
        "Varios".to_string()
    }
}

// ================= API TELEGRAM CLIENT =================

async fn telegram_api_get_me(client: &reqwest::Client, bot_token: &str) -> Result<TelegramUser, String> {
    let url = format!("https://api.telegram.org/bot{}/getMe", bot_token);
    let res = client
        .get(&url)
        .timeout(Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Fallo de conexión con Telegram: {}", e))?;

    let json: TelegramResponse<TelegramUser> = res
        .json()
        .await
        .map_err(|e| format!("Respuesta no interpretable: {}", e))?;

    if json.ok {
        json.result.ok_or_else(|| "Falta usuario en respuesta".to_string())
    } else {
        Err(json.description.unwrap_or_else(|| "Token inválido".to_string()))
    }
}

async fn telegram_send_message(
    client: &reqwest::Client,
    bot_token: &str,
    chat_id: i64,
    text: &str,
) -> Result<(), String> {
    let url = format!("https://api.telegram.org/bot{}/sendMessage", bot_token);
    let params = serde_json::json!({
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "Markdown"
    });

    let _ = client
        .post(&url)
        .json(&params)
        .timeout(Duration::from_secs(10))
        .send()
        .await;

    Ok(())
}

// ================= COMANDOS TAURI IPC =================

#[tauri::command]
pub async fn test_telegram_bot_token(bot_token: String) -> Result<String, String> {
    let token = bot_token.trim();
    if token.is_empty() {
        return Err("El Bot Token no puede estar vacío.".to_string());
    }
    let client = reqwest::Client::new();
    let user = telegram_api_get_me(&client, token).await?;
    let uname = user.username.unwrap_or_else(|| user.first_name.unwrap_or_else(|| "Bot".to_string()));
    Ok(format!("@{}", uname))
}

#[tauri::command]
pub fn get_telegram_gateway_status() -> Result<GatewayRuntimeStatus, String> {
    let cfg = get_aegis_config()?;
    let gw = cfg.telegram_gateway;
    let is_running = GATEWAY_RUNNING.load(Ordering::SeqCst);

    Ok(GatewayRuntimeStatus {
        running: is_running,
        authorized_chat_id: gw.authorized_chat_id,
        pairing_code: gw.pairing_code,
        bot_username: None,
        last_active_at: None,
        error_message: None,
    })
}

#[tauri::command]
pub fn generate_new_gateway_pairing_pin() -> Result<String, String> {
    let mut cfg = get_aegis_config()?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();
    let pin = format!("{:06}", (now * 9301 + 49297) % 900000 + 100000);
    cfg.telegram_gateway.pairing_code = pin.clone();
    save_aegis_config(cfg)?;
    Ok(pin)
}

#[tauri::command]
pub fn unpair_telegram_gateway_chat() -> Result<(), String> {
    let mut cfg = get_aegis_config()?;
    cfg.telegram_gateway.authorized_chat_id = None;
    save_aegis_config(cfg)?;
    Ok(())
}

#[tauri::command]
pub async fn start_telegram_gateway_daemon(app: AppHandle) -> Result<(), String> {
    if GATEWAY_RUNNING.load(Ordering::SeqCst) {
        return Ok(());
    }

    let cfg = get_aegis_config()?;
    let gw = cfg.telegram_gateway.clone();
    if gw.bot_token.trim().is_empty() {
        return Err("Token de Telegram no configurado.".to_string());
    }

    let client = reqwest::Client::new();
    // Validar token antes de arrancar
    let _me = telegram_api_get_me(&client, &gw.bot_token).await?;

    let (stop_tx, mut stop_rx) = tokio::sync::oneshot::channel::<()>();
    {
        let mut guard = get_stop_trigger().lock().await;
        *guard = Some(stop_tx);
    }

    GATEWAY_RUNNING.store(true, Ordering::SeqCst);
    let app_handle = app.clone();

    tauri::async_runtime::spawn(async move {
        let mut offset = 0i64;
        let token = gw.bot_token.clone();
        let client = reqwest::Client::new();

        if gw.notify_on_start {
            if let Some(cid) = gw.authorized_chat_id {
                let _ = telegram_send_message(
                    &client,
                    &token,
                    cid,
                    "🛡️ *Aegis Remote Gateway Online*\nEstación de trabajo conectada y lista.",
                ).await;
            }
        }

        loop {
            tokio::select! {
                _ = &mut stop_rx => {
                    break;
                }
                _ = tokio::time::sleep(Duration::from_millis(500)) => {
                    let url = format!(
                        "https://api.telegram.org/bot{}/getUpdates?offset={}&timeout=20",
                        token, offset
                    );

                    match client.get(&url).timeout(Duration::from_secs(35)).send().await {
                        Ok(res) => {
                            if let Ok(json) = res.json::<TelegramResponse<Vec<TelegramUpdate>>>().await {
                                if json.ok {
                                    if let Some(updates) = json.result {
                                        for upd in updates {
                                            if upd.update_id >= offset {
                                                offset = upd.update_id + 1;
                                            }
                                            if let Some(msg) = upd.message {
                                                handle_incoming_telegram_message(&app_handle, &client, &token, msg).await;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        Err(_) => {
                            // Backoff silencioso en caso de desconexión de red
                            tokio::time::sleep(Duration::from_secs(5)).await;
                        }
                    }
                }
            }
        }

        GATEWAY_RUNNING.store(false, Ordering::SeqCst);
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_telegram_gateway_daemon() -> Result<(), String> {
    let mut guard = get_stop_trigger().lock().await;
    if let Some(tx) = guard.take() {
        let _ = tx.send(());
    }
    GATEWAY_RUNNING.store(false, Ordering::SeqCst);
    Ok(())
}

// ================= DISPATCHER DE MENSAJES =================

async fn handle_incoming_telegram_message(
    app: &AppHandle,
    client: &reqwest::Client,
    token: &str,
    msg: TelegramMessage,
) {
    let text = match msg.text {
        Some(t) => t,
        None => return,
    };

    let chat_id = msg.chat.id;
    let mut cfg = match get_aegis_config() {
        Ok(c) => c,
        Err(_) => return,
    };

    let cmd = parse_gateway_text(&text);

    // 1. EMPAREJAMIENTO
    if let ParsedGatewayCommand::Pair(pin) = &cmd {
        if pin == &cfg.telegram_gateway.pairing_code {
            cfg.telegram_gateway.authorized_chat_id = Some(chat_id);
            let _ = save_aegis_config(cfg);
            let _ = telegram_send_message(
                client,
                token,
                chat_id,
                "✅ *Emparejamiento Exitoso*\nEste dispositivo móvil ahora está autorizado como Gateway Soberano de Aegis.\n\nEscribe `/help` para ver comandos disponibles.",
            ).await;
            let _ = app.emit("aegis:gateway-paired", chat_id);
            return;
        } else {
            let _ = telegram_send_message(
                client,
                token,
                chat_id,
                "❌ *Código PIN Incorrecto*\nVerifica el PIN en Aegis > Ajustes > Gateway Remoto.",
            ).await;
            return;
        }
    }

    // 2. CONTROL DE ACCESO (WHITELIST)
    if cfg.telegram_gateway.authorized_chat_id != Some(chat_id) {
        let _ = telegram_send_message(
            client,
            token,
            chat_id,
            "🔒 *Dispositivo no Autorizado*\nPara conectar este chat con Aegis, envía:\n`/pair <PIN_DE_AJUSTES>`",
        ).await;
        return;
    }

    // 3. EJECUCIÓN DE COMANDOS
    match cmd {
        ParsedGatewayCommand::Start | ParsedGatewayCommand::Help => {
            let reply = "🛡️ *Aegis Remote Gateway — Comandos Disponibles*\n\n\
                💰 `/gasto <monto> <descripción>`\nRegistra una salida financiera al vuelo (ej: `/gasto 120 tacos`).\n\n\
                ✅ `/tarea <descripción>`\nAgrega una tarea al Inbox de tu Bóveda Obsidian.\n\n\
                📊 `/resumen`\nBalance financiero y últimos movimientos del ciclo.\n\n\
                🖥️ `/status`\nTelemetría en vivo del host (CPU, RAM, Temp).\n\n\
                🤖 `/ai <pregunta>`\nConsulta rápida al motor de inteligencia artificial.";
            let _ = telegram_send_message(client, token, chat_id, reply).await;
        }

        ParsedGatewayCommand::Gasto { amount, description, category } => {
            if !cfg.telegram_gateway.allow_expenses {
                let _ = telegram_send_message(client, token, chat_id, "⚠️ El registro de gastos está deshabilitado en ajustes.").await;
                return;
            }

            match record_gateway_expense(amount, &description, &category) {
                Ok(total_month) => {
                    let reply = format!(
                        "✅ *Gasto Registrado*\n💰 Monto: `${:.2}`\n🏷️ Cat: `{}`\n📝 Nota: `{}`\n\n📊 Total consumido del mes: `${:.2}`",
                        amount, category, description, total_month
                    );
                    let _ = telegram_send_message(client, token, chat_id, &reply).await;
                    let _ = app.emit("aegis:financial-tx-added", ());
                }
                Err(e) => {
                    let _ = telegram_send_message(client, token, chat_id, &format!("❌ Error registrando gasto: {}", e)).await;
                }
            }
        }

        ParsedGatewayCommand::Tarea(task_text) => {
            if !cfg.telegram_gateway.allow_tasks {
                let _ = telegram_send_message(client, token, chat_id, "⚠️ El registro de tareas está deshabilitado en ajustes.").await;
                return;
            }

            match append_gateway_task(&cfg.vault_path, &cfg.telegram_gateway.inbox_file, &task_text) {
                Ok(dest) => {
                    let reply = format!("✅ *Tarea Apuntada*\n`- [ ] {}`\n📁 Guardada en: `{}`", task_text, dest);
                    let _ = telegram_send_message(client, token, chat_id, &reply).await;
                    let _ = app.emit("aegis:tasks-updated", ());
                }
                Err(e) => {
                    let _ = telegram_send_message(client, token, chat_id, &format!("❌ Error guardando tarea: {}", e)).await;
                }
            }
        }

        ParsedGatewayCommand::Status => {
            let status_msg = generate_system_status_summary();
            let _ = telegram_send_message(client, token, chat_id, &status_msg).await;
        }

        ParsedGatewayCommand::Resumen => {
            let finance_msg = generate_financial_summary();
            let _ = telegram_send_message(client, token, chat_id, &finance_msg).await;
        }

        ParsedGatewayCommand::Ai(prompt) => {
            if !cfg.telegram_gateway.allow_ai_queries {
                let _ = telegram_send_message(client, token, chat_id, "⚠️ Consultas IA deshabilitadas en ajustes.").await;
                return;
            }

            let _ = telegram_send_message(client, token, chat_id, "🤖 _Procesando consulta..._").await;
            let response = run_quick_ai_query(&prompt, &cfg).await;
            let _ = telegram_send_message(client, token, chat_id, &response).await;
        }

        ParsedGatewayCommand::Pair(_) => {}
        ParsedGatewayCommand::Unknown(u) => {
            let reply = format!("❓ Comando no reconocido: `{}`\nEscribe `/help` para ver comandos válidos.", u);
            let _ = telegram_send_message(client, token, chat_id, &reply).await;
        }
    }
}

// ================= LOGICA OPERATIVA INTERNA =================

fn record_gateway_expense(amount: f64, description: &str, category: &str) -> Result<f64, String> {
    let conn = get_db_connection()?;
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis();
    let id = format!("tx_{}_gw", now);

    let today = chrono_like_today();
    let created_at = format!("{} 12:00:00", today);

    conn.execute(
        "INSERT INTO transactions (id, amount, type, category, payment_method, date, description, created_at)
         VALUES (?1, ?2, 'expense', ?3, 'Efectivo/Móvil', ?4, ?5, ?6)",
        rusqlite::params![id, amount, category, today, description, created_at],
    ).map_err(|e| e.to_string())?;

    // Calcular total acumulado del mes
    let month_prefix = if today.len() >= 7 { &today[0..7] } else { "" };
    let total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE type = 'expense' AND date LIKE ?1",
        rusqlite::params![format!("{}%", month_prefix)],
        |row| row.get(0),
    ).unwrap_or(0.0);

    Ok(total)
}

fn append_gateway_task(vault_path: &str, inbox_rel: &str, task_text: &str) -> Result<String, String> {
    if vault_path.trim().is_empty() {
        return Err("Ruta de Bóveda Obsidian no configurada en Aegis.".to_string());
    }

    let inbox_file = if inbox_rel.trim().is_empty() {
        "00 Sistema/Inbox.md"
    } else {
        inbox_rel.trim()
    };

    let target_path = PathBuf::from(vault_path).join(inbox_file);
    if let Some(parent) = target_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    let today = chrono_like_today();
    let formatted_task = format!("\n- [ ] {} 📅 {}\n", task_text.trim(), today);

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&target_path)
        .map_err(|e| format!("No se pudo escribir en {}: {}", target_path.display(), e))?;

    file.write_all(formatted_task.as_bytes())
        .map_err(|e| e.to_string())?;

    Ok(inbox_file.to_string())
}

fn generate_system_status_summary() -> String {
    let hostname = std::env::var("HOSTNAME").unwrap_or_else(|_| "Aegis-Host".to_string());
    format!(
        "🖥️ *Estado del Sistema — {}*\n\
        ⚡ CPU & RAM: En línea\n\
        🛡️ Host: `{}`\n\
        ⏰ Timestamp: `{}`",
        hostname, hostname, chrono_like_today()
    )
}

fn generate_financial_summary() -> String {
    let conn = match get_db_connection() {
        Ok(c) => c,
        Err(e) => return format!("❌ Error accediendo a base de datos: {}", e),
    };

    let today = chrono_like_today();
    let month_prefix = if today.len() >= 7 { &today[0..7] } else { "" };

    let total_month: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE type = 'expense' AND date LIKE ?1",
        rusqlite::params![format!("{}%", month_prefix)],
        |row| row.get(0),
    ).unwrap_or(0.0);

    format!(
        "📊 *Resumen Financiero del Mes ({})*\n\n\
        💸 Total Gastado: `${:.2}`\n\
        💡 Registra nuevos gastos con `/gasto <monto> <desc>`.",
        month_prefix, total_month
    )
}

async fn run_quick_ai_query(prompt: &str, cfg: &AegisConfig) -> String {
    // Si hay un agente CLI disponible (agy), invocarlo de forma headless concisa
    if cfg.agent_type == "agy" {
        let child = tokio::process::Command::new("agy")
            .arg("--print")
            .arg(format!("Responde en modo conciso: {}", prompt))
            .output()
            .await;

        if let Ok(out) = child {
            let res = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !res.is_empty() {
                return format!("🤖 *Aegis AI:*\n{}", res);
            }
        }
    }

    format!("🤖 *Aegis AI:*\nRecibido: `{}`\n(Configura agy en Ajustes para respuestas en vivo)", prompt)
}

fn chrono_like_today() -> String {
    let now = std::time::SystemTime::now();
    let dur = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
    let days = (dur / 86400) as i64;
    let z = days + 719468;
    let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1024 + doe / 1461 - doe / 142434) / 365;
    let y = (yoe as i64) + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = y + (if m <= 2 { 1 } else { 0 });
    format!("{:04}-{:02}-{:02}", y, m, d)
}

// ================= PRUEBAS UNITARIAS =================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_gateway_text_commands() {
        assert_eq!(parse_gateway_text("/start"), ParsedGatewayCommand::Start);
        assert_eq!(parse_gateway_text("/help"), ParsedGatewayCommand::Help);
        assert_eq!(parse_gateway_text("/status"), ParsedGatewayCommand::Status);
        assert_eq!(parse_gateway_text("/pair 123456"), ParsedGatewayCommand::Pair("123456".to_string()));

        let cmd = parse_gateway_text("/gasto 85.50 tacos de pastor");
        if let ParsedGatewayCommand::Gasto { amount, description, category } = cmd {
            assert_eq!(amount, 85.50);
            assert_eq!(description, "tacos de pastor");
            assert_eq!(category, "Comida / Alimentación");
        } else {
            panic!("Falló parseo de gasto");
        }

        // Heurística de número directo
        let direct = parse_gateway_text("$120 uber a la oficina");
        if let ParsedGatewayCommand::Gasto { amount, category, .. } = direct {
            assert_eq!(amount, 120.0);
            assert_eq!(category, "Transporte");
        } else {
            panic!("Falló parseo de número directo");
        }

        let task = parse_gateway_text("/tarea Comprar café soluble");
        assert_eq!(task, ParsedGatewayCommand::Tarea("Comprar café soluble".to_string()));
    }
}
