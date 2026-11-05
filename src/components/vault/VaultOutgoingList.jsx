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
    <div className="vault-outgoing-grid">
      {outgoing.map((out, idx) => (
        <div
          key={`out-${idx}`}
          onClick={() => out.exists && onNavigateNote(out.target_title)}
          className={`vault-outgoing-card ${out.exists ? 'is-valid' : 'is-missing'}`}
        >
          <div className="vault-outgoing-content">
            {out.exists ? (
              <ExternalLink size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
            ) : (
              <AlertCircle size={12} color="var(--danger)" style={{ flexShrink: 0 }} />
            )}
            <span className="vault-outgoing-title">
              {out.target_title}
            </span>
          </div>
          <span className={`vault-outgoing-tag ${out.exists ? 'is-valid' : 'is-missing'}`}>
            {out.exists ? (out.occurrences > 1 ? `×${out.occurrences}` : out.target_hub) : 'No creada'}
          </span>
        </div>
      ))}
    </div>
  );
}

export default VaultOutgoingList;
