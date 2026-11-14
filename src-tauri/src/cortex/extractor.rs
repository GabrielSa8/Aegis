use std::collections::HashSet;
use std::fs;
use std::path::Path;

pub const STOPWORDS: &[&str] = &[
    "para", "como", "este", "esta", "estos", "estas", "pero", "porque", "cuando", "donde",
    "hacer", "hace", "quiero", "puedes", "puede", "solo", "todo", "todos", "toda", "todas",
    "algo", "algun", "alguna", "sobre", "entre", "desde", "hasta", "sin", "con", "por", "una",
    "uno", "unos", "unas", "del", "las", "los", "que", "qué", "cómo", "cuál", "cual", "esto",
    "eso", "aquí", "aqui", "ahora", "bien", "mal", "mas", "más", "menos", "muy", "también",
    "tambien", "otro", "otra", "otros", "otras", "mismo", "misma", "tengo", "tiene", "tienen",
    "vamos", "dale", "revisa", "mira", "crea", "edita", "cambia", "agrega", "quita", "borra",
    "archivo", "archivos", "codigo", "código", "funcion", "función", "error", "falla", "with",
    "from", "that", "this", "have", "what", "when", "where", "which", "into", "your", "explica",
    "explicame", "explícame", "ayuda", "ayudame", "ayúdame", "necesito", "podrias", "podrías",
    "dime", "muestra", "muestrame", "muéstrame", "favor", "hacerlo", "usando", "usar", "nuevo",
    "nueva", "nuevos", "nuevas", "mejor", "forma", "manera", "ejemplo", "parte", "punto",
    "entonces", "ademas", "además", "luego", "despues", "después", "antes", "siempre", "nunca",
    "please", "could", "would", "should", "about", "there", "their", "these", "those",
    "estoy", "estas", "estamos", "estan", "seria", "tener", "puedo", "quieres", "buen", "buena",
    "buenos", "buenas", "viable", "duda", "paso", "pudiste", "cuales", "quien", "hola", "tarde",
    "noche", "noches", "dias", "nuestra", "nuestro", "nuestras", "nuestros", "tuyo", "tuya",
    // Verbos conjugados / imperativos / conversacionales:
    "ejecuta", "ejecuto", "ejecutan", "ejecutado", "eres", "somos", "fueron", "capaz", "capaces",
    "funciona", "funcionan", "funciono", "sirve", "sirven", "pasa", "parece", "creo", "pienso",
    "siento", "vemos", "veo", "dice", "dices", "dijo", "hizo", "hicimos", "hice", "deja", "dejo",
    "dejar", "ponle", "poner", "quitar", "saca", "sacar", "mete", "meter", "lanza", "lanzar",
    "tira", "tirar", "manda", "mandar", "envia", "enviar", "sube", "subir", "baja", "bajar",
    "abre", "abrir", "cierra", "cerrar", "reinicia", "reinicio", "reiniciar", "reiniciarte",
    "actualiza", "actualizar", "prueba", "pruebas", "probar", "valida", "validar", "analiza",
    "analizar", "checa", "checar", "verifica", "verificar", "corrige", "corregir", "arregla",
    "arreglar", "aplica", "aplicar", "implementa", "implementar", "instala", "instalar",
    "compila", "compilar", "construye", "construir", "genera", "generar", "escribe", "escribir",
    "recuerda", " trabajamos", "damos", "correcto", "hacemos", "meterlo", "tenemos", "pendientes",
    "tanto", "anota", "acabo", "ingresar", "detectalo", "copiale", "llamado", "intentar",
    "seleccionar", "seleeccionar", "aparece", "colocar", "mediante", "cierto", "modificalo",
    // Operaciones Git/DevOps y UI genérica que NUNCA son dominios autónomos:
    "commit", "commits", "commitear", "push", "pushear", "pull", "merge", "branch", "branches",
    "rama", "ramas", "release", "releases", "stash", "rebase", "clone", "clonar", "repo",
    "repos", "repositorio", "repositorios", "status", "diff", "fetch", "tag", "tags",
    "juego", "juegos", "ejecutor", "launcher", "boton", "modal", "dock", "barra", "ventana",
    "pantalla", "icono", "mando", "foto", "imagen", "captura", "arreglo", "original", "matriz",
    "contexto", "contextos", "boveda", "nota", "notas", "carpeta", "carpetas", "modelo", "modelos",
    "ia", "motor", "motores", "stack", "rama", "ramas", "fondo", "verdad", "verdaderamente",
    // Términos conversacionales genéricos:
    "perfil", "plantilla", "plantillas", "sesion", "sesión", "instruccion", "instrucción",
    "instrucciones", "prompt", "prompts", "comando", "comandos", "herramienta", "herramientas",
    "cambio", "cambios", "mensaje", "mensajes", "convo", "conversacion", "conversación",
    "pregunta", "preguntas", "respuesta", "respuestas", "intencion", "intención", "accion",
    "tarea", "tareas", "output", "input", "texto", "text", "letra", "letras", "palabra", "palabras",
    "cosa", "cosas", "detalle", "detalles", "problema", "problemas", "solucion", "solución",
    "sistema", "proyecto", "proyectos", "aplicacion", "aplicación", "programa", "estado",
    "tiempo", "veces", "cada", "medio", "arriba", "abajo", "dentro", "fuera", "ultimo", "última",
    "primero", "primera", "segundo", "segunda", "anterior", "siguiente", "actual", "final",
    "inicio", "lista", "listo", "claro", "seguro", "cierto", "igual", "diferente", "posible",
    "imposible", "util", "útil", "inutil", "rara", "raro", "normal", "fijo", "fija", "regla",
    "reglas", "directriz", "directrices", "evoluciona", "funcional", "inteligente", "queremos",
];

