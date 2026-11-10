use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::{SocketAddr, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tauri::Emitter;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Notify;

use crate::config::{get_aegis_config, save_aegis_config, TrustedDevice};
use crate::db::get_db_connection;

pub static P2P_ACTIVE: AtomicBool = AtomicBool::new(false);
static APP_HANDLE: OnceLock<tauri::AppHandle> = OnceLock::new();

pub fn set_app_handle(handle: tauri::AppHandle) {
    let _ = APP_HANDLE.set(handle);
}

pub fn notify_config_updated(cfg: &crate::config::AegisConfig) {
    if let Some(app) = APP_HANDLE.get() {
        let _ = app.emit("aegis:config-reloaded", cfg);
    }
}

fn get_local_ip() -> String {
    // Técnica estándar POSIX/Windows: bind efímero y connect a IP pública para resolver ruta local en kernel sin enviar tráfico
    if let Ok(socket) = UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:80").is_ok() {
            if let Ok(addr) = socket.local_addr() {
                return addr.ip().to_string();
            }
        }
    }
    "127.0.0.1".to_string()
}

fn get_unique_device_id() -> String {
    if let Ok(mut cfg) = get_aegis_config() {
        if !cfg.p2p_sync.device_id.trim().is_empty() {
            return cfg.p2p_sync.device_id.clone();
        }
        let user = std::env::var("USER").unwrap_or_else(|_| "operator".to_string());
        let new_id = format!("aegis-{}-{}", user, hex::encode(&rand::random::<[u8; 4]>()));
        cfg.p2p_sync.device_id = new_id.clone();
        let _ = save_aegis_config(cfg);
        new_id
    } else {
        let user = std::env::var("USER").unwrap_or_else(|_| "operator".to_string());
        format!("aegis-{}-{}", user, hex::encode(&rand::random::<[u8; 4]>()))
    }
}

fn get_subnet_broadcast_ip(local_ip: &str) -> Option<String> {
    if let Ok(ip) = local_ip.parse::<std::net::Ipv4Addr>() {
        let o = ip.octets();
        if o[0] != 127 {
            return Some(format!("{}.{}.{}.255", o[0], o[1], o[2]));
        }
    }
    None
}

