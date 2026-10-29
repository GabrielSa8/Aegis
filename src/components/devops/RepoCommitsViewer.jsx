import React from 'react';
import { Copy, Check } from 'lucide-react';

/**
 * RepoCommitsViewer — Visor del historial reciente de commits con copia rápida de hashes.
 */
export function RepoCommitsViewer({
  commits = [],
  copiedHash,
  onCopyHash
}) {
  if (!commits || commits.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
        No se encontraron commits recientes en esta rama.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {commits.map((c, ci) => {
        const isCopied = copiedHash === c.hash;
        return (
          <div
            key={ci}
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
              <button
                type="button"
                onClick={(e) => onCopyHash(c.hash, e)}
                title="Copiar hash de commit"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isCopied ? '#34d399' : '#38bdf8',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                {isCopied ? <Check size={11} /> : <Copy size={11} />}
                <span>{c.hash}</span>
              </button>
              <span style={{
                fontSize: '0.74rem',
                color: 'var(--text-high)',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {c.message}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.66rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#94a3b8' }}>{c.author}</span>
              <span style={{ color: 'var(--text-dim, #52615a)' }}>{c.date}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
