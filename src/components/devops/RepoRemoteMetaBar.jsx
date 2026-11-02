import React from 'react';
import { 
  Globe2, 
  Lock, 
  GitBranch, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Zap 
} from 'lucide-react';

/**
 * RepoRemoteMetaBar — Franja informativa de metadata remota GitHub.
 * Muestra visibilidad (público/privado), rama default y estado de despliegue/checks (Vercel/Actions).
 */
export function RepoRemoteMetaBar({ meta }) {
  if (!meta) return null;

  const isSuccess = meta.commit_status_state === 'success';
  const isFailure = meta.commit_status_state === 'failure';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.45rem 1rem',
      background: 'rgba(0, 0, 0, 0.35)',
      borderBottom: '1px solid var(--border-color)',
      fontSize: '0.72rem',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      {/* Información de repo remoto */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          {meta.is_private ? <Lock size={12} color="#f59e0b" /> : <Globe2 size={12} color="var(--primary)" />}
          <strong style={{ color: 'var(--text-high)' }}>{meta.owner}/{meta.name}</strong>
          <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>({meta.is_private ? 'Privado' : 'Público'})</span>
        </span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
          <GitBranch size={12} />
          <span>Default: <code>{meta.default_branch}</code></span>
        </span>
      </div>

      {/* Estado del despliegue / checks del último commit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {meta.commit_status_state && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.68rem',
            fontWeight: 600,
            background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : isFailure ? 'rgba(239, 68, 68, 0.15)' : 'rgba(234, 179, 8, 0.15)',
            color: isSuccess ? '#34d399' : isFailure ? '#f87171' : '#facc15',
            border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.3)' : 'var(--border-color)'}`
          }}>
            {isSuccess ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
            <span>{meta.commit_status_context || 'Checks'}: {meta.commit_status_desc || meta.commit_status_state}</span>
          </span>
        )}

        {meta.commit_status_target_url && (
          <a
            href={meta.commit_status_target_url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--primary)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '2px',
              fontSize: '0.68rem'
            }}
          >
            <Zap size={11} />
            Live Preview
          </a>
        )}

        {meta.url && (
          <a
            href={meta.url}
            target="_blank"
            rel="noreferrer"
            style={{
              color: 'var(--text-muted)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <ExternalLink size={11} />
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}
