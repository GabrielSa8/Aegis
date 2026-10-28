use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

const KNOL_PATH: &str = "/home/zabrielsa/.local/share/aegis/knol_character.json";

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
pub struct KnolSheet {
    pub name: String,
    pub title: String,
    pub race: String,
    pub class_name: String,
    pub level: u32,
    pub max_hp: i32,
    pub current_hp: i32,
    pub temp_hp: i32,
    pub armor_class: i32,
    pub initiative: i32,
    pub speed_feet: u32,
    pub proficiency: i32,
    pub strength: i32,
    pub constitution: i32,
    pub dexterity: i32,
    pub intelligence: i32,
    pub wisdom: i32,
    pub charisma: i32,
    pub second_wind_used: bool,
    pub relentless_endurance_used: bool,
    pub hit_dice_remaining: u32,
    pub poison_immune: bool,
    pub notes: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DiceRollResult {
    pub dice: String,
    pub rolls: Vec<i32>,
    pub modifier: i32,
    pub total: i32,
    pub is_critical_success: bool,
    pub is_critical_fail: bool,
    pub timestamp: String,
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
            // Intentar abrir con flatpak mGBA o binario
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

// ================= D&D 5E KNOL DE PIEDRANEGRA =================

fn default_knol() -> KnolSheet {
    KnolSheet {
        name: "Knoll de Piedranegra".to_string(),
        title: "El Acorazado Resacoso".to_string(),
        race: "Semiorco".to_string(),
        class_name: "Guerrero (Fighter)".to_string(),
        level: 1,
        max_hp: 13,
        current_hp: 13,
        temp_hp: 0,
        armor_class: 11,
        initiative: 1,
        speed_feet: 30,
        proficiency: 2,
        strength: 14,
        constitution: 15,
        dexterity: 12,
        intelligence: 10,
        wisdom: 10,
        charisma: 8,
        second_wind_used: false,
        relentless_endurance_used: false,
        hit_dice_remaining: 1,
        poison_immune: true,
        notes: "Inmune a venenos y toxinas (Yerba de Piedra). Placas de pizarra en hombros y nudillos. Calza una sola bota.".to_string(),
    }
}

#[tauri::command]
pub fn get_knol_sheet() -> Result<KnolSheet, String> {
    if Path::new(KNOL_PATH).exists() {
        if let Ok(content) = fs::read_to_string(KNOL_PATH) {
            if let Ok(sheet) = serde_json::from_str::<KnolSheet>(&content) {
                return Ok(sheet);
            }
        }
    }
    let default = default_knol();
    let _ = update_knol_sheet(default.clone());
    Ok(default)
}

#[tauri::command]
pub fn update_knol_sheet(sheet: KnolSheet) -> Result<KnolSheet, String> {
    if let Some(parent) = Path::new(KNOL_PATH).parent() {
        let _ = fs::create_dir_all(parent);
    }
    let json_str = serde_json::to_string_pretty(&sheet).map_err(|e| e.to_string())?;
    fs::write(KNOL_PATH, json_str).map_err(|e| e.to_string())?;
    Ok(sheet)
}

#[tauri::command]
pub fn roll_dice(dice: String, modifier: i32) -> Result<DiceRollResult, String> {
    // Formato 'd20', 'd12', 'd10', 'd8', 'd6', 'd4', 'd100'
    let sides_str = dice.trim_start_matches('d').trim_start_matches('D');
    let sides: i32 = sides_str.parse().map_err(|_| format!("Dado inválido: {}", dice))?;

    if sides < 2 || sides > 100 {
        return Err("Caras de dado deben estar entre 2 y 100".to_string());
    }

    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .subsec_nanos();
    let roll = ((nanos % (sides as u32)) + 1) as i32;

    let is_critical_success = sides == 20 && roll == 20;
    let is_critical_fail = sides == 20 && roll == 1;
    let total = roll + modifier;

    let now_str = std::process::Command::new("date")
        .arg("+%H:%M:%S")
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| "12:00:00".to_string());

    Ok(DiceRollResult {
        dice,
        rolls: vec![roll],
        modifier,
        total,
        is_critical_success,
        is_critical_fail,
        timestamp: now_str,
    })
}
