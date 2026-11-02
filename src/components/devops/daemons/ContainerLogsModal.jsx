import React, { useState } from 'react';
import { Terminal, RefreshCw, X, Copy, Check } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * ContainerLogsModal — Visor táctico de logs de contenedor en tiempo real.
 */
export function ContainerLogsModal({ container, logs, loading, onClose, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [tailCount, setTailCount] = useState(100);

  if (!container) return null;

  const handleCopy = () => {
    if (!logs) return;
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectTail = (n) => {
    setTailCount(n);
    onRefresh(n);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '750px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.85rem 1rem',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} style={{ color: 'var(--primary)' }} />
            <div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Logs: {container.name}
              </span>
              <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-muted)', marginLeft: '6px' }}>
                ({container.id})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Selector de líneas */}
            <div style={{
              display: 'flex',
              background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
              padding: '2px',
              borderRadius: 'var(--radius-sm)'
            }}>
              {[50, 100, 250].map(n => (
                <button
                  key={n}
                  onClick={() => handleSelectTail(n)}
                  style={{
                    background: tailCount === n ? 'var(--bg-card)' : 'transparent',
                    color: tailCount === n ? 'var(--primary)' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '0.6rem',
                    cursor: 'pointer',
                    fontWeight: tailCount === n ? 700 : 500
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <TacticalButton
              variant="secondary"
              size="xs"
              icon={copied ? <Check size={11} /> : <Copy size={11} />}
              onClick={handleCopy}
              title="Copiar logs al portapapeles"
              style={{ fontSize: '0.65rem', padding: '3px 8px' }}
            >
              {copied ? 'Copiado' : 'Copiar'}
            </TacticalButton>

            <TacticalButton
              variant="ghost"
              size="xs"
              icon={<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />}
              onClick={() => onRefresh(tailCount)}
              disabled={loading}
              title="Refrescar logs"
              style={{ padding: '4px' }}
            />

            <TacticalButton
              variant="ghost"
              size="xs"
              icon={<X size={14} />}
              onClick={onClose}
              style={{ padding: '3px' }}
            />
          </div>
        </div>

        {/* Consola de logs */}
        <div style={{
          flex: 1,
          padding: '1rem',
          background: 'var(--bg-main)',
          overflowY: 'auto',
          minHeight: '260px',
          maxHeight: '500px'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              <RefreshCw size={14} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
              Obteniendo logs del contenedor...
            </div>
          ) : (
            <pre style={{
              margin: 0,
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              color: 'var(--text-high)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              lineHeight: 1.45
            }}>
              {logs || '(No hay registros para mostrar)'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
