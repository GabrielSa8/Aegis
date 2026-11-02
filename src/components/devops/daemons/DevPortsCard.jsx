import React, { useState } from 'react';
import { Globe, ExternalLink, XCircle, Filter } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * DevPortsCard — Radar de puertos y servidores de desarrollo activos (listening ports).
 * Soporta discriminación entre procesos Dev de usuario y daemons del sistema.
 */
export function DevPortsCard({ ports = [], onStopProcess, onOpenUrl, actionLoadingId }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'dev'

  const filteredPorts = filterMode === 'dev'
    ? ports.filter(p => !p.is_system)
    : ports;

  const devPortsCount = ports.filter(p => !p.is_system).length;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Servidores Locales & Puertos ({ports.length})
          </span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            color: 'var(--primary)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)'
          }}>
            {devPortsCount} Dev activos
          </span>
        </div>

        <div style={{
          display: 'flex',
          background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
          padding: '2px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setFilterMode('all')}
            style={{
              background: filterMode === 'all' ? 'var(--bg-card)' : 'transparent',
              color: filterMode === 'all' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.62rem',
              fontWeight: filterMode === 'all' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            Todos ({ports.length})
          </button>
          <button
            onClick={() => setFilterMode('dev')}
            style={{
              background: filterMode === 'dev' ? 'var(--bg-card)' : 'transparent',
              color: filterMode === 'dev' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '0.62rem',
              fontWeight: filterMode === 'dev' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            Solo Dev ({devPortsCount})
          </button>
        </div>
      </div>

      {filteredPorts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          No hay puertos escuchando bajo este filtro
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '6px',
          maxHeight: '260px',
          overflowY: 'auto'
        }}>
          {filteredPorts.map((item) => {
            const isWebPort = item.port >= 1024;
            const isStopping = actionLoadingId === `proc-${item.pid}`;

            return (
              <div
                key={`${item.port}-${item.pid || 'sys'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: item.is_system
                    ? 'color-mix(in srgb, var(--border-color) 6%, transparent)'
                    : 'color-mix(in srgb, var(--primary) 6%, transparent)',
                  border: `1px solid ${item.is_system ? 'var(--border-color)' : 'color-mix(in srgb, var(--primary) 25%, transparent)'}`,
                  fontSize: '0.72rem'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color: item.is_system ? 'var(--text-high)' : 'var(--primary)',
                      background: item.is_system
                        ? 'color-mix(in srgb, var(--border-color) 30%, transparent)'
                        : 'color-mix(in srgb, var(--primary) 15%, transparent)',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      fontSize: '0.68rem'
                    }}>
                      :{item.port}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text-high)' }}>
                      {item.process_name}
                    </span>
                    {item.is_system ? (
                      <span style={{
                        fontSize: '0.58rem',
                        padding: '1px 4px',
                        borderRadius: '3px',
                        background: 'color-mix(in srgb, var(--border-color) 30%, transparent)',
                        color: 'var(--text-muted)'
                      }}>
                        SISTEMA
                      </span>
                    ) : item.pid ? (
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        PID {item.pid}
                      </span>
                    ) : null}
                  </div>

                  <div style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={item.cmdline}>
                    {item.cmdline || 'Sin comando'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                  {isWebPort && (
                    <TacticalButton
                      variant="ghost"
                      size="xs"
                      icon={<ExternalLink size={11} />}
                      onClick={() => onOpenUrl(`http://localhost:${item.port}`)}
                      title={`Abrir http://localhost:${item.port}`}
                      style={{ padding: '3px 5px' }}
                    />
                  )}

                  {!item.is_system && item.pid && (
                    <TacticalButton
                      variant="danger"
                      size="xs"
                      icon={<XCircle size={11} />}
                      onClick={() => onStopProcess(item.pid)}
                      disabled={isStopping}
                      title="Detener proceso (SIGTERM)"
                      style={{ padding: '3px 5px' }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
