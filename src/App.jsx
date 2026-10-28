import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

import TopHeader from './components/TopHeader';
import AgentView from './components/AgentView';
import FinancesView from './components/FinancesView';
import VaultView from './components/VaultView';
import DevOpsView from './components/DevOpsView';
import TasksView from './components/TasksView';
import SentinelView from './components/SentinelView';
import LeisureView from './components/LeisureView';

export default function App() {
  const [activeTab, setActiveTab] = useState('agent');
  const [coreStatus, setCoreStatus] = useState('Conectando a Rust Core...');
  const [zenMode, setZenMode] = useState(false);

  // Atajos de teclado globales (Alt + 1..7 y Alt + Z)
  useEffect(() => {
    const handleKeyDown = (e) => {
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
          '7': 'leisure'
        };
        if (keyMap[e.key]) {
          e.preventDefault();
          setActiveTab(keyMap[e.key]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      width: '100vw',
      height: '100vh',
      background: 'var(--bg-main)',
      color: 'var(--text-high)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 🧭 Barra Superior Unificada (Navegación + Telemetría en 38px) */}
      {!zenMode && (
        <TopHeader 
          coreStatus={coreStatus} 
          activeTab={activeTab} 
          onSelectTab={setActiveTab}
          zenMode={zenMode}
          onToggleZenMode={() => setZenMode(!zenMode)}
        />
      )}

      {/* 🚀 Lienzo de Contenido Ultra-Limpio (95% Viewport Disponible) */}
      <main style={{
        flex: 1,
        minHeight: 0,
        overflowY: activeTab === 'agent' ? 'hidden' : 'auto',
        padding: zenMode 
          ? '0.5rem 0.75rem' 
          : (activeTab === 'agent' ? '0.5rem 0.85rem' : '0.65rem 1rem'),
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeTab === 'agent' && <AgentView />}
        {activeTab === 'finances' && <FinancesView />}
        {activeTab === 'vault' && <VaultView />}
        {activeTab === 'devops' && <DevOpsView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'sentinel' && <SentinelView />}
        {activeTab === 'leisure' && <LeisureView />}
      </main>
    </div>
  );
}
