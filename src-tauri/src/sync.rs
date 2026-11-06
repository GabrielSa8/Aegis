use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::net::{SocketAddr, UdpSocket};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::Notify;

use crate::config::{get_aegis_config, save_aegis_config, TrustedDevice};
use crate::db::get_db_connection;

pub static P2P_ACTIVE: AtomicBool = AtomicBool::new(false);

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
    let hostname = std::env::var("HOSTNAME").unwrap_or_else(|_| "host".to_string());
    let user = std::env::var("USER").unwrap_or_else(|_| "operator".to_string());
    format!("aegis-{}-{}", user, hostname)
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
                let notify_clone = notify.clone();
                let peers_map_clone = peers_map.clone();
                tokio::spawn(async move {
                    loop {
                        let config = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
                        if !config.p2p_sync.enabled {
                            P2P_ACTIVE.store(false, Ordering::Relaxed);
                            tokio::select! {
                                _ = tokio::time::sleep(Duration::from_secs(3)) => {},
                                _ = notify_clone.notified() => {},
                            }
                            continue;
                        }

                        P2P_ACTIVE.store(true, Ordering::Relaxed);
                        let disc_port = config.p2p_sync.discovery_port;
                        let sync_port = config.p2p_sync.sync_port;
                        let my_id = get_unique_device_id();
                        let my_name = config.p2p_sync.device_name.clone();

                        // Bind UDP socket para broadcast y escucha
                        let socket = match tokio::net::UdpSocket::bind(format!("0.0.0.0:{}", disc_port)).await {
                            Ok(s) => {
                                let _ = s.set_broadcast(true);
                                Arc::new(s)
                            }
                            Err(e) => {
                                log::warn!("[Aegis P2P] No se pudo enlazar UDP {}: {}", disc_port, e);
                                tokio::time::sleep(Duration::from_secs(5)).await;
                                continue;
                            }
                        };

                        let socket_sender = socket.clone();
                        let my_id_send = my_id.clone();
                        let my_name_send = my_name.clone();

                        // Tarea emisora de beacon cada 3 segundos
                        let beacon_handle = tokio::spawn(async move {
                            let target: SocketAddr = format!("255.255.255.255:{}", disc_port).parse().unwrap();
                            while P2P_ACTIVE.load(Ordering::Relaxed) {
                                let beacon = BeaconPayload {
                                    protocol: "aegis-p2p-v1".to_string(),
                                    device_id: my_id_send.clone(),
                                    device_name: my_name_send.clone(),
                                    sync_port,
                                    version: env!("CARGO_PKG_VERSION").to_string(),
                                };
                                if let Ok(bytes) = serde_json::to_vec(&beacon) {
                                    let _ = socket_sender.send_to(&bytes, target).await;
                                }
                                tokio::time::sleep(Duration::from_secs(3)).await;
                            }
                        });

                        // Tarea receptora de beacons
                        let mut buf = [0u8; 1024];
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
                                _ = notify_clone.notified() => {
                                    break;
                                }
                            }
                        }

                        beacon_handle.abort();
                    }
                });

                // 2. Iniciar servidor TCP/HTTP ligero para transferencias P2P
                loop {
                    let config = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
                    if !config.p2p_sync.enabled {
                        tokio::time::sleep(Duration::from_secs(3)).await;
                        continue;
                    }

                    let sync_port = config.p2p_sync.sync_port;
                    let listener = match TcpListener::bind(format!("0.0.0.0:{}", sync_port)).await {
                        Ok(l) => l,
                        Err(e) => {
                            log::warn!("[Aegis P2P Server] Error bind TCP {}: {}", sync_port, e);
                            tokio::time::sleep(Duration::from_secs(5)).await;
                            continue;
                        }
                    };

                    log::info!("[Aegis P2P Server] Escuchando en 0.0.0.0:{}", sync_port);

                    while P2P_ACTIVE.load(Ordering::Relaxed) {
                        if let Ok((mut stream, addr)) = listener.accept().await {
                            tokio::spawn(async move {
                                let _ = handle_peer_connection(&mut stream, addr).await;
                            });
                        }
                    }
                }
            });
        });
}

