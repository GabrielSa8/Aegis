import React, { useEffect } from 'react';
import { X, Calendar, Flame, CheckSquare, Square, Lock } from 'lucide-react';
import { TacticalBadge } from '../ui/TacticalBadge';
import { TaskInspectorActions } from './TaskInspectorActions';

/**
 * TaskInspectorDrawer — Inspector táctico lateral (Drawer) de contexto y acciones para tareas.
 * Muestra metadatos, estado de dependencias dependsOn, acceso en 1-clic a notas de Obsidian y puente al Agente IA.
 */
export function TaskInspectorDrawer({ task, onClose, onToggle }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!task) return null;

  const theme = task.theme || {
    icon: '📁',
    color: 'var(--primary)',
    border: 'var(--border-color)',
    bg: 'var(--bg-card)'
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '92vw',
        background: 'linear-gradient(180deg, var(--bg-card) 0%, var(--bg-main) 100%)',
        borderLeft: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.18s ease-out',
        backdropFilter: 'blur(8px)'
      }}
    >
      {/* Cabecera del Inspector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'color-mix(in srgb, var(--text-high) 2%, transparent)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.1rem' }}>{theme.icon}</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Inspector de Tarea
            </h3>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {task.project} • {task.hub}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          title="Cerrar (Esc)"
        >
          <X size={16} />
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Banner de Estado de Bloqueo */}
        {task.isBlocked && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--danger) 35%, transparent)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger)', fontSize: '0.74rem', fontWeight: 800 }}>
              <Lock size={13} />
              <span>TAREA BLOQUEADA POR PRERREQUISITO</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-high)' }}>
              Depende de:{' '}
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                {task.blockingTask ? task.blockingTask.cleanText : task.dependsOn}
              </span>
            </p>
          </div>
        )}

        {/* Tarjeta Principal de la Tarea */}
        <div
          style={{
            padding: '0.85rem',
            borderRadius: '8px',
            background: 'color-mix(in srgb, var(--text-high) 3%, transparent)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <button
              onClick={() => onToggle(task)}
              disabled={task.isBlocked && !task.completed}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: task.isBlocked && !task.completed ? 'not-allowed' : 'pointer',
                opacity: task.isBlocked && !task.completed ? 0.4 : 1,
                color: task.completed ? 'var(--primary)' : 'var(--text-muted)',
                marginTop: '2px'
              }}
              title={task.isBlocked ? 'Tarea bloqueada por prerrequisito' : 'Conmutar estado'}
            >
              {task.completed ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
            <span
              style={{
                fontSize: '0.88rem',
                fontWeight: 600,
                color: task.completed ? 'var(--text-muted)' : 'var(--text-high)',
                textDecoration: task.completed ? 'line-through' : 'none',
                lineHeight: 1.45,
                wordBreak: 'break-word'
              }}
            >
              {task.cleanText}
            </span>
          </div>

          {/* Badges de Metadatos */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {task.priority === 'high' && (
              <TacticalBadge variant="danger" icon={<Flame size={10} />}>
                PRIORIDAD ALTA
              </TacticalBadge>
            )}
            {task.dueDate && (
              <TacticalBadge variant="info" icon={<Calendar size={10} />}>
                {task.dueDate}
              </TacticalBadge>
            )}
            {task.customId && (
              <span
                style={{
                  fontSize: '0.62rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'color-mix(in srgb, var(--text-high) 6%, transparent)',
                  color: 'var(--text-muted)'
                }}
              >
                ID: {task.customId}
              </span>
            )}
          </div>
        </div>

        {/* Acciones e integración Obsidian */}
        <TaskInspectorActions task={task} />
      </div>
    </div>
  );
}
export default TaskInspectorDrawer;
