import { useState, useEffect, lazy, Suspense } from 'react';
import { invoke } from '@tauri-apps/api/core';

import TopHeader from './components/TopHeader';
import LeftTabsDock from './components/navigation/LeftTabsDock';
import AgentView from './components/AgentView';
import VaultView from './components/VaultView';
import SettingsView from './components/SettingsView';
import CommandPaletteModal from './components/CommandPaletteModal';
import ErrorBoundary from './components/ErrorBoundary';
import { DEFAULT_ENABLED_MODULES, getVisibleTabs } from './plugins/pluginRegistry';

// 🧩 Módulos Secundarios Desacoplables (Lazy Loaded para Cero Consumo de RAM si están apagados)
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
      <span>Montando módulo táctico...</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('agent');
  const [coreStatus, setCoreStatus] = useState('Conectando a Rust Core...');
  const [currentTheme, setCurrentTheme] = useState('nordic-moss');
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [enabledModules, setEnabledModules] = useState(DEFAULT_ENABLED_MODULES);
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
      })
      .catch(() => {});
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

  // Atajos de teclado globales (Ctrl + K, Alt + 1..8, Alt + Z y Ctrl + ,)
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
            setActiveTab(visible[num - 1]);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, showSettings, enabledModules]);

  // Ping al núcleo Rust local y escucha de cambio de pestañas táctico
  useEffect(() => {
    invoke('ping')
      .then((res) => setCoreStatus(res))
      .catch(() => setCoreStatus('Modo Web Standalone'));

    const handleSwitchTab = (e) => {
      if (e.detail?.tab) setActiveTab(e.detail.tab);
    };
    window.addEventListener('aegis:switch-tab', handleSwitchTab);
    return () => window.removeEventListener('aegis:switch-tab', handleSwitchTab);
  }, []);

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
        onOpenSettings={() => setActiveTab('settings')}
        onOpenCommandPalette={() => setShowCommandPalette(true)}
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
          onSelectTab={setActiveTab}
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
        onSelectTab={setActiveTab}
        onOpenSettings={() => setActiveTab('settings')}
        onThemeChange={handleThemeChange}
        enabledModules={enabledModules}
      />
    </div>
  );
}
