import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  CheckSquare, 
  Square, 
  RefreshCw, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Flame,
  LayoutGrid,
  ListTodo,
  Kanban,
  Calendar,
  Hash,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap,
  Tag,
  FolderGit2,
  Layers,
  Boxes,
  Target,
  Shield,
  Palette,
  Settings2,
  X,
  Undo2,
  Save,
  Smile,
  SlidersHorizontal
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

// Paleta Curada Táctica Nórdica Universal (10 Colores Armónicos de Alta Legibilidad)
const NORDIC_PALETTE = [
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
const CURATED_EMOJIS = [
  '🛡️', '🚕', '📱', '📦', '💻', '🧠', '⚡', '🚀',
  '📚', '🎮', '☁️', '💼', '🔬', '🛠️', '🎨', '📊',
  '🎯', '🏋️', '💰', '🏠', '🌐', '📝', '🤖', '🔑',
  '☕', '💡', '🔥', '🧪', '📋', '📈', '🕹️', '🎧',
  '🚗', '🛵', '🔧', '🩺', '🧩', '💎', '📡', '🌍'
];

const STORAGE_CUSTOM_KEY = 'aegis_task_customizations';
const STORAGE_MATRIX_KEY = 'aegis_matrix_quadrant_config';

// Presets base (fallback si no hay personalización explícita del usuario)
const DEFAULT_PRESETS = {
  'Aegis': { icon: '🛡️', colorId: 'emerald' },
};

// Generador determinista de color basado en hash de texto para CUALQUIER proyecto desconocido
function hashStringToPalette(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % NORDIC_PALETTE.length;
  return NORDIC_PALETTE[index];
}

// Extractor de emoji al inicio del nombre de una nota o carpeta (ej. "🚕 TADU" o "🛡️ Aegis")
function extractLeadingEmoji(str) {
  const match = str.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*/u);
  if (match) {
    return { emoji: match[1], cleanStr: str.slice(match[0].length).trim() };
  }
  return { emoji: null, cleanStr: str };
}

// Extractor dinámico y agnóstico de Proyecto/Módulo según la estructura de carpetas de cualquier Bóveda
function getTaskProject(t) {
  const cleanName = t.file_name.replace(/\.md$/i, '').trim();
  const parts = t.relative_path.split('/');

  // Si el archivo está dentro de subcarpetas en el Hub (ej. "Hub/Subcarpeta/Nota.md")
  if (parts.length > 2) {
    const parentDir = parts[parts.length - 2];
    // Si la nota tiene nombre genérico (Index, README, MOC, etc.), el proyecto es la subcarpeta
    if (parentDir && parentDir !== parts[0] && /^(readme|index|skill|moc|nota|general)$/i.test(cleanName)) {
      return parentDir;
    }
  }

  // De lo contrario, la nota misma representa el contexto/proyecto
  return cleanName;
}

// Resuelve tema visual de un proyecto: Personalización de Usuario > Emoji en Título > Preset > Hash Automático
function resolveProjectTheme(projectName, customizations) {
  // 1. Personalización manual guardada por el usuario en localStorage
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

  // 2. Si el nombre del proyecto ya inicia con emoji (ej. "🚕 TADU" o "🛡️ Aegis")
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

  // 3. Preset inicial por defecto (si coincide)
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

  // 4. Si es una habilidad (Skill)
  if (projectName.startsWith('Skill:')) {
    const palette = NORDIC_PALETTE.find((p) => p.id === 'teal') || hashStringToPalette(projectName);
    return {
      icon: '⚡',
      color: palette.color,
      border: palette.border,
      bg: palette.bg
    };
  }

  // 5. Fallback 100% agnóstico y determinista para cualquier bóveda
  const palette = hashStringToPalette(projectName);
  return {
    icon: '📁',
    color: palette.color,
    border: palette.border,
    bg: palette.bg
  };
}

