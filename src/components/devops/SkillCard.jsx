import React from 'react';
import { Zap } from 'lucide-react';

/**
 * SkillCard — Tarjeta interactiva para una habilidad del arsenal.
 */
export function SkillCard({ skill, onOpen }) {
  return (
    <div
      onClick={() => onOpen(skill)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '4px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={12} color="var(--primary, #10b981)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
              {skill.name}
            </span>
          </div>
          <span style={{
            fontSize: '0.58rem',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '1px 5px',
            borderRadius: '3px',
            color: 'var(--text-muted)'
          }}>
            v{skill.version}
          </span>
        </div>

        <p style={{
          fontSize: '0.68rem',
          color: 'var(--text-muted)',
          margin: 0,
          lineHeight: '1.35',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {skill.description || 'Sin descripción disponible.'}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.62rem',
        color: 'var(--text-dim, #52615a)',
        borderTop: '1px solid rgba(255, 255, 255, 0.03)',
        paddingTop: '4px',
        marginTop: '2px'
      }}>
        <span>{skill.file_count} archivos</span>
        <span style={{ color: 'var(--primary, #34d399)', fontWeight: 600 }}>Ver manual →</span>
      </div>
    </div>
  );
}
