import React from 'react';
import { RefreshCw, HardDrive, Trash2 } from 'lucide-react';

export default function DiskCleanerCard({
  cleanReport,
  scanningDisk,
  purgingTargetId,
  purgingAll,
  onScan,
  onPurgeTarget,
  onPurgeAll
}) {
  const targets = cleanReport?.targets || [];
  const totalFormatted = cleanReport?.totalSizeFormatted || '0 B';
  const hasReclaimable = (cleanReport?.totalSizeBytes || 0) > 0;

  return (
    <div
      className="sentinel-card sentinel-disk-cleaner-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Header con métrica de espacio recuperable y acciones */}
      <div className="sentinel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={15} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.02em' }}>
              Limpiador de Disco & Cachés
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              Cachés de desarrollo, paquetes y vistas previas locales
            </div>
          </div>
        </div>

        <div className="sentinel-card-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
              color: 'var(--accent)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)'
            }}
          >
            {scanningDisk ? 'Escaneando...' : totalFormatted}
          </div>

          <button
            className="sentinel-icon-action-btn"
            onClick={onScan}
            disabled={scanningDisk || purgingAll}
            title="Re-escanear cachés del sistema"
            style={{
              background: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '4px',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: scanningDisk ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={12} className={scanningDisk ? 'animate-spin' : ''} />
          </button>

          <button
            className="sentinel-purge-all-btn"
            onClick={onPurgeAll}
            disabled={scanningDisk || purgingAll || !hasReclaimable}
            style={{
              background: hasReclaimable
                ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
                : 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
              border: `1px solid ${hasReclaimable ? 'var(--primary)' : 'var(--border-color)'}`,
              color: hasReclaimable ? 'var(--primary)' : 'var(--text-muted)',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '0.70rem',
              fontWeight: 700,
              cursor: (scanningDisk || purgingAll || !hasReclaimable) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Trash2 size={11} />
            <span>{purgingAll ? 'Purgando...' : 'Purga Total'}</span>
          </button>
        </div>
      </div>

      {/* Lista de destinos de limpieza */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {targets.map((target) => {
          const isThisPurging = purgingTargetId === target.id;
          const isFlatpak = target.id === 'flatpak_unused';
          const canPurge = target.safeToDelete && (target.sizeBytes > 0 || isFlatpak);

          return (
            <div
              key={target.id}
              className="sentinel-cleaner-target-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '4px',
                background: 'color-mix(in srgb, var(--bg-card) 50%, var(--border-color) 25%)',
                border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-high)' }}>
                    {target.name}
                  </span>
                  {target.fileCount > 0 && (
                    <span
                      style={{
                        fontSize: '0.60rem',
                        fontFamily: 'monospace',
                        color: 'var(--text-muted)',
                        background: 'color-mix(in srgb, var(--text-muted) 15%, transparent)',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}
                    >
                      {target.fileCount} archivos
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: '0.64rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={target.description}
                >
                  {target.description}
                </div>
              </div>

              <div className="sentinel-cleaner-target-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: target.sizeBytes > 0 ? 'var(--accent)' : 'var(--text-muted)'
                  }}
                >
                  {target.sizeFormatted}
                </span>

                <button
                  className="sentinel-purge-single-btn"
                  onClick={() => onPurgeTarget(target.id)}
                  disabled={isThisPurging || purgingAll || !canPurge}
                  style={{
                    background: canPurge
                      ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                      : 'transparent',
                    border: `1px solid ${canPurge ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border-color)'}`,
                    color: canPurge ? 'var(--accent)' : 'var(--text-muted)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '0.64rem',
                    fontWeight: 600,
                    cursor: (isThisPurging || purgingAll || !canPurge) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isThisPurging ? '...' : 'Purgar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
