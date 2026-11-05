import React, { useState } from 'react';
import { Globe, ExternalLink, XCircle } from 'lucide-react';

/**
 * DevPortsCard — Radar de alta densidad para puertos y servidores locales en escucha.
 * Formato tabular estructurado para máxima densidad de información y cero vacío visual.
 */
export function DevPortsCard({ ports = [], onStopProcess, onOpenUrl, actionLoadingId, fillHeight = false, style = {} }) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'dev'
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPorts = ports.filter(p => {
    const matchFilter = filterMode === 'all' || !p.is_system;
    const matchSearch = !searchTerm.trim() ||
      String(p.port).includes(searchTerm.trim()) ||
      (p.process_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.cmdline || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const devPortsCount = ports.filter(p => !p.is_system).length;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.55rem',
      ...(fillHeight ? { flex: 1, minHeight: 0 } : {}),
      ...style
    }}>
      {/* 🧭 Cabecera con Contadores y Filtros */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Puertos y Sockets en Escucha ({ports.length})
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input
            type="text"
            placeholder="Filtrar puerto/proceso..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '2px 6px',
              color: 'var(--text-high)',
              fontSize: '0.62rem',
              width: '130px',
              outline: 'none'
            }}
          />

          <div style={{
            display: 'flex',
            background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setFilterMode('all')}
              className={`devops-subfilter-btn ${filterMode === 'all' ? 'is-active' : ''}`}
            >
              Todos ({ports.length})
            </button>
            <button
              onClick={() => setFilterMode('dev')}
              className={`devops-subfilter-btn ${filterMode === 'dev' ? 'is-active' : ''}`}
            >
              Solo Dev ({devPortsCount})
            </button>
          </div>
        </div>
      </div>

      {filteredPorts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '1.5rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          No hay sockets escuchando bajo este criterio
        </div>
      ) : (
        /* 📋 Tabla de Puertos de Alta Densidad */
        <div className="dev-ports-table-wrapper" style={{ flex: fillHeight ? 1 : 'none', minHeight: 0 }}>
          <div className="dev-ports-table-content">
            {/* Cabecera de columnas */}
            <div className="dev-ports-table-header">
              <span>Puerto</span>
              <span>Proceso / PID</span>
              <span>Tipo</span>
              <span>Línea de Comandos</span>
              <span style={{ textAlign: 'right' }}>Acción</span>
            </div>

            {/* Filas scrolleables */}
            <div style={{
              flex: fillHeight ? 1 : 'none',
              maxHeight: fillHeight ? 'none' : '280px',
              overflowY: 'auto',
              minHeight: 0
            }}>
              {filteredPorts.map((item) => {
                const isWebPort = item.port >= 1024;
                const isStopping = actionLoadingId === `proc-${item.pid}`;

                return (
                  <div
                    key={`${item.port}-${item.pid || 'sys'}`}
                    className="dev-ports-table-row"
                  >
                    {/* Puerto */}
                  <span style={{
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: item.is_system ? 'var(--text-high)' : 'var(--primary)',
                    background: item.is_system
                      ? 'color-mix(in srgb, var(--border-color) 30%, transparent)'
                      : 'color-mix(in srgb, var(--primary) 15%, transparent)',
                    padding: '1px 5px',
                    borderRadius: '4px',
                    fontSize: '0.64rem',
                    width: 'fit-content'
                  }}>
                    :{item.port}
                  </span>

                  {/* Proceso & PID */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-high)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.process_name}
                    </span>
                    {item.pid && (
                      <span style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        ({item.pid})
                      </span>
                    )}
                  </div>

                  {/* Tipo */}
                  <div>
                    <span style={{
                      fontSize: '0.56rem',
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: item.is_system
                        ? 'color-mix(in srgb, var(--border-color) 25%, transparent)'
                        : 'color-mix(in srgb, var(--primary) 18%, transparent)',
                      color: item.is_system ? 'var(--text-muted)' : 'var(--primary)'
                    }}>
                      {item.is_system ? 'SISTEMA' : 'DEV LOCAL'}
                    </span>
                  </div>

                  {/* Línea de Comandos */}
                  <div style={{
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    color: 'var(--text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }} title={item.cmdline}>
                    {item.cmdline || '-'}
                  </div>

                  {/* Acciones */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                    {isWebPort && onOpenUrl && (
                      <button
                        type="button"
                        onClick={() => onOpenUrl(`http://localhost:${item.port}`)}
                        className="cockpit-action-btn primary"
                        style={{ border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)' }}
                        title={`Abrir http://localhost:${item.port} en navegador`}
                      >
                        <ExternalLink size={9} />
                        <span>Web</span>
                      </button>
                    )}

                    {!item.is_system && item.pid && onStopProcess && (
                      <button
                        type="button"
                        onClick={() => onStopProcess(item.pid, item.process_name)}
                        disabled={isStopping}
                        className="devops-icon-action-btn danger"
                        title={`Terminar proceso PID ${item.pid} (SIGTERM)`}
                      >
                        <XCircle size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
