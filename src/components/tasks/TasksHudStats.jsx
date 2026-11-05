import React from 'react';
import { CheckCircle2, Clock, Flame, Layers } from 'lucide-react';

export function TasksHudStats({ stats }) {
  return (
    <div
      className="tasks-hud-stats"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '3px 10px',
        flexWrap: 'wrap'
      }}
    >
      <div className="tasks-hud-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <Layers size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">Total:</span>
        <strong style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>{stats.total}</strong>
      </div>

      <span className="tasks-hud-divider" style={{ color: 'var(--border-color)' }}>|</span>

      <div className="tasks-hud-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--accent)' }}>
        <Clock size={12} color="var(--accent)" style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">En Cola:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.pending}</strong>
      </div>

      <span className="tasks-hud-divider" style={{ color: 'var(--border-color)' }}>|</span>

      <div className="tasks-hud-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--warning)' }}>
        <Flame size={12} color="var(--warning)" style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">En Foco:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.highPriority}</strong>
      </div>

      <span className="tasks-hud-divider" style={{ color: 'var(--border-color)' }}>|</span>

      <div className="tasks-hud-item" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--primary)' }}>
        <CheckCircle2 size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
        <span className="tasks-hud-label">Completadas:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>
          {stats.completed} <span className="tasks-hud-pct">({stats.percent}%)</span>
        </strong>
      </div>
    </div>
  );
}
