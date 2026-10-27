import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

import TopRibbon from './components/TopRibbon';
import CommandDock from './components/CommandDock';
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

  // Atajos de teclado globales (Alt + 1..7)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey) {
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
      {/* 📡 Cinta Superior de Telemetría (Top Ribbon) */}
      <TopRibbon 
        coreStatus={coreStatus} 
        activeTab={activeTab} 
      />

      {/* 🚀 Lienzo Principal Completo (100% de Ancho) */}
      <main style={{
        flex: 1,
        minHeight: 0,
        overflowY: activeTab === 'agent' ? 'hidden' : 'auto',
        padding: activeTab === 'agent' 
          ? '1rem 1.5rem 88px 1.5rem' 
          : '1.25rem 1.5rem 100px 1.5rem',
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

      {/* 🏝️ Isla Táctica Flotante (Floating Command Dock) */}
      <CommandDock 
        activeTab={activeTab} 
        onSelectTab={setActiveTab} 
      />
    </div>
  );
}
