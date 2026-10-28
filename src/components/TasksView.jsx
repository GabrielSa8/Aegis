import { useState, useEffect, useMemo, useCallback } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function TasksView() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  const [selectedHub, setSelectedHub] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all', 'pending', 'completed'
  const [searchQuery, setSearchQuery] = useState('');

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
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
        const matchesText = t.text.toLowerCase().includes(q);
        const matchesFile = t.file_name.toLowerCase().includes(q);
        const matchesHub = t.hub.toLowerCase().includes(q);
        if (!matchesText && !matchesFile && !matchesHub) return false;
      }

      return true;
    });
  }, [tasks, selectedHub, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = tasks.len || tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const pending = total - completed;
    return { total, pending, completed };
  }, [tasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.65rem', overflowY: 'auto' }}>
      {/* 🔍 Barra de Filtros, Búsqueda y Métricas Compacta */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.5rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.45rem 0.75rem',
        flexShrink: 0
      }}>
        {/* Izquierda: Buscador y Hub */}
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
              placeholder="Filtrar tareas..."
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

        {/* Derecha: Pestañas de Estado, Chips y Refrescar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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
              Todas
            </button>
          </div>

          {/* Botón Refrescar */}
          <button
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
          padding: '0.75rem 1rem',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: '0.8rem'
        }}>
          <AlertCircle size={16} />
          <span>Error leyendo Bóveda: {error}</span>
        </div>
      )}

      {/* 📋 Lista de Tareas Extraídas */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minHeight: '200px'
      }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', color: 'var(--text-muted)', gap: '8px', fontSize: '0.85rem' }}>
            <RefreshCw size={18} className="animate-spin" />
            <span>Escaneando notas de Obsidian...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px auto', opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-high)' }}>
              No hay tareas en este criterio
            </p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>
              Todas las tareas están completadas o el filtro actual no coincide.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              onClick={() => handleToggle(task)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: task.completed ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                border: '1px solid var(--border-color)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.background = task.completed ? 'transparent' : 'rgba(255, 255, 255, 0.015)';
              }}
            >
              {/* Checkbox y Texto */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                <div style={{ marginTop: '2px', color: task.completed ? '#10b981' : 'var(--text-muted)' }}>
                  {task.completed ? <CheckSquare size={17} /> : <Square size={17} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{
                    fontSize: '0.84rem',
                    color: task.completed ? 'var(--text-muted)' : 'var(--text-high)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    fontWeight: task.completed ? 400 : 500,
                    lineHeight: '1.3'
                  }}>
                    {task.text}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <FileText size={11} />
                    <span>{task.file_name}</span>
                    <span>•</span>
                    <span>Línea {task.line_number}</span>
                  </div>
                </div>
              </div>

              {/* Badges de Hub y Origen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  {task.hub.replace(/^\d+\s*/, '')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
