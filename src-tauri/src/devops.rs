use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

fn expand_tilde(p: &str) -> String {
    if p.starts_with("~/") || p == "~" {
        if let Ok(home) = std::env::var("HOME") {
            return p.replacen('~', &home, 1);
        }
    }
    p.to_string()
}

fn is_safe_repo_deletion_path(p: &Path) -> Result<PathBuf, String> {
    if !p.exists() {
        return Err("La ruta no existe en disco".into());
    }
    let canonical = p.canonicalize().map_err(|e| format!("Error resolviendo ruta: {}", e))?;

    let home = std::env::var("HOME").unwrap_or_default();
    let home_path = PathBuf::from(&home);

    if canonical == PathBuf::from("/")
        || canonical == home_path
        || canonical == home_path.join("Proyects")
        || canonical == home_path.join("projects")
        || canonical == home_path.join("Documentos")
        || canonical == home_path.join("Downloads")
        || canonical == home_path.join("Desktop")
    {
        return Err("Operación cancelada: No se permite eliminar un directorio base del sistema".into());
    }

    if !canonical.join(".git").exists() {
        return Err("Operación cancelada: La carpeta no contiene un repositorio Git (.git no encontrado)".into());
    }

    let canon_str = canonical.to_string_lossy().to_lowercase();
    if canon_str.contains("tadu") || canon_str.contains("tadú") {
        return Err("Operación prohibida: TADÚ es un repositorio protegido y no puede ser destruido".into());
    }

    Ok(canonical)
}

