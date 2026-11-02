import React from 'react';
import { CheckCircle2, Clock, Flame, Layers } from 'lucide-react';

export function TasksHudStats({ stats }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '3px 10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <Layers size={12} color="var(--text-muted)" />
        <span>Total:</span>
        <strong style={{ color: 'var(--text-high)', fontFamily: 'var(--font-mono)' }}>{stats.total}</strong>
      </div>

      <span style={{ color: 'var(--border-color)' }}>|</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--accent)' }}>
        <Clock size={12} color="var(--accent)" />
        <span>En Cola:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.pending}</strong>
      </div>

      <span style={{ color: 'var(--border-color)' }}>|</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--warning)' }}>
        <Flame size={12} color="var(--warning)" />
        <span>En Foco:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.highPriority}</strong>
      </div>

      <span style={{ color: 'var(--border-color)' }}>|</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--primary)' }}>
        <CheckCircle2 size={12} color="var(--primary)" />
        <span>Completadas:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>
          {stats.completed} ({stats.percent}%)
        </strong>
      </div>
    </div>
  );
}
