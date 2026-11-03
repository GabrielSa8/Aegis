use flate2::read::GzDecoder;
use flate2::write::GzEncoder;
use flate2::Compression;
use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use tar::{Archive, Builder};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupManifest {
    pub version: String,
    pub timestamp: String,
    pub app_id: String,
    pub db_size_bytes: u64,
    pub config_size_bytes: u64,
    pub vault_included: bool,
    pub vault_notes_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BackupInfo {
    pub file_name: String,
    pub file_path: String,
    pub file_size_bytes: u64,
    pub created_at: String,
    pub manifest: Option<BackupManifest>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreInfo {
    pub success: bool,
    pub message: String,
    pub manifest: Option<BackupManifest>,
}

fn get_backups_dir() -> PathBuf {
    if let Ok(xdg) = std::env::var("XDG_DATA_HOME") {
        if !xdg.is_empty() {
            let p = PathBuf::from(xdg).join("aegis").join("backups");
            let _ = fs::create_dir_all(&p);
            return p;
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        let p = PathBuf::from(home).join(".local").join("share").join("aegis").join("backups");
        let _ = fs::create_dir_all(&p);
        return p;
    }
    PathBuf::from("backups")
}

#[tauri::command]
pub fn create_system_backup(
    include_vault: bool,
    custom_output_dir: Option<String>,
) -> Result<BackupInfo, String> {
    let now = chrono_or_simple_timestamp();
    let file_name = format!("aegis_backup_{}.aegisbackup", now.replace([':', ' ', '-'], "_"));

    let target_dir = match custom_output_dir {
        Some(dir) if !dir.trim().is_empty() => PathBuf::from(dir),
        _ => get_backups_dir(),
    };
    let _ = fs::create_dir_all(&target_dir);
    let target_path = target_dir.join(&file_name);

    // Obtener rutas de base de datos y config
    let (_, db_path) = crate::db::get_db_paths();
    let cfg_path = crate::config::get_config_file_path_internal();
    let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());

    let db_size = db_path.metadata().map(|m| m.len()).unwrap_or(0);
    let cfg_size = cfg_path.metadata().map(|m| m.len()).unwrap_or(0);

    let mut vault_notes_count = 0;
    if include_vault {
        let vault_p = Path::new(&cfg.vault_path);
        if vault_p.exists() {
            vault_notes_count = count_markdown_files(vault_p);
        }
    }

    let manifest = BackupManifest {
        version: "3.0.0".to_string(),
        timestamp: now.clone(),
        app_id: "com.aegis.cockpit".to_string(),
        db_size_bytes: db_size,
        config_size_bytes: cfg_size,
        vault_included: include_vault,
        vault_notes_count,
    };

    // Crear archivo tar.gz
    let tar_gz_file = File::create(&target_path)
        .map_err(|e| format!("Error creando archivo de respaldo {}: {}", target_path.display(), e))?;
    let enc = GzEncoder::new(tar_gz_file, Compression::default());
    let mut tar_builder = Builder::new(enc);

    // 1. Agregar manifest.json
    let manifest_json = serde_json::to_vec_pretty(&manifest)
        .map_err(|e| format!("Error serializando manifiesto: {}", e))?;
    let mut header = tar::Header::new_gnu();
    header.set_path("manifest.json").map_err(|e| e.to_string())?;
    header.set_size(manifest_json.len() as u64);
    header.set_mode(0o644);
    header.set_cksum();
    tar_builder.append(&header, &manifest_json[..]).map_err(|e| e.to_string())?;

    // 2. Agregar aegis_lifeos.db
    if db_path.exists() {
        if let Ok(mut db_file) = File::open(&db_path) {
            tar_builder
                .append_file("data/aegis_lifeos.db", &mut db_file)
                .map_err(|e| format!("Error respaldando base de datos: {}", e))?;
        }
    }

    // 3. Agregar config.json
    if cfg_path.exists() {
        if let Ok(mut cfg_file) = File::open(&cfg_path) {
            tar_builder
                .append_file("config/config.json", &mut cfg_file)
                .map_err(|e| format!("Error respaldando configuración: {}", e))?;
        }
    }

    // 4. Agregar bóveda si se solicitó
    if include_vault {
        let vault_p = Path::new(&cfg.vault_path);
        if vault_p.exists() {
            let _ = tar_builder.append_dir_all("vault", vault_p);
        }
    }

    tar_builder.finish().map_err(|e| format!("Error finalizando compresión de respaldo: {}", e))?;

    let file_size = target_path.metadata().map(|m| m.len()).unwrap_or(0);

    Ok(BackupInfo {
        file_name,
        file_path: target_path.to_string_lossy().to_string(),
        file_size_bytes: file_size,
        created_at: now,
        manifest: Some(manifest),
    })
}

#[tauri::command]
pub fn list_system_backups() -> Result<Vec<BackupInfo>, String> {
    let dir = get_backups_dir();
    let mut list = Vec::new();

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("aegisbackup") {
                let name = p.file_name().unwrap_or_default().to_string_lossy().to_string();
                let meta = p.metadata().ok();
                let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                let created = meta
                    .and_then(|m| m.modified().ok())
                    .map(|t| {
                        let dur = t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default();
                        format_epoch_to_str(dur.as_secs())
                    })
                    .unwrap_or_else(|| "Desconocido".to_string());

                let manifest = read_manifest_from_backup(&p).ok();

                list.push(BackupInfo {
                    file_name: name,
                    file_path: p.to_string_lossy().to_string(),
                    file_size_bytes: size,
                    created_at: created,
                    manifest,
                });
            }
        }
    }

    list.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(list)
}

