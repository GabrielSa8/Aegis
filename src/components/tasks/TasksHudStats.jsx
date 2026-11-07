import React from 'react';
import { CheckCircle2, Clock, Flame, Layers } from 'lucide-react';

export function TasksHudStats({ stats, statusFilter = 'all', onStatusFilterChange }) {
  const handleClick = (key) => {
    if (!onStatusFilterChange) return;
    onStatusFilterChange(statusFilter === key ? 'all' : key);
  };

  const getStyle = (key, activeColor) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.7rem',
    color: statusFilter === key ? activeColor : 'var(--text-muted)',
    cursor: onStatusFilterChange ? 'pointer' : 'default',
    padding: '2px 6px',
    borderRadius: '4px',
    background: statusFilter === key ? `color-mix(in srgb, ${activeColor} 15%, transparent)` : 'transparent',
    border: statusFilter === key ? `1px solid color-mix(in srgb, ${activeColor} 40%, transparent)` : '1px solid transparent',
    transition: 'all 0.15s ease',
    userSelect: 'none'
  });

  return (
    <div
      className="tasks-hud-stats"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '3px 8px',
        flexWrap: 'wrap'
      }}
    >
      <div
        className="tasks-hud-item"
        style={getStyle('all', 'var(--text-high)')}
        onClick={() => handleClick('all')}
        title="Ver todas las tareas"
      >
        <Layers size={12} color={statusFilter === 'all' ? 'var(--text-high)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">Total:</span>
        <strong style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>{stats.total}</strong>
      </div>

      <span className="tasks-hud-divider" style={{ color: 'var(--border-color)', opacity: 0.5 }}>|</span>

      <div
        className="tasks-hud-item"
        style={getStyle('pending', 'var(--accent)')}
        onClick={() => handleClick('pending')}
        title="Filtrar tareas pendientes en cola"
      >
        <Clock size={12} color={statusFilter === 'pending' ? 'var(--accent)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">En Cola:</span>
        <strong style={{ color: statusFilter === 'pending' ? 'var(--accent)' : 'inherit', fontFamily: 'var(--font-mono)' }}>{stats.pending}</strong>
      </div>

      <span className="tasks-hud-divider" style={{ color: 'var(--border-color)', opacity: 0.5 }}>|</span>

      <div
        className="tasks-hud-item"
        style={getStyle('focus', 'var(--warning)')}
        onClick={() => handleClick('focus')}
        title="Filtrar tareas urgentes en foco"
      >
        <Flame size={12} color={statusFilter === 'focus' ? 'var(--warning)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">En Foco:</span>
        <strong style={{ color: statusFilter === 'focus' ? 'var(--warning)' : 'inherit', fontFamily: 'var(--font-mono)' }}>{stats.highPriority}</strong>
      </div>

      <span className="tasks-hud-divider" style={{ color: 'var(--border-color)', opacity: 0.5 }}>|</span>

      <div
        className="tasks-hud-item"
        style={getStyle('completed', 'var(--primary)')}
        onClick={() => handleClick('completed')}
        title="Filtrar tareas completadas"
      >
        <CheckCircle2 size={12} color={statusFilter === 'completed' ? 'var(--primary)' : 'var(--text-muted)'} style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">Completadas:</span>
        <strong style={{ color: statusFilter === 'completed' ? 'var(--primary)' : 'inherit', fontFamily: 'var(--font-mono)' }}>
          {stats.completed} <span className="tasks-hud-pct">({stats.percent}%)</span>
        </strong>
      </div>
    </div>
  );
}
