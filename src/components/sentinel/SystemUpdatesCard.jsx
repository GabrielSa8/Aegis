import React, { useState } from 'react';
import { RefreshCw, Package, Copy, Check, Terminal } from 'lucide-react';

export default function SystemUpdatesCard({
  updatesReport,
  checkingUpdates,
  launchingUpdate,
  copiedCommand,
  onCheckUpdates,
  onCopyCommand,
  onLaunchUpdate
}) {
  const manager = updatesReport?.manager || 'Detectando...';
  const count = updatesReport?.updatesAvailable || 0;
  const packages = updatesReport?.packages || [];
  const statusMsg = updatesReport?.statusMessage || 'Verificando estado del sistema...';
  const cmd = updatesReport?.updateCommand || 'sudo dnf upgrade -y';
  const hasUpdates = count > 0;

  return (
    <div
      className="sentinel-card sentinel-updates-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        minHeight: '260px'
      }}
    >
      {/* Header con status y gestor de paquetes */}
      <div className="sentinel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={15} style={{ color: 'var(--primary)' }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.02em' }}>
              Centro de Actualizaciones
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {manager} • Integridad y parches de seguridad
            </div>
          </div>
        </div>

        <div className="sentinel-card-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.70rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: hasUpdates
                ? 'color-mix(in srgb, var(--warning) 15%, transparent)'
                : 'color-mix(in srgb, var(--primary) 15%, transparent)',
              color: hasUpdates ? 'var(--warning)' : 'var(--primary)',
              border: `1px solid color-mix(in srgb, ${hasUpdates ? 'var(--warning)' : 'var(--primary)'} 30%, transparent)`
            }}
          >
            {checkingUpdates ? 'Comprobando...' : (hasUpdates ? `${count} parches listos` : 'Al día')}
          </div>

          <button
            className="sentinel-icon-action-btn"
            onClick={onCheckUpdates}
            disabled={checkingUpdates}
            title="Comprobar actualizaciones"
            style={{
              background: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '4px',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: checkingUpdates ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={12} className={checkingUpdates ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Comando guiado de actualización con botón de copiado */}
      <div
        className="sentinel-command-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          borderRadius: '4px',
          background: 'color-mix(in srgb, var(--bg-card) 60%, var(--border-color) 30%)',
          border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Comando:</span>
          <code
            style={{
              fontSize: '0.68rem',
              fontFamily: 'monospace',
              color: 'var(--text-high)',
              background: 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
              padding: '2px 6px',
              borderRadius: '3px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {cmd}
          </code>
        </div>

        <div className="sentinel-command-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            className="sentinel-copy-btn"
            onClick={onCopyCommand}
            style={{
              background: copiedCommand
                ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
                : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
              border: `1px solid ${copiedCommand ? 'var(--primary)' : 'var(--border-color)'}`,
              color: copiedCommand ? 'var(--primary)' : 'var(--text-high)',
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '0.64rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            {copiedCommand ? <Check size={11} /> : <Copy size={11} />}
            <span>{copiedCommand ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            className="sentinel-launch-btn"
            onClick={onLaunchUpdate}
            disabled={launchingUpdate}
            title="Abrir terminal interactiva del sistema y aplicar actualizaciones"
            style={{
              background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              borderRadius: '4px',
              padding: '3px 9px',
              fontSize: '0.64rem',
              fontWeight: 700,
              cursor: launchingUpdate ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Terminal size={11} />
            <span>{launchingUpdate ? 'Abriendo...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Lista de paquetes actualizables si existen */}
      {hasUpdates && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Paquetes a actualizar ({packages.length}):
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignContent: 'flex-start',
              gap: '4px',
              flex: 1,
              minHeight: '120px',
              maxHeight: '260px',
              overflowY: 'auto',
              background: 'color-mix(in srgb, var(--bg-surface) 50%, transparent)',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)'
            }}
          >
            {packages.map((pkg, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.64rem',
                  fontFamily: 'monospace',
                  background: 'color-mix(in srgb, var(--text-muted) 14%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
                  color: 'var(--text-high)',
                  padding: '2px 7px',
                  borderRadius: '3px',
                  lineHeight: '1.2'
                }}
              >
                {pkg}
              </span>
            ))}
          </div>
        </div>
      )}

      {!hasUpdates && (
        <div
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '16px 0',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
}
