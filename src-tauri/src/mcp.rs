use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct McpServerItem {
    pub name: String,
    pub transport: String, // "stdio" | "http"
    pub target: String,
    pub enabled: bool,
}

fn resolve_agy_binary() -> String {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let local = Path::new(&home).join(".local/bin/agy");
    if local.exists() {
        return local.to_string_lossy().to_string();
    }
    if Path::new("/usr/local/bin/agy").exists() {
        return "/usr/local/bin/agy".to_string();
    }
    "agy".to_string()
}

/// Parsea la salida de `agy mcp list` en una lista estructurada de servidores MCP.
pub fn parse_mcp_list_output(raw: &str) -> Vec<McpServerItem> {
    let mut items = Vec::new();
    for line in raw.lines() {
        let t = line.trim();
        if t.is_empty()
            || t.starts_with("No MCP")
            || t.starts_with("Name")
            || t.starts_with("---")
            || t.starts_with("===")
        {
            continue;
        }
        let lower = t.to_lowercase();
        let enabled = !lower.contains("disabled") && !lower.contains("[off]") && !lower.contains("(disabled)");
        let transport = if lower.contains("http://") || lower.contains("https://") || lower.contains("http") {
            "http".to_string()
        } else {
            "stdio".to_string()
        };

        // Formatos comunes: "fs: npx -y ... (enabled)" o "fs | stdio | npx ... | enabled" o "fs  npx ..."
        let clean_line = t.trim_start_matches(|c: char| c == '-' || c == '*' || c == ' ');
        let (name, rest) = if let Some((n, r)) = clean_line.split_once(':') {
            if !r.starts_with("//") {
                (n.trim(), r.trim())
            } else {
                clean_line.split_once(char::is_whitespace).unwrap_or((clean_line, ""))
            }
        } else if clean_line.contains('|') {
            let parts: Vec<&str> = clean_line.split('|').map(str::trim).collect();
            (parts.first().copied().unwrap_or(""), parts.get(2).copied().or_else(|| parts.get(1).copied()).unwrap_or(""))
        } else {
            clean_line.split_once(char::is_whitespace).unwrap_or((clean_line, ""))
        };

        let clean_name = name.trim();
        if clean_name.is_empty() || clean_name.contains(' ') {
            continue;
        }
        let clean_target = rest
            .replace("(enabled)", "")
            .replace("(disabled)", "")
            .replace("[enabled]", "")
            .replace("[disabled]", "")
            .trim()
            .to_string();

        if !items.iter().any(|i: &McpServerItem| i.name == clean_name) {
            items.push(McpServerItem {
                name: clean_name.to_string(),
                transport,
                target: clean_target,
                enabled,
            });
        }
    }
    items
}

#[tauri::command]
pub fn mcp_list_servers() -> Result<Vec<McpServerItem>, String> {
    let agy = resolve_agy_binary();
    let out = Command::new(&agy)
        .arg("mcp")
        .arg("list")
        .output()
        .map_err(|e| format!("Error ejecutando agy mcp list: {}", e))?;

    let stdout = String::from_utf8_lossy(&out.stdout);
    let stderr = String::from_utf8_lossy(&out.stderr);
    let combined = format!("{}\n{}", stdout, stderr);
    Ok(parse_mcp_list_output(&combined))
}

