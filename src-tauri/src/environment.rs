use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentConfig {
    #[serde(default = "default_preferred_editor")]
    pub preferred_editor: String, // "cursor" | "code" | "neovim" | "zed" | "subl" | "custom"
    #[serde(default)]
    pub custom_editor_cmd: Option<String>,
    #[serde(default = "default_preferred_terminal")]
    pub preferred_terminal: String, // "auto" | "ptyxis" | "ghostty" | "kitty" | "alacritty" | "kgx" | "gnome-terminal" | "foot" | "konsole" | "wezterm" | "custom"
    #[serde(default)]
    pub custom_terminal_cmd: Option<String>,
}

pub fn default_preferred_editor() -> String {
    "cursor".to_string()
}

pub fn default_preferred_terminal() -> String {
    "auto".to_string()
}

impl Default for EnvironmentConfig {
    fn default() -> Self {
        Self {
            preferred_editor: default_preferred_editor(),
            custom_editor_cmd: None,
            preferred_terminal: default_preferred_terminal(),
            custom_terminal_cmd: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolDetection {
    pub id: String,
    pub name: String,
    pub binary: String,
    pub installed: bool,
    pub path: Option<String>,
    pub category: String, // "editor" | "terminal"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledTools {
    pub editors: Vec<ToolDetection>,
    pub terminals: Vec<ToolDetection>,
}

/// Helper para buscar un binario en el PATH del sistema sin dependencias externas
pub fn find_binary_in_path(bin_name: &str) -> Option<PathBuf> {
    if let Some(paths) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&paths) {
            let candidate = dir.join(bin_name);
            if candidate.is_file() {
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if let Ok(meta) = candidate.metadata() {
                        if meta.permissions().mode() & 0o111 != 0 {
                            return Some(candidate);
                        }
                    }
                }
                #[cfg(not(unix))]
                return Some(candidate);
            }
        }
    }
    None
}

/// Detecta qué editores y emuladores de terminal están instalados
#[tauri::command]
pub fn get_installed_environment_tools() -> Result<InstalledTools, String> {
    let known_editors = [
        ("cursor", "Cursor AI", "cursor"),
        ("code", "Visual Studio Code", "code"),
        ("neovim", "Neovim", "nvim"),
        ("zed", "Zed Editor", "zed"),
        ("subl", "Sublime Text", "subl"),
        ("idea", "IntelliJ IDEA", "idea"),
        ("clion", "CLion", "clion"),
        ("pycharm", "PyCharm", "pycharm"),
    ];

    let known_terminals = [
        ("ptyxis", "Ptyxis", "ptyxis"),
        ("ghostty", "Ghostty", "ghostty"),
        ("kitty", "Kitty", "kitty"),
        ("alacritty", "Alacritty", "alacritty"),
        ("kgx", "GNOME Console (KGX)", "kgx"),
        ("gnome-terminal", "GNOME Terminal", "gnome-terminal"),
        ("foot", "Foot Terminal", "foot"),
        ("konsole", "KDE Konsole", "konsole"),
        ("wezterm", "WezTerm", "wezterm"),
        ("xterm", "XTerm", "xterm"),
    ];

    let mut editors = Vec::new();
    for (id, name, bin) in known_editors {
        let path = find_binary_in_path(bin);
        let installed = path.is_some();
        editors.push(ToolDetection {
            id: id.to_string(),
            name: name.to_string(),
            binary: bin.to_string(),
            installed,
            path: path.map(|p| p.to_string_lossy().to_string()),
            category: "editor".to_string(),
        });
    }

    let mut terminals = Vec::new();
    for (id, name, bin) in known_terminals {
        let path = find_binary_in_path(bin);
        let installed = path.is_some();
        terminals.push(ToolDetection {
            id: id.to_string(),
            name: name.to_string(),
            binary: bin.to_string(),
            installed,
            path: path.map(|p| p.to_string_lossy().to_string()),
            category: "terminal".to_string(),
        });
    }

    Ok(InstalledTools { editors, terminals })
}

/// Resuelve la terminal efectiva que se debe utilizar según la preferencia del usuario
pub fn resolve_terminal(preferred: &str) -> Result<String, String> {
    if preferred == "auto" || preferred.trim().is_empty() {
        // Cascada de detección automática en orden de preferencia
        let cascade = ["ptyxis", "ghostty", "kitty", "alacritty", "kgx", "gnome-terminal", "foot", "konsole", "wezterm", "xterm"];
        for term in cascade {
            if find_binary_in_path(term).is_some() {
                return Ok(term.to_string());
            }
        }
        Err("No se encontró ningún emulador de terminal compatible instalado en el sistema".to_string())
    } else {
        Ok(preferred.to_string())
    }
}

