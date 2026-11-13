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
    "estoy", "estas", "estamos", "estan", "seria", "tener", "puedo", "quieres",
    "buen", "buena", "buenos", "buenas", "viable", "duda", "paso", "pudiste",
    "cuales", "quien", "hola", "tarde", "noche", "noches", "dias",
    // Verbos conjugados / imperativos / auxiliares / adjetivos conversacionales que NUNCA son dominios:
    "ejecuta", "ejecuto", "ejecutan", "ejecutado", "eres", "somos", "fueron", "capaz", "capaces",
    "funciona", "funcionan", "funciono", "sirve", "sirven", "pasa", "paso", "parece", "creo",
    "pienso", "siento", "vemos", "veo", "dice", "dices", "dijo", "hizo", "hicimos", "hice",
    "deja", "dejo", "dejar", "ponle", "poner", "quita", "quitar", "saca", "sacar", "mete", "meter",
    "lanza", "lanzar", "tira", "tirar", "manda", "mandar", "envia", "enviar", "sube", "subir",
    "baja", "bajar", "abre", "abrir", "cierra", "cerrar", "reinicia", "reinicio", "reiniciar",
    "reiniciarte", "actualiza", "actualizar", "prueba", "pruebas", "probar", "valida", "validar",
    "analiza", "analizar", "checa", "checar", "verifica", "verificar", "corrige", "corregir",
    "arregla", "arreglar", "aplica", "aplicar", "implementa", "implementar", "instala", "instalar",
    "compila", "compilar", "construye", "construir", "genera", "generar", "escribe", "escribir",
    // Términos conversacionales genéricos que NUNCA deben crear skills autónomas:
    "perfil", "plantilla", "plantillas", "sesion", "sesión", "instruccion", "instrucción",
    "instrucciones", "prompt", "prompts", "comando", "comandos", "herramienta", "herramientas",
    "cambio", "cambios", "mensaje", "mensajes", "convo", "conversacion", "conversación",
    "pregunta", "preguntas", "respuesta", "respuestas", "intencion", "intención", "accion", "acción",
    "tarea", "tareas", "output", "input", "texto", "text", "letra", "letras", "palabra", "palabras",
    "cosa", "cosas", "detalle", "detalles", "problema", "problemas", "solucion", "solución",
    "sistema", "proyecto", "proyectos", "aplicacion", "aplicación", "programa", "estado",
    "tiempo", "veces", "cada", "medio", "arriba", "abajo", "dentro", "fuera", "ultimo", "última",
    "primero", "primera", "segundo", "segunda", "anterior", "siguiente", "actual", "final",
    "inicio", "lista", "listo", "claro", "seguro", "cierto", "verdad", "igual", "diferente",
    "posible", "imposible", "util", "útil", "inutil", "rara", "raro", "normal", "fijo", "fija",
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
    // Infinitivos (-ar, -er, -ir), reflexivos (-arse, -erse, -irse, -arte, -erte, -irte) y participios (-ado, -ido)
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

