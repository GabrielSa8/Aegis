import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Minimize2 } from 'lucide-react';

import TopHeader from './components/TopHeader';
import LeftTabsDock from './components/navigation/LeftTabsDock';
import AgentView from './components/AgentView';
import FinancesView from './components/FinancesView';
import VaultView from './components/VaultView';
import DevOpsView from './components/DevOpsView';
import TasksView from './components/TasksView';
import SentinelView from './components/SentinelView';
import LeisureView from './components/LeisureView';
import SettingsView from './components/SettingsView';
import CommandPaletteModal from './components/CommandPaletteModal';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState('agent');
  const [coreStatus, setCoreStatus] = useState('Conectando a Rust Core...');
  const [zenMode, setZenMode] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('nordic-moss');
  const [showSettings, setShowSettings] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
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

  // Cargar tema y escala desde configuración en arranque
  useEffect(() => {
    invoke('get_aegis_config')
      .then((cfg) => {
        if (cfg?.theme) {
          setCurrentTheme(cfg.theme);
          document.documentElement.setAttribute('data-theme', cfg.theme);
        }
        applyUiScale(cfg?.uiScale);
      })
      .catch(() => {});
  }, []);

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
        if (zenMode) {
          setZenMode(false);
          return;
        }
      }

      if (e.altKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          setZenMode((prev) => !prev);
          return;
        }

        const keyMap = {
          '1': 'agent',
          '2': 'finances',
          '3': 'vault',
          '4': 'devops',
          '5': 'tasks',
          '6': 'sentinel',
          '7': 'gaming',
          '8': 'settings'
        };
        if (keyMap[e.key]) {
          e.preventDefault();
          setActiveTab(keyMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette, showSettings, zenMode]);

  // Ping al núcleo Rust local
  useEffect(() => {
    invoke('ping')
      .then((res) => setCoreStatus(res))
      .catch(() => setCoreStatus('Modo Web Standalone'));
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
      {!zenMode ? (
        <TopHeader 
          coreStatus={coreStatus} 
          zenMode={zenMode}
          onToggleZenMode={() => setZenMode(!zenMode)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
        />
      ) : activeTab !== 'agent' ? (
        /* 🪟 Botón de restauración para vistas sin barra de macros */
        <button
          onClick={() => setZenMode(false)}
          title="Restaurar barra y menús (Escape o Alt + Z)"
          style={{
            position: 'fixed',
            top: '8px',
            right: '12px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            fontSize: '0.68rem',
            fontWeight: 600,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.45)',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-high)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        >
          <Minimize2 size={12} color="var(--accent)" />
          <span>Restaurar Barra</span>
          <kbd style={{ fontSize: '0.6rem', opacity: 0.65, background: 'rgba(255,255,255,0.08)', padding: '1px 4px', borderRadius: '3px' }}>Esc</kbd>
        </button>
      ) : null}

      {/* 🚀 Contenedor de Trabajo: Dock Izquierdo de Vistas + Lienzo Central */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        width: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {!zenMode && (
          <LeftTabsDock
            activeTab={activeTab === 'leisure' ? 'gaming' : activeTab}
            onSelectTab={setActiveTab}
            isPinned={isDockPinned}
            onTogglePin={handleToggleDockPin}
          />
        )}

        {/* 🚀 Lienzo de Contenido Ultra-Limpio */}
        <main style={{
          flex: 1,
          minHeight: 0,
          marginLeft: (!zenMode && isDockPinned) ? '54px' : '0',
          overflowY: (activeTab === 'agent' || activeTab === 'settings' || activeTab === 'vault') ? 'hidden' : 'auto',
          overflowX: 'hidden',
          padding: (zenMode || activeTab === 'settings' || activeTab === 'agent')
            ? '0' 
            : '0.65rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          transition: 'margin-left 0.25s cubic-bezier(0.34, 1.3, 0.64, 1)'
        }}>
        <ErrorBoundary key={activeTab} name={activeTab}>
          {activeTab === 'agent' && <AgentView zenMode={zenMode} onToggleZenMode={() => setZenMode(false)} />}
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
        onToggleZenMode={() => setZenMode((prev) => !prev)}
        onOpenSettings={() => setActiveTab('settings')}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}
