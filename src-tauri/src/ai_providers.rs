use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Definición de un modelo IA individual dentro de un tier
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderModelInfo {
    pub id: String,
    pub alias: String,
    pub short_label: String,
    pub name: String,
    pub provider: String,
    pub family: String,
    pub tier: String, // "flash" | "balanced" | "deep" | "reasoning"
    pub badge: String,
    pub desc: String,
    pub effort: Option<String>,
}

/// Metadatos y tiers de un proveedor de IA
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderCatalog {
    pub id: String,
    pub name: String,
    pub category: String, // "cli" | "cloud" | "local" | "custom"
    pub requires_api_key: bool,
    pub env_key_name: Option<String>,
    pub billing_url: Option<String>,
    pub models: Vec<ProviderModelInfo>,
}

/// Clave de API almacenada de forma soberana
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredApiKey {
    pub provider_id: String,
    pub masked_key: String,
    pub is_set: bool,
    pub source: String, // "settings" | "env" | "cli"
}

/// Retorna el catálogo dinámico de motores y tiers nativos
pub fn get_all_providers_catalog() -> Vec<ProviderCatalog> {
    vec![
        ProviderCatalog {
            id: "agy".to_string(),
            name: "Google Antigravity CLI (agy)".to_string(),
            category: "cli".to_string(),
            requires_api_key: false,
            env_key_name: Some("GEMINI_API_KEY".to_string()),
            billing_url: Some("https://aistudio.google.com/app/plan_information".to_string()),
            models: vec![
                ProviderModelInfo {
                    id: "gemini-3.8-flash-high".to_string(),
                    alias: "flash".to_string(),
                    short_label: "Flash 3.8".to_string(),
                    name: "Gemini 3.8 Flash (High)".to_string(),
                    provider: "Google Gemini".to_string(),
                    family: "Gemini".to_string(),
                    tier: "flash".to_string(),
                    badge: "⚡ Flash".to_string(),
                    desc: "Baja latencia, 1M ventana de tokens, ideal para iteración continua.".to_string(),
                    effort: Some("low".to_string()),
                },
                ProviderModelInfo {
                    id: "gemini-4-argon-high".to_string(),
                    alias: "argon".to_string(),
                    short_label: "Argon 4".to_string(),
                    name: "Gemini 4 Argon (High)".to_string(),
                    provider: "Google Gemini".to_string(),
                    family: "Gemini".to_string(),
                    tier: "deep".to_string(),
                    badge: "🧠 Profundo".to_string(),
                    desc: "Razonamiento complejo, arquitectura técnica y análisis exhaustivo.".to_string(),
                    effort: Some("high".to_string()),
                },
                ProviderModelInfo {
                    id: "claude-sonnet-5-5-high".to_string(),
                    alias: "claude".to_string(),
                    short_label: "Sonnet 5.5".to_string(),
                    name: "Claude Sonnet 5.5 (High)".to_string(),
                    provider: "Anthropic (Sub Google)".to_string(),
                    family: "Claude".to_string(),
                    tier: "balanced".to_string(),
                    badge: "⚡ Código".to_string(),
                    desc: "Precisión quirúrgica en ingeniería, refactorización y clean code.".to_string(),
                    effort: Some("high".to_string()),
                },
                ProviderModelInfo {
                    id: "claude-opus-5-5-high".to_string(),
                    alias: "opus".to_string(),
                    short_label: "Opus 5.5".to_string(),
                    name: "Claude Opus 5.5 (High)".to_string(),
                    provider: "Anthropic (Sub Google)".to_string(),
                    family: "Claude".to_string(),
                    tier: "reasoning".to_string(),
                    badge: "🧠 Razonamiento".to_string(),
                    desc: "Máxima capacidad cognitiva para resolución de problemas complejos.".to_string(),
                    effort: Some("high".to_string()),
                },
                ProviderModelInfo {
                    id: "gpt-oss-120b-medium".to_string(),
                    alias: "gpt".to_string(),
                    short_label: "GPT-OSS".to_string(),
                    name: "GPT-OSS 120B (Medium)".to_string(),
                    provider: "OpenAI / OSS (Sub Google)".to_string(),
                    family: "OpenAI / OSS".to_string(),
                    tier: "balanced".to_string(),
                    badge: "🌐 Open-Weights".to_string(),
                    desc: "Modelo de pesos abiertos equilibrado para tareas multipropósito.".to_string(),
                    effort: Some("medium".to_string()),
                },
            ],
        },
        ProviderCatalog {
            id: "deepseek".to_string(),
            name: "DeepSeek (Oficial / API Soberana)".to_string(),
            category: "cloud".to_string(),
            requires_api_key: true,
            env_key_name: Some("DEEPSEEK_API_KEY".to_string()),
            billing_url: Some("https://platform.deepseek.com/usage".to_string()),
            models: vec![
                ProviderModelInfo {
                    id: "deepseek-chat".to_string(),
                    alias: "chat".to_string(),
                    short_label: "DeepSeek V3".to_string(),
                    name: "DeepSeek V3 (Chat)".to_string(),
                    provider: "DeepSeek".to_string(),
                    family: "DeepSeek".to_string(),
                    tier: "balanced".to_string(),
                    badge: "⚡ Balanceado".to_string(),
                    desc: "Modelo MoE general ultrarrápido y coste ultra-eficiente para tareas continuas.".to_string(),
                    effort: Some("medium".to_string()),
                },
                ProviderModelInfo {
                    id: "deepseek-reasoner".to_string(),
                    alias: "r1".to_string(),
                    short_label: "DeepSeek R1".to_string(),
                    name: "DeepSeek R1 (Reasoner)".to_string(),
                    provider: "DeepSeek".to_string(),
                    family: "DeepSeek".to_string(),
                    tier: "reasoning".to_string(),
                    badge: "🧠 Razonamiento".to_string(),
                    desc: "Cadena de razonamiento CoT pura y benchmark de frontera para arquitectura y matemáticas.".to_string(),
                    effort: Some("high".to_string()),
                },
            ],
        },
        ProviderCatalog {
            id: "anthropic".to_string(),
            name: "Anthropic Claude (Nativo)".to_string(),
            category: "cloud".to_string(),
            requires_api_key: true,
            env_key_name: Some("ANTHROPIC_API_KEY".to_string()),
            billing_url: Some("https://console.anthropic.com/settings/plans".to_string()),
            models: vec![
                ProviderModelInfo {
                    id: "claude-3-5-haiku-20241022".to_string(),
                    alias: "haiku".to_string(),
                    short_label: "Haiku 3.5".to_string(),
                    name: "Claude 3.5 Haiku".to_string(),
                    provider: "Anthropic".to_string(),
                    family: "Claude".to_string(),
                    tier: "flash".to_string(),
                    badge: "⚡ Flash".to_string(),
                    desc: "Velocidad extrema y baja latencia para respuestas directas y triage.".to_string(),
                    effort: Some("low".to_string()),
                },
                ProviderModelInfo {
                    id: "claude-3-5-sonnet-20241022".to_string(),
                    alias: "sonnet".to_string(),
                    short_label: "Sonnet 3.5".to_string(),
                    name: "Claude 3.5 Sonnet".to_string(),
                    provider: "Anthropic".to_string(),
                    family: "Claude".to_string(),
                    tier: "balanced".to_string(),
                    badge: "⚡ Código".to_string(),
                    desc: "Modelo insignia para desarrollo de software, testing y refactorización.".to_string(),
                    effort: Some("medium".to_string()),
                },
                ProviderModelInfo {
                    id: "claude-3-opus-20240229".to_string(),
                    alias: "opus".to_string(),
                    short_label: "Opus 3".to_string(),
                    name: "Claude 3 Opus".to_string(),
                    provider: "Anthropic".to_string(),
                    family: "Claude".to_string(),
                    tier: "deep".to_string(),
                    badge: "🧠 Cognición".to_string(),
                    desc: "Máxima profundidad conceptual y razonamiento complejo sobre bases de código masivas.".to_string(),
                    effort: Some("high".to_string()),
                },
            ],
        },
        ProviderCatalog {
            id: "openai".to_string(),
            name: "OpenAI (Nativo)".to_string(),
            category: "cloud".to_string(),
            requires_api_key: true,
            env_key_name: Some("OPENAI_API_KEY".to_string()),
            billing_url: Some("https://platform.openai.com/usage".to_string()),
            models: vec![
                ProviderModelInfo {
                    id: "gpt-4o-mini".to_string(),
                    alias: "mini".to_string(),
                    short_label: "4o Mini".to_string(),
                    name: "GPT-4o Mini".to_string(),
                    provider: "OpenAI".to_string(),
                    family: "GPT".to_string(),
                    tier: "flash".to_string(),
                    badge: "⚡ Flash".to_string(),
                    desc: "Ligero, rápido y económico para operaciones directas.".to_string(),
                    effort: Some("low".to_string()),
                },
                ProviderModelInfo {
                    id: "gpt-4o".to_string(),
                    alias: "4o".to_string(),
                    short_label: "GPT-4o".to_string(),
                    name: "GPT-4o Omnimodal".to_string(),
                    provider: "OpenAI".to_string(),
                    family: "GPT".to_string(),
                    tier: "balanced".to_string(),
                    badge: "⚡ Balanceado".to_string(),
                    desc: "Modelo multimodal insignia equilibrado para razonamiento, visión y código.".to_string(),
                    effort: Some("medium".to_string()),
                },
                ProviderModelInfo {
                    id: "o3-mini".to_string(),
                    alias: "o3".to_string(),
                    short_label: "o3 Mini".to_string(),
                    name: "OpenAI o3-mini (High Reasoning)".to_string(),
                    provider: "OpenAI".to_string(),
                    family: "GPT".to_string(),
                    tier: "reasoning".to_string(),
                    badge: "🧠 Razonamiento".to_string(),
                    desc: "Inferencia y razonamiento formal paso a paso para resolución de fallos críticos.".to_string(),
                    effort: Some("high".to_string()),
                },
            ],
        },
        ProviderCatalog {
            id: "openrouter".to_string(),
            name: "OpenRouter (Multi-Proveedor Agregado)".to_string(),
            category: "cloud".to_string(),
            requires_api_key: true,
            env_key_name: Some("OPENROUTER_API_KEY".to_string()),
            billing_url: Some("https://openrouter.ai/credits".to_string()),
            models: vec![
                ProviderModelInfo {
                    id: "deepseek/deepseek-chat".to_string(),
                    alias: "or-deepseek".to_string(),
                    short_label: "DeepSeek V3".to_string(),
                    name: "DeepSeek V3 via OpenRouter".to_string(),
                    provider: "DeepSeek (OpenRouter)".to_string(),
                    family: "DeepSeek".to_string(),
                    tier: "balanced".to_string(),
                    badge: "🌐 Multi-Cloud".to_string(),
                    desc: "Ruta de agregación multi-nube para DeepSeek V3.".to_string(),
                    effort: Some("medium".to_string()),
                },
                ProviderModelInfo {
                    id: "deepseek/deepseek-r1".to_string(),
                    alias: "or-r1".to_string(),
                    short_label: "DeepSeek R1".to_string(),
                    name: "DeepSeek R1 via OpenRouter".to_string(),
                    provider: "DeepSeek (OpenRouter)".to_string(),
                    family: "DeepSeek".to_string(),
                    tier: "reasoning".to_string(),
                    badge: "🧠 Razonamiento".to_string(),
                    desc: "Ruta de fallback para DeepSeek R1.".to_string(),
                    effort: Some("high".to_string()),
                },
                ProviderModelInfo {
                    id: "anthropic/claude-3.5-sonnet".to_string(),
                    alias: "or-sonnet".to_string(),
                    short_label: "Sonnet 3.5 (OR)".to_string(),
                    name: "Claude 3.5 Sonnet via OpenRouter".to_string(),
                    provider: "Anthropic (OpenRouter)".to_string(),
                    family: "Claude".to_string(),
                    tier: "balanced".to_string(),
                    badge: "⚡ Código".to_string(),
                    desc: "Claude Sonnet balanceado vía OpenRouter.".to_string(),
                    effort: Some("medium".to_string()),
                },
            ],
        },
        ProviderCatalog {
            id: "ollama".to_string(),
            name: "Ollama (Local / Soberano)".to_string(),
            category: "local".to_string(),
            requires_api_key: false,
            env_key_name: None,
            billing_url: None,
            models: vec![
                ProviderModelInfo {
                    id: "llama3.2".to_string(),
                    alias: "llama".to_string(),
                    short_label: "Llama 3.2".to_string(),
                    name: "Llama 3.2 (Local)".to_string(),
                    provider: "Meta (Ollama)".to_string(),
                    family: "Llama".to_string(),
                    tier: "flash".to_string(),
                    badge: "🖥️ Local".to_string(),
                    desc: "Modelo soberano local ultra-rápido ejecutándose 100% en host.".to_string(),
                    effort: Some("low".to_string()),
                },
                ProviderModelInfo {
                    id: "deepseek-r1".to_string(),
                    alias: "deepseek".to_string(),
                    short_label: "DeepSeek R1 Local".to_string(),
                    name: "DeepSeek R1 (Ollama Local)".to_string(),
                    provider: "DeepSeek (Ollama)".to_string(),
                    family: "DeepSeek".to_string(),
                    tier: "reasoning".to_string(),
                    badge: "🧠 Local CoT".to_string(),
                    desc: "Razonamiento profundo local de pesos abiertos sin salida a red.".to_string(),
                    effort: Some("high".to_string()),
                },
                ProviderModelInfo {
                    id: "mistral".to_string(),
                    alias: "mistral".to_string(),
                    short_label: "Mistral 7B".to_string(),
                    name: "Mistral 7B (Local)".to_string(),
                    provider: "Mistral AI (Ollama)".to_string(),
                    family: "Mistral".to_string(),
                    tier: "balanced".to_string(),
                    badge: "⚡ Local".to_string(),
                    desc: "Modelo ágil local para asistencia general y código rápido.".to_string(),
                    effort: Some("medium".to_string()),
                },
            ],
        },
        ProviderCatalog {
            id: "custom".to_string(),
            name: "Comando Shell Personalizado".to_string(),
            category: "custom".to_string(),
            requires_api_key: false,
            env_key_name: None,
            billing_url: None,
            models: vec![],
        },
    ]
}

