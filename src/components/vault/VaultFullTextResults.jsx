import React from 'react';
import { RefreshCw } from 'lucide-react';
import { highlightMatch } from './vaultHelpers';

export function VaultFullTextResults({
  fullTextResults,
  searchingFullText,
  searchTerm,
  notes,
  activeNote,
  loadNote
}) {
  return (
    <div>
      <div
        style={{
          padding: '4px 6px',
          fontSize: '0.64rem',
          color: 'var(--text-muted)',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>RESULTADOS EN TEXTO</span>
        {searchingFullText && <RefreshCw size={11} className="animate-spin" color="#c084fc" />}
        {!searchingFullText && <span>{fullTextResults.length} notas</span>}
      </div>

      {searchingFullText && fullTextResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          Escaneando Bóveda en Rust...
        </div>
      ) : fullTextResults.length === 0 && searchTerm.trim().length >= 2 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          Sin coincidencias para "{searchTerm}"
        </div>
      ) : fullTextResults.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
          Escribe al menos 2 caracteres para buscar en todo el texto.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {fullTextResults.map((res) => {
            const noteMatch = notes.find((n) => n.path === res.path);
            return (
              <div
                key={res.path}
                onClick={() => noteMatch && loadNote(noteMatch)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: activeNote?.path === res.path ? 'rgba(168, 85, 247, 0.12)' : 'rgba(0, 0, 0, 0.2)',
                  border: activeNote?.path === res.path ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#e9d5ff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {res.title}
                  </span>
                  <span
                    style={{
                      fontSize: '0.58rem',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {res.hub.replace(/^\d+\s*/, '')}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {res.matches.map((m, mIdx) => (
                    <div
                      key={mIdx}
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--text-muted)',
                        fontFamily: 'monospace',
                        lineHeight: '1.3',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span style={{ color: '#fbbf24', marginRight: '4px' }}>L{m.line_number}:</span>
                      {highlightMatch(m.line_text, searchTerm)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