#[tauri::command]
pub fn mcp_add_server(
    name: String,
    transport: String,
    target: String,
    args: Vec<String>,
    env_vars: Vec<String>,
    headers: Vec<String>,
) -> Result<String, String> {
    let clean_name = name.trim();
    let clean_target = target.trim();
    if clean_name.is_empty() || clean_name.contains(char::is_whitespace) {
        return Err("Nombre de servidor MCP inválido (sin espacios)".into());
    }
    if clean_target.is_empty() {
        return Err("Debes especificar comando o URL para el servidor MCP".into());
    }

    let agy = resolve_agy_binary();
    let mut cmd = Command::new(&agy);
    cmd.arg("mcp").arg("add");

    let tr = transport.trim().to_lowercase();
    if tr == "http" || tr == "stdio" {
        cmd.arg("--type").arg(tr);
    }
    for e in env_vars {
        let ev = e.trim();
        if !ev.is_empty() && ev.contains('=') {
            cmd.arg("--env").arg(ev);
        }
    }
    for h in headers {
        let hv = h.trim();
        if !hv.is_empty() && hv.contains(':') {
            cmd.arg("--header").arg(hv);
        }
    }

    cmd.arg(clean_name).arg(clean_target);
    for a in args {
        let arg = a.trim();
        if !arg.is_empty() {
            cmd.arg(arg);
        }
    }

    let out = cmd
        .output()
        .map_err(|e| format!("Error ejecutando agy mcp add: {}", e))?;

    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&out.stdout).trim().to_string();
        return Err(if err.is_empty() { stdout } else { err });
    }
    Ok(format!("MCP `{}` configurado correctamente.", clean_name))
}

#[tauri::command]
pub fn mcp_toggle_server(name: String, enabled: bool) -> Result<String, String> {
    let clean_name = name.trim();
    if clean_name.is_empty() {
        return Err("Nombre de MCP vacío".into());
    }
    let agy = resolve_agy_binary();
    let action = if enabled { "enable" } else { "disable" };
    let out = Command::new(&agy)
        .arg("mcp")
        .arg(action)
        .arg(clean_name)
        .output()
        .map_err(|e| format!("Error ejecutando agy mcp {}: {}", action, e))?;

    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
        return Err(if err.is_empty() {
            format!("Fallo al cambiar estado de {}", clean_name)
        } else {
            err
        });
    }
    Ok(format!("MCP `{}` {}", clean_name, if enabled { "habilitado" } else { "deshabilitado" }))
}

#[tauri::command]
pub fn mcp_remove_server(name: String) -> Result<String, String> {
    let clean_name = name.trim();
    if clean_name.is_empty() {
        return Err("Nombre de MCP vacío".into());
    }
    let agy = resolve_agy_binary();
    let out = Command::new(&agy)
        .arg("mcp")
        .arg("remove")
        .arg(clean_name)
        .output()
        .map_err(|e| format!("Error ejecutando agy mcp remove: {}", e))?;

    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
        return Err(if err.is_empty() {
            format!("Fallo al eliminar {}", clean_name)
        } else {
            err
        });
    }
    Ok(format!("MCP `{}` eliminado.", clean_name))
}

/// Sincroniza el estado enable/disable en `agy mcp` cuando el contexto define una lista explícita de MCPs.
/// Si `active_mcps` está vacío, respeta la configuración global actual sin deshabilitar nada.
pub fn sync_context_mcps(active_mcps: &[String]) {
    if active_mcps.is_empty() {
        return;
    }
    let Ok(servers) = mcp_list_servers() else {
        return;
    };
    for srv in servers {
        let should_enable = active_mcps.iter().any(|m| m == &srv.name);
        if srv.enabled != should_enable {
            let _ = mcp_toggle_server(srv.name, should_enable);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_agy_mcp_list_variants() {
        assert!(parse_mcp_list_output("No MCP servers configured.\n").is_empty());

        let sample = "\
fs: npx -y @modelcontextprotocol/server-filesystem /work (enabled)
github: docker run -i ghcr.io/github/mcp (disabled)
docs | http | https://example.com/mcp | enabled
";
        let parsed = parse_mcp_list_output(sample);
        assert_eq!(parsed.len(), 3);
        assert_eq!(parsed[0].name, "fs");
        assert!(parsed[0].enabled);
        assert_eq!(parsed[0].transport, "stdio");
        assert_eq!(parsed[1].name, "github");
        assert!(!parsed[1].enabled);
        assert_eq!(parsed[2].name, "docs");
        assert_eq!(parsed[2].transport, "http");
        assert!(parsed[2].enabled);
    }
}
