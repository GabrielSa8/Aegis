import React from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  Radio, 
  AlertTriangle 
} from 'lucide-react';
import { TacticalButton } from '../ui';

/**
 * RepoCiCdViewer — Visor de Telemetría CI/CD de GitHub Actions en vivo.
 * Renderiza runs con estados semánticos, duración/tiempo y botón de trigger manual.
 */
export function RepoCiCdViewer({
  runs = [],
  loading = false,
  error = null,
  onRefresh,
  onTrigger,
  triggering = false
}) {
  const getStatusBadge = (status, conclusion) => {
    if (status === 'in_progress' || status === 'queued') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          fontWeight: 700,
          background: 'rgba(234, 179, 8, 0.15)',
          color: '#facc15',
          border: '1px solid rgba(234, 179, 8, 0.3)'
        }}>
          <Radio size={11} className="spin-slow" />
          En progreso
        </span>
      );
    }

    if (conclusion === 'success') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          fontWeight: 700,
          background: 'rgba(16, 185, 129, 0.15)',
          color: '#34d399',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <CheckCircle2 size={11} />
          Exitoso
        </span>
      );
    }

    if (conclusion === 'failure') {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          fontWeight: 700,
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          border: '1px solid rgba(239, 68, 68, 0.3)'
        }}>
          <XCircle size={11} />
          Fallido
        </span>
      );
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.68rem',
        fontWeight: 600,
        background: 'rgba(148, 163, 184, 0.15)',
        color: 'var(--text-muted)',
        border: '1px solid var(--border-color)'
      }}>
        <Clock size={11} />
        {conclusion || status}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Controles de barra CI/CD */}
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
          <PlayCircle size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Workflows & Builds Activos ({runs.length})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TacticalButton
            onClick={onRefresh}
            disabled={loading}
            icon={<RefreshCw size={12} className={loading ? 'spin-slow' : ''} />}
            variant="ghost"
          >
            Actualizar
          </TacticalButton>

          <TacticalButton
            onClick={() => onTrigger('release.yml')}
            disabled={triggering}
            icon={<PlayCircle size={12} />}
            variant="primary"
          >
            {triggering ? 'Disparando...' : 'Lanzar Release'}
          </TacticalButton>
        </div>
      </div>

      {/* Lista de Runs */}
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

        {loading && runs.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '8px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            <RefreshCw size={14} className="spin-slow" />
            <span>Consultando GitHub Actions vía `gh` CLI...</span>
          </div>
        ) : runs.length === 0 && !error ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            No se han registrado ejecuciones de GitHub Actions recientes en este repositorio.
          </div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
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
                    {run.name || run.workflow_name}
                  </span>
                  {getStatusBadge(run.status, run.conclusion)}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>Rama: <strong>{run.branch}</strong></span>
                  <span>Iniciado: {new Date(run.created_at).toLocaleString()}</span>
                  <span>ID: #{run.id}</span>
                </div>
              </div>

              {run.url && (
                <a
                  href={run.url}
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
                  Ver en GitHub
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
