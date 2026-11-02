// Paleta Curada Táctica Nórdica Universal (10 Tonos Armónicos Adaptables a Temas)
const RAW_PALETTE_COLORS = [
  { id: 'emerald', name: 'Primario', color: 'var(--primary)' },
  { id: 'sky', name: 'Acento', color: 'var(--accent)' },
  { id: 'amber', name: 'Aviso', color: 'var(--warning)' },
  { id: 'rose', name: 'Crítico', color: 'var(--danger)' },
  { id: 'teal', name: 'Verde Mar', color: 'color-mix(in srgb, var(--primary) 70%, var(--accent))' },
  { id: 'indigo', name: 'Índigo', color: 'color-mix(in srgb, var(--accent) 75%, var(--primary))' },
  { id: 'orange', name: 'Naranja', color: 'color-mix(in srgb, var(--warning) 70%, var(--danger))' },
  { id: 'yellow', name: 'Dorado', color: 'color-mix(in srgb, var(--warning) 85%, var(--text-high))' },
  { id: 'violet', name: 'Violeta', color: 'color-mix(in srgb, var(--accent) 55%, var(--danger))' },
  { id: 'purple', name: 'Púrpura', color: 'color-mix(in srgb, var(--accent) 40%, var(--danger))' },
];

export const NORDIC_PALETTE = RAW_PALETTE_COLORS.map((p) => ({
  ...p,
  border: `color-mix(in srgb, ${p.color} 35%, transparent)`,
  bg: `color-mix(in srgb, ${p.color} 12%, transparent)`
}));

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

// Presets base (agnósticos, sin hardcode de proyectos específicos)
export const DEFAULT_PRESETS = {};

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
      color: 'var(--warning)',
      bgColor: 'color-mix(in srgb, var(--warning) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--warning) 30%, transparent)',
      tasks: allFilteredTasks.filter((t) => !t.completed && (t.priority === 'high' || t.dueDate))
    };
  }
  if (resolvedKey === 'focus') {
    return {
      title: '🔥 En Foco',
      color: 'var(--accent)',
      bgColor: 'color-mix(in srgb, var(--accent) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
      tasks: allFilteredTasks.filter((t) => !t.completed && t.priority === 'high')
    };
  }
  if (resolvedKey === 'backlog') {
    return {
      title: '📥 Backlog General',
      color: 'var(--text-muted)',
      bgColor: 'color-mix(in srgb, var(--text-muted) 8%, transparent)',
      borderColor: 'var(--border-color)',
      tasks: allFilteredTasks.filter((t) => !t.completed && t.priority !== 'high' && !t.dueDate)
    };
  }
  if (resolvedKey === 'done') {
    return {
      title: '✅ Completadas',
      color: 'var(--primary)',
      bgColor: 'color-mix(in srgb, var(--primary) 10%, transparent)',
      borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)',
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
    color: 'var(--text-muted)',
    bgColor: 'color-mix(in srgb, var(--text-high) 4%, transparent)',
    borderColor: 'var(--border-color)',
    tasks: allFilteredTasks
  };
}
