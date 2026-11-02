import React, { useState } from 'react';
import { Zap, Trash2, ArrowRight, FileText } from 'lucide-react';
import { getSkillCategory, SKILL_CATEGORIES } from './devopsHelpers';

/**
 * SkillCard — Tarjeta compacta para una habilidad del arsenal.
 * Diseño denso y proporcional para evitar sensaciones de vacío en pantallas amplias.
 */
export function SkillCard({ skill, onOpen, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const categoryId = getSkillCategory(skill);
  const categoryObj = SKILL_CATEGORIES.find(c => c.id === categoryId) || { label: 'Meta' };

  return (
    <div
      onClick={() => onOpen(skill)}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.6rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '6px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, background 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 40%, transparent)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.background = 'var(--bg-card)';
        setConfirmDelete(false);
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
            <Zap size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {skill.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '0.56rem',
              fontWeight: 700,
              background: 'color-mix(in srgb, var(--border-color) 30%, transparent)',
              padding: '1px 5px',
              borderRadius: '3px',
              color: 'var(--text-muted)'
            }}>
              {categoryObj.label}
            </span>

            {onDelete && (
              confirmDelete ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(skill); setConfirmDelete(false); }}
                  style={{
                    background: 'color-mix(in srgb, var(--warning) 20%, transparent)',
                    border: '1px solid color-mix(in srgb, var(--warning) 40%, transparent)',
                    color: 'var(--warning)',
                    fontSize: '0.56rem',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontWeight: 800
                  }}
                  title="Confirmar desinstalación"
                >
                  ¿Borrar?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', padding: '1px', cursor: 'pointer', opacity: 0.6 }}
                  title="Desinstalar skill"
                >
                  <Trash2 size={11} />
                </button>
              )
            )}
          </div>
        </div>

        <p style={{
          fontSize: '0.66rem',
          color: 'var(--text-muted)',
          margin: 0,
          lineHeight: '1.35',
          display: '-webkit-box',
          WebkitLineClamp: 2,
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
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '4px',
        marginTop: '2px'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-mono, monospace)' }}>
          <FileText size={10} style={{ color: 'var(--primary)' }} />
          SKILL.md ({skill.file_count || 1} arch.)
        </span>
        <span style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.62rem' }}>
          Manual <ArrowRight size={9} />
        </span>
      </div>
    </div>
  );
}
