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
pub struct UserProfile {
    pub name: String,
    pub role: String,
    pub avatar_emoji: String,
    pub response_style: String, // "caveman" | "technical" | "detailed"
}

impl Default for UserProfile {
    fn default() -> Self {
        Self {
            name: "Operador Soberano".to_string(),
            role: "Ingeniero de Software & Sistemas".to_string(),
            avatar_emoji: "🛡️".to_string(),
            response_style: "caveman".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenBudgetConfig {
    pub daily_limit: u64,
    pub weekly_limit: u64,
    pub warn_threshold_percent: u8,
}

impl Default for TokenBudgetConfig {
    fn default() -> Self {
        Self {
            daily_limit: 100_000,
            weekly_limit: 500_000,
            warn_threshold_percent: 80,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationsConfig {
    pub sentinel_temp_alert: bool,
    pub task_deadlines_alert: bool,
    pub finance_cutoffs_alert: bool,
    pub git_branch_alerts: bool,
}

impl Default for NotificationsConfig {
    fn default() -> Self {
        Self {
            sentinel_temp_alert: true,
            task_deadlines_alert: true,
            finance_cutoffs_alert: true,
            git_branch_alerts: false,
        }
    }
}

fn default_ui_scale() -> f32 {
    1.0
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FallbackEntry {
    pub engine: String,
    pub model: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AegisConfig {
    pub vault_path: String,
    pub agent_type: String, // "agy" | "claude" | "ollama" | "custom"
    pub agent_custom_cmd: Option<String>,
    pub theme: String, // "nordic-moss" | "tokyo-night" | "oled-black" | "amber-terminal" | "dracula"
    #[serde(default = "default_ui_scale")]
    pub ui_scale: f32, // 0.9, 1.0, 1.1
    pub enable_gamemode: bool,
    pub enable_gamescope_fsr: bool,
    pub git_repos: Vec<GitRepoConfig>,
    #[serde(default)]
    pub profile: UserProfile,
    #[serde(default)]
    pub token_budget: TokenBudgetConfig,
    /// Cadena global de respaldo (orden de prioridad) ante 429/cuota agotada.
    /// Solo se usan las entradas cuyo motor coincide con el motor activo.
    #[serde(default)]
    pub fallback_entries: Vec<FallbackEntry>,
    #[serde(default)]
    pub notifications: NotificationsConfig,
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
        ui_scale: 1.0,
        enable_gamemode: true,
        enable_gamescope_fsr: false,
        git_repos,
        profile: UserProfile::default(),
        token_budget: TokenBudgetConfig::default(),
        fallback_entries: Vec::new(),
        notifications: NotificationsConfig::default(),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StorageStats {
    pub config_path: String,
    pub config_size_bytes: u64,
    pub db_path: String,
    pub db_size_bytes: u64,
    pub vault_path: String,
    pub vault_notes_count: usize,
    pub cache_size_bytes: u64,
}

fn dir_size(path: &std::path::Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if let Ok(meta) = p.metadata() {
                    total += meta.len();
                }
            } else if p.is_dir() {
                total += dir_size(&p);
            }
        }
    }
    total
}

#[tauri::command]
pub fn get_storage_stats() -> Result<StorageStats, String> {
    let cfg = get_aegis_config().unwrap_or_else(|_| default_config());
    let cfg_path = get_config_file_path();
    let config_size = cfg_path.metadata().map(|m| m.len()).unwrap_or(0);

    let (_, db_path) = crate::db::get_db_paths();
    let db_size = db_path.metadata().map(|m| m.len()).unwrap_or(0);

    let vault_p = std::path::Path::new(&cfg.vault_path);
    let mut notes_count = 0;
    if vault_p.exists() {
        fn count_md(dir: &std::path::Path) -> usize {
            let mut count = 0;
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let p = entry.path();
                    if p.is_file() {
                        if p.extension().and_then(|e| e.to_str()) == Some("md") {
                            count += 1;
                        }
                    } else if p.is_dir() && !p.file_name().and_then(|n| n.to_str()).unwrap_or("").starts_with('.') {
                        count += count_md(&p);
                    }
                }
            }
            count
        }
        notes_count = count_md(vault_p);
    }

    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let cache_dir = std::path::PathBuf::from(&home).join(".cache").join("aegis");
    let cache_size = if cache_dir.exists() { dir_size(&cache_dir) } else { 0 };

    Ok(StorageStats {
        config_path: cfg_path.to_string_lossy().to_string(),
        config_size_bytes: config_size,
        db_path: db_path.to_string_lossy().to_string(),
        db_size_bytes: db_size,
        vault_path: cfg.vault_path,
        vault_notes_count: notes_count,
        cache_size_bytes: cache_size,
    })
}

#[tauri::command]
pub fn purge_app_caches() -> Result<u64, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let cache_dir = std::path::PathBuf::from(&home).join(".cache").join("aegis");
    let mut freed = 0;
    if cache_dir.exists() {
        freed = dir_size(&cache_dir);
        let _ = fs::remove_dir_all(&cache_dir);
        let _ = fs::create_dir_all(&cache_dir);
    }
    Ok(freed)
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
