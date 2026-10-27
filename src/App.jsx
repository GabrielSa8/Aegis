import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  getTransactions, 
  saveTransaction, 
  deleteTransaction, 
  exportBackup, 
  importBackup, 
  initializeStorage, 
  requestPersistentStorage, 
  createAutoSnapshot, 
  getSnapshots, 
  restoreFromSnapshot, 
  getTodayLocalDateStr 
} from './utils/storage';

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

  // State for finances
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDateStr());
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState(null);

  const refreshSnapshots = async () => {
    await createAutoSnapshot();
    setSnapshots(await getSnapshots());
  };

  const refreshTransactionsAndSnapshots = async () => {
    const list = await getTransactions();
    setTransactions(Array.isArray(list) ? list : []);
    await refreshSnapshots();
  };

  // Keyboard shortcut listener (Alt + 1..7)
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

  useEffect(() => {
    invoke('ping')
      .then((res) => setCoreStatus(res))
      .catch(() => setCoreStatus('Modo Web Standalone'));

    initializeStorage();
    const initAndSync = async () => {
      await requestPersistentStorage();
      await createAutoSnapshot();
      setSnapshots(await getSnapshots());
      const list = await getTransactions();
      setTransactions(Array.isArray(list) ? list : []);
    };
    initAndSync();
  }, []);

  // Finance handlers
  const handleTransactionSave = async (txData) => {
    try {
      const updated = await saveTransaction(txData);
      setTransactions(Array.isArray(updated) ? updated : await getTransactions());
      setEditingTransaction(null);
      await refreshSnapshots();
    } catch (error) {
      console.error('Error guardando transacción:', error);
    }
  };

  const handleTransactionEdit = (tx) => {
    setEditingTransaction(tx);
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    try {
      const updated = await deleteTransaction(deletingTransaction.id);
      setTransactions(Array.isArray(updated) ? updated : await getTransactions());
      setDeletingTransaction(null);
      if (editingTransaction && editingTransaction.id === deletingTransaction.id) {
        setEditingTransaction(null);
      }
      await refreshSnapshots();
    } catch (error) {
      console.error('Error eliminando transacción:', error);
    }
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await exportBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aegis-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando respaldo:', error);
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const success = await importBackup(text);
      if (success) {
        await refreshTransactionsAndSnapshots();
      }
    } catch (error) {
      console.error('Error importando respaldo:', error);
    }
    e.target.value = '';
  };

  const handleDownloadSnapshot = (snap) => {
    const jsonStr = JSON.stringify(snap.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aegis-snapshot-${snap.date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const confirmRestoreSnapshot = async () => {
    if (!restoringSnapshotId) return;
    try {
      const success = await restoreFromSnapshot(restoringSnapshotId);
      if (success) {
        await refreshTransactionsAndSnapshots();
        setRestoringSnapshotId(null);
        setShowBackupsModal(false);
      }
    } catch (error) {
      console.error('Error restaurando snapshot:', error);
    }
  };

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
        overflowY: 'auto',
        padding: '1.25rem 1.5rem 85px 1.5rem',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeTab === 'agent' && <AgentView />}
        {activeTab === 'finances' && (
          <FinancesView
            transactions={transactions}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            editingTransaction={editingTransaction}
            handleTransactionSave={handleTransactionSave}
            handleTransactionEdit={handleTransactionEdit}
            handleCancelEdit={handleCancelEdit}
            confirmDeleteTransaction={confirmDeleteTransaction}
            deletingTransaction={deletingTransaction}
            setDeletingTransaction={setDeletingTransaction}
            snapshots={snapshots}
            showBackupsModal={showBackupsModal}
            setShowBackupsModal={setShowBackupsModal}
            handleExportBackup={handleExportBackup}
            handleImportBackup={handleImportBackup}
            handleDownloadSnapshot={handleDownloadSnapshot}
            confirmRestoreSnapshot={confirmRestoreSnapshot}
            restoringSnapshotId={restoringSnapshotId}
            setRestoringSnapshotId={setRestoringSnapshotId}
            refreshSnapshots={refreshSnapshots}
            refreshTransactionsAndSnapshots={refreshTransactionsAndSnapshots}
          />
        )}
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
