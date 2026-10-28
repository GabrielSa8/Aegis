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
  Activity
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

// Paleta y Temas Tácticos de Proyectos (Nordic Slate & Moss)
const PROJECT_THEMES = {
  'Aegis': { icon: '🛡️', color: '#10b981', border: 'rgba(16, 185, 129, 0.4)', bg: 'rgba(16, 185, 129, 0.12)' },
  'TADÚ': { icon: '🚕', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.4)', bg: 'rgba(245, 158, 11, 0.12)' },
  'Granja Android': { icon: '📱', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)', bg: 'rgba(56, 189, 248, 0.12)' },
  'AegisTrack': { icon: '📡', color: '#a855f7', border: 'rgba(168, 85, 247, 0.4)', bg: 'rgba(168, 85, 247, 0.12)' },
  'Booklet V2': { icon: '📖', color: '#ec4899', border: 'rgba(236, 72, 153, 0.4)', bg: 'rgba(236, 72, 153, 0.12)' },
  'Operaciones MELI': { icon: '📦', color: '#eab308', border: 'rgba(234, 179, 8, 0.4)', bg: 'rgba(234, 179, 8, 0.12)' },
  'Bitácora & Cerebro': { icon: '🧠', color: '#6366f1', border: 'rgba(99, 102, 241, 0.4)', bg: 'rgba(99, 102, 241, 0.12)' },
  'Estudios & AWS': { icon: '☁️', color: '#f97316', border: 'rgba(249, 115, 22, 0.4)', bg: 'rgba(249, 115, 22, 0.12)' },
  'Personal & Gaming': { icon: '🎮', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.4)', bg: 'rgba(139, 92, 246, 0.12)' },
  'Plantillas': { icon: '📋', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.4)', bg: 'rgba(148, 163, 184, 0.12)' },
};

function getProjectTheme(project) {
  if (PROJECT_THEMES[project]) return PROJECT_THEMES[project];
  if (project.startsWith('Skill:')) {
    return { icon: '⚡', color: '#14b8a6', border: 'rgba(20, 184, 166, 0.4)', bg: 'rgba(20, 184, 166, 0.12)' };
  }
  return { icon: '📁', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.35)', bg: 'rgba(148, 163, 184, 0.1)' };
}

// Extractor de Proyecto/Módulo por ruta y nombre de archivo
function getTaskProject(t) {
  const cleanName = t.file_name.replace(/\.md$/i, '');
  const parts = t.relative_path.split('/');
  if (parts.length > 2 && parts[1] === 'Skills') {
    return `Skill: ${parts[2]}`;
  }
  if (/^tadu\b/i.test(cleanName)) return 'TADÚ';
  if (/^aegistrack\b/i.test(cleanName)) return 'AegisTrack';
  if (/^aegis\b/i.test(cleanName)) return 'Aegis';
  if (/^granja\b/i.test(cleanName)) return 'Granja Android';
  if (/^booklet\b/i.test(cleanName)) return 'Booklet V2';
  if (/^bitacora/i.test(cleanName)) return 'Bitácora & Cerebro';
  if (/^plantilla/i.test(cleanName)) return 'Plantillas';
  if (t.hub.includes('Operaciones') || /meli|mercado\s*libre/i.test(cleanName)) return 'Operaciones MELI';
  if (t.hub.includes('Estudios') || /aws/i.test(cleanName)) return 'Estudios & AWS';
  if (t.hub.includes('Personal') || /gaming/i.test(cleanName)) return 'Personal & Gaming';
  return cleanName;
}

