// Paleta Curada Táctica Nórdica Universal (10 Colores Armónicos de Alta Legibilidad)
export const NORDIC_PALETTE = [
  { id: 'emerald', name: 'Esmeralda', color: '#10b981', border: 'rgba(16, 185, 129, 0.4)', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'sky', name: 'Cielo', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)', bg: 'rgba(56, 189, 248, 0.12)' },
  { id: 'amber', name: 'Ámbar', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'purple', name: 'Púrpura', color: '#a855f7', border: 'rgba(168, 85, 247, 0.4)', bg: 'rgba(168, 85, 247, 0.12)' },
  { id: 'pink', name: 'Rosa', color: '#ec4899', border: 'rgba(236, 72, 153, 0.4)', bg: 'rgba(236, 72, 153, 0.12)' },
  { id: 'teal', name: 'Verde Mar', color: '#14b8a6', border: 'rgba(20, 184, 166, 0.4)', bg: 'rgba(20, 184, 166, 0.12)' },
  { id: 'indigo', name: 'Índigo', color: '#6366f1', border: 'rgba(99, 102, 241, 0.4)', bg: 'rgba(99, 102, 241, 0.12)' },
  { id: 'orange', name: 'Naranja', color: '#f97316', border: 'rgba(249, 115, 22, 0.4)', bg: 'rgba(249, 115, 22, 0.12)' },
  { id: 'yellow', name: 'Dorado', color: '#eab308', border: 'rgba(234, 179, 8, 0.4)', bg: 'rgba(234, 179, 8, 0.12)' },
  { id: 'violet', name: 'Violeta', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.4)', bg: 'rgba(139, 92, 246, 0.12)' },
];

// Emojis Curados para Selección Rápida en el Personalizador
export const CURATED_EMOJIS = [
  '🛡️', '🚕', '📱', '📦', '💻', '🧠', '⚡', '🚀',
  '📚', '🎮', '☁️', '💼', '🔬', '🛠️', '🎨', '📊',
  '🎯', '🏋️', '💰', '🏠', '🌐', '📝', '🤖', '🔑',
  '☕', '💡', '🔥', '🧪', '📋', '📈', '🕹️', '🎧',
  '🚗', '🛵', '🔧', '🩺', '🧩', '💎', '📡', '🌍'
];

export const STORAGE_CUSTOM_KEY = 'aegis_task_customizations';
export const STORAGE_MATRIX_KEY = 'aegis_matrix_quadrant_config';

// Presets base (fallback si no hay personalización explícita del usuario)
export const DEFAULT_PRESETS = {
  'Aegis': { icon: '🛡️', colorId: 'emerald' },
};

// Generador determinista de color basado en hash de texto para cualquier proyecto desconocido
export function hashStringToPalette(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NORDIC_PALETTE.length;
  return NORDIC_PALETTE[index];
}

// Extractor de emoji al inicio del nombre de una nota o carpeta
export function extractLeadingEmoji(str) {
  const match = str.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*/u);
  if (match) {
    return { emoji: match[1], cleanStr: str.slice(match[0].length).trim() };
  }
  return { emoji: null, cleanStr: str };
}

// Extractor dinámico y agnóstico de Proyecto/Módulo según la estructura de carpetas de cualquier Bóveda
export function getTaskProject(t) {
  const cleanName = t.file_name.replace(/\.md$/i, '').trim();
  const parts = t.relative_path.split('/');

  if (parts.length > 2) {
    const parentDir = parts[parts.length - 2];
    if (parentDir && parentDir !== parts[0] && /^(readme|index|skill|moc|nota|general)$/i.test(cleanName)) {
      return parentDir;
    }
  }

  return cleanName;
}

// Resuelve tema visual de un proyecto: Personalización > Emoji en Título > Preset > Hash Automático
export function resolveProjectTheme(projectName, customizations) {
  if (customizations && customizations[projectName]) {
    const custom = customizations[projectName];
    const palette = NORDIC_PALETTE.find((p) => p.id === custom.colorId) || hashStringToPalette(projectName);
    return {
      icon: custom.icon || '📁',
      color: palette.color,
      border: palette.border,
      bg: palette.bg
    };
  }

  const extracted = extractLeadingEmoji(projectName);
  if (extracted.emoji) {
    const palette = hashStringToPalette(extracted.cleanStr);
    return {
      icon: extracted.emoji,
      color: palette.color,
      border: palette.border,
      bg: palette.bg
    };
  }

  if (DEFAULT_PRESETS[projectName]) {
    const preset = DEFAULT_PRESETS[projectName];
    const palette = NORDIC_PALETTE.find((p) => p.id === preset.colorId) || hashStringToPalette(projectName);
    return {
      icon: preset.icon,
      color: palette.color,
      border: palette.border,
      bg: palette.bg
    };
  }

  if (projectName.startsWith('Skill:')) {
    const palette = NORDIC_PALETTE.find((p) => p.id === 'teal') || hashStringToPalette(projectName);
    return {
      icon: '⚡',
      color: palette.color,
      border: palette.border,
      bg: palette.bg
    };
  }

  const palette = hashStringToPalette(projectName);
  return {
    icon: '📁',
    color: palette.color,
    border: palette.border,
    bg: palette.bg
  };
}

