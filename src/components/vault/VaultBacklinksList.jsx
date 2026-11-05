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
    <div className="vault-backlinks-list">
      {incoming.map((item, idx) => (
        <div
          key={`backlink-${idx}`}
          onClick={() => onNavigateNote(item.source_title)}
          className="vault-backlink-card"
        >
          <div className="vault-backlink-header-row">
            <div className="vault-backlink-title-meta">
              <FileText size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
              <strong className="vault-backlink-title">{item.source_title}</strong>
              {item.source_hub && (
                <span className="vault-backlink-hub">
                  {item.source_hub}
                </span>
              )}
            </div>
            <span className="vault-backlink-line">
              <Hash size={10} /> Línea {item.line_number}
            </span>
          </div>
          {item.snippet && (
            <div className="vault-backlink-snippet">
              {item.snippet}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default VaultBacklinksList;
