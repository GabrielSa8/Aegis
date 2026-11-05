import React from 'react';
import { Server, Search, Skull, Zap, Flame, HardDrive } from 'lucide-react';
import ProcessRow from './ProcessRow';

const SORT_TABS = [
  { id: 'ram', label: 'RAM', icon: Zap },
  { id: 'cpu', label: 'CPU', icon: Flame },
  { id: 'io', label: 'I/O', icon: HardDrive },
  { id: 'zombie', label: 'Zombies', icon: Skull }
];

export default function ProcessManagerSection({
  filteredProcesses,
  maxMemoryMb,
  maxCpuPercent,
  maxIoKbs,
  processSearch,
  onSearchChange,
  processSortMode,
  onSortModeChange,
  zombieCount,
  onKillProcess
}) {
  return (
    <div className="sentinel-card sentinel-process-manager" style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Barra de Herramientas Equilibrada */}
      <div className="sentinel-proc-toolbar" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div className="sentinel-proc-toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Server size={15} color="var(--primary)" />
            <h3 style={{
              fontSize: '0.78rem',
              fontWeight: 800,
              color: 'var(--text-high)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              margin: 0
            }}>
              Procesos del Sistema
            </h3>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono)'
            }}>
              ({filteredProcesses.length})
            </span>
          </div>

          <div className="sentinel-proc-sort-tabs" style={{
            display: 'inline-flex',
            background: 'color-mix(in srgb, var(--bg-surface) 90%, transparent)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            gap: '2px'
          }}>
            {SORT_TABS.map((tab) => {
              const isActive = processSortMode === tab.id;
              const Icon = tab.icon;
              const isZombieTab = tab.id === 'zombie';
              const showBadge = isZombieTab && zombieCount > 0;

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`sentinel-sort-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => onSortModeChange(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: isActive
                      ? (isZombieTab ? 'color-mix(in srgb, var(--danger) 22%, transparent)' : 'color-mix(in srgb, var(--primary) 20%, transparent)')
                      : 'transparent',
                    color: isActive
                      ? (isZombieTab ? 'var(--danger)' : 'var(--primary)')
                      : 'var(--text-muted)'
                  }}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                  {showBadge && (
                    <span style={{
                      background: 'var(--danger)',
                      color: 'var(--bg-main)',
                      fontSize: '0.58rem',
                      padding: '1px 5px',
                      borderRadius: '8px',
                      fontWeight: 800
                    }}>
                      {zombieCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sentinel-proc-search-box" style={{ position: 'relative', width: '210px' }}>
          <Search size={12} style={{
            position: 'absolute',
            left: '9px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            value={processSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrar por nombre o PID..."
            style={{
              width: '100%',
              padding: '5px 8px 5px 26px',
              fontSize: '0.70rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: 'color-mix(in srgb, var(--bg-surface) 70%, transparent)',
              color: 'var(--text-high)',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Cabecera de Columnas */}
      <div className="sentinel-proc-table-header" style={{
        display: 'flex',
        alignItems: 'center',
        padding: '3px 10px',
        fontSize: '0.64rem',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <span className="sentinel-col-pid" style={{ width: '55px', flexShrink: 0 }}>PID</span>
        <span className="sentinel-col-name" style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>Proceso & Binario</span>
        <span className="sentinel-col-state" style={{ width: '75px', flexShrink: 0, textAlign: 'center' }}>Estado</span>
        <span className="sentinel-col-consumption" style={{ width: '95px', flexShrink: 0, textAlign: 'right', paddingRight: '6px' }}>Consumo</span>
        <span className="sentinel-col-actions" style={{ width: '115px', flexShrink: 0, textAlign: 'right' }}>Acciones</span>
      </div>

      {/* Lista de Procesos */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        maxHeight: '380px',
        overflowY: 'auto',
        paddingRight: '3px'
      }}>
        {filteredProcesses.length > 0 ? (
          filteredProcesses.map((proc) => (
            <ProcessRow
              key={proc.pid}
              proc={proc}
              processSortMode={processSortMode}
              maxMemoryMb={maxMemoryMb}
              maxCpuPercent={maxCpuPercent}
              maxIoKbs={maxIoKbs}
              onKillProcess={onKillProcess}
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
            {processSortMode === 'zombie'
              ? '✅ Cero procesos zombies detectados'
              : `No se encontraron procesos para "${processSearch}"`}
          </div>
        )}
      </div>
    </div>
  );
}
