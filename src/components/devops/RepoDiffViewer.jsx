import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';
import { getStatusBadgeConfig, getDiffLineStyle } from './devopsHelpers';

/**
 * RepoDiffViewer — Visor de archivos pendientes y diff unificado en vivo con resaltado de sintaxis.
 */
export function RepoDiffViewer({ repo, repoDetails }) {
  const statusFiles = repoDetails?.status_files || [];
  const diffText = repoDetails?.diff_text || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      {/* Advertencia Crítica */}
      {repo?.warning && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          fontSize: '0.72rem',
          color: '#fbbf24',
          fontWeight: 600
        }}>
          <ShieldAlert size={14} flexShrink={0} />
          <span>{repo.warning} — Respeta la disciplina de staging puntual.</span>
        </div>
      )}

      {/* Lista de archivos modificados */}
      {statusFiles.length > 0 ? (
        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>
            Archivos Pendientes ({statusFiles.length}):
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {statusFiles.map((f, fi) => {
              const cfg = getStatusBadgeConfig(f.status);
              return (
                <span
                  key={fi}
                  style={{
                    fontSize: '0.66rem',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <span style={{ fontWeight: 800, color: cfg.color }}>{f.status}</span>
                  <span style={{ color: 'var(--text-high)' }}>{f.path}</span>
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-sm)',
          color: '#34d399',
          fontSize: '0.74rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={13} />
          <span>Árbol de trabajo 100% limpio. No hay modificaciones pendientes en disco.</span>
        </div>
      )}

      {/* Visor de Diff con Resaltado de Sintaxis */}
      {diffText ? (
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: '#090d0b',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          padding: '0.75rem',
          fontFamily: 'monospace',
          fontSize: '0.74rem',
          lineHeight: '1.45',
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)'
        }}>
          {diffText.split('\n').map((line, li) => {
            const style = getDiffLineStyle(line);
            return (
              <div
                key={li}
                style={{
                  color: style.color,
                  background: style.bg,
                  padding: '1px 4px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {line || ' '}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
