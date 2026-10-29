import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import { formatInline } from './markdownHelpers';

export default function TaskCheckboxItem({
  taskText,
  isDone,
  indentLevel = 0,
  lineNum,
  onToggleTask,
  onNavigateNote
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        fontSize: '0.84rem',
        margin: '3px 0',
        paddingLeft: indentLevel > 0 ? `${indentLevel * 1.25}rem` : 0,
        lineHeight: '1.5'
      }}
    >
      <button
        type="button"
        onClick={() => onToggleTask && onToggleTask(lineNum, isDone)}
        disabled={!onToggleTask}
        title={onToggleTask ? (isDone ? 'Desmarcar tarea' : 'Marcar tarea como completada') : undefined}
        style={{
          background: 'transparent',
          border: 'none',
          padding: '2px',
          margin: 0,
          borderRadius: '4px',
          cursor: onToggleTask ? 'pointer' : 'default',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isDone ? 'var(--primary)' : 'var(--text-muted)',
          transition: 'color 0.15s ease, transform 0.1s ease, background 0.15s ease',
          outline: 'none',
          flexShrink: 0,
          marginTop: '1px'
        }}
        onMouseEnter={(e) => {
          if (onToggleTask) {
            e.currentTarget.style.color = '#34d399';
            e.currentTarget.style.transform = 'scale(1.15)';
            e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (onToggleTask) {
            e.currentTarget.style.color = isDone ? 'var(--primary)' : 'var(--text-muted)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'transparent';
          }
        }}
      >
        {isDone ? <CheckSquare size={16} /> : <Square size={16} />}
      </button>
      <span
        style={{
          flex: 1,
          textDecoration: isDone ? 'line-through' : 'none',
          color: isDone ? 'var(--text-muted)' : 'var(--text-high)',
          opacity: isDone ? 0.65 : 1,
          transition: 'color 0.15s ease, opacity 0.15s ease'
        }}
      >
        {formatInline(taskText, onNavigateNote)}
      </span>
    </div>
  );
}
