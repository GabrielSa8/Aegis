import React from 'react';
import { Smartphone, RefreshCw, Radio, Cpu, Network } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * DevAdbCard — Monitor y control de daemon ADB y dispositivos Android.
 * Alta densidad de telemetría y cero espacios vacíos.
 */
export function DevAdbCard({ adb, onRestart, actionLoadingId }) {
  const isRestarting = actionLoadingId === 'adb-restart';
  const isOnline = Boolean(adb?.server_running);
  const devices = adb?.devices || [];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '0.75rem 0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.55rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={15} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Android Debug Bridge (ADB)
          </span>
          <span style={{
            fontSize: '0.6rem',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
            background: isOnline 
              ? 'color-mix(in srgb, var(--primary) 15%, transparent)' 
              : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
            color: isOnline ? 'var(--primary)' : 'var(--text-muted)',
            border: `1px solid ${isOnline ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'var(--border-color)'}`
          }}>
            {isOnline ? 'ONLINE :5037' : 'OFFLINE'}
          </span>
        </div>

        <TacticalButton
          variant="secondary"
          size="xs"
          icon={<RefreshCw size={10} className={isRestarting ? 'animate-spin' : ''} />}
          onClick={onRestart}
          disabled={isRestarting}
          style={{ fontSize: '0.62rem', padding: '2px 7px' }}
        >
          Reiniciar Servidor
        </TacticalButton>
      </div>

      {/* Ruta y Telemetría de Socket */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        background: 'color-mix(in srgb, var(--border-color) 15%, transparent)',
        padding: '2px 6px',
        borderRadius: '4px',
        gap: '6px'
      }}>
        <span style={{ fontFamily: 'var(--font-mono, monospace)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {adb?.binary_path || 'adb en PATH'}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, color: 'var(--primary)', fontWeight: 600 }}>
          <Network size={10} /> 127.0.0.1:5037
        </span>
      </div>

      {devices.length === 0 ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 8px',
          background: 'color-mix(in srgb, var(--border-color) 10%, transparent)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.64rem',
          color: 'var(--text-muted)'
        }}>
          <span>Sin emuladores ni teléfonos USB</span>
          <code style={{
            fontSize: '0.58rem',
            color: 'var(--primary)',
            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            padding: '1px 5px',
            borderRadius: '3px'
          }}>
            adb connect &lt;ip&gt;:5555
          </code>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {devices.map((dev) => (
            <div
              key={dev.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--border-color) 12%, transparent)',
                border: '1px solid var(--border-color)',
                fontSize: '0.7rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {dev.is_emulator ? (
                  <Cpu size={12} style={{ color: 'var(--primary)' }} />
                ) : (
                  <Radio size={12} style={{ color: 'var(--text-high)' }} />
                )}
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-high)', fontSize: '0.7rem' }}>
                    {dev.model || dev.id}
                  </div>
                  <div style={{ fontSize: '0.58rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {dev.id}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{
                  fontSize: '0.56rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: dev.is_emulator
                    ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                    : 'color-mix(in srgb, var(--border-color) 30%, transparent)',
                  color: dev.is_emulator ? 'var(--primary)' : 'var(--text-muted)'
                }}>
                  {dev.is_emulator ? 'Emulador' : 'Físico'}
                </span>
                <span style={{
                  fontSize: '0.56rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: dev.state === 'device'
                    ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                    : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
                  color: dev.state === 'device' ? 'var(--primary)' : 'var(--text-muted)'
                }}>
                  {dev.state}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