const ACTION_VERBS: &[&str] = &[
    "estudiar", "estudio", "aprender", "aprendo", "practicar", "practico", "repasar", "repaso",
    "entender", "comprender", "resolver", "calcular", "analizar", "investigar", "preparar",
    "configurar", "instalar", "implementar", "desarrollar", "programar", "escribir", "generar",
    "mejorar", "optimizar", "corregir", "arreglar", "revisar", "probar", "ejecutar", "iniciar",
    "empezar", "comenzar", "terminar", "continuar", "usar", "utilizar", "aplicar", "construir",
    "disenar", "organizar", "planificar", "resumir", "traducir", "buscar", "encontrar",
    "mostrar", "ocultar", "cambiar", "agregar", "eliminar", "borrar", "crear", "editar",
];

pub fn is_generic_verb(norm: &str) -> bool {
    if ACTION_VERBS.contains(&norm) {
        return true;
    }
    const NOUN_EXCEPTIONS: &[&str] = &[
        "docker", "angular", "elixir", "pulsar", "shader", "router", "server", "cluster",
        "render", "buffer", "driver", "linter", "parser", "worker", "helper", "header",
        "footer", "slider", "drawer", "ledger", "bezier", "fourier", "euler", "tensor",
    ];
    if NOUN_EXCEPTIONS.contains(&norm) {
        return false;
    }
    if norm.len() >= 6 {
        for suffix in &[
            "ar", "er", "ir", "arse", "erse", "irse", "arte", "erte", "irte",
            "ando", "iendo", "ado", "ido", "ados", "idos", "ada", "ida",
        ] {
            if norm.ends_with(suffix) {
                return true;
            }
        }
    }
    false
}

pub fn normalize_word(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            'á' | 'à' | 'ä' => 'a',
            'é' | 'è' | 'ë' => 'e',
            'í' | 'ì' | 'ï' => 'i',
            'ó' | 'ò' | 'ö' => 'o',
            'ú' | 'ù' | 'ü' => 'u',
            _ => c.to_ascii_lowercase(),
        })
        .collect()
}

/// Elimina bloques de código triple-backtick, comentarios JSDoc pegados y URLs antes de extraer señal.
pub fn strip_code_and_noise(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut in_fence = false;
    for line in text.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("```") {
            in_fence = !in_fence;
            continue;
        }
        if in_fence || trimmed.starts_with("/**") || trimmed.starts_with("* ") || trimmed == "*/" {
            continue;
        }
        for token in line.split_whitespace() {
            if token.starts_with("http://")
                || token.starts_with("https://")
                || token.starts_with("git@")
                || token.starts_with('/')
            {
                continue;
            }
            out.push_str(token);
            out.push(' ');
        }
        out.push('\n');
    }
    out
}

