import React from 'react';
import { FileText, Hash } from 'lucide-react';

/**
 * VaultBacklinksList — Renderizado atómico de la lista de notas entrantes con snippet y número de línea.
 */
export function VaultBacklinksList({ incoming, onNavigateNote }) {
  if (!incoming || incoming.length === 0) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
        Ninguna otra nota de la bóveda enlaza a esta nota aún.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {incoming.map((item, idx) => (
        <div
          key={`backlink-${idx}`}
          onClick={() => onNavigateNote(item.source_title)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '6px 10px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={12} color="var(--primary)" />
              <strong style={{ fontSize: '0.74rem', color: 'var(--text-high)' }}>{item.source_title}</strong>
              <span
                style={{
                  fontSize: '0.64rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '1px 5px',
                  borderRadius: 'var(--radius-xs)'
                }}
              >
                {item.source_hub}
              </span>
            </div>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <Hash size={10} /> Línea {item.line_number}
            </span>
          </div>
          <div
            style={{
              fontSize: '0.70rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '4px 6px',
              borderRadius: 'var(--radius-xs)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {item.snippet}
          </div>
        </div>
      ))}
    </div>
  );
}

export default VaultBacklinksList;
