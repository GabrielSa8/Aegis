import React from 'react';
import { 
  GitPullRequest, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle, 
  GitMerge, 
  FileText 
} from 'lucide-react';
import { TacticalButton } from '../ui';

/**
 * RepoPrViewer — Radar interactivo de Pull Requests abiertos y revisión remota.
 * Muestra autor, ramas de integración (head -> base), estado draft y enlace web.
 */
export function RepoPrViewer({
  prs = [],
  loading = false,
  error = null,
  onRefresh
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Barra de cabecera */}
      <div style={{
        padding: '0.6rem 1rem',
        background: 'rgba(0,0,0,0.2)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitPullRequest size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Pull Requests ({prs.length})
          </span>
        </div>

        <TacticalButton
          onClick={onRefresh}
          disabled={loading}
          icon={<RefreshCw size={12} className={loading ? 'spin-slow' : ''} />}
          variant="ghost"
        >
          Actualizar
        </TacticalButton>
      </div>

      {/* Contenido de Pull Requests */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {error && (
          <div style={{
            padding: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}

        {loading && prs.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <RefreshCw size={14} className="spin-slow" />
            <span>Consultando Pull Requests en GitHub...</span>
          </div>
        ) : prs.length === 0 && !error ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No hay Pull Requests abiertos actualmente en este repositorio.
          </div>
        ) : (
          prs.map((pr) => (
            <div
              key={pr.number}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                    #{pr.number} {pr.title}
                  </span>

                  {pr.is_draft && (
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.65rem',
                      background: 'rgba(148, 163, 184, 0.2)',
                      color: 'var(--text-muted)'
                    }}>
                      Borrador
                    </span>
                  )}

                  <span style={{
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: pr.state === 'OPEN' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                    color: pr.state === 'OPEN' ? '#34d399' : 'var(--text-muted)'
                  }}>
                    {pr.state}
                  </span>
                </div>

                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>Por: <strong>@{pr.author}</strong></span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <GitMerge size={11} /> {pr.head_ref} &rarr; {pr.base_ref}
                  </span>
                </div>
              </div>

              {pr.url && (
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    color: 'var(--primary)',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    textDecoration: 'none'
                  }}
                >
                  <ExternalLink size={12} />
                  Abrir PR
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
