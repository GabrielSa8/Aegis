use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultSearchResult {
    pub path: String,
    pub relative_path: String,
    pub title: String,
    pub hub: String,
    pub matches: Vec<MatchSnippet>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MatchSnippet {
    pub line_number: usize,
    pub line_text: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultOutgoingLink {
    pub target: String,
    pub target_title: String,
    pub target_path: Option<String>,
    pub target_hub: Option<String>,
    pub exists: bool,
    pub occurrences: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultIncomingBacklink {
    pub source_title: String,
    pub source_path: String,
    pub source_hub: String,
    pub line_number: usize,
    pub snippet: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultGraphNode {
    pub id: String,
    pub label: String,
    pub hub: String,
    pub degree: u8,
    pub path: Option<String>,
    pub links_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultGraphEdge {
    pub source: String,
    pub target: String,
    pub direction: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultKnowledgeNetwork {
    pub current_title: String,
    pub current_hub: String,
    pub outgoing: Vec<VaultOutgoingLink>,
    pub incoming: Vec<VaultIncomingBacklink>,
    pub nodes: Vec<VaultGraphNode>,
    pub edges: Vec<VaultGraphEdge>,
}

fn resolve_hub(relative_path: &str) -> String {
    let parts: Vec<&str> = relative_path.split('/').collect();
    if parts.len() > 1 {
        return parts[0].to_string();
    }
    "General".to_string()
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

#[tauri::command]
pub fn search_vault_content(query: String, hub_filter: Option<String>) -> Result<Vec<VaultSearchResult>, String> {
    let clean_query = query.trim().to_lowercase();
    if clean_query.is_empty() {
        return Ok(Vec::new());
    }

    let root = get_vault_root();
    if !root.exists() {
        return Err(format!("Bóveda no encontrada en {}", root.display()));
    }

    let notes = get_vault_notes()?;
    let mut results = Vec::new();

    for note in notes {
        if let Some(ref hf) = hub_filter {
            let hf_clean = hf.trim();
            if !hf_clean.is_empty() && hf_clean != "Todos" && note.hub != *hf_clean {
                continue;
            }
        }

        let p = Path::new(&note.path);
        if let Ok(file) = File::open(p) {
            let reader = BufReader::new(file);
            let mut matches = Vec::new();

            for (idx, line_res) in reader.lines().enumerate() {
                if let Ok(line) = line_res {
                    if line.to_lowercase().contains(&clean_query) {
                        let snippet = line.trim().chars().take(220).collect::<String>();
                        matches.push(MatchSnippet {
                            line_number: idx + 1,
                            line_text: snippet,
                        });
                        if matches.len() >= 4 {
                            break;
                        }
                    }
                }
            }

            if !matches.is_empty() {
                results.push(VaultSearchResult {
                    path: note.path,
                    relative_path: note.relative_path,
                    title: note.title,
                    hub: note.hub,
                    matches,
                });
            }
        }

        if results.len() >= 50 {
            break;
        }
    }

    Ok(results)
}

#[tauri::command]
pub fn create_vault_note(relative_path: String, content: Option<String>) -> Result<VaultNote, String> {
    let root = get_vault_root();
    let mut clean_rel = relative_path.trim().to_string();
    if !clean_rel.ends_with(".md") {
        clean_rel.push_str(".md");
    }
    let target = root.join(&clean_rel);

    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let initial = content.unwrap_or_else(|| {
        let title = target.file_stem().and_then(|s| s.to_str()).unwrap_or("Nota");
        format!(
            "---\ntags:\n  - nota\ntipo: Nota\n---\n\n# {}\n\n",
            title
        )
    });

    fs::write(&target, initial.as_bytes()).map_err(|e| e.to_string())?;

    let hub = resolve_hub(&clean_rel);
    let title = target.file_stem().and_then(|s| s.to_str()).unwrap_or("Sin título").to_string();

    Ok(VaultNote {
        path: target.to_string_lossy().to_string(),
        relative_path: clean_rel,
        title,
        hub,
        modified_time: std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0),
        size_bytes: initial.len() as u64,
    })
}

#[tauri::command]
pub fn create_vault_folder(relative_path: String) -> Result<(), String> {
    let root = get_vault_root();
    let target = root.join(relative_path.trim());
    fs::create_dir_all(&target).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_vault_note(path: String) -> Result<(), String> {
    delete_vault_item(path)
}

#[tauri::command]
pub fn delete_vault_item(path: String) -> Result<(), String> {
    let root = get_vault_root();
    let root_canon = root.canonicalize().map_err(|e| format!("Error en raíz de Bóveda: {}", e))?;

    let p = Path::new(&path);
    let target = if p.is_absolute() {
        p.to_path_buf()
    } else {
        root.join(p)
    };

    if !target.exists() {
        return Ok(());
    }

    let canon = target.canonicalize().map_err(|e| format!("Error resolviendo ruta: {}", e))?;
    if !canon.starts_with(&root_canon) {
        return Err("Acceso denegado: ruta fuera de la Bóveda".into());
    }

    if canon == root_canon {
        return Err("Operación denegada: no se puede eliminar la raíz de la Bóveda".into());
    }

    if canon.is_dir() {
        fs::remove_dir_all(&canon).map_err(|e| format!("Error al eliminar carpeta: {}", e))?;
    } else {
        fs::remove_file(&canon).map_err(|e| format!("Error al eliminar archivo: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_vault_folders() -> Result<Vec<String>, String> {
    let root = get_vault_root();
    if !root.exists() {
        return Err(format!("Bóveda no encontrada en {}", root.display()));
    }
    let mut folders = Vec::new();
    collect_vault_folders(&root, &root, &mut folders)?;
    folders.sort();
    Ok(folders)
}

fn collect_vault_folders(dir: &Path, root: &Path, folders: &mut Vec<String>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        let file_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if file_name.starts_with('.') || file_name == ".trash" || file_name == "Skills" {
            continue;
        }
        if path.is_dir() {
            if let Ok(relative) = path.strip_prefix(root) {
                let rel_str = relative.to_string_lossy().to_string();
                if !rel_str.is_empty() {
                    folders.push(rel_str);
                }
            }
            collect_vault_folders(&path, root, folders)?;
        }
    }
    Ok(())
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MoveVaultItemResult {
    pub success: bool,
    pub is_file: bool,
    pub old_path: String,
    pub new_path: String,
    pub new_relative_path: String,
}

#[tauri::command]
pub fn move_vault_item(source_path: String, target_folder_relative: String) -> Result<MoveVaultItemResult, String> {
    let root = get_vault_root();
    if !root.exists() {
        return Err(format!("Bóveda no encontrada en {}", root.display()));
    }

    let root_canon = root.canonicalize().map_err(|e| format!("Error en raíz de Bóveda: {}", e))?;

    let src = Path::new(&source_path);
    let src_path = if src.is_absolute() {
        src.to_path_buf()
    } else {
        root.join(src)
    };

    if !src_path.exists() {
        return Err(format!("Elemento origen no existe: {}", src_path.display()));
    }

    let src_canon = src_path.canonicalize().map_err(|e| format!("Error en ruta origen: {}", e))?;
    if !src_canon.starts_with(&root_canon) {
        return Err("Acceso denegado: ruta fuera de la Bóveda".into());
    }

    let is_file = src_canon.is_file();

    let target_clean = target_folder_relative.trim().trim_matches('/');
    let dest_dir = if target_clean.is_empty() || target_clean == "root" {
        root_canon.clone()
    } else {
        root_canon.join(target_clean)
    };

    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| format!("Error creando directorio destino: {}", e))?;
    }

    let dest_dir_canon = dest_dir.canonicalize().map_err(|e| format!("Error en directorio destino: {}", e))?;
    if !dest_dir_canon.starts_with(&root_canon) {
        return Err("Acceso denegado: destino fuera de la Bóveda".into());
    }

    // Prevenir ciclo: mover una carpeta dentro de sí misma o subdirectorios
    if !is_file && dest_dir_canon.starts_with(&src_canon) {
        return Err("Operación inválida: no se puede mover una carpeta dentro de sí misma o de sus subdirectorios".into());
    }

    let file_name = src_canon.file_name().ok_or("Nombre de archivo o carpeta inválido")?;
    let dest_item_path = dest_dir_canon.join(file_name);

    if dest_item_path == src_canon {
        let rel_dest = dest_item_path.strip_prefix(&root_canon).unwrap_or(&dest_item_path);
        return Ok(MoveVaultItemResult {
            success: true,
            is_file,
            old_path: src_canon.to_string_lossy().to_string(),
            new_path: dest_item_path.to_string_lossy().to_string(),
            new_relative_path: rel_dest.to_string_lossy().to_string(),
        });
    }

    if dest_item_path.exists() {
        return Err(format!("Ya existe un elemento llamado '{}' en el destino", file_name.to_string_lossy()));
    }

    fs::rename(&src_canon, &dest_item_path).map_err(|e| format!("Error al mover archivo/carpeta: {}", e))?;

    let rel_dest = dest_item_path.strip_prefix(&root_canon).unwrap_or(&dest_item_path);
    Ok(MoveVaultItemResult {
        success: true,
        is_file,
        old_path: src_canon.to_string_lossy().to_string(),
        new_path: dest_item_path.to_string_lossy().to_string(),
        new_relative_path: rel_dest.to_string_lossy().to_string(),
    })
}

#[tauri::command]
pub fn rename_vault_item(current_path: String, new_name: String) -> Result<MoveVaultItemResult, String> {
    let root = get_vault_root();
    if !root.exists() {
        return Err(format!("Bóveda no encontrada en {}", root.display()));
    }

    let root_canon = root.canonicalize().map_err(|e| format!("Error en raíz de Bóveda: {}", e))?;

    let src = Path::new(&current_path);
    let src_path = if src.is_absolute() {
        src.to_path_buf()
    } else {
        root.join(src)
    };

    if !src_path.exists() {
        return Err(format!("El elemento a renombrar no existe: {}", src_path.display()));
    }

    let src_canon = src_path.canonicalize().map_err(|e| format!("Error en ruta origen: {}", e))?;
    if !src_canon.starts_with(&root_canon) {
        return Err("Acceso denegado: ruta fuera de la Bóveda".into());
    }

    let parent_dir = src_canon.parent().ok_or("No se puede renombrar el elemento raíz")?;
    if !parent_dir.starts_with(&root_canon) && parent_dir != root_canon {
        return Err("Acceso denegado: directorio contenedor fuera de la Bóveda".into());
    }

    let is_file = src_canon.is_file();

    let clean_name = new_name.trim();
    if clean_name.is_empty() {
        return Err("El nuevo nombre no puede estar vacío".into());
    }
    if clean_name.contains('/') || clean_name.contains('\\') {
        return Err("El nombre no puede contener barras diagonales".into());
    }

    let final_name = if is_file {
        if clean_name.ends_with(".md") {
            clean_name.to_string()
        } else {
            format!("{}.md", clean_name)
        }
    } else {
        clean_name.to_string()
    };

    let dest_path = parent_dir.join(&final_name);

    if dest_path == src_canon {
        let rel_dest = dest_path.strip_prefix(&root_canon).unwrap_or(&dest_path);
        return Ok(MoveVaultItemResult {
            success: true,
            is_file,
            old_path: src_canon.to_string_lossy().to_string(),
            new_path: dest_path.to_string_lossy().to_string(),
            new_relative_path: rel_dest.to_string_lossy().to_string(),
        });
    }

    if dest_path.exists() {
        return Err(format!("Ya existe un archivo o carpeta llamado '{}' en esta ubicación", final_name));
    }

    fs::rename(&src_canon, &dest_path).map_err(|e| format!("Error al renombrar: {}", e))?;

    let rel_dest = dest_path.strip_prefix(&root_canon).unwrap_or(&dest_path);
    Ok(MoveVaultItemResult {
        success: true,
        is_file,
        old_path: src_canon.to_string_lossy().to_string(),
        new_path: dest_path.to_string_lossy().to_string(),
        new_relative_path: rel_dest.to_string_lossy().to_string(),
    })
}

fn extract_wikilinks_from_str(line: &str) -> Vec<String> {
    let mut targets = Vec::new();
    let mut remainder = line;
    while let Some(start) = remainder.find("[[") {
        let after = &remainder[start + 2..];
        if let Some(end) = after.find("]]") {
            let inner = &after[..end];
            let clean_target = inner
                .split('|')
                .next()
                .unwrap_or(inner)
                .split('#')
                .next()
                .unwrap_or(inner)
                .trim();
            if !clean_target.is_empty() {
                targets.push(clean_target.to_string());
            }
            remainder = &after[end + 2..];
        } else {
            break;
        }
    }
    targets
}

fn target_matches_note(target: &str, note: &VaultNote) -> bool {
    let target_clean = target.trim();
    if target_clean.eq_ignore_ascii_case(&note.title) {
        return true;
    }
    let rel_no_ext = note.relative_path.trim_end_matches(".md");
    if target_clean.eq_ignore_ascii_case(rel_no_ext) {
        return true;
    }
    if target_clean.ends_with(&format!("/{}", note.title)) {
        return true;
    }
    false
}

#[tauri::command]
pub fn get_vault_note_network(file_path: String) -> Result<VaultKnowledgeNetwork, String> {
    let target_path = PathBuf::from(&file_path);
    if !target_path.exists() {
        return Err(format!("El archivo no existe: {}", file_path));
    }
    if !is_vault_path_safe(&target_path) {
        return Err("Violación de seguridad: ruta fuera de la bóveda".into());
    }

    let root = get_vault_root();
    let mut all_notes = Vec::new();
    collect_notes(&root, &root, &mut all_notes)?;

    let active_canon = target_path.canonicalize().unwrap_or(target_path.clone());
    let active_note = all_notes
        .iter()
        .find(|n| {
            if let Ok(c) = PathBuf::from(&n.path).canonicalize() {
                c == active_canon
            } else {
                n.path == file_path
            }
        })
        .ok_or_else(|| "Nota activa no encontrada en el índice de la bóveda".to_string())?
        .clone();

    // 1. Extraer enlaces salientes (Outgoing Links) del archivo activo
    let file = File::open(&active_note.path).map_err(|e| format!("Error al abrir archivo: {}", e))?;
    let reader = BufReader::new(file);
    let mut outgoing_counts: HashMap<String, usize> = HashMap::new();

    for line_res in reader.lines() {
        if let Ok(line) = line_res {
            if line.contains("[[") {
                for target in extract_wikilinks_from_str(&line) {
                    *outgoing_counts.entry(target).or_insert(0) += 1;
                }
            }
        }
    }

    let mut direct_connected_titles: HashSet<String> = HashSet::new();
    direct_connected_titles.insert(active_note.title.clone());

    let mut outgoing: Vec<VaultOutgoingLink> = Vec::new();
    for (target, count) in &outgoing_counts {
        let matched_note = all_notes.iter().find(|n| target_matches_note(target, n));
        let (target_title, target_path, target_hub, exists) = match matched_note {
            Some(n) => {
                direct_connected_titles.insert(n.title.clone());
                (n.title.clone(), Some(n.path.clone()), Some(n.hub.clone()), true)
            }
            None => (target.clone(), None, None, false),
        };

        outgoing.push(VaultOutgoingLink {
            target: target.clone(),
            target_title,
            target_path,
            target_hub,
            exists,
            occurrences: *count,
        });
    }
    outgoing.sort_by(|a, b| b.occurrences.cmp(&a.occurrences).then_with(|| a.target_title.cmp(&b.target_title)));

    // 2. Extraer enlaces entrantes (Incoming Backlinks) escaneando el resto de la bóveda
    let mut incoming: Vec<VaultIncomingBacklink> = Vec::new();
    let mut second_degree_map: HashMap<String, HashSet<String>> = HashMap::new();

    for note in &all_notes {
        let is_current = if let Ok(c) = PathBuf::from(&note.path).canonicalize() {
            c == active_canon
        } else {
            note.path == active_note.path
        };
        if is_current {
            continue;
        }

        if let Ok(f) = File::open(&note.path) {
            let r = BufReader::new(f);
            let mut note_links: HashSet<String> = HashSet::new();
            for (line_idx, line_res) in r.lines().enumerate() {
                if let Ok(line) = line_res {
                    if line.contains("[[") {
                        let targets = extract_wikilinks_from_str(&line);
                        let mut line_matched = false;
                        for target in targets {
                            note_links.insert(target.clone());
                            if !line_matched && target_matches_note(&target, &active_note) {
                                line_matched = true;
                                direct_connected_titles.insert(note.title.clone());
                                let snippet = line.trim();
                                let truncated = if snippet.chars().count() > 160 {
                                    format!("{}...", snippet.chars().take(157).collect::<String>())
                                } else {
                                    snippet.to_string()
                                };
                                incoming.push(VaultIncomingBacklink {
                                    source_title: note.title.clone(),
                                    source_path: note.path.clone(),
                                    source_hub: note.hub.clone(),
                                    line_number: line_idx + 1,
                                    snippet: truncated,
                                });
                            }
                        }
                    }
                }
            }
            if !note_links.is_empty() {
                second_degree_map.insert(note.title.clone(), note_links);
            }
        }
    }
    incoming.sort_by(|a, b| a.source_hub.cmp(&b.source_hub).then_with(|| a.source_title.cmp(&b.source_title)));

    // 3. Construir Nodos y Aristas del Micro-Grafo (1° y 2° grado)
    let mut graph_nodes: HashMap<String, VaultGraphNode> = HashMap::new();
    let mut graph_edges_map: HashMap<(String, String), String> = HashMap::new();

    // Nodo Central (Grado 0)
    graph_nodes.insert(
        active_note.title.clone(),
        VaultGraphNode {
            id: active_note.title.clone(),
            label: active_note.title.clone(),
            hub: active_note.hub.clone(),
            degree: 0,
            path: Some(active_note.path.clone()),
            links_count: 0,
        },
    );

    // Nodos de 1° Grado (Salientes)
    for out in &outgoing {
        let node_id = out.target_title.clone();
        graph_nodes.entry(node_id.clone()).or_insert_with(|| VaultGraphNode {
            id: node_id.clone(),
            label: node_id.clone(),
            hub: out.target_hub.clone().unwrap_or_else(|| "Exterior".to_string()),
            degree: 1,
            path: out.target_path.clone(),
            links_count: 0,
        });

        // Arista Active -> Target
        let key = (active_note.title.clone(), node_id.clone());
        graph_edges_map.insert(key, "outgoing".to_string());
    }

    // Nodos de 1° Grado (Entrantes)
    for inc in &incoming {
        let node_id = inc.source_title.clone();
        graph_nodes.entry(node_id.clone()).or_insert_with(|| VaultGraphNode {
            id: node_id.clone(),
            label: node_id.clone(),
            hub: inc.source_hub.clone(),
            degree: 1,
            path: Some(inc.source_path.clone()),
            links_count: 0,
        });

        // Arista Source -> Active
        let outgoing_key = (active_note.title.clone(), node_id.clone());
        let incoming_key = (node_id.clone(), active_note.title.clone());

        if graph_edges_map.contains_key(&outgoing_key) {
            graph_edges_map.insert(outgoing_key, "mutual".to_string());
        } else {
            graph_edges_map.insert(incoming_key, "incoming".to_string());
        }
    }

    // Nodos de 2° Grado (Conexiones de los nodos de 1° grado)
    let mut second_degree_candidates: HashSet<String> = HashSet::new();
    for title in &direct_connected_titles {
        if *title == active_note.title {
            continue;
        }
        if let Some(links) = second_degree_map.get(title) {
            for raw_target in links {
                let resolved_title = all_notes
                    .iter()
                    .find(|n| target_matches_note(raw_target, n))
                    .map(|n| n.title.clone())
                    .unwrap_or_else(|| raw_target.clone());

                if !direct_connected_titles.contains(&resolved_title) && second_degree_candidates.len() < 24 {
                    second_degree_candidates.insert(resolved_title.clone());
                }

                if direct_connected_titles.contains(&resolved_title) || second_degree_candidates.contains(&resolved_title) {
                    let edge_key = (title.clone(), resolved_title.clone());
                    let reverse_key = (resolved_title.clone(), title.clone());
                    if !graph_edges_map.contains_key(&reverse_key) && !graph_edges_map.contains_key(&edge_key) {
                        graph_edges_map.insert(edge_key, "outgoing".to_string());
                    }
                }
            }
        }
    }

    // Registrar nodos de 2° grado resueltos
    for cand in second_degree_candidates {
        let matched = all_notes.iter().find(|n| n.title.eq_ignore_ascii_case(&cand));
        let (hub, path) = match matched {
            Some(n) => (n.hub.clone(), Some(n.path.clone())),
            None => ("Exterior".to_string(), None),
        };

        graph_nodes.entry(cand.clone()).or_insert_with(|| VaultGraphNode {
            id: cand.clone(),
            label: cand.clone(),
            hub,
            degree: 2,
            path,
            links_count: 0,
        });
    }

    // Calcular links_count en cada nodo a partir de las aristas
    for ((s, t), _) in &graph_edges_map {
        if let Some(n) = graph_nodes.get_mut(s) {
            n.links_count += 1;
        }
        if let Some(n) = graph_nodes.get_mut(t) {
            n.links_count += 1;
        }
    }

    let edges: Vec<VaultGraphEdge> = graph_edges_map
        .into_iter()
        .map(|((source, target), direction)| VaultGraphEdge {
            source,
            target,
            direction,
        })
        .collect();

    let mut nodes: Vec<VaultGraphNode> = graph_nodes.into_values().collect();
    nodes.sort_by(|a, b| a.degree.cmp(&b.degree).then_with(|| b.links_count.cmp(&a.links_count)));

    Ok(VaultKnowledgeNetwork {
        current_title: active_note.title,
        current_hub: active_note.hub,
        outgoing,
        incoming,
        nodes,
        edges,
    })
}