// Extractor de metadatos Obsidian Tasks (fechas, prioridad, etiquetas, proyecto)
function parseTask(t) {
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

  const project = getTaskProject(t);

  return {
    ...t,
    dueDate,
    priority,
    tags,
    cleanText: cleanText || text,
    project,
    theme: getProjectTheme(project)
  };
}

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
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

  const hubs = [
    'Todos',
    '00 Sistema',
    '01 Operaciones MELI',
    '02 Proyectos de Software',
    '03 Personal y Ocio',
    '04 Estudios y Certs'
  ];

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

  // Tareas enriquecidas con metadatos
  const parsedTasks = useMemo(() => {
    return tasks.map(parseTask);
  }, [tasks]);

  // Lista única de Proyectos detectados para el filtro superior
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
      // Filtro por Hub
      if (selectedHub !== 'Todos' && t.hub !== selectedHub) return false;

      // Filtro por Proyecto
      if (selectedProject !== 'Todos' && t.project !== selectedProject) return false;

      // Filtro por Estado
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;

      // Filtro por Búsqueda
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

  // Jerarquía: Hub -> Proyecto -> Tareas
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

  // Agrupación para Matriz de Enfoque (4 cuadrantes)
  const matrixQuadrants = useMemo(() => {
    const urgent = [];
    const software = [];
    const meli = [];
    const personal = [];

    filteredTasks.forEach((t) => {
      if (!t.completed && t.priority === 'high') {
        urgent.push(t);
      } else if (t.hub.includes('02 Proyectos')) {
        software.push(t);
      } else if (t.hub.includes('01 Operaciones')) {
        meli.push(t);
      } else {
        personal.push(t);
      }
    });

    return { urgent, software, meli, personal };
  }, [filteredTasks]);

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
        {/* Fila 1: HUD Stats + Pomodoro Widget + Refrescar */}
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

          {/* Pomodoro HUD Widget + Refrescar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              {/* LED indicador */}
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

            {/* Selector de Hub */}
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

            {/* Selector de Proyecto Granular */}
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
                title="Filtrar por Proyecto específico (Aegis, TADÚ, Granja, etc.)"
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
                        const theme = getProjectTheme(projectName);

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
              const theme = getProjectTheme(projectName);

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
                          const theme = getProjectTheme(projectName);

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
                const theme = getProjectTheme(projectName);

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
            {/* Columna 1: Por Hacer */}
            <KanbanColumn
              title="📥 Por Hacer"
              count={kanbanColumns.todo.length}
              tasks={kanbanColumns.todo}
              onToggle={handleToggle}
              headerColor="var(--text-high)"
              accentColor="rgba(148, 163, 184, 0.3)"
              emptyMessage="Sin tareas en cola"
            />

            {/* Columna 2: En Foco / Urgente */}
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

            {/* Columna 3: Completadas */}
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
        /* 🎯 3. VISTA MATRIZ DE ENFOQUE & CUADRANTES */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '0.85rem'
        }}>
          <MatrixQuadrant
            title="🚨 Urgente & Crítico"
            color="#fbbf24"
            bgColor="rgba(245, 158, 11, 0.08)"
            borderColor="rgba(245, 158, 11, 0.3)"
            tasks={matrixQuadrants.urgent}
            onToggle={handleToggle}
          />
          <MatrixQuadrant
            title="💻 Desarrollo & Código (TADÚ / Aegis)"
            color="#38bdf8"
            bgColor="rgba(56, 189, 248, 0.08)"
            borderColor="rgba(56, 189, 248, 0.3)"
            tasks={matrixQuadrants.software}
            onToggle={handleToggle}
          />
          <MatrixQuadrant
            title="📦 Operaciones MELI (Última Milla)"
            color="#eab308"
            bgColor="rgba(234, 179, 8, 0.08)"
            borderColor="rgba(234, 179, 8, 0.3)"
            tasks={matrixQuadrants.meli}
            onToggle={handleToggle}
          />
          <MatrixQuadrant
            title="📚 Estudios, Certs & Personal"
            color="#a855f7"
            bgColor="rgba(168, 85, 247, 0.08)"
            borderColor="rgba(168, 85, 247, 0.3)"
            tasks={matrixQuadrants.personal}
            onToggle={handleToggle}
          />
        </div>
      )}
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
  // Agrupar tareas dentro de la columna por Proyecto
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
            const theme = getProjectTheme(project);
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

// Subcomponente de Cuadrante para la Matriz
function MatrixQuadrant({ title, color, bgColor, borderColor, tasks, onToggle }) {
  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(20, 26, 24, 0.8) 0%, rgba(14, 18, 17, 0.9) 100%)',
      border: `1px solid ${borderColor}`,
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '220px',
      boxShadow: '0 4px 14px rgba(0,0,0,0.25)'
    }}>
      <div style={{
        padding: '0.55rem 0.85rem',
        background: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 800, color }}>
          {title}
        </span>
        <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>
          {tasks.length}
        </span>
      </div>
      <div style={{ padding: '0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Sin tareas en este cuadrante
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} compact />
          ))
        )}
      </div>
    </div>
  );
}

// Subcomponente de Tarjeta de Tarea Táctica de Alto Impacto
function TaskCard({ task, onToggle, compact = false, highlight = false }) {
  const theme = task.theme || getProjectTheme(task.project);

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
