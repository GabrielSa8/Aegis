import React from 'react';
import { CheckSquare, FileText, Lock } from 'lucide-react';
import { TaskCardBadges } from './TaskCardBadges';

export function TaskCard({
  task,
  onToggle,
  onSelectTask,
  compact = false,
  highlight = false
}) {
  const theme = task.theme || {
    icon: '📁',
    color: 'var(--text-muted)',
    border: 'var(--border-color)',
    bg: 'var(--bg-card)'
  };

  const isBlocked = task.isBlocked && !task.completed;

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (isBlocked) return;
    onToggle(task);
  };

  const handleCardClick = () => {
    if (onSelectTask) {
      onSelectTask(task);
    } else {
      onToggle(task);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: compact ? '7px 9px' : '8px 12px',
        borderRadius: '6px',
        background: task.completed
          ? 'rgba(15, 20, 18, 0.4)'
          : isBlocked
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.06) 0%, rgba(20, 24, 22, 0.85) 100%)'
          : highlight
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 24, 22, 0.85) 100%)'
          : 'linear-gradient(135deg, rgba(26, 32, 29, 0.75) 0%, rgba(18, 22, 21, 0.85) 100%)',
        border: isBlocked
          ? '1px solid rgba(239, 68, 68, 0.35)'
          : highlight
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
          e.currentTarget.style.borderColor = isBlocked ? 'rgba(239, 68, 68, 0.6)' : 'rgba(52, 211, 153, 0.45)';
          e.currentTarget.style.boxShadow = isBlocked
            ? '0 6px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(239, 68, 68, 0.15)'
            : '0 6px 16px rgba(0, 0, 0, 0.4), 0 0 10px rgba(52, 211, 153, 0.12)';
        }
      }}
      onMouseLeave={(e) => {
        if (!task.completed) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.borderColor = isBlocked
            ? 'rgba(239, 68, 68, 0.35)'
            : highlight
            ? 'rgba(245, 158, 11, 0.35)'
            : 'rgba(52, 211, 153, 0.15)';
          e.currentTarget.style.boxShadow = highlight ? '0 2px 10px rgba(245, 158, 11, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.25)';
        }
      }}
    >
      {/* Tira lateral de acento de proyecto */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: task.completed ? 'transparent' : isBlocked ? 'var(--danger)' : theme.color,
          opacity: task.completed ? 0.3 : 0.85
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0, paddingLeft: '4px' }}>
        {/* Checkbox táctico interactivo con cerrojo si está bloqueada */}
        <div
          onClick={handleCheckboxClick}
          style={{
            marginTop: '2px',
            color: task.completed ? 'var(--primary)' : 'var(--text-muted)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isBlocked ? 'not-allowed' : 'pointer',
            transition: 'color 0.15s ease'
          }}
          title={isBlocked ? `Bloqueada por: ${task.blockingTask?.cleanText || task.dependsOn}` : 'Conmutar estado'}
        >
          {task.completed ? (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1.5px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.3)'
              }}
            >
              <CheckSquare size={13} color="var(--primary)" />
            </div>
          ) : isBlocked ? (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'color-mix(in srgb, var(--danger) 15%, transparent)',
                border: '1.5px solid color-mix(in srgb, var(--danger) 50%, transparent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Lock size={10} color="var(--danger)" />
            </div>
          ) : (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1.5px solid rgba(148, 163, 184, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          )}
        </div>

        {/* Texto y Metadatos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
          <TaskCardBadges task={task} theme={theme} isBlocked={isBlocked} />

          {/* Texto de la tarea */}
          <span
            style={{
              fontSize: compact ? '0.76rem' : '0.82rem',
              color: task.completed ? 'var(--text-muted)' : 'var(--text-high)',
              textDecoration: task.completed ? 'line-through' : 'none',
              fontWeight: task.completed ? 400 : 500,
              lineHeight: '1.4',
              wordBreak: 'break-word',
              letterSpacing: '0.01em'
            }}
          >
            {task.cleanText}
          </span>

          {/* Archivo y Línea de origen */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '1px' }}>
            <FileText size={10} color="var(--text-muted)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.file_name}
            </span>
            <span>•</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted)' }}>L{task.line_number}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TaskCard;
