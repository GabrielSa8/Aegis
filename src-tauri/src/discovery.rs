use std::fs;
use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::environment::{find_binary_in_path, get_installed_environment_tools, ToolDetection};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedVault {
    pub path: String,
    pub name: String,
    pub source: String, // "Obsidian Registry (Native)", "Obsidian Registry (Flatpak)", "Common Folder"
    pub note_count: usize,
    pub is_current: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SavedCliAccount {
    pub email: String,
    pub plan_type: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedAiEngine {
    pub id: String, // "agy", "claude", "codex", "ollama", "deepseek", "openai"
    pub name: String,
    pub installed: bool,
    pub path: Option<String>,
    pub details: Option<String>,
    pub account_email: Option<String>,
    pub plan_type: Option<String>,
    pub auth_status: String, // "authenticated" | "expired" | "unauthenticated" | "local" | "api_key"
    pub saved_accounts: Vec<SavedCliAccount>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DetectedSteamInfo {
    pub installed: bool,
    pub client_path: Option<String>,
    pub libraries_count: usize,
    pub games_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemEnvironmentInspection {
    pub vaults: Vec<DetectedVault>,
    pub ai_engines: Vec<DetectedAiEngine>,
    pub steam: DetectedSteamInfo,
    pub editors: Vec<ToolDetection>,
    pub terminals: Vec<ToolDetection>,
    pub current_config: crate::config::AegisConfig,
}

// ================= OBSIDIAN AUTO-DISCOVERY =================

/// Cuenta archivos .md en un directorio hasta 500 para evitar scans pesados
fn count_markdown_notes(dir: &Path) -> usize {
    let mut count = 0;
    let mut stack = vec![dir.to_path_buf()];

    while let Some(current) = stack.pop() {
        if let Ok(entries) = fs::read_dir(&current) {
            for entry in entries.flatten() {
                let p = entry.path();
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if name.starts_with('.') || name == "node_modules" {
                    continue;
                }
                if p.is_dir() {
                    if stack.len() < 30 {
                        stack.push(p);
                    }
                } else if p.is_file() && p.extension().and_then(|e| e.to_str()) == Some("md") {
                    count += 1;
                    if count >= 500 {
                        return count;
                    }
                }
            }
        }
    }
    count
}

pub fn detect_obsidian_vaults() -> Vec<DetectedVault> {
    let mut vaults = Vec::new();
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let current_cfg_path = crate::config::get_aegis_config()
        .map(|c| c.vault_path)
        .unwrap_or_default();

    // 1. Escanear registros JSON oficiales de Obsidian (Nativo y Flatpak)
    let obsidian_json_candidates = [
        (format!("{}/.config/obsidian/obsidian.json", home), "Obsidian Registry (Nativo)"),
        (format!("{}/.var/app/md.obsidian.Obsidian/config/obsidian/obsidian.json", home), "Obsidian Registry (Flatpak)"),
    ];

    for (json_path, source_label) in &obsidian_json_candidates {
        if let Ok(content) = fs::read_to_string(json_path) {
            if let Ok(json) = serde_json::from_str::<Value>(&content) {
                if let Some(vaults_obj) = json.get("vaults").and_then(|v| v.as_object()) {
                    for (_id, v_data) in vaults_obj {
                        if let Some(path_str) = v_data.get("path").and_then(|p| p.as_str()) {
                            let p = Path::new(path_str);
                            if p.exists() && p.is_dir() {
                                if !vaults.iter().any(|v: &DetectedVault| v.path == path_str) {
                                    let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("Obsidian Vault").to_string();
                                    let note_count = count_markdown_notes(p);
                                    vaults.push(DetectedVault {
                                        path: path_str.to_string(),
                                        name,
                                        source: source_label.to_string(),
                                        note_count,
                                        is_current: path_str == current_cfg_path,
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Escanear rutas convencionales estándar del sistema
    let common_dirs = [
        format!("{}/Documentos/Obsidian Vault", home),
        format!("{}/Documents/Obsidian Vault", home),
        format!("{}/Documentos/Vault", home),
        format!("{}/Documents/Vault", home),
        format!("{}/Documentos/Notas", home),
        format!("{}/Documents/Notes", home),
        format!("{}/Documents/Aegis Vault", home),
        format!("{}/Documentos/Aegis Vault", home),
    ];

    for dir_str in &common_dirs {
        let p = Path::new(dir_str);
        if p.exists() && p.is_dir() {
            if !vaults.iter().any(|v| v.path == *dir_str) {
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("Bóveda").to_string();
                let note_count = count_markdown_notes(p);
                vaults.push(DetectedVault {
                    path: dir_str.clone(),
                    name,
                    source: "Directorio Convencional".to_string(),
                    note_count,
                    is_current: *dir_str == current_cfg_path,
                });
            }
        }
    }

    // Si la ruta actualmente configurada existe y no fue detectada, añadirla
    if !current_cfg_path.trim().is_empty() {
        let cur_p = Path::new(&current_cfg_path);
        if cur_p.exists() && !vaults.iter().any(|v| v.path == current_cfg_path) {
            let name = cur_p.file_name().and_then(|n| n.to_str()).unwrap_or("Bóveda Activa").to_string();
            let note_count = count_markdown_notes(cur_p);
            vaults.push(DetectedVault {
                path: current_cfg_path.clone(),
                name,
                source: "Configuración Guardada".to_string(),
                note_count,
                is_current: true,
            });
        }
    }

    vaults
}

/// Decodifica base64 URL safe simple sin dependencias externas para extraer JWT payload
fn decode_jwt_payload_safe(token: &str) -> Option<Value> {
    let parts: Vec<&str> = token.split('.').collect();
    if parts.len() < 2 {
        return None;
    }
    let payload_str = parts[1];
    
    let decode_char = |c: u8| -> Option<u8> {
        match c {
            b'A'..=b'Z' => Some(c - b'A'),
            b'a'..=b'z' => Some(c - b'a' + 26),
            b'0'..=b'9' => Some(c - b'0' + 52),
            b'-' | b'+' => Some(62),
            b'_' | b'/' => Some(63),
            _ => None,
        }
    };

    let clean_bytes = payload_str.as_bytes();
    let mut decoded = Vec::with_capacity(clean_bytes.len());
    let mut buf = 0u32;
    let mut bits = 0;

    for &b in clean_bytes {
        if b == b'=' {
            break;
        }
        if let Some(val) = decode_char(b) {
            buf = (buf << 6) | (val as u32);
            bits += 6;
            if bits >= 8 {
                bits -= 8;
                decoded.push((buf >> bits) as u8);
                buf &= (1 << bits) - 1;
            }
        }
    }

    serde_json::from_slice(&decoded).ok()
}

// ================= CLI MULTI-ACCOUNT VAULT HELPERS =================

fn get_cli_accounts_dir(engine_id: &str) -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let dir = PathBuf::from(home)
        .join(".config")
        .join("aegis")
        .join("cli_accounts")
        .join(engine_id);
    let _ = fs::create_dir_all(&dir);
    dir
}

fn sanitize_email_filename(email: &str) -> String {
    email
        .chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '@' || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect()
}

fn save_account_snapshot(engine_id: &str, email: &str, plan_type: Option<&str>, payload: &Value) {
    if email.trim().is_empty() || !email.contains('@') {
        return;
    }
    let dir = get_cli_accounts_dir(engine_id);
    let file_path = dir.join(format!("{}.json", sanitize_email_filename(email)));
    let record = serde_json::json!({
        "email": email,
        "planType": plan_type,
        "payload": payload,
    });
    if let Ok(json_str) = serde_json::to_string_pretty(&record) {
        let _ = fs::write(file_path, json_str);
    }
}

fn list_saved_accounts(engine_id: &str, active_email: Option<&str>) -> Vec<SavedCliAccount> {
    let dir = get_cli_accounts_dir(engine_id);
    let mut list = Vec::new();
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.extension().and_then(|e| e.to_str()) == Some("json") {
                if let Ok(content) = fs::read_to_string(&p) {
                    if let Ok(v) = serde_json::from_str::<Value>(&content) {
                        if let Some(email) = v.get("email").and_then(|e| e.as_str()) {
                            let plan_type = v.get("planType").and_then(|pt| pt.as_str()).map(|s| s.to_string());
                            let is_active = active_email.map(|a| a.eq_ignore_ascii_case(email)).unwrap_or(false);
                            list.push(SavedCliAccount {
                                email: email.to_string(),
                                plan_type,
                                is_active,
                            });
                        }
                    }
                }
            }
        }
    }
    list.sort_by(|a, b| b.is_active.cmp(&a.is_active).then_with(|| a.email.cmp(&b.email)));
    list
}

// ================= AI ENGINES AUTO-DISCOVERY =================

pub fn detect_ai_engines() -> Vec<DetectedAiEngine> {
    let mut engines = Vec::new();
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());

    // 1. Google Antigravity CLI (agy)
    let agy_path = find_binary_in_path("agy")
        .or_else(|| {
            let p1 = PathBuf::from(&home).join(".local/bin/agy");
            if p1.exists() { Some(p1) } else { None }
        })
        .or_else(|| {
            let p2 = PathBuf::from("/usr/local/bin/agy");
            if p2.exists() { Some(p2) } else { None }
        });

    let (agy_email, agy_plan, agy_status) = {
        let token_p = PathBuf::from(&home).join(".gemini/antigravity-cli/antigravity-oauth-token");
        let mut raw_token_str = fs::read_to_string(&token_p).ok();

        // Si el archivo no existe o está vacío, intentar leer de secret-tool (GNOME Keyring)
        if raw_token_str.as_ref().map(|s| s.trim().is_empty()).unwrap_or(true) {
            if let Ok(out) = std::process::Command::new("secret-tool")
                .args(["lookup", "service", "gemini", "username", "antigravity"])
                .output()
            {
                if out.status.success() {
                    let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
                    if !s.is_empty() {
                        raw_token_str = Some(s);
                    }
                }
            }
        }

        if let Some(raw) = raw_token_str {
            if let Ok(v) = serde_json::from_str::<Value>(&raw) {
                let email = v.get("id_token_email")
                    .and_then(|e| e.as_str())
                    .filter(|s| !s.is_empty())
                    .map(|s| s.to_string());
                let method = v.get("auth_method").and_then(|m| m.as_str()).unwrap_or("consumer");
                let plan = match method {
                    "consumer" => Some("Google AI / Gemini Pro".to_string()),
                    "enterprise" | "vertex" | "gcloud" => Some("Google Cloud / Workspace".to_string()),
                    other => Some(format!("Gemini ({})", other)),
                };
                if let Some(ref em) = email {
                    save_account_snapshot("agy", em, plan.as_deref(), &v);
                }
                (email.or_else(|| Some("Sesión OAuth Activa".to_string())), plan, "authenticated".to_string())
            } else {
                (None, None, "unauthenticated".to_string())
            }
        } else {
            (None, None, "unauthenticated".to_string())
        }
    };

    let agy_saved = list_saved_accounts("agy", agy_email.as_deref());
    engines.push(DetectedAiEngine {
        id: "agy".to_string(),
        name: "Google Antigravity CLI (agy)".to_string(),
        installed: agy_path.is_some(),
        path: agy_path.map(|p| p.to_string_lossy().to_string()),
        details: Some("Motor predeterminado integrado de alta velocidad".to_string()),
        account_email: agy_email,
        plan_type: agy_plan,
        auth_status: agy_status,
        saved_accounts: agy_saved,
    });

    // 2. Anthropic Claude Code (claude)
    let claude_path = find_binary_in_path("claude")
        .or_else(|| {
            let p = PathBuf::from(&home).join(".npm-global/bin/claude");
            if p.exists() { Some(p) } else { None }
        })
        .or_else(|| {
            let p = PathBuf::from(&home).join(".local/bin/claude");
            if p.exists() { Some(p) } else { None }
        });

    let (claude_email, claude_plan, claude_status) = {
        let cred_p = PathBuf::from(&home).join(".claude/.credentials.json");
        let cfg_p = PathBuf::from(&home).join(".claude.json");

        let cred_val = fs::read_to_string(&cred_p).ok().and_then(|c| serde_json::from_str::<Value>(&c).ok());
        let cfg_val = fs::read_to_string(&cfg_p).ok().and_then(|c| serde_json::from_str::<Value>(&c).ok());

        let email = cfg_val.as_ref()
            .and_then(|v| v.pointer("/oauthAccount/emailAddress"))
            .and_then(|e| e.as_str())
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string());

        let org_type = cfg_val.as_ref()
            .and_then(|v| v.pointer("/oauthAccount/organizationType"))
            .and_then(|t| t.as_str());

        let sub_type = cred_val.as_ref()
            .and_then(|v| v.pointer("/claudeAiOauth/subscriptionType"))
            .and_then(|s| s.as_str());

        let plan = if let Some(st) = sub_type {
            Some(format!("Claude {}", st.to_uppercase()))
        } else if let Some(ot) = org_type {
            Some(ot.replace("claude_", "Claude ").to_uppercase())
        } else {
            None
        };

        let has_active_token = cred_val.as_ref().map(|v| {
            let acc = v.pointer("/claudeAiOauth/accessToken").and_then(|s| s.as_str()).unwrap_or("");
            let refr = v.pointer("/claudeAiOauth/refreshToken").and_then(|s| s.as_str()).unwrap_or("");
            !acc.is_empty() || !refr.is_empty()
        }).unwrap_or(false);

        if has_active_token {
            if let (Some(ref em), Some(ref cv)) = (&email, &cred_val) {
                let snapshot = serde_json::json!({
                    "credentials": cv,
                    "oauthAccount": cfg_val.as_ref().and_then(|v| v.get("oauthAccount")).cloned()
                });
                save_account_snapshot("claude", em, plan.as_deref(), &snapshot);
            }
            (email.or_else(|| Some("Sesión Claude Activa".to_string())), plan, "authenticated".to_string())
        } else if email.is_some() {
            (email, plan, "expired".to_string())
        } else {
            (None, plan, "unauthenticated".to_string())
        }
    };

    let claude_saved = list_saved_accounts("claude", claude_email.as_deref());
    engines.push(DetectedAiEngine {
        id: "claude".to_string(),
        name: "Claude Code CLI (claude)".to_string(),
        installed: claude_path.is_some(),
        path: claude_path.map(|p| p.to_string_lossy().to_string()),
        details: Some("Agente de codificación oficial de Anthropic".to_string()),
        account_email: claude_email,
        plan_type: claude_plan,
        auth_status: claude_status,
        saved_accounts: claude_saved,
    });

    // 3. OpenAI Codex CLI (codex)
    let codex_path = find_binary_in_path("codex")
        .or_else(|| {
            let p = PathBuf::from("/usr/local/bin/codex");
            if p.exists() { Some(p) } else { None }
        })
        .or_else(|| {
            let p = PathBuf::from(&home).join(".local/bin/codex");
            if p.exists() { Some(p) } else { None }
        });

    let (codex_email, codex_plan, codex_status) = {
        let auth_p = PathBuf::from(&home).join(".codex/auth.json");
        if auth_p.exists() {
            if let Ok(c) = fs::read_to_string(&auth_p) {
                if let Ok(v) = serde_json::from_str::<Value>(&c) {
                    let id_tok = v.pointer("/tokens/id_token").and_then(|s| s.as_str()).unwrap_or("");
                    let acc_tok = v.pointer("/tokens/access_token").and_then(|s| s.as_str()).unwrap_or("");
                    let api_key = v.get("OPENAI_API_KEY").and_then(|s| s.as_str()).unwrap_or("");
                    let mut email = None;
                    let mut plan = None;
                    if !id_tok.is_empty() {
                        if let Some(jwt_json) = decode_jwt_payload_safe(id_tok) {
                            email = jwt_json.get("email").and_then(|e| e.as_str()).map(|s| s.to_string());
                            plan = jwt_json.pointer("/https:~1~1api.openai.com~1auth/chatgpt_plan_type")
                                .and_then(|p| p.as_str())
                                .map(|s| format!("ChatGPT {}", s.to_uppercase()));
                        }
                    }
                    let is_active = !id_tok.is_empty() || !acc_tok.is_empty() || !api_key.is_empty();
                    if is_active {
                        if let Some(ref em) = email {
                            save_account_snapshot("codex", em, plan.as_deref(), &v);
                        }
                        (email.or_else(|| Some("Sesión ChatGPT Activa".to_string())), plan.or_else(|| Some("OpenAI Account".to_string())), "authenticated".to_string())
                    } else {
                        (email, plan, "unauthenticated".to_string())
                    }
                } else {
                    (None, None, "unauthenticated".to_string())
                }
            } else {
                (None, None, "unauthenticated".to_string())
            }
        } else {
            (None, None, "unauthenticated".to_string())
        }
    };

    if codex_path.is_some() {
        let codex_saved = list_saved_accounts("codex", codex_email.as_deref());
        engines.push(DetectedAiEngine {
            id: "codex".to_string(),
            name: "Codex Agent CLI (codex)".to_string(),
            installed: true,
            path: codex_path.map(|p| p.to_string_lossy().to_string()),
            details: Some("Agente CLI soberano detectado en sistema".to_string()),
            account_email: codex_email,
            plan_type: codex_plan,
            auth_status: codex_status,
            saved_accounts: codex_saved,
        });
    }

    // 4. Ollama Local
    let ollama_path = find_binary_in_path("ollama");
    let ollama_installed = ollama_path.is_some();
    engines.push(DetectedAiEngine {
        id: "ollama".to_string(),
        name: "Ollama Local (Offline / Soberano)".to_string(),
        installed: ollama_installed,
        path: ollama_path.map(|p| p.to_string_lossy().to_string()),
        details: Some("Inferencia local sin conexión ni costo de tokens".to_string()),
        account_email: Some("Localhost (Offline)".to_string()),
        plan_type: Some("100% Gratuito / Soberano".to_string()),
        auth_status: "local".to_string(),
        saved_accounts: Vec::new(),
    });

    // 5. Proveedores vía API Key en Entorno (DeepSeek, OpenAI, OpenRouter)
    let has_deepseek = std::env::var("DEEPSEEK_API_KEY").map(|k| !k.trim().is_empty()).unwrap_or(false);
    engines.push(DetectedAiEngine {
        id: "deepseek".to_string(),
        name: "DeepSeek API (Soberano)".to_string(),
        installed: has_deepseek,
        path: None,
        details: Some(if has_deepseek { "Variable DEEPSEEK_API_KEY detectada" } else { "Requiere API key" }.to_string()),
        account_email: if has_deepseek { Some("API Key en ENV".to_string()) } else { None },
        plan_type: Some("Pay-as-you-go".to_string()),
        auth_status: "api_key".to_string(),
        saved_accounts: Vec::new(),
    });

    let has_openai = std::env::var("OPENAI_API_KEY").map(|k| !k.trim().is_empty()).unwrap_or(false);
    engines.push(DetectedAiEngine {
        id: "openai".to_string(),
        name: "OpenAI Platform (GPT-4o / o3)".to_string(),
        installed: has_openai,
        path: None,
        details: Some(if has_openai { "Variable OPENAI_API_KEY detectada" } else { "Requiere API key" }.to_string()),
        account_email: if has_openai { Some("API Key en ENV".to_string()) } else { None },
        plan_type: Some("OpenAI Platform API".to_string()),
        auth_status: "api_key".to_string(),
        saved_accounts: Vec::new(),
    });

    engines
}

#[tauri::command]
pub fn switch_cli_account(engine_id: String, email: String) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    // Respaldar la cuenta activa actual antes de intercambiar
    let _ = detect_ai_engines();

    let dir = get_cli_accounts_dir(&engine_id);
    let file_path = dir.join(format!("{}.json", sanitize_email_filename(&email)));
    if !file_path.exists() {
        return Err(format!("No se encontró el perfil guardado para {}", email));
    }

    let content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let record: Value = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    let payload = record.get("payload").ok_or("Perfil de cuenta corrupto o vacío")?;

    match engine_id.as_str() {
        "agy" => {
            let raw_str = serde_json::to_string_pretty(payload).map_err(|e| e.to_string())?;
            let token_p = PathBuf::from(&home).join(".gemini/antigravity-cli/antigravity-oauth-token");
            if let Some(parent) = token_p.parent() {
                let _ = fs::create_dir_all(parent);
            }
            fs::write(&token_p, &raw_str).map_err(|e| e.to_string())?;

            // También actualizar secret-tool (GNOME Keyring) para que agy tome la cuenta de inmediato
            if let Ok(mut child) = std::process::Command::new("secret-tool")
                .args([
                    "store",
                    "--label=Password for 'antigravity' on 'gemini'",
                    "service",
                    "gemini",
                    "username",
                    "antigravity",
                ])
                .stdin(std::process::Stdio::piped())
                .spawn()
            {
                if let Some(mut stdin) = child.stdin.take() {
                    use std::io::Write;
                    let _ = stdin.write_all(raw_str.as_bytes());
                }
                let _ = child.wait();
            }
            Ok(format!("Cuenta de Antigravity cambiada a {}", email))
        }
        "claude" | "anthropic" => {
            if let Some(creds) = payload.get("credentials") {
                let cred_p = PathBuf::from(&home).join(".claude/.credentials.json");
                if let Some(parent) = cred_p.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                let creds_str = serde_json::to_string_pretty(creds).map_err(|e| e.to_string())?;
                fs::write(&cred_p, creds_str).map_err(|e| e.to_string())?;
            }
            if let Some(oauth_acc) = payload.get("oauthAccount") {
                if !oauth_acc.is_null() {
                    let cfg_p = PathBuf::from(&home).join(".claude.json");
                    let mut cfg_val = fs::read_to_string(&cfg_p)
                        .ok()
                        .and_then(|c| serde_json::from_str::<Value>(&c).ok())
                        .unwrap_or_else(|| serde_json::json!({}));
                    if let Some(obj) = cfg_val.as_object_mut() {
                        obj.insert("oauthAccount".to_string(), oauth_acc.clone());
                        if let Ok(s) = serde_json::to_string_pretty(&cfg_val) {
                            let _ = fs::write(&cfg_p, s);
                        }
                    }
                }
            }
            Ok(format!("Cuenta de Claude Code cambiada a {}", email))
        }
        "codex" | "openai" => {
            let auth_p = PathBuf::from(&home).join(".codex/auth.json");
            if let Some(parent) = auth_p.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let auth_str = serde_json::to_string_pretty(payload).map_err(|e| e.to_string())?;
            fs::write(&auth_p, auth_str).map_err(|e| e.to_string())?;
            Ok(format!("Cuenta de Codex cambiada a {}", email))
        }
        other => Err(format!("Motor '{}' no soporta cambio de cuenta OAuth", other)),
    }
}

#[tauri::command]
pub fn trigger_cli_account_login(engine_id: String) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    // Respaldar la cuenta activa actual antes de iniciar flujo de nueva cuenta
    let _ = detect_ai_engines();

    let (title, cmd) = match engine_id.as_str() {
        "agy" => (
            "Aegis — Vincular Cuenta Google Antigravity (agy)",
            "echo '=== AEGIS: Vinculación de Cuenta Google Antigravity (agy) ==='; \
             echo 'Tu cuenta anterior quedó respaldada en Aegis. Iniciando login en navegador...'; \
             secret-tool clear service gemini username antigravity 2>/dev/null; \
             rm -f ~/.gemini/antigravity-cli/antigravity-oauth-token; \
             agy"
        ),
        "claude" | "anthropic" => (
            "Aegis — Vincular Cuenta Claude Code",
            "echo '=== AEGIS: Vinculación de Cuenta Claude Code ==='; \
             claude auth logout 2>/dev/null; \
             claude auth login; \
             echo ''; read -p 'Autenticación completada. Presiona Enter para cerrar y vuelve a Aegis...'"
        ),
        "codex" | "openai" => (
            "Aegis — Vincular Cuenta OpenAI Codex",
            "echo '=== AEGIS: Vinculación de Cuenta OpenAI Codex ==='; \
             codex logout 2>/dev/null; \
             codex login; \
             echo ''; read -p 'Autenticación completada. Presiona Enter para cerrar y vuelve a Aegis...'"
        ),
        other => return Err(format!("El motor '{}' no utiliza inicio de sesión interactivo en CLI", other)),
    };

    crate::environment::launch_terminal_in_dir(&home, Some(cmd), Some(title), None, None)
}

#[tauri::command]
pub fn remove_saved_cli_account(engine_id: String, email: String) -> Result<String, String> {
    let dir = get_cli_accounts_dir(&engine_id);
    let file_path = dir.join(format!("{}.json", sanitize_email_filename(&email)));
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    Ok(format!("Perfil {} eliminado", email))
}

// ================= STEAM AUTO-DISCOVERY =================

pub fn detect_steam_environment() -> DetectedSteamInfo {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let steam_candidates = [
        format!("{}/.local/share/Steam", home),
        format!("{}/.steam/steam", home),
        format!("{}/.var/app/com.valvesoftware.Steam/data/Steam", home),
    ];

    let mut client_path = None;
    let mut installed = false;

    for base in &steam_candidates {
        let p = Path::new(base);
        if p.exists() {
            installed = true;
            client_path = Some(base.clone());
            break;
        }
    }

    let games = crate::leisure::get_installed_steam_games().unwrap_or_default();

    DetectedSteamInfo {
        installed,
        client_path,
        libraries_count: if installed { 1 } else { 0 },
        games_count: games.len(),
    }
}

// ================= UNIVERSAL INSPECTOR & ONBOARDING INITIALIZER =================

#[tauri::command]
pub fn inspect_system_environment() -> Result<SystemEnvironmentInspection, String> {
    let vaults = detect_obsidian_vaults();
    let ai_engines = detect_ai_engines();
    let steam = detect_steam_environment();
    let tools = get_installed_environment_tools().unwrap_or(crate::environment::InstalledTools {
        editors: Vec::new(),
        terminals: Vec::new(),
    });
    let current_config = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());

    Ok(SystemEnvironmentInspection {
        vaults,
        ai_engines,
        steam,
        editors: tools.editors,
        terminals: tools.terminals,
        current_config,
    })
}

fn today_ymd() -> String {
    let now = std::time::SystemTime::now();
    let dur = now.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
    let days = (dur / 86400) as i64;
    let z = days + 719468;
    let era = (if z >= 0 { z } else { z - 146096 }) / 146097;
    let doe = (z - era * 146097) as u32;
    let yoe = (doe - doe / 1024 + doe / 1461 - doe / 142434) / 365;
    let y = (yoe as i64) + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = y + (if m <= 2 { 1 } else { 0 });
    format!("{:04}-{:02}-{:02}", y, m, d)
}

#[tauri::command]
pub fn auto_create_default_vault(custom_name: Option<String>) -> Result<String, String> {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let folder_name = custom_name.unwrap_or_else(|| "Aegis Vault".to_string());

    // Preferir Documentos en español o Documents en inglés
    let docs_dir = {
        let d_es = PathBuf::from(&home).join("Documentos");
        if d_es.exists() {
            d_es
        } else {
            let d_en = PathBuf::from(&home).join("Documents");
            if !d_en.exists() {
                let _ = fs::create_dir_all(&d_en);
            }
            d_en
        }
    };

    let target_vault = docs_dir.join(&folder_name);

    // Crear estructura básica de carpetas
    fs::create_dir_all(target_vault.join("00 Sistema")).map_err(|e| e.to_string())?;
    fs::create_dir_all(target_vault.join("01 Proyectos")).map_err(|e| e.to_string())?;
    fs::create_dir_all(target_vault.join("02 Notas")).map_err(|e| e.to_string())?;
    fs::create_dir_all(target_vault.join(".obsidian")).map_err(|e| e.to_string())?;

    // Crear INICIO.md maestro
    let today = today_ymd();
    let inicio_content = format!(
        "---\naliases:\n  - Inicio\n  - Tablero\ntags:\n  - cerebro-ia\n  - inicio\nfecha_creacion: {today}\n---\n\n\
        # 🛡️ Aegis — Tablero Maestro de Vida & Conocimiento\n\n\
        > [!NOTE] Bóveda Soberana Inicializada\n\
        > Esta bóveda fue generada automáticamente por Aegis en formato Obsidian Markdown 100% libre y compatible.\n\n\
        ## 📌 Hubs Principales\n\
        * [[00 Sistema/Inbox|📥 Inbox & Bandeja de Entrada]]\n\
        * [[01 Proyectos/MOC - Proyectos|🚀 Proyectos en Desarrollo]]\n\
        * [[02 Notas/MOC - Notas|📝 Notas Rápidas y Conocimiento]]\n"
    );
    let _ = fs::write(target_vault.join("INICIO.md"), inicio_content);

    // Crear 00 Sistema/Inbox.md con tareas iniciales guiadas
    let inbox_content = format!(
        "---\naliases:\n  - Inbox\ntags:\n  - tareas\n---\n\n\
        # 📥 Bandeja de Entrada & Tareas\n\n\
        - [ ] [id:welcome] Explorar el Cockpit de Aegis y atajos maestros 📅 {today} 🔥 #aegis\n\
        - [ ] [id:omnibar] Abrir la Paleta Omnibar con Ctrl + K para comandos rápidos 📅 {today} 🔼 #aegis\n\
        - [ ] [id:agent_task] Ejecutar tu primera consulta o plan técnico en el Agente IA 📅 {today} 🔼 #aegis\n"
    );
    let _ = fs::write(target_vault.join("00 Sistema/Inbox.md"), inbox_content);

    let vault_str = target_vault.to_string_lossy().to_string();

    // Actualizar configuración viva de Aegis
    if let Ok(mut cfg) = crate::config::get_aegis_config() {
        cfg.vault_path = vault_str.clone();
        let _ = crate::config::save_aegis_config(cfg);
    }

    Ok(vault_str)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OnboardingCompletionPayload {
    pub operator_name: Option<String>,
    pub operator_role: Option<String>,
    pub response_style: Option<String>,
    pub theme: Option<String>,
    pub vault_path: Option<String>,
    pub agent_type: Option<String>,
    pub preferred_editor: Option<String>,
    pub preferred_terminal: Option<String>,
}

#[tauri::command]
pub fn complete_system_onboarding(payload: OnboardingCompletionPayload) -> Result<crate::config::AegisConfig, String> {
    let mut cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());

    if let Some(name) = payload.operator_name {
        if !name.trim().is_empty() {
            cfg.profile.name = name.trim().to_string();
        }
    }
    if let Some(role) = payload.operator_role {
        if !role.trim().is_empty() {
            cfg.profile.role = role.trim().to_string();
        }
    }
    if let Some(style) = payload.response_style {
        cfg.profile.response_style = style;
    }
    if let Some(theme) = payload.theme {
        cfg.theme = theme;
    }
    if let Some(vault) = payload.vault_path {
        if !vault.trim().is_empty() {
            cfg.vault_path = vault.trim().to_string();
        }
    }
    if let Some(agent) = payload.agent_type {
        cfg.agent_type = agent;
    }
    if let Some(editor) = payload.preferred_editor {
        cfg.environment.preferred_editor = editor;
    }
    if let Some(term) = payload.preferred_terminal {
        cfg.environment.preferred_terminal = term;
    }

    cfg.onboarding_completed = true;
    crate::config::save_aegis_config(cfg.clone())?;

    Ok(cfg)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_detect_obsidian_vaults() {
        let vaults = detect_obsidian_vaults();
        // Debe detectar al menos una bóveda si existe en el entorno
        assert!(!vaults.is_empty(), "Debe detectar al menos una bóveda");
        assert!(vaults.iter().any(|v| v.path.contains("Obsidian Vault")));
    }

    #[test]
    fn test_detect_ai_engines() {
        let engines = detect_ai_engines();
        assert!(!engines.is_empty(), "Debe listar motores conocidos");
        assert!(engines.iter().any(|e| e.id == "agy"));
    }

    #[test]
    fn test_today_ymd_format() {
        let today = today_ymd();
        assert_eq!(today.len(), 10);
        assert_eq!(&today[4..5], "-");
        assert_eq!(&today[7..8], "-");
    }
}
