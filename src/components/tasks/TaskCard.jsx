import React, { useState } from 'react';
import { CheckSquare, FileText, Lock, Zap } from 'lucide-react';
import { TaskCardBadges } from './TaskCardBadges';
import { TaskCardActions } from './TaskCardActions';

export function TaskCard({
  task,
  onToggle,
  onSetStatus,
  onSelectTask,
  compact = false,
  highlight = false
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const theme = task.theme || {
    icon: '📁',
    color: 'var(--text-muted)',
    border: 'var(--border-color)',
    bg: 'var(--bg-card)'
  };

  const isBlocked = task.isBlocked && !task.completed;
  const isInProgress = task.status === 'in_progress' && !task.completed;
  const isDone = task.completed || task.status === 'done';

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (isBlocked) return;
    if (onSetStatus) {
      onSetStatus(task, isDone ? 'todo' : 'done');
    } else if (onToggle) {
      onToggle(task);
    }
  };

  const handleCardClick = () => {
    if (onSelectTask) {
      onSelectTask(task);
    } else if (onToggle) {
      onToggle(task);
    }
  };

  const handleQuickAction = (e, targetStatus) => {
    e.stopPropagation();
    if (isBlocked) return;
    if (onSetStatus) {
      onSetStatus(task, targetStatus);
    } else if (onToggle) {
      onToggle(task);
    }
  };

  const handleDragStart = (e) => {
    if (isBlocked) {
      e.preventDefault();
      return;
    }
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({
        id: task.id,
        file_path: task.file_path,
        line_number: task.line_number,
        filePath: task.file_path,
        lineNumber: task.line_number,
        status: task.status || (task.completed ? 'done' : 'todo')
      })
    );
  };

  return (
    <div
      onClick={handleCardClick}
      draggable={!isBlocked}
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`task-card-item ${isDone ? 'is-completed' : ''} ${isInProgress ? 'is-in-progress' : ''} ${isBlocked ? 'is-blocked' : ''}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxSizing: 'border-box',
        minHeight: compact ? '44px' : '52px',
        padding: compact ? '6px 8px' : '8px 11px',
        borderRadius: '6px',
        background: isDone
          ? 'color-mix(in srgb, var(--bg-card) 50%, transparent)'
          : isBlocked
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--danger) 8%, transparent) 0%, var(--bg-card) 100%)'
          : isInProgress
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent) 0%, var(--bg-card) 100%)'
          : highlight
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--warning) 8%, transparent) 0%, var(--bg-card) 100%)'
          : 'var(--bg-card)',
        border: isBlocked
          ? '1px solid color-mix(in srgb, var(--danger) 35%, transparent)'
          : isInProgress
          ? '1px solid color-mix(in srgb, var(--accent) 55%, transparent)'
          : highlight
          ? '1px solid color-mix(in srgb, var(--warning) 35%, transparent)'
          : '1px solid var(--border-color)',
        boxShadow: isInProgress
          ? '0 2px 12px color-mix(in srgb, var(--accent) 18%, transparent)'
          : highlight
          ? '0 2px 10px color-mix(in srgb, var(--warning) 10%, transparent)'
          : isDone
          ? 'none'
          : '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: isBlocked ? 'not-allowed' : 'grab',
        opacity: isDragging ? 0.4 : 1,
        transition: 'all 0.16s ease',
        gap: '8px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Tira lateral de acento de proyecto / estado */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: isDone
            ? 'transparent'
            : isBlocked
            ? 'var(--danger)'
            : isInProgress
            ? 'var(--accent)'
            : theme.color,
          opacity: isDone ? 0.3 : 0.95
        }}
      />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1, minWidth: 0, paddingLeft: '4px' }}>
        {/* Checkbox táctico interactivo */}
        <div
          onClick={handleCheckboxClick}
          className="task-checkbox-wrapper"
          style={{
            marginTop: '2px',
            color: isDone ? 'var(--primary)' : isInProgress ? 'var(--accent)' : 'var(--text-muted)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isBlocked ? 'not-allowed' : 'pointer'
          }}
          title={isBlocked ? `Bloqueada por: ${task.blockingTask?.cleanText || task.dependsOn}` : 'Conmutar estado'}
        >
          {isDone ? (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'color-mix(in srgb, var(--primary) 20%, transparent)',
                border: '1.5px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px color-mix(in srgb, var(--primary) 30%, transparent)'
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
          ) : isInProgress ? (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'color-mix(in srgb, var(--accent) 20%, transparent)',
                border: '1.5px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 6px color-mix(in srgb, var(--accent) 30%, transparent)'
              }}
            >
              <Zap size={10} color="var(--accent)" />
            </div>
          ) : (
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '4px',
                background: 'color-mix(in srgb, var(--text-high) 4%, transparent)',
                border: '1.5px solid var(--border-color)',
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

          <span
            style={{
              fontSize: compact ? '0.76rem' : '0.82rem',
              color: isDone ? 'var(--text-muted)' : 'var(--text-high)',
              textDecoration: isDone ? 'line-through' : 'none',
              fontWeight: isDone ? 400 : isInProgress ? 600 : 500,
              lineHeight: '1.4',
              wordBreak: 'break-word',
              letterSpacing: '0.01em'
            }}
          >
            {task.cleanText}
          </span>

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

      {/* Micro-Acciones Tácticas de Flujo */}
      {!isBlocked && (
        <TaskCardActions
          task={task}
          isDone={isDone}
          isInProgress={isInProgress}
          isHovered={isHovered}
          onQuickAction={handleQuickAction}
        />
      )}
    </div>
  );
}
export default TaskCard;