/// Lanza una terminal en el directorio especificado, opcionalmente ejecutando un comando interactivo
pub fn launch_terminal_in_dir(
    working_dir: &str,
    interactive_cmd: Option<&str>,
    title: Option<&str>,
    override_terminal: Option<&str>,
    custom_cmd_tpl: Option<&str>,
) -> Result<String, String> {
    let p = Path::new(working_dir);
    if !p.exists() {
        return Err(format!("El directorio '{}' no existe", working_dir));
    }

    let term_pref = if let Some(ot) = override_terminal {
        ot.to_string()
    } else {
        let config = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
        config.environment.preferred_terminal
    };

    let resolved_term = resolve_terminal(&term_pref)?;
    let win_title = title.unwrap_or("Aegis Terminal");

    match resolved_term.as_str() {
        "ptyxis" => {
            let mut cmd = Command::new("ptyxis");
            cmd.args(["--new-window", "-T", win_title, &format!("--working-directory={}", working_dir)]);
            if let Some(c) = interactive_cmd {
                cmd.args(["--", "bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando Ptyxis: {}", e))?;
            Ok("Terminal Ptyxis abierta".to_string())
        }
        "ghostty" => {
            let mut cmd = Command::new("ghostty");
            cmd.arg(&format!("--working-directory={}", working_dir));
            cmd.arg(&format!("--title={}", win_title));
            if let Some(c) = interactive_cmd {
                cmd.args(["-e", "bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando Ghostty: {}", e))?;
            Ok("Terminal Ghostty abierta".to_string())
        }
        "kitty" => {
            let mut cmd = Command::new("kitty");
            cmd.args(["--directory", working_dir, "-T", win_title]);
            if let Some(c) = interactive_cmd {
                cmd.args(["bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando Kitty: {}", e))?;
            Ok("Terminal Kitty abierta".to_string())
        }
        "alacritty" => {
            let mut cmd = Command::new("alacritty");
            cmd.args(["--working-directory", working_dir, "--title", win_title]);
            if let Some(c) = interactive_cmd {
                cmd.args(["-e", "bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando Alacritty: {}", e))?;
            Ok("Terminal Alacritty abierta".to_string())
        }
        "kgx" => {
            let mut cmd = Command::new("kgx");
            cmd.arg(&format!("--working-directory={}", working_dir));
            if let Some(c) = interactive_cmd {
                cmd.args(["-e", &format!("bash -c '{}'", c)]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando KGX: {}", e))?;
            Ok("Terminal KGX abierta".to_string())
        }
        "gnome-terminal" => {
            let mut cmd = Command::new("gnome-terminal");
            cmd.arg(&format!("--working-directory={}", working_dir));
            cmd.arg(&format!("--title={}", win_title));
            if let Some(c) = interactive_cmd {
                cmd.args(["--", "bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando GNOME Terminal: {}", e))?;
            Ok("GNOME Terminal abierta".to_string())
        }
        "foot" => {
            let mut cmd = Command::new("foot");
            cmd.args(["-D", working_dir, "-T", win_title]);
            if let Some(c) = interactive_cmd {
                cmd.args(["bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando Foot: {}", e))?;
            Ok("Terminal Foot abierta".to_string())
        }
        "konsole" => {
            let mut cmd = Command::new("konsole");
            cmd.args(["--workdir", working_dir]);
            if let Some(c) = interactive_cmd {
                cmd.args(["-e", "bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando Konsole: {}", e))?;
            Ok("Terminal Konsole abierta".to_string())
        }
        "wezterm" => {
            let mut cmd = Command::new("wezterm");
            cmd.args(["start", "--cwd", working_dir]);
            if let Some(c) = interactive_cmd {
                cmd.args(["--", "bash", "-c", c]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando WezTerm: {}", e))?;
            Ok("Terminal WezTerm abierta".to_string())
        }
        "xterm" => {
            let mut cmd = Command::new("xterm");
            cmd.args(["-title", win_title]);
            if let Some(c) = interactive_cmd {
                cmd.args(["-e", &format!("cd '{}' && {}", working_dir, c)]);
            } else {
                cmd.args(["-e", &format!("cd '{}' && exec $SHELL", working_dir)]);
            }
            cmd.current_dir(p).spawn().map_err(|e| format!("Error lanzando XTerm: {}", e))?;
            Ok("Terminal XTerm abierta".to_string())
        }
        "custom" => {
            let tpl = custom_cmd_tpl.unwrap_or("");
            if tpl.trim().is_empty() {
                return Err("Comando personalizado de terminal no configurado".to_string());
            }
            let executed_cmd = if tpl.contains("%p") {
                tpl.replace("%p", working_dir)
            } else {
                format!("{} \"{}\"", tpl, working_dir)
            };
            Command::new("sh")
                .args(["-c", &executed_cmd])
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error ejecutando terminal personalizada: {}", e))?;
            Ok(format!("Terminal personalizada iniciada: {}", tpl))
        }
        other => Err(format!("Terminal '{}' no soportada o no configurada", other)),
    }
}

/// Lanza el editor en la ruta especificada
pub fn launch_editor_in_dir(
    target_path: &str,
    override_editor: Option<&str>,
    custom_cmd_tpl: Option<&str>,
) -> Result<String, String> {
    let p = Path::new(target_path);
    if !p.exists() {
        return Err(format!("La ruta '{}' no existe", target_path));
    }

    let editor_pref = if let Some(oe) = override_editor {
        oe.to_string()
    } else {
        let config = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
        config.environment.preferred_editor
    };

    match editor_pref.as_str() {
        "cursor" => {
            Command::new("cursor")
                .arg(target_path)
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error abriendo Cursor: {}", e))?;
            Ok("Cursor abierto correctamente".to_string())
        }
        "code" => {
            Command::new("code")
                .arg(target_path)
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error abriendo VS Code: {}", e))?;
            Ok("VS Code abierto correctamente".to_string())
        }
        "neovim" | "nvim" => {
            // Si existe cliente GUI nativo (Neovide), usarlo directamente
            if find_binary_in_path("neovide").is_some() {
                Command::new("neovide")
                    .arg(target_path)
                    .current_dir(p)
                    .spawn()
                    .map_err(|e| format!("Error abriendo Neovide: {}", e))?;
                return Ok("Neovide abierto correctamente".to_string());
            }

            // Si es terminal, lanzarlo dentro de la terminal preferida del usuario
            let dir = if p.is_dir() { target_path } else { p.parent().unwrap_or(p).to_str().unwrap_or(".") };
            let nvim_cmd = format!("nvim '{}'", target_path);
            launch_terminal_in_dir(dir, Some(&nvim_cmd), Some("Neovim"), None, None)?;
            Ok("Neovim iniciado en terminal interactiva".to_string())
        }
        "zed" => {
            Command::new("zed")
                .arg(target_path)
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error abriendo Zed: {}", e))?;
            Ok("Zed Editor abierto correctamente".to_string())
        }
        "subl" => {
            Command::new("subl")
                .arg(target_path)
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error abriendo Sublime Text: {}", e))?;
            Ok("Sublime Text abierto correctamente".to_string())
        }
        "idea" => {
            Command::new("idea")
                .arg(target_path)
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error abriendo IntelliJ IDEA: {}", e))?;
            Ok("IntelliJ IDEA abierto correctamente".to_string())
        }
        "custom" => {
            let tpl = custom_cmd_tpl.unwrap_or("");
            if tpl.trim().is_empty() {
                return Err("Comando personalizado de editor no configurado".to_string());
            }
            let executed_cmd = if tpl.contains("%p") {
                tpl.replace("%p", target_path)
            } else {
                format!("{} \"{}\"", tpl, target_path)
            };
            Command::new("sh")
                .args(["-c", &executed_cmd])
                .current_dir(p)
                .spawn()
                .map_err(|e| format!("Error ejecutando editor personalizado: {}", e))?;
            Ok(format!("Editor personalizado iniciado: {}", tpl))
        }
        other => Err(format!("Editor desconocido o no configurado: {}", other)),
    }
}

/// Función para probar un editor o terminal directamente desde la interfaz de Ajustes
#[tauri::command]
pub fn test_environment_tool(
    tool_type: String, // "editor" | "terminal"
    tool_id: String,
    custom_cmd: Option<String>,
) -> Result<String, String> {
    let test_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());

    if tool_type == "terminal" {
        launch_terminal_in_dir(
            &test_dir,
            Some("echo '✅ Aegis: Terminal configurada correctamente.'; echo ''; read -p 'Presiona Enter para cerrar...'"),
            Some("Aegis - Prueba de Terminal"),
            Some(&tool_id),
            custom_cmd.as_deref(),
        )
    } else {
        launch_editor_in_dir(&test_dir, Some(&tool_id), custom_cmd.as_deref())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_find_binary_in_path() {
        assert!(find_binary_in_path("sh").is_some());
        assert!(find_binary_in_path("non_existent_binary_12345_xyz").is_none());
    }

    #[test]
    fn test_resolve_terminal_auto() {
        let res = resolve_terminal("auto");
        assert!(res.is_ok());
        let term = res.unwrap();
        assert!(!term.is_empty());
    }

    #[test]
    fn test_get_installed_tools() {
        let tools = get_installed_environment_tools().unwrap();
        assert!(!tools.editors.is_empty());
        assert!(!tools.terminals.is_empty());
    }
}

