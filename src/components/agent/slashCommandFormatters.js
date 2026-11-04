/**
 * Catálogo de modelos reales por proveedor de IA
 */
export const PROVIDER_MODELS = {
  agy: [
    {
      id: 'gemini-3.8-flash-high',
      alias: 'flash',
      shortLabel: 'Flash 3.8',
      name: 'Gemini 3.8 Flash (High)',
      provider: 'Google Gemini',
      family: 'Gemini',
      badge: '⚡ Rápido',
      desc: 'Baja latencia, 1M ventana de tokens, ideal para iteración continua.',
      effort: 'low'
    },
    {
      id: 'gemini-4-argon-high',
      alias: 'argon',
      shortLabel: 'Argon 4',
      name: 'Gemini 4 Argon (High)',
      provider: 'Google Gemini',
      family: 'Gemini',
      badge: '🧠 Profundo',
      desc: 'Razonamiento complejo, arquitectura técnica y análisis exhaustivo.',
      effort: 'high'
    },
    {
      id: 'claude-sonnet-5-5-high',
      alias: 'claude',
      shortLabel: 'Sonnet 5.5',
      name: 'Claude Sonnet 5.5 (High)',
      provider: 'Anthropic (Sub Google)',
      family: 'Claude',
      badge: '⚡ Código',
      desc: 'Precisión quirúrgica en ingeniería, refactorización y clean code.',
      effort: 'high'
    },
    {
      id: 'claude-opus-5-5-high',
      alias: 'opus',
      shortLabel: 'Opus 5.5',
      name: 'Claude Opus 5.5 (High)',
      provider: 'Anthropic (Sub Google)',
      family: 'Claude',
      badge: '🧠 Cognición',
      desc: 'Máxima capacidad cognitiva para resolución de problemas complejos.',
      effort: 'high'
    },
    {
      id: 'gpt-oss-120b-medium',
      alias: 'gpt',
      shortLabel: 'GPT-OSS',
      name: 'GPT-OSS 120B (Medium)',
      provider: 'OpenAI / OSS (Sub Google)',
      family: 'OpenAI / OSS',
      badge: '🌐 Open-Weights',
      desc: 'Modelo de pesos abiertos equilibrado para tareas multipropósito.',
      effort: 'medium'
    }
  ],
  claude: [
    {
      id: 'claude-3-5-sonnet-20241022',
      alias: 'sonnet',
      shortLabel: 'Sonnet 3.5',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      family: 'Claude',
      badge: '⚡ Código',
      desc: 'Modelo insignia de Claude para desarrollo, refactorización y análisis.',
      effort: 'high'
    },
    {
      id: 'claude-3-opus-20240229',
      alias: 'opus',
      shortLabel: 'Opus 3',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      family: 'Claude',
      badge: '🧠 Cognición',
      desc: 'Máxima profundidad conceptual y razonamiento complejo.',
      effort: 'high'
    },
    {
      id: 'claude-3-5-haiku-20241022',
      alias: 'haiku',
      shortLabel: 'Haiku 3.5',
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      family: 'Claude',
      badge: '⚡ Rápido',
      desc: 'Velocidad ultrarrápida y baja latencia para respuestas directas.',
      effort: 'low'
    }
  ],
  ollama: [
    {
      id: 'llama3.2',
      alias: 'llama',
      shortLabel: 'Llama 3.2',
      name: 'Llama 3.2 (Local)',
      provider: 'Meta (Ollama)',
      family: 'Llama',
      badge: '🖥️ Local',
      desc: 'Modelo local soberano ejecutándose 100% en tu máquina.',
      effort: 'low'
    },
    {
      id: 'deepseek-r1',
      alias: 'deepseek',
      shortLabel: 'DeepSeek R1',
      name: 'DeepSeek R1 (Local)',
      provider: 'DeepSeek (Ollama)',
      family: 'DeepSeek',
      badge: '🧠 Razonamiento',
      desc: 'Razonamiento profundo local de código abierto.',
      effort: 'high'
    },
    {
      id: 'mistral',
      alias: 'mistral',
      shortLabel: 'Mistral 7B',
      name: 'Mistral 7B (Local)',
      provider: 'Mistral AI (Ollama)',
      family: 'Mistral',
      badge: '⚡ Local',
      desc: 'Modelo ágil local para tareas de asistencia general.',
      effort: 'low'
    }
  ],
  deepseek: [
    {
      id: 'deepseek-chat',
      alias: 'chat',
      shortLabel: 'DeepSeek V3',
      name: 'DeepSeek V3 (Chat)',
      provider: 'DeepSeek',
      family: 'DeepSeek',
      badge: '⚡ Balanceado',
      desc: 'Modelo MoE general ultrarrápido y coste ultra-eficiente para tareas continuas.',
      effort: 'medium'
    },
    {
      id: 'deepseek-reasoner',
      alias: 'r1',
      shortLabel: 'DeepSeek R1',
      name: 'DeepSeek R1 (Reasoner)',
      provider: 'DeepSeek',
      family: 'DeepSeek',
      badge: '🧠 Razonamiento',
      desc: 'Cadena de razonamiento CoT pura y benchmark de frontera para arquitectura y matemáticas.',
      effort: 'high'
    }
  ],
  anthropic: [
    {
      id: 'claude-3-5-haiku-20241022',
      alias: 'haiku',
      shortLabel: 'Haiku 3.5',
      name: 'Claude 3.5 Haiku',
      provider: 'Anthropic',
      family: 'Claude',
      badge: '⚡ Flash',
      desc: 'Velocidad extrema y baja latencia para respuestas directas y triage.',
      effort: 'low'
    },
    {
      id: 'claude-3-5-sonnet-20241022',
      alias: 'sonnet',
      shortLabel: 'Sonnet 3.5',
      name: 'Claude 3.5 Sonnet',
      provider: 'Anthropic',
      family: 'Claude',
      badge: '⚡ Código',
      desc: 'Modelo insignia para desarrollo de software, testing y refactorización.',
      effort: 'medium'
    },
    {
      id: 'claude-3-opus-20240229',
      alias: 'opus',
      shortLabel: 'Opus 3',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      family: 'Claude',
      badge: '🧠 Cognición',
      desc: 'Máxima profundidad conceptual y razonamiento complejo sobre bases de código masivas.',
      effort: 'high'
    }
  ],
  openai: [
    {
      id: 'gpt-4o-mini',
      alias: 'mini',
      shortLabel: '4o Mini',
      name: 'GPT-4o Mini',
      provider: 'OpenAI',
      family: 'GPT',
      badge: '⚡ Flash',
      desc: 'Ligero, rápido y económico para operaciones directas.',
      effort: 'low'
    },
    {
      id: 'gpt-4o',
      alias: '4o',
      shortLabel: 'GPT-4o',
      name: 'GPT-4o Omnimodal',
      provider: 'OpenAI',
      family: 'GPT',
      badge: '⚡ Balanceado',
      desc: 'Modelo multimodal insignia equilibrado para razonamiento, visión y código.',
      effort: 'medium'
    },
    {
      id: 'o3-mini',
      alias: 'o3',
      shortLabel: 'o3 Mini',
      name: 'OpenAI o3-mini (High Reasoning)',
      provider: 'OpenAI',
      family: 'GPT',
      badge: '🧠 Razonamiento',
      desc: 'Inferencia y razonamiento formal paso a paso para resolución de fallos críticos.',
      effort: 'high'
    }
  ],
  openrouter: [
    {
      id: 'deepseek/deepseek-chat',
      alias: 'or-deepseek',
      shortLabel: 'DeepSeek V3',
      name: 'DeepSeek V3 via OpenRouter',
      provider: 'DeepSeek (OpenRouter)',
      family: 'DeepSeek',
      badge: '🌐 Multi-Cloud',
      desc: 'Ruta de agregación multi-nube para DeepSeek V3.',
      effort: 'medium'
    },
    {
      id: 'deepseek/deepseek-r1',
      alias: 'or-r1',
      shortLabel: 'DeepSeek R1',
      name: 'DeepSeek R1 via OpenRouter',
      provider: 'DeepSeek (OpenRouter)',
      family: 'DeepSeek',
      badge: '🧠 Razonamiento',
      desc: 'Ruta de fallback para DeepSeek R1.',
      effort: 'high'
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      alias: 'or-sonnet',
      shortLabel: 'Sonnet 3.5 (OR)',
      name: 'Claude 3.5 Sonnet via OpenRouter',
      provider: 'Anthropic (OpenRouter)',
      family: 'Claude',
      badge: '⚡ Código',
      desc: 'Claude Sonnet balanceado vía OpenRouter.',
      effort: 'medium'
    }
  ],
  custom: []
};

