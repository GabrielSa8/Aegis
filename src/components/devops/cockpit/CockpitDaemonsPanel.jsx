import React from 'react';
import { Activity, Smartphone, Box, Globe, ExternalLink, ArrowRight } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * CockpitDaemonsPanel — Panel compacto de daemons, contenedores y puertos para el Cockpit DevOps.
 */
export function CockpitDaemonsPanel({
  daemons,
  onNavigateTab,
  onRestartAdb,
  onToggleContainer,
  onOpenUrl,
  daemonActionLoadingId
}) {
  const adbRunning = Boolean(daemons?.adb?.server_running);
  const adbDevices = daemons?.adb?.devices || [];
  const containers = daemons?.containers || [];
  const runningContainers = containers.filter(c => c.state === 'running');
  const devPorts = (daemons?.listening_ports || []).filter(p => !p.is_system);

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: 0,
      overflow: 'hidden'
    }}>
      {/* Cabecera del Panel */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.6rem 0.85rem',
        borderBottom: '1px solid var(--border-color)',
        background: 'color-mix(in srgb, var(--border-color) 10%, transparent)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-high)' }}>
            Daemons & Servicios Dev
          </span>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('daemons')}
          className="cockpit-view-all-btn"
        >
          <span>Ver radar</span>
          <ArrowRight size={11} />
        </button>
      </div>

      {/* Scroll Interno de Daemons */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {/* Mini ADB */}
        <div style={{
          background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.55rem 0.65rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Smartphone size={13} style={{ color: 'var(--primary)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>ADB Android</span>
            <span style={{
              fontSize: '0.58rem',
              padding: '1px 5px',
              borderRadius: '8px',
              fontWeight: 700,
              background: adbRunning ? 'color-mix(in srgb, var(--primary) 15%, transparent)' : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
              color: adbRunning ? 'var(--primary)' : 'var(--text-muted)'
            }}>
              {adbRunning ? `${adbDevices.length} activo(s)` : 'OFF'}
            </span>
          </div>

          <TacticalButton
            variant="secondary"
            size="xs"
            onClick={onRestartAdb}
            disabled={daemonActionLoadingId === 'adb-restart'}
            style={{ fontSize: '0.58rem', padding: '2px 6px' }}
          >
            Reiniciar
          </TacticalButton>
        </div>

        {/* Mini Contenedores Podman */}
        <div style={{
          background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.55rem 0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Box size={13} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Contenedores ({runningContainers.length}/{containers.length})
              </span>
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {daemons?.container_runtime?.toUpperCase() || 'PODMAN'}
            </span>
          </div>

          {containers.length === 0 ? (
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Sin contenedores creados</span>
          ) : (
            containers.slice(0, 3).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.64rem' }}>
                <span style={{ color: c.state === 'running' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600 }}>
                  • {c.name}
                </span>
                <button
                  type="button"
                  onClick={() => onToggleContainer(c.id, c.state === 'running' ? 'stop' : 'start')}
                  className="cockpit-action-btn"
                >
                  {c.state === 'running' ? 'Detener' : 'Iniciar'}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Mini Puertos Dev */}
        <div style={{
          background: 'color-mix(in srgb, var(--border-color) 8%, transparent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.55rem 0.65rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Globe size={13} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Puertos Dev Activos ({devPorts.length})
              </span>
            </div>
          </div>

          {devPorts.length === 0 ? (
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>No hay servidores de desarrollo activos</span>
          ) : (
            devPorts.slice(0, 4).map(p => (
              <div key={p.port} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.64rem' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700 }}>
                  :{p.port} <strong style={{ color: 'var(--text-high)', fontFamily: 'inherit' }}>{p.process_name}</strong>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => onOpenUrl(`http://localhost:${p.port}`)}
                    className="cockpit-action-btn primary"
                    title="Abrir en navegador"
                  >
                    <ExternalLink size={10} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