/// Helper para enmascarar keys (ej: `sk-ant...8f3a`)
pub fn mask_key(key: &str) -> String {
    let clean = key.trim();
    if clean.is_empty() {
        return "".to_string();
    }
    if clean.len() <= 8 {
        return "********".to_string();
    }
    let start = &clean[..4];
    let end = &clean[clean.len() - 4..];
    format!("{}...{}", start, end)
}

#[tauri::command]
pub fn get_ai_providers() -> Result<Vec<ProviderCatalog>, String> {
    Ok(get_all_providers_catalog())
}

#[tauri::command]
pub fn get_api_credentials() -> Result<HashMap<String, StoredApiKey>, String> {
    let cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let catalog = get_all_providers_catalog();
    let mut result = HashMap::new();

    for prov in catalog {
        let env_val = prov
            .env_key_name
            .as_ref()
            .and_then(|k| std::env::var(k).ok())
            .filter(|v| !v.trim().is_empty());

        let cfg_val = cfg.api_keys.get(&prov.id).cloned().filter(|v| !v.trim().is_empty());

        if let Some(c_key) = cfg_val {
            result.insert(
                prov.id.clone(),
                StoredApiKey {
                    provider_id: prov.id,
                    masked_key: mask_key(&c_key),
                    is_set: true,
                    source: "settings".to_string(),
                },
            );
        } else if let Some(e_key) = env_val {
            result.insert(
                prov.id.clone(),
                StoredApiKey {
                    provider_id: prov.id,
                    masked_key: mask_key(&e_key),
                    is_set: true,
                    source: "env".to_string(),
                },
            );
        } else {
            result.insert(
                prov.id.clone(),
                StoredApiKey {
                    provider_id: prov.id,
                    masked_key: "".to_string(),
                    is_set: false,
                    source: "none".to_string(),
                },
            );
        }
    }

    Ok(result)
}

#[tauri::command]
pub fn save_provider_api_key(provider_id: String, api_key: String) -> Result<(), String> {
    let mut cfg = crate::config::get_aegis_config().unwrap_or_else(|_| crate::config::default_config());
    let clean = api_key.trim().to_string();

    if clean.is_empty() {
        cfg.api_keys.remove(&provider_id);
    } else {
        cfg.api_keys.insert(provider_id, clean);
    }

    crate::config::save_aegis_config(cfg)?;
    Ok(())
}
