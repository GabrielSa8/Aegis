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
    PathBuf::from(".config/aegis")
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

pub fn default_config() -> AegisConfig {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let mut git_repos = Vec::new();

    // Auto-detectar repositorio actual si existe
    if let Ok(current_dir) = std::env::current_dir() {
        if current_dir.join(".git").exists() {
            git_repos.push(GitRepoConfig {
                id: "current_repo".to_string(),
                name: "Repositorio Principal".to_string(),
                path: current_dir.to_string_lossy().to_string(),
                role: "Espacio de Trabajo Activo".to_string(),
                warning: None,
            });
        }
    }

    // Ruta de bóveda Obsidian sugerida si existe físicamente
    let default_vault = format!("{}/Documentos/Obsidian Vault", home);
    let fallback_vault = format!("{}/Documents/Vault", home);
    let vault_path = if std::path::Path::new(&default_vault).exists() {
        default_vault
    } else if std::path::Path::new(&fallback_vault).exists() {
        fallback_vault
    } else {
        format!("{}/Documents/Obsidian Vault", home)
    };

    AegisConfig {
        vault_path,
        agent_type: "agy".to_string(),
        agent_custom_cmd: None,
        theme: "nordic-moss".to_string(),
        enable_gamemode: true,
        enable_gamescope_fsr: false,
        git_repos,
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
