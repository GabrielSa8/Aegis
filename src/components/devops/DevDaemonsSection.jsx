import React, { useState } from 'react';
import { Activity, RefreshCw, Terminal } from 'lucide-react';
import { TacticalButton } from '../ui';
import { DevAdbCard } from './daemons/DevAdbCard';
import { DevContainersCard } from './daemons/DevContainersCard';
import { DevPortsCard } from './daemons/DevPortsCard';

/**
 * DevDaemonsSection — Sección central para la supervisión y control
 * de procesos de desarrollo, daemons ADB, contenedores y servidores locales.
 */
export function DevDaemonsSection({
  daemons,
  loading,
  refreshing,
  actionLoadingId,
  onRefresh,
  onRestartAdb,
  onToggleContainer,
  onOpenCreateContainer,
  onViewContainerLogs,
  onDeleteContainer,
  onStopProcess,
  onOpenUrl,
  fillHeight = false
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'adb' | 'containers' | 'ports'

  const adbRunning = Boolean(daemons?.adb?.server_running);
  const adbDevicesCount = daemons?.adb?.devices?.length || 0;
  const runningContainers = (daemons?.containers || []).filter(c => c.state === 'running').length;
  const portsCount = daemons?.listening_ports?.length || 0;

  return (
    <div className={`dev-daemons-container ${fillHeight ? 'fill-height' : ''}`}>
      {/* 🧭 Encabezado de la Sección */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '0 2px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Activity size={15} style={{ color: 'var(--primary)' }} />
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em'
          }}>
            Radar Daemons & Servicios
          </span>

          {/* Quick Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: adbRunning
                ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
              color: adbRunning ? 'var(--primary)' : 'var(--text-muted)',
              border: '1px solid var(--border-color)'
            }}>
              ADB: {adbRunning ? `${adbDevicesCount} devs` : 'Off'}
            </span>

            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: runningContainers > 0
                ? 'color-mix(in srgb, var(--primary) 12%, transparent)'
                : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
              color: runningContainers > 0 ? 'var(--primary)' : 'var(--text-muted)',
              border: '1px solid var(--border-color)'
            }}>
              Contenedores: {runningContainers} act.
            </span>

            <span style={{
              fontSize: '0.6rem',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
              color: 'var(--text-high)',
              border: '1px solid var(--border-color)'
            }}>
              Puertos: {portsCount}
            </span>

            {daemons?.sam_cli_installed && (
              <span className="dev-daemons-badge-extra" style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px',
                background: 'color-mix(in srgb, var(--secondary) 15%, transparent)',
                color: 'var(--secondary)',
                border: '1px solid color-mix(in srgb, var(--secondary) 30%, transparent)'
              }} title={daemons?.sam_version}>
                SAM CLI OK
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Selector de Pestañas de Vista */}
          <div style={{
            display: 'flex',
            background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)'
          }}>
            {[
              { id: 'all', label: 'Todo' },
              { id: 'adb', label: 'Android' },
              { id: 'containers', label: 'Contenedores' },
              { id: 'ports', label: 'Puertos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`devops-subfilter-btn ${activeTab === tab.id ? 'is-active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <TacticalButton
            variant="ghost"
            size="xs"
            icon={<RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />}
            onClick={() => onRefresh(true)}
            disabled={refreshing || loading}
            title="Refrescar telemetría de daemons"
            style={{ padding: '4px' }}
          />
        </div>
      </div>

      {/* 📊 Cuadrícula de Daemons */}
      {loading ? (
        <div style={{
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-md)'
        }}>
          <RefreshCw size={14} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
          Escaneando daemons y servicios activos...
        </div>
      ) : activeTab === 'all' ? (
        <div
          className="dev-daemons-grid"
          style={{
            flex: fillHeight ? 1 : 'none',
            minHeight: 0
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            overflowY: fillHeight ? 'auto' : 'visible',
            minHeight: 0
          }}>
            <DevAdbCard
              adb={daemons?.adb}
              onRestart={onRestartAdb}
              actionLoadingId={actionLoadingId}
            />
            <DevContainersCard
              containers={daemons?.containers}
              runtime={daemons?.container_runtime}
              onToggleContainer={onToggleContainer}
              onOpenCreate={onOpenCreateContainer}
              onViewLogs={onViewContainerLogs}
              onDeleteContainer={onDeleteContainer}
              actionLoadingId={actionLoadingId}
            />
          </div>

          <DevPortsCard
            ports={daemons?.listening_ports}
            onStopProcess={onStopProcess}
            onOpenUrl={onOpenUrl}
            actionLoadingId={actionLoadingId}
            fillHeight={fillHeight}
          />
        </div>
      ) : (
        <div style={{ flex: fillHeight ? 1 : 'none', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'adb' && (
            <DevAdbCard
              adb={daemons?.adb}
              onRestart={onRestartAdb}
              actionLoadingId={actionLoadingId}
            />
          )}
          {activeTab === 'containers' && (
            <DevContainersCard
              containers={daemons?.containers}
              runtime={daemons?.container_runtime}
              onToggleContainer={onToggleContainer}
              onOpenCreate={onOpenCreateContainer}
              onViewLogs={onViewContainerLogs}
              onDeleteContainer={onDeleteContainer}
              actionLoadingId={actionLoadingId}
            />
          )}
          {activeTab === 'ports' && (
            <DevPortsCard
              ports={daemons?.listening_ports}
              onStopProcess={onStopProcess}
              onOpenUrl={onOpenUrl}
              actionLoadingId={actionLoadingId}
              fillHeight={fillHeight}
            />
          )}
        </div>
      )}
    </div>
  );
}
