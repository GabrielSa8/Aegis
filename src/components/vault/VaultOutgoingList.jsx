import React from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';

/**
 * VaultOutgoingList — Renderizado atómico de la cuadrícula de enlaces salientes tipo [[Nota]].
 */
export function VaultOutgoingList({ outgoing, onNavigateNote }) {
  if (!outgoing || outgoing.length === 0) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
        Esta nota no contiene enlaces salientes tipo [[Nota]].
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '6px' }}>
      {outgoing.map((out, idx) => (
        <div
          key={`out-${idx}`}
          onClick={() => out.exists && onNavigateNote(out.target_title)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            background: 'var(--bg-card)',
            border: '1px solid',
            borderColor: out.exists ? 'var(--border-color)' : 'color-mix(in srgb, var(--danger) 30%, transparent)',
            borderRadius: 'var(--radius-sm)',
            cursor: out.exists ? 'pointer' : 'default'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            {out.exists ? (
              <ExternalLink size={12} color="var(--primary)" />
            ) : (
              <AlertCircle size={12} color="var(--danger)" />
            )}
            <span
              style={{
                fontSize: '0.72rem',
                color: out.exists ? 'var(--text-high)' : 'var(--text-muted)',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {out.target_title}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.62rem',
              padding: '1px 5px',
              borderRadius: 'var(--radius-xs)',
              background: out.exists ? 'rgba(255, 255, 255, 0.05)' : 'color-mix(in srgb, var(--danger) 15%, transparent)',
              color: out.exists ? 'var(--text-muted)' : 'var(--danger)'
            }}
          >
            {out.exists ? (out.occurrences > 1 ? `×${out.occurrences}` : out.target_hub) : 'No creada'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default VaultOutgoingList;