fn create_reusable_udp_socket(port: u16) -> Result<tokio::net::UdpSocket, String> {
    use socket2::{Domain, Protocol, Socket, Type};

    let socket = Socket::new(Domain::IPV4, Type::DGRAM, Some(Protocol::UDP))
        .map_err(|e| format!("Error creando socket2 UDP: {}", e))?;

    let _ = socket.set_reuse_address(true);
    #[cfg(all(unix, not(target_os = "solaris"), not(target_os = "illumos")))]
    let _ = socket.set_reuse_port(true);
    let _ = socket.set_broadcast(true);
    let _ = socket.set_nonblocking(true);

    let bind_addr: SocketAddr = format!("0.0.0.0:{}", port)
        .parse()
        .map_err(|e| format!("Error parseando dirección: {}", e))?;

    socket
        .bind(&bind_addr.into())
        .map_err(|e| format!("Error enlazando UDP {}: {}", port, e))?;

    let std_socket: std::net::UdpSocket = socket.into();
    tokio::net::UdpSocket::from_std(std_socket)
        .map_err(|e| format!("Error convirtiendo a Tokio UdpSocket: {}", e))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PeerInfo {
    pub id: String,
    pub name: String,
    pub ip: String,
    pub sync_port: u16,
    pub version: String,
    pub last_seen_secs_ago: u64,
    pub is_paired: bool,
}

struct DiscoveredPeerInternal {
    info: PeerInfo,
    last_seen_instant: Instant,
}

type PeersMap = Arc<Mutex<HashMap<String, DiscoveredPeerInternal>>>;

static PEERS_MAP: std::sync::OnceLock<PeersMap> = std::sync::OnceLock::new();
static RUNTIME_NOTIFY: std::sync::OnceLock<Arc<Notify>> = std::sync::OnceLock::new();

fn get_peers_map() -> PeersMap {
    PEERS_MAP
        .get_or_init(|| Arc::new(Mutex::new(HashMap::new())))
        .clone()
}

fn get_notify() -> Arc<Notify> {
    RUNTIME_NOTIFY.get_or_init(|| Arc::new(Notify::new())).clone()
}

#[derive(Debug, Serialize, Deserialize)]
struct BeaconPayload {
    protocol: String,
    device_id: String,
    device_name: String,
    sync_port: u16,
    version: String,
}

pub fn init_p2p_background_services() {
    let notify = get_notify();
    let peers_map = get_peers_map();

    let _ = std::thread::Builder::new()
        .name("aegis-p2p".into())
        .spawn(move || {
            let rt = match tokio::runtime::Builder::new_multi_thread()
                .enable_all()
                .build()
            {
                Ok(r) => r,
                Err(e) => {
                    log::warn!("[Aegis P2P] Error creando Tokio runtime: {}", e);
                    return;
                }
            };

            rt.block_on(async move {
                // 1. Iniciar loop de fondo para broadcast y descubrimiento UDP
                let notify_udp = notify.clone();
                let peers_map_clone = peers_map.clone();
                tokio::spawn(async move {
                    loop {
                        let config = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
                        if !config.p2p_sync.enabled {
                            P2P_ACTIVE.store(false, Ordering::Relaxed);
                            tokio::select! {
                                _ = tokio::time::sleep(Duration::from_secs(3)) => {},
                                _ = notify_udp.notified() => {},
                            }
                            continue;
                        }

                        P2P_ACTIVE.store(true, Ordering::Relaxed);
                        let disc_port = config.p2p_sync.discovery_port;
                        let sync_port = config.p2p_sync.sync_port;
                        let my_id = get_unique_device_id();
                        let my_name = config.p2p_sync.device_name.clone();

                        // Socket UDP con SO_REUSEADDR y SO_REUSEPORT
                        let socket = match create_reusable_udp_socket(disc_port) {
                            Ok(s) => Arc::new(s),
                            Err(e) => {
                                log::warn!("[Aegis P2P] Reutilización UDP {}: {}", disc_port, e);
                                tokio::select! {
                                    _ = tokio::time::sleep(Duration::from_secs(3)) => {},
                                    _ = notify_udp.notified() => {},
                                }
                                continue;
                            }
                        };

                        let socket_sender = socket.clone();
                        let my_id_send = my_id.clone();
                        let my_name_send = my_name.clone();
                        let local_ip = get_local_ip();
                        let subnet_broadcast = get_subnet_broadcast_ip(&local_ip);

                        // Tarea emisora de beacon dual (255.255.255.255 + Subnet Directed Broadcast)
                        let beacon_handle = tokio::spawn(async move {
                            let limited_target: SocketAddr = format!("255.255.255.255:{}", disc_port).parse().unwrap();
                            let subnet_target: Option<SocketAddr> = subnet_broadcast
                                .and_then(|ip| format!("{}:{}", ip, disc_port).parse().ok());

                            while P2P_ACTIVE.load(Ordering::Relaxed) {
                                let beacon = BeaconPayload {
                                    protocol: "aegis-p2p-v1".to_string(),
                                    device_id: my_id_send.clone(),
                                    device_name: my_name_send.clone(),
                                    sync_port,
                                    version: env!("CARGO_PKG_VERSION").to_string(),
                                };
                                if let Ok(bytes) = serde_json::to_vec(&beacon) {
                                    let _ = socket_sender.send_to(&bytes, limited_target).await;
                                    if let Some(target) = subnet_target {
                                        let _ = socket_sender.send_to(&bytes, target).await;
                                    }
                                }
                                tokio::time::sleep(Duration::from_secs(3)).await;
                            }
                        });

                        // Tarea receptora de beacons
                        let mut buf = [0u8; 2048];
                        while P2P_ACTIVE.load(Ordering::Relaxed) {
                            tokio::select! {
                                recv_res = socket.recv_from(&mut buf) => {
                                    if let Ok((len, src)) = recv_res {
                                        if let Ok(payload) = serde_json::from_slice::<BeaconPayload>(&buf[..len]) {
                                            if payload.protocol == "aegis-p2p-v1" && payload.device_id != my_id {
                                                let is_trusted = {
                                                    let cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
                                                    cfg.p2p_sync.trusted_devices.iter().any(|d| d.id == payload.device_id && d.approved)
                                                };

                                                let mut map = peers_map_clone.lock().unwrap();
                                                map.insert(
                                                    payload.device_id.clone(),
                                                    DiscoveredPeerInternal {
                                                        info: PeerInfo {
                                                            id: payload.device_id,
                                                            name: payload.device_name,
                                                            ip: src.ip().to_string(),
                                                            sync_port: payload.sync_port,
                                                            version: payload.version,
                                                            last_seen_secs_ago: 0,
                                                            is_paired: is_trusted,
                                                        },
                                                        last_seen_instant: Instant::now(),
                                                    },
                                                );
                                            }
                                        }
                                    }
                                }
                                _ = notify_udp.notified() => {
                                    break;
                                }
                            }
                        }

                        beacon_handle.abort();
                    }
                });

                // 2. Iniciar servidor TCP/HTTP ligero para transferencias P2P
                let notify_tcp = notify.clone();
                tokio::spawn(async move {
                    loop {
                        let config = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
                        if !config.p2p_sync.enabled {
                            tokio::select! {
                                _ = tokio::time::sleep(Duration::from_secs(3)) => {},
                                _ = notify_tcp.notified() => {},
                            }
                            continue;
                        }

                        let sync_port = config.p2p_sync.sync_port;
                        let listener = match TcpListener::bind(format!("0.0.0.0:{}", sync_port)).await {
                            Ok(l) => l,
                            Err(e) => {
                                log::warn!("[Aegis P2P Server] Error bind TCP {}: {}", sync_port, e);
                                tokio::select! {
                                    _ = tokio::time::sleep(Duration::from_secs(5)) => {},
                                    _ = notify_tcp.notified() => {},
                                }
                                continue;
                            }
                        };

                        log::info!("[Aegis P2P Server] Escuchando en 0.0.0.0:{}", sync_port);

                        loop {
                            tokio::select! {
                                accept_res = listener.accept() => {
                                    match accept_res {
                                        Ok((mut stream, addr)) => {
                                            tokio::spawn(async move {
                                                let _ = handle_peer_connection(&mut stream, addr).await;
                                            });
                                        }
                                        Err(e) => {
                                            log::warn!("[Aegis P2P Server] Error en accept: {}", e);
                                        }
                                    }
                                }
                                _ = notify_tcp.notified() => {
                                    log::info!("[Aegis P2P Server] Notificación recibida, reevaluando listener...");
                                    break;
                                }
                            }
                        }
                    }
                });
            });
        });
}

async fn handle_peer_connection(stream: &mut TcpStream, _addr: SocketAddr) -> Result<(), String> {
    let mut buffer = Vec::new();
    let mut temp = [0u8; 8192];
    let mut header_pos_opt = None;

    // 1. Leer cabecera HTTP mínima (\r\n\r\n)
    loop {
        let n = stream.read(&mut temp).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        buffer.extend_from_slice(&temp[..n]);
        if let Some(pos) = buffer.windows(4).position(|w| w == b"\r\n\r\n") {
            header_pos_opt = Some(pos);
            break;
        }
        if buffer.len() > 64 * 1024 {
            break;
        }
    }

    let header_pos = match header_pos_opt {
        Some(pos) => pos,
        None => return Ok(()),
    };

    let headers_part = String::from_utf8_lossy(&buffer[..header_pos]).into_owned();
    let mut content_length = 0usize;
    for line in headers_part.lines() {
        let lower = line.to_lowercase();
        if lower.starts_with("content-length:") {
            if let Some(val) = line.split(':').nth(1) {
                content_length = val.trim().parse::<usize>().unwrap_or(0);
            }
        }
    }

    // 2. Leer resto del body según Content-Length
    let total_required = header_pos + 4 + content_length;
    while buffer.len() < total_required {
        let n = stream.read(&mut temp).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        buffer.extend_from_slice(&temp[..n]);
        if buffer.len() > 64 * 1024 * 1024 {
            break;
        }
    }

    let body_bytes = if buffer.len() >= header_pos + 4 {
        &buffer[header_pos + 4..]
    } else {
        &[][..]
    };

    let mut lines = headers_part.lines();
    let req_line = lines.next().unwrap_or("");
    let parts: Vec<&str> = req_line.split_whitespace().collect();
    if parts.len() < 2 {
        return Ok(());
    }

    let method = parts[0];
    let path = parts[1];

    // Despacho de endpoints
    if method == "GET" && path == "/api/ping" {
        let cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
        let res_json = serde_json::json!({
            "status": "online",
            "deviceId": get_unique_device_id(),
            "deviceName": cfg.p2p_sync.device_name,
            "version": env!("CARGO_PKG_VERSION"),
        });
        send_http_json_response(stream, 200, &res_json).await?;
    } else if method == "POST" && path == "/api/pair" {
        if let Ok(body) = serde_json::from_slice::<serde_json::Value>(body_bytes) {
            let req_pin = body.get("pin").and_then(|v| v.as_str()).unwrap_or("");
            let req_id = body.get("requesterId").and_then(|v| v.as_str()).unwrap_or("");
            let req_name = body.get("requesterName").and_then(|v| v.as_str()).unwrap_or("Dispositivo Remoto");

            let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
            let now_secs = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            let is_expired = cfg
                .p2p_sync
                .pairing_pin_expires_at
                .map(|exp| now_secs > exp)
                .unwrap_or(false);

            if is_expired {
                let res = serde_json::json!({
                    "success": false,
                    "error": "El PIN ha expirado. Genera uno nuevo en el dispositivo destino."
                });
                send_http_json_response(stream, 401, &res).await?;
            } else if req_pin == cfg.p2p_sync.pairing_pin && !req_pin.is_empty() {
                // Agregar a dispositivos de confianza
                if !cfg.p2p_sync.trusted_devices.iter().any(|d| d.id == req_id) {
                    cfg.p2p_sync.trusted_devices.push(TrustedDevice {
                        id: req_id.to_string(),
                        name: req_name.to_string(),
                        ip: _addr.ip().to_string(),
                        pairing_code: req_pin.to_string(),
                        approved: true,
                        last_synced_at: None,
                    });
                    let _ = save_aegis_config(cfg);
                }
                let res = serde_json::json!({
                    "success": true,
                    "message": "Emparejamiento exitoso",
                    "deviceId": get_unique_device_id()
                });
                send_http_json_response(stream, 200, &res).await?;
            } else {
                let res = serde_json::json!({
                    "success": false,
                    "error": "PIN inválido. Verifica el código de 6 dígitos que muestra el otro dispositivo."
                });
                send_http_json_response(stream, 401, &res).await?;
            }
        }
    } else if method == "GET" && path == "/api/sync/export" {
        // Exportar datos SQLite consolidables
        let export_data = export_sync_database_payload()?;
        send_http_json_response(stream, 200, &export_data).await?;
    } else if method == "POST" && path == "/api/sync/import" {
        if let Ok(payload) = serde_json::from_slice::<serde_json::Value>(body_bytes) {
            let merged = import_sync_database_payload(payload)?;
            let res = serde_json::json!({ "success": true, "itemsMerged": merged });
            send_http_json_response(stream, 200, &res).await?;
        }
    } else {
        let res = serde_json::json!({ "error": "Ruta no encontrada" });
        send_http_json_response(stream, 404, &res).await?;
    }

    Ok(())
}

async fn send_http_json_response(
    stream: &mut TcpStream,
    status: u16,
    val: &serde_json::Value,
) -> Result<(), String> {
    let body = serde_json::to_string(val).map_err(|e| e.to_string())?;
    let status_line = match status {
        200 => "200 OK",
        401 => "401 Unauthorized",
        404 => "404 Not Found",
        _ => "500 Internal Error",
    };
    let response = format!(
        "HTTP/1.1 {}\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
        status_line,
        body.len(),
        body
    );
    stream
        .write_all(response.as_bytes())
        .await
        .map_err(|e| e.to_string())?;
    stream.flush().await.map_err(|e| e.to_string())?;
    Ok(())
}

fn export_sync_database_payload() -> Result<serde_json::Value, String> {
    let _conn = get_db_connection()?;
    let tx_data = crate::finances::sqlite_get_transactions().unwrap_or_default();
    let budgets = crate::finances::sqlite_get_budgets().unwrap_or_default();
    let categories = crate::finances::sqlite_get_categories().unwrap_or_default();
    let payment_methods = crate::finances::sqlite_get_payment_methods().unwrap_or_default();
    let msi_plans = crate::finances::sqlite_get_msi_plans().unwrap_or_default();
    let recurring_expenses = crate::finances::sqlite_get_recurring_expenses().unwrap_or_default();
    let custom_games = crate::leisure::sqlite_get_custom_games().unwrap_or_default();
    let game_catalog = crate::leisure::sqlite_export_game_catalog().unwrap_or_default();
    let game_stats = crate::leisure::sqlite_export_game_stats().unwrap_or_default();
    let game_sessions = crate::leisure::sqlite_export_game_sessions().unwrap_or_default();
    let game_saves = crate::leisure::sqlite_export_game_saves().unwrap_or_default();
    let timeline = crate::finances::sqlite_get_timeline_events().unwrap_or_default();

    // NOTA DE ARQUITECTURA P2P (Doctrina Desacoplamiento Estricto):
    // Las preferencias de entorno local, UI y hardware (tema, escala DPI, módulos activos, plugins activos,
    // aceleradores GameMode/FSR y tray) permanecen estrictamente desacopladas por máquina para evitar
    // sobrescribir la configuración visual o los flujos específicos de cada dispositivo.
    // Solo se sincronizan datos de negocio (SQLite) y archivos de plugins comunitarios para que estén disponibles.
    let community_plugins = crate::plugins::export_community_plugins_payload().unwrap_or_default();

    Ok(serde_json::json!({
        "deviceId": get_unique_device_id(),
        "exportedAt": SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        "transactions": tx_data,
        "budgets": budgets,
        "categories": categories,
        "paymentMethods": payment_methods,
        "msiPlans": msi_plans,
        "recurringExpenses": recurring_expenses,
        "customGames": custom_games,
        "gameCatalog": game_catalog,
        "gameStats": game_stats,
        "gameSessions": game_sessions,
        "gameSaves": game_saves,
        "timelineEvents": timeline,
        "communityPlugins": community_plugins
    }))
}

fn import_sync_database_payload(payload: serde_json::Value) -> Result<usize, String> {
    let mut total_imported = 0;

    // Transacciones
    if let Some(arr) = payload.get("transactions").and_then(|v| v.as_array()) {
        for t in arr {
            if let Ok(tx) = serde_json::from_value::<crate::finances::Transaction>(t.clone()) {
                let _ = crate::finances::sqlite_save_transaction(tx);
                total_imported += 1;
            }
        }
    }

    // Presupuestos
    if let Some(obj) = payload.get("budgets").and_then(|v| v.as_object()) {
        for (cat, amt) in obj {
            if let Some(val) = amt.as_f64() {
                let _ = crate::finances::sqlite_save_budget(cat.clone(), val);
                total_imported += 1;
            }
        }
    }

    // Categorías
    if let Some(arr) = payload.get("categories").and_then(|v| v.as_array()) {
        for c in arr {
            if let Some(name) = c.get("name").and_then(|v| v.as_str()) {
                let _ = crate::finances::sqlite_add_category(name.to_string());
                total_imported += 1;
            }
        }
    }

    // Métodos de Pago
    if let Some(arr) = payload.get("paymentMethods").and_then(|v| v.as_array()) {
        for pm in arr {
            if let Ok(method) = serde_json::from_value::<crate::finances::PaymentMethod>(pm.clone()) {
                let _ = crate::finances::sqlite_save_payment_method(method);
                total_imported += 1;
            }
        }
    }

    // Planes MSI
    if let Some(arr) = payload.get("msiPlans").and_then(|v| v.as_array()) {
        for p in arr {
            if let Ok(plan) = serde_json::from_value::<crate::finances::MsiPlan>(p.clone()) {
                let _ = crate::finances::sqlite_save_msi_plan(plan);
                total_imported += 1;
            }
        }
    }

    // Gastos Recurrentes
    if let Some(arr) = payload.get("recurringExpenses").and_then(|v| v.as_array()) {
        for r in arr {
            if let Ok(item) = serde_json::from_value::<crate::finances::RecurringExpense>(r.clone()) {
                let _ = crate::finances::sqlite_save_recurring_expense(item);
                total_imported += 1;
            }
        }
    }

    // Juegos Personalizados
    if let Some(arr) = payload.get("customGames").and_then(|v| v.as_array()) {
        for g in arr {
            if let Ok(game) = serde_json::from_value::<crate::leisure::CustomGame>(g.clone()) {
                let _ = crate::leisure::sqlite_save_custom_game(game);
                total_imported += 1;
            }
        }
    }

    // Catálogo Unificado Gaming
    if let Some(arr) = payload.get("gameCatalog").and_then(|v| v.as_array()) {
        if let Ok(c) = crate::leisure::sqlite_import_game_catalog(arr.clone()) {
            total_imported += c;
        }
    }

    // Estadísticas y Reseñas Gaming
    if let Some(arr) = payload.get("gameStats").and_then(|v| v.as_array()) {
        if let Ok(c) = crate::leisure::sqlite_import_game_stats(arr.clone()) {
            total_imported += c;
        }
    }

    // Sesiones de Juego
    if let Some(arr) = payload.get("gameSessions").and_then(|v| v.as_array()) {
        if let Ok(c) = crate::leisure::sqlite_import_game_sessions(arr.clone()) {
            total_imported += c;
        }
    }

    // Partidas Guardadas (Game Saves) P2P
    if let Some(arr) = payload.get("gameSaves").and_then(|v| v.as_array()) {
        if let Ok(c) = crate::leisure::sqlite_import_game_saves(arr.clone()) {
            total_imported += c;
        }
    }

    // Hitos Timeline
    if let Some(arr) = payload.get("timelineEvents").and_then(|v| v.as_array()) {
        for ev in arr {
            if let Ok(item) = serde_json::from_value::<crate::finances::TimelineEvent>(ev.clone()) {
                let _ = crate::finances::sqlite_save_timeline_event(item);
                total_imported += 1;
            }
        }
    }

    // Plugins comunitarios (archivos y manifiestos de extensiones instaladas para que estén disponibles)
    // El estado activo (communityPluginsEnabled) no se sobreescribe para respetar la preferencia local.
    if let Some(arr) = payload.get("communityPlugins").and_then(|v| v.as_array()) {
        if let Ok(exported) = serde_json::from_value::<Vec<crate::plugins::ExportedCommunityPlugin>>(serde_json::Value::Array(arr.clone())) {
            if let Ok(count) = crate::plugins::import_community_plugins_payload(exported) {
                total_imported += count;
            }
        }
    }

    Ok(total_imported)
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct P2pStatusReport {
    pub enabled: bool,
    pub is_active: bool,
    pub local_ip: String,
    pub device_id: String,
    pub device_name: String,
    pub discovery_port: u16,
    pub sync_port: u16,
    pub pairing_pin: String,
    pub pairing_pin_expires_at: u64,
    pub pin_remaining_secs: u64,
    pub discovered_peers: Vec<PeerInfo>,
    pub trusted_devices: Vec<TrustedDevice>,
}

#[tauri::command]
pub fn get_p2p_sync_status() -> Result<P2pStatusReport, String> {
    let now_secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();

    let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let mut needs_save = false;

    if cfg.p2p_sync.device_id.trim().is_empty() {
        cfg.p2p_sync.device_id = get_unique_device_id();
        needs_save = true;
    }

    let is_pin_expired = cfg
        .p2p_sync
        .pairing_pin_expires_at
        .map(|exp| now_secs >= exp)
        .unwrap_or(true);

    if is_pin_expired || cfg.p2p_sync.pairing_pin.trim().is_empty() {
        let (new_pin, new_exp) = crate::config::generate_random_pin_with_ttl();
        cfg.p2p_sync.pairing_pin = new_pin;
        cfg.p2p_sync.pairing_pin_expires_at = Some(new_exp);
        needs_save = true;
    }

    if needs_save {
        let _ = save_aegis_config(cfg.clone());
    }

    let peers_map = get_peers_map();
    let map = peers_map.lock().unwrap();

    let now_instant = Instant::now();
    let mut discovered: Vec<PeerInfo> = Vec::new();

    for (_id, internal) in map.iter() {
        let elapsed = now_instant.duration_since(internal.last_seen_instant).as_secs();
        if elapsed < 60 {
            let mut info = internal.info.clone();
            info.last_seen_secs_ago = elapsed;
            info.is_paired = cfg
                .p2p_sync
                .trusted_devices
                .iter()
                .any(|d| d.id == info.id && d.approved);
            discovered.push(info);
        }
    }

    let exp_at = cfg.p2p_sync.pairing_pin_expires_at.unwrap_or(now_secs + 600);
    let remaining = exp_at.saturating_sub(now_secs);

    Ok(P2pStatusReport {
        enabled: cfg.p2p_sync.enabled,
        is_active: P2P_ACTIVE.load(Ordering::Relaxed),
        local_ip: get_local_ip(),
        device_id: cfg.p2p_sync.device_id,
        device_name: cfg.p2p_sync.device_name,
        discovery_port: cfg.p2p_sync.discovery_port,
        sync_port: cfg.p2p_sync.sync_port,
        pairing_pin: cfg.p2p_sync.pairing_pin,
        pairing_pin_expires_at: exp_at,
        pin_remaining_secs: remaining,
        discovered_peers: discovered,
        trusted_devices: cfg.p2p_sync.trusted_devices,
    })
}

#[tauri::command]
pub fn toggle_p2p_sync(enabled: bool) -> Result<P2pStatusReport, String> {
    let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    cfg.p2p_sync.enabled = enabled;
    save_aegis_config(cfg)?;

    get_notify().notify_waiters();
    get_p2p_sync_status()
}

#[tauri::command]
pub fn update_p2p_device_name(name: String) -> Result<P2pStatusReport, String> {
    let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    cfg.p2p_sync.device_name = name.trim().to_string();
    save_aegis_config(cfg)?;

    get_notify().notify_waiters();
    get_p2p_sync_status()
}

#[tauri::command]
pub fn generate_new_pairing_pin() -> Result<String, String> {
    let (pin, expires_at) = crate::config::generate_random_pin_with_ttl();
    let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    cfg.p2p_sync.pairing_pin = pin.clone();
    cfg.p2p_sync.pairing_pin_expires_at = Some(expires_at);
    save_aegis_config(cfg)?;

    Ok(pin)
}

#[tauri::command]
pub async fn pair_with_remote_peer(
    peer_ip: String,
    peer_port: u16,
    pin: String,
) -> Result<String, String> {
    let my_id = get_unique_device_id();
    let cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let my_name = cfg.p2p_sync.device_name.clone();

    let target_url = format!("http://{}:{}/api/pair", peer_ip, peer_port);
    let payload = serde_json::json!({
        "pin": pin.trim(),
        "requesterId": my_id,
        "requesterName": my_name
    });

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(6))
        .build()
        .map_err(|e| e.to_string())?;

    let res = match client.post(&target_url).json(&payload).send().await {
        Ok(r) => r,
        Err(e) => {
            return Err(format!(
                "Error conectando con {}: {}. Verifica que ambos equipos estén en la misma red y que el puerto TCP {} no esté bloqueado en el firewall (ej. sudo firewall-cmd --add-port={}/tcp --permanent && sudo firewall-cmd --reload)",
                target_url, e, peer_port, peer_port
            ));
        }
    };

    if res.status().is_success() {
        let resp_json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
        let remote_device_id = resp_json
            .get("deviceId")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        let mut current_cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
        if !current_cfg.p2p_sync.trusted_devices.iter().any(|d| d.id == remote_device_id) {
            current_cfg.p2p_sync.trusted_devices.push(TrustedDevice {
                id: remote_device_id.to_string(),
                name: format!("Par {}", peer_ip),
                ip: peer_ip.clone(),
                pairing_code: pin.trim().to_string(),
                approved: true,
                last_synced_at: None,
            });
            save_aegis_config(current_cfg)?;
        }

        Ok(format!("Dispositivo {} emparejado con éxito", remote_device_id))
    } else {
        let error_body = res.json::<serde_json::Value>().await.ok();
        let error_detail = error_body
            .and_then(|v| v.get("error").and_then(|e| e.as_str()).map(|s| s.to_string()))
            .unwrap_or_else(|| "PIN incorrecto o expirado.".to_string());
        Err(format!("Fallo de emparejamiento: {}", error_detail))
    }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncExecutionResult {
    pub success: bool,
    pub peer_ip: String,
    pub items_received: usize,
    pub items_sent: usize,
    pub duration_ms: u128,
}

#[tauri::command]
pub async fn trigger_p2p_replicate(
    peer_ip: String,
    peer_port: u16,
) -> Result<SyncExecutionResult, String> {
    let start_time = Instant::now();
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    // 1. PULL remoto: pedir datos de la otra máquina
    let export_url = format!("http://{}:{}/api/sync/export", peer_ip, peer_port);
    let remote_data: serde_json::Value = client
        .get(&export_url)
        .send()
        .await
        .map_err(|e| format!("Fallo al obtener datos de {}: {}", export_url, e))?
        .json()
        .await
        .map_err(|e| format!("Respuesta remota corrupta: {}", e))?;

    let items_received = import_sync_database_payload(remote_data)?;

    // 2. PUSH local: enviar nuestros datos consolidados a la máquina remota
    let my_export = export_sync_database_payload()?;
    let import_url = format!("http://{}:{}/api/sync/import", peer_ip, peer_port);
    let push_res: serde_json::Value = client
        .post(&import_url)
        .json(&my_export)
        .send()
        .await
        .map_err(|e| format!("Fallo al empujar datos hacia {}: {}", import_url, e))?
        .json()
        .await
        .map_err(|e| format!("Error en confirmación remota: {}", e))?;

    let items_sent = push_res
        .get("itemsMerged")
        .and_then(|v| v.as_u64())
        .unwrap_or(0) as usize;

    // 3. Registrar marca temporal en trusted_devices
    if let Ok(mut cfg) = get_aegis_config() {
        let now_str = chrono_like_now();
        for dev in &mut cfg.p2p_sync.trusted_devices {
            if dev.ip == peer_ip {
                dev.last_synced_at = Some(now_str.clone());
            }
        }
        let _ = save_aegis_config(cfg.clone());
        notify_config_updated(&cfg);
    }

    let elapsed = start_time.elapsed().as_millis();
    Ok(SyncExecutionResult {
        success: true,
        peer_ip,
        items_received,
        items_sent,
        duration_ms: elapsed,
    })
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct P2pFirewallStatus {
    pub is_open: bool,
    pub firewall_type: String, // "firewalld" | "ufw" | "none"
    pub message: String,
}

#[tauri::command]
pub fn check_p2p_firewall_status() -> Result<P2pFirewallStatus, String> {
    // 1. Probar firewalld (Fedora / RHEL / openSUSE)
    let fw_active = std::process::Command::new("systemctl")
        .args(["is-active", "firewalld"])
        .output();
    if let Ok(out) = fw_active {
        if String::from_utf8_lossy(&out.stdout).trim() == "active" {
            let q_udp = std::process::Command::new("firewall-cmd")
                .args(["--query-port=53317/udp"])
                .status();
            let q_tcp = std::process::Command::new("firewall-cmd")
                .args(["--query-port=53318/tcp"])
                .status();
            let is_open = q_udp.map(|s| s.success()).unwrap_or(false)
                && q_tcp.map(|s| s.success()).unwrap_or(false);
            return Ok(P2pFirewallStatus {
                is_open,
                firewall_type: "firewalld".to_string(),
                message: if is_open {
                    "Puertos 53317 (UDP) y 53318 (TCP) autorizados en firewalld".to_string()
                } else {
                    "Puertos 53317 (UDP) y 53318 (TCP) cerrados en firewalld".to_string()
                },
            });
        }
    }

    // 2. Probar ufw (Ubuntu / Debian / Mint)
    let ufw_status = std::process::Command::new("ufw")
        .arg("status")
        .output();
    if let Ok(out) = ufw_status {
        let text = String::from_utf8_lossy(&out.stdout);
        if text.contains("Status: active") {
            let is_open = text.contains("53317/udp") && text.contains("53318/tcp");
            return Ok(P2pFirewallStatus {
                is_open,
                firewall_type: "ufw".to_string(),
                message: if is_open {
                    "Puertos 53317 (UDP) y 53318 (TCP) autorizados en ufw".to_string()
                } else {
                    "Puertos 53317 (UDP) y 53318 (TCP) cerrados en ufw".to_string()
                },
            });
        }
    }

    // Sin firewall activo detectado
    Ok(P2pFirewallStatus {
        is_open: true,
        firewall_type: "none".to_string(),
        message: "No se detectó un firewall activo que bloquee los puertos".to_string(),
    })
}

#[tauri::command]
pub fn open_p2p_firewall_terminal() -> Result<String, String> {
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    let script = "echo -e \"\\033[1;36m🛡️  Aegis P2P · Configuración de Firewall LAN\\033[0m\"; \
echo \"Habilitando puertos 53317/UDP y 53318/TCP en el firewall del sistema...\"; \
echo \"\"; \
if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active firewalld >/dev/null 2>&1; then \
    sudo firewall-cmd --add-port=53317/udp --add-port=53318/tcp --permanent && sudo firewall-cmd --reload; \
elif command -v ufw >/dev/null 2>&1; then \
    sudo ufw allow 53317/udp && sudo ufw allow 53318/tcp; \
else \
    echo \"No se detectó un firewall activo que requiera configuración.\"; \
fi; \
echo \"\"; \
echo -e \"\\033[1;32m✓ Puertos de red listos para sincronización P2P.\\033[0m Presiona ENTER para salir.\"; \
read -r";

    crate::environment::launch_terminal_in_dir(
        &home_dir,
        Some(script),
        Some("Aegis P2P Firewall Setup"),
        None,
        None,
    )
}

#[tauri::command]
pub fn unpair_peer_device(peer_id: String) -> Result<P2pStatusReport, String> {
    let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    cfg.p2p_sync.trusted_devices.retain(|d| d.id != peer_id);
    save_aegis_config(cfg)?;
    get_p2p_sync_status()
}

fn chrono_like_now() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    let hours = (now % 86400) / 3600;
    let minutes = (now % 3600) / 60;
    let seconds = now % 60;
    format!("Sync {:02}:{:02}:{:02}", hours, minutes, seconds)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_local_ip_resolution() {
        let ip = get_local_ip();
        assert!(!ip.is_empty());
    }

    #[test]
    fn test_export_sync_database_payload() {
        let payload = export_sync_database_payload();
        assert!(payload.is_ok());
        let val = payload.unwrap();
        assert!(val.get("deviceId").is_some());
        assert!(val.get("transactions").is_some());
        assert!(val.get("paymentMethods").is_some());
        assert!(val.get("msiPlans").is_some());
        assert!(val.get("recurringExpenses").is_some());
        assert!(val.get("gameSaves").is_some());
        assert!(val.get("settings").is_none(), "Settings de entorno local no deben ser exportados en P2P");
    }
}
