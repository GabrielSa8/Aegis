import React from 'react';
import { Smartphone, RefreshCw, Radio, Cpu } from 'lucide-react';
import { TacticalButton } from '../../ui';

/**
 * DevAdbCard — Monitor y control de daemon ADB y dispositivos Android.
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
      padding: '0.85rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.65rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Smartphone size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Android Debug Bridge (ADB)
          </span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 700,
            background: isOnline 
              ? 'color-mix(in srgb, var(--primary) 15%, transparent)' 
              : 'color-mix(in srgb, var(--border-color) 40%, transparent)',
            color: isOnline ? 'var(--primary)' : 'var(--text-muted)',
            border: `1px solid ${isOnline ? 'color-mix(in srgb, var(--primary) 30%, transparent)' : 'var(--border-color)'}`
          }}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <TacticalButton
          variant="secondary"
          size="xs"
          icon={<RefreshCw size={11} className={isRestarting ? 'animate-spin' : ''} />}
          onClick={onRestart}
          disabled={isRestarting}
          style={{ fontSize: '0.65rem', padding: '3px 8px' }}
        >
          Reiniciar Servidor
        </TacticalButton>
      </div>

      {adb?.binary_path && (
        <div style={{
          fontSize: '0.62rem',
          fontFamily: 'monospace',
          color: 'var(--text-muted)',
          background: 'color-mix(in srgb, var(--border-color) 20%, transparent)',
          padding: '2px 6px',
          borderRadius: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {adb.binary_path}
        </div>
      )}

      {devices.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '1rem',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          border: '1px dashed var(--border-color)',
          borderRadius: 'var(--radius-sm)'
        }}>
          No hay dispositivos ni emuladores conectados
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {devices.map((dev) => (
            <div
              key={dev.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--border-color) 12%, transparent)',
                border: '1px solid var(--border-color)',
                fontSize: '0.72rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {dev.is_emulator ? (
                  <Cpu size={13} style={{ color: 'var(--primary)' }} />
                ) : (
                  <Radio size={13} style={{ color: 'var(--text-high)' }} />
                )}
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-high)' }}>
                    {dev.model || dev.id}
                  </div>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    {dev.id}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: dev.is_emulator
                    ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
                    : 'color-mix(in srgb, var(--border-color) 30%, transparent)',
                  color: dev.is_emulator ? 'var(--primary)' : 'var(--text-muted)'
                }}>
                  {dev.is_emulator ? 'Emulador' : 'Físico'}
                </span>
                <span style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
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
