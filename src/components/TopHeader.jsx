import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  ShieldCheck,
  Search, 
  Settings,
  Pin,
  PinOff,
  Minus,
  Lock,
  HelpCircle
} from 'lucide-react';
import { useAppUpdater, UpdateCockpitPill, UpdateModal } from './updater';

export default function TopHeader({ 
  onOpenSettings,
  onOpenCommandPalette,
  isMasterPasswordEnabled = false,
  onLockVault
}) {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const {
    status: updateStatus,
    updateInfo,
    downloadProgress,
    errorMessage: updateError,
    downloadAndInstall,
    restartApp,
    dismiss: dismissUpdate
  } = useAppUpdater();

  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('aegis_top_dock_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aegis_top_dock_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const handleHideToTray = async () => {
    try {
      await invoke('toggle_window_visibility');
    } catch (e) {
      console.error('Error ocultando ventana:', e);
    }
  };

  return (
    <aside className="dynamic-island-trigger">
      {/* 🏝️ Apple Dynamic Island HUD Capsule (44px Proporción Amplia / Tipografía Confortable) */}
      <div 
        className={`dynamic-island-capsule ${isPinned ? 'is-pinned' : ''}`}
        style={{
          width: 'max-content',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          gap: '10px',
          padding: '0 16px',
          background: 'color-mix(in srgb, var(--bg-card) 96%, black)',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
          borderRadius: '0 0 18px 18px',
          userSelect: 'none',
          cursor: isPinned ? 'default' : 'pointer'
        }}
      >
        {/* 🛡️ Brand Logo Aegis */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            cursor: 'default',
            flexShrink: 0,
            paddingRight: '6px'
          }}
          title="Aegis Cockpit"
        >
          <div style={{
            background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 45%, transparent)',
            boxShadow: '0 0 10px color-mix(in srgb, var(--primary) 25%, transparent)',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}>
            <ShieldCheck size={14} color="var(--primary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ 
              fontSize: '0.84rem', 
              fontWeight: 800, 
              letterSpacing: '0.06em',
              background: 'linear-gradient(135deg, var(--text-high) 35%, var(--primary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Aegis
            </span>
            <span
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: 'var(--primary)',
                boxShadow: '0 0 6px var(--primary)',
                opacity: 0.85
              }}
              title="Aegis Online"
            />
          </div>
        </div>

        {/* Separador */}
        <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', opacity: 0.6, flexShrink: 0 }} />

        {/* 🧭 Slot Dinámico: Modo de Trabajo, Ver Razonamiento y Métrica Táctica de Tokens */}
        <div 
          id="top-header-slot" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flexShrink: 0
          }} 
        />

        {/* Separador */}
        <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', opacity: 0.6, flexShrink: 0 }} />

        {/* 📡 Acciones Globales: Búsqueda y Ajustes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Command shortcut (Ctrl + K) */}
          <button 
            onClick={onOpenCommandPalette}
            title="Abrir Paleta de Comandos (Ctrl + K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 9px',
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--text-high)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <Search size={12} />
            <kbd style={{ fontFamily: 'inherit', color: 'var(--text-high)', fontSize: '0.64rem' }}>Ctrl+K</kbd>
          </button>

          {/* Indicador Táctico de Actualización (G.1.3) */}
          <UpdateCockpitPill
            status={updateStatus}
            updateInfo={updateInfo}
            downloadProgress={downloadProgress}
            onOpenModal={() => setIsUpdateModalOpen(true)}
            onRestart={restartApp}
            onDismiss={dismissUpdate}
          />

          {/* Opciones / Ajustes (Ctrl + ,) */}
          <button
            onClick={onOpenSettings}
            title="Opciones y Ajustes (Ctrl + ,)"
            aria-label="Opciones y Ajustes (Ctrl + ,)"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 7px',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'var(--primary)'; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)'; 
            }}
          >
            <Settings size={13} />
          </button>

          {/* 💡 Guía Interactiva del Módulo Activo */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('aegis:open-tour'))}
            title="Ver Guía del Módulo Activo"
            aria-label="Ver Guía del Módulo Activo"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 7px',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'var(--primary)'; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)'; 
            }}
          >
            <HelpCircle size={13} />
          </button>

          {/* Bloquear Vault */}
          {isMasterPasswordEnabled && (
            <button
              onClick={onLockVault}
              title="Bloquear Vault con Contraseña Maestra (Alt + L)"
              aria-label="Bloquear Vault con Contraseña Maestra (Alt + L)"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm, 8px)',
                padding: '4px 7px',
                color: 'var(--text-muted)',
                fontSize: '0.74rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <Lock size={13} />
            </button>
          )}

          {/* Minimizar a Bandeja (Tray) */}
          <button
            onClick={handleHideToTray}
            title="Ocultar en la Bandeja del Sistema (Tray)"
            aria-label="Ocultar en la Bandeja del Sistema (Tray)"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 7px',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent, var(--primary))'; e.currentTarget.style.borderColor = 'var(--accent, var(--primary))'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          >
            <Minus size={13} />
          </button>

          {/* Fijar / Auto-ocultar (Pin) */}
          <button
            onClick={togglePin}
            title={isPinned ? 'Desfijar cabecera (Auto-ocultar al salir el cursor)' : 'Fijar cabecera superior permanente'}
            style={{
              background: isPinned ? 'color-mix(in srgb, var(--primary) 18%, transparent)' : 'transparent',
              border: `1px solid ${isPinned ? 'var(--primary)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 7px',
              color: isPinned ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isPinned ? 'var(--primary)' : 'var(--text-muted)'; }}
          >
            {isPinned ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
        </div>
      </div>

      {/* Modal Táctico de Novedades y Actualización */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        status={updateStatus}
        updateInfo={updateInfo}
        downloadProgress={downloadProgress}
        errorMessage={updateError}
        onDownloadAndInstall={downloadAndInstall}
        onRestart={restartApp}
      />
    </aside>
  );
}
