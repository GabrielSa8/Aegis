import React, { useState } from 'react';
import { Zap, Trash2, ArrowRight } from 'lucide-react';
import { getSkillCategory, SKILL_CATEGORIES } from './devopsHelpers';

/**
 * SkillCard — Tarjeta interactiva para una habilidad del arsenal.
 * Integra taxonomía visual, telemetría y acción de desinstalación.
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
        padding: '0.65rem 0.75rem',
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
            <Zap size={12} color="var(--primary)" flexShrink={0} />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {skill.name}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '0.56rem',
              background: 'rgba(255, 255, 255, 0.05)',
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
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#fca5a5',
                    fontSize: '0.58rem',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontWeight: 800
                  }}
                  title="Confirmar eliminación permanente"
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
        color: 'var(--text-muted)',
        borderTop: '1px solid rgba(255, 255, 255, 0.04)',
        paddingTop: '4px',
        marginTop: '2px'
      }}>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{skill.file_count} archivos</span>
        <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
          Ver manual <ArrowRight size={10} />
        </span>
      </div>
    </div>
  );
}
