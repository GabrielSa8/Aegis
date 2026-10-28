use serde::{Deserialize, Serialize};
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Write};
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

pub fn get_vault_root() -> PathBuf {
    if let Ok(cfg) = crate::config::get_aegis_config() {
        if !cfg.vault_path.trim().is_empty() {
            let p = PathBuf::from(&cfg.vault_path);
            if p.exists() {
                return p;
            }
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        let p = PathBuf::from(&home).join("Documentos/Obsidian Vault");
        if p.exists() {
            return p;
        }
        let fallback_docs = PathBuf::from(&home).join("Documents/Obsidian Vault");
        if fallback_docs.exists() {
            return fallback_docs;
        }
    }
    PathBuf::from("Documentos/Obsidian Vault")
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultTask {
    pub id: String,
    pub file_path: String,
    pub relative_path: String,
    pub file_name: String,
    pub hub: String,
    pub line_number: usize,
    pub text: String,
    pub completed: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultNote {
    pub path: String,
    pub relative_path: String,
    pub title: String,
    pub hub: String,
    pub modified_time: u64,
    pub size_bytes: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultStats {
    pub total_notes: usize,
    pub total_tasks: usize,
    pub pending_tasks: usize,
    pub completed_tasks: usize,
    pub hubs_count: usize,
}

fn resolve_hub(relative_path: &str) -> String {
    let parts: Vec<&str> = relative_path.split('/').collect();
    if parts.len() > 1 {
        let first = parts[0];
        if first.starts_with("00") {
            return "00 Sistema".to_string();
        } else if first.starts_with("01") {
            return "01 Operaciones MELI".to_string();
        } else if first.starts_with("02") {
            return "02 Proyectos de Software".to_string();
        } else if first.starts_with("03") {
            return "03 Personal y Ocio".to_string();
        } else if first.starts_with("04") {
            return "04 Estudios y Certs".to_string();
        }
        return first.to_string();
    }
    "Raíz".to_string()
}

fn is_vault_path_safe(target_path: &Path) -> bool {
    let vault_root = get_vault_root();
    if let Ok(canonical) = target_path.canonicalize() {
        if let Ok(root) = vault_root.canonicalize() {
            return canonical.starts_with(root);
        }
    }
    false
}

#[tauri::command]
pub fn get_vault_notes() -> Result<Vec<VaultNote>, String> {
    let root = get_vault_root();
    if !root.exists() {
        return Err(format!("Bóveda no encontrada en {}", root.display()));
    }

    let mut notes = Vec::new();
    collect_notes(&root, &root, &mut notes)?;
    
    // Ordenar notas alfabéticamente por Hub y luego por Título
    notes.sort_by(|a, b| {
        a.hub.cmp(&b.hub).then_with(|| a.title.cmp(&b.title))
    });

    Ok(notes)
}

fn collect_notes(dir: &Path, root: &Path, notes: &mut Vec<VaultNote>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

        // Omitir carpetas ocultas, papelera y respaldos de skills
        if file_name.starts_with('.') || file_name == ".trash" || file_name == "Skills" {
            continue;
        }

        if path.is_dir() {
            collect_notes(&path, root, notes)?;
        } else if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("md") {
            let relative = path.strip_prefix(root).unwrap_or(&path);
            let relative_str = relative.to_string_lossy().to_string();
            let hub = resolve_hub(&relative_str);
            let title = path.file_stem().and_then(|s| s.to_str()).unwrap_or("Sin título").to_string();

            let metadata = entry.metadata().ok();
            let size_bytes = metadata.as_ref().map(|m| m.len()).unwrap_or(0);
            let modified_time = metadata
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_secs())
                .unwrap_or(0);

            notes.push(VaultNote {
                path: path.to_string_lossy().to_string(),
                relative_path: relative_str,
                title,
                hub,
                modified_time,
                size_bytes,
            });
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_vault_tasks() -> Result<Vec<VaultTask>, String> {
    let root = get_vault_root();
    if !root.exists() {
        return Err(format!("Bóveda no encontrada en {}", root.display()));
    }

    let mut tasks = Vec::new();
    collect_tasks(&root, &root, &mut tasks)?;

    // Ordenar: primero pendientes, luego completadas
    tasks.sort_by(|a, b| {
        a.completed.cmp(&b.completed).then_with(|| a.hub.cmp(&b.hub))
    });

    Ok(tasks)
}

fn collect_tasks(dir: &Path, root: &Path, tasks: &mut Vec<VaultTask>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");

        if file_name.starts_with('.') || file_name == ".trash" || file_name == "Skills" {
            continue;
        }

        if path.is_dir() {
            collect_tasks(&path, root, tasks)?;
        } else if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("md") {
            let relative = path.strip_prefix(root).unwrap_or(&path);
            let relative_str = relative.to_string_lossy().to_string();
            let hub = resolve_hub(&relative_str);
            let file_name_str = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();

            if let Ok(file) = File::open(&path) {
                let reader = BufReader::new(file);
                for (idx, line_res) in reader.lines().enumerate() {
                    if let Ok(line) = line_res {
                        let trimmed = line.trim();
                        let is_pending = trimmed.starts_with("- [ ]");
                        let is_completed = trimmed.starts_with("- [x]") || trimmed.starts_with("- [X]");

                        if is_pending || is_completed {
                            let text = if is_pending {
                                trimmed.trim_start_matches("- [ ]").trim()
                            } else {
                                trimmed.trim_start_matches("- [x]").trim_start_matches("- [X]").trim()
                            };

                            if !text.is_empty() {
                                let line_number = idx + 1;
                                let id = format!("{}:{}", relative_str, line_number);
                                tasks.push(VaultTask {
                                    id,
                                    file_path: path.to_string_lossy().to_string(),
                                    relative_path: relative_str.clone(),
                                    file_name: file_name_str.clone(),
                                    hub: hub.clone(),
                                    line_number,
                                    text: text.to_string(),
                                    completed: is_completed,
                                });
                            }
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub fn toggle_vault_task(file_path: String, line_number: usize, completed: bool) -> Result<(), String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Archivo no encontrado: {}", file_path));
    }
    if !is_vault_path_safe(path) {
        return Err("Ruta de archivo fuera de los límites de la Bóveda".into());
    }

    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let lines: Vec<&str> = content.lines().collect();

    if line_number == 0 || line_number > lines.len() {
        return Err(format!("Número de línea inválido: {}", line_number));
    }

    let target_idx = line_number - 1;
    let old_line = lines[target_idx];

    let new_line = if completed {
        // Pasar a completada: cambiar "- [ ]" por "- [x]"
        if let Some(pos) = old_line.find("- [ ]") {
            format!("{}- [x]{}", &old_line[..pos], &old_line[pos + 5..])
        } else {
            old_line.to_string()
        }
    } else {
        // Pasar a pendiente: cambiar "- [x]" o "- [X]" por "- [ ]"
        if let Some(pos) = old_line.find("- [x]") {
            format!("{}- [ ]{}", &old_line[..pos], &old_line[pos + 5..])
        } else if let Some(pos) = old_line.find("- [X]") {
            format!("{}- [ ]{}", &old_line[..pos], &old_line[pos + 5..])
        } else {
            old_line.to_string()
        }
    };

    let mut new_lines: Vec<String> = lines.iter().map(|s| s.to_string()).collect();
    new_lines[target_idx] = new_line;

    let ends_with_newline = content.ends_with('\n');
    let mut final_content = new_lines.join("\n");
    if ends_with_newline {
        final_content.push('\n');
    }

    let mut file = File::create(path).map_err(|e| e.to_string())?;
    file.write_all(final_content.as_bytes()).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn read_vault_note(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("Archivo no encontrado: {}", path));
    }
    if !is_vault_path_safe(p) {
        return Err("Acceso denegado: ruta fuera de la Bóveda".into());
    }
    fs::read_to_string(p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_vault_note(path: String, content: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !is_vault_path_safe(p) {
        return Err("Acceso denegado: ruta fuera de la Bóveda".into());
    }
    fs::write(p, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_vault_stats() -> Result<VaultStats, String> {
    let notes = get_vault_notes()?;
    let tasks = get_vault_tasks()?;

    let total_notes = notes.len();
    let total_tasks = tasks.len();
    let completed_tasks = tasks.iter().filter(|t| t.completed).count();
    let pending_tasks = total_tasks - completed_tasks;

    let mut hubs = std::collections::HashSet::new();
    for note in &notes {
        hubs.insert(note.hub.clone());
    }

    Ok(VaultStats {
        total_notes,
        total_tasks,
        pending_tasks,
        completed_tasks,
        hubs_count: hubs.len(),
    })
}
