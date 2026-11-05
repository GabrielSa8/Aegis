import React from 'react';
import { AlertOctagon } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';
import { formatRateKbs } from './sentinelHelpers';

export default function ProcessRow({
  proc,
  processSortMode,
  maxMemoryMb,
  maxCpuPercent,
  maxIoKbs,
  onKillProcess
}) {
  let ratio = 0;
  let primaryMetric = `${proc.memoryMb} MB`;
  let secondaryMetric = `${(proc.cpuPercent || 0).toFixed(1)}%`;
  let barColor = 'color-mix(in srgb, var(--accent) 12%, transparent)';

  if (processSortMode === 'cpu') {
    ratio = Math.min(100, ((proc.cpuPercent || 0) / (maxCpuPercent || 100)) * 100);
    primaryMetric = `${(proc.cpuPercent || 0).toFixed(1)}%`;
    secondaryMetric = `${proc.memoryMb} MB`;
    barColor = proc.cpuPercent > 50
      ? 'color-mix(in srgb, var(--danger) 18%, transparent)'
      : 'color-mix(in srgb, var(--warning) 14%, transparent)';
  } else if (processSortMode === 'io') {
    ratio = Math.min(100, ((proc.ioKbs || 0) / (maxIoKbs || 100)) * 100);
    primaryMetric = formatRateKbs(proc.ioKbs || 0);
    secondaryMetric = `${proc.memoryMb} MB`;
    barColor = 'color-mix(in srgb, var(--accent) 14%, transparent)';
  } else {
    ratio = Math.min(100, (proc.memoryMb / (maxMemoryMb || 1000)) * 100);
    primaryMetric = `${proc.memoryMb} MB`;
    secondaryMetric = `${(proc.cpuPercent || 0).toFixed(1)}%`;
    barColor = proc.memoryMb > 500
      ? 'color-mix(in srgb, var(--danger) 16%, transparent)'
      : 'color-mix(in srgb, var(--accent) 9%, transparent)';
  }

  const stateTag = proc.isZombie ? 'Zombie' : proc.state === 'R' ? 'Activo' : 'Reposo';
  const stateColor = proc.isZombie ? 'var(--danger)' : proc.state === 'R' ? 'var(--primary)' : 'var(--text-muted)';

  return (
    <div
      className="sentinel-process-row"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        minHeight: '38px',
        padding: '5px 10px',
        background: 'color-mix(in srgb, var(--bg-surface) 45%, transparent)',
        border: `1px solid ${proc.isZombie ? 'color-mix(in srgb, var(--danger) 40%, transparent)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-sm)',
        gap: '8px',
        overflow: 'hidden',
        transition: 'background 0.15s ease'
      }}
    >
      {/* Barra de progreso de fondo */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${ratio}%`,
        background: barColor,
        pointerEvents: 'none'
      }} />

      {/* PID */}
      <div className="sentinel-cell-pid" style={{ width: '55px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          background: 'color-mix(in srgb, var(--bg-card) 80%, transparent)',
          padding: '1px 5px',
          borderRadius: '4px',
          border: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)',
          display: 'inline-block'
        }}>
          #{proc.pid}
        </span>
      </div>

      {/* Proceso y Cmdline */}
      <div className="sentinel-cell-name" style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        position: 'relative',
        zIndex: 1,
        paddingRight: '6px'
      }}>
        <span style={{
          fontSize: '0.78rem',
          fontWeight: 700,
          color: 'var(--text-high)',
          lineHeight: '1.2',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }} title={proc.name}>
          {proc.name}
        </span>
        {proc.cmdline && proc.cmdline !== proc.name && (
          <span style={{
            fontSize: '0.64rem',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: '1.1'
          }} title={proc.cmdline}>
            {proc.cmdline}
          </span>
        )}
      </div>

      {/* Estado */}
      <div className="sentinel-cell-state" style={{ width: '75px', flexShrink: 0, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <span style={{
          fontSize: '0.62rem',
          fontWeight: 700,
          color: stateColor,
          background: `color-mix(in srgb, ${stateColor} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${stateColor} 26%, transparent)`,
          padding: '1px 6px',
          borderRadius: '4px',
          display: 'inline-block'
        }}>
          {stateTag}
        </span>
      </div>

      {/* Consumo */}
      <div className="sentinel-cell-consumption" style={{
        width: '95px',
        flexShrink: 0,
        textAlign: 'right',
        paddingRight: '6px',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'flex-end',
        gap: '5px'
      }}>
        <span style={{
          fontSize: '0.76rem',
          fontWeight: 800,
          color: 'var(--text-high)',
          fontFamily: 'var(--font-mono)'
        }}>
          {primaryMetric}
        </span>
        <span style={{
          fontSize: '0.62rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)'
        }}>
          {secondaryMetric}
        </span>
      </div>

      {/* Acciones */}
      <div className="sentinel-cell-actions" style={{
        width: '115px',
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '4px',
        position: 'relative',
        zIndex: 1
      }}>
        <TacticalButton
          className="sentinel-proc-btn sentinel-proc-term-btn"
          variant="secondary"
          size="xs"
          onClick={() => onKillProcess(proc, 15)}
          title={`SIGTERM PID ${proc.pid}`}
          style={{ padding: '2px 7px', fontSize: '0.66rem' }}
        >
          Terminar
        </TacticalButton>
        <TacticalButton
          className="sentinel-proc-btn sentinel-proc-kill-btn"
          variant="danger"
          size="xs"
          icon={AlertOctagon}
          onClick={() => onKillProcess(proc, 9)}
          title={`SIGKILL PID ${proc.pid}`}
          style={{ padding: '2px 6px', fontSize: '0.66rem' }}
        >
          -9
        </TacticalButton>
      </div>
    </div>
  );
}
