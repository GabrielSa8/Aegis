import React from 'react';
import { Flame, Calendar, Lock } from 'lucide-react';

export function TaskCardBadges({ task, theme, isBlocked }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '5px' }}>
      {/* Chip de Proyecto */}
      <span
        style={{
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
        }}
      >
        <span>{theme.icon}</span>
        <span>{task.project}</span>
      </span>

      {/* Badge de Bloqueada dependsOn */}
      {isBlocked && (
        <span
          style={{
            fontSize: '0.58rem',
            fontWeight: 800,
            color: 'var(--danger)',
            background: 'color-mix(in srgb, var(--danger) 16%, transparent)',
            border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)',
            padding: '1px 5px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <Lock size={9} />
          BLOQUEADA
        </span>
      )}

      {/* Badge de Prioridad Alta */}
      {task.priority === 'high' && !task.completed && (
        <span
          style={{
            fontSize: '0.6rem',
            fontWeight: 800,
            color: 'var(--warning)',
            background: 'color-mix(in srgb, var(--warning) 18%, transparent)',
            border: '1px solid color-mix(in srgb, var(--warning) 35%, transparent)',
            padding: '1px 5px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            boxShadow: '0 0 6px color-mix(in srgb, var(--warning) 20%, transparent)'
          }}
        >
          <Flame size={10} color="var(--warning)" />
          ALTA
        </span>
      )}

      {/* Badge de Fecha Límite */}
      {task.dueDate && (
        <span
          style={{
            fontSize: '0.6rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            color: 'var(--accent)',
            background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
            padding: '1px 5px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <Calendar size={10} />
          {task.dueDate}
        </span>
      )}

      {/* Badges de Tags */}
      {task.tags &&
        task.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '0.58rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: 'var(--secondary)',
              background: 'color-mix(in srgb, var(--secondary) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--secondary) 25%, transparent)',
              padding: '1px 5px',
              borderRadius: '4px'
            }}
          >
            #{tag}
          </span>
        ))}
    </div>
  );
}
