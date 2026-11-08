use flate2::read::GzDecoder;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use tar::Archive;

use crate::config::{get_aegis_config, save_aegis_config};

fn get_plugins_dir() -> Result<PathBuf, String> {
    let dir = if let Ok(xdg) = std::env::var("XDG_CONFIG_HOME") {
        if !xdg.is_empty() {
            PathBuf::from(xdg).join("aegis").join("plugins")
        } else {
            let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
            PathBuf::from(home).join(".config").join("aegis").join("plugins")
        }
    } else if let Ok(home) = std::env::var("HOME") {
        PathBuf::from(home).join(".config").join("aegis").join("plugins")
    } else {
        PathBuf::from(".config/aegis/plugins")
    };

    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| format!("Error creando carpeta de plugins: {}", e))?;
    }
    Ok(dir)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginManifest {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub icon: Option<String>,
    pub category: String,
    pub entry: String,
    pub permissions: Vec<String>,
    #[serde(default)]
    pub home_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledPlugin {
    pub manifest: PluginManifest,
    pub dir_path: String,
    pub is_enabled: bool,
    pub installed_at: String,
    pub size_bytes: u64,
}

fn calculate_dir_size(dir: &Path) -> u64 {
    let mut total = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(meta) = path.metadata() {
                    total += meta.len();
                }
            } else if path.is_dir() {
                total += calculate_dir_size(&path);
            }
        }
    }
    total
}

#[tauri::command]
pub fn list_installed_community_plugins() -> Result<Vec<InstalledPlugin>, String> {
    let plugins_dir = get_plugins_dir()?;
    let config = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let mut plugins = Vec::new();

    let entries = fs::read_dir(&plugins_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let manifest_path = path.join("plugin.json");
            if manifest_path.is_file() {
                if let Ok(content) = fs::read_to_string(&manifest_path) {
                    if let Ok(manifest) = serde_json::from_str::<PluginManifest>(&content) {
                        let is_enabled = config
                            .community_plugins_enabled
                            .get(&manifest.id)
                            .copied()
                            .unwrap_or(true);
                        let size = calculate_dir_size(&path);
                        let installed_at = path
                            .metadata()
                            .and_then(|m| m.modified())
                            .ok()
                            .and_then(|time| time.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| format!("Instalado hace {} min", d.as_secs() / 60))
                            .unwrap_or_else(|| "Reciente".to_string());

                        plugins.push(InstalledPlugin {
                            manifest,
                            dir_path: path.to_string_lossy().to_string(),
                            is_enabled,
                            installed_at,
                            size_bytes: size,
                        });
                    }
                }
            }
        }
    }

    Ok(plugins)
}

#[tauri::command]
pub fn install_plugin_package(package_path: String) -> Result<PluginManifest, String> {
    let path = Path::new(&package_path);
    if !path.exists() {
        return Err(format!("El archivo de paquete no existe: {}", package_path));
    }

    let file = fs::File::open(path).map_err(|e| format!("Error abriendo paquete: {}", e))?;
    let tar = GzDecoder::new(file);
    let mut archive = Archive::new(tar);

    // Descomprimir en directorio temporal aislado para validar
    let temp_dir = std::env::temp_dir().join(format!("aegis_pkg_{}", std::process::id()));
    if temp_dir.exists() {
        let _ = fs::remove_dir_all(&temp_dir);
    }
    fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

    archive
        .unpack(&temp_dir)
        .map_err(|e| format!("Error descomprimiendo paquete .aegispkg: {}", e))?;

    // Validar plugin.json
    let manifest_path = temp_dir.join("plugin.json");
    if !manifest_path.exists() {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err("Paquete inválido: falta 'plugin.json' en la raíz del paquete.".to_string());
    }

    let content = fs::read_to_string(&manifest_path).map_err(|e| e.to_string())?;
    let manifest: PluginManifest = serde_json::from_str(&content)
        .map_err(|e| format!("Manifiesto 'plugin.json' corrupto o inválido: {}", e))?;

    // Validar ID seguro (sin '../' ni caracteres peligrosos)
    if !manifest
        .id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(format!("ID de plugin inválido: {}", manifest.id));
    }

    let plugins_dir = get_plugins_dir()?;
    let target_dir = plugins_dir.join(&manifest.id);

    if target_dir.exists() {
        let _ = fs::remove_dir_all(&target_dir);
    }

    fs::rename(&temp_dir, &target_dir).map_err(|e| {
        // Fallback copia si rename falla entre filesystems
        format!("Error instalando en {}: {}", target_dir.display(), e)
    })?;

    // Registrar como activado por defecto
    if let Ok(mut cfg) = get_aegis_config() {
        cfg.community_plugins_enabled
            .insert(manifest.id.clone(), true);
        let _ = save_aegis_config(cfg);
    }

    Ok(manifest)
}

