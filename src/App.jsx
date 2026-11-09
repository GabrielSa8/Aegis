import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

import TopHeader from './components/TopHeader';
import LeftTabsDock from './components/navigation/LeftTabsDock';
import UnsavedChangesModal from './components/navigation/UnsavedChangesModal';
import SettingsView from './components/SettingsView';
import CommandPaletteModal from './components/CommandPaletteModal';
import ErrorBoundary from './components/ErrorBoundary';
import { DEFAULT_ENABLED_MODULES, getVisibleTabs } from './plugins/pluginRegistry';
import { useSecurity } from './components/security/useSecurity';
import MasterLockScreen from './components/security/MasterLockScreen';
import { OnboardingModal } from './components/onboarding';
import { ModuleTourModal } from './components/tours';

// 🧩 Módulos Desacoplables con Lazy Loading (Zero overhead en arranque)
const AgentView = lazy(() => import('./components/AgentView'));
const VaultView = lazy(() => import('./components/VaultView'));
const FinancesView = lazy(() => import('./components/FinancesView'));
const DevOpsView = lazy(() => import('./components/DevOpsView'));
const TasksView = lazy(() => import('./components/TasksView'));
const SentinelView = lazy(() => import('./components/SentinelView'));
const LeisureView = lazy(() => import('./components/LeisureView'));

function ModuleLoader() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      gap: '12px',
      color: 'var(--text-muted)',
      fontSize: '0.75rem'
    }}>
      <div style={{
        width: '24px',
        height: '24px',
        border: '2px solid var(--border-color)',
        borderTopColor: 'var(--primary)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span>Montando módulo...</span>
    </div>
  );
}