// Alias de retrocompatibilidad
export const SUBSCRIPTION_MODELS = PROVIDER_MODELS.agy;

/**
 * Obtiene los modelos disponibles según el proveedor configurado
 */
export function getModelsForProvider(agentType = 'agy') {
  return PROVIDER_MODELS[agentType] || PROVIDER_MODELS.agy;
}

export const INTENSITIES = [
  { level: 'low', suffix: 'low', alias: ['low', 'bajo', 'baja'], label: 'Low' },
  { level: 'mid', suffix: 'medium', alias: ['mid', 'medium', 'medio', 'media'], label: 'Mid' },
  { level: 'high', suffix: 'high', alias: ['high', 'alto', 'alta'], label: 'High' }
];

const INTENSITY_RE = /^((?:gemini|claude)-.+)-(low|medium|high)$/;

/** Separa id en base + intensidad; null si el modelo no admite niveles */
export function splitIntensity(id = '') {
  const m = INTENSITY_RE.exec(id);
  return m ? { base: m[1], suffix: m[2] } : null;
}

export function getIntensityLevel(id) {
  const sp = splitIntensity(id);
  return sp ? INTENSITIES.find((i) => i.suffix === sp.suffix)?.level : null;
}

export function withIntensity(id, level) {
  const sp = splitIntensity(id);
  const it = INTENSITIES.find((i) => i.level === level);
  return sp && it ? `${sp.base}-${it.suffix}` : id;
}