/// Clasificador universal de 0 tokens (agnóstico de dominio: software, estudios, cocina, finanzas, etc.).
pub fn extract_topics(text: &str) -> Vec<(String, &'static str)> {
    let mut found: Vec<(String, &'static str)> = Vec::new();
    let mut seen: HashSet<String> = HashSet::new();
    let stop: HashSet<&str> = STOPWORDS.iter().copied().collect();

    // 1. Notas [[Nota]] o términos técnicos explícitos entre `backticks`
    for chunk in text.split('`').skip(1).step_by(2) {
        let clean = normalize_word(chunk.trim());
        if clean.len() >= 3
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

    // 2. Extensiones de archivo reales (lista blanca curada para evitar falsos positivos de métodos como .push/.map/.com)
    const VALID_FILE_EXTS: &[&str] = &[
        "rs", "py", "js", "jsx", "ts", "tsx", "json", "yaml", "yml", "toml", "md", "sql",
        "sh", "bash", "html", "css", "scss", "kt", "kts", "java", "go", "rb", "php", "c",
        "cpp", "h", "hpp", "cs", "swift", "dart", "lua", "r", "pdf", "csv", "xlsx", "xls",
        "doc", "docx", "txt", "xml", "svg", "png", "jpg", "jpeg", "webp", "mp3", "mp4",
        "wav", "ino", "dockerfile", "lock", "env", "conf", "ini", "cfg", "proto", "graphql",
    ];
    for token in text.split(|c: char| c.is_whitespace() || ",;()[]{}<>\"'`".contains(c)) {
        if let Some(dot_idx) = token.rfind('.') {
            let name = &token[..dot_idx];
            let ext = normalize_word(&token[dot_idx + 1..]);
            if !name.is_empty()
                && VALID_FILE_EXTS.contains(&ext.as_str())
                && !name.contains("http")
                && !name.contains("www")
            {
                let key = format!("ext:.{}", ext);
                if seen.insert(key.clone()) {
                    found.push((key, "Formato / Archivo"));
                }
            }
        }
    }

    // 3. Extracción limpia de sustantivos de dominio (descartando stopwords, verbos y conjugaciones)
    let mut candidates: Vec<String> = Vec::new();
    for raw in text.split(|c: char| !c.is_alphanumeric() && c != '-' && c != '_') {
        let trimmed = raw.trim_matches(|c: char| c == '-' || c == '_');
        let norm = normalize_word(trimmed);
        if norm.len() >= 4
            && norm.len() <= 26
            && !stop.contains(norm.as_str())
            && !STOPWORDS.contains(&trimmed.to_lowercase().as_str())
            && !is_generic_verb(&norm)
            && norm.chars().any(|c| c.is_alphabetic())
            && !norm.chars().all(|c| c.is_numeric())
            && !norm.ends_with("mente")
        {
            if !candidates.contains(&norm) {
                candidates.push(norm);
            }
        }
    }

    // Priorizar términos compuestos (con guión/underscore)
    candidates.sort_by_key(|w| {
        let has_sep = w.contains('-') || w.contains('_');
        if has_sep { 0 } else { 1 }
    });

    // Registrar hasta 4 sustantivos de alta señal por turno (antes 6, reduciendo dispersión)
    for concept in candidates.into_iter().take(4) {
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
        "en vez de", "corrige", "evita", "obligatorio", "sin usar", "no me gusta", "no me convence",
    ];
    MARKERS.iter().any(|m| norm.contains(m))
}

/// Asocia el prompt con skills instaladas en `~/.agents/skills/` únicamente si hay coincidencia semántica real.
pub fn match_installed_skills(text: &str, _active_skills: &[String]) -> Vec<String> {
    let norm = normalize_word(text);
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
    let skills_dir = Path::new(&home).join(".agents/skills");
    let mut matched: Vec<String> = Vec::new();

    // Palabras demasiado genéricas en slugs de skills que NO deben disparar match por sí solas
    const GENERIC_SKILL_TOKENS: &[&str] = &[
        "patterns", "mentor", "generator", "practitioner", "skills", "skill", "find",
        "create", "update", "code", "clean", "design", "input", "filter", "optimization",
        "project", "router", "evolver", "guide", "help", "stats", "review", "commit",
    ];

    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            let slug = entry.file_name().to_string_lossy().to_string();
            if slug.starts_with("cortex-") || !entry.path().join("SKILL.md").exists() {
                continue;
            }
            // Coincidencia exacta del slug completo en el texto
            if norm.contains(&slug) {
                matched.push(slug);
                continue;
            }
            // Coincidencia de token específico de dominio (ej. "obsidian", "tadu", "caveman", "playwright", "mermaid")
            let specific_tokens: Vec<&str> = slug
                .split('-')
                .filter(|t| t.len() >= 5 && !GENERIC_SKILL_TOKENS.contains(t))
                .collect();
            if !specific_tokens.is_empty() && specific_tokens.iter().any(|tk| norm.contains(tk)) {
                matched.push(slug);
            }
        }
    }

    matched
}
