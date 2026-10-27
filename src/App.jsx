import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Edit3, Plus, Sparkles, PiggyBank, History, AlertTriangle, ShieldCheck, X, Cpu } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { getTransactions, saveTransaction, deleteTransaction, exportBackup, importBackup, getFinancialMonthRange, isDateInRange, initializeStorage, requestPersistentStorage, createAutoSnapshot, getSnapshots, restoreFromSnapshot, getTodayLocalDateStr } from './utils/storage';
import Calendar from './components/Calendar';
import TransactionForm from './components/TransactionForm';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDateStr());
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Snapshots & backups state
  const [snapshots, setSnapshots] = useState([]);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [coreStatus, setCoreStatus] = useState('Conectando a Aegis Core...');

  // Estados para diálogos de confirmación en la app (sin depender del navegador)
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

  // Initialize storage and sync with server (offline‑only mode)
  useEffect(() => {
    // Probar IPC con Tauri Core
    invoke('ping')
      .then((res) => setCoreStatus(res))
      .catch((err) => setCoreStatus('Modo Web Standalone'));

    initializeStorage();
    const initAndSync = async () => {
      // Solicitud de persistencia de datos (evita borrado automático del navegador)
      await requestPersistentStorage();
      
      // Intentar crear un snapshot automático del día de hoy
      await createAutoSnapshot();
      
      // Cargar listado de respaldos disponibles
      setSnapshots(await getSnapshots());
      
      // Load local data immediately
      const list = await getTransactions();
      setTransactions(Array.isArray(list) ? list : []);
    };
    initAndSync();
  }, []);

  // Save or update a transaction
  const handleTransactionSave = async (txData) => {
    try {
      const updated = await saveTransaction(txData);
      setTransactions(Array.isArray(updated) ? updated : await getTransactions());
      setEditingTransaction(null);
      await refreshSnapshots();
    } catch (error) {
      console.error('Error al guardar la transacción:', error);
      alert('Error al guardar la transacción: ' + error.message);
    }
  };

  // Confirm and execute transaction deletion
  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction) return;
    const target = deletingTransaction;
    setDeletingTransaction(null);
    try {
      const updated = await deleteTransaction(target.id, target);
      setTransactions(Array.isArray(updated) ? updated : await getTransactions());
      if (editingTransaction && (editingTransaction.id === target.id || editingTransaction === target)) {
        setEditingTransaction(null);
      }
      await refreshSnapshots();
    } catch (error) {
      console.error('Error al eliminar la transacción:', error);
      alert('Error al eliminar la transacción: ' + error.message);
    }
  };

  const handleTransactionEdit = (tx) => {
    setEditingTransaction(tx);
    window.scrollTo({ top: document.querySelector('form')?.offsetTop || 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingTransaction(null);
  };

  const handleExportBackup = () => {
    exportBackup();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = await importBackup(event.target.result);
      if (result.success) {
        setTransactions(await getTransactions());
        alert(`¡Copia de seguridad importada con éxito! Se cargaron ${result.count} registros.`);
        await refreshSnapshots();
      } else {
        alert(`Error al importar: ${result.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const confirmRestoreSnapshot = async () => {
    if (!restoringSnapshotId) return;
    const id = restoringSnapshotId;
    setRestoringSnapshotId(null);
    try {
      const restored = await restoreFromSnapshot(id);
      setTransactions(await getTransactions());
      alert(`¡Copia de seguridad del ${restored.date} restaurada con éxito!`);
      setShowBackupsModal(false);
      await refreshSnapshots();
    } catch (error) {
      alert(`Error al restaurar copia: ${error.message}`);
    }
  };

  const handleDownloadSnapshot = (snap) => {
    const data = {
      transactions: snap.data.transactions,
      budgets: snap.data.budgets,
      categories: snap.data.categories,
      version: '1.0.0',
      exportedAt: new Date(snap.timestamp).toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifeos_finance_snapshot_${snap.date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter transactions for the selected financial month (22‑22 cycle)
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  const { startDate, endDate } = getFinancialMonthRange(selectedDate);
  const monthlyTxs = safeTransactions
    .filter((t) => isDateInRange(t.date, startDate, endDate))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const isToday22 = new Date().getDate() === 22;

  return (
    <div className="container">
      {/* Header */}
      <header className="glass" style={{ padding: '1.25rem 2rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }}>
        <div className="logo-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ShieldCheck style={{ color: 'var(--primary)' }} size={28} />
              Aegis
            </h1>
            <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Cpu size={12} />
              {coreStatus}
            </span>
          </div>
          <p>Cockpit y Centro de Mando Maestro Personal</p>
        </div>
        <div className="actions-section">
          <button onClick={() => setShowBackupsModal(true)} className="btn btn-secondary" title="Ver e importar copias automáticas locales">
            <History size={16} style={{ color: 'var(--primary)' }} />
            <span>Auto‑Respaldos ({snapshots.length})</span>
          </button>
          <button onClick={handleExportBackup} className="btn btn-secondary" title="Exportar copia de seguridad en JSON">
            <Download size={16} />
            <span>Exportar Copia</span>
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }} title="Importar copia de seguridad desde un JSON">
            <Upload size={16} />
            <span>Importar Copia</span>
            <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
          </label>
        </div>
      </header>

      {/* Cycle-End Reminder Banner */}
      {isToday22 && (
        <div className="glass cycle-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', marginBottom: '1.5rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} style={{ color: '#a855f7' }} />
            <div>
              <span style={{ fontWeight: '700', color: '#ffffff' }}>¡Hoy es cierre de tu ciclo financiero! 📦</span>
              <p style={{ fontSize: '0.8rem', color: '#d8b4fe', margin: '2px 0 0 0' }}>Te recomendamos exportar una copia física de tus datos para mayor seguridad.</p>
            </div>
          </div>
          <button onClick={handleExportBackup} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)', padding: '0.5rem 1rem', fontSize: '0.85rem', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} />
            <span>Exportar Ahora</span>
          </button>
        </div>
      )}

      {/* Dashboard */}
      <Dashboard transactions={safeTransactions} selectedDate={selectedDate} onBudgetChange={refreshSnapshots} />

      {/* Main layout */}
      <div className="main-layout">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Calendar transactions={safeTransactions} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
          <Analytics transactions={safeTransactions} selectedDate={selectedDate} />
        </div>
        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <TransactionForm selectedDate={selectedDate} onTransactionSave={handleTransactionSave} editingTransaction={editingTransaction} onCancelEdit={handleCancelEdit} onCategoriesChange={refreshTransactionsAndSnapshots} />
          <div className="tx-list-container glass">
            <div className="tx-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Historial del Ciclo</h3>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '2px' }}>
                  {monthlyTxs.length} registros • Ciclo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} al {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
            <div className="tx-items">
              {monthlyTxs.length > 0 ? (
                monthlyTxs.map((tx) => (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-left">
                      <div className={`tx-icon-wrapper ${tx.type}`}>
                        {tx.type === 'income' ? <Plus size={18} /> : <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>-</span>}
                      </div>
                      <div className="tx-info">
                        <h4>{tx.description || tx.category}</h4>
                        <p>{(tx.date || '').split('-').reverse().join('/')} • <span className="tx-badge">{tx.category}</span></p>
                      </div>
                    </div>
                    <div className="tx-right">
                      <div className="tx-details">
                        <span className="tx-badge" style={{ background: 'rgba(255,255,255,0.03)' }}>{tx.paymentMethod}</span>
                      </div>
                      <div className={`tx-amount ${tx.type}`}> {tx.type === 'income' ? '+' : '-'}${(parseFloat(tx.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="tx-actions">
                        <button type="button" onClick={() => handleTransactionEdit(tx)} title="Editar"><Edit3 size={14} /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDeletingTransaction(tx); }} className="delete" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>
                  No hay transacciones registradas en este período.
                  <br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'block', marginTop: '6px' }}>¡Selecciona un día en el calendario y añade un gasto/ingreso!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ⚙️ MODAL DE RESPALDOS AUTOMÁTICOS */}
      {showBackupsModal && (
        <div className="modal-overlay">
          <div className="modal-content glass" style={{ minWidth: '400px', maxWidth: '550px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={20} style={{ color: 'var(--primary)' }} />
                <h3>Historial de Auto‑Respaldos</h3>
              </div>
              <button type="button" onClick={() => setShowBackupsModal(false)} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }} title="Cerrar">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'start', padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: '1.2rem', margin: 0 }}>
                  <strong>Protección Local Activa:</strong> El almacenamiento persistente está activado para evitar que el navegador limpie tu base de datos. Se guarda un punto de restauración automático diario (últimos 10 días).
                </p>
              </div>
              
              <div className="snapshots-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {snapshots.length > 0 ? (
                  snapshots.map(snap => (
                    <div key={snap.id} className="snapshot-item glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)' }}>
                      <div>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem', color: '#ffffff' }}>Respaldo del {snap.date}</span>
                        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0 0' }}>
                          {snap.transactionsCount} transacciones registradas
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleDownloadSnapshot(snap)}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px' }}
                          title="Descargar archivo JSON de esta copia"
                        >
                          <Download size={12} />
                          <span>Descargar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoringSnapshotId(snap.id)}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px', background: 'var(--primary-grad)' }}
                          title="Restaurar base de datos a este punto"
                        >
                          <span>Restaurar</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
                    <AlertTriangle size={24} style={{ color: 'var(--warning)', marginBottom: '8px' }} />
                    <p>No hay respaldos automáticos guardados todavía.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🗑️ MODAL DE CONFIRMACIÓN DE BORRADO DE REGISTRO */}
      {deletingTransaction && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content glass" style={{ minWidth: '340px', maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                <Trash2 size={24} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem', color: '#ffffff' }}>
              ¿Eliminar este registro?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Estás a punto de borrar <strong>"{deletingTransaction.description || deletingTransaction.category}"</strong> por <strong style={{ color: deletingTransaction.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>${(parseFloat(deletingTransaction.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> del {deletingTransaction.date}.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem 1rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteTransaction}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem 1rem', background: 'var(--danger-grad)', boxShadow: '0 4px 12px var(--danger-glow)' }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL DE CONFIRMACIÓN DE RESTAURACIÓN DE RESPALDO */}
      {restoringSnapshotId && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content glass" style={{ minWidth: '340px', maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
                <AlertTriangle size={24} />
              </div>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.6rem', color: '#ffffff' }}>
              ¿Restaurar copia de respaldo?
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: '1.4' }}>
              Esto reemplazará todos tus registros, categorías y presupuestos actuales por los de esa fecha de forma irreversible.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setRestoringSnapshotId(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem 1rem' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRestoreSnapshot}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem 1rem', background: 'var(--primary-grad)' }}
              >
                Restaurar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
