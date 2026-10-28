use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GamingStatus {
    pub gamemode_active: bool,
    pub gamemode_installed: bool,
    pub gamescope_installed: bool,
    pub default_launch_command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SteamGame {
    pub app_id: String,
    pub name: String,
    pub install_dir: String,
    pub size_mb: u64,
}

#[tauri::command]
pub fn get_gaming_status() -> Result<GamingStatus, String> {
    let gamemode_installed = Path::new("/usr/bin/gamemoded").exists();
    let gamescope_installed = Path::new("/usr/bin/gamescope").exists();

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
        default_launch_command: "gamemoderun %command%".to_string(),
    })
}

#[tauri::command]
pub fn get_installed_steam_games() -> Result<Vec<SteamGame>, String> {
    let mut games = Vec::new();
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/zabrielsa".to_string());
    let steamapps_path = format!("{}/.local/share/Steam/steamapps", home);

    if let Ok(entries) = fs::read_dir(steamapps_path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if let Some(file_name) = p.file_name().and_then(|n| n.to_str()) {
                if file_name.starts_with("appmanifest_") && file_name.ends_with(".acf") {
                    if let Ok(content) = fs::read_to_string(&p) {
                        let mut appid = String::new();
                        let mut name = String::new();
                        let mut installdir = String::new();
                        let mut size_bytes: u64 = 0;

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
                            }
                        }

                        if !appid.is_empty()
                            && !name.is_empty()
                            && !name.contains("Steam Linux Runtime")
                            && !name.contains("Proton")
                            && !name.contains("Steamworks")
                        {
                            games.push(SteamGame {
                                app_id: appid,
                                name,
                                install_dir: installdir,
                                size_mb: size_bytes / (1024 * 1024),
                            });
                        }
                    }
                }
            }
        }
    }

    games.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(games)
}

fn extract_acf_val(line: &str) -> Option<String> {
    let parts: Vec<&str> = line.split('"').filter(|s| !s.trim().is_empty()).collect();
    if parts.len() >= 2 {
        Some(parts[1].to_string())
    } else {
        None
    }
}

#[tauri::command]
pub fn launch_game(
    game_id: String,
    use_gamemode: bool,
    use_gamescope_fsr: bool,
) -> Result<String, String> {
    match game_id.as_str() {
        "pokerogue" => {
            let _ = Command::new("xdg-open")
                .arg("https://pokerogue.net")
                .spawn();
            Ok("PokéRogue abierto en navegador Wayland.".to_string())
        }
        "pokeisaac" => {
            let _ = Command::new("xdg-open")
                .arg("https://github.com")
                .spawn();
            Ok("PokéIsaac lanzado.".to_string())
        }
        "pokesurvivor" => {
            let _ = Command::new("xdg-open")
                .arg("https://itch.io")
                .spawn();
            Ok("PokéSurvivor lanzado.".to_string())
        }
        "emerald_rogue" | "mgba" => {
            let spawned = Command::new("flatpak")
                .args(["run", "io.mgba.mGBA"])
                .spawn()
                .or_else(|_| Command::new("mgba-qt").spawn());

            match spawned {
                Ok(_) => Ok("Emulador mGBA iniciado.".to_string()),
                Err(e) => Err(format!("mGBA no encontrado en el sistema: {}", e)),
            }
        }
        "steam" => {
            let mut cmd = if use_gamescope_fsr {
                let mut c = Command::new("gamescope");
                c.args(["-W", "1280", "-H", "720", "-r", "60", "-F", "fsr", "--"]);
                if use_gamemode {
                    c.arg("gamemoderun");
                }
                c.arg("steam");
                c
            } else if use_gamemode {
                let mut c = Command::new("gamemoderun");
                c.arg("steam");
                c
            } else {
                Command::new("steam")
            };

            cmd.spawn().map_err(|e| format!("Error iniciando Steam: {}", e))?;
            Ok("Steam iniciado con perfil de aceleración N150.".to_string())
        }
        other => {
            if other.starts_with("steam:") {
                let app_id = &other[6..];
                let _ = Command::new("steam")
                    .arg(format!("steam://run/{}", app_id))
                    .spawn();
                Ok(format!("Iniciando título Steam {}", app_id))
            } else {
                Err(format!("Juego o lanzador desconocido: {}", other))
            }
        }
    }
}