async fn handle_peer_connection(stream: &mut TcpStream, _addr: SocketAddr) -> Result<(), String> {
    let mut buffer = Vec::new();
    let mut temp = [0u8; 4096];

    // Leer cabecera HTTP mínima
    loop {
        let n = stream.read(&mut temp).await.map_err(|e| e.to_string())?;
        if n == 0 {
            break;
        }
        buffer.extend_from_slice(&temp[..n]);
        if buffer.windows(4).any(|w| w == b"\r\n\r\n") {
            break;
        }
        if buffer.len() > 1024 * 1024 * 16 {
            // Límite de seguridad 16MB
            break;
        }
    }

    let request_str = String::from_utf8_lossy(&buffer);
    let mut lines = request_str.lines();
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
        // Encontrar body
        let body_str = request_str.split("\r\n\r\n").nth(1).unwrap_or("");
        let parse_res: Result<serde_json::Value, _> = serde_json::from_str(body_str);
        if let Ok(body) = parse_res {
            let req_pin = body.get("pin").and_then(|v| v.as_str()).unwrap_or("");
            let req_id = body.get("requesterId").and_then(|v| v.as_str()).unwrap_or("");
            let req_name = body.get("requesterName").and_then(|v| v.as_str()).unwrap_or("Dispositivo Remoto");

            let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
            if req_pin == cfg.p2p_sync.pairing_pin && !req_pin.is_empty() {
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
                let res = serde_json::json!({ "success": false, "error": "PIN inválido" });
                send_http_json_response(stream, 401, &res).await?;
            }
        }
    } else if method == "GET" && path == "/api/sync/export" {
        // Exportar datos SQLite consolidables
        let export_data = export_sync_database_payload()?;
        send_http_json_response(stream, 200, &export_data).await?;
    } else if method == "POST" && path == "/api/sync/import" {
        let body_str = request_str.split("\r\n\r\n").nth(1).unwrap_or("");
        if let Ok(payload) = serde_json::from_str::<serde_json::Value>(body_str) {
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
    let custom_games = crate::leisure::sqlite_get_custom_games().unwrap_or_default();
    let timeline = crate::finances::sqlite_get_timeline_events().unwrap_or_default();

    Ok(serde_json::json!({
        "deviceId": get_unique_device_id(),
        "exportedAt": SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        "transactions": tx_data,
        "budgets": budgets,
        "categories": categories,
        "customGames": custom_games,
        "timelineEvents": timeline
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

    // Juegos Personalizados
    if let Some(arr) = payload.get("customGames").and_then(|v| v.as_array()) {
        for g in arr {
            if let Ok(game) = serde_json::from_value::<crate::leisure::CustomGame>(g.clone()) {
                let _ = crate::leisure::sqlite_save_custom_game(game);
                total_imported += 1;
            }
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
    pub discovered_peers: Vec<PeerInfo>,
    pub trusted_devices: Vec<TrustedDevice>,
}

#[tauri::command]
pub fn get_p2p_sync_status() -> Result<P2pStatusReport, String> {
    let cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let peers_map = get_peers_map();
    let map = peers_map.lock().unwrap();

    let now = Instant::now();
    let mut discovered: Vec<PeerInfo> = Vec::new();

    for (_id, internal) in map.iter() {
        let elapsed = now.duration_since(internal.last_seen_instant).as_secs();
        if elapsed < 30 {
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

    Ok(P2pStatusReport {
        enabled: cfg.p2p_sync.enabled,
        is_active: P2P_ACTIVE.load(Ordering::Relaxed),
        local_ip: get_local_ip(),
        device_id: get_unique_device_id(),
        device_name: cfg.p2p_sync.device_name,
        discovery_port: cfg.p2p_sync.discovery_port,
        sync_port: cfg.p2p_sync.sync_port,
        pairing_pin: cfg.p2p_sync.pairing_pin,
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
    use std::time::SystemTime;
    let seed = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let pin = format!("{:06}", (seed % 900_000) + 100_000);

    let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    cfg.p2p_sync.pairing_pin = pin.clone();
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
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .post(&target_url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Error conectando con {}: {}", target_url, e))?;

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
        Err(format!("Error de emparejamiento. Verifica que el PIN coincida."))
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
        let _ = save_aegis_config(cfg);
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
    }
}
