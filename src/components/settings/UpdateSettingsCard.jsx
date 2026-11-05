import { useState } from 'react';
import { RefreshCw, CheckCircle, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { TacticalButton } from '../ui';
import { useAppUpdater, UpdateModal } from '../updater';

export default function UpdateSettingsCard() {
  const {
    status,
    updateInfo,
    downloadProgress,
    errorMessage,
    checkForUpdates,
    downloadAndInstall,
    restartApp
  } = useAppUpdater();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualCheck = () => {
    checkForUpdates(false);
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm, 8px)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Actualizaciones del Sistema (GitHub Releases)
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              Canal Oficial
            </span>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
            Detección autónoma e instalación in-app 1-clic de nuevas versiones firmadas.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TacticalButton
            variant="ghost"
            icon={RefreshCw}
            disabled={status === 'checking' || status === 'downloading'}
            onClick={handleManualCheck}
          >
            {status === 'checking' ? 'Buscando...' : 'Buscar Actualizaciones'}
          </TacticalButton>
        </div>
      </div>

      {/* Estado actual */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm, 6px)',
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {status === 'checking' && (
            <>
              <RefreshCw size={13} className="spin-animation" color="var(--primary)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--primary)' }}>
                Consultando últimas releases en GitHub...
              </span>
            </>
          )}

          {status === 'available' && (
            <>
              <Sparkles size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-high)', fontWeight: 600 }}>
                ¡Nueva versión <strong>v{updateInfo?.version}</strong> disponible!
              </span>
            </>
          )}

          {status === 'ready' && (
            <>
              <CheckCircle size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 700 }}>
                Versión v{updateInfo?.version} descargada y lista para aplicar.
              </span>
            </>
          )}

          {(status === 'upToDate' || status === 'idle') && (
            <>
              <CheckCircle size={13} color="var(--primary)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Aegis está al día con la última versión instalada (v2.8.0 · GitHub conectado).
              </span>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle size={13} color="var(--danger)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--danger)' }}>
                {errorMessage || 'No se pudo contactar el repositorio de releases.'}
              </span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(status === 'available' || status === 'ready') && (
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'var(--primary)',
                color: 'var(--bg-main)',
                border: 'none',
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {status === 'ready' ? 'Reiniciar y Aplicar' : 'Instalar v' + updateInfo?.version}
            </button>
          )}

          <a
            href="https://github.com/GabrielSa8/Aegis/releases"
            target="_blank"
            rel="noreferrer"
            style={{
              fontSize: '0.66rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              textDecoration: 'none'
            }}
          >
            <span>Ver en GitHub</span>
            <ArrowUpRight size={10} />
          </a>
        </div>
      </div>

      <UpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={status}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        errorMessage={errorMessage}
        onDownloadAndInstall={downloadAndInstall}
        onRestart={restartApp}
      />
    </div>
  );
}
