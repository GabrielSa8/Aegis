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
  Tag
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

// Extractor de metadatos Obsidian Tasks (fechas, prioridad, etiquetas)
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

  return {
    ...t,
    dueDate,
    priority,
    tags,
    cleanText: cleanText || text
  };
}

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Filtros
  const [selectedHub, setSelectedHub] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modos de Vista: 'list' (agrupada por Hub), 'kanban' (3 columnas), 'matrix' (4 cuadrantes)
  const [viewMode, setViewMode] = useState('list');
  const [collapsedHubs, setCollapsedHubs] = useState(() => new Set());

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
            // Sonido suave de notificación Web Audio API
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
              gain.gain.setValueAtTime(0.2, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
              osc.start();
              osc.stop(ctx.currentTime + 0.8);
            } catch (_) {}
            
            // Alternar al siguiente modo automáticamente
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

  const togglePomodoro = () => {
    setPomoRunning((prev) => !prev);
  };

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
    
    // Actualización optimista instantánea
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
      // Revertir en caso de fallo
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: !targetState } : t))
      );
    }
  };

  // Toggle de colapso de Hubs en Vista Lista
  const toggleHubCollapse = (hub) => {
    setCollapsedHubs((prev) => {
      const next = new Set(prev);
      if (next.has(hub)) {
        next.delete(hub);
      } else {
        next.add(hub);
      }
      return next;
    });
  };

  // Tareas enriquecidas con metadatos
  const parsedTasks = useMemo(() => {
    return tasks.map(parseTask);
  }, [tasks]);

  // Tareas filtradas por Hub, Estado y Búsqueda
  const filteredTasks = useMemo(() => {
    return parsedTasks.filter((t) => {
      // Filtro por Hub
      if (selectedHub !== 'Todos' && t.hub !== selectedHub) {
        return false;
      }
      // Filtro por Estado
      if (statusFilter === 'pending' && t.completed) return false;
      if (statusFilter === 'completed' && !t.completed) return false;

      // Filtro por Búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText = t.cleanText.toLowerCase().includes(q) || t.text.toLowerCase().includes(q);
        const matchesFile = t.file_name.toLowerCase().includes(q);
        const matchesHub = t.hub.toLowerCase().includes(q);
        const matchesTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
        if (!matchesText && !matchesFile && !matchesHub && !matchesTag) return false;
      }

      return true;
    });
  }, [parsedTasks, selectedHub, statusFilter, searchQuery]);

  // Estadísticas globales
  const stats = useMemo(() => {
    const total = parsedTasks.length;
    const completed = parsedTasks.filter((t) => t.completed).length;
    const pending = total - completed;
    const highPriority = parsedTasks.filter((t) => !t.completed && t.priority === 'high').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, pending, completed, highPriority, percent };
  }, [parsedTasks]);

  // Agrupación por Hub para Vista Lista
  const tasksByHub = useMemo(() => {
    const map = {};
    filteredTasks.forEach((t) => {
      if (!map[t.hub]) map[t.hub] = [];
      map[t.hub].push(t);
    });
    return map;
  }, [filteredTasks]);

  // Agrupación para Tablero Kanban (3 columnas)
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
      {/* 🧭 Barra Superior: Pomodoro Táctico + Filtros + Selector de Vistas */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.6rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.45rem 0.75rem',
        flexShrink: 0
      }}>
        {/* Izquierda: Buscador y Selector de Hub */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 240px', minWidth: '220px' }}>
          {/* Buscador */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 8px'
          }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Filtrar tareas o #tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-high)',
                fontSize: '0.75rem',
                width: '100%'
              }}
            />
          </div>

          {/* Selector de Hub */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={12} color="var(--text-muted)" />
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              style={{
                fontSize: '0.72rem',
                padding: '4px 22px 4px 8px',
                width: 'auto',
                cursor: 'pointer'
              }}
            >
              {hubs.map((h) => (
                <option key={h} value={h} style={{ background: '#131716', color: '#e2e8f0' }}>
                  {h}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Centro / Derecha: Conmutador de Vistas (Lista, Kanban, Matriz) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '2px'
        }}>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            title="Vista Lista Agrupada por Hubs"
            style={{
              background: viewMode === 'list' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              border: viewMode === 'list' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
              color: viewMode === 'list' ? '#34d399' : 'var(--text-muted)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
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
            title="Vista Tablero Kanban Táctico"
            style={{
              background: viewMode === 'kanban' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              border: viewMode === 'kanban' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
              color: viewMode === 'kanban' ? '#34d399' : 'var(--text-muted)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
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
            title="Vista Matriz de Enfoque y Urgencia"
            style={{
              background: viewMode === 'matrix' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              border: viewMode === 'matrix' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
              color: viewMode === 'matrix' ? '#34d399' : 'var(--text-muted)',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.7rem',
              fontWeight: 600,
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

        {/* Derecha: Pomodoro Táctico + Status Tabs + Refrescar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Widget Pomodoro */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: pomoRunning ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '2px 8px',
            boxShadow: pomoRunning ? '0 0 10px rgba(16, 185, 129, 0.15)' : 'none',
            transition: 'var(--transition)'
          }}>
            <button
              type="button"
              onClick={() => switchPomoMode(pomoMode === 'work' ? 'shortBreak' : 'work')}
              style={{
                background: 'transparent',
                border: 'none',
                color: pomoMode === 'work' ? '#34d399' : '#38bdf8',
                fontSize: '0.64rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                cursor: 'pointer',
                padding: '2px'
              }}
              title="Alternar entre Trabajo (25m) y Descanso (5m)"
            >
              {pomoMode === 'work' ? 'Foco' : 'Break'}
            </button>

            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              fontSize: '0.76rem',
              color: pomoRunning ? '#34d399' : 'var(--text-high)',
              minWidth: '40px',
              textAlign: 'center'
            }}>
              {formatPomoTime(pomoTimeLeft)}
            </span>

            <button
              type="button"
              onClick={togglePomodoro}
              title={pomoRunning ? 'Pausar Pomodoro' : 'Iniciar Pomodoro'}
              style={{
                background: pomoRunning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: 'none',
                borderRadius: '3px',
                color: pomoRunning ? '#f87171' : '#34d399',
                padding: '3px',
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
                padding: '2px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RotateCcw size={10} />
            </button>
          </div>

          {/* Status Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '2px'
          }}>
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              style={{
                background: statusFilter === 'pending' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                border: statusFilter === 'pending' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                color: statusFilter === 'pending' ? '#a7f3d0' : 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: statusFilter === 'pending' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Pendientes ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              style={{
                background: statusFilter === 'completed' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                border: statusFilter === 'completed' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                color: statusFilter === 'completed' ? '#a7f3d0' : 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: statusFilter === 'completed' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Listas ({stats.completed})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{
                background: statusFilter === 'all' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: statusFilter === 'all' ? '1px solid var(--border-color)' : '1px solid transparent',
                color: statusFilter === 'all' ? 'var(--text-high)' : 'var(--text-muted)',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.68rem',
                fontWeight: statusFilter === 'all' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              Todas ({stats.total})
            </button>
          </div>

          {/* Botón Refrescar */}
          <button
            type="button"
            onClick={fetchTasks}
            disabled={refreshing}
            title="Recargar tareas desde Obsidian"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              transition: 'var(--transition)'
            }}
          >
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ⚠️ Alerta de Error */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0.6rem 0.85rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: '0.75rem'
        }}>
          <AlertCircle size={14} />
          <span>Error leyendo tareas de la Bóveda: {error}</span>
        </div>
      )}

      {/* 📊 CONTENIDO DE TAREAS SEGÚN MODO DE VISTA */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)', gap: '8px', fontSize: '0.82rem' }}>
          <RefreshCw size={18} className="animate-spin" />
          <span>Escaneando tareas en notas de Obsidian...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          textAlign: 'center',
          padding: '3rem 1rem',
          color: 'var(--text-muted)'
        }}>
          <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-high)' }}>
            No hay tareas que coincidan
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.74rem' }}>
            Todas las tareas están completadas o el filtro actual no tiene coincidencias.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* 📋 1. VISTA LISTA TÁCTICA (Agrupada por Hubs con Progreso) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Object.entries(tasksByHub).map(([hubName, hubTasks]) => {
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
                {/* Cabecera del Hub */}
                <div
                  onClick={() => toggleHubCollapse(hubName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isCollapsed ? <ChevronRight size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
                      {hubName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Barra de progreso miniatura */}
                    <div style={{ width: '60px', height: '4px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${hubPercent}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {hubDone}/{hubTotal} ({hubPercent}%)
                    </span>
                  </div>
                </div>

                {/* Lista de Tareas del Hub */}
                {!isCollapsed && (
                  <div style={{ padding: '0.4rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {hubTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onToggle={handleToggle} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'kanban' ? (
        /* 📌 2. VISTA TABLERO KANBAN TÁCTICO (3 Columnas) */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '0.75rem',
          alignItems: 'start'
        }}>
          {/* Columna 1: Por Hacer */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 170px)'
          }}>
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-high)' }}>
                📥 Por Hacer ({kanbanColumns.todo.length})
              </span>
            </div>
            <div style={{ padding: '0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {kanbanColumns.todo.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Sin tareas en cola
                </div>
              ) : (
                kanbanColumns.todo.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggle} compact />
                ))
              )}
            </div>
          </div>

          {/* Columna 2: En Foco / Prioritarias */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 170px)',
            boxShadow: '0 0 12px rgba(245, 158, 11, 0.04)'
          }}>
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(245, 158, 11, 0.08)',
              borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Flame size={13} color="#fbbf24" />
                <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#fbbf24' }}>
                  🔥 En Foco / Urgente ({kanbanColumns.focus.length})
                </span>
              </div>
            </div>
            <div style={{ padding: '0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {kanbanColumns.focus.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Sin tareas urgentes en foco
                </div>
              ) : (
                kanbanColumns.focus.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggle} compact highlight />
                ))
              )}
            </div>
          </div>

          {/* Columna 3: Completadas */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 170px)'
          }}>
            <div style={{
              padding: '0.5rem 0.75rem',
              background: 'rgba(16, 185, 129, 0.06)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#34d399' }}>
                ✅ Completadas ({kanbanColumns.done.length})
              </span>
            </div>
            <div style={{ padding: '0.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {kanbanColumns.done.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Aún no has completado tareas hoy
                </div>
              ) : (
                kanbanColumns.done.map((task) => (
                  <TaskCard key={task.id} task={task} onToggle={handleToggle} compact />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 🎯 3. VISTA MATRIZ DE ENFOQUE & CUADRANTES */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '0.75rem'
        }}>
          {/* Cuadrante 1: Urgente / Foco */}
          <MatrixQuadrant
            title="🚨 Urgente & Crítico"
            color="#fbbf24"
            bgColor="rgba(245, 158, 11, 0.08)"
            borderColor="rgba(245, 158, 11, 0.3)"
            tasks={matrixQuadrants.urgent}
            onToggle={handleToggle}
          />

          {/* Cuadrante 2: Desarrollo & Proyectos */}
          <MatrixQuadrant
            title="💻 Desarrollo & Código (TADÚ / Aegis)"
            color="#34d399"
            bgColor="rgba(16, 185, 129, 0.08)"
            borderColor="rgba(16, 185, 129, 0.3)"
            tasks={matrixQuadrants.software}
            onToggle={handleToggle}
          />

          {/* Cuadrante 3: Operaciones MELI */}
          <MatrixQuadrant
            title="📦 Operaciones MELI"
            color="#38bdf8"
            bgColor="rgba(56, 189, 248, 0.08)"
            borderColor="rgba(56, 189, 248, 0.3)"
            tasks={matrixQuadrants.meli}
            onToggle={handleToggle}
          />

          {/* Cuadrante 4: Personal, Ocio & Estudios */}
          <MatrixQuadrant
            title="📚 Estudios & Personal"
            color="#c084fc"
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

// Subcomponente de Cuadrante para la Matriz
function MatrixQuadrant({ title, color, bgColor, borderColor, tasks, onToggle }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '220px'
    }}>
      <div style={{
        padding: '0.5rem 0.75rem',
        background: bgColor,
        borderBottom: `1px solid ${borderColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: '0.76rem', fontWeight: 800, color }}>
          {title}
        </span>
        <span style={{ fontSize: '0.64rem', fontFamily: 'var(--font-mono)', color }}>
          {tasks.length}
        </span>
      </div>
      <div style={{ padding: '0.45rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {tasks.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Sin tareas pendientes en este cuadrante
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

// Subcomponente de Tarjeta de Tarea Táctica
function TaskCard({ task, onToggle, compact = false, highlight = false }) {
  return (
    <div
      onClick={() => onToggle(task)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: compact ? '6px 8px' : '7px 10px',
        borderRadius: 'var(--radius-sm)',
        background: task.completed ? 'transparent' : highlight ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.015)',
        border: highlight ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        gap: '8px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.35)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.035)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = highlight ? 'rgba(245, 158, 11, 0.25)' : 'var(--border-color)';
        e.currentTarget.style.background = task.completed ? 'transparent' : highlight ? 'rgba(245, 158, 11, 0.06)' : 'rgba(255, 255, 255, 0.015)';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0 }}>
        {/* Checkbox */}
        <div style={{ marginTop: '2px', color: task.completed ? '#10b981' : 'var(--text-muted)', flexShrink: 0 }}>
          {task.completed ? <CheckSquare size={15} /> : <Square size={15} />}
        </div>

        {/* Texto y Metadatos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
            {/* Badge de Prioridad Alta */}
            {task.priority === 'high' && !task.completed && (
              <span style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                color: '#fbbf24',
                background: 'rgba(245, 158, 11, 0.15)',
                padding: '1px 5px',
                borderRadius: '3px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                <Flame size={10} />
                Alta
              </span>
            )}

            {/* Badge de Fecha Límite */}
            {task.dueDate && (
              <span style={{
                fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.12)',
                padding: '1px 5px',
                borderRadius: '3px',
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
                  fontFamily: 'var(--font-mono)',
                  color: '#c084fc',
                  background: 'rgba(168, 85, 247, 0.12)',
                  padding: '1px 5px',
                  borderRadius: '3px'
                }}
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Texto de la tarea */}
          <span style={{
            fontSize: compact ? '0.75rem' : '0.8rem',
            color: task.completed ? 'var(--text-muted)' : 'var(--text-high)',
            textDecoration: task.completed ? 'line-through' : 'none',
            fontWeight: task.completed ? 400 : 500,
            lineHeight: '1.35',
            wordBreak: 'break-word'
          }}>
            {task.cleanText}
          </span>

          {/* Archivo y Línea de origen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.64rem', color: '#64748b', marginTop: '1px' }}>
            <FileText size={10} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.file_name}
            </span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>L{task.line_number}</span>
          </div>
        </div>
      </div>

      {/* Hub Tag */}
      {!compact && (
        <span style={{
          fontSize: '0.6rem',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-muted)',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {task.hub.replace(/^\d+\s*/, '')}
        </span>
      )}
    </div>
  );
}
