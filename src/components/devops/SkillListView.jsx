import React from 'react';
import { Zap, ArrowRight } from 'lucide-react';
import { getSkillCategory, SKILL_CATEGORIES } from './devopsHelpers';

/**
 * SkillListView — Vista en lista de alta densidad para habilidades.
 */
export function SkillListView({ skills = [], onOpenSkill, fillHeight = false }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      overflowY: 'auto',
      flex: fillHeight ? 1 : 'none',
      minHeight: 0
    }}>
      {skills.map((s) => {
        const catObj = SKILL_CATEGORIES.find((c) => c.id === getSkillCategory(s)) || { label: 'Meta' };
        return (
          <div
            key={s.id}
            onClick={() => onOpenSkill(s)}
            style={{
              display: 'grid',
              gridTemplateColumns: '220px 100px 1fr 100px',
              gap: '8px',
              alignItems: 'center',
              padding: '5px 10px',
              borderBottom: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
              fontSize: '0.68rem',
              cursor: 'pointer',
              transition: 'background 0.1s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
              <Zap size={11} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.name}
              </span>
            </div>

            <span style={{
              fontSize: '0.56rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '3px',
              background: 'color-mix(in srgb, var(--border-color) 30%, transparent)',
              color: 'var(--text-muted)',
              width: 'fit-content'
            }}>
              {catObj.label}
            </span>

            <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.62rem' }}>
              {s.description}
            </span>

            <div style={{ textAlign: 'right', color: 'var(--primary)', fontWeight: 600, fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px' }}>
              <span>Manual</span>
              <ArrowRight size={9} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