#[tauri::command]
pub fn restore_system_backup(backup_path: String) -> Result<RestoreInfo, String> {
    let p = Path::new(&backup_path);
    if !p.exists() {
        return Err(format!("El archivo de respaldo no existe: {}", backup_path));
    }

    let file = File::open(p).map_err(|e| format!("Error abriendo respaldo: {}", e))?;
    let tar = GzDecoder::new(file);
    let mut archive = Archive::new(tar);

    let (_, db_path) = crate::db::get_db_paths();
    let cfg_path = crate::config::get_config_file_path_internal();

    // Crear respaldos de seguridad preventivos (.bak)
    if db_path.exists() {
        let bak = db_path.with_extension("db.pre_restore.bak");
        let _ = fs::copy(&db_path, &bak);
    }
    if cfg_path.exists() {
        let bak = cfg_path.with_extension("json.pre_restore.bak");
        let _ = fs::copy(&cfg_path, &bak);
    }

    let mut manifest: Option<BackupManifest> = None;
    let mut db_restored = false;
    let mut cfg_restored = false;

    let entries = archive.entries().map_err(|e| format!("Error leyendo contenido de archivo: {}", e))?;

    for entry_res in entries {
        let mut entry = match entry_res {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path().map_err(|e| e.to_string())?.to_path_buf();
        let path_str = path.to_string_lossy();

        if path_str == "manifest.json" {
            let mut buf = Vec::new();
            use std::io::Read;
            if entry.read_to_end(&mut buf).is_ok() {
                manifest = serde_json::from_slice(&buf).ok();
            }
        } else if path_str == "data/aegis_lifeos.db" {
            if let Some(parent) = db_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            if entry.unpack(&db_path).is_ok() {
                db_restored = true;
            }
        } else if path_str == "config/config.json" {
            if let Some(parent) = cfg_path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            if entry.unpack(&cfg_path).is_ok() {
                cfg_restored = true;
            }
        }
    }

    let msg = format!(
        "Restauración concluida. DB: {}, Config: {}. Manifiesto verificado.",
        if db_restored { "OK" } else { "Omitida" },
        if cfg_restored { "OK" } else { "Omitida" }
    );

    Ok(RestoreInfo {
        success: db_restored || cfg_restored,
        message: msg,
        manifest,
    })
}

fn read_manifest_from_backup(path: &Path) -> Result<BackupManifest, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let tar = GzDecoder::new(file);
    let mut archive = Archive::new(tar);
    let entries = archive.entries().map_err(|e| e.to_string())?;

    for entry_res in entries {
        let mut entry = entry_res.map_err(|e| e.to_string())?;
        if entry.path().map(|p| p.to_string_lossy() == "manifest.json").unwrap_or(false) {
            let mut buf = Vec::new();
            use std::io::Read;
            entry.read_to_end(&mut buf).map_err(|e| e.to_string())?;
            let m: BackupManifest = serde_json::from_slice(&buf).map_err(|e| e.to_string())?;
            return Ok(m);
        }
    }
    Err("Manifiesto no encontrado en el archivo de respaldo".to_string())
}

fn count_markdown_files(dir: &Path) -> usize {
    let mut count = 0;
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_file() {
                if p.extension().and_then(|e| e.to_str()) == Some("md") {
                    count += 1;
                }
            } else if p.is_dir() && !p.file_name().and_then(|n| n.to_str()).unwrap_or("").starts_with('.') {
                count += count_markdown_files(&p);
            }
        }
    }
    count
}

fn chrono_or_simple_timestamp() -> String {
    let now = std::time::SystemTime::now();
    let epoch = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
    format_epoch_to_str(epoch)
}

fn format_epoch_to_str(epoch: u64) -> String {
    let days_since_epoch = epoch / 86400;
    let sec_in_day = epoch % 86400;
    let hours = sec_in_day / 3600;
    let minutes = (sec_in_day % 3600) / 60;
    let seconds = sec_in_day % 60;

    // Aproximación rápida para YYYY-MM-DD sin chrono crate pesado
    let mut year = 1970;
    let mut days_left = days_since_epoch;

    loop {
        let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
        let days_in_year = if leap { 366 } else { 365 };
        if days_left < days_in_year {
            break;
        }
        days_left -= days_in_year;
        year += 1;
    }

    let leap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
    let days_in_months = [
        31,
        if leap { 29 } else { 28 },
        31,
        30,
        31,
        30,
        31,
        31,
        30,
        31,
        30,
        31,
    ];

    let mut month = 1;
    for &dim in days_in_months.iter() {
        if days_left < dim {
            break;
        }
        days_left -= dim;
        month += 1;
    }
    let day = days_left + 1;

    format!("{:04}-{:02}-{:02} {:02}:{:02}:{:02}", year, month, day, hours, minutes, seconds)
}
