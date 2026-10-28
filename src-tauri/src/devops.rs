use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

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
    let repos = vec![
        inspect_git_repo(
            "tadu",
            "TADÚ Mobility Platform",
            "/home/zabrielsa/Proyects/projects/TADU",
            "Backend Lead (Python 3.12 / SAM)",
            Some("⚠️ git add -A y git clean -fdx PROHIBIDOS (demo local crítica)"),
        ),
        inspect_git_repo(
            "granja",
            "Granja Android",
            "/home/zabrielsa/AndroidStudioProjects/granja",
            "Mobile App (Kotlin / Compose)",
            None,
        ),
        inspect_git_repo(
            "aegis",
            "Aegis Master Cockpit",
            "/home/zabrielsa/Proyects/projects/Aegis",
            "Life OS Core (Tauri v2 / React 19)",
            None,
        ),
        inspect_git_repo(
            "brainia",
            "BrainIA (Obsidian Vault)",
            "/home/zabrielsa/Documentos/Obsidian Vault",
            "Memoria Central (5 Hubs MOC)",
            None,
        ),
        inspect_git_repo(
            "aegisTrack",
            "AegisTrack (Gaming)",
            "/home/zabrielsa/Proyects/projects/AegisTrack",
            "Game Tracking (Tauri / Vite)",
            None,
        ),
        inspect_git_repo(
            "booklet",
            "Booklet V2",
            "/home/zabrielsa/Proyects/projects/Booklet_V2",
            "Desktop Utilities",
            None,
        ),
    ];
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

#[tauri::command]
pub fn get_skills_catalog() -> Result<Vec<SkillInfo>, String> {
    let skills_dir = Path::new("/home/zabrielsa/.agents/skills");
    if !skills_dir.exists() {
        return Ok(Vec::new());
    }

    let mut skills = Vec::new();
    let entries = fs::read_dir(skills_dir).map_err(|e| e.to_string())?;

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

    let p = Path::new("/home/zabrielsa/.agents/skills").join(&skill_id).join("SKILL.md");
    if !p.exists() {
        return Err(format!("Manual SKILL.md no encontrado para {}", skill_id));
    }

    fs::read_to_string(p).map_err(|e| e.to_string())
}