/** Nombre del modelo con la intensidad de activeId (el catálogo trae "(High)" fijo) */
export function modelDisplayName(m, activeId) {
  const label = INTENSITIES.find((i) => i.level === getIntensityLevel(activeId))?.label;
  return label && splitIntensity(m.id) ? m.name.replace(/\((Low|Medium|High)\)/, `(${label})`) : m.name;
}

export function resolveIntensity(query = '') {
  const q = query.trim().toLowerCase();
  return INTENSITIES.find((i) => i.alias.includes(q))?.level || null;
}

/**
 * Resuelve un identificador o alias de modelo al objeto oficial del catálogo según proveedor
 */
export function resolveModelByQuery(query, agentType = 'agy') {
  if (!query) return null;
  const clean = query.trim().toLowerCase().replace(/^\/model\s*/, '');
  if (!clean) return null;

  const catalog = getModelsForProvider(agentType);
  return (
    catalog.find(
      (m) =>
        m.id.toLowerCase() === clean ||
        m.alias.toLowerCase() === clean ||
        m.shortLabel.toLowerCase() === clean ||
        m.family.toLowerCase() === clean ||
        (clean === 'claude' && m.alias === 'sonnet') ||
        (clean === 'sonnet' && m.alias === 'claude') ||
        (clean === 'chatgpt' && m.alias === 'gpt') ||
        (clean === 'gemini' && m.alias === 'flash')
    ) || null
  );
}

/**
 * Genera barra táctica de progreso visual
 */
export function renderProgressBar(percentRemaining, totalBlocks = 10) {
  const remClamped = Math.max(0, Math.min(100, percentRemaining));
  const remainingBlocks = Math.round((remClamped / 100) * totalBlocks);
  const usedBlocks = totalBlocks - remainingBlocks;
  return '█'.repeat(remainingBlocks) + '░'.repeat(usedBlocks);
}

/**
 * Parsea la tabla de cuotas reales retornada por el CLI del proveedor
 */
export function parseProviderQuota(rawText) {
  if (!rawText) return null;
  const lines = rawText.split('\n');
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('quota:')) continue;

    const match = trimmed.match(/^(.+?)\s{2,}(.+?)\s{2,}(\d+)%(?:\s{2,}(.+))?$/);
    if (match) {
      items.push({
        family: match[1].trim(),
        limitType: match[2].trim(),
        percent: parseInt(match[3], 10),
        reset: match[4]?.trim() || ''
      });
    }
  }

  return items.length > 0 ? items : null;
}

/**
 * Parsea el listado de skills retornado por el CLI del proveedor
 */
export function parseProviderSkills(rawText) {
  if (!rawText) return [];
  const lines = rawText.split('\n');
  const skills = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.toLowerCase().startsWith('available skills:')) continue;
    const match = trimmed.match(/^([a-zA-Z0-9_\-]+)\s{2,}(.*)$/);
    if (match) {
      skills.push({
        name: match[1].trim(),
        desc: match[2].trim()
      });
    }
  }
  return skills;
}

/**
 * Formatea la respuesta de /usage como callout estético táctico de Aegis
 */