#[tauri::command]
pub async fn install_plugin_from_url(url: String) -> Result<PluginManifest, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .build()
        .map_err(|e| e.to_string())?;

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Error descargando paquete desde {}: {}", url, e))?;

    if !res.status().is_success() {
        return Err(format!(
            "Servidor devolvió código HTTP {}",
            res.status().as_u16()
        ));
    }

    let bytes = res.bytes().await.map_err(|e| e.to_string())?;
    let temp_pkg_path = std::env::temp_dir().join(format!("downloaded_{}.aegispkg", std::process::id()));
    fs::write(&temp_pkg_path, bytes).map_err(|e| e.to_string())?;

    let manifest = install_plugin_package(temp_pkg_path.to_string_lossy().to_string())?;
    let _ = fs::remove_file(temp_pkg_path);

    Ok(manifest)
}

#[tauri::command]
pub fn uninstall_community_plugin(plugin_id: String) -> Result<String, String> {
    if !plugin_id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("ID de plugin inválido.".to_string());
    }

    let plugins_dir = get_plugins_dir()?;
    let target = plugins_dir.join(&plugin_id);
    if target.exists() && target.is_dir() {
        fs::remove_dir_all(&target).map_err(|e| format!("Error eliminando plugin: {}", e))?;
    }

    if let Ok(mut cfg) = get_aegis_config() {
        cfg.community_plugins_enabled.remove(&plugin_id);
        let _ = save_aegis_config(cfg);
    }

    Ok(format!("Plugin '{}' desinstalado correctamente.", plugin_id))
}

#[tauri::command]
pub fn toggle_community_plugin(plugin_id: String, enabled: bool) -> Result<bool, String> {
    let mut cfg = get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    cfg.community_plugins_enabled
        .insert(plugin_id, enabled);
    save_aegis_config(cfg)?;
    Ok(enabled)
}

#[tauri::command]
pub fn create_plugin_scaffold(
    id: String,
    name: String,
    category: String,
) -> Result<PluginManifest, String> {
    let clean_id = id.trim().to_lowercase().replace(' ', "-");
    if !clean_id
        .chars()
        .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
    {
        return Err("ID de plugin debe contener solo letras, números y guiones.".to_string());
    }

    let plugins_dir = get_plugins_dir()?;
    let target = plugins_dir.join(&clean_id);
    if target.exists() {
        return Err(format!("El plugin '{}' ya existe.", clean_id));
    }

    fs::create_dir_all(&target).map_err(|e| e.to_string())?;

    let manifest = PluginManifest {
        id: clean_id.clone(),
        name: if name.trim().is_empty() {
            "Nuevo Plugin".to_string()
        } else {
            name.trim().to_string()
        },
        version: "1.0.0".to_string(),
        description: "Extensión comunitaria para Aegis Cockpit.".to_string(),
        author: std::env::var("USER").unwrap_or_else(|_| "Developer".to_string()),
        icon: Some("Puzzle".to_string()),
        category: if category.trim().is_empty() {
            "Utilidades".to_string()
        } else {
            category.trim().to_string()
        },
        entry: "index.js".to_string(),
        permissions: vec!["system:info".to_string()],
        home_url: Some(format!("https://github.com/aegis-community/{}", clean_id)),
    };

    let manifest_json = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
    fs::write(target.join("plugin.json"), manifest_json).map_err(|e| e.to_string())?;

    // Código inicial de ejemplo
    let sample_code = r#"// Aegis Community Plugin Sandbox Entry
export default {
  id: '__ID__',
  name: '__NAME__',
  mount(context) {
    console.log(`[Aegis Plugin] ${this.name} mounted into Cockpit`);
  },
  unmount() {
    console.log(`[Aegis Plugin] ${this.name} unmounted`);
  }
};
"#
    .replace("__ID__", &clean_id)
    .replace("__NAME__", &manifest.name);

    fs::write(target.join("index.js"), sample_code).map_err(|e| e.to_string())?;

    // Registrar como habilitado
    if let Ok(mut cfg) = get_aegis_config() {
        cfg.community_plugins_enabled.insert(clean_id, true);
        let _ = save_aegis_config(cfg);
    }

    Ok(manifest)
}