// Parseo de metadatos Obsidian Tasks (fechas, prioridad, etiquetas, proyecto)
function parseTask(t, customizations) {
  const text = t.text;
  
  // Fecha límite: 📅 YYYY-MM-DD o ⏳ YYYY-MM-DD
  const dateMatch = text.match(/[📅⏳]\s*(\d{4}-\d{2}-\d{2})/);
  const dueDate = dateMatch ? dateMatch[1] : null;

  // Prioridad: 🔺 / ⏫ (Alta), 🔼 (Media), 🔽 (Baja) o hashtags temáticos
  let priority = 'normal';
  if (/([🔺⏫])|#(urgente|critico|alta|hoy|bloqueante)\b/i.test(text)) {
    priority = 'high';
  } else if (/([🔼])|#(media)\b/i.test(text)) {
    priority = 'medium';
  } else if (/([🔽])|#(baja)\b/i.test(text)) {
    priority = 'low';
  }

  // Tags: #etiqueta
  const tags = (text.match(/#[a-zA-Z0-9_\-]+/g) || [])
    .map((tag) => tag.slice(1))
    .filter((tag) => !['urgente', 'critico', 'alta', 'media', 'baja', 'hoy'].includes(tag.toLowerCase()));

  // Texto limpio sin emojis de fecha ni prioridad
  const cleanText = text
    .replace(/[📅⏳]\s*\d{4}-\d{2}-\d{2}/g, '')
    .replace(/[🔺⏫🔼🔽]/g, '')
    .trim();

  const rawProject = getTaskProject(t);
  const theme = resolveProjectTheme(rawProject, customizations);
  const cleanProjectName = extractLeadingEmoji(rawProject).cleanStr;

  return {
    ...t,
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
function resolveQuadrantData(targetKey, allFilteredTasks, activeHubs, availableProjects, customizations) {
  // Manejo de valores por defecto automáticos según la bóveda cargada
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

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Personalizaciones de usuario en localStorage
  const [customizations, setCustomizations] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (_) {
      return {};
    }
  });

  // Configuración de los 4 Cuadrantes de la Matriz (100% personalizable por usuario)
  const [matrixConfig, setMatrixConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_MATRIX_KEY);
      return stored ? JSON.parse(stored) : { q1: 'auto_1', q2: 'auto_2', q3: 'auto_3', q4: 'auto_4' };
    } catch (_) {
      return { q1: 'auto_1', q2: 'auto_2', q3: 'auto_3', q4: 'auto_4' };
    }
  });

  const updateMatrixQuadrant = (quadrantKey, newTarget) => {
    setMatrixConfig((prev) => {
      const next = { ...prev, [quadrantKey]: newTarget };
      try {
        localStorage.setItem(STORAGE_MATRIX_KEY, JSON.stringify(next));
      } catch (_) {}
      return next;
    });
  };

  // Modal de Personalización
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Filtros dinámicos
  const [selectedHub, setSelectedHub] = useState('Todos');
  const [selectedProject, setSelectedProject] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Agrupador: 'hub_project' (Jerárquico: Hub > Proyecto), 'project' (Directo por Proyecto), 'hub' (Directo por Hub)
  const [groupBy, setGroupBy] = useState('hub_project');

  // Modos de Vista: 'list', 'kanban', 'matrix'
  const [viewMode, setViewMode] = useState('list');
  const [kanbanLayout, setKanbanLayout] = useState('swimlanes'); // 'swimlanes' (por Proyecto/Hub) o 'columns' (3 columnas)
  
  // Secciones colapsadas
  const [collapsedHubs, setCollapsedHubs] = useState(() => new Set());
  const [collapsedProjects, setCollapsedProjects] = useState(() => new Set());

  // Temporizador Pomodoro Táctico
  const [pomoMode, setPomoMode] = useState('work'); // 'work' (25m), 'shortBreak' (5m)
  const [pomoTimeLeft, setPomoTimeLeft] = useState(25 * 60);
  const [pomoRunning, setPomoRunning] = useState(false);
  const pomoTimerRef = useRef(null);

  const fetchTasks = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await invoke('get_vault_tasks');
      setTasks(res || []);
    } catch (err) {
      console.error('Error cargando tareas de la Bóveda:', err);
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Manejo del Temporizador Pomodoro
  useEffect(() => {
    if (pomoRunning) {
      pomoTimerRef.current = setInterval(() => {
        setPomoTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(pomoTimerRef.current);
            setPomoRunning(false);
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime);
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
              osc.start();
              osc.stop(ctx.currentTime + 0.8);
            } catch (_) {}
            
            if (pomoMode === 'work') {
              setPomoMode('shortBreak');
              return 5 * 60;
            } else {
              setPomoMode('work');
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    }
    return () => {
      if (pomoTimerRef.current) clearInterval(pomoTimerRef.current);
    };
  }, [pomoRunning, pomoMode]);

  const togglePomodoro = () => setPomoRunning((prev) => !prev);
  const resetPomodoro = () => {
    setPomoRunning(false);
    setPomoTimeLeft(pomoMode === 'work' ? 25 * 60 : 5 * 60);
  };
  const switchPomoMode = (mode) => {
    setPomoRunning(false);
    setPomoMode(mode);
    setPomoTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatPomoTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Guardar personalizaciones en localStorage
  const handleSaveCustomizations = (newCustoms) => {
    setCustomizations(newCustoms);
    try {
      localStorage.setItem(STORAGE_CUSTOM_KEY, JSON.stringify(newCustoms));
    } catch (_) {}
  };

  // Conmutar estado de tarea en disco
  const handleToggle = async (task) => {
    const targetState = !task.completed;
    
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: targetState } : t))
    );

    try {
      await invoke('toggle_vault_task', {
        filePath: task.file_path,
        lineNumber: task.line_number,
        completed: targetState
      });
    } catch (err) {
      console.error('Error al conmutar tarea en Obsidian:', err);
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !targetState } : t))
      );
    }
  };

  // Colapsos
  const toggleHubCollapse = (hub) => {
    setCollapsedHubs((prev) => {
      const next = new Set(prev);
      if (next.has(hub)) next.delete(hub);
      else next.add(hub);
      return next;
    });
  };

  const toggleProjectCollapse = (projKey) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projKey)) next.delete(projKey);
      else next.add(projKey);
      return next;
    });
  };

  // Tareas enriquecidas con metadatos y temas dinámicos
  const parsedTasks = useMemo(() => {
    return tasks.map((t) => parseTask(t, customizations));
  }, [tasks, customizations]);

  // Lista dinámica de Hubs descubiertos en la bóveda del usuario
  const hubs = useMemo(() => {
    const set = new Set();
    tasks.forEach((t) => {
      if (t.hub) set.add(t.hub);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [tasks]);

  const activeHubs = useMemo(() => hubs.filter((h) => h !== 'Todos'), [hubs]);

  // Lista dinámica de Proyectos descubiertos en la bóveda del usuario
  const availableProjects = useMemo(() => {
    const set = new Set();
    parsedTasks.forEach((t) => {
      if (t.project) set.add(t.project);
    });
    return ['Todos', ...Array.from(set).sort()];
  }, [parsedTasks]);

  // Tareas filtradas por Hub, Proyecto, Estado y Búsqueda
  const filteredTasks = useMemo(() => {
    return parsedTasks.filter((t) => {
      if (selectedHub !== 'Todos' && t.hub !== selectedHub) return false;
      if (selectedProject !== 'Todos' && t.project !== selectedProject) return false;
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = t.cleanText.toLowerCase().includes(q) || t.text.toLowerCase().includes(q);
        const matchesFile = t.file_name.toLowerCase().includes(q);
        const matchesHub = t.hub.toLowerCase().includes(q);
        const matchesProject = t.project.toLowerCase().includes(q);
        const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchesText && !matchesFile && !matchesHub && !matchesProject && !matchesTag) return false;
      }

      return true;
    });
  }, [parsedTasks, selectedHub, selectedProject, statusFilter, searchQuery]);

  // Estadísticas globales
  const stats = useMemo(() => {
    const total = parsedTasks.length;
    const completed = parsedTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = parsedTasks.filter((t) => !t.completed && t.priority === 'high').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, completed, highPriority, percent };
  }, [parsedTasks]);

  // Jerarquía dinámica: Hub -> Proyecto -> Tareas
  const tasksHierarchy = useMemo(() => {
    const hierarchy = {};
    filteredTasks.forEach((t) => {
      if (!hierarchy[t.hub]) hierarchy[t.hub] = {};
      if (!hierarchy[t.hub][t.project]) hierarchy[t.hub][t.project] = [];
      hierarchy[t.hub][t.project].push(t);
    });
    return hierarchy;
  }, [filteredTasks]);

  // Agrupación directa por Proyecto: Proyecto -> Tareas
  const tasksByProject = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      if (!map[t.project]) map[t.project] = [];
      map[t.project].push(t);
    });
    return map;
  }, [filteredTasks]);

  // Agrupación directa por Hub: Hub -> Tareas
  const tasksByHub = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      if (!map[t.hub]) map[t.hub] = [];
      map[t.hub].push(t);
    });
    return map;
  }, [filteredTasks]);

  // Agrupación para Tablero Kanban (3 columnas globales)
  const kanbanColumns = useMemo(() => {
    const todo = [];
    const focus = [];
    const done = [];

    filteredTasks.forEach((t) => {
      if (t.completed) {
        done.push(t);
      } else if (t.priority === 'high' || t.dueDate) {
        focus.push(t);
      } else {
        todo.push(t);
      }
    });

    return { todo, focus, done };
  }, [filteredTasks]);

  // Datos resueltos de los 4 Cuadrantes de la Matriz Adaptable
  const q1Data = useMemo(() => resolveQuadrantData(matrixConfig.q1, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q1, filteredTasks, activeHubs, availableProjects, customizations]);
  const q2Data = useMemo(() => resolveQuadrantData(matrixConfig.q2, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q2, filteredTasks, activeHubs, availableProjects, customizations]);
  const q3Data = useMemo(() => resolveQuadrantData(matrixConfig.q3, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q3, filteredTasks, activeHubs, availableProjects, customizations]);
  const q4Data = useMemo(() => resolveQuadrantData(matrixConfig.q4, filteredTasks, activeHubs, availableProjects, customizations), [matrixConfig.q4, filteredTasks, activeHubs, availableProjects, customizations]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.65rem', overflowY: 'auto' }}>
      {/* 🧭 Cockpit Header: HUD de Métricas + Pomodoro Táctico + Filtros Granulares */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.95) 0%, rgba(14, 18, 17, 0.98) 100%)',
        border: '1px solid rgba(52, 211, 153, 0.2)',
        borderRadius: 'var(--radius-md)',
        padding: '0.55rem 0.85rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
        flexShrink: 0
      }}>
        {/* Fila 1: HUD Stats + Pomodoro Widget + Personalizador + Refrescar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          {/* HUD de Métricas */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '6px',
            padding: '3px 10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Layers size={12} color="#94a3b8" />
              <span>Total:</span>
              <strong style={{ color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>{stats.total}</strong>
            </div>

            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#38bdf8' }}>
              <Clock size={12} color="#38bdf8" />
              <span>En Cola:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.pending}</strong>
            </div>

            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#fbbf24' }}>
              <Flame size={12} color="#fbbf24" />
              <span>En Foco:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.highPriority}</strong>
            </div>

            <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#34d399' }}>
              <CheckCircle2 size={12} color="#34d399" />
              <span>Completadas:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.completed} ({stats.percent}%)</strong>
            </div>
          </div>

          {/* Pomodoro HUD Widget + Personalizador + Refrescar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Widget Pomodoro */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.45)',
              border: pomoRunning 
                ? (pomoMode === 'work' ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(56, 189, 248, 0.5)')
                : '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px 8px',
              boxShadow: pomoRunning ? `0 0 12px ${pomoMode === 'work' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(56, 189, 248, 0.2)'}` : 'none',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: pomoRunning ? (pomoMode === 'work' ? '#34d399' : '#38bdf8') : '#64748b',
                boxShadow: pomoRunning ? `0 0 6px ${pomoMode === 'work' ? '#34d399' : '#38bdf8'}` : 'none'
              }} />

              <button
                type="button"
                onClick={() => switchPomoMode(pomoMode === 'work' ? 'shortBreak' : 'work')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: pomoMode === 'work' ? '#34d399' : '#38bdf8',
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
                title="Alternar entre Foco (25m) y Break (5m)"
              >
                {pomoMode === 'work' ? 'Foco' : 'Break'}
              </button>

              <span style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                fontSize: '0.8rem',
                color: pomoRunning ? '#f1f5f9' : 'var(--text-muted)',
                minWidth: '42px',
                textAlign: 'center',
                letterSpacing: '0.04em'
              }}>
                {formatPomoTime(pomoTimeLeft)}
              </span>

              <button
                type="button"
                onClick={togglePomodoro}
                title={pomoRunning ? 'Pausar' : 'Iniciar'}
                style={{
                  background: pomoRunning ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  border: 'none',
                  borderRadius: '3px',
                  color: pomoRunning ? '#f87171' : '#34d399',
                  padding: '3px 5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {pomoRunning ? <Pause size={10} /> : <Play size={10} />}
              </button>

              <button
                type="button"
                onClick={resetPomodoro}
                title="Reiniciar temporizador"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  padding: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <RotateCcw size={10} />
              </button>
            </div>

            {/* Botón Personalizar Temas/Iconos */}
            <button
              type="button"
              onClick={() => setShowCustomizer(true)}
              title="Personalizar iconos y colores para tus proyectos y hubs"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                fontSize: '0.7rem',
                borderRadius: '6px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <Palette size={12} />
              <span>Personalizar</span>
            </button>

            {/* Botón Escanear */}
            <button
              type="button"
              onClick={fetchTasks}
              disabled={refreshing}
              title="Volver a escanear notas de la Bóveda"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                fontSize: '0.7rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={11} className={refreshing ? 'animate-spin' : ''} />
              <span>Escanear</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Buscador + Filtros por Hub/Proyecto + Conmutador de Agrupación + Selector de Vistas */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.6rem',
          flexWrap: 'wrap'
        }}>
          {/* Izquierda: Buscador + Filtro Hub + Filtro Proyecto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: '1 1 380px', flexWrap: 'wrap' }}>
            {/* Buscador */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flex: '1 1 140px',
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '3px 8px'
            }}>
              <Search size={12} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Buscar tareas, proyectos o #tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-high)',
                  fontSize: '0.74rem',
                  width: '100%'
                }}
              />
            </div>

            {/* Selector de Hub Dinámico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <FolderGit2 size={12} color="#34d399" />
              <select
                value={selectedHub}
                onChange={(e) => setSelectedHub(e.target.value)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 18px 3px 6px',
                  borderRadius: '4px',
                  background: '#131716',
                  color: '#e2e8f0',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
                title="Filtrar por Hub Maestro"
              >
                {hubs.map((h) => (
                  <option key={h} value={h} style={{ background: '#131716', color: '#e2e8f0' }}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Proyecto Granular Dinámico */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Boxes size={12} color="#38bdf8" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                style={{
                  fontSize: '0.7rem',
                  padding: '3px 18px 3px 6px',
                  borderRadius: '4px',
                  background: '#131716',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
                title="Filtrar por Proyecto específico"
              >
                {availableProjects.map((p) => (
                  <option key={p} value={p} style={{ background: '#131716', color: '#e2e8f0' }}>
                    {p === 'Todos' ? 'Todos los Proyectos' : p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Derecha: Agrupador + Conmutador de Vistas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Selector de Jerarquía / Agrupación */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Agrupar:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                style={{
                  fontSize: '0.68rem',
                  padding: '3px 16px 3px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  color: '#34d399',
                  border: '1px solid rgba(52, 211, 153, 0.3)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                <option value="hub_project" style={{ background: '#131716', color: '#e2e8f0' }}>Hub &gt; Proyecto</option>
                <option value="project" style={{ background: '#131716', color: '#e2e8f0' }}>Solo Proyectos</option>
                <option value="hub" style={{ background: '#131716', color: '#e2e8f0' }}>Solo Hubs</option>
              </select>
            </div>

            {/* Conmutador de Vistas (Lista / Kanban / Matriz) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '2px'
            }}>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                  border: viewMode === 'list' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  color: viewMode === 'list' ? '#34d399' : 'var(--text-muted)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ListTodo size={12} />
                <span>Lista</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                style={{
                  background: viewMode === 'kanban' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                  border: viewMode === 'kanban' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  color: viewMode === 'kanban' ? '#34d399' : 'var(--text-muted)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Kanban size={12} />
                <span>Kanban</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                style={{
                  background: viewMode === 'matrix' ? 'rgba(16, 185, 129, 0.22)' : 'transparent',
                  border: viewMode === 'matrix' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid transparent',
                  color: viewMode === 'matrix' ? '#34d399' : 'var(--text-muted)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <LayoutGrid size={12} />
                <span>Matriz</span>
              </button>
            </div>

            {/* Sub-conmutador de diseño Kanban */}
            {viewMode === 'kanban' && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '2px'
              }}>
                <button
                  type="button"
                  onClick={() => setKanbanLayout('swimlanes')}
                  style={{
                    background: kanbanLayout === 'swimlanes' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    border: kanbanLayout === 'swimlanes' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    color: kanbanLayout === 'swimlanes' ? '#38bdf8' : 'var(--text-muted)',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Swimlanes por Proyecto"
                >
                  Swimlanes
                </button>
                <button
                  type="button"
                  onClick={() => setKanbanLayout('columns')}
                  style={{
                    background: kanbanLayout === 'columns' ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                    border: kanbanLayout === 'columns' ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                    color: kanbanLayout === 'columns' ? '#38bdf8' : 'var(--text-muted)',
                    padding: '3px 7px',
                    borderRadius: '4px',
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="3 Columnas Globales"
                >
                  3 Columnas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🧭 Área Principal de Vistas */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 10px auto', color: '#10b981' }} />
          <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>Cargando tareas estructuradas desde la Bóveda...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, rgba(20, 26, 24, 0.7) 0%, rgba(14, 18, 17, 0.8) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.15)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          padding: '3.5rem 1rem',
          color: 'var(--text-muted)'
        }}>
          <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
          <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-high)' }}>
            No hay tareas en esta vista
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.76rem' }}>
            Todas las tareas coinciden como completadas o el filtro actual (Hub/Proyecto) no contiene tareas pendientes.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* 📋 1. VISTA LISTA TÁCTICA JERÁRQUICA */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {groupBy === 'hub_project' ? (
            /* Jerárquico: Hub > Proyecto > Tareas */
            Object.entries(tasksHierarchy).map(([hubName, projectsMap]) => {
              const isHubCollapsed = collapsedHubs.has(hubName);
              const allHubTasks = Object.values(projectsMap).flat();
              const hubTotal = allHubTasks.length;
              const hubDone = allHubTasks.filter((t) => t.completed).length;
              const hubPercent = hubTotal > 0 ? Math.round((hubDone / hubTotal) * 100) : 0;
              const projectCount = Object.keys(projectsMap).length;

              return (
                <div
                  key={hubName}
                  style={{
                    background: 'linear-gradient(180deg, rgba(22, 28, 25, 0.8) 0%, rgba(15, 19, 18, 0.9) 100%)',
                    border: '1px solid rgba(52, 211, 153, 0.2)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
                  }}
                >
                  {/* Cabecera del Hub */}
                  <div
                    onClick={() => toggleHubCollapse(hubName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.6rem 0.95rem',
                      background: 'rgba(255, 255, 255, 0.025)',
                      borderBottom: isHubCollapsed ? 'none' : '1px solid rgba(52, 211, 153, 0.15)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isHubCollapsed ? <ChevronRight size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#34d399" />}
                      <FolderGit2 size={15} color="#34d399" />
                      <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-high)' }}>
                        {hubName}
                      </span>
                      <span style={{
                        fontSize: '0.64rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.04)',
                        padding: '1px 6px',
                        borderRadius: '4px'
                      }}>
                        {projectCount} {projectCount === 1 ? 'proyecto' : 'proyectos'} • {hubTotal} tareas
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '70px', height: '5px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${hubPercent}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {hubDone}/{hubTotal} ({hubPercent}%)
                      </span>
                    </div>
                  </div>

                  {/* Bloques de Proyectos dentro del Hub */}
                  {!isHubCollapsed && (
                    <div style={{ padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                      {Object.entries(projectsMap).map(([projectName, projTasks]) => {
                        const projKey = `${hubName}::${projectName}`;
                        const isProjCollapsed = collapsedProjects.has(projKey);
                        const pTotal = projTasks.length;
                        const pDone = projTasks.filter((t) => t.completed).length;
                        const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                        const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

                        return (
                          <div
                            key={projectName}
                            style={{
                              background: 'rgba(0, 0, 0, 0.3)',
                              border: `1px solid ${theme.border}`,
                              borderRadius: '6px',
                              overflow: 'hidden'
                            }}
                          >
                            {/* Cabecera del Proyecto */}
                            <div
                              onClick={() => toggleProjectCollapse(projKey)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.45rem 0.75rem',
                                background: theme.bg,
                                borderBottom: isProjCollapsed ? 'none' : `1px solid ${theme.border}`,
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {isProjCollapsed ? <ChevronRight size={13} color="#94a3b8" /> : <ChevronDown size={13} color={theme.color} />}
                                <span style={{ fontSize: '0.85rem' }}>{theme.icon}</span>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: theme.color, letterSpacing: '0.02em' }}>
                                  {projectName}
                                </span>
                                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                  ({pTotal} {pTotal === 1 ? 'tarea' : 'tareas'})
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '50px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${pPercent}%`, height: '100%', background: theme.color, transition: 'width 0.3s ease' }} />
                                </div>
                                <span style={{ fontSize: '0.64rem', color: theme.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                  {pDone}/{pTotal}
                                </span>
                              </div>
                            </div>

                            {/* Tareas del Proyecto */}
                            {!isProjCollapsed && (
                              <div style={{ padding: '0.4rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {projTasks.map((task) => (
                                  <TaskCard key={task.id} task={task} onToggle={handleToggle} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          ) : groupBy === 'project' ? (
            /* Plano por Proyecto directo */
            Object.entries(tasksByProject).map(([projectName, projTasks]) => {
              const isProjCollapsed = collapsedProjects.has(projectName);
              const pTotal = projTasks.length;
              const pDone = projTasks.filter((t) => t.completed).length;
              const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
              const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

              return (
                <div
                  key={projectName}
                  style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    onClick={() => toggleProjectCollapse(projectName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      background: theme.bg,
                      borderBottom: isProjCollapsed ? 'none' : `1px solid ${theme.border}`,
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isProjCollapsed ? <ChevronRight size={14} color="#94a3b8" /> : <ChevronDown size={14} color={theme.color} />}
                      <span style={{ fontSize: '0.9rem' }}>{theme.icon}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: theme.color }}>
                        {projectName}
                      </span>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                        ({pTotal} tareas)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${pPercent}%`, height: '100%', background: theme.color }} />
                      </div>
                      <span style={{ fontSize: '0.66rem', color: theme.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {pDone}/{pTotal} ({pPercent}%)
                      </span>
                    </div>
                  </div>

                  {!isProjCollapsed && (
                    <div style={{ padding: '0.45rem 0.65rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {projTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onToggle={handleToggle} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            /* Plano por Hub directo */
            Object.entries(tasksByHub).map(([hubName, hubTasks]) => {
              const isCollapsed = collapsedHubs.has(hubName);
              const hubTotal = hubTasks.length;
              const hubDone = hubTasks.filter((t) => t.completed).length;
              const hubPercent = hubTotal > 0 ? Math.round((hubDone / hubTotal) * 100) : 0;

              return (
                <div
                  key={hubName}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    onClick={() => toggleHubCollapse(hubName)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.55rem 0.85rem',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} color="#34d399" />}
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
                        {hubName}
                      </span>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                        ({hubTasks.length} tareas)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${hubPercent}%`, height: '100%', background: '#10b981' }} />
                      </div>
                      <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {hubDone}/{hubTotal} ({hubPercent}%)
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div style={{ padding: '0.4rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {hubTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onToggle={handleToggle} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        /* 📌 2. VISTA TABLERO KANBAN TÁCTICO */
        kanbanLayout === 'swimlanes' ? (
          /* Sub-modo A: Swimlanes por Proyecto */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {groupBy === 'hub_project' ? (
              /* Swimlanes agrupadas dentro de cada Hub */
              Object.entries(tasksHierarchy).map(([hubName, projectsMap]) => {
                const isHubCollapsed = collapsedHubs.has(hubName);
                const allHubTasks = Object.values(projectsMap).flat();
                const hubTotal = allHubTasks.length;
                const hubDone = allHubTasks.filter((t) => t.completed).length;
                const hubPercent = hubTotal > 0 ? Math.round((hubDone / hubTotal) * 100) : 0;

                return (
                  <div
                    key={hubName}
                    style={{
                      background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.85) 0%, rgba(14, 18, 17, 0.95) 100%)',
                      border: '1px solid rgba(52, 211, 153, 0.22)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                    }}
                  >
                    {/* Banner del Hub */}
                    <div
                      onClick={() => toggleHubCollapse(hubName)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.95rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderBottom: isHubCollapsed ? 'none' : '1px solid rgba(52, 211, 153, 0.15)',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isHubCollapsed ? <ChevronRight size={15} color="#94a3b8" /> : <ChevronDown size={15} color="#34d399" />}
                        <FolderGit2 size={15} color="#34d399" />
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f1f5f9' }}>
                          {hubName}
                        </span>
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                          ({Object.keys(projectsMap).length} proyectos • {hubTotal} tareas)
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${hubPercent}%`, height: '100%', background: '#10b981' }} />
                        </div>
                        <span style={{ fontSize: '0.66rem', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {hubDone}/{hubTotal} ({hubPercent}%)
                        </span>
                      </div>
                    </div>

                    {/* Swimlanes de Proyectos */}
                    {!isHubCollapsed && (
                      <div style={{ padding: '0.65rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(projectsMap).map(([projectName, projTasks]) => {
                          const projKey = `${hubName}::${projectName}`;
                          const isProjCollapsed = collapsedProjects.has(projKey);
                          const pTotal = projTasks.length;
                          const pDone = projTasks.filter((t) => t.completed).length;
                          const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                          const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

                          const pTodo = [];
                          const pFocus = [];
                          const pCompleted = [];
                          projTasks.forEach((t) => {
                            if (t.completed) pCompleted.push(t);
                            else if (t.priority === 'high' || t.dueDate) pFocus.push(t);
                            else pTodo.push(t);
                          });

                          return (
                            <ProjectKanbanSwimlane
                              key={projectName}
                              projectName={projectName}
                              theme={theme}
                              pTotal={pTotal}
                              pDone={pDone}
                              pPercent={pPercent}
                              isCollapsed={isProjCollapsed}
                              onToggleCollapse={() => toggleProjectCollapse(projKey)}
                              todoTasks={pTodo}
                              focusTasks={pFocus}
                              doneTasks={pCompleted}
                              onToggleTask={handleToggle}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              /* Swimlanes directas por Proyecto */
              Object.entries(tasksByProject).map(([projectName, projTasks]) => {
                const isProjCollapsed = collapsedProjects.has(projectName);
                const pTotal = projTasks.length;
                const pDone = projTasks.filter((t) => t.completed).length;
                const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;
                const theme = projTasks[0]?.theme || resolveProjectTheme(projectName, customizations);

                const pTodo = [];
                const pFocus = [];
                const pCompleted = [];
                projTasks.forEach((t) => {
                  if (t.completed) pCompleted.push(t);
                  else if (t.priority === 'high' || t.dueDate) pFocus.push(t);
                  else pTodo.push(t);
                });

                return (
                  <ProjectKanbanSwimlane
                    key={projectName}
                    projectName={projectName}
                    theme={theme}
                    pTotal={pTotal}
                    pDone={pDone}
                    pPercent={pPercent}
                    isCollapsed={isProjCollapsed}
                    onToggleCollapse={() => toggleProjectCollapse(projectName)}
                    todoTasks={pTodo}
                    focusTasks={pFocus}
                    doneTasks={pCompleted}
                    onToggleTask={handleToggle}
                  />
                );
              })
            )}
          </div>
        ) : (
          /* Sub-modo B: 3 Columnas Globales (agrupadas con badges por Proyecto) */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '0.85rem',
            alignItems: 'start'
          }}>
            <KanbanColumn
              title="📥 Por Hacer"
              count={kanbanColumns.todo.length}
              tasks={kanbanColumns.todo}
              onToggle={handleToggle}
              headerColor="var(--text-high)"
              accentColor="rgba(148, 163, 184, 0.3)"
              emptyMessage="Sin tareas en cola"
            />

            <KanbanColumn
              title="🔥 En Foco / Urgente"
              count={kanbanColumns.focus.length}
              tasks={kanbanColumns.focus}
              onToggle={handleToggle}
              headerColor="#fbbf24"
              accentColor="rgba(245, 158, 11, 0.4)"
              highlight
              emptyMessage="Sin tareas urgentes en foco"
            />

            <KanbanColumn
              title="✅ Completadas"
              count={kanbanColumns.done.length}
              tasks={kanbanColumns.done}
              onToggle={handleToggle}
              headerColor="#34d399"
              accentColor="rgba(16, 185, 129, 0.3)"
              emptyMessage="Aún no has completado tareas hoy"
            />
          </div>
        )
      ) : (
        /* 🎯 3. VISTA MATRIZ DE ENFOQUE & CUADRANTES 100% CONFIGURABLES */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '0.85rem'
        }}>
          <ConfigurableMatrixQuadrant
            quadrantId="q1"
            currentConfig={matrixConfig.q1}
            data={q1Data}
            onConfigChange={(val) => updateMatrixQuadrant('q1', val)}
            activeHubs={activeHubs}
            availableProjects={availableProjects}
            onToggle={handleToggle}
          />
          <ConfigurableMatrixQuadrant
            quadrantId="q2"
            currentConfig={matrixConfig.q2}
            data={q2Data}
            onConfigChange={(val) => updateMatrixQuadrant('q2', val)}
            activeHubs={activeHubs}
            availableProjects={availableProjects}
            onToggle={handleToggle}
          />
          <ConfigurableMatrixQuadrant
            quadrantId="q3"
            currentConfig={matrixConfig.q3}
            data={q3Data}
            onConfigChange={(val) => updateMatrixQuadrant('q3', val)}
            activeHubs={activeHubs}
            availableProjects={availableProjects}
            onToggle={handleToggle}
          />
          <ConfigurableMatrixQuadrant
            quadrantId="q4"
            currentConfig={matrixConfig.q4}
            data={q4Data}
            onConfigChange={(val) => updateMatrixQuadrant('q4', val)}
            activeHubs={activeHubs}
            availableProjects={availableProjects}
            onToggle={handleToggle}
          />
        </div>
      )}

      {/* 🎨 MODAL DE PERSONALIZACIÓN UNIVERSAL DE PROYECTOS & HUBS */}
      {showCustomizer && (
        <CustomizerModal
          projects={availableProjects.filter((p) => p !== 'Todos')}
          customizations={customizations}
          onSave={handleSaveCustomizations}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
}

// Modal de Personalización Universal con Selector Rápido de Emojis y Swatches
function CustomizerModal({ projects, customizations, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...customizations });
  const [activePickerProj, setActivePickerProj] = useState(null);

  const handleUpdate = (proj, field, val) => {
    setDraft((prev) => ({
      ...prev,
      [proj]: {
        ...(prev[proj] || {}),
        [field]: val
      }
    }));
  };

  const handleResetAll = () => {
    setDraft({});
  };

  const handleSaveAndClose = () => {
    onSave(draft);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #18201d 0%, #0f1413 100%)',
        border: '1px solid rgba(52, 211, 153, 0.35)',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '620px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 50px rgba(0, 0, 0, 0.7)'
      }}>
        {/* Cabecera del Modal */}
        <div style={{
          padding: '0.85rem 1.15rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Palette size={18} color="#34d399" />
            <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: '#f1f5f9' }}>
              Personalizador de Proyectos & Contextos
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtítulo descriptivo */}
        <div style={{ padding: '0.65rem 1.15rem', background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          Haz clic en el emoji para abrir el selector rápido o elige un color de la paleta nórdica para cada proyecto.
        </div>

        {/* Lista de Proyectos Configurable */}
        <div style={{ padding: '0.85rem 1.15rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
          {projects.map((proj) => {
            const currentTheme = resolveProjectTheme(proj, draft);
            const userCustom = draft[proj] || {};
            const currentColorId = userCustom.colorId || NORDIC_PALETTE.find(p => p.color === currentTheme.color)?.id || 'emerald';
            const isPickerOpen = activePickerProj === proj;

            return (
              <div
                key={proj}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'rgba(0, 0, 0, 0.38)',
                  border: isPickerOpen ? '1px solid #34d399' : `1px solid ${currentTheme.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'border-color 0.15s ease'
                }}
              >
                {/* Fila Principal */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.6rem 0.85rem',
                  gap: '10px'
                }}>
                  {/* Badge Preview en Vivo */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto', minWidth: '160px' }}>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      color: currentTheme.color,
                      background: currentTheme.bg,
                      border: `1px solid ${currentTheme.border}`,
                      padding: '3px 9px',
                      borderRadius: '5px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: `0 0 8px ${currentTheme.border}`
                    }}>
                      <span style={{ fontSize: '0.95rem' }}>{currentTheme.icon}</span>
                      <span>{proj}</span>
                    </span>
                  </div>

                  {/* Controles: Botón Emoji Grande + Swatches de Color */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {/* Botón de Emoji */}
                    <button
                      type="button"
                      onClick={() => setActivePickerProj(isPickerOpen ? null : proj)}
                      title="Haz clic para desplegar la cuadrícula de emojis"
                      style={{
                        minWidth: '44px',
                        height: '34px',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: isPickerOpen ? 'rgba(52, 211, 153, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                        border: isPickerOpen ? '1.5px solid #34d399' : '1px solid var(--border-color)',
                        fontSize: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: isPickerOpen ? '0 0 10px rgba(52, 211, 153, 0.4)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {currentTheme.icon || '📁'}
                    </button>

                    {/* Swatches de Color Nórdicos */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {NORDIC_PALETTE.map((pal) => {
                        const isSelected = currentColorId === pal.id;
                        return (
                          <div
                            key={pal.id}
                            onClick={() => handleUpdate(proj, 'colorId', pal.id)}
                            title={pal.name}
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: pal.color,
                              cursor: 'pointer',
                              border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0, 0, 0, 0.5)',
                              transform: isSelected ? 'scale(1.25)' : 'none',
                              boxShadow: isSelected ? `0 0 8px ${pal.color}` : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Cuadrícula Desplegable de Emojis Rápida */}
                {isPickerOpen && (
                  <div style={{
                    padding: '0.65rem 0.85rem',
                    background: 'rgba(0, 0, 0, 0.55)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ fontSize: '0.66rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase' }}>
                      Selecciona un emoji para {proj}:
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                      gap: '4px'
                    }}>
                      {CURATED_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            handleUpdate(proj, 'icon', emoji);
                            setActivePickerProj(null);
                          }}
                          style={{
                            height: '32px',
                            background: currentTheme.icon === emoji ? 'rgba(52, 211, 153, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                            border: currentTheme.icon === emoji ? '1px solid #34d399' : '1px solid transparent',
                            borderRadius: '4px',
                            fontSize: '1.15rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.1s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    {/* Entrada directa opcional para pegar cualquier emoji */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>O escribe/pega otro:</span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="Emoji..."
                        value={userCustom.icon || ''}
                        onChange={(e) => handleUpdate(proj, 'icon', e.target.value)}
                        style={{
                          width: '60px',
                          height: '24px',
                          textAlign: 'center',
                          background: 'rgba(0,0,0,0.5)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '4px',
                          color: '#f1f5f9',
                          fontSize: '0.85rem'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer del Modal */}
        <div style={{
          padding: '0.75rem 1.15rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <button
            type="button"
            onClick={handleResetAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              cursor: 'pointer'
            }}
          >
            <Undo2 size={12} />
            <span>Restablecer Todo</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-high)',
                padding: '4px 12px',
                borderRadius: '5px',
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveAndClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#10b981',
                border: 'none',
                color: '#042f2e',
                fontWeight: 800,
                padding: '4px 14px',
                borderRadius: '5px',
                fontSize: '0.74rem',
                cursor: 'pointer',
                boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
              }}
            >
              <Save size={13} />
              <span>Guardar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponente de Cuadrante para la Matriz Adaptable y 100% Configurable
function ConfigurableMatrixQuadrant({
  quadrantId,
  currentConfig,
  data,
  onConfigChange,
  activeHubs,
  availableProjects,
  onToggle
}) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.8) 0%, rgba(14, 18, 17, 0.9) 100%)',
      border: `1px solid ${data.borderColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '220px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
    }}>
      {/* Cabecera Interactiva con Selector */}
      <div style={{
        padding: '0.45rem 0.75rem',
        background: data.bgColor,
        borderBottom: `1px solid ${data.borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px'
      }}>
        {/* Selector de Objetivo para este Cuadrante */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <select
            value={currentConfig}
            onChange={(e) => onConfigChange(e.target.value)}
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: data.color,
              background: 'rgba(0, 0, 0, 0.4)',
              border: `1px solid ${data.borderColor}`,
              borderRadius: '4px',
              padding: '2px 20px 2px 6px',
              cursor: 'pointer',
              outline: 'none',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title="Cambiar qué monitorea este cuadrante"
          >
            <optgroup label="Tácticas & Urgencia">
              <option value="urgent" style={{ background: '#131716', color: '#fbbf24' }}>🚨 Urgente & Crítico</option>
              <option value="focus" style={{ background: '#131716', color: '#f97316' }}>🔥 En Foco</option>
              <option value="backlog" style={{ background: '#131716', color: '#94a3b8' }}>📥 Backlog General</option>
              <option value="done" style={{ background: '#131716', color: '#10b981' }}>✅ Completadas</option>
            </optgroup>
            
            {activeHubs.length > 0 && (
              <optgroup label="Por Hub Maestro (Bóveda)">
                {activeHubs.map((h) => (
                  <option key={h} value={`hub:${h}`} style={{ background: '#131716', color: '#34d399' }}>
                    📁 Hub: {h}
                  </option>
                ))}
              </optgroup>
            )}

            {availableProjects.filter(p => p !== 'Todos').length > 0 && (
              <optgroup label="Por Proyecto / Contexto">
                {availableProjects.filter(p => p !== 'Todos').map((p) => (
                  <option key={p} value={`project:${p}`} style={{ background: '#131716', color: '#38bdf8' }}>
                    📦 Proyecto: {p}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: data.color, flexShrink: 0 }}>
          {data.tasks.length}
        </span>
      </div>

      {/* Lista de Tareas */}
      <div style={{ padding: '0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {data.tasks.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Sin tareas en este cuadrante
          </div>
        ) : (
          data.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} compact />
          ))
        )}
      </div>
    </div>
  );
}

// Subcomponente de Swimlane Kanban para un Proyecto
function ProjectKanbanSwimlane({
  projectName,
  theme,
  pTotal,
  pDone,
  pPercent,
  isCollapsed,
  onToggleCollapse,
  todoTasks,
  focusTasks,
  doneTasks,
  onToggleTask
}) {
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.32)',
      border: `1px solid ${theme.border}`,
      borderRadius: '7px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }}>
      {/* Cabecera del Swimlane */}
      <div
        onClick={onToggleCollapse}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.45rem 0.8rem',
          background: theme.bg,
          borderBottom: isCollapsed ? 'none' : `1px solid ${theme.border}`,
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          {isCollapsed ? <ChevronRight size={13} color="#94a3b8" /> : <ChevronDown size={13} color={theme.color} />}
          <span style={{ fontSize: '0.9rem' }}>{theme.icon}</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: theme.color, letterSpacing: '0.02em' }}>
            {projectName}
          </span>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
            ({pTotal} {pTotal === 1 ? 'tarea' : 'tareas'})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '55px', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${pPercent}%`, height: '100%', background: theme.color, transition: 'width 0.3s ease' }} />
          </div>
          <span style={{ fontSize: '0.64rem', color: theme.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {pDone}/{pTotal} ({pPercent}%)
          </span>
        </div>
      </div>

      {/* 3 Columnas del Swimlane */}
      {!isCollapsed && (
        <div style={{
          padding: '0.55rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '0.55rem',
          background: 'rgba(0, 0, 0, 0.18)'
        }}>
          {/* Por Hacer */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '4px 8px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
              fontSize: '0.66rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>📥 Por Hacer</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{todoTasks.length}</span>
            </div>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '50px' }}>
              {todoTasks.length === 0 ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', opacity: 0.6 }}>
                  Sin tareas en cola
                </div>
              ) : (
                todoTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} compact />)
              )}
            </div>
          </div>

          {/* En Foco */}
          <div style={{
            background: 'rgba(245, 158, 11, 0.04)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '4px 8px',
              background: 'rgba(245, 158, 11, 0.08)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.66rem',
              fontWeight: 700,
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={11} color="#fbbf24" />
                🔥 En Foco
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{focusTasks.length}</span>
            </div>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '50px' }}>
              {focusTasks.length === 0 ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', opacity: 0.6 }}>
                  Sin tareas urgentes
                </div>
              ) : (
                focusTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} compact highlight />)
              )}
            </div>
          </div>

          {/* Completadas */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.03)',
            border: '1px solid rgba(16, 185, 129, 0.18)',
            borderRadius: '5px',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '4px 8px',
              background: 'rgba(16, 185, 129, 0.06)',
              borderBottom: '1px solid rgba(16, 185, 129, 0.18)',
              fontSize: '0.66rem',
              fontWeight: 700,
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>✅ Completadas</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem' }}>{doneTasks.length}</span>
            </div>
            <div style={{ padding: '4px', display: 'flex', flexDirection: 'column', gap: '3px', minHeight: '50px' }}>
              {doneTasks.length === 0 ? (
                <div style={{ padding: '0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.66rem', opacity: 0.6 }}>
                  Sin completadas
                </div>
              ) : (
                doneTasks.map((t) => <TaskCard key={t.id} task={t} onToggle={onToggleTask} compact />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponente de Columna Kanban Global
function KanbanColumn({ title, count, tasks, onToggle, headerColor, accentColor, highlight = false, emptyMessage }) {
  const grouped = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!map[t.project]) map[t.project] = [];
      map[t.project].push(t);
    });
    return map;
  }, [tasks]);

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.8) 0%, rgba(14, 18, 17, 0.9) 100%)',
      border: `1px solid ${accentColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 180px)',
      boxShadow: highlight ? '0 0 16px rgba(245, 158, 11, 0.06)' : '0 4px 14px rgba(0,0,0,0.25)'
    }}>
      <div style={{
        padding: '0.55rem 0.85rem',
        background: highlight ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.025)',
        borderBottom: `1px solid ${accentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: headerColor }}>
          {title} ({count})
        </span>
      </div>

      <div style={{ padding: '0.55rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
            {emptyMessage}
          </div>
        ) : (
          Object.entries(grouped).map(([project, projTasks]) => {
            const theme = projTasks[0]?.theme || { icon: '📁', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
            return (
              <div key={project} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  color: theme.color,
                  padding: '2px 4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: `1px dashed ${theme.border}`,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{theme.icon}</span>
                    <span>{project}</span>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>({projTasks.length})</span>
                </div>
                {projTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={onToggle} compact highlight={highlight} />
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Subcomponente de Tarjeta de Tarea Táctica de Alto Impacto
function TaskCard({ task, onToggle, compact = false, highlight = false }) {
  const theme = task.theme || { icon: '📁', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)', bg: 'rgba(148, 163, 184, 0.1)' };

  return (
    <div
      onClick={() => onToggle(task)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: compact ? '7px 9px' : '8px 12px',
        borderRadius: '6px',
        background: task.completed
          ? 'rgba(15, 20, 18, 0.4)'
          : highlight
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 24, 22, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(26, 32, 29, 0.75) 0%, rgba(18, 22, 21, 0.85) 100%)',
        border: highlight
          ? '1px solid rgba(245, 158, 11, 0.35)'
          : task.completed
          ? '1px solid rgba(255, 255, 255, 0.05)'
          : '1px solid rgba(52, 211, 153, 0.15)',
        boxShadow: highlight
          ? '0 2px 10px rgba(245, 158, 11, 0.08)'
          : task.completed
          ? 'none'
          : '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        transition: 'all 0.16s ease',
        gap: '9px',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!task.completed) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.45)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(52, 211, 153, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!task.completed) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = highlight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(52, 211, 153, 0.15)';
          e.currentTarget.style.boxShadow = highlight ? '0 2px 10px rgba(245, 158, 11, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.25)';
        }
      }}
    >
      {/* Tira lateral de acento de proyecto */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: task.completed ? 'transparent' : theme.color,
        opacity: task.completed ? 0.3 : 0.85
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0, paddingLeft: '4px' }}>
        {/* Checkbox táctico interactivo */}
        <div style={{
          marginTop: '2px',
          color: task.completed ? '#10b981' : 'var(--text-muted)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s ease'
        }}>
          {task.completed ? (
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1.5px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 6px rgba(16, 185, 129, 0.3)'
            }}>
              <CheckSquare size={13} color="#34d399" />
            </div>
          ) : (
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1.5px solid rgba(148, 163, 184, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }} />
          )}
        </div>

        {/* Texto y Metadatos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
          {/* Fila de Badges */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
            {/* Chip de Proyecto */}
            <span style={{
              fontSize: '0.62rem',
              fontWeight: 800,
              color: theme.color,
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              padding: '1px 6px',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              letterSpacing: '0.02em',
              textTransform: 'uppercase'
            }}>
              <span>{theme.icon}</span>
              <span>{task.project}</span>
            </span>

            {/* Badge de Prioridad Alta */}
            {task.priority === 'high' && !task.completed && (
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 800,
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.18)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '1px 5px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                boxShadow: '0 0 6px rgba(245, 158, 11, 0.2)'
              }}>
                <Flame size={10} color="#fbbf24" />
                ALTA
              </span>
            )}

            {/* Badge de Fecha Límite */}
            {task.dueDate && (
              <span style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '1px 5px',
                borderRadius: '4px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}>
                <Calendar size={10} />
                {task.dueDate}
              </span>
            )}

            {/* Badges de Tags */}
            {task.tags && task.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: '0.58rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  color: '#c084fc',
                  background: 'rgba(168, 85, 247, 0.12)',
                  border: '1px solid rgba(168, 85, 247, 0.25)',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Texto de la tarea */}
          <span style={{
            fontSize: compact ? '0.76rem' : '0.82rem',
            color: task.completed ? 'var(--text-muted)' : '#f1f5f9',
            textDecoration: task.completed ? 'line-through' : 'none',
            fontWeight: task.completed ? 400 : 500,
            lineHeight: '1.4',
            wordBreak: 'break-word',
            letterSpacing: '0.01em'
          }}>
            {task.cleanText}
          </span>

          {/* Archivo y Línea de origen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem', color: '#64748b', marginTop: '1px' }}>
            <FileText size={10} color="#64748b" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.file_name}
            </span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: '#94a3b8' }}>L{task.line_number}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