fn get_skills_dir() -> PathBuf {
    if let Ok(home) = std::env::var("HOME") {
        PathBuf::from(home).join(".agents/skills")
    } else {
        PathBuf::from(".agents/skills")
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GitRepoStatus {
    pub id: String,
    pub name: String,
    pub path: String,
    pub role: String,
    pub is_installed: bool,
    pub is_git_repo: bool,
    pub branch: String,
    pub is_clean: bool,
    pub changed_files_count: usize,
    pub untracked_files_count: usize,
    pub ahead: usize,
    pub behind: usize,
    pub last_commit_hash: String,
    pub last_commit_msg: String,
    pub last_commit_time: String,
    pub warning: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SkillInfo {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: String,
    pub version: String,
    pub file_count: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GitHubWorkflowRun {
    pub id: u64,
    pub name: String,
    pub workflow_name: String,
    pub status: String,
    pub conclusion: Option<String>,
    pub branch: String,
    pub created_at: String,
    pub url: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GitHubPullRequest {
    pub number: u64,
    pub title: String,
    pub state: String,
    pub head_ref: String,
    pub base_ref: String,
    pub author: String,
    pub is_draft: bool,
    pub url: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GitHubRepoRemoteMeta {
    pub name: String,
    pub owner: String,
    pub is_private: bool,
    pub default_branch: String,
    pub description: Option<String>,
    pub url: String,
    pub commit_status_state: Option<String>,
    pub commit_status_context: Option<String>,
    pub commit_status_desc: Option<String>,
    pub commit_status_target_url: Option<String>,
}

fn inspect_git_repo(id: &str, name: &str, path_str: &str, role: &str, warning: Option<&str>) -> GitRepoStatus {
    let p = Path::new(path_str);
    if !p.exists() {
        return GitRepoStatus {
            id: id.to_string(),
            name: name.to_string(),
            path: path_str.to_string(),
            role: role.to_string(),
            is_installed: false,
            is_git_repo: false,
            branch: "No instalado".to_string(),
            is_clean: true,
            changed_files_count: 0,
            untracked_files_count: 0,
            ahead: 0,
            behind: 0,
            last_commit_hash: "".to_string(),
            last_commit_msg: "".to_string(),
            last_commit_time: "".to_string(),
            warning: warning.map(|s| s.to_string()),
        };
    }

    let git_dir = p.join(".git");
    if !git_dir.exists() {
        return GitRepoStatus {
            id: id.to_string(),
            name: name.to_string(),
            path: path_str.to_string(),
            role: role.to_string(),
            is_installed: true,
            is_git_repo: false,
            branch: "Sin Git".to_string(),
            is_clean: true,
            changed_files_count: 0,
            untracked_files_count: 0,
            ahead: 0,
            behind: 0,
            last_commit_hash: "".to_string(),
            last_commit_msg: "".to_string(),
            last_commit_time: "".to_string(),
            warning: warning.map(|s| s.to_string()),
        };
    }

    // Branch
    let branch_output = Command::new("git")
        .args(["branch", "--show-current"])
        .current_dir(p)
        .output()
        .ok();
    let branch = branch_output
        .as_ref()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "detached".to_string());

    // Status (changed & untracked files)
    let status_output = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(p)
        .output()
        .ok();
    let mut changed_count = 0;
    let mut untracked_count = 0;

    if let Some(o) = status_output {
        let stdout = String::from_utf8_lossy(&o.stdout);
        for line in stdout.lines() {
            let trimmed = line.trim_start();
            if trimmed.starts_with("??") {
                untracked_count += 1;
            } else if !trimmed.is_empty() {
                changed_count += 1;
            }
        }
    }
    let is_clean = changed_count == 0 && untracked_count == 0;

    // Ahead / Behind
    let mut ahead = 0;
    let mut behind = 0;
    if let Ok(o) = Command::new("git")
        .args(["rev-list", "--left-right", "--count", "HEAD...@{u}"])
        .current_dir(p)
        .output()
    {
        if o.status.success() {
            let stdout = String::from_utf8_lossy(&o.stdout);
            let parts: Vec<&str> = stdout.split_whitespace().collect();
            if parts.len() >= 2 {
                ahead = parts[0].parse().unwrap_or(0);
                behind = parts[1].parse().unwrap_or(0);
            }
        }
    }

    // Last commit (hash, subject, time)
    let log_output = Command::new("git")
        .args(["log", "-1", "--format=%h|%s|%cr"])
        .current_dir(p)
        .output()
        .ok();
    let (last_commit_hash, last_commit_msg, last_commit_time) = if let Some(o) = log_output {
        let stdout = String::from_utf8_lossy(&o.stdout);
        let parts: Vec<&str> = stdout.trim().split('|').collect();
        if parts.len() >= 3 {
            (parts[0].to_string(), parts[1].to_string(), parts[2].to_string())
        } else {
            ("".to_string(), "".to_string(), "".to_string())
        }
    } else {
        ("".to_string(), "".to_string(), "".to_string())
    };

    GitRepoStatus {
        id: id.to_string(),
        name: name.to_string(),
        path: path_str.to_string(),
        role: role.to_string(),
        is_installed: true,
        is_git_repo: true,
        branch,
        is_clean,
        changed_files_count: changed_count,
        untracked_files_count: untracked_count,
        ahead,
        behind,
        last_commit_hash,
        last_commit_msg,
        last_commit_time,
        warning: warning.map(|s| s.to_string()),
    }
}

#[tauri::command]
pub fn get_git_fleet_status() -> Result<Vec<GitRepoStatus>, String> {
    let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let mut repos = Vec::new();
    for r in cfg.git_repos {
        repos.push(inspect_git_repo(
            &r.id,
            &r.name,
            &r.path,
            &r.role,
            r.warning.as_deref(),
        ));
    }
    Ok(repos)
}

fn parse_skill_frontmatter(content: &str) -> (String, String, Option<String>) {
    let mut name = String::new();
    let mut description = String::new();
    let mut version = None;

    if content.starts_with("---") {
        let parts: Vec<&str> = content.splitn(3, "---").collect();
        if parts.len() >= 3 {
            let frontmatter = parts[1];
            let lines: Vec<&str> = frontmatter.lines().collect();
            let mut i = 0;
            while i < lines.len() {
                let line = lines[i];
                let trimmed = line.trim();

                if let Some(rest) = trimmed.strip_prefix("name:") {
                    name = rest.trim().trim_matches('\'').trim_matches('"').to_string();
                } else if let Some(rest) = trimmed.strip_prefix("version:") {
                    version = Some(rest.trim().trim_matches('\'').trim_matches('"').to_string());
                } else if let Some(rest) = trimmed.strip_prefix("description:") {
                    let r = rest.trim();
                    if r == ">" || r == ">-" || r == "|" || r == "|-" || r.is_empty() {
                        let mut desc_lines = Vec::new();
                        i += 1;
                        while i < lines.len() {
                            let next_line = lines[i];
                            if next_line.starts_with("  ") || next_line.starts_with('\t') {
                                desc_lines.push(next_line.trim());
                                i += 1;
                            } else {
                                i -= 1;
                                break;
                            }
                        }
                        description = desc_lines.join(" ");
                    } else {
                        description = r.trim_matches('\'').trim_matches('"').to_string();
                    }
                }
                i += 1;
            }
        }
    }

    (name, description, version)
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GitCommitSummary {
    pub hash: String,
    pub author: String,
    pub date: String,
    pub message: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GitFileStatus {
    pub status: String,
    pub path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GitRepoDetails {
    pub repo_path: String,
    pub branch: String,
    pub branches: Vec<String>,
    pub status_files: Vec<GitFileStatus>,
    pub diff_text: String,
    pub recent_commits: Vec<GitCommitSummary>,
}

#[tauri::command]
pub fn get_git_repo_details(path: String) -> Result<GitRepoDetails, String> {
    let p = Path::new(&path);
    if !p.exists() || !p.join(".git").exists() {
        return Err("Ruta no es un repositorio Git válido".into());
    }

    // Branch actual
    let branch = Command::new("git")
        .args(["branch", "--show-current"])
        .current_dir(p)
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "HEAD".to_string());

    // Lista de ramas locales
    let branches_output = Command::new("git")
        .args(["branch", "--format=%(refname:short)"])
        .current_dir(p)
        .output()
        .ok();
    let mut branches = Vec::new();
    if let Some(o) = branches_output {
        for line in String::from_utf8_lossy(&o.stdout).lines() {
            let b = line.trim();
            if !b.is_empty() {
                branches.push(b.to_string());
            }
        }
    }

    // Archivos modificados (git status -s)
    let status_output = Command::new("git")
        .args(["status", "-s"])
        .current_dir(p)
        .output()
        .ok();
    let mut status_files = Vec::new();
    if let Some(o) = status_output {
        for line in String::from_utf8_lossy(&o.stdout).lines() {
            if line.len() >= 3 {
                let code = line[..2].trim().to_string();
                let fpath = line[3..].trim().to_string();
                status_files.push(GitFileStatus { status: code, path: fpath });
            }
        }
    }

    // Diff en vivo (git diff HEAD)
    let diff_output = Command::new("git")
        .args(["diff", "HEAD"])
        .current_dir(p)
        .output()
        .ok();
    let diff_text = diff_output
        .map(|o| {
            let s = String::from_utf8_lossy(&o.stdout);
            if s.len() > 300_000 {
                format!("{}\n\n... [Diff truncado por tamaño >300KB] ...", &s[..300_000])
            } else {
                s.to_string()
            }
        })
        .unwrap_or_default();

    // Historial reciente de commits (git log -10)
    let log_output = Command::new("git")
        .args(["log", "-10", "--format=%h|%an|%cr|%s"])
        .current_dir(p)
        .output()
        .ok();
    let mut recent_commits = Vec::new();
    if let Some(o) = log_output {
        for line in String::from_utf8_lossy(&o.stdout).lines() {
            let parts: Vec<&str> = line.trim().split('|').collect();
            if parts.len() >= 4 {
                recent_commits.push(GitCommitSummary {
                    hash: parts[0].to_string(),
                    author: parts[1].to_string(),
                    date: parts[2].to_string(),
                    message: parts[3..].join("|"),
                });
            }
        }
    }

    Ok(GitRepoDetails {
        repo_path: path,
        branch,
        branches,
        status_files,
        diff_text,
        recent_commits,
    })
}

#[tauri::command]
pub fn git_fetch_repo(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() || !p.join(".git").exists() {
        return Err("Ruta no es un repositorio Git válido".into());
    }

    let out = Command::new("git")
        .args(["fetch"])
        .current_dir(p)
        .output()
        .map_err(|e| format!("Error ejecutando git fetch: {}", e))?;

    if out.status.success() {
        let stderr = String::from_utf8_lossy(&out.stderr);
        if stderr.trim().is_empty() {
            Ok("Fetch completado: sin novedades remotas".to_string())
        } else {
            Ok(stderr.trim().to_string())
        }
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

#[tauri::command]
pub fn git_pull_repo(path: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() || !p.join(".git").exists() {
        return Err("Ruta no es un repositorio Git válido".into());
    }

    let out = Command::new("git")
        .args(["pull"])
        .current_dir(p)
        .output()
        .map_err(|e| format!("Error ejecutando git pull: {}", e))?;

    if out.status.success() {
        let stdout = String::from_utf8_lossy(&out.stdout);
        Ok(stdout.trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

#[tauri::command]
pub fn git_checkout_branch(path: String, branch: String) -> Result<String, String> {
    let p = Path::new(&path);
    if !p.exists() || !p.join(".git").exists() {
        return Err("Ruta no es un repositorio Git válido".into());
    }

    let clean_branch = branch.trim();
    if clean_branch.starts_with('-') || clean_branch.contains(' ') || clean_branch.is_empty() {
        return Err("Nombre de rama no válido".into());
    }

    let out = Command::new("git")
        .args(["checkout", clean_branch])
        .current_dir(p)
        .output()
        .map_err(|e| format!("Error cambiando de rama: {}", e))?;

    if out.status.success() {
        let msg = String::from_utf8_lossy(&out.stderr);
        Ok(if msg.trim().is_empty() {
            format!("Cambiado a rama {}", clean_branch)
        } else {
            msg.trim().to_string()
        })
    } else {
        Err(String::from_utf8_lossy(&out.stderr).to_string())
    }
}

#[tauri::command]
pub fn open_repo_in_editor(path: String, editor: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Ruta no existe".into());
    }

    match editor.as_str() {
        "cursor" => {
            Command::new("cursor")
                .arg(&path)
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error abriendo Cursor: {}", e))?;
        }
        "code" => {
            Command::new("code")
                .arg(&path)
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error abriendo VS Code: {}", e))?;
        }
        "terminal" => {
            if Path::new("/usr/bin/ptyxis").exists() {
                Command::new("ptyxis")
                    .args(["--new-window", &format!("--working-directory={}", path)])
                    .current_dir(p)
                    .spawn()
                    .map_err(|e| format!("Error abriendo terminal Ptyxis: {}", e))?;
            } else if Path::new("/usr/bin/kgx").exists() {
                Command::new("kgx")
                    .arg(&format!("--working-directory={}", path))
                    .current_dir(p)
                    .spawn()
                    .map_err(|e| format!("Error abriendo terminal KGX: {}", e))?;
            } else if Path::new("/usr/bin/gnome-terminal").exists() {
                let arg = format!("--working-directory={}", path);
                Command::new("gnome-terminal")
                    .arg(arg)
                    .current_dir(p)
                    .spawn()
                    .map_err(|e| format!("Error abriendo GNOME Terminal: {}", e))?;
            } else {
                return Err("No se encontró terminal compatible".into());
            }
        }
        _ => return Err(format!("Editor desconocido: {}", editor)),
    }

    Ok(())
}

#[tauri::command]
pub fn get_skills_catalog() -> Result<Vec<SkillInfo>, String> {
    let skills_dir = get_skills_dir();
    if !skills_dir.exists() {
        return Ok(Vec::new());
    }

    let mut skills = Vec::new();
    let entries = fs::read_dir(&skills_dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            let skill_id = path.file_name().and_then(|n| n.to_str()).unwrap_or("").to_string();
            let skill_md_path = path.join("SKILL.md");
            if skill_md_path.exists() {
                if let Ok(content) = fs::read_to_string(&skill_md_path) {
                    let (name, desc, ver) = parse_skill_frontmatter(&content);
                    let final_name = if name.is_empty() { skill_id.clone() } else { name };
                    let file_count = fs::read_dir(&path).map(|r| r.count()).unwrap_or(1);

                    skills.push(SkillInfo {
                        id: skill_id,
                        name: final_name,
                        path: path.to_string_lossy().to_string(),
                        description: desc,
                        version: ver.unwrap_or_else(|| "1.0".to_string()),
                        file_count,
                    });
                }
            }
        }
    }

    skills.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(skills)
}

#[tauri::command]
pub fn read_skill_markdown(skill_id: String) -> Result<String, String> {
    // Sanitize skill_id against path traversal
    if skill_id.contains('/') || skill_id.contains('\\') || skill_id.contains("..") {
        return Err("Identificador de habilidad inválido".into());
    }

    let p = get_skills_dir().join(&skill_id).join("SKILL.md");
    if !p.exists() {
        return Err(format!("Manual SKILL.md no encontrado para {}", skill_id));
    }

    fs::read_to_string(p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_skill_markdown(skill_id: String, content: String) -> Result<(), String> {
    if skill_id.contains('/') || skill_id.contains('\\') || skill_id.contains("..") {
        return Err("Identificador de habilidad inválido".into());
    }

    let p = get_skills_dir().join(&skill_id).join("SKILL.md");
    if !p.exists() {
        return Err(format!("Manual SKILL.md no encontrado para {}", skill_id));
    }

    fs::write(p, content).map_err(|e| format!("Error guardando SKILL.md: {}", e))
}

#[tauri::command]
pub fn delete_agent_skill(skill_id: String) -> Result<(), String> {
    if skill_id.contains('/') || skill_id.contains('\\') || skill_id.contains("..") || skill_id.trim().is_empty() {
        return Err("Identificador de habilidad inválido".into());
    }

    let skills_dir = get_skills_dir();
    let p = skills_dir.join(&skill_id);
    if !p.exists() || !p.is_dir() {
        return Err(format!("Directorio de habilidad '{}' no encontrado", skill_id));
    }

    // Doble verificación: debe contener SKILL.md
    if !p.join("SKILL.md").exists() {
        return Err("La carpeta no contiene un archivo SKILL.md válido".into());
    }

    fs::remove_dir_all(&p).map_err(|e| format!("Error eliminando habilidad: {}", e))
}

#[tauri::command]
pub fn install_agent_skill(package_name: String) -> Result<String, String> {
    let clean_pkg = package_name.trim();
    if clean_pkg.is_empty() || clean_pkg.contains(';') || clean_pkg.contains('&') || clean_pkg.contains('|') || clean_pkg.contains('>') || clean_pkg.contains('<') {
        return Err("Nombre o repositorio de paquete inválido".into());
    }

    let skills_dir = get_skills_dir();
    if !skills_dir.exists() {
        let _ = fs::create_dir_all(&skills_dir);
    }

    let output = Command::new("npx")
        .args(["-y", "skills", "add", clean_pkg, "-y"])
        .current_dir(&skills_dir)
        .output()
        .map_err(|e| format!("Fallo ejecutando npx skills add: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(if stdout.trim().is_empty() {
            format!("Habilidad '{}' instalada con éxito", clean_pkg)
        } else {
            stdout.trim().to_string()
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let combined = if stderr.trim().is_empty() { stdout } else { stderr };
        Err(format!("Error instalando habilidad: {}", combined.trim()))
    }
}

#[tauri::command]
pub fn get_github_workflow_runs(repo_path: String) -> Result<Vec<GitHubWorkflowRun>, String> {
    let p = Path::new(&repo_path);
    if !p.exists() {
        return Err("Ruta de repositorio no encontrada".into());
    }

    let output = Command::new("gh")
        .args([
            "run", "list",
            "--json", "databaseId,name,workflowName,status,conclusion,headBranch,createdAt,url",
            "--limit", "15"
        ])
        .current_dir(p)
        .output()
        .map_err(|e| format!("Fallo ejecutando gh run list: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error gh: {}", err_msg.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let raw_runs: Vec<serde_json::Value> = serde_json::from_str(&stdout)
        .unwrap_or_default();

    let mut runs = Vec::new();
    for item in raw_runs {
        runs.push(GitHubWorkflowRun {
            id: item.get("databaseId").and_then(|v| v.as_u64()).unwrap_or(0),
            name: item.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            workflow_name: item.get("workflowName").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            status: item.get("status").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
            conclusion: item.get("conclusion").and_then(|v| v.as_str()).map(|s| s.to_string()),
            branch: item.get("headBranch").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            created_at: item.get("createdAt").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            url: item.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        });
    }

    Ok(runs)
}

#[tauri::command]
pub fn get_github_pull_requests(repo_path: String) -> Result<Vec<GitHubPullRequest>, String> {
    let p = Path::new(&repo_path);
    if !p.exists() {
        return Err("Ruta de repositorio no encontrada".into());
    }

    let output = Command::new("gh")
        .args([
            "pr", "list",
            "--json", "number,title,state,headRefName,baseRefName,author,isDraft,url",
            "--limit", "15"
        ])
        .current_dir(p)
        .output()
        .map_err(|e| format!("Fallo ejecutando gh pr list: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error gh: {}", err_msg.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let raw_prs: Vec<serde_json::Value> = serde_json::from_str(&stdout)
        .unwrap_or_default();

    let mut prs = Vec::new();
    for item in raw_prs {
        let author_login = item.get("author")
            .and_then(|a| a.get("login"))
            .and_then(|v| v.as_str())
            .unwrap_or("desconocido")
            .to_string();

        prs.push(GitHubPullRequest {
            number: item.get("number").and_then(|v| v.as_u64()).unwrap_or(0),
            title: item.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            state: item.get("state").and_then(|v| v.as_str()).unwrap_or("OPEN").to_string(),
            head_ref: item.get("headRefName").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            base_ref: item.get("baseRefName").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            author: author_login,
            is_draft: item.get("isDraft").and_then(|v| v.as_bool()).unwrap_or(false),
            url: item.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        });
    }

    Ok(prs)
}

#[tauri::command]
pub fn get_github_repo_metadata(repo_path: String) -> Result<GitHubRepoRemoteMeta, String> {
    let p = Path::new(&repo_path);
    if !p.exists() {
        return Err("Ruta de repositorio no encontrada".into());
    }

    let output = Command::new("gh")
        .args([
            "repo", "view",
            "--json", "name,owner,isPrivate,defaultBranchRef,description,url"
        ])
        .current_dir(p)
        .output()
        .map_err(|e| format!("Fallo ejecutando gh repo view: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error gh: {}", err_msg.trim()));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let raw: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|e| format!("Fallo parseando repo view: {}", e))?;

    let name = raw.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let owner = raw.get("owner").and_then(|o| o.get("login")).and_then(|v| v.as_str()).unwrap_or("").to_string();
    let is_private = raw.get("isPrivate").and_then(|v| v.as_bool()).unwrap_or(false);
    let default_branch = raw.get("defaultBranchRef").and_then(|b| b.get("name")).and_then(|v| v.as_str()).unwrap_or("main").to_string();
    let description = raw.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
    let url = raw.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string();

    // Intentar obtener el último commit status via API (e.g., Vercel, CI checks)
    let mut commit_status_state = None;
    let mut commit_status_context = None;
    let mut commit_status_desc = None;
    let mut commit_status_target_url = None;

    if let Ok(head_sha_out) = Command::new("git")
        .args(["rev-parse", "HEAD"])
        .current_dir(p)
        .output()
    {
        if head_sha_out.status.success() {
            let sha = String::from_utf8_lossy(&head_sha_out.stdout).trim().to_string();
            if !sha.is_empty() && !name.is_empty() && !owner.is_empty() {
                let status_endpoint = format!("repos/{}/{}/commits/{}/status", owner, name, sha);
                if let Ok(status_out) = Command::new("gh")
                    .args(["api", &status_endpoint])
                    .current_dir(p)
                    .output()
                {
                    if status_out.status.success() {
                        let status_json: serde_json::Value = serde_json::from_str(&String::from_utf8_lossy(&status_out.stdout))
                            .unwrap_or_default();
                        
                        commit_status_state = status_json.get("state").and_then(|v| v.as_str()).map(|s| s.to_string());
                        if let Some(statuses) = status_json.get("statuses").and_then(|v| v.as_array()) {
                            if let Some(first) = statuses.first() {
                                commit_status_context = first.get("context").and_then(|v| v.as_str()).map(|s| s.to_string());
                                commit_status_desc = first.get("description").and_then(|v| v.as_str()).map(|s| s.to_string());
                                commit_status_target_url = first.get("target_url").and_then(|v| v.as_str()).map(|s| s.to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(GitHubRepoRemoteMeta {
        name,
        owner,
        is_private,
        default_branch,
        description,
        url,
        commit_status_state,
        commit_status_context,
        commit_status_desc,
        commit_status_target_url,
    })
}

#[tauri::command]
pub fn trigger_github_workflow(repo_path: String, workflow_file: String) -> Result<String, String> {
    let p = Path::new(&repo_path);
    if !p.exists() {
        return Err("Ruta de repositorio no encontrada".into());
    }

    let output = Command::new("gh")
        .args(["workflow", "run", &workflow_file])
        .current_dir(p)
        .output()
        .map_err(|e| format!("Fallo ejecutando gh workflow run: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
        return Err(format!("Error gh: {}", err_msg.trim()));
    }

    Ok(format!("Workflow {} disparado con éxito", workflow_file))
}

#[tauri::command]
pub fn add_fleet_repo(
    name: String,
    path: String,
    role: String,
    warning: Option<String>,
) -> Result<GitRepoStatus, String> {
    let clean_path = expand_tilde(path.trim());
    let p = Path::new(&clean_path);
    if clean_path.is_empty() {
        return Err("La ruta del repositorio no puede estar vacía".into());
    }
    if !p.exists() {
        return Err(format!("La ruta '{}' no existe en disco", clean_path));
    }
    if !p.join(".git").exists() {
        return Err("La carpeta especificada no contiene un repositorio Git (.git no encontrado)".into());
    }

    let mut cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    if cfg.git_repos.iter().any(|r| r.path == clean_path) {
        return Err("Este repositorio ya se encuentra registrado en la flota".into());
    }

    let id = format!(
        "repo_{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    );
    let clean_name = if name.trim().is_empty() {
        p.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("Repositorio")
            .to_string()
    } else {
        name.trim().to_string()
    };
    let clean_role = if role.trim().is_empty() {
        "Proyecto Local".to_string()
    } else {
        role.trim().to_string()
    };
    let clean_warning = warning.and_then(|w| {
        let trimmed = w.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    });

    cfg.git_repos.push(crate::config::GitRepoConfig {
        id: id.clone(),
        name: clean_name.clone(),
        path: clean_path.clone(),
        role: clean_role.clone(),
        warning: clean_warning.clone(),
    });

    crate::config::save_aegis_config(cfg)?;

    Ok(inspect_git_repo(
        &id,
        &clean_name,
        &clean_path,
        &clean_role,
        clean_warning.as_deref(),
    ))
}

#[tauri::command]
pub fn remove_fleet_repo(id: String) -> Result<(), String> {
    let mut cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let initial_len = cfg.git_repos.len();
    cfg.git_repos.retain(|r| r.id != id);
    if cfg.git_repos.len() == initial_len {
        return Err("Repositorio no encontrado en la configuración".into());
    }
    crate::config::save_aegis_config(cfg)?;
    Ok(())
}

#[tauri::command]
pub fn create_fleet_repo(
    parent_dir: String,
    name: String,
    role: String,
    warning: Option<String>,
    init_commit: bool,
    create_github: bool,
    is_private: bool,
) -> Result<GitRepoStatus, String> {
    let clean_name = name.trim();
    if clean_name.is_empty()
        || clean_name.contains('/')
        || clean_name.contains('\\')
        || clean_name.starts_with('.')
    {
        return Err("Nombre de repositorio inválido (no usar barras ni comenzar con punto)".into());
    }

    let clean_parent = expand_tilde(parent_dir.trim());
    let parent_path = Path::new(&clean_parent);
    if !parent_path.exists() {
        return Err(format!("El directorio padre '{}' no existe", clean_parent));
    }

    let target_path = parent_path.join(clean_name);
    if target_path.exists() {
        if let Ok(entries) = fs::read_dir(&target_path) {
            if entries.count() > 0 {
                return Err(format!(
                    "El directorio de destino '{}' ya existe y contiene archivos",
                    target_path.display()
                ));
            }
        }
    } else {
        fs::create_dir_all(&target_path).map_err(|e| format!("Error creando carpeta: {}", e))?;
    }

    // git init
    let init_out = Command::new("git")
        .args(["init", "-b", "main"])
        .current_dir(&target_path)
        .output()
        .map_err(|e| format!("Error ejecutando git init: {}", e))?;

    if !init_out.status.success() {
        let _ = Command::new("git")
            .arg("init")
            .current_dir(&target_path)
            .output();
        let _ = Command::new("git")
            .args(["checkout", "-B", "main"])
            .current_dir(&target_path)
            .output();
    }

    let clean_role = if role.trim().is_empty() {
        "Proyecto Local".to_string()
    } else {
        role.trim().to_string()
    };

    // Commit inicial si se solicitó
    if init_commit {
        let readme_content = format!(
            "# {}\n\n> {}\n\nRepositorio gestionado bajo Aegis OS.\n",
            clean_name, clean_role
        );
        let _ = fs::write(target_path.join("README.md"), readme_content);
        let _ = Command::new("git")
            .args(["add", "README.md"])
            .current_dir(&target_path)
            .output();
        let _ = Command::new("git")
            .args(["commit", "-m", "feat: initial commit"])
            .current_dir(&target_path)
            .output();
    }

    // GitHub remoto si se solicitó
    let mut gh_warning = None;
    if create_github {
        let privacy_arg = if is_private { "--private" } else { "--public" };
        let gh_out = Command::new("gh")
            .args([
                "repo",
                "create",
                clean_name,
                "--source=.",
                "--remote=origin",
                privacy_arg,
                "--push",
            ])
            .current_dir(&target_path)
            .output();

        match gh_out {
            Ok(output) => {
                if !output.status.success() {
                    let err = String::from_utf8_lossy(&output.stderr);
                    gh_warning = Some(format!("Repo local creado, pero gh falló: {}", err.trim()));
                }
            }
            Err(e) => {
                gh_warning = Some(format!("Repo local creado, pero no se pudo invocar gh: {}", e));
            }
        }
    }

    let target_str = target_path.to_string_lossy().to_string();
    let id = format!(
        "repo_{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0)
    );
    let clean_warning = warning.and_then(|w| {
        let trimmed = w.trim();
        if trimmed.is_empty() {
            None
        } else {
            Some(trimmed.to_string())
        }
    });

    let mut cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    cfg.git_repos.push(crate::config::GitRepoConfig {
        id: id.clone(),
        name: clean_name.to_string(),
        path: target_str.clone(),
        role: clean_role.clone(),
        warning: clean_warning.clone(),
    });
    let _ = crate::config::save_aegis_config(cfg);

    let mut status = inspect_git_repo(
        &id,
        clean_name,
        &target_str,
        &clean_role,
        clean_warning.as_deref(),
    );
    if let Some(gw) = gh_warning {
        status.warning = Some(match status.warning {
            Some(w) => format!("{} | {}", w, gw),
            None => gw,
        });
    }

    Ok(status)
}

#[tauri::command]
pub fn delete_fleet_repo(
    id: String,
    delete_local_disk: bool,
    delete_github_remote: bool,
) -> Result<String, String> {
    let mut cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let repo_opt = cfg.git_repos.iter().find(|r| r.id == id).cloned();
    let repo = match repo_opt {
        Some(r) => r,
        None => return Err("Repositorio no encontrado en la flota".into()),
    };

    let mut messages = Vec::new();

    // 1. Si se solicita borrar remoto de GitHub
    if delete_github_remote {
        let clean_path = expand_tilde(&repo.path);
        let p = Path::new(&clean_path);
        if p.exists() {
            let view_out = Command::new("gh")
                .args(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"])
                .current_dir(p)
                .output();

            if let Ok(out) = view_out {
                if out.status.success() {
                    let repo_slug = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !repo_slug.is_empty() {
                        let del_out = Command::new("gh")
                            .args(["repo", "delete", &repo_slug, "--yes"])
                            .current_dir(p)
                            .output();

                        match del_out {
                            Ok(res) if res.status.success() => {
                                messages.push(format!("Repo remoto '{}' eliminado de GitHub", repo_slug));
                            }
                            Ok(res) => {
                                let err = String::from_utf8_lossy(&res.stderr);
                                messages.push(format!("Aviso GitHub: {}", err.trim()));
                            }
                            Err(e) => {
                                messages.push(format!("Aviso: No se pudo invocar gh repo delete: {}", e));
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Si se solicita borrar carpeta física en disco
    if delete_local_disk {
        let clean_path = expand_tilde(&repo.path);
        let safe_path = is_safe_repo_deletion_path(Path::new(&clean_path))?;
        fs::remove_dir_all(&safe_path).map_err(|e| format!("Error eliminando carpeta local: {}", e))?;
        messages.push("Archivos locales eliminados de disco".to_string());
    }

    // 3. Desvincular de config de Aegis
    cfg.git_repos.retain(|r| r.id != id);
    crate::config::save_aegis_config(cfg)?;
    messages.push(format!("'{}' desvinculado de la flota", repo.name));

    Ok(messages.join(". "))
}
