use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter};
use crate::db::get_db_connection;
use rusqlite::params;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameStats {
    pub game_id: String,
    pub game_title: String,
    pub is_steam: bool,
    pub total_play_time_seconds: i64,
    pub sessions_count: i64,
    pub rating: i32,
    pub review: Option<String>,
    pub obsidian_note_path: Option<String>,
    pub last_played: Option<String>,
    pub achievements_unlocked: Option<usize>,
    pub achievements_total: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameSession {
    pub id: String,
    pub game_id: String,
    pub game_title: String,
    pub is_steam: bool,
    pub duration_seconds: i64,
    pub started_at: String,
    pub ended_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AchievementItem {
    pub id: String,
    pub name: String,
    pub description: String,
    pub icon_url: Option<String>,
    pub unlocked: bool,
    pub unlocked_at: Option<String>,
    pub is_custom: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameAchievementsReport {
    pub total: usize,
    pub unlocked: usize,
    pub percentage: f32,
    pub items: Vec<AchievementItem>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GamingStatus {
    pub gamemode_active: bool,
    pub gamemode_installed: bool,
    pub gamescope_installed: bool,
    pub mangohud_installed: bool,
    pub gpu_driver: String,
    pub default_launch_command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SteamGame {
    pub app_id: String,
    pub name: String,
    pub install_dir: String,
    pub size_mb: u64,
    pub last_played: u64,
    pub cover_image: Option<String>,
    pub achievements_unlocked: Option<usize>,
    pub achievements_total: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomGame {
    pub id: String,
    pub title: String,
    pub category: String,
    pub launch_type: String, // "url", "flatpak", "cmd", "steam"
    pub launch_target: String,
    pub description: Option<String>,
    pub banner_url: Option<String>,
    pub play_time_minutes: i64,
    pub last_played: Option<String>,
    pub created_at: String,
    pub achievements_unlocked: Option<usize>,
    pub achievements_total: Option<usize>,
}

fn to_base64(bytes: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((bytes.len() + 2) / 3 * 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        out.push(TABLE[(triple >> 18) & 63] as char);
        out.push(TABLE[(triple >> 12) & 63] as char);
        if chunk.len() > 1 {
            out.push(TABLE[(triple >> 6) & 63] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(TABLE[triple & 63] as char);
        } else {
            out.push('=');
        }
    }
    out
}

fn get_local_steam_cover(app_id: &str) -> Option<String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let base_dirs = [
        format!("{}/.local/share/Steam/appcache/librarycache/{}", home, app_id),
        format!("{}/.steam/steam/appcache/librarycache/{}", home, app_id),
        format!("{}/.var/app/com.valvesoftware.Steam/data/Steam/appcache/librarycache/{}", home, app_id),
    ];

    for base in &base_dirs {
        let p = Path::new(base);
        if !p.exists() {
            continue;
        }

        // Búsqueda directa en la raíz de la carpeta del appid
        let direct_checks = [
            p.join("library_600x900.jpg"),
            p.join("library_capsule.jpg"),
            p.join("header.jpg"),
            p.join("library_header.jpg"),
        ];

        for candidate in &direct_checks {
            if candidate.exists() {
                if let Ok(bytes) = fs::read(candidate) {
                    if !bytes.is_empty() {
                        return Some(format!("data:image/jpeg;base64,{}", to_base64(&bytes)));
                    }
                }
            }
        }

        // Búsqueda en subdirectorios con hash de Steam (ej. bbc6faab.../library_capsule.jpg)
        if let Ok(entries) = fs::read_dir(p) {
            for entry in entries.flatten() {
                let sub = entry.path();
                if sub.is_dir() {
                    let sub_candidates = [
                        sub.join("library_600x900.jpg"),
                        sub.join("library_capsule.jpg"),
                        sub.join("library_header.jpg"),
                        sub.join("header.jpg"),
                    ];
                    for candidate in &sub_candidates {
                        if candidate.exists() {
                            if let Ok(bytes) = fs::read(candidate) {
                                if !bytes.is_empty() {
                                    return Some(format!("data:image/jpeg;base64,{}", to_base64(&bytes)));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    None
}

fn detect_gpu_driver() -> String {
    for card_idx in 0..4 {
        let uevent_path = format!("/sys/class/drm/card{}/device/uevent", card_idx);
        if let Ok(content) = fs::read_to_string(&uevent_path) {
            for line in content.lines() {
                if line.starts_with("DRIVER=") {
                    let d = line.replace("DRIVER=", "").trim().to_string();
                    if !d.is_empty() {
                        return match d.as_str() {
                            "i915" => "Intel Graphics (i915/Mesa)".to_string(),
                            "xe" => "Intel Xe (Mesa)".to_string(),
                            "amdgpu" => "AMD Radeon (amdgpu/Mesa)".to_string(),
                            "nvidia" => "NVIDIA Proprietary".to_string(),
                            "nouveau" => "Nouveau (Open Source)".to_string(),
                            other => format!("{} (Mesa/DRM)", other),
                        };
                    }
                }
            }
        }
    }
    "Acelerador Genérico / Mesa DRM".to_string()
}

#[tauri::command]
pub fn get_gaming_status() -> Result<GamingStatus, String> {
    let gamemode_installed = Path::new("/usr/bin/gamemoded").exists();
    let gamescope_installed = Path::new("/usr/bin/gamescope").exists();
    let mangohud_installed = Path::new("/usr/bin/mangohud").exists();

    let mut gamemode_active = false;
    if gamemode_installed {
        if let Ok(output) = Command::new("gamemoded").arg("-s").output() {
            if let Ok(s) = String::from_utf8(output.stdout) {
                if s.contains("is active") {
                    gamemode_active = true;
                }
            }
        }
    }

    Ok(GamingStatus {
        gamemode_active,
        gamemode_installed,
        gamescope_installed,
        mangohud_installed,
        gpu_driver: detect_gpu_driver(),
        default_launch_command: "gamemoderun %command%".to_string(),
    })
}

fn extract_acf_val(line: &str) -> Option<String> {
    let parts: Vec<&str> = line.split('"').filter(|s| !s.trim().is_empty()).collect();
    if parts.len() >= 2 {
        Some(parts[1].to_string())
    } else {
        None
    }
}

fn collect_steam_library_folders() -> Vec<PathBuf> {
    let mut folders = Vec::new();
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let base_candidates = [
        format!("{}/.local/share/Steam", home),
        format!("{}/.steam/steam", home),
        format!("{}/.var/app/com.valvesoftware.Steam/data/Steam", home),
    ];

    let mut visited = HashSet::new();

    for base in &base_candidates {
        let base_path = PathBuf::from(base);
        if !base_path.exists() {
            continue;
        }

        let steamapps = base_path.join("steamapps");
        if steamapps.exists() {
            if let Ok(canonical) = steamapps.canonicalize() {
                if visited.insert(canonical.clone()) {
                    folders.push(canonical.clone());
                }
            } else if visited.insert(steamapps.clone()) {
                folders.push(steamapps.clone());
            }
        }

        let vdf_path = steamapps.join("libraryfolders.vdf");
        if let Ok(content) = fs::read_to_string(&vdf_path) {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("\"path\"") {
                    if let Some(val) = extract_acf_val(trimmed) {
                        let extra_apps = PathBuf::from(&val).join("steamapps");
                        if extra_apps.exists() {
                            if let Ok(canon) = extra_apps.canonicalize() {
                                if visited.insert(canon.clone()) {
                                    folders.push(canon);
                                }
                            } else if visited.insert(extra_apps.clone()) {
                                folders.push(extra_apps);
                            }
                        }
                    }
                }
            }
        }
    }

    folders
}

#[tauri::command]
pub fn get_installed_steam_games() -> Result<Vec<SteamGame>, String> {
    let mut games = Vec::new();
    let mut seen_appids = HashSet::new();
    let library_folders = collect_steam_library_folders();
    let prog_map = get_steam_achievement_progress_map();

    for steamapps in library_folders {
        if let Ok(entries) = fs::read_dir(&steamapps) {
            for entry in entries.flatten() {
                let p = entry.path();
                if let Some(file_name) = p.file_name().and_then(|n| n.to_str()) {
                    if file_name.starts_with("appmanifest_") && file_name.ends_with(".acf") {
                        if let Ok(content) = fs::read_to_string(&p) {
                            let mut appid = String::new();
                            let mut name = String::new();
                            let mut installdir = String::new();
                            let mut size_bytes: u64 = 0;
                            let mut last_played: u64 = 0;

                            for line in content.lines() {
                                let trimmed = line.trim();
                                if trimmed.starts_with("\"appid\"") {
                                    if let Some(val) = extract_acf_val(trimmed) {
                                        appid = val;
                                    }
                                } else if trimmed.starts_with("\"name\"") {
                                    if let Some(val) = extract_acf_val(trimmed) {
                                        name = val;
                                    }
                                } else if trimmed.starts_with("\"installdir\"") {
                                    if let Some(val) = extract_acf_val(trimmed) {
                                        installdir = val;
                                    }
                                } else if trimmed.starts_with("\"SizeOnDisk\"") {
                                    if let Some(val) = extract_acf_val(trimmed) {
                                        size_bytes = val.parse::<u64>().unwrap_or(0);
                                    }
                                } else if trimmed.starts_with("\"LastPlayed\"") {
                                    if let Some(val) = extract_acf_val(trimmed) {
                                        last_played = val.parse::<u64>().unwrap_or(0);
                                    }
                                }
                            }

                            if !appid.is_empty()
                                && !name.is_empty()
                                && !name.contains("Steam Linux Runtime")
                                && !name.contains("Proton")
                                && !name.contains("Steamworks")
                                && !name.contains("SteamVR")
                                && seen_appids.insert(appid.clone())
                            {
                                let cover_image = get_local_steam_cover(&appid);
                                let (ach_unlocked, ach_total) = match prog_map.get(&appid) {
                                    Some(&(u, t)) if t > 0 => (Some(u), Some(t)),
                                    _ => (None, None),
                                };
                                games.push(SteamGame {
                                    app_id: appid,
                                    name,
                                    install_dir: installdir,
                                    size_mb: size_bytes / (1024 * 1024),
                                    last_played,
                                    cover_image,
                                    achievements_unlocked: ach_unlocked,
                                    achievements_total: ach_total,
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    games.sort_by(|a, b| {
        b.last_played
            .cmp(&a.last_played)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });

    Ok(games)
}

fn build_accelerated_command(
    base_bin: &str,
    base_args: &[&str],
    use_gamemode: bool,
    use_gamescope: bool,
    use_mangohud: bool,
    gamescope_res: Option<String>,
) -> Command {
    let gamemode_avail = Path::new("/usr/bin/gamemoded").exists();
    let gamescope_avail = Path::new("/usr/bin/gamescope").exists();
    let mangohud_avail = Path::new("/usr/bin/mangohud").exists();

    if use_gamescope && gamescope_avail {
        let mut cmd = Command::new("gamescope");
        let (w, h) = match gamescope_res.as_deref() {
            Some("540p") => ("960", "540"),
            Some("1080p") => ("1920", "1080"),
            _ => ("1280", "720"),
        };
        cmd.args(["-W", w, "-H", h, "-r", "60", "-F", "fsr", "--"]);

        if use_gamemode && gamemode_avail {
            cmd.arg("gamemoderun");
        }
        if use_mangohud && mangohud_avail {
            cmd.arg("mangohud");
        }
        cmd.arg(base_bin);
        for a in base_args {
            cmd.arg(a);
        }
        cmd
    } else if use_gamemode && gamemode_avail {
        let mut cmd = Command::new("gamemoderun");
        if use_mangohud && mangohud_avail {
            cmd.arg("mangohud");
        }
        cmd.arg(base_bin);
        for a in base_args {
            cmd.arg(a);
        }
        cmd
    } else if use_mangohud && mangohud_avail {
        let mut cmd = Command::new("mangohud");
        cmd.arg(base_bin);
        for a in base_args {
            cmd.arg(a);
        }
        cmd
    } else {
        let mut cmd = Command::new(base_bin);
        for a in base_args {
            cmd.arg(a);
        }
        cmd
    }
}

// ==========================================
// 🎮 Centinela de Sesión de Juego Automática
// ==========================================

static ACTIVE_GAME_CANCEL: Mutex<Option<Arc<AtomicBool>>> = Mutex::new(None);

pub fn cancel_current_game_monitor() {
    if let Ok(mut guard) = ACTIVE_GAME_CANCEL.lock() {
        if let Some(token) = guard.take() {
            token.store(true, Ordering::SeqCst);
        }
    }
}

#[tauri::command]
pub fn cancel_game_session() -> Result<bool, String> {
    cancel_current_game_monitor();
    Ok(true)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameSessionAutoEndedPayload {
    pub game_id: String,
    pub game_title: String,
    pub is_steam: bool,
    pub duration_seconds: i64,
    pub started_at: String,
    pub ended_at: String,
}

fn is_steam_appid_running(target_appid: &str) -> bool {
    let needle1 = format!("SteamAppId={}", target_appid).into_bytes();
    let needle2 = format!("SteamGameId={}", target_appid).into_bytes();

    let proc_dir = match std::fs::read_dir("/proc") {
        Ok(d) => d,
        Err(_) => return false,
    };

    for entry in proc_dir.flatten() {
        let file_name = entry.file_name();
        let name_str = file_name.to_string_lossy();
        if name_str.chars().all(|c| c.is_ascii_digit()) {
            let env_path = format!("/proc/{}/environ", name_str);
            if let Ok(bytes) = std::fs::read(&env_path) {
                for var in bytes.split(|&b| b == 0) {
                    if var == needle1.as_slice() || var == needle2.as_slice() {
                        return true;
                    }
                }
            }
        }
    }
    false
}

fn finish_and_record_auto_session(
    app: &AppHandle,
    game_id: &str,
    game_title: &str,
    is_steam: bool,
    duration_seconds: i64,
    started_at_iso: String,
) {
    let ended_at_iso = match get_db_connection() {
        Ok(conn) => conn
            .query_row("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', 'now')", [], |r| r.get(0))
            .unwrap_or_else(|_| "now".to_string()),
        Err(_) => "now".to_string(),
    };

    let _ = record_game_session(
        game_id.to_string(),
        game_title.to_string(),
        is_steam,
        duration_seconds,
        started_at_iso.clone(),
        ended_at_iso.clone(),
    );

    let payload = GameSessionAutoEndedPayload {
        game_id: game_id.to_string(),
        game_title: game_title.to_string(),
        is_steam,
        duration_seconds,
        started_at: started_at_iso,
        ended_at: ended_at_iso,
    };
    let _ = app.emit("aegis:game-session-auto-ended", payload);

    let mins = std::cmp::max(1, duration_seconds / 60);
    let _ = crate::notifications::send_desktop_notification(
        app.clone(),
        "🎮 Sesión de Juego Finalizada".to_string(),
        format!("Has jugado a '{}' durante {} min. Sesión guardada.", game_title, mins),
        None,
    );
}

#[tauri::command]
pub fn launch_game(
    app: AppHandle,
    game_id: Option<String>,
    target: Option<String>,
    game_title: Option<String>,
    _is_steam: Option<bool>,
    launch_type: Option<String>,
    launch_target: Option<String>,
    use_gamemode: Option<bool>,
    use_gamescope_fsr: Option<bool>,
    use_mangohud: Option<bool>,
    gamescope_res: Option<String>,
) -> Result<String, String> {
    let gamemode_flag = use_gamemode.unwrap_or(true);
    let gamescope_flag = use_gamescope_fsr.unwrap_or(false);
    let mangohud_flag = use_mangohud.unwrap_or(false);

    let final_game_id = game_id.or(target.clone()).unwrap_or_else(|| "steam".to_string());

    let l_type = launch_type.unwrap_or_else(|| {
        if final_game_id.starts_with("steam:") || final_game_id == "steam" {
            "steam".to_string()
        } else if final_game_id.starts_with("http://") || final_game_id.starts_with("https://") || final_game_id.starts_with("url:") {
            "url".to_string()
        } else if final_game_id.starts_with("flatpak:") {
            "flatpak".to_string()
        } else {
            "cmd".to_string()
        }
    });

    let final_target = launch_target.or(target).unwrap_or_else(|| {
        if final_game_id.starts_with("steam:") {
            final_game_id[6..].to_string()
        } else if final_game_id.starts_with("url:") {
            final_game_id[4..].to_string()
        } else if final_game_id.starts_with("flatpak:") {
            final_game_id[8..].to_string()
        } else if final_game_id.starts_with("cmd:") {
            final_game_id[4..].to_string()
        } else {
            final_game_id.clone()
        }
    });

    // Cancelar cualquier monitor previo
    cancel_current_game_monitor();
    let cancel_token = Arc::new(AtomicBool::new(false));
    if let Ok(mut guard) = ACTIVE_GAME_CANCEL.lock() {
        *guard = Some(cancel_token.clone());
    }

    let started_at_iso = match get_db_connection() {
        Ok(conn) => conn
            .query_row("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', 'now')", [], |r| r.get(0))
            .unwrap_or_else(|_| "now".to_string()),
        Err(_) => "now".to_string(),
    };
    let start_instant = std::time::Instant::now();

    match l_type.as_str() {
        "url" => {
            let _ = Command::new("xdg-open").arg(&final_target).spawn();
            Ok(format!("Enlace web abierto: {}", final_target))
        }
        "steam" => {
            if final_target == "steam" || final_target.is_empty() {
                let mut cmd = build_accelerated_command("steam", &[], gamemode_flag, gamescope_flag, mangohud_flag, gamescope_res);
                cmd.spawn().map_err(|e| format!("Error iniciando Steam: {}", e))?;
                Ok("Cliente Steam iniciado con aceleración.".to_string())
            } else {
                let run_arg = format!("steam://run/{}", final_target);
                let mut cmd = build_accelerated_command("steam", &[&run_arg], gamemode_flag, gamescope_flag, mangohud_flag, gamescope_res);
                cmd.spawn().map_err(|e| format!("Error lanzando título Steam {}: {}", final_target, e))?;

                // Iniciar centinela de proceso Steam en segundo plano
                let app_clone = app.clone();
                let g_id = if final_game_id.starts_with("steam:") {
                    final_game_id[6..].to_string()
                } else {
                    final_game_id.clone()
                };
                let g_title = game_title.unwrap_or_else(|| format!("Steam App {}", final_target));
                let target_clone = final_target.clone();
                let token = cancel_token.clone();

                std::thread::spawn(move || {
                    // Esperar hasta 60s a que Steam levante el juego
                    let deadline = std::time::Instant::now() + std::time::Duration::from_secs(60);
                    let mut detected = false;
                    while std::time::Instant::now() < deadline {
                        if token.load(Ordering::SeqCst) {
                            return;
                        }
                        if is_steam_appid_running(&target_clone) {
                            detected = true;
                            break;
                        }
                        std::thread::sleep(std::time::Duration::from_secs(2));
                    }

                    if !detected {
                        return;
                    }

                    // Vigilar hasta que el proceso desaparezca de /proc
                    loop {
                        if token.load(Ordering::SeqCst) {
                            return;
                        }
                        std::thread::sleep(std::time::Duration::from_secs(3));
                        if token.load(Ordering::SeqCst) {
                            return;
                        }
                        if !is_steam_appid_running(&target_clone) {
                            // Margen de gracia de 2s para descartar reinicios transitorios
                            std::thread::sleep(std::time::Duration::from_secs(2));
                            if !is_steam_appid_running(&target_clone) {
                                break;
                            }
                        }
                    }

                    if token.load(Ordering::SeqCst) {
                        return;
                    }

                    let duration_seconds = start_instant.elapsed().as_secs() as i64;
                    if duration_seconds >= 5 {
                        finish_and_record_auto_session(&app_clone, &g_id, &g_title, true, duration_seconds, started_at_iso);
                    }
                });

                Ok(format!("Iniciando título Steam (AppID: {})", final_target))
            }
        }
        "flatpak" => {
            let mut cmd = build_accelerated_command("flatpak", &["run", &final_target], gamemode_flag, gamescope_flag, mangohud_flag, gamescope_res);
            let mut child = cmd.spawn().map_err(|e| format!("Error ejecutando Flatpak {}: {}", final_target, e))?;

            let app_clone = app.clone();
            let g_id = final_game_id.clone();
            let g_title = game_title.unwrap_or_else(|| final_target.clone());
            let token = cancel_token.clone();

            std::thread::spawn(move || {
                loop {
                    if token.load(Ordering::SeqCst) {
                        return;
                    }
                    match child.try_wait() {
                        Ok(Some(_status)) => break,
                        Ok(None) => std::thread::sleep(std::time::Duration::from_millis(1500)),
                        Err(_) => break,
                    }
                }

                if token.load(Ordering::SeqCst) {
                    return;
                }

                let duration_seconds = start_instant.elapsed().as_secs() as i64;
                if duration_seconds >= 5 {
                    finish_and_record_auto_session(&app_clone, &g_id, &g_title, false, duration_seconds, started_at_iso);
                }
            });

            Ok(format!("Lanzando aplicación Flatpak: {}", final_target))
        }
        "cmd" | _ => {
            let shell_script = if gamemode_flag && Path::new("/usr/bin/gamemoded").exists() {
                format!("gamemoderun {}", final_target)
            } else {
                final_target.clone()
            };
            let mut cmd = Command::new("sh");
            cmd.arg("-c").arg(&shell_script);
            let mut child = cmd.spawn().map_err(|e| format!("Error ejecutando comando {}: {}", final_target, e))?;

            let app_clone = app.clone();
            let g_id = final_game_id.clone();
            let g_title = game_title.unwrap_or_else(|| final_target.clone());
            let token = cancel_token.clone();

            std::thread::spawn(move || {
                loop {
                    if token.load(Ordering::SeqCst) {
                        return;
                    }
                    match child.try_wait() {
                        Ok(Some(_status)) => break,
                        Ok(None) => std::thread::sleep(std::time::Duration::from_millis(1500)),
                        Err(_) => break,
                    }
                }

                if token.load(Ordering::SeqCst) {
                    return;
                }

                let duration_seconds = start_instant.elapsed().as_secs() as i64;
                if duration_seconds >= 5 {
                    finish_and_record_auto_session(&app_clone, &g_id, &g_title, false, duration_seconds, started_at_iso);
                }
            });

            Ok(format!("Comando iniciado: {}", final_target))
        }
    }
}

// ==========================================
// 🎮 SQLite CRUD: Custom Games & Emulators
// ==========================================

#[tauri::command]
pub fn sqlite_get_custom_games() -> Result<Vec<CustomGame>, String> {
    let conn = get_db_connection()?;

    let mut custom_ach_counts: HashMap<String, (usize, usize)> = HashMap::new();
    if let Ok(mut ach_stmt) = conn.prepare(
        "SELECT game_id, COUNT(*), SUM(CASE WHEN unlocked = 1 THEN 1 ELSE 0 END) FROM custom_achievements GROUP BY game_id",
    ) {
        if let Ok(rows) = ach_stmt.query_map([], |row| {
            let gid: String = row.get(0)?;
            let tot: i64 = row.get(1)?;
            let unl: i64 = row.get(2)?;
            Ok((gid, (unl as usize, tot as usize)))
        }) {
            for r in rows.flatten() {
                custom_ach_counts.insert(r.0, r.1);
            }
        }
    }

    let mut stmt = conn
        .prepare(
            "SELECT id, title, category, launch_type, launch_target, description, banner_url, play_time_minutes, last_played, created_at
             FROM custom_games ORDER BY title ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let (ach_unlocked, ach_total) = match custom_ach_counts.get(&id) {
                Some(&(u, t)) if t > 0 => (Some(u), Some(t)),
                _ => (None, None),
            };
            Ok(CustomGame {
                id,
                title: row.get(1)?,
                category: row.get(2)?,
                launch_type: row.get(3)?,
                launch_target: row.get(4)?,
                description: row.get(5)?,
                banner_url: row.get(6)?,
                play_time_minutes: row.get(7)?,
                last_played: row.get(8)?,
                created_at: row.get(9)?,
                achievements_unlocked: ach_unlocked,
                achievements_total: ach_total,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut games = Vec::new();
    for r in rows {
        if let Ok(g) = r {
            games.push(g);
        }
    }
    Ok(games)
}

#[tauri::command]
pub fn sqlite_save_custom_game(game: CustomGame) -> Result<String, String> {
    let conn = get_db_connection()?;
    conn.execute(
        "INSERT INTO custom_games (id, title, category, launch_type, launch_target, description, banner_url, play_time_minutes, last_played, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
         ON CONFLICT(id) DO UPDATE SET
            title = excluded.title,
            category = excluded.category,
            launch_type = excluded.launch_type,
            launch_target = excluded.launch_target,
            description = excluded.description,
            banner_url = excluded.banner_url,
            play_time_minutes = excluded.play_time_minutes,
            last_played = excluded.last_played",
        params![
            game.id,
            game.title,
            game.category,
            game.launch_type,
            game.launch_target,
            game.description,
            game.banner_url,
            game.play_time_minutes,
            game.last_played,
            game.created_at
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok("Lanzador guardado correctamente.".to_string())
}

#[tauri::command]
pub fn sqlite_delete_custom_game(id: String) -> Result<String, String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM custom_games WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Lanzador eliminado.".to_string())
}

#[tauri::command]
pub fn sqlite_record_game_session(id: String, minutes: i64) -> Result<String, String> {
    let conn = get_db_connection()?;
    conn.execute(
        "UPDATE custom_games 
         SET play_time_minutes = play_time_minutes + ?1, last_played = datetime('now')
         WHERE id = ?2",
        params![minutes, id],
    )
    .map_err(|e| e.to_string())?;
    Ok("Sesión registrada.".to_string())
}

// =========================================================================
// 🏆 Fase 7.4: Steam Offline Cache, Sesiones, Tiempos, Logros y Bóveda
// =========================================================================

fn get_steam_librarycache_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let base_userdata = [
        format!("{}/.local/share/Steam/userdata", home),
        format!("{}/.steam/steam/userdata", home),
        format!("{}/.var/app/com.valvesoftware.Steam/data/Steam/userdata", home),
    ];

    for base in &base_userdata {
        let p = Path::new(base);
        if let Ok(entries) = fs::read_dir(p) {
            for entry in entries.flatten() {
                let cache_dir = entry.path().join("config").join("librarycache");
                if cache_dir.exists() {
                    dirs.push(cache_dir);
                }
            }
        }
    }
    dirs
}

fn get_steam_achievement_progress_map() -> HashMap<String, (usize, usize)> {
    let mut map = HashMap::new();
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let stats_dirs = [
        format!("{}/.local/share/Steam/appcache/stats", home),
        format!("{}/.steam/steam/appcache/stats", home),
        format!("{}/.var/app/com.valvesoftware.Steam/data/Steam/appcache/stats", home),
    ];

    for cache_dir in get_steam_librarycache_dirs() {
        // 1. Parsear archivo global de progreso si existe
        let prog_file = cache_dir.join("achievement_progress.json");
        if let Ok(content) = fs::read_to_string(&prog_file) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(arr) = val.get("mapCache").and_then(|v| v.as_array()) {
                    for entry in arr {
                        if let Some(pair) = entry.as_array() {
                            if pair.len() == 2 {
                                let appid = pair[0].to_string();
                                if let Some(obj) = pair[1].as_object() {
                                    let unlocked = obj.get("unlocked").and_then(|u| u.as_u64()).unwrap_or(0) as usize;
                                    let total = obj.get("total").and_then(|t| t.as_u64()).unwrap_or(0) as usize;
                                    if total > 0 {
                                        map.insert(appid, (unlocked, total));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // 2. Escaneo de archivos individuales <appid>.json (buscando nTotal y nAchieved en todo el contenido)
        if let Ok(entries) = fs::read_dir(&cache_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(fname) = path.file_name().and_then(|n| n.to_str()) {
                    if fname.ends_with(".json") && fname != "achievement_progress.json" {
                        let appid = fname.trim_end_matches(".json").to_string();
                        if appid.chars().all(|c| c.is_ascii_digit()) {
                            if let Ok(content) = fs::read_to_string(&path) {
                                let mut n_total = None;
                                let mut n_achieved = None;

                                if let Some(t_idx) = content.find("\"nTotal\":") {
                                    let sub = &content[t_idx + 9..];
                                    let num_str: String = sub
                                        .chars()
                                        .take_while(|c| c.is_ascii_digit() || c.is_whitespace())
                                        .filter(|c| c.is_ascii_digit())
                                        .collect();
                                    if let Ok(n) = num_str.parse::<usize>() {
                                        n_total = Some(n);
                                    }
                                }
                                if let Some(a_idx) = content.find("\"nAchieved\":") {
                                    let sub = &content[a_idx + 12..];
                                    let num_str: String = sub
                                        .chars()
                                        .take_while(|c| c.is_ascii_digit() || c.is_whitespace())
                                        .filter(|c| c.is_ascii_digit())
                                        .collect();
                                    if let Ok(n) = num_str.parse::<usize>() {
                                        n_achieved = Some(n);
                                    }
                                }

                                if let (Some(tot), Some(ach)) = (n_total, n_achieved) {
                                    if tot > 0 {
                                        map.insert(appid.clone(), (ach, tot));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 3. Fallback AppCache: leer total de UserGameStatsSchema_<appid>.bin
    for sdir in &stats_dirs {
        let p_sdir = Path::new(sdir);
        if let Ok(entries) = fs::read_dir(p_sdir) {
            for entry in entries.flatten() {
                let fname = entry.file_name().to_string_lossy().to_string();
                if fname.starts_with("UserGameStatsSchema_") && fname.ends_with(".bin") {
                    let appid = fname
                        .trim_start_matches("UserGameStatsSchema_")
                        .trim_end_matches(".bin")
                        .to_string();

                    let needs_total = map.get(&appid).map(|(_, t)| *t == 0).unwrap_or(true);
                    if needs_total {
                        if let Ok(bytes) = fs::read(entry.path()) {
                            let icon_pattern = b"icon\x00";
                            let icon_count = bytes.windows(icon_pattern.len()).filter(|w| *w == icon_pattern).count();
                            if icon_count > 0 {
                                let curr_ach = map.get(&appid).map(|(a, _)| *a).unwrap_or(0);
                                map.insert(appid.clone(), (curr_ach, icon_count));
                            }
                        }
                    }
                }
            }
        }
    }

    // 4. Fallback AppCache: leer logros desbloqueados de UserGameStats_*.bin
    for sdir in &stats_dirs {
        let p_sdir = Path::new(sdir);
        if let Ok(entries) = fs::read_dir(p_sdir) {
            for entry in entries.flatten() {
                let fname = entry.file_name().to_string_lossy().to_string();
                if fname.starts_with("UserGameStats_") && !fname.starts_with("UserGameStatsSchema_") && fname.ends_with(".bin") {
                    let parts: Vec<&str> = fname.trim_end_matches(".bin").split('_').collect();
                    if parts.len() >= 3 {
                        let appid = parts[2].to_string();
                        let curr_ach = map.get(&appid).map(|(a, _)| *a).unwrap_or(0);
                        if curr_ach == 0 {
                            if let Ok(bytes) = fs::read(entry.path()) {
                                let ach_pattern = b"AchievementTimes\x00";
                                if let Some(pos) = bytes.windows(ach_pattern.len()).position(|w| w == ach_pattern) {
                                    let sub = &bytes[pos + ach_pattern.len()..];
                                    let mut unlocked_count = 0;
                                    let mut i = 0;
                                    while i < sub.len() {
                                        if sub[i] == 0x02 {
                                            if let Some(null_pos) = sub[i + 1..].iter().position(|&b| b == 0x00) {
                                                let key_bytes = &sub[i + 1..i + 1 + null_pos];
                                                if !key_bytes.is_empty() && key_bytes.iter().all(|&b| b.is_ascii_digit()) {
                                                    unlocked_count += 1;
                                                    i += 1 + null_pos + 1 + 4;
                                                    continue;
                                                }
                                            }
                                        }
                                        i += 1;
                                    }
                                    if unlocked_count > 0 {
                                        let curr_tot = map.get(&appid).map(|(_, t)| *t).unwrap_or(unlocked_count);
                                        map.insert(appid, (unlocked_count, curr_tot.max(unlocked_count)));
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 5. Integrar desbloqueos soberanos de SQLite (game_achievement_unlocks)
    if let Ok(conn) = get_db_connection() {
        if let Ok(mut stmt) = conn.prepare(
            "SELECT game_id, SUM(CASE WHEN unlocked = 1 THEN 1 ELSE 0 END) FROM game_achievement_unlocks GROUP BY game_id",
        ) {
            if let Ok(rows) = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)? as usize))) {
                for (gid, local_unl) in rows.flatten() {
                    let (curr_unl, curr_tot) = map.get(&gid).copied().unwrap_or((0, 0));
                    map.insert(gid, (curr_unl.max(local_unl), curr_tot.max(local_unl)));
                }
            }
        }
    }

    map
}

fn parse_steam_stats_schema(app_id: &str) -> Vec<AchievementItem> {
    let mut items = Vec::new();
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/zabrielsa".to_string());
    let possible_paths = [
        format!("{}/.local/share/Steam/appcache/stats/UserGameStatsSchema_{}.bin", home, app_id),
        format!("{}/.steam/steam/appcache/stats/UserGameStatsSchema_{}.bin", home, app_id),
        format!("{}/.steam/root/appcache/stats/UserGameStatsSchema_{}.bin", home, app_id),
    ];

    let mut data: Option<Vec<u8>> = None;
    for p in &possible_paths {
        if let Ok(bytes) = fs::read(p) {
            data = Some(bytes);
            break;
        }
    }

    let bytes = match data {
        Some(b) => b,
        None => return items,
    };

    let mut i = 0;
    let len = bytes.len();

    let read_null_str = |pos: &mut usize| -> String {
        let start = *pos;
        while *pos < len && bytes[*pos] != 0 {
            *pos += 1;
        }
        let s = String::from_utf8_lossy(&bytes[start..*pos]).to_string();
        if *pos < len {
            *pos += 1;
        }
        s
    };

    let mut stack: Vec<String> = Vec::new();
    let mut curr_id = String::new();
    let mut curr_name_sp = String::new();
    let mut curr_name_en = String::new();
    let mut curr_desc_sp = String::new();
    let mut curr_desc_en = String::new();
    let mut curr_icon = String::new();

    while i < len {
        let btype = bytes[i];
        i += 1;
        if btype == 0x08 {
            if let Some(_closed) = stack.pop() {
                if stack.last().map(|s| s.as_str()) == Some("bits") {
                    let display_name = if !curr_name_sp.is_empty() {
                        curr_name_sp.clone()
                    } else if !curr_name_en.is_empty() {
                        curr_name_en.clone()
                    } else {
                        curr_id.clone()
                    };

                    let display_desc = if !curr_desc_sp.is_empty() {
                        curr_desc_sp.clone()
                    } else {
                        curr_desc_en.clone()
                    };

                    let icon_url = if !curr_icon.is_empty() {
                        Some(format!(
                            "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/{}/{}",
                            app_id, curr_icon
                        ))
                    } else {
                        None
                    };

                    if !curr_id.is_empty() {
                        items.push(AchievementItem {
                            id: curr_id.clone(),
                            name: display_name,
                            description: display_desc,
                            icon_url,
                            unlocked: false,
                            unlocked_at: None,
                            is_custom: false,
                        });
                    }

                    curr_id.clear();
                    curr_name_sp.clear();
                    curr_name_en.clear();
                    curr_desc_sp.clear();
                    curr_desc_en.clear();
                    curr_icon.clear();
                }
            }
            continue;
        }

        let key = read_null_str(&mut i);
        match btype {
            0x00 => {
                stack.push(key);
            }
            0x01 => {
                let val = read_null_str(&mut i);
                let in_bits = stack.iter().any(|s| s == "bits");
                if in_bits {
                    let parent = stack.last().map(|s| s.as_str()).unwrap_or("");
                    let grandparent = if stack.len() >= 2 {
                        stack[stack.len() - 2].as_str()
                    } else {
                        ""
                    };

                    if key == "name" && (parent != "name" && parent != "display") {
                        curr_id = val;
                    } else if grandparent == "display" && parent == "name" {
                        if key == "spanish" {
                            curr_name_sp = val;
                        } else if key == "english" {
                            curr_name_en = val;
                        }
                    } else if grandparent == "display" && parent == "desc" {
                        if key == "spanish" {
                            curr_desc_sp = val;
                        } else if key == "english" {
                            curr_desc_en = val;
                        }
                    } else if key == "icon" {
                        curr_icon = val;
                    }
                }
            }
            0x02 | 0x03 => {
                i = (i + 4).min(len);
            }
            0x07 => {
                i = (i + 8).min(len);
            }
            _ => {}
        }
    }

    items
}

fn get_steam_game_achievements(app_id: &str) -> Option<GameAchievementsReport> {
    let prog_map = get_steam_achievement_progress_map();
    let (prog_unlocked, prog_total) = prog_map.get(app_id).copied().unwrap_or((0, 0));

    // Cargar overrides locales de usuario desde SQLite
    let mut overrides: HashMap<String, bool> = HashMap::new();
    if let Ok(conn) = get_db_connection() {
        if let Ok(mut stmt) = conn.prepare("SELECT achievement_id, unlocked FROM game_achievement_unlocks WHERE game_id = ?1") {
            if let Ok(rows) = stmt.query_map(params![app_id], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)? == 1))) {
                for (aid, unl) in rows.flatten() {
                    overrides.insert(aid, unl);
                }
            }
        }
    }

    for cache_dir in get_steam_librarycache_dirs() {
        let json_file = cache_dir.join(format!("{}.json", app_id));
        if !json_file.exists() {
            continue;
        }
        if let Ok(content) = fs::read_to_string(&json_file) {
            let stream = serde_json::Deserializer::from_str(&content).into_iter::<serde_json::Value>();
            for val_res in stream {
                if let Ok(val) = val_res {
                    if let Some(arr) = val.as_array() {
                        for item in arr {
                            if let Some(pair) = item.as_array() {
                                if pair.len() == 2 && pair[0] == "achievements" {
                                    if let Some(data) = pair[1].get("data") {
                                        let n_total = data.get("nTotal").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                                        let n_achieved = data.get("nAchieved").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
                                        let mut items = Vec::new();
                                        let mut seen_ids = HashSet::new();

                                        let vector_keys = ["vecHighlight", "vecAchievedHidden", "vecUnachieved"];
                                        for vkey in vector_keys {
                                            if let Some(vec_arr) = data.get(vkey).and_then(|v| v.as_array()) {
                                                for h in vec_arr {
                                                    let id = h.get("strID").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                                    if id.is_empty() || !seen_ids.insert(id.clone()) {
                                                        continue;
                                                    }
                                                    let name = h.get("strName").and_then(|v| v.as_str()).unwrap_or("Logro").to_string();
                                                    let desc = h.get("strDescription").and_then(|v| v.as_str()).unwrap_or("").to_string();
                                                    let icon = h.get("strImage").and_then(|v| v.as_str()).map(|s| {
                                                        s.replace("https://shared.steamstatic.com/community_assets/images/apps/", "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/")
                                                    });
                                                    let steam_unlocked = h.get("bAchieved").and_then(|v| v.as_bool()).unwrap_or(false);
                                                    let unlocked = overrides.get(&id).copied().unwrap_or(steam_unlocked);
                                                    let rt_unlocked = h.get("rtUnlocked").and_then(|v| v.as_i64()).unwrap_or(0);
                                                    let unlocked_at = if rt_unlocked > 0 {
                                                        Some(rt_unlocked.to_string())
                                                    } else {
                                                        None
                                                    };

                                                    items.push(AchievementItem {
                                                        id,
                                                        name,
                                                        description: desc,
                                                        icon_url: icon,
                                                        unlocked,
                                                        unlocked_at,
                                                        is_custom: false,
                                                    });
                                                }
                                            }
                                        }

                                        // Enriquecer e incorporar la totalidad de logros bloqueados desde el Schema binario oficial
                                        let schema_items = parse_steam_stats_schema(app_id);
                                        for mut s_item in schema_items {
                                            if !seen_ids.insert(s_item.id.clone()) {
                                                // Ya existía en items, enriquecer icon si faltaba
                                                if let Some(pos) = items.iter().position(|it| it.id == s_item.id) {
                                                    if items[pos].icon_url.is_none() && s_item.icon_url.is_some() {
                                                        items[pos].icon_url = s_item.icon_url;
                                                    }
                                                    if items[pos].description.is_empty() && !s_item.description.is_empty() {
                                                        items[pos].description = s_item.description;
                                                    }
                                                }
                                            } else {
                                                let is_unl = overrides.get(&s_item.id).copied().unwrap_or(false);
                                                s_item.unlocked = is_unl;
                                                items.push(s_item);
                                            }
                                        }

                                        let final_total = n_total.max(items.len()).max(prog_total);
                                        let final_unlocked = if !overrides.is_empty() || n_achieved == 0 {
                                            items.iter().filter(|i| i.unlocked).count().max(prog_unlocked)
                                        } else {
                                            n_achieved.max(prog_unlocked).max(items.iter().filter(|i| i.unlocked).count())
                                        };

                                        let percentage = if final_total > 0 {
                                            (final_unlocked as f32 / final_total as f32) * 100.0
                                        } else {
                                            0.0
                                        };

                                        return Some(GameAchievementsReport {
                                            total: final_total,
                                            unlocked: final_unlocked,
                                            percentage,
                                            items,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Fallback: si no hubo archivo librarycache, pero sí existe el Schema binario
    let schema_items = parse_steam_stats_schema(app_id);
    if !schema_items.is_empty() {
        let mut full_items = Vec::new();
        for mut s in schema_items {
            let is_unl = overrides.get(&s.id).copied().unwrap_or(false);
            s.unlocked = is_unl;
            full_items.push(s);
        }
        let total = full_items.len().max(prog_total);
        let unlocked = full_items.iter().filter(|i| i.unlocked).count().max(prog_unlocked);
        let percentage = if total > 0 {
            (unlocked as f32 / total as f32) * 100.0
        } else {
            0.0
        };
        return Some(GameAchievementsReport {
            total,
            unlocked,
            percentage,
            items: full_items,
        });
    }

    if prog_total > 0 {
        return Some(GameAchievementsReport {
            total: prog_total,
            unlocked: prog_unlocked,
            percentage: (prog_unlocked as f32 / prog_total as f32) * 100.0,
            items: Vec::new(),
        });
    }

    None
}

#[tauri::command]
pub fn record_game_session(
    game_id: String,
    game_title: String,
    is_steam: bool,
    duration_seconds: i64,
    started_at: String,
    ended_at: String,
) -> Result<GameStats, String> {
    let conn = get_db_connection()?;
    let session_id = format!(
        "sess_{}_{}",
        game_id,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );
    let steam_int = if is_steam { 1 } else { 0 };

    conn.execute(
        "INSERT INTO game_sessions (id, game_id, game_title, is_steam, duration_seconds, started_at, ended_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![session_id, game_id, game_title, steam_int, duration_seconds, started_at, ended_at],
    )
    .map_err(|e| format!("Error guardando sesión: {}", e))?;

    conn.execute(
        "INSERT INTO game_stats (game_id, game_title, is_steam, total_play_time_seconds, sessions_count, last_played)
         VALUES (?1, ?2, ?3, ?4, 1, ?5)
         ON CONFLICT(game_id) DO UPDATE SET
            game_title = excluded.game_title,
            total_play_time_seconds = total_play_time_seconds + excluded.total_play_time_seconds,
            sessions_count = sessions_count + 1,
            last_played = excluded.last_played",
        params![game_id, game_title, steam_int, duration_seconds, ended_at],
    )
    .map_err(|e| format!("Error actualizando estadísticas de juego: {}", e))?;

    if !is_steam {
        let mins = duration_seconds / 60;
        let _ = conn.execute(
            "UPDATE custom_games SET play_time_minutes = play_time_minutes + ?1, last_played = ?2 WHERE id = ?3",
            params![mins, ended_at, game_id],
        );
    }

    get_game_stats(game_id)?.ok_or_else(|| "Error recuperando estadísticas actualizadas".to_string())
}

#[tauri::command]
pub fn get_game_stats(game_id: String) -> Result<Option<GameStats>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT game_id, game_title, is_steam, total_play_time_seconds, sessions_count, rating, review, obsidian_note_path, last_played
             FROM game_stats WHERE game_id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map(params![game_id], |row| {
            let is_steam_int: i64 = row.get(2)?;
            Ok(GameStats {
                game_id: row.get(0)?,
                game_title: row.get(1)?,
                is_steam: is_steam_int == 1,
                total_play_time_seconds: row.get(3)?,
                sessions_count: row.get(4)?,
                rating: row.get(5)?,
                review: row.get(6)?,
                obsidian_note_path: row.get(7)?,
                last_played: row.get(8)?,
                achievements_unlocked: None,
                achievements_total: None,
            })
        })
        .map_err(|e| e.to_string())?;

    if let Some(r) = rows.next() {
        let mut stats = r.map_err(|e| e.to_string())?;
        if stats.is_steam {
            let prog_map = get_steam_achievement_progress_map();
            if let Some((unlocked, total)) = prog_map.get(&stats.game_id) {
                stats.achievements_unlocked = Some(*unlocked);
                stats.achievements_total = Some(*total);
            }
        }
        Ok(Some(stats))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn get_all_game_stats() -> Result<Vec<GameStats>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT game_id, game_title, is_steam, total_play_time_seconds, sessions_count, rating, review, obsidian_note_path, last_played
             FROM game_stats ORDER BY last_played DESC",
        )
        .map_err(|e| e.to_string())?;

    let prog_map = get_steam_achievement_progress_map();

    let rows = stmt
        .query_map([], |row| {
            let is_steam_int: i64 = row.get(2)?;
            Ok(GameStats {
                game_id: row.get(0)?,
                game_title: row.get(1)?,
                is_steam: is_steam_int == 1,
                total_play_time_seconds: row.get(3)?,
                sessions_count: row.get(4)?,
                rating: row.get(5)?,
                review: row.get(6)?,
                obsidian_note_path: row.get(7)?,
                last_played: row.get(8)?,
                achievements_unlocked: None,
                achievements_total: None,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for r in rows.flatten() {
        let mut item = r;
        if item.is_steam {
            if let Some((unlocked, total)) = prog_map.get(&item.game_id) {
                item.achievements_unlocked = Some(*unlocked);
                item.achievements_total = Some(*total);
            }
        }
        result.push(item);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_game_sessions(game_id: String) -> Result<Vec<GameSession>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, game_id, game_title, is_steam, duration_seconds, started_at, ended_at
             FROM game_sessions WHERE game_id = ?1 ORDER BY started_at DESC LIMIT 30",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![game_id], |row| {
            let steam_int: i64 = row.get(3)?;
            Ok(GameSession {
                id: row.get(0)?,
                game_id: row.get(1)?,
                game_title: row.get(2)?,
                is_steam: steam_int == 1,
                duration_seconds: row.get(4)?,
                started_at: row.get(5)?,
                ended_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut sessions = Vec::new();
    for s in rows.flatten() {
        sessions.push(s);
    }
    Ok(sessions)
}

#[tauri::command]
pub fn get_game_achievements(game_id: String, is_steam: bool) -> Result<GameAchievementsReport, String> {
    let mut custom_items = Vec::new();
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, description, unlocked, unlocked_at FROM custom_achievements WHERE game_id = ?1 ORDER BY created_at ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![game_id], |row| {
            let unl: i64 = row.get(3)?;
            Ok(AchievementItem {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get::<_, Option<String>>(2)?.unwrap_or_default(),
                icon_url: None,
                unlocked: unl == 1,
                unlocked_at: row.get(4)?,
                is_custom: true,
            })
        })
        .map_err(|e| e.to_string())?;

    for r in rows.flatten() {
        custom_items.push(r);
    }

    if is_steam {
        if let Some(mut steam_report) = get_steam_game_achievements(&game_id) {
            for ci in custom_items {
                if ci.unlocked {
                    steam_report.unlocked += 1;
                }
                steam_report.total += 1;
                steam_report.items.push(ci);
            }
            if steam_report.total > 0 {
                steam_report.percentage = (steam_report.unlocked as f32 / steam_report.total as f32) * 100.0;
            }
            return Ok(steam_report);
        }
    }

    let total = custom_items.len();
    let unlocked = custom_items.iter().filter(|i| i.unlocked).count();
    let percentage = if total > 0 {
        (unlocked as f32 / total as f32) * 100.0
    } else {
        0.0
    };

    Ok(GameAchievementsReport {
        total,
        unlocked,
        percentage,
        items: custom_items,
    })
}

#[tauri::command]
pub fn create_custom_achievement(
    game_id: String,
    title: String,
    description: Option<String>,
) -> Result<AchievementItem, String> {
    let conn = get_db_connection()?;
    let ach_id = format!(
        "ach_{}_{}",
        game_id,
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis()
    );
    let desc = description.unwrap_or_default();

    conn.execute(
        "INSERT INTO custom_achievements (id, game_id, title, description, unlocked, unlocked_at, created_at)
         VALUES (?1, ?2, ?3, ?4, 0, NULL, datetime('now'))",
        params![ach_id, game_id, title, desc],
    )
    .map_err(|e| format!("Error creando logro personalizado: {}", e))?;

    Ok(AchievementItem {
        id: ach_id,
        name: title,
        description: desc,
        icon_url: None,
        unlocked: false,
        unlocked_at: None,
        is_custom: true,
    })
}

#[tauri::command]
pub fn toggle_custom_achievement(id: String) -> Result<bool, String> {
    let conn = get_db_connection()?;
    let current_unlocked: i64 = conn
        .query_row(
            "SELECT unlocked FROM custom_achievements WHERE id = ?1",
            params![id],
            |r| r.get(0),
        )
        .map_err(|e| e.to_string())?;

    let new_state = if current_unlocked == 1 { 0 } else { 1 };
    let now_date = if new_state == 1 {
        Some(
            conn.query_row("SELECT datetime('now')", [], |r| r.get::<_, String>(0))
                .unwrap_or_default(),
        )
    } else {
        None
    };

    conn.execute(
        "UPDATE custom_achievements SET unlocked = ?1, unlocked_at = ?2 WHERE id = ?3",
        params![new_state, now_date, id],
    )
    .map_err(|e| e.to_string())?;

    Ok(new_state == 1)
}

#[tauri::command]
pub fn delete_custom_achievement(id: String) -> Result<String, String> {
    let conn = get_db_connection()?;
    conn.execute("DELETE FROM custom_achievements WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok("Logro eliminado.".to_string())
}

#[tauri::command]
pub fn toggle_game_achievement(
    game_id: String,
    achievement_id: String,
    unlocked: bool,
) -> Result<bool, String> {
    let conn = get_db_connection()?;
    let new_state = if unlocked { 1 } else { 0 };
    let now_date = if unlocked {
        Some(
            conn.query_row("SELECT datetime('now')", [], |r| r.get::<_, String>(0))
                .unwrap_or_default(),
        )
    } else {
        None
    };

    conn.execute(
        "INSERT INTO game_achievement_unlocks (game_id, achievement_id, unlocked, unlocked_at)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(game_id, achievement_id) DO UPDATE SET unlocked = excluded.unlocked, unlocked_at = excluded.unlocked_at",
        params![game_id, achievement_id, new_state, now_date],
    )
    .map_err(|e| format!("Error guardando estado de logro: {}", e))?;

    Ok(unlocked)
}

#[tauri::command]
pub fn save_game_review_and_sync(
    game_id: String,
    game_title: String,
    is_steam: bool,
    rating: i32,
    review: Option<String>,
    sync_to_obsidian: bool,
) -> Result<String, String> {
    let conn = get_db_connection()?;
    let steam_int = if is_steam { 1 } else { 0 };
    let rev_str = review.unwrap_or_default();

    let mut obsidian_path: Option<String> = None;

    if sync_to_obsidian {
        let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
        let vault_root = PathBuf::from(&cfg.vault_path);
        let gaming_dir = vault_root.join("03 Personal y Ocio").join("Gaming");
        if !gaming_dir.exists() {
            let _ = fs::create_dir_all(&gaming_dir);
        }

        let safe_title: String = game_title
            .chars()
            .map(|c| match c {
                '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
                other => other,
            })
            .collect();

        let note_filename = format!("Bitacora - {}.md", safe_title.trim());
        let note_path = gaming_dir.join(&note_filename);

        let total_secs: i64 = conn
            .query_row(
                "SELECT total_play_time_seconds FROM game_stats WHERE game_id = ?1",
                params![game_id],
                |r| r.get(0),
            )
            .unwrap_or(0);
        let total_hours = (total_secs as f64) / 3600.0;

        let stars = "⭐".repeat(rating.clamp(1, 5) as usize);
        let platform_str = if is_steam {
            "Steam"
        } else {
            "Lanzador Personalizado / Emulador"
        };
        let now_date: String = conn
            .query_row("SELECT date('now')", [], |r| r.get(0))
            .unwrap_or_else(|_| "2026-11-03".to_string());

        let note_content = format!(
            r#"---
tipo: Reseña Gaming
juego: "{title}"
calificacion: {rating}/5
tiempo_jugado_horas: {hours:.1}
plataforma: "{platform}"
fecha_registro: {date}
tags:
  - ocio/gaming
  - bitacora-juegos
---

# 🎮 Reseña: {title}

> [!NOTE] Metadatos Tácticos (Aegis Soberano)
> - **Plataforma:** {platform}
> - **Tiempo Acumulado:** {hours:.1} h ({total_secs} s)
> - **Puntuación:** {stars} ({rating}/5)
> - **Fecha de Registro:** {date}

## 📝 Impresiones & Notas de Partida
{rev}

---
*Vinculado desde Aegis Gaming & Aceleración Soberana — [[MOC - Personal y Ocio]]*
"#,
            title = game_title,
            rating = rating,
            hours = total_hours,
            platform = platform_str,
            date = now_date,
            total_secs = total_secs,
            stars = stars,
            rev = if rev_str.trim().is_empty() {
                "*(Sin notas adicionales)*"
            } else {
                &rev_str
            },
        );

        fs::write(&note_path, note_content)
            .map_err(|e| format!("Error escribiendo nota en Obsidian: {}", e))?;
        obsidian_path = Some(note_path.to_string_lossy().to_string());
    }

    conn.execute(
        "INSERT INTO game_stats (game_id, game_title, is_steam, rating, review, obsidian_note_path)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT(game_id) DO UPDATE SET
            game_title = excluded.game_title,
            rating = excluded.rating,
            review = excluded.review,
            obsidian_note_path = COALESCE(excluded.obsidian_note_path, game_stats.obsidian_note_path)",
        params![game_id, game_title, steam_int, rating, rev_str, obsidian_path],
    )
    .map_err(|e| format!("Error guardando reseña en SQLite: {}", e))?;

    Ok(match obsidian_path {
        Some(p) => format!("Reseña guardada y sincronizada en Obsidian ({})", p),
        None => "Reseña guardada en SQLite local.".to_string(),
    })
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PendingAchievementInfo {
    pub name: String,
    pub description: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GameAgentContext {
    pub game_id: String,
    pub game_title: String,
    pub is_steam: bool,
    pub platform: String,
    pub total_play_time_seconds: i64,
    pub play_time_hours: f64,
    pub sessions_count: usize,
    pub rating: Option<i32>,
    pub review: Option<String>,
    pub achievements_total: usize,
    pub achievements_unlocked: usize,
    pub pending_achievements: Vec<PendingAchievementInfo>,
    pub obsidian_note_exists: bool,
    pub obsidian_note_path: Option<String>,
    pub gamemode_active: bool,
    pub mangohud_installed: bool,
    pub system_prompt: String,
}

#[tauri::command]
pub fn get_game_agent_context(
    game_id: String,
    game_title: String,
    is_steam: bool,
) -> Result<GameAgentContext, String> {
    let conn = get_db_connection()?;
    let platform_str = if is_steam {
        "Steam".to_string()
    } else {
        "Lanzador Personalizado / Emulador".to_string()
    };

    // 1. Estadísticas de tiempo y notas del juego
    let (total_secs, rating, review, obsidian_path): (
        i64,
        Option<i32>,
        Option<String>,
        Option<String>,
    ) = conn
        .query_row(
            "SELECT total_play_time_seconds, rating, review, obsidian_note_path FROM game_stats WHERE game_id = ?1",
            params![game_id],
            |r| Ok((r.get(0).unwrap_or(0), r.get(1).ok(), r.get(2).ok(), r.get(3).ok())),
        )
        .unwrap_or((0, None, None, None));

    let sessions_count: usize = conn
        .query_row(
            "SELECT COUNT(*) FROM game_sessions WHERE game_id = ?1",
            params![game_id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let play_time_hours = (total_secs as f64) / 3600.0;

    // 2. Reporte de logros
    let ach_report = get_game_achievements(game_id.clone(), is_steam).unwrap_or(
        GameAchievementsReport {
            total: 0,
            unlocked: 0,
            percentage: 0.0,
            items: Vec::new(),
        },
    );

    let achievements_total = ach_report.total;
    let achievements_unlocked = ach_report.unlocked;
    let pending_achievements: Vec<PendingAchievementInfo> = ach_report
        .items
        .into_iter()
        .filter(|a| !a.unlocked)
        .take(8)
        .map(|a| PendingAchievementInfo {
            name: a.name,
            description: a.description,
        })
        .collect();

    // 3. Telemetría de hardware y optimización activa
    let gaming_status = get_gaming_status().unwrap_or(GamingStatus {
        gamemode_active: false,
        gamemode_installed: false,
        mangohud_installed: false,
        gamescope_installed: false,
        gpu_driver: "Desconocido".to_string(),
        default_launch_command: String::new(),
    });

    // 4. Búsqueda de notas en la bóveda de Obsidian
    let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let vault_root = PathBuf::from(&cfg.vault_path);
    let safe_title: String = game_title
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            other => other,
        })
        .collect();
    let note_path = vault_root
        .join("03 Personal y Ocio")
        .join("Gaming")
        .join(format!("Bitacora - {}.md", safe_title.trim()));

    let (obsidian_exists, obsidian_excerpt) = if note_path.exists() {
        if let Ok(content) = fs::read_to_string(&note_path) {
            let excerpt = if content.len() > 1200 {
                format!("{}...", &content[..1200])
            } else {
                content
            };
            (true, Some(excerpt))
        } else {
            (true, None)
        }
    } else {
        (false, None)
    };

    // 5. Prompt del Sistema Táctico
    let mut system_prompt = format!(
        "Eres el Game Companion Táctico de Aegis, asistente experto de gaming y optimización para el usuario Gabriel en su equipo Intel N150 (4 Cores Alder Lake-N, Intel UHD Graphics 24 EUs, 16GB RAM, Fedora Linux).
Directrices:
- Respuestas directas, concisas y tácticas en formato Markdown.
- Considera las capacidades del Intel N150: gráficos integrados UHD, 720p/540p con FSR/Gamescope recomendados para juegos 3D, 60 FPS estables para 2D/Pixel Art/Indies, 30 FPS para juegos 3D más exigentes, variables de entorno Proton/Wine.
- Si el usuario pide builds o estrategias, proporciona tablas o listas con pros y contras específicos.
- Si el usuario pide guías para logros, proporciona requisitos exactos, rutas óptimas y secretos conocidos.

[INFORMACIÓN DEL JUEGO SELECCIONADO]
- Título: {}
- Plataforma: {} (ID: {})
- Tiempo jugado acumulado: {:.1} horas ({} partidas registradas)
- Valoración del usuario: {}
- Logros: {}/{} completados ({:.0}%)
- Entorno de Hardware: Intel N150 (4T), Intel UHD, 16GB RAM | GameMode: {} | MangoHud: {}",
        game_title,
        platform_str,
        game_id,
        play_time_hours,
        sessions_count,
        rating.map(|r| format!("{}/5 ⭐", r)).unwrap_or_else(|| "Sin calificar".to_string()),
        achievements_unlocked,
        achievements_total,
        if achievements_total > 0 {
            (achievements_unlocked as f64 / achievements_total as f64) * 100.0
        } else {
            0.0
        },
        if gaming_status.gamemode_active { "Activo" } else { "Inactivo" },
        if gaming_status.mangohud_installed { "Disponible" } else { "No instalado" }
    );

    if let Some(ref rev) = review {
        if !rev.trim().is_empty() {
            system_prompt.push_str(&format!("\n- Reseña previa del usuario: \"{}\"", rev.trim()));
        }
    }

    if !pending_achievements.is_empty() {
        system_prompt.push_str("\n\n[PRÓXIMOS LOGROS BLOQUEADOS PENDIENTES]\n");
        for (idx, ach) in pending_achievements.iter().enumerate() {
            system_prompt.push_str(&format!("{}. **{}**: {}\n", idx + 1, ach.name, ach.description));
        }
    }

    if let Some(ref excerpt) = obsidian_excerpt {
        system_prompt.push_str(&format!("\n\n[NOTAS PREVIAS EN OBSIDIAN]\n{}\n", excerpt.trim()));
    }

    Ok(GameAgentContext {
        game_id,
        game_title,
        is_steam,
        platform: platform_str,
        total_play_time_seconds: total_secs,
        play_time_hours,
        sessions_count,
        rating,
        review,
        achievements_total,
        achievements_unlocked,
        pending_achievements,
        obsidian_note_exists: obsidian_exists,
        obsidian_note_path: if obsidian_exists {
            Some(note_path.to_string_lossy().to_string())
        } else {
            obsidian_path
        },
        gamemode_active: gaming_status.gamemode_active,
        mangohud_installed: gaming_status.mangohud_installed,
        system_prompt,
    })
}

#[tauri::command]
pub fn save_game_companion_note(
    game_id: String,
    game_title: String,
    is_steam: bool,
    section_title: String,
    note_content: String,
) -> Result<String, String> {
    let conn = get_db_connection()?;
    let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let vault_root = PathBuf::from(&cfg.vault_path);
    let gaming_dir = vault_root.join("03 Personal y Ocio").join("Gaming");
    if !gaming_dir.exists() {
        let _ = fs::create_dir_all(&gaming_dir);
    }

    let safe_title: String = game_title
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => '-',
            other => other,
        })
        .collect();

    let note_filename = format!("Bitacora - {}.md", safe_title.trim());
    let note_path = gaming_dir.join(&note_filename);

    let now_dt: String = conn
        .query_row("SELECT datetime('now', 'localtime')", [], |r| r.get(0))
        .unwrap_or_else(|_| "2026-11-03 00:00".to_string());

    let entry = format!(
        "\n\n### 🤖 Guía Táctica del Asistente ({}): {}\n\n{}\n",
        now_dt,
        section_title.trim(),
        note_content.trim()
    );

    if note_path.exists() {
        let mut file = fs::OpenOptions::new()
            .append(true)
            .open(&note_path)
            .map_err(|e| format!("Error abriendo nota en Obsidian: {}", e))?;
        use std::io::Write;
        file.write_all(entry.as_bytes())
            .map_err(|e| format!("Error agregando guía a nota en Obsidian: {}", e))?;
    } else {
        let platform_str = if is_steam { "Steam" } else { "Lanzador Custom" };
        let now_date: String = conn
            .query_row("SELECT date('now')", [], |r| r.get(0))
            .unwrap_or_else(|_| "2026-11-03".to_string());

        let initial_content = format!(
            r#"---
tipo: Bitácora Gaming
juego: "{title}"
plataforma: "{platform}"
fecha_registro: {date}
tags:
  - ocio/gaming
  - bitacora-juegos
  - guia-tactica
---

# 🎮 Bitácora: {title}

> [!NOTE] Metadatos Tácticos (Aegis Soberano)
> - **Plataforma:** {platform}
> - **Fecha:** {date}

{entry}
---
*Vinculado desde Aegis Gaming & Aceleración Soberana — [[MOC - Personal y Ocio]]*
"#,
            title = game_title,
            platform = platform_str,
            date = now_date,
            entry = entry
        );
        fs::write(&note_path, initial_content)
            .map_err(|e| format!("Error creando nota en Obsidian: {}", e))?;
    }

    let note_str = note_path.to_string_lossy().to_string();
    let _ = conn.execute(
        "UPDATE game_stats SET obsidian_note_path = ?1 WHERE game_id = ?2",
        params![note_str, game_id],
    );

    Ok(format!("Guía guardada en Obsidian: {}", note_filename))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnifiedGameItem {
    pub id: String,
    pub app_id: Option<String>,
    pub title: String,
    pub is_steam: bool,
    pub is_installed: bool,
    pub cover_image: Option<String>,
    pub banner_url: Option<String>,
    pub total_play_time_seconds: i64,
    pub sessions_count: i64,
    pub achievements_unlocked: usize,
    pub achievements_total: usize,
    pub achievements_percentage: f32,
    pub last_played_device: Option<String>,
    pub last_played: Option<String>,
    pub rating: i32,
    pub review: Option<String>,
    pub obsidian_note_path: Option<String>,
    pub launch_type: Option<String>,
    pub launch_target: Option<String>,
}

#[tauri::command]
pub fn install_steam_game(app_id: String) -> Result<(), String> {
    let clean_appid = app_id.trim_start_matches("steam:");
    let url = format!("steam://install/{}", clean_appid);
    Command::new("xdg-open")
        .arg(&url)
        .spawn()
        .map_err(|e| format!("Error invocando instalación en Steam: {}", e))?;
    Ok(())
}

#[tauri::command]
pub fn get_unified_game_catalog() -> Result<Vec<UnifiedGameItem>, String> {
    let conn = get_db_connection()?;
    let hostname = std::env::var("HOSTNAME").unwrap_or_else(|_| "host".to_string());
    let now_ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;

    // 1. Obtener juegos instalados localmente en Steam
    let local_steam_games = get_installed_steam_games().unwrap_or_default();
    let mut local_installed_appids = HashSet::new();

    for sg in &local_steam_games {
        local_installed_appids.insert(sg.app_id.clone());
        let game_id = format!("steam:{}", sg.app_id);
        let ach_unlocked = sg.achievements_unlocked.unwrap_or(0) as i64;
        let ach_total = sg.achievements_total.unwrap_or(0) as i64;
        let last_played_str = if sg.last_played > 0 {
            Some(sg.last_played.to_string())
        } else {
            None
        };

        let _ = conn.execute(
            "INSERT INTO game_catalog (game_id, title, app_id, is_steam, cover_url, achievements_unlocked, achievements_total, last_played_device, last_played, updated_at)
             VALUES (?1, ?2, ?3, 1, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(game_id) DO UPDATE SET
                title = excluded.title,
                cover_url = COALESCE(excluded.cover_url, game_catalog.cover_url),
                achievements_unlocked = MAX(game_catalog.achievements_unlocked, excluded.achievements_unlocked),
                achievements_total = MAX(game_catalog.achievements_total, excluded.achievements_total),
                last_played_device = excluded.last_played_device,
                last_played = COALESCE(excluded.last_played, game_catalog.last_played),
                updated_at = excluded.updated_at",
            params![
                game_id,
                sg.name,
                sg.app_id,
                sg.cover_image,
                ach_unlocked,
                ach_total,
                hostname,
                last_played_str,
                now_ts
            ],
        );
    }

    // 2. Sincronizar juegos personalizados locales en game_catalog
    let custom_games = sqlite_get_custom_games().unwrap_or_default();
    for cg in &custom_games {
        let _ = conn.execute(
            "INSERT INTO game_catalog (game_id, title, app_id, is_steam, cover_url, banner_url, last_played_device, last_played, updated_at)
             VALUES (?1, ?2, NULL, 0, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(game_id) DO UPDATE SET
                title = excluded.title,
                cover_url = COALESCE(excluded.cover_url, game_catalog.cover_url),
                banner_url = COALESCE(excluded.banner_url, game_catalog.banner_url),
                updated_at = excluded.updated_at",
            params![
                cg.id,
                cg.title,
                cg.banner_url,
                cg.banner_url,
                hostname,
                cg.last_played,
                now_ts
            ],
        );
    }

    // 3. Consultar todos los juegos consolidados en game_catalog uniéndolos con game_stats
    let mut stmt = conn
        .prepare(
            "SELECT c.game_id, c.title, c.app_id, c.is_steam, c.cover_url, c.banner_url,
                    COALESCE(s.total_play_time_seconds, c.total_play_time_seconds),
                    COALESCE(s.sessions_count, 0),
                    c.achievements_unlocked, c.achievements_total,
                    c.last_played_device,
                    COALESCE(s.last_played, c.last_played),
                    COALESCE(s.rating, 0),
                    s.review, s.obsidian_note_path
             FROM game_catalog c
             LEFT JOIN game_stats s ON c.game_id = s.game_id
             ORDER BY c.updated_at DESC, c.title ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let is_steam_int: i64 = row.get(3)?;
            let is_steam = is_steam_int == 1;
            let app_id: Option<String> = row.get(2)?;
            let unlocked: i64 = row.get(8)?;
            let total: i64 = row.get(9)?;

            let percentage = if total > 0 {
                (unlocked as f32 / total as f32) * 100.0
            } else {
                0.0
            };

            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                app_id,
                is_steam,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, i64>(6)?,
                row.get::<_, i64>(7)?,
                unlocked as usize,
                total as usize,
                percentage,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, Option<String>>(11)?,
                row.get::<_, i32>(12)?,
                row.get::<_, Option<String>>(13)?,
                row.get::<_, Option<String>>(14)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    let custom_map: HashMap<String, CustomGame> =
        custom_games.into_iter().map(|g| (g.id.clone(), g)).collect();

    for r in rows.flatten() {
        let (
            id,
            title,
            app_id,
            is_steam,
            cover_image,
            banner_url,
            total_play_time_seconds,
            sessions_count,
            ach_unlocked,
            ach_total,
            ach_pct,
            last_played_device,
            last_played,
            rating,
            review,
            obsidian_note_path,
        ) = r;

        let is_installed = if is_steam {
            if let Some(ref aid) = app_id {
                local_installed_appids.contains(aid)
            } else {
                false
            }
        } else {
            custom_map.contains_key(&id)
        };

        let (launch_type, launch_target) = if let Some(cg) = custom_map.get(&id) {
            (Some(cg.launch_type.clone()), Some(cg.launch_target.clone()))
        } else if is_steam {
            (Some("steam".to_string()), app_id.clone())
        } else {
            (None, None)
        };

        result.push(UnifiedGameItem {
            id,
            app_id,
            title,
            is_steam,
            is_installed,
            cover_image,
            banner_url,
            total_play_time_seconds,
            sessions_count,
            achievements_unlocked: ach_unlocked,
            achievements_total: ach_total,
            achievements_percentage: ach_pct,
            last_played_device,
            last_played,
            rating,
            review,
            obsidian_note_path,
            launch_type,
            launch_target,
        });
    }

    Ok(result)
}

pub fn sqlite_export_game_catalog() -> Result<Vec<serde_json::Value>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT game_id, title, app_id, is_steam, cover_url, banner_url,
                    total_play_time_seconds, achievements_unlocked, achievements_total,
                    achievements_json, last_played_device, last_played, updated_at
             FROM game_catalog",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let is_steam_int: i64 = row.get(3)?;
            Ok(serde_json::json!({
                "gameId": row.get::<_, String>(0)?,
                "title": row.get::<_, String>(1)?,
                "appId": row.get::<_, Option<String>>(2)?,
                "isSteam": is_steam_int == 1,
                "coverUrl": row.get::<_, Option<String>>(4)?,
                "bannerUrl": row.get::<_, Option<String>>(5)?,
                "totalPlayTimeSeconds": row.get::<_, i64>(6)?,
                "achievementsUnlocked": row.get::<_, i64>(7)?,
                "achievementsTotal": row.get::<_, i64>(8)?,
                "achievementsJson": row.get::<_, Option<String>>(9)?,
                "lastPlayedDevice": row.get::<_, Option<String>>(10)?,
                "lastPlayed": row.get::<_, Option<String>>(11)?,
                "updatedAt": row.get::<_, i64>(12)?,
            }))
        })
        .map_err(|e| e.to_string())?;

    Ok(rows.flatten().collect())
}

pub fn sqlite_import_game_catalog(items: Vec<serde_json::Value>) -> Result<usize, String> {
    let conn = get_db_connection()?;
    let mut imported = 0;
    for val in items {
        if let Some(game_id) = val.get("gameId").and_then(|v| v.as_str()) {
            let title = val.get("title").and_then(|v| v.as_str()).unwrap_or("Juego");
            let app_id = val.get("appId").and_then(|v| v.as_str());
            let is_steam = val.get("isSteam").and_then(|v| v.as_bool()).unwrap_or(true);
            let cover_url = val.get("coverUrl").and_then(|v| v.as_str());
            let banner_url = val.get("bannerUrl").and_then(|v| v.as_str());
            let play_time = val.get("totalPlayTimeSeconds").and_then(|v| v.as_i64()).unwrap_or(0);
            let ach_unlocked = val.get("achievementsUnlocked").and_then(|v| v.as_i64()).unwrap_or(0);
            let ach_total = val.get("achievementsTotal").and_then(|v| v.as_i64()).unwrap_or(0);
            let ach_json = val.get("achievementsJson").and_then(|v| v.as_str());
            let last_dev = val.get("lastPlayedDevice").and_then(|v| v.as_str());
            let last_played = val.get("lastPlayed").and_then(|v| v.as_str());
            let updated_at = val.get("updatedAt").and_then(|v| v.as_i64()).unwrap_or(0);

            let res = conn.execute(
                "INSERT INTO game_catalog (game_id, title, app_id, is_steam, cover_url, banner_url,
                                          total_play_time_seconds, achievements_unlocked, achievements_total,
                                          achievements_json, last_played_device, last_played, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)
                 ON CONFLICT(game_id) DO UPDATE SET
                    title = excluded.title,
                    cover_url = COALESCE(excluded.cover_url, game_catalog.cover_url),
                    banner_url = COALESCE(excluded.banner_url, game_catalog.banner_url),
                    total_play_time_seconds = MAX(game_catalog.total_play_time_seconds, excluded.total_play_time_seconds),
                    achievements_unlocked = MAX(game_catalog.achievements_unlocked, excluded.achievements_unlocked),
                    achievements_total = MAX(game_catalog.achievements_total, excluded.achievements_total),
                    last_played_device = COALESCE(excluded.last_played_device, game_catalog.last_played_device),
                    last_played = COALESCE(excluded.last_played, game_catalog.last_played),
                    updated_at = MAX(game_catalog.updated_at, excluded.updated_at)",
                params![
                    game_id,
                    title,
                    app_id,
                    if is_steam { 1 } else { 0 },
                    cover_url,
                    banner_url,
                    play_time,
                    ach_unlocked,
                    ach_total,
                    ach_json,
                    last_dev,
                    last_played,
                    updated_at
                ],
            );
            if res.is_ok() {
                imported += 1;
            }
        }
    }
    Ok(imported)
}

pub fn sqlite_export_game_stats() -> Result<Vec<serde_json::Value>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT game_id, game_title, is_steam, total_play_time_seconds, sessions_count,
                    rating, review, obsidian_note_path, last_played
             FROM game_stats",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let is_steam_int: i64 = row.get(2)?;
            Ok(serde_json::json!({
                "gameId": row.get::<_, String>(0)?,
                "gameTitle": row.get::<_, String>(1)?,
                "isSteam": is_steam_int == 1,
                "totalPlayTimeSeconds": row.get::<_, i64>(3)?,
                "sessionsCount": row.get::<_, i64>(4)?,
                "rating": row.get::<_, i32>(5)?,
                "review": row.get::<_, Option<String>>(6)?,
                "obsidianNotePath": row.get::<_, Option<String>>(7)?,
                "lastPlayed": row.get::<_, Option<String>>(8)?,
            }))
        })
        .map_err(|e| e.to_string())?;

    Ok(rows.flatten().collect())
}

pub fn sqlite_import_game_stats(items: Vec<serde_json::Value>) -> Result<usize, String> {
    let conn = get_db_connection()?;
    let mut imported = 0;
    for val in items {
        if let Some(game_id) = val.get("gameId").and_then(|v| v.as_str()) {
            let title = val.get("gameTitle").and_then(|v| v.as_str()).unwrap_or("Juego");
            let is_steam = val.get("isSteam").and_then(|v| v.as_bool()).unwrap_or(true);
            let play_time = val.get("totalPlayTimeSeconds").and_then(|v| v.as_i64()).unwrap_or(0);
            let sessions = val.get("sessionsCount").and_then(|v| v.as_i64()).unwrap_or(0);
            let rating = val.get("rating").and_then(|v| v.as_i64()).unwrap_or(0) as i32;
            let review = val.get("review").and_then(|v| v.as_str());
            let obsidian_path = val.get("obsidianNotePath").and_then(|v| v.as_str());
            let last_played = val.get("lastPlayed").and_then(|v| v.as_str());

            let res = conn.execute(
                "INSERT INTO game_stats (game_id, game_title, is_steam, total_play_time_seconds,
                                        sessions_count, rating, review, obsidian_note_path, last_played)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
                 ON CONFLICT(game_id) DO UPDATE SET
                    game_title = excluded.game_title,
                    total_play_time_seconds = MAX(game_stats.total_play_time_seconds, excluded.total_play_time_seconds),
                    sessions_count = MAX(game_stats.sessions_count, excluded.sessions_count),
                    rating = CASE WHEN excluded.rating > 0 THEN excluded.rating ELSE game_stats.rating END,
                    review = COALESCE(excluded.review, game_stats.review),
                    obsidian_note_path = COALESCE(excluded.obsidian_note_path, game_stats.obsidian_note_path),
                    last_played = COALESCE(excluded.last_played, game_stats.last_played)",
                params![
                    game_id,
                    title,
                    if is_steam { 1 } else { 0 },
                    play_time,
                    sessions,
                    rating,
                    review,
                    obsidian_path,
                    last_played
                ],
            );
            if res.is_ok() {
                imported += 1;
            }
        }
    }
    Ok(imported)
}

pub fn sqlite_export_game_sessions() -> Result<Vec<serde_json::Value>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, game_id, game_title, is_steam, duration_seconds, started_at, ended_at
             FROM game_sessions ORDER BY started_at DESC LIMIT 500",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let is_steam_int: i64 = row.get(3)?;
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "gameId": row.get::<_, String>(1)?,
                "gameTitle": row.get::<_, String>(2)?,
                "isSteam": is_steam_int == 1,
                "durationSeconds": row.get::<_, i64>(4)?,
                "startedAt": row.get::<_, String>(5)?,
                "endedAt": row.get::<_, String>(6)?,
            }))
        })
        .map_err(|e| e.to_string())?;

    Ok(rows.flatten().collect())
}

pub fn sqlite_import_game_sessions(items: Vec<serde_json::Value>) -> Result<usize, String> {
    let conn = get_db_connection()?;
    let mut imported = 0;
    for val in items {
        if let Some(id) = val.get("id").and_then(|v| v.as_str()) {
            let game_id = val.get("gameId").and_then(|v| v.as_str()).unwrap_or("");
            let title = val.get("gameTitle").and_then(|v| v.as_str()).unwrap_or("Juego");
            let is_steam = val.get("isSteam").and_then(|v| v.as_bool()).unwrap_or(true);
            let duration = val.get("durationSeconds").and_then(|v| v.as_i64()).unwrap_or(0);
            let started_at = val.get("startedAt").and_then(|v| v.as_str()).unwrap_or("");
            let ended_at = val.get("endedAt").and_then(|v| v.as_str()).unwrap_or("");

            let res = conn.execute(
                "INSERT INTO game_sessions (id, game_id, game_title, is_steam, duration_seconds, started_at, ended_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
                 ON CONFLICT(id) DO NOTHING",
                params![
                    id,
                    game_id,
                    title,
                    if is_steam { 1 } else { 0 },
                    duration,
                    started_at,
                    ended_at
                ],
            );
            if res.is_ok() {
                imported += 1;
            }
        }
    }
    Ok(imported)
}