#[tauri::command]
pub fn open_plugins_directory() -> Result<String, String> {
    let dir = get_plugins_dir()?;
    let path_str = dir.to_string_lossy().to_string();

    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("xdg-open").arg(&path_str).spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(&path_str).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("explorer").arg(&path_str).spawn();
    }

    Ok(path_str)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogPluginItem {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub author: String,
    pub category: String,
    pub download_url: String,
    pub icon: Option<String>,
    pub stars: u32,
    pub downloads: u32,
    pub permissions: Vec<String>,
}

#[tauri::command]
pub async fn fetch_community_plugins_catalog() -> Result<Vec<CatalogPluginItem>, String> {
    let registry_url = "https://raw.githubusercontent.com/GabrielSa8/Aegis/main/community-plugins.json";
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3))
        .build()
        .map_err(|e| e.to_string())?;

    if let Ok(res) = client.get(registry_url).send().await {
        if res.status().is_success() {
            if let Ok(items) = res.json::<Vec<CatalogPluginItem>>().await {
                return Ok(items);
            }
        }
    }

    Ok(get_curated_catalog_plugins())
}

fn get_curated_catalog_plugins() -> Vec<CatalogPluginItem> {
    vec![
        CatalogPluginItem {
            id: "gaming".to_string(),
            name: "Centro de Ocio & Gaming".to_string(),
            version: "1.0.0".to_string(),
            description: "Lanzador de juegos para Linux con aceleración GameMode, perfiles Proton/Wine, FSR upscaling y tracking de sesiones.".to_string(),
            author: "Aegis Core".to_string(),
            category: "Gaming".to_string(),
            download_url: String::new(),
            icon: Some("Gamepad2".to_string()),
            stars: 0,
            downloads: 0,
            permissions: vec!["system:process".to_string(), "storage".to_string()],
        },
        CatalogPluginItem {
            id: "finances".to_string(),
            name: "Finanzas & Presupuestos".to_string(),
            version: "1.0.0".to_string(),
            description: "Control de gastos, ingresos, radar de liquidez proyectado y simulador de compras diferidas (MSI) en SQLite local.".to_string(),
            author: "Aegis Core".to_string(),
            category: "Finanzas".to_string(),
            download_url: String::new(),
            icon: Some("PiggyBank".to_string()),
            stars: 0,
            downloads: 0,
            permissions: vec!["storage".to_string()],
        },
        CatalogPluginItem {
            id: "tasks".to_string(),
            name: "Gestor de Tareas & Prioridades".to_string(),
            version: "1.0.0".to_string(),
            description: "Tablero Kanban de 3 estados, matriz Eisenhower y sincronización bidireccional con tareas Markdown de Obsidian.".to_string(),
            author: "Aegis Core".to_string(),
            category: "Productividad".to_string(),
            download_url: String::new(),
            icon: Some("CheckSquare".to_string()),
            stars: 0,
            downloads: 0,
            permissions: vec!["storage".to_string(), "fs:vault".to_string()],
        },
        CatalogPluginItem {
            id: "sentinel".to_string(),
            name: "Centinela Host & Telemetría".to_string(),
            version: "1.0.0".to_string(),
            description: "Monitoreo en tiempo real de CPU, memoria, ZRAM, alertas térmicas (>85°C) y administrador táctico de procesos.".to_string(),
            author: "Aegis Core".to_string(),
            category: "Sistema".to_string(),
            download_url: String::new(),
            icon: Some("Activity".to_string()),
            stars: 0,
            downloads: 0,
            permissions: vec!["system:telemetry".to_string(), "system:process".to_string()],
        },
        CatalogPluginItem {
            id: "devops".to_string(),
            name: "DevOps & Flota Git".to_string(),
            version: "1.0.0".to_string(),
            description: "Auditoría multi-repositorio unificada, branches divergentes, commits pendientes y estado de sincronización remota.".to_string(),
            author: "Aegis Core".to_string(),
            category: "DevOps".to_string(),
            download_url: String::new(),
            icon: Some("GitBranch".to_string()),
            stars: 0,
            downloads: 0,
            permissions: vec!["system:git".to_string(), "fs:repos".to_string()],
        },
    ]
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginFileRecord {
    pub relative_path: String,
    pub content_hex: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportedCommunityPlugin {
    pub id: String,
    pub files: Vec<PluginFileRecord>,
}

pub fn export_community_plugins_payload() -> Result<Vec<ExportedCommunityPlugin>, String> {
    let plugins_dir = get_plugins_dir()?;
    let mut exported = Vec::new();

    if !plugins_dir.exists() {
        return Ok(exported);
    }

    let entries = fs::read_dir(&plugins_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let manifest_path = path.join("plugin.json");
            if manifest_path.is_file() {
                let plugin_id = path
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();
                let mut files = Vec::new();
                let _ = collect_plugin_files(&path, &path, &mut files);
                if !files.is_empty() {
                    exported.push(ExportedCommunityPlugin {
                        id: plugin_id,
                        files,
                    });
                }
            }
        }
    }

    Ok(exported)
}

fn collect_plugin_files(
    base_dir: &Path,
    current_dir: &Path,
    files: &mut Vec<PluginFileRecord>,
) -> Result<(), String> {
    let entries = fs::read_dir(current_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_file() {
            if let Ok(bytes) = fs::read(&path) {
                if bytes.len() <= 5 * 1024 * 1024 {
                    if let Ok(stripped) = path.strip_prefix(base_dir) {
                        let rel_path = stripped.to_string_lossy().to_string();
                        files.push(PluginFileRecord {
                            relative_path: rel_path,
                            content_hex: hex::encode(bytes),
                        });
                    }
                }
            }
        } else if path.is_dir() {
            let _ = collect_plugin_files(base_dir, &path, files);
        }
    }
    Ok(())
}

pub fn import_community_plugins_payload(
    plugins: Vec<ExportedCommunityPlugin>,
) -> Result<usize, String> {
    let plugins_dir = get_plugins_dir()?;
    let mut installed_count = 0;

    for plugin in plugins {
        if !plugin
            .id
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
        {
            continue;
        }

        let target_dir = plugins_dir.join(&plugin.id);
        if !target_dir.exists() {
            let _ = fs::create_dir_all(&target_dir);
        }

        let mut has_manifest = false;
        for file in plugin.files {
            let rel = Path::new(&file.relative_path);
            if rel.components().any(|c| {
                matches!(
                    c,
                    std::path::Component::ParentDir | std::path::Component::RootDir
                )
            }) {
                continue;
            }

            if file.relative_path == "plugin.json" {
                has_manifest = true;
            }

            let file_target = target_dir.join(rel);
            if let Some(parent) = file_target.parent() {
                let _ = fs::create_dir_all(parent);
            }

            if let Ok(bytes) = hex::decode(&file.content_hex) {
                let _ = fs::write(file_target, bytes);
            }
        }

        if has_manifest {
            installed_count += 1;
        }
    }

    Ok(installed_count)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plugins_dir_resolution() {
        let dir = get_plugins_dir();
        assert!(dir.is_ok());
    }

    #[test]
    fn test_manifest_serialization() {
        let m = PluginManifest {
            id: "test-plugin".to_string(),
            name: "Test Plugin".to_string(),
            version: "1.0.0".to_string(),
            description: "Testing".to_string(),
            author: "Tester".to_string(),
            icon: None,
            category: "Utilidades".to_string(),
            entry: "index.js".to_string(),
            permissions: vec!["system".to_string()],
            home_url: None,
        };
        let json = serde_json::to_string(&m);
        assert!(json.is_ok());
    }
}
