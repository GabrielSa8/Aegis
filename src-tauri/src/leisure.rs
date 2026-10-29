use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use crate::db::get_db_connection;
use rusqlite::params;

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
    let candidates = [
        format!("{}/.local/share/Steam/appcache/librarycache/{}/library_600x900.jpg", home, app_id),
        format!("{}/.steam/steam/appcache/librarycache/{}/library_600x900.jpg", home, app_id),
        format!("{}/.local/share/Steam/appcache/librarycache/{}/header.jpg", home, app_id),
        format!("{}/.steam/steam/appcache/librarycache/{}/header.jpg", home, app_id),
        format!("{}/.local/share/Steam/appcache/librarycache/{}/library_hero.jpg", home, app_id),
        format!("{}/.var/app/com.valvesoftware.Steam/data/Steam/appcache/librarycache/{}/library_600x900.jpg", home, app_id),
    ];

    for path in &candidates {
        if Path::new(path).exists() {
            if let Ok(bytes) = fs::read(path) {
                if !bytes.is_empty() {
                    let b64 = to_base64(&bytes);
                    return Some(format!("data:image/jpeg;base64,{}", b64));
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
                                games.push(SteamGame {
                                    app_id: appid,
                                    name,
                                    install_dir: installdir,
                                    size_mb: size_bytes / (1024 * 1024),
                                    last_played,
                                    cover_image,
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

#[tauri::command]
pub fn launch_game(
    game_id: String,
    launch_type: Option<String>,
    launch_target: Option<String>,
    use_gamemode: bool,
    use_gamescope_fsr: bool,
    use_mangohud: Option<bool>,
    gamescope_res: Option<String>,
) -> Result<String, String> {
    let mangohud_flag = use_mangohud.unwrap_or(false);

    let l_type = launch_type.unwrap_or_else(|| {
        if game_id.starts_with("steam:") || game_id == "steam" {
            "steam".to_string()
        } else if game_id.starts_with("http://") || game_id.starts_with("https://") || game_id.starts_with("url:") {
            "url".to_string()
        } else if game_id.starts_with("flatpak:") {
            "flatpak".to_string()
        } else {
            "cmd".to_string()
        }
    });

    let target = launch_target.unwrap_or_else(|| {
        if game_id.starts_with("steam:") {
            game_id[6..].to_string()
        } else if game_id.starts_with("url:") {
            game_id[4..].to_string()
        } else if game_id.starts_with("flatpak:") {
            game_id[8..].to_string()
        } else if game_id.starts_with("cmd:") {
            game_id[4..].to_string()
        } else {
            game_id.clone()
        }
    });

    match l_type.as_str() {
        "url" => {
            let _ = Command::new("xdg-open").arg(&target).spawn();
            Ok(format!("Enlace web abierto: {}", target))
        }
        "steam" => {
            if target == "steam" || target.is_empty() {
                let mut cmd = build_accelerated_command("steam", &[], use_gamemode, use_gamescope_fsr, mangohud_flag, gamescope_res);
                cmd.spawn().map_err(|e| format!("Error iniciando Steam: {}", e))?;
                Ok("Cliente Steam iniciado con aceleración.".to_string())
            } else {
                let run_arg = format!("steam://run/{}", target);
                let mut cmd = build_accelerated_command("steam", &[&run_arg], use_gamemode, use_gamescope_fsr, mangohud_flag, gamescope_res);
                cmd.spawn().map_err(|e| format!("Error lanzando título Steam {}: {}", target, e))?;
                Ok(format!("Iniciando título Steam (AppID: {})", target))
            }
        }
        "flatpak" => {
            let mut cmd = build_accelerated_command("flatpak", &["run", &target], use_gamemode, use_gamescope_fsr, mangohud_flag, gamescope_res);
            cmd.spawn().map_err(|e| format!("Error ejecutando Flatpak {}: {}", target, e))?;
            Ok(format!("Lanzando aplicación Flatpak: {}", target))
        }
        "cmd" | _ => {
            let shell_script = if use_gamemode && Path::new("/usr/bin/gamemoded").exists() {
                format!("gamemoderun {}", target)
            } else {
                target.clone()
            };
            let mut cmd = Command::new("sh");
            cmd.arg("-c").arg(&shell_script);
            cmd.spawn().map_err(|e| format!("Error ejecutando comando {}: {}", target, e))?;
            Ok(format!("Comando iniciado: {}", target))
        }
    }
}

// ==========================================
// 🎮 SQLite CRUD: Custom Games & Emulators
// ==========================================

#[tauri::command]
pub fn sqlite_get_custom_games() -> Result<Vec<CustomGame>, String> {
    let conn = get_db_connection()?;
    let mut stmt = conn
        .prepare(
            "SELECT id, title, category, launch_type, launch_target, description, banner_url, play_time_minutes, last_played, created_at
             FROM custom_games ORDER BY title ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(CustomGame {
                id: row.get(0)?,
                title: row.get(1)?,
                category: row.get(2)?,
                launch_type: row.get(3)?,
                launch_target: row.get(4)?,
                description: row.get(5)?,
                banner_url: row.get(6)?,
                play_time_minutes: row.get(7)?,
                last_played: row.get(8)?,
                created_at: row.get(9)?,
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