// Parseo de metadatos Obsidian Tasks (fechas, prioridad, etiquetas, proyecto, dependsOn y task ID)
export function parseTask(t, customizations) {
  const text = t.text;
  
  const dateMatch = text.match(/[📅⏳]\s*(\d{4}-\d{2}-\d{2})/);
  const dueDate = dateMatch ? dateMatch[1] : null;

  let priority = 'normal';
  if (/([🔺⏫])|#(urgente|critico|alta|hoy|bloqueante)\b/i.test(text)) {
    priority = 'high';
  } else if (/([🔼])|#(media)\b/i.test(text)) {
    priority = 'medium';
  } else if (/([🔽])|#(baja)\b/i.test(text)) {
    priority = 'low';
  }

  // ID explícito de tarea tipo [id:xxx] o id:xxx
  const idMatch = text.match(/\[id:([a-zA-Z0-9_\-]+)\]|\bid:([a-zA-Z0-9_\-]+)\b/i);
  const customId = idMatch ? (idMatch[1] || idMatch[2]) : null;

  // Dependencias de bloqueo tipo ⛔ dependsOn:id o dependsOn:id
  const dependsMatch = text.match(/(?:⛔\s*)?dependsOn:([a-zA-Z0-9_\-]+)/i);
  const dependsOn = dependsMatch ? dependsMatch[1] : null;

  const tags = (text.match(/#[a-zA-Z0-9_\-]+/g) || [])
    .map((tag) => tag.slice(1))
    .filter((tag) => !['urgente', 'critico', 'alta', 'media', 'baja', 'hoy', 'bloqueante'].includes(tag.toLowerCase()));

  const cleanText = text
    .replace(/[📅⏳]\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/[🔺⏫🔼🔽]/g, '')
    .replace(/\[id:[a-zA-Z0-9_\-]+\]|\bid:[a-zA-Z0-9_\-]+\b/gi, '')
    .replace(/(?:⛔\s*)?dependsOn:[a-zA-Z0-9_\-]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const rawProject = getTaskProject(t);
  const theme = resolveProjectTheme(rawProject, customizations);
  const cleanProjectName = extractLeadingEmoji(rawProject).cleanStr;

  return {
    ...t,
    customId,
    dependsOn,
    dueDate,
    priority,
    tags,
    cleanText: cleanText || text,
    project: cleanProjectName,
    rawProject,
    theme
  };
}

// Resuelve la configuración y tareas de un Cuadrante de la Matriz de Enfoque
export function resolveQuadrantData(targetKey, allFilteredTasks, activeHubs, availableProjects, customizations) {
  let resolvedKey = targetKey;
  if (targetKey === 'auto_1') resolvedKey = 'urgent';
  if (targetKey === 'auto_2') resolvedKey = activeHubs[0] ? `hub:${activeHubs[0]}` : 'focus';
  if (targetKey === 'auto_3') resolvedKey = activeHubs[1] ? `hub:${activeHubs[1]}` : 'backlog';
  if (targetKey === 'auto_4') resolvedKey = activeHubs[2] ? `hub:${activeHubs[2]}` : 'done';

  if (resolvedKey === 'urgent') {
    return {
      title: '🚨 Urgente & Crítico',
      color: '#fbbf24',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      tasks: allFilteredTasks.filter((t) => !t.completed && (t.priority === 'high' || t.dueDate))
    };
  }
  if (resolvedKey === 'focus') {
    return {
      title: '🔥 En Foco',
      color: '#f97316',
      bgColor: 'rgba(249, 115, 22, 0.08)',
      borderColor: 'rgba(249, 115, 22, 0.3)',
      tasks: allFilteredTasks.filter((t) => !t.completed && t.priority === 'high')
    };
  }
  if (resolvedKey === 'backlog') {
    return {
      title: '📥 Backlog General',
      color: '#94a3b8',
      bgColor: 'rgba(148, 163, 184, 0.06)',
      borderColor: 'rgba(148, 163, 184, 0.25)',
      tasks: allFilteredTasks.filter((t) => !t.completed && t.priority !== 'high' && !t.dueDate)
    };
  }
  if (resolvedKey === 'done') {
    return {
      title: '✅ Completadas',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      tasks: allFilteredTasks.filter((t) => t.completed)
    };
  }
  if (resolvedKey.startsWith('hub:')) {
    const hubName = resolvedKey.slice(4);
    const theme = hashStringToPalette(hubName);
    return {
      title: `📁 ${hubName}`,
      color: theme.color,
      bgColor: theme.bg,
      borderColor: theme.border,
      tasks: allFilteredTasks.filter((t) => t.hub === hubName)
    };
  }
  if (resolvedKey.startsWith('project:')) {
    const projName = resolvedKey.slice(8);
    const theme = resolveProjectTheme(projName, customizations);
    return {
      title: `${theme.icon} ${projName}`,
      color: theme.color,
      bgColor: theme.bg,
      borderColor: theme.border,
      tasks: allFilteredTasks.filter((t) => t.project === projName)
    };
  }

  return {
    title: 'Tareas',
    color: '#94a3b8',
    bgColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'var(--border-color)',
    tasks: allFilteredTasks
  };
}