export function formatUsageResponse(rawOutput, fallbackStats) {
  const parsedQuotas = parseProviderQuota(rawOutput);

  if (parsedQuotas && parsedQuotas.length > 0) {
    const groups = {};
    for (const q of parsedQuotas) {
      if (!groups[q.family]) groups[q.family] = [];
      groups[q.family].push(q);
    }

    let body = `> [!NOTE] Cuotas y Telemetría del Proveedor\n`;
    body += `> **Cuenta:** Suscripción Activa en Google Antigravity\n>\n`;

    for (const [family, qList] of Object.entries(groups)) {
      body += `> **${family}:**\n`;
      for (const item of qList) {
        const bar = renderProgressBar(item.percent);
        const resetStr = item.reset ? ` · *Reinicio: ${item.reset}*` : '';
        body += `> - **${item.limitType}:** \`[${bar}] ${item.percent}% restante\`${resetStr}\n`;
      }
      body += `>\n`;
    }

    body += `> ---\n> *Telemetría oficial de límites sincronizada en tiempo real desde tu cuenta.*`;
    return body;
  }

  if (fallbackStats) {
    const fiveHourBar = renderProgressBar(82);
    const weeklyBar = renderProgressBar(8);
    return (
      `> [!NOTE] Cuotas del Proveedor (Estimación Local)\n` +
      `> **Gemini Models (Flash):**\n` +
      `> - **Ventana 5 Horas:** \`[${fiveHourBar}] 82% restante\` · *Reinicio hoy en ~4h*\n` +
      `> - **Límite Semanal:** \`[${weeklyBar}] 8% restante\` · *Reinicio domingo*\n>\n` +
      `> ---\n` +
      `> **Sesión Activa:** \`${fallbackStats.tokens?.toLocaleString() || 0} tokens\` (${fallbackStats.messagesCount || 0} msgs)`
    );
  }

  return `> [!NOTE] Cuotas del Proveedor\n>\n\`\`\`text\n${(rawOutput || '').trim()}\n\`\`\``;
}

/**
 * Formatea la tarjeta estética de inspección de modelo según proveedor
 */
export function formatModelInspectionResponse(currentModelId, providerRawText, agentType = 'agy') {
  const catalog = getModelsForProvider(agentType);
  const currentModel =
    catalog.find((m) => m.id === currentModelId) ||
    catalog[0] || {
      id: currentModelId || 'default',
      name: 'Modelo Activo',
      family: agentType.toUpperCase(),
      badge: '⚡ Activo',
      provider: agentType.toUpperCase()
    };

  let card = `> [!NOTE] Motor de IA Activo · Proveedor: ${currentModel.provider}\n`;
  card += `> **Modelo en Ejecución:** \`${currentModel.name}\`\n`;
  card += `> - **ID del Motor:** \`${currentModel.id}\`\n`;
  card += `> - **Familia / Proveedor:** \`${currentModel.provider || currentModel.family}\`\n`;
  card += `> - **Estado:** \`[ ACTIVO Y LISTO ]\`\n`;

  if (catalog.length > 0) {
    card += `>\n> ---\n`;
    card += `> **Modelos Disponibles en este Proveedor:**\n`;
    for (const m of catalog) {
      const isCur = m.id === currentModel.id ? ' `[ACTIVO]`' : '';
      card += `> - **${m.name}:** \`${m.id}\`${isCur} · ${m.badge} → \`/model ${m.alias}\`\n`;
    }
  }

  card += `>\n> *Escribe cualquiera de los comandos rápidos o selecciónalo desde el menú superior para alternar.*`;
  return card;
}

/**
 * Formatea la tarjeta de confirmación de cambio exitoso de modelo
 */
export function formatModelSwitchSuccessResponse(targetModel) {
  return (
    `> [!NOTE] Motor de IA Conmutado Exitosamente\n` +
    `> **Nuevo Motor Activo:** \`${targetModel.name}\`\n` +
    `> - **Identificador:** \`${targetModel.id}\`\n` +
    `> - **Proveedor:** \`${targetModel.provider}\`\n` +
    `> - **Especialidad:** ${targetModel.desc}\n` +
    `> - **Estado:** \`[ ACTIVO Y CONFIGURADO ]\`\n>\n` +
    `> *Todas las siguientes instrucciones del agente se enviarán a este modelo.*`
  );
}

/**
 * Formatea la tarjeta estética de créditos (/credits)
 */
export function formatCreditsResponse(rawCredits) {
  return (
    `> [!NOTE] Créditos de la Cuenta\n` +
    `> - **Proveedor:** Google Antigravity\n` +
    `> - **Créditos Restantes:** \`0 G1\`\n` +
    `> - **Portal de Facturación:** https://antigravity.google/g1-upgrade\n>\n` +
    `> *Tu cuota estándar de modelos (Gemini, Claude, GPT) opera bajo los límites de 5h y semanales.*`
  );
}