export default function App() {
  const security = useSecurity();
  const { status: securityStatus, unlockVault, lockVault } = security;
  const securityRef = useRef(security);
  securityRef.current = security;

  const [activeTab, setActiveTab] = useState('agent');
  const [coreStatus, setCoreStatus] = useState('Conectando a Rust Core...');
  const [currentTheme, setCurrentTheme] = useState('nordic-moss');
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [enabledModules, setEnabledModules] = useState(DEFAULT_ENABLED_MODULES);
  const [isSettingsDirty, setIsSettingsDirty] = useState(false);
  const [pendingTargetTab, setPendingTargetTab] = useState(null);
  const [showUnsavedConfirmModal, setShowUnsavedConfirmModal] = useState(false);
  const [isDockPinned, setIsDockPinned] = useState(() => {
    try {
      return localStorage.getItem('aegis_dock_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleDockPin = () => {
    setIsDockPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aegis_dock_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const applyUiScale = (scale) => {
    const s = Number(scale) || 1.0;
    document.documentElement.style.zoom = '';
    document.documentElement.style.fontSize = `${16 * s}px`;
    document.documentElement.style.setProperty('--ui-scale', String(s));
  };

  // Cargar tema, escala y módulos habilitados desde configuración en arranque
  useEffect(() => {
    invoke('get_aegis_config')
      .then((cfg) => {
        if (cfg?.theme) {
          setCurrentTheme(cfg.theme);
          document.documentElement.setAttribute('data-theme', cfg.theme);
        }
        if (cfg?.enabledModules) {
          setEnabledModules(cfg.enabledModules);
        }
        applyUiScale(cfg?.uiScale);

        // Si es el primer arranque y el onboarding no se ha completado
        if (cfg?.onboardingCompleted === false) {
          setShowOnboarding(true);
        }
      })
      .catch(() => {});
  }, []);

  // Sincronización reactiva en vivo de ajustes y módulos (ej. P2P LAN replication)
  useEffect(() => {
    let unlistenTauri = null;

    const handleConfigUpdate = (newCfg) => {
      if (!newCfg) return;
      if (newCfg.theme) {
        setCurrentTheme(newCfg.theme);
        document.documentElement.setAttribute('data-theme', newCfg.theme);
      }
      if (newCfg.enabledModules) {
        setEnabledModules(newCfg.enabledModules);
      }
      if (newCfg.uiScale) {
        applyUiScale(newCfg.uiScale);
      }
    };

    listen('aegis:config-reloaded', (event) => {
      handleConfigUpdate(event.payload);
    }).then((unsub) => {
      unlistenTauri = unsub;
    }).catch(() => {});

    const onDomReload = (e) => handleConfigUpdate(e.detail);
    window.addEventListener('aegis:config-reloaded', onDomReload);

    return () => {
      if (unlistenTauri) unlistenTauri();
      window.removeEventListener('aegis:config-reloaded', onDomReload);
    };
  }, []);

  // Asegurar que si la pestaña activa se desactiva, caiga limpiamente al Agente
  useEffect(() => {
    const visible = getVisibleTabs(enabledModules);
    const normalizedTab = activeTab === 'leisure' ? 'gaming' : activeTab;
    if (!visible.includes(normalizedTab)) {
      setActiveTab('agent');
    }
  }, [enabledModules, activeTab]);

  // Pre-cargar vistas secundarias en segundo plano durante reposo para cambio de pestaña instantáneo (0ms lag)
  useEffect(() => {
    const preloadModules = () => {
      import('./components/VaultView');
      import('./components/DevOpsView');
      import('./components/FinancesView');
      import('./components/TasksView');
      import('./components/SentinelView');
      import('./components/LeisureView');
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const handle = window.requestIdleCallback(preloadModules, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(handle);
    } else {
      const timer = setTimeout(preloadModules, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escuchar si hay cambios sin guardar en Ajustes para guardia de navegación
  useEffect(() => {
    const handleDirtyChanged = (e) => {
      setIsSettingsDirty(Boolean(e.detail));
    };
    window.addEventListener('aegis:settings-dirty-changed', handleDirtyChanged);
    return () => window.removeEventListener('aegis:settings-dirty-changed', handleDirtyChanged);
  }, []);

  // Interceptar navegación cuando se intenta salir de Ajustes con cambios sin guardar
  const handleRequestTabChange = (targetTab) => {
    if (activeTab === 'settings' && isSettingsDirty && targetTab !== 'settings') {
      setPendingTargetTab(targetTab);
      setShowUnsavedConfirmModal(true);
      return;
    }
    setActiveTab(targetTab);
  };

  // Escuchar evento para abrir onboarding desde Ajustes o Paleta Omnibar
  useEffect(() => {
    const handleOpenOnboarding = () => setShowOnboarding(true);
    window.addEventListener('aegis:open-onboarding', handleOpenOnboarding);
    return () => window.removeEventListener('aegis:open-onboarding', handleOpenOnboarding);
  }, []);

  // Escuchar cambios reactivos en la configuración de módulos
  useEffect(() => {
    const handleModulesChanged = (e) => {
      if (e.detail) {
        setEnabledModules(e.detail);
        const isLeisureOrGaming = activeTab === 'gaming' || activeTab === 'leisure';
        const currentDisabled = isLeisureOrGaming ? e.detail.gaming === false : e.detail[activeTab] === false;
        if (currentDisabled) {
          setActiveTab('agent');
        }
      }
    };
    window.addEventListener('aegis:modules-changed', handleModulesChanged);
    return () => window.removeEventListener('aegis:modules-changed', handleModulesChanged);
  }, [activeTab]);

  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Atajos de teclado globales (Ctrl + K, Alt + 1..N, Alt + Z y Ctrl + ,)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + K para abrir Paleta de Comandos Omnibar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        return;
      }

      // Ctrl + , para ir a Ajustes de Sistema
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setActiveTab('settings');
        return;
      }

      // Alt + L para bloquear Vault con Contraseña Maestra
      if (e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        securityRef.current.lockVault();
        return;
      }

      if (e.key === 'Escape') {
        if (showCommandPalette) {
          setShowCommandPalette(false);
          return;
        }
        if (showSettings) {
          setShowSettings(false);
          return;
        }
      }

      if (e.altKey) {
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1) {
          const visible = getVisibleTabs(enabledModules);
          if (num <= visible.length) {
            e.preventDefault();
            handleRequestTabChange(visible[num - 1]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, showSettings, enabledModules, isSettingsDirty, activeTab]);

  // Ping al núcleo Rust local y escucha de cambio de pestañas táctico
  useEffect(() => {
    invoke('ping')
      .then((res) => setCoreStatus(res))
      .catch(() => setCoreStatus('Modo Web Standalone'));

    const handleSwitchTab = (e) => {
      if (e.detail?.tab) handleRequestTabChange(e.detail.tab);
    };
    window.addEventListener('aegis:switch-tab', handleSwitchTab);
    return () => window.removeEventListener('aegis:switch-tab', handleSwitchTab);
  }, [isSettingsDirty, activeTab]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      background: 'var(--bg-main)',
      color: 'var(--text-high)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 🧭 Barra Superior Unificada (Navegación + Telemetría en 38px) */}
      <TopHeader 
        coreStatus={coreStatus} 
        onOpenSettings={() => handleRequestTabChange('settings')}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        isMasterPasswordEnabled={securityStatus.masterPasswordEnabled}
        onLockVault={lockVault}
      />

      {/* 🚀 Contenedor de Trabajo: Dock Izquierdo de Vistas + Lienzo Central */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <LeftTabsDock
          activeTab={activeTab === 'leisure' ? 'gaming' : activeTab}
          onSelectTab={handleRequestTabChange}
          isPinned={isDockPinned}
          onTogglePin={handleToggleDockPin}
          enabledModules={enabledModules}
        />

        {/* 🚀 Lienzo de Contenido Ultra-Limpio */}
        <main style={{
          flex: 1,
          minHeight: 0,
          marginLeft: isDockPinned ? '54px' : '0',
          overflowY: (activeTab === 'agent' || activeTab === 'settings' || activeTab === 'vault' || activeTab === 'finances' || activeTab === 'devops') ? 'hidden' : 'auto',
          overflowX: 'hidden',
          padding: (activeTab === 'settings' || activeTab === 'agent')
            ? '0' 
            : '0.65rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.25s cubic-bezier(0.34, 1.3, 0.64, 1)'
        }}>
        <ErrorBoundary key={activeTab} name={activeTab}>
          <Suspense fallback={<ModuleLoader />}>
            {activeTab === 'agent' && <AgentView />}
            {activeTab === 'finances' && <FinancesView />}
            {activeTab === 'vault' && <VaultView />}
            {activeTab === 'devops' && <DevOpsView />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'sentinel' && <SentinelView />}
            {(activeTab === 'gaming' || activeTab === 'leisure') && <LeisureView />}
            {activeTab === 'settings' && (
              <SettingsView 
                currentTheme={currentTheme} 
                onThemeChange={handleThemeChange} 
                isFullView={true} 
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </main>
      </div>

      {/* ⚙️ Modal Global de Ajustes y Temas (Fallback si se abre como popup) */}
      {showSettings && (
        <SettingsView 
          onClose={() => setShowSettings(false)}
          currentTheme={currentTheme}
          onThemeChange={handleThemeChange}
        />
      )}

      {/* 🧭 Paleta de Comandos Omnibar (Ctrl + K) */}
      <CommandPaletteModal
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectTab={handleRequestTabChange}
        onOpenSettings={() => handleRequestTabChange('settings')}
        onThemeChange={handleThemeChange}
        enabledModules={enabledModules}
      />

      {/* ⚠️ Alerta de Salida sin Guardar de Ajustes */}
      <UnsavedChangesModal
        isOpen={showUnsavedConfirmModal}
        onContinueEditing={() => {
          setShowUnsavedConfirmModal(false);
          setPendingTargetTab(null);
        }}
        onDiscardAndLeave={() => {
          window.dispatchEvent(new CustomEvent('aegis:discard-settings'));
          setIsSettingsDirty(false);
          setShowUnsavedConfirmModal(false);
          if (pendingTargetTab) {
            setActiveTab(pendingTargetTab);
            setPendingTargetTab(null);
          }
        }}
        onSaveAndLeave={() => {
          window.dispatchEvent(new CustomEvent('aegis:save-settings'));
          setIsSettingsDirty(false);
          setShowUnsavedConfirmModal(false);
          if (pendingTargetTab) {
            setActiveTab(pendingTargetTab);
            setPendingTargetTab(null);
          }
        }}
      />

      {/* 🛡️ Pantalla de Bloqueo de Seguridad (Master Lock Screen) */}
      {securityStatus.masterPasswordEnabled && securityStatus.isLocked && (
        <MasterLockScreen
          onUnlock={unlockVault}
          hasEncryptedDb={securityStatus.hasEncryptedDb}
          autoLockMinutes={securityStatus.autoLockMinutes}
        />
      )}

      {/* 🚀 Modal de Onboarding Inicial & Guía de Configuración */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={(updatedCfg) => {
          if (updatedCfg?.theme) {
            handleThemeChange(updatedCfg.theme);
          }
        }}
      />

      {/* 🧭 Guía Interactiva Contextual por Módulo (Tour por Pestaña) */}
      <ErrorBoundary name="ModuleTour">
        <ModuleTourModal activeTab={activeTab} />
      </ErrorBoundary>
    </div>
  );
}
