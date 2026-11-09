use crate::config::{get_aegis_config, save_aegis_config, AegisConfig};
use crate::db::get_db_connection;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, OnceLock};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
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

#[allow(dead_code)]
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

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
struct TelegramMessage {
    message_id: i64,
    date: Option<i64>,
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
    Gasto { amount: f64, raw_desc: String },
    Tarea(String),
    TareasList,
    Status,
    Resumen,
    Lock,
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
    if trimmed.eq_ignore_ascii_case("/tareas") || trimmed.eq_ignore_ascii_case("/pendientes") || trimmed.eq_ignore_ascii_case("/inbox") {
        return ParsedGatewayCommand::TareasList;
    }
    if trimmed.eq_ignore_ascii_case("/lock") || trimmed.eq_ignore_ascii_case("/bloquear") {
        return ParsedGatewayCommand::Lock;
    }

    if let Some(rest) = trimmed.strip_prefix("/pair") {
        return ParsedGatewayCommand::Pair(rest.trim().to_string());
    }

    if let Some(rest) = trimmed.strip_prefix("/gasto") {
        let rest = rest.trim();
        return parse_expense_args(rest);
    }

    if let Some(rest) = trimmed.strip_prefix("/tarea") {
        let clean = rest.trim();
        if clean.is_empty() {
            return ParsedGatewayCommand::TareasList;
        }
        return ParsedGatewayCommand::Tarea(clean.to_string());
    }
    if let Some(rest) = trimmed.strip_prefix("/inbox") {
        let clean = rest.trim();
        if clean.is_empty() {
            return ParsedGatewayCommand::TareasList;
        }
        return ParsedGatewayCommand::Tarea(clean.to_string());
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
        return ParsedGatewayCommand::Unknown("Falta monto para /gasto. Ejemplo: `/gasto 146.30 Rappi bbva`".to_string());
    }

    let mut amount_opt = None;
    let mut amount_idx = None;

    for (i, p) in parts.iter().enumerate() {
        let clean = p.trim_start_matches('$').replace(',', ".");
        if let Ok(v) = clean.parse::<f64>() {
            if v > 0.0 {
                amount_opt = Some(v);
                amount_idx = Some(i);
                break;
            }
        }
    }

    let amount = match amount_opt {
        Some(a) => a,
        None => return ParsedGatewayCommand::Unknown(format!("Monto no detectado en: `{}`", args)),
    };

    let idx = amount_idx.unwrap();
    let mut remaining_parts: Vec<&str> = parts.clone();
    remaining_parts.remove(idx);

    let raw_desc = if remaining_parts.is_empty() {
        "Gasto General".to_string()
    } else {
        remaining_parts.join(" ")
    };

    ParsedGatewayCommand::Gasto {
        amount,
        raw_desc,
    }
}

