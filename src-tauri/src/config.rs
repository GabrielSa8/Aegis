use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

fn get_config_dir() -> PathBuf {
    if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
        if !xdg.is_empty() {
            return PathBuf::from(xdg).join("aegis");
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home).join(".config").join("aegis");
    }
    PathBuf::from("/home/zabrielsa/.config/aegis")
}

fn get_config_file_path() -> PathBuf {
    get_config_dir().join("config.json")
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRepoConfig {
    pub id: String,
    pub name: String,
    pub path: String,
    pub role: String,
    pub warning: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AegisConfig {
    pub vault_path: String,
    pub agent_type: String, // "agy" | "claude" | "ollama" | "custom"
    pub agent_custom_cmd: Option<String>,
    pub theme: String, // "nordic-moss" | "tokyo-night" | "oled-black" | "amber-terminal" | "dracula"
    pub enable_gamemode: bool,
    pub enable_gamescope_fsr: bool,
    pub git_repos: Vec<GitRepoConfig>,
}

fn default_config() -> AegisConfig {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/zabrielsa".to_string());
    AegisConfig {
        vault_path: format!("{}/Documentos/Obsidian Vault", home),
        agent_type: "agy".to_string(),
        agent_custom_cmd: None,
        theme: "nordic-moss".to_string(),
        enable_gamemode: true,
        enable_gamescope_fsr: false,
        git_repos: vec![
            GitRepoConfig {
                id: "tadu".to_string(),
                name: "TADÚ Backend".to_string(),
                path: format!("{}/Proyects/projects/TADU", home),
                role: "Movilidad (AWS SAM / Lambda)".to_string(),
                warning: Some("NUNCA usar git add -A ni git clean -fdx".to_string()),
            },
            GitRepoConfig {
                id: "aegis".to_string(),
                name: "Aegis".to_string(),
                path: format!("{}/Proyects/projects/Aegis", home),
                role: "Cockpit Soberano (Tauri v2)".to_string(),
                warning: None,
            },
            GitRepoConfig {
                id: "brainia".to_string(),
                name: "BrainIA (Obsidian)".to_string(),
                path: format!("{}/Documentos/Obsidian Vault", home),
                role: "Bóveda Central de Conocimiento".to_string(),
                warning: None,
            },
            GitRepoConfig {
                id: "granja".to_string(),
                name: "Granja Android".to_string(),
                path: format!("{}/AndroidStudioProjects/granja", home),
                role: "App Móvil (Kotlin/Compose)".to_string(),
                warning: None,
            },
            GitRepoConfig {
                id: "aegisTrack".to_string(),
                name: "AegisTrack".to_string(),
                path: format!("{}/Proyects/projects/AegisTrack", home),
                role: "Tracker de Actividades".to_string(),
                warning: None,
            },
            GitRepoConfig {
                id: "booklet".to_string(),
                name: "Booklet V2".to_string(),
                path: format!("{}/Proyects/projects/Booklet_V2", home),
                role: "Lector de Libros y Apuntes".to_string(),
                warning: None,
            },
        ],
    }
}

#[tauri::command]
pub fn get_aegis_config() -> Result<AegisConfig, String> {
    let p = get_config_file_path();
    if p.exists() {
        if let Ok(content) = fs::read_to_string(&p) {
            if let Ok(cfg) = serde_json::from_str::<AegisConfig>(&content) {
                return Ok(cfg);
            }
        }
    }
    let default = default_config();
    let _ = save_aegis_config(default.clone());
    Ok(default)
}

#[tauri::command]
pub fn save_aegis_config(config: AegisConfig) -> Result<AegisConfig, String> {
    let dir = get_config_dir();
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Error creando {}: {}", dir.display(), e))?;
    }
    let p = get_config_file_path();
    let json_str = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(&p, json_str).map_err(|e| format!("Error guardando {}: {}", p.display(), e))?;
    Ok(config)
}
