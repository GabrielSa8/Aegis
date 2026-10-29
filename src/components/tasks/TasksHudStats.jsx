import React from 'react';
import { CheckCircle2, Clock, Flame, Layers } from 'lucide-react';

export function TasksHudStats({ stats }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '6px',
        padding: '3px 10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <Layers size={12} color="#94a3b8" />
        <span>Total:</span>
        <strong style={{ color: '#f1f5f9', fontFamily: 'var(--font-mono)' }}>{stats.total}</strong>
      </div>

      <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#38bdf8' }}>
        <Clock size={12} color="#38bdf8" />
        <span>En Cola:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.pending}</strong>
      </div>

      <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#fbbf24' }}>
        <Flame size={12} color="#fbbf24" />
        <span>En Foco:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>{stats.highPriority}</strong>
      </div>

      <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#34d399' }}>
        <CheckCircle2 size={12} color="#34d399" />
        <span>Completadas:</span>
        <strong style={{ fontFamily: 'var(--font-mono)' }}>
          {stats.completed} ({stats.percent}%)
        </strong>
      </div>
    </div>
  );
}
