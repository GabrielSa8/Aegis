import { Sparkles, Download, RotateCcw, AlertTriangle, Calendar, Tag } from 'lucide-react';
import { ModalWrapper, TacticalButton } from '../ui';

export default function UpdateModal({
  isOpen,
  onClose,
  status,
  updateInfo,
  downloadProgress,
  errorMessage,
  onDownloadAndInstall,
  onRestart
}) {
  if (!isOpen) return null;

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Actualización de Sistema"
      icon={Sparkles}
      maxWidth="580px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '4px 0' }}>
        {/* Encabezado de Versión */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: 'var(--radius-sm, 8px)',
            background: 'color-mix(in srgb, var(--bg-card) 85%, black)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
                border: '1px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-high)' }}>
                  Aegis v{updateInfo?.version || 'Nueva Versión'}
                </span>
                <span
                  style={{
                    fontSize: '0.64rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'var(--primary)',
                    color: 'var(--bg-main, #000)',
                    fontWeight: 800
                  }}
                >
                  Disponible
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                {updateInfo?.currentVersion && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    Actual: v{updateInfo.currentVersion}
                  </span>
                )}
                {updateInfo?.date && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Calendar size={11} />
                    {updateInfo.date.slice(0, 10)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.66rem',
              color: 'var(--text-muted)'
            }}
          >
            <Tag size={11} />
            <span>GitHub Releases</span>
          </div>
        </div>

        {/* Registro de Cambios (Changelog) */}
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Novedades y Registro de Cambios:
          </span>
          <div
            style={{
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '12px',
              borderRadius: 'var(--radius-sm, 8px)',
              background: 'rgba(0,0,0,0.25)',
              border: '1px solid var(--border-color)',
              fontSize: '0.74rem',
              lineHeight: '1.45',
              color: 'var(--text-high)',
              whiteSpace: 'pre-wrap',
              fontFamily: 'var(--font-mono)'
            }}
          >
            {updateInfo?.body || 'Sin notas de versión adjuntas.'}
          </div>
        </div>

        {/* Barra de progreso si está descargando */}
        {status === 'downloading' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
              <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>Descargando paquete binario...</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{downloadProgress}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${downloadProgress}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  transition: 'width 0.2s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* Mensaje de Error si ocurrió */}
        {status === 'error' && errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm, 6px)',
              background: 'color-mix(in srgb, var(--danger, #ef4444) 15%, transparent)',
              border: '1px solid var(--danger, #ef4444)',
              color: 'var(--danger, #ef4444)',
              fontSize: '0.72rem'
            }}
          >
            <AlertTriangle size={14} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <TacticalButton variant="ghost" onClick={onClose}>
            {status === 'ready' ? 'Cerrar' : 'Más tarde'}
          </TacticalButton>

          {status === 'ready' ? (
            <TacticalButton
              variant="primary"
              icon={RotateCcw}
              onClick={onRestart}
            >
              Reiniciar y Aplicar v{updateInfo?.version}
            </TacticalButton>
          ) : (
            <TacticalButton
              variant="primary"
              icon={Download}
              disabled={status === 'downloading'}
              onClick={onDownloadAndInstall}
            >
              {status === 'downloading' ? `Descargando (${downloadProgress}%)` : 'Descargar e Instalar'}
            </TacticalButton>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
