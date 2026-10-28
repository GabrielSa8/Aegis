use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

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