fn infer_real_category(desc: &str, available_cats: &[String]) -> String {
    let d = desc.to_lowercase();
    let cat_candidate = if d.contains("taco") || d.contains("comida") || d.contains("cen") || d.contains("almuerz")
        || d.contains("desayun") || d.contains("restauran") || d.contains("cafe") || d.contains("oxxo")
        || d.contains("3b") || d.contains("aurrera") || d.contains("soriana") || d.contains("walmart")
        || d.contains("costco") || d.contains("super") || d.contains("despensa") || d.contains("rappi")
        || d.contains("ubereats") || d.contains("didi food") {
        "Comida & Despensa"
    } else if d.contains("gas") || d.contains("gasolina") || d.contains("uber") || d.contains("didi")
        || d.contains("pasaje") || d.contains("camion") || d.contains("metro") || d.contains("taxi")
        || d.contains("caseta") || d.contains("auto") || d.contains("coche") || d.contains("taller") {
        "Transporte & Gasolina"
    } else if d.contains("farmacia") || d.contains("medicin") || d.contains("doctor") || d.contains("salud")
        || d.contains("dentista") || d.contains("hospital") || d.contains("similares") || d.contains("guadalajara") {
        "Salud & Médico"
    } else if d.contains("luz") || d.contains("cfe") || d.contains("agua") || d.contains("internet")
        || d.contains("telmex") || d.contains("totalplay") || d.contains("megacable") || d.contains("saldo")
        || d.contains("recarga") || d.contains("renta") || d.contains("gas natural") {
        "Servicios (Luz, Internet, etc.)"
    } else if d.contains("netflix") || d.contains("spotify") || d.contains("youtube") || d.contains("prime")
        || d.contains("disney") || d.contains("hbo") || d.contains("max") || d.contains("patreon")
        || d.contains("suscrip") || d.contains("icloud") || d.contains("google one") {
        "Suscripciones"
    } else if d.contains("steam") || d.contains("juego") || d.contains("cine") || d.contains("chela")
        || d.contains("cerveza") || d.contains("bar") || d.contains("antro") || d.contains("fiesta")
        || d.contains("concierto") || d.contains("playstation") || d.contains("xbox") || d.contains("nintendo") {
        "Entretenimiento & Ocio"
    } else {
        "Otros"
    };

    if available_cats.iter().any(|c| c == cat_candidate) {
        cat_candidate.to_string()
    } else if let Some(m) = available_cats.iter().find(|c| c.to_lowercase().contains(&cat_candidate.to_lowercase()[..4])) {
        m.clone()
    } else {
        available_cats.first().cloned().unwrap_or_else(|| "Otros".to_string())
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
                "✅ *Emparejamiento Exitoso*\nEste dispositivo móvil ahora está autorizado como Gateway de Aegis.\n\nEscribe `/help` para ver comandos disponibles.",
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

    // 3. CONTROL DE VIGENCIA TEMPORAL (TTL)
    // Comandos efímeros o en tiempo real pierden validez si la estación estuvo apagada > 5 minutos (300 segundos).
    // Comandos persistentes (/gasto y /tarea) siempre se procesan para no perder registros offline.
    let now_secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    let is_stale = match msg.date {
        Some(msg_date) => (now_secs - msg_date) > 300,
        None => false,
    };

    if is_stale {
        match &cmd {
            ParsedGatewayCommand::Status
            | ParsedGatewayCommand::Lock
            | ParsedGatewayCommand::Ai(_)
            | ParsedGatewayCommand::Resumen => {
                let _ = telegram_send_message(
                    client,
                    token,
                    chat_id,
                    "⏳ *Comando Expirado*\nEste comando fue enviado mientras la estación de trabajo estaba fuera de línea (>5 min). Por consistencia no fue ejecutado.\n\nEnvía el comando nuevamente si deseas consultar el estado actual.",
                ).await;
                return;
            }
            _ => {}
        }
    }

    // 4. EJECUCIÓN DE COMANDOS
    match cmd {
        ParsedGatewayCommand::Start | ParsedGatewayCommand::Help => {
            let reply = "🛡️ *Aegis Remote Gateway — Comandos Disponibles*\n\n\
                💰 `/gasto <monto> <descripción>` o `$150 tacos`\nRegistra una salida financiera al vuelo.\n\n\
                ✅ `/tarea <descripción>`\nAgrega una tarea al Inbox de tu Bóveda Obsidian.\n\n\
                📋 `/tareas`\nConsulta tus tareas pendientes en el Inbox.\n\n\
                📊 `/resumen`\nBalance financiero y últimos movimientos del ciclo.\n\n\
                🖥️ `/status`\nTelemetría real Centinela (CPU, Temp °C, RAM, Uptime).\n\n\
                🔒 `/lock`\nBloquea remotamente Aegis en la estación.\n\n\
                🤖 `/ai <pregunta>`\nConsulta asíncrona al motor IA activo.";
            let _ = telegram_send_message(client, token, chat_id, reply).await;
        }

        ParsedGatewayCommand::Gasto { amount, raw_desc } => {
            if !cfg.telegram_gateway.allow_expenses {
                let _ = telegram_send_message(client, token, chat_id, "⚠️ El registro de gastos está deshabilitado en ajustes.").await;
                return;
            }

            match record_gateway_expense(amount, &raw_desc) {
                Ok(res) => {
                    let cycle_info = if let Some((c_spent, cut_day)) = res.cycle_info {
                        format!("\n📊 *Ciclo Activo (Corte día {}):* `${:.2}`", cut_day, c_spent)
                    } else if let Some(bal) = res.remaining_balance {
                        format!("\n💰 *Saldo disponible:* `${:.2}`", bal)
                    } else {
                        String::new()
                    };

                    let reply = format!(
                        "✅ *Gasto Registrado*\n\
                        💰 *Monto:* `${:.2}`\n\
                        📝 *Concepto:* `{}`\n\
                        💳 *Método:* `{}`\n\
                        🏷️ *Categoría:* `{}`{}",
                        amount, res.description, res.payment_method, res.category, cycle_info
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

        ParsedGatewayCommand::TareasList => {
            match get_inbox_pending_tasks(&cfg.vault_path, &cfg.telegram_gateway.inbox_file) {
                Ok(tasks) => {
                    if tasks.is_empty() {
                        let _ = telegram_send_message(client, token, chat_id, "✅ *Inbox Limpio*\nNo tienes tareas pendientes en tu Inbox.").await;
                    } else {
                        let total = tasks.len();
                        let shown: Vec<String> = tasks.iter().take(8).enumerate().map(|(i, t)| {
                            format!("{}. {}", i + 1, t)
                        }).collect();
                        let extra = if total > 8 {
                            format!("\n\n_...y {} tareas más en tu Bóveda._", total - 8)
                        } else {
                            String::new()
                        };
                        let reply = format!("📋 *Tareas Pendientes en Inbox ({})*\n\n{}{}\n\n💡 _Agrega más con `/tarea <desc>`_", total, shown.join("\n"), extra);
                        let _ = telegram_send_message(client, token, chat_id, &reply).await;
                    }
                }
                Err(e) => {
                    let _ = telegram_send_message(client, token, chat_id, &format!("❌ Error leyendo tareas: {}", e)).await;
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

        ParsedGatewayCommand::Lock => {
            if let Some(state) = app.try_state::<crate::security::VaultState>() {
                match crate::security::lock_vault(state) {
                    Ok(_) => {
                        let _ = app.emit("aegis:security-status-changed", ());
                        let reply = "🔒 *Aegis Bloqueado Remotamente*\nBóveda y datos sensibles protegidos en la estación de trabajo.";
                        let _ = telegram_send_message(client, token, chat_id, reply).await;
                    }
                    Err(e) => {
                        let _ = telegram_send_message(client, token, chat_id, &format!("❌ Error bloqueando Aegis: {}", e)).await;
                    }
                }
            } else {
                let _ = telegram_send_message(client, token, chat_id, "⚠️ Módulo de seguridad no disponible.").await;
            }
        }

        ParsedGatewayCommand::Ai(prompt) => {
            if !cfg.telegram_gateway.allow_ai_queries {
                let _ = telegram_send_message(client, token, chat_id, "⚠️ Consultas IA deshabilitadas en ajustes.").await;
                return;
            }

            let client_cloned = client.clone();
            let token_cloned = token.to_string();
            let cfg_cloned = cfg.clone();
            tauri::async_runtime::spawn(async move {
                let _ = telegram_send_message(&client_cloned, &token_cloned, chat_id, "🤖 _Procesando consulta con motor IA..._").await;
                let response = run_quick_ai_query(&prompt, &cfg_cloned).await;
                let _ = telegram_send_message(&client_cloned, &token_cloned, chat_id, &response).await;
            });
        }

        ParsedGatewayCommand::Pair(_) => {}
        ParsedGatewayCommand::Unknown(u) => {
            let reply = format!("❓ Comando no reconocido: `{}`\nEscribe `/help` para ver comandos válidos.", u);
            let _ = telegram_send_message(client, token, chat_id, &reply).await;
        }
    }
}

// ================= LOGICA OPERATIVA INTERNA =================

pub struct GatewayExpenseResult {
    pub description: String,
    pub payment_method: String,
    pub category: String,
    pub remaining_balance: Option<f64>,
    pub cycle_info: Option<(f64, u32)>,
}

fn calculate_cycle_bounds(today_str: &str, cutoff_day: u32) -> (String, String) {
    let parts: Vec<&str> = today_str.split('-').collect();
    let year: i32 = parts.get(0).and_then(|p| p.parse().ok()).unwrap_or(2026);
    let month: u32 = parts.get(1).and_then(|p| p.parse().ok()).unwrap_or(1);
    let day: u32 = parts.get(2).and_then(|p| p.parse().ok()).unwrap_or(1);

    let (start_y, start_m, end_y, end_m) = if cutoff_day <= 1 {
        (year, month, year, month)
    } else if day < cutoff_day {
        let prev_m = if month == 1 { 12 } else { month - 1 };
        let prev_y = if month == 1 { year - 1 } else { year };
        (prev_y, prev_m, year, month)
    } else {
        let next_m = if month == 12 { 1 } else { month + 1 };
        let next_y = if month == 12 { year + 1 } else { year };
        (year, month, next_y, next_m)
    };

    let start_date = format!("{:04}-{:02}-{:02}", start_y, start_m, cutoff_day);
    let end_date = format!("{:04}-{:02}-{:02}", end_y, end_m, cutoff_day);
    (start_date, end_date)
}

fn resolve_payment_method_and_concept(
    raw_desc: &str,
    available_methods: &[crate::finances::PaymentMethod],
) -> (crate::finances::PaymentMethod, String) {
    let lower = raw_desc.to_lowercase();

    // Buscar coincidencia explícita contra nombres de métodos o aliases comunes
    let mut matched_method = None;
    let mut matched_token: Option<String> = None;

    for pm in available_methods {
        let name_lower = pm.name.to_lowercase();
        if lower.contains(&name_lower) {
            matched_method = Some(pm.clone());
            matched_token = Some(name_lower);
            break;
        }
    }

    if matched_method.is_none() {
        if lower.contains("bbva") || lower.contains("azul") || (lower.contains("credito") && !lower.contains("mp")) {
            if let Some(pm) = available_methods.iter().find(|m| m.name.to_lowercase().contains("bbva") || m.name.to_lowercase().contains("azul")) {
                matched_method = Some(pm.clone());
                matched_token = Some(if lower.contains("bbva") { "bbva".to_string() } else if lower.contains("azul") { "azul".to_string() } else { "credito".to_string() });
            }
        } else if lower.contains("mp credito") || lower.contains("mp crédito") || lower.contains("mercado pago credito") || lower.contains("mercado pago crédito") {
            if let Some(pm) = available_methods.iter().find(|m| m.name.to_lowercase().contains("mercado pago crédito") || (m.name.to_lowercase().contains("mercado pago") && m.r#type == "credit")) {
                matched_method = Some(pm.clone());
                matched_token = Some(if lower.contains("mercado pago credito") {
                    "mercado pago credito".to_string()
                } else if lower.contains("mercado pago crédito") {
                    "mercado pago crédito".to_string()
                } else if lower.contains("mp credito") {
                    "mp credito".to_string()
                } else {
                    "mp crédito".to_string()
                });
            }
        } else if lower.contains("mp wallet") || lower.contains("mercado pago wallet") {
            if let Some(pm) = available_methods.iter().find(|m| m.name.to_lowercase().contains("wallet") || (m.name.to_lowercase().contains("mercado pago") && m.r#type == "debit")) {
                matched_method = Some(pm.clone());
                matched_token = Some(if lower.contains("mercado pago wallet") { "mercado pago wallet".to_string() } else { "mp wallet".to_string() });
            }
        } else if lower.contains("mp") || lower.contains("mercado pago") || lower.contains("wallet") {
            if let Some(pm) = available_methods.iter().find(|m| m.name.to_lowercase().contains("wallet") || (m.name.to_lowercase().contains("mercado pago") && m.r#type == "debit")) {
                matched_method = Some(pm.clone());
                matched_token = Some(if lower.contains("wallet") { "wallet".to_string() } else if lower.contains("mercado pago") { "mercado pago".to_string() } else { "mp".to_string() });
            }
        } else if lower.contains("efectivo") || lower.contains("cash") {
            if let Some(pm) = available_methods.iter().find(|m| m.r#type == "cash" || m.name.to_lowercase().contains("efectivo")) {
                matched_method = Some(pm.clone());
                matched_token = Some(if lower.contains("efectivo") { "efectivo".to_string() } else { "cash".to_string() });
            }
        }
    }

    let final_pm = match matched_method {
        Some(pm) => pm,
        None => {
            // Predeterminado: Primera tarjeta de crédito o primer método disponible
            available_methods
                .iter()
                .find(|m| m.r#type == "credit")
                .or_else(|| available_methods.first())
                .cloned()
                .unwrap_or_else(|| crate::finances::PaymentMethod {
                    id: "pm_default".to_string(),
                    name: "Efectivo Físico".to_string(),
                    r#type: "cash".to_string(),
                    color: None,
                    cutoff_day: None,
                    payment_day: None,
                    balance: 0.0,
                    credit_limit: None,
                })
        }
    };

    let mut clean_words: Vec<String> = Vec::new();
    if let Some(tok) = matched_token {
        let tok_lower = tok.to_lowercase();
        let tok_words: Vec<&str> = tok_lower.split_whitespace().collect();
        for w in raw_desc.split_whitespace() {
            let w_clean = w.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
            if !tok_words.contains(&w_clean.as_str()) {
                clean_words.push(w.to_string());
            }
        }
    } else {
        clean_words = raw_desc.split_whitespace().map(|s| s.to_string()).collect();
    }

    let clean_desc = clean_words.join(" ");
    let final_desc = if clean_desc.is_empty() {
        "Gasto General".to_string()
    } else {
        clean_desc
    };

    (final_pm, final_desc)
}

fn record_gateway_expense(amount: f64, raw_desc: &str) -> Result<GatewayExpenseResult, String> {
    let conn = get_db_connection()?;
    let available_methods = crate::finances::sqlite_get_payment_methods()?;
    let available_cats = crate::finances::sqlite_get_categories().unwrap_or_default();

    let (pm, clean_desc) = resolve_payment_method_and_concept(raw_desc, &available_methods);
    let category = infer_real_category(&clean_desc, &available_cats);

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis();
    let id = format!("tx_{}_gw", now);
    let today = chrono_like_today();
    let created_at = format!("{} 12:00:00", today);

    conn.execute(
        "INSERT INTO transactions (id, amount, type, category, payment_method, date, description, created_at)
         VALUES (?1, ?2, 'expense', ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![id, amount, category, pm.name, today, clean_desc, created_at],
    ).map_err(|e| format!("Error insertando transacción: {}", e))?;

    let mut remaining_balance = None;
    let mut cycle_info = None;

    if pm.r#type == "cash" || pm.r#type == "debit" {
        let new_bal = (pm.balance - amount).max(0.0);
        let _ = conn.execute(
            "UPDATE payment_methods SET balance = ?1 WHERE id = ?2",
            rusqlite::params![new_bal, pm.id],
        );
        remaining_balance = Some(new_bal);
    } else if pm.r#type == "credit" {
        let cut_day = pm.cutoff_day.unwrap_or(22);
        let (c_start, c_end) = calculate_cycle_bounds(&today, cut_day);

        let cycle_exp: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE payment_method = ?1 AND type = 'expense' AND date >= ?2 AND date <= ?3",
            rusqlite::params![pm.name, c_start, c_end],
            |r| r.get(0),
        ).unwrap_or(0.0);

        let cycle_inc: f64 = conn.query_row(
            "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE payment_method = ?1 AND type = 'income' AND date >= ?2 AND date <= ?3",
            rusqlite::params![pm.name, c_start, c_end],
            |r| r.get(0),
        ).unwrap_or(0.0);

        let cycle_total = (cycle_exp - cycle_inc).max(0.0);
        cycle_info = Some((cycle_total, cut_day));
    }

    Ok(GatewayExpenseResult {
        description: clean_desc,
        payment_method: pm.name,
        category,
        remaining_balance,
        cycle_info,
    })
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

fn get_inbox_pending_tasks(vault_path: &str, inbox_rel: &str) -> Result<Vec<String>, String> {
    if vault_path.trim().is_empty() {
        return Err("Ruta de Bóveda Obsidian no configurada en Aegis.".to_string());
    }

    let inbox_file = if inbox_rel.trim().is_empty() {
        "00 Sistema/Inbox.md"
    } else {
        inbox_rel.trim()
    };

    let target_path = PathBuf::from(vault_path).join(inbox_file);
    if !target_path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&target_path)
        .map_err(|e| format!("Error leyendo {}: {}", target_path.display(), e))?;

    let mut open_tasks = Vec::new();
    for line in content.lines() {
        let t = line.trim();
        if t.starts_with("- [ ]") {
            let task_desc = t.trim_start_matches("- [ ]").trim();
            if !task_desc.is_empty() {
                open_tasks.push(task_desc.to_string());
            }
        }
    }

    Ok(open_tasks)
}

fn generate_system_status_summary() -> String {
    let hostname = std::env::var("HOSTNAME").unwrap_or_else(|_| "Aegis-Host".to_string());
    if let Ok(t) = crate::sentinel::get_system_telemetry() {
        let ram_used_gb = t.ram_used_mb as f64 / 1024.0;
        let ram_total_gb = t.ram_total_mb as f64 / 1024.0;
        let uptime_hours = t.uptime_seconds / 3600;
        let uptime_mins = (t.uptime_seconds % 3600) / 60;
        let temp_badge = if t.cpu_temp_celsius > 80.0 { "🔥" } else if t.cpu_temp_celsius > 65.0 { "🌡️" } else { "❄️" };

        format!(
            "🖥️ *Telemetría Aegis Centinela — {}*\n\n\
            ⚡ *CPU:* `{:.1}%` ({} `{:.1}°C`)\n\
            🧠 *RAM:* `{:.1}/{:.1} GB` (`{:.1}%`)\n\
            🔋 *Perfil:* `{}`\n\
            ⏱️ *Uptime:* `{}h {}m`\n\
            🛡️ *Aegis RAM:* `{:.1} MB`",
            hostname,
            t.cpu_percent, temp_badge, t.cpu_temp_celsius,
            ram_used_gb, ram_total_gb, t.ram_usage_percent,
            t.power_profile,
            uptime_hours, uptime_mins,
            t.aegis_ram_mb
        )
    } else {
        format!(
            "🖥️ *Estado del Sistema — {}*\n\
            ⚡ CPU & RAM: En línea\n\
            🛡️ Host: `{}`\n\
            ⏰ Timestamp: `{}`",
            hostname, hostname, chrono_like_today()
        )
    }
}

fn generate_financial_summary() -> String {
    let conn = match get_db_connection() {
        Ok(c) => c,
        Err(e) => return format!("❌ Error accediendo a base de datos: {}", e),
    };

    let today = chrono_like_today();

    // 1. Métodos de pago
    let methods = crate::finances::sqlite_get_payment_methods().unwrap_or_default();

    let mut credit_lines = Vec::new();
    let mut liquid_lines = Vec::new();
    let mut total_liquidity = 0.0;

    for m in &methods {
        if m.r#type == "credit" {
            let cut_day = m.cutoff_day.unwrap_or(22);
            let (c_start, c_end) = calculate_cycle_bounds(&today, cut_day);

            let cycle_exp: f64 = conn.query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE payment_method = ?1 AND type = 'expense' AND date >= ?2 AND date <= ?3",
                rusqlite::params![m.name, c_start, c_end],
                |r| r.get(0),
            ).unwrap_or(0.0);

            let cycle_inc: f64 = conn.query_row(
                "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE payment_method = ?1 AND type = 'income' AND date >= ?2 AND date <= ?3",
                rusqlite::params![m.name, c_start, c_end],
                |r| r.get(0),
            ).unwrap_or(0.0);

            let cycle_due = (cycle_exp - cycle_inc).max(0.0);
            let pay_day_str = m.payment_day.map(|p| format!(", Paga: día {}", p)).unwrap_or_default();
            credit_lines.push(format!("💳 *{}*: `${:.2}` _(Corte día {}{})_", m.name, cycle_due, cut_day, pay_day_str));
        } else {
            total_liquidity += m.balance;
            let icon = if m.r#type == "cash" { "💵" } else { "🏦" };
            liquid_lines.push(format!("{} *{}*: `${:.2}`", icon, m.name, m.balance));
        }
    }

    // 2. Determinar ciclo financiero activo (basado en tarjeta de crédito principal o día 22 por defecto)
    let global_cutoff_day = methods
        .iter()
        .find(|m| m.r#type == "credit")
        .and_then(|m| m.cutoff_day)
        .unwrap_or(22);

    let (cycle_start, cycle_end) = calculate_cycle_bounds(&today, global_cutoff_day);

    let total_cycle_exp: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE type = 'expense' AND date >= ?1 AND date <= ?2",
        rusqlite::params![cycle_start, cycle_end],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let total_cycle_inc: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0.0) FROM transactions WHERE type = 'income' AND date >= ?1 AND date <= ?2",
        rusqlite::params![cycle_start, cycle_end],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let net_cycle = total_cycle_inc - total_cycle_exp;

    // 3. Últimos 3 movimientos
    let mut stmt = match conn.prepare("SELECT amount, type, payment_method, description, date FROM transactions ORDER BY date DESC, created_at DESC LIMIT 3") {
        Ok(s) => s,
        Err(_) => return "❌ Error preparando consulta de transacciones".to_string(),
    };

    let recent_txs: Vec<String> = stmt.query_map([], |r| {
        let amt: f64 = r.get(0)?;
        let t_type: String = r.get(1)?;
        let method: String = r.get(2)?;
        let desc: Option<String> = r.get(3)?;
        let date: String = r.get(4)?;
        let sign = if t_type == "expense" { "-" } else { "+" };
        let d = desc.unwrap_or_else(|| "Sin descripción".to_string());
        Ok(format!("• `{}` {}${:.2} — {} _({})_", date, sign, amt, d, method))
    }).map(|it| it.filter_map(|x| x.ok()).collect()).unwrap_or_default();

    let credit_section = if credit_lines.is_empty() {
        "_(Sin tarjetas de crédito registradas)_".to_string()
    } else {
        credit_lines.join("\n")
    };

    let liquid_section = if liquid_lines.is_empty() {
        "_(Sin cuentas de débito o efectivo)_".to_string()
    } else {
        format!("{}\n💰 *Liquidez Total:* `${:.2}`", liquid_lines.join("\n"), total_liquidity)
    };

    let recent_section = if recent_txs.is_empty() {
        "_(Sin movimientos recientes)_".to_string()
    } else {
        recent_txs.join("\n")
    };

    format!(
        "📊 *Estado Financiero Aegis*\n\
        🗓️ *Ciclo Activo:* `{} a {}` _(Corte día {})_\n\n\
        💳 *Tarjetas de Crédito:*\n{}\n\n\
        🏦 *Cuentas & Liquidez:*\n{}\n\n\
        📈 *Flujo del Ciclo Actual:*\n\
        🔻 Gastos Totales: `${:.2}`\n\
        🟢 Ingresos Totales: `${:.2}`\n\
        ⚖️ Balance Neto: `${:.2}`\n\n\
        🕒 *Últimos 3 Movimientos:*\n{}",
        cycle_start, cycle_end, global_cutoff_day,
        credit_section, liquid_section,
        total_cycle_exp, total_cycle_inc, net_cycle,
        recent_section
    )
}

async fn run_quick_ai_query(prompt: &str, cfg: &AegisConfig) -> String {
    let agent_type = cfg.agent_type.as_str();
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let custom_cmd = cfg.agent_custom_cmd.clone();

    let agent_binary = match agent_type {
        "claude" | "anthropic" => "claude".to_string(),
        "codex" | "openai" => "codex".to_string(),
        "ollama" => "ollama".to_string(),
        "custom" => custom_cmd.unwrap_or_else(|| "agy".to_string()),
        _ => {
            let local_agy = std::path::Path::new(&home).join(".local/bin/agy");
            if local_agy.exists() {
                local_agy.to_string_lossy().to_string()
            } else {
                "agy".to_string()
            }
        }
    };

    let mut cmd = tokio::process::Command::new(&agent_binary);
    cmd.arg("-p")
        .arg(format!("Responde en modo conciso y directo para Telegram móvil (máximo 150 palabras, sin relleno): {}", prompt));

    if agent_binary.ends_with("claude") {
        cmd.arg("--output-format").arg("text");
    }

    if !cfg.vault_path.trim().is_empty() && std::path::Path::new(&cfg.vault_path).exists() {
        cmd.current_dir(&cfg.vault_path);
    }

    match cmd.output().await {
        Ok(out) => {
            let stdout_str = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !stdout_str.is_empty() {
                let clean_res = if stdout_str.len() > 3800 {
                    format!("{}...\n\n_(Respuesta truncada para Telegram)_", &stdout_str[..3800])
                } else {
                    stdout_str
                };
                format!("🤖 *Aegis AI ({}):*\n\n{}", agent_type.to_uppercase(), clean_res)
            } else {
                let stderr_str = String::from_utf8_lossy(&out.stderr).trim().to_string();
                if !stderr_str.is_empty() {
                    let first_line = stderr_str.lines().next().unwrap_or(&stderr_str);
                    format!("⚠️ Error del motor {}: {}", agent_type, first_line)
                } else {
                    format!("🤖 *Aegis AI:* Sin respuesta del motor `{}`.", agent_type)
                }
            }
        }
        Err(e) => {
            format!("❌ Error invocando motor `{}`: {}", agent_binary, e)
        }
    }
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
        if let ParsedGatewayCommand::Gasto { amount, raw_desc } = cmd {
            assert_eq!(amount, 85.50);
            assert_eq!(raw_desc, "tacos de pastor");
        } else {
            panic!("Falló parseo de gasto");
        }

        // Heurística de número directo
        let direct = parse_gateway_text("$120 uber a la oficina");
        if let ParsedGatewayCommand::Gasto { amount, raw_desc } = direct {
            assert_eq!(amount, 120.0);
            assert_eq!(raw_desc, "uber a la oficina");
        } else {
            panic!("Falló parseo de número directo");
        }

        // Caso con método al final o intercalado
        let rappi_bbva = parse_gateway_text("/gasto 146.30 Rappi bbva");
        if let ParsedGatewayCommand::Gasto { amount, raw_desc } = rappi_bbva {
            assert_eq!(amount, 146.30);
            assert_eq!(raw_desc, "Rappi bbva");
        } else {
            panic!("Falló parseo de gasto con método");
        }

        let task = parse_gateway_text("/tarea Comprar café soluble");
        assert_eq!(task, ParsedGatewayCommand::Tarea("Comprar café soluble".to_string()));

        let tareas = parse_gateway_text("/tareas");
        assert_eq!(tareas, ParsedGatewayCommand::TareasList);

        let inbox_cmd = parse_gateway_text("/inbox");
        assert_eq!(inbox_cmd, ParsedGatewayCommand::TareasList);

        let lock = parse_gateway_text("/lock");
        assert_eq!(lock, ParsedGatewayCommand::Lock);

        let ai_cmd = parse_gateway_text("/ai qué hora es");
        assert_eq!(ai_cmd, ParsedGatewayCommand::Ai("qué hora es".to_string()));
    }

    #[test]
    fn test_resolve_payment_method_and_concept() {
        let methods = vec![
            crate::finances::PaymentMethod {
                id: "bbva_oro".to_string(),
                name: "BBVA Azul Crédito".to_string(),
                r#type: "credit".to_string(),
                color: None,
                cutoff_day: Some(22),
                payment_day: Some(11),
                balance: 0.0,
                credit_limit: Some(88105.0),
            },
            crate::finances::PaymentMethod {
                id: "mp_cred".to_string(),
                name: "Mercado Pago Crédito".to_string(),
                r#type: "credit".to_string(),
                color: None,
                cutoff_day: Some(13),
                payment_day: Some(23),
                balance: 1250.0,
                credit_limit: Some(5200.0),
            },
            crate::finances::PaymentMethod {
                id: "pm_mp_wallet".to_string(),
                name: "Mercado Pago Wallet".to_string(),
                r#type: "debit".to_string(),
                color: None,
                cutoff_day: None,
                payment_day: None,
                balance: 13154.0,
                credit_limit: None,
            },
            crate::finances::PaymentMethod {
                id: "cash".to_string(),
                name: "Efectivo Físico".to_string(),
                r#type: "cash".to_string(),
                color: None,
                cutoff_day: None,
                payment_day: None,
                balance: 400.0,
                credit_limit: None,
            },
        ];

        let (pm1, desc1) = resolve_payment_method_and_concept("Rappi bbva", &methods);
        assert_eq!(pm1.name, "BBVA Azul Crédito");
        assert_eq!(desc1, "Rappi");

        let (pm2, desc2) = resolve_payment_method_and_concept("tacos efectivo", &methods);
        assert_eq!(pm2.name, "Efectivo Físico");
        assert_eq!(desc2, "tacos");

        let (pm3, desc3) = resolve_payment_method_and_concept("cafe mp wallet", &methods);
        assert_eq!(pm3.name, "Mercado Pago Wallet");
        assert_eq!(desc3, "cafe");

        let (pm4, desc4) = resolve_payment_method_and_concept("gasolina", &methods);
        // Default to credit
        assert_eq!(pm4.name, "BBVA Azul Crédito");
        assert_eq!(desc4, "gasolina");
    }

    #[test]
    fn test_calculate_cycle_bounds() {
        let (s, e) = calculate_cycle_bounds("2026-11-09", 22);
        assert_eq!(s, "2026-10-22");
        assert_eq!(e, "2026-11-22");

        let (s2, e2) = calculate_cycle_bounds("2026-11-25", 22);
        assert_eq!(s2, "2026-11-22");
        assert_eq!(e2, "2026-12-22");
    }
}