/// Detecta si "ingles" o "espanol" se menciona como regla de idioma de código/commits y no como materia de estudio.
fn is_coding_language_mention(norm_text: &str, word: &str) -> bool {
    if word != "ingles" && word != "espanol" {
        return false;
    }
    const CODE_MARKERS: &[&str] = &[
        "commit", "commits", "rama", "ramas", "branch", "merge", "codigo", "backend",
        "frontend", "variables", "comentarios", "repo", "repositorio", "pull request",
    ];
    CODE_MARKERS.iter().any(|m| norm_text.contains(m))
}

/// Descubre dinámicamente dominios/proyectos reales desde la configuración y filesystem sin hardcode.
pub fn discover_known_domains() -> HashSet<String> {
    let mut domains = HashSet::new();
    if let Ok(cfg) = crate::config::get_aegis_config() {
        for repo in cfg.git_repos {
            let id_norm = normalize_word(&repo.id);
            let name_norm = normalize_word(&repo.name);
            if id_norm.len() >= 3 {
                domains.insert(id_norm);
            }
            for part in name_norm.split(|c: char| !c.is_alphanumeric()) {
                if part.len() >= 4 {
                    domains.insert(part.to_string());
                }
            }
            if let Some(base) = Path::new(&repo.path).file_name().and_then(|s| s.to_str()) {
                let b = normalize_word(base);
                if b.len() >= 3 {
                    domains.insert(b);
                }
            }
        }
    }
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let skills_dir = Path::new(&home).join(".agents/skills");
    if let Ok(entries) = fs::read_dir(skills_dir) {
        for e in entries.flatten() {
            let name = e.file_name().to_string_lossy().to_string();
            if let Some(rest) = name.strip_prefix("cortex-") {
                if rest.len() >= 3 {
                    domains.insert(normalize_word(rest));
                }
            }
        }
    }
    domains
}

#[cfg(test)]
pub fn extract_topics(text: &str) -> Vec<(String, &'static str)> {
    extract_topics_with_context(text, None)
}

