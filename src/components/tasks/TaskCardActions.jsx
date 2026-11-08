import React from 'react';
import { Play, Pause, CheckSquare, RotateCcw } from 'lucide-react';

export function TaskCardActions({
  task,
  isDone,
  isInProgress,
  isHovered,
  onQuickAction
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        opacity: isHovered || isInProgress ? 1 : 0.15,
        transition: 'opacity 0.15s ease',
        flexShrink: 0,
        alignSelf: 'center'
      }}
    >
      {!isDone && !isInProgress && (
        <button
          type="button"
          onClick={(e) => onQuickAction(e, 'in_progress')}
          title="Mover a En Proceso"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 6px',
            fontSize: '0.62rem',
            fontWeight: 700,
            color: 'var(--accent)',
            background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
            borderRadius: '4px',
            cursor: 'pointer',
            transition: 'all 0.12s ease'
          }}
        >
          <Play size={9} fill="currentColor" />
          <span>Iniciar</span>
        </button>
      )}

      {isInProgress && (
        <>
          <button
            type="button"
            onClick={(e) => onQuickAction(e, 'todo')}
            title="Pausar / Devolver a Por Hacer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 5px',
              fontSize: '0.62rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'color-mix(in srgb, var(--text-high) 6%, transparent)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Pause size={9} />
          </button>
          <button
            type="button"
            onClick={(e) => onQuickAction(e, 'done')}
            title="Completar tarea"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              padding: '2px 6px',
              fontSize: '0.62rem',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <CheckSquare size={10} />
            <span>Hecho</span>
          </button>
        </>
      )}

      {isDone && (
        <button
          type="button"
          onClick={(e) => onQuickAction(e, 'todo')}
          title="Reabrir tarea"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 6px',
            fontSize: '0.62rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            background: 'color-mix(in srgb, var(--text-high) 6%, transparent)',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          <RotateCcw size={9} />
          <span>Reabrir</span>
        </button>
      )}
    </div>
  );
}