/// Clasificador de 0 tokens con consciencia de contexto activo y bloqueo de código pegado.
pub fn extract_topics_with_context(
    text: &str,
    context_label: Option<&str>,
) -> Vec<(String, &'static str)> {
    let clean_text = strip_code_and_noise(text);
    let norm_full = normalize_word(&clean_text);
    let mut found: Vec<(String, &'static str)> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    let stop: HashSet<&str> = STOPWORDS.iter().copied().collect();
    let known_domains = discover_known_domains();

    // 0. Si es una directriz/corrección dentro de un contexto de proyecto específico, asociarla al proyecto activo
    if let Some(ctx) = context_label {
        let norm_ctx = normalize_word(ctx.trim());
        if norm_ctx.len() >= 3
            && !matches!(norm_ctx.as_str(), "general" | "global" | "boveda" | "default")
            && (is_directive_or_correction(&clean_text) || norm_full.contains(&norm_ctx))
        {
            if seen.insert(norm_ctx.clone()) {
                found.push((norm_ctx, "Concepto / Dominio"));
            }
        }
    }

    // 1. Términos técnicos explícitos entre `backticks` (excluyendo constantes UPPER_SNAKE_CASE de código)
    for chunk in clean_text.split('`').skip(1).step_by(2) {
        let raw_chunk = chunk.trim();
        let is_screaming_const =
            raw_chunk.contains('_') && raw_chunk.chars().all(|c| !c.is_ascii_lowercase());
        let clean = normalize_word(raw_chunk);
        if !is_screaming_const
            && clean.len() >= 3
            && clean.len() <= 28
            && !clean.contains(char::is_whitespace)
            && !stop.contains(clean.as_str())
            && !is_generic_verb(&clean)
        {
            if seen.insert(clean.clone()) {
                found.push((clean, "Término Explícito"));
            }
        }
    }

    // 2. Extensiones de archivo reales
    const VALID_FILE_EXTS: &[&str] = &[
        "rs", "py", "js", "jsx", "ts", "tsx", "json", "yaml", "yml", "toml", "md", "sql",
        "sh", "bash", "html", "css", "scss", "kt", "kts", "java", "go", "rb", "php", "c",
        "cpp", "h", "hpp", "cs", "swift", "dart", "lua", "pdf", "csv", "xlsx", "proto", "graphql",
    ];
    for token in clean_text.split(|c: char| c.is_whitespace() || ",;()[]{}<>\"'`".contains(c)) {
        if let Some(dot_idx) = token.rfind('.') {
            let name = &token[..dot_idx];
            let ext = normalize_word(&token[dot_idx + 1..]);
            if !name.is_empty() && VALID_FILE_EXTS.contains(&ext.as_str()) {
                let key = format!("ext:.{}", ext);
                if seen.insert(key.clone()) {
                    found.push((key, "Formato / Archivo"));
                }
            }
        }
    }

    // 3. Sustantivos de dominio (descartando constantes pegadas, verbos, stopwords y falsos positivos)
    let mut candidates: Vec<String> = Vec::new();
    for raw in clean_text.split(|c: char| !c.is_alphanumeric() && c != '-' && c != '_') {
        let trimmed = raw.trim_matches(|c: char| c == '-' || c == '_');
        if trimmed.contains('_') {
            continue; // Ignorar identificadores snake_case de código pegado (ej. regex_diacritics)
        }
        let norm = normalize_word(trimmed);
        if norm.len() >= 4
            && norm.len() <= 24
            && !stop.contains(norm.as_str())
            && !is_generic_verb(&norm)
            && !is_coding_language_mention(&norm_full, &norm)
            && norm.chars().any(|c| c.is_alphabetic())
            && !norm.chars().all(|c| c.is_numeric())
            && !norm.ends_with("mente")
        {
            if !candidates.contains(&norm) {
                candidates.push(norm);
            }
        }
    }

    // Priorizar dominios conocidos del usuario y términos compuestos con guión
    candidates.sort_by_key(|w| {
        if known_domains.contains(w) {
            0
        } else if w.contains('-') {
            1
        } else {
            2
        }
    });

    for concept in candidates.into_iter().take(3) {
        if seen.insert(concept.clone()) {
            found.push((concept, "Concepto / Dominio"));
        }
    }

    found
}

/// Detecta si el operador está dictando una regla, restricción o corrección explícita.
pub fn is_directive_or_correction(text: &str) -> bool {
    let norm = normalize_word(text);
    const MARKERS: &[&str] = &[
        "prohibido", "siempre", "nunca", "regla", "directriz", "directrices", "no uses",
        "no hagas", "debe ser", "deberia", "va trabado", "tiene lag", "monolito", "hardcode",
        "en vez de", "corrige", "evita", "obligatorio", "sin usar", "no me gusta",
        "no me convence", "recuerda", "trabajamos en ramas", "solo commits",
    ];
    MARKERS.iter().any(|m| norm.contains(m))
}

/// Asocia el prompt con skills instaladas en `~/.agents/skills/` solo cuando hay mención explícita y unívoca.
pub fn match_installed_skills(text: &str, _active_skills: &[String]) -> Vec<String> {
    let clean = strip_code_and_noise(text);
    let norm = normalize_word(&clean);
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let skills_dir = Path::new(&home).join(".agents/skills");
    let mut matched: Vec<String> = Vec::new();

    const SPECIFIC_DOMAIN_TOKENS: &[&str] = &[
        "obsidian", "playwright", "mermaid", "feynman", "anki", "jetpack", "compose", "tadu",
    ];

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            let slug = entry.file_name().to_string_lossy().to_string();
            if slug.starts_with("cortex-") || !entry.path().join("SKILL.md").exists() {
                continue;
            }
            if slug.contains('-') && norm.contains(&slug) {
                matched.push(slug);
                continue;
            }
            let has_specific = slug
                .split('-')
                .any(|t| SPECIFIC_DOMAIN_TOKENS.contains(&t) && norm.contains(t));
            if has_specific {
                matched.push(slug);
            }
        }
    }

    matched
}
