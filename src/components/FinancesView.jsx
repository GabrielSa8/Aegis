import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Plus, 
  Sparkles, 
  History, 
  AlertTriangle, 
  ShieldCheck, 
  X,
  CreditCard,
  Calendar as CalendarIcon,
  PieChart,
  Target,
  ReceiptText
} from 'lucide-react';

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
  getTodayLocalDateStr,
  getFinancialMonthRange, 
  isDateInRange 
} from '../utils/storage';

import Calendar from './Calendar';
import TransactionForm from './TransactionForm';
import Dashboard from './Dashboard';
import Analytics from './Analytics';

export default function FinancesView() {
  const [subTab, setSubTab] = useState('operations'); // 'operations' | 'calendar' | 'analytics' | 'budgets'
  const [transactions, setTransactions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDateStr());
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState(null);

  // Inicialización y carga aislada
  const refreshSnapshots = useCallback(async () => {
    await createAutoSnapshot();
    setSnapshots(await getSnapshots());
  }, []);

  const refreshTransactionsAndSnapshots = useCallback(async () => {
    const list = await getTransactions();
    setTransactions(Array.isArray(list) ? list : []);
    await refreshSnapshots();
  }, [refreshSnapshots]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      initializeStorage();
      await requestPersistentStorage();
      await createAutoSnapshot();
      if (!isMounted) return;
      const [snaps, list] = await Promise.all([getSnapshots(), getTransactions()]);
      if (isMounted) {
        setSnapshots(snaps || []);
        setTransactions(Array.isArray(list) ? list : []);
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const { startDate, endDate } = useMemo(() => {
    return getFinancialMonthRange(selectedDate);
  }, [selectedDate]);

  const [visibleLimit, setVisibleLimit] = useState(30);

  const monthlyTxs = useMemo(() => {
    return safeTransactions
      .filter((t) => isDateInRange(t.date, startDate, endDate))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [safeTransactions, startDate, endDate]);

  const visibleMonthlyTxs = useMemo(() => {
    return monthlyTxs.slice(0, visibleLimit);
  }, [monthlyTxs, visibleLimit]);

  const selectedDayTxs = useMemo(() => {
    return safeTransactions
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [safeTransactions, selectedDate]);

  const isToday22 = new Date().getDate() === 22;

  // Handlers
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
    setSubTab('operations'); // Mover a la pestaña de operaciones para editar
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

  const subTabs = [
    { id: 'operations', label: 'Operaciones & Registro', icon: ReceiptText },
    { id: 'calendar', label: 'Calendario Mensual', icon: CalendarIcon },
    { id: 'analytics', label: 'Métricas & Analítica', icon: PieChart },
    { id: 'budgets', label: 'Presupuestos & Respaldos', icon: Target }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 🧭 Barra de Sub-Navegación Táctica de Finanzas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Pills de Navegación */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <Icon size={14} color={isActive ? '#10b981' : '#788882'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Ciclo Info & Acciones Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Ciclo: {startDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - {endDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
          </span>
          <button 
            onClick={() => setShowBackupsModal(true)} 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.72rem', height: '28px', borderRadius: 'var(--radius-sm)' }}
            title="Ver e importar copias automáticas locales"
          >
            <History size={13} style={{ color: 'var(--primary)' }} />
            <span>Respaldos ({snapshots.length})</span>
          </button>
        </div>
      </div>

      {/* Recordatorio de Cierre de Ciclo */}
      {isToday22 && (
        <div className="glass cycle-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem 1.25rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={16} style={{ color: '#a855f7' }} />
            <div>
              <span style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.85rem' }}>¡Hoy es cierre de ciclo financiero! 📦</span>
              <p style={{ fontSize: '0.75rem', color: '#d8b4fe', margin: '2px 0 0 0' }}>Te recomendamos exportar una copia física de tus datos.</p>
            </div>
          </div>
          <button onClick={handleExportBackup} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)', padding: '0.4rem 0.8rem', fontSize: '0.75rem', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={12} />
            <span>Exportar Ahora</span>
          </button>
        </div>
      )}

      {/* 🚀 SUB-VISTA 1: OPERACIONES & REGISTRO (0MS RETARDO, SOLO KPIS + FORM + LISTA) */}
      {subTab === 'operations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Métricas KPI Rápidas (Sin 20 tarjetas de presupuesto) */}
          <Dashboard 
            transactions={safeTransactions} 
            selectedDate={selectedDate} 
            onBudgetChange={refreshSnapshots} 
            showBudgets={false} 
          />

          {/* Formulario e Historial Lado a Lado */}
          <div className="main-layout" style={{ marginTop: '0.5rem' }}>
            {/* Formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <TransactionForm 
                selectedDate={selectedDate} 
                onTransactionSave={handleTransactionSave} 
                editingTransaction={editingTransaction} 
                onCancelEdit={handleCancelEdit} 
                onCategoriesChange={refreshTransactionsAndSnapshots} 
              />
            </div>

            {/* Historial del Ciclo */}
            <div className="tx-list-container glass">
              <div className="tx-header">
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Historial del Ciclo</h3>
                  <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                    Mostrando {visibleMonthlyTxs.length} de {monthlyTxs.length} registros
                  </p>
                </div>
              </div>
              <div className="tx-items">
                {visibleMonthlyTxs.length > 0 ? (
                  visibleMonthlyTxs.map((tx) => (
                    <div key={tx.id} className="tx-item">
                      <div className="tx-left">
                        <div className={`tx-icon-wrapper ${tx.type}`}>
                          {tx.type === 'income' ? <Plus size={16} /> : <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>-</span>}
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
                        <div className={`tx-amount ${tx.type}`}>
                          {tx.type === 'income' ? '+' : '-'}${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="tx-actions">
                          <button type="button" onClick={() => handleTransactionEdit(tx)} title="Editar"><Edit3 size={14} /></button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setDeletingTransaction(tx); }} className="delete" title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                    No hay transacciones registradas en este período.
                  </div>
                )}
                {monthlyTxs.length > visibleLimit && (
                  <button
                    onClick={() => setVisibleLimit(prev => prev + 30)}
                    className="btn btn-secondary"
                    style={{ margin: '8px auto', padding: '6px 14px', fontSize: '0.75rem', borderRadius: 'var(--radius-md)' }}
                  >
                    Cargar más registros ({monthlyTxs.length - visibleLimit} restantes)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📅 SUB-VISTA 2: CALENDARIO */}
      {subTab === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) minmax(300px, 380px)', gap: '1.25rem' }}>
          <div>
            <Calendar 
              transactions={safeTransactions} 
              selectedDate={selectedDate} 
              onDateSelect={setSelectedDate} 
            />
          </div>

          <div className="tx-list-container glass" style={{ height: 'fit-content', maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="tx-header">
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Movimientos del {selectedDate}</h3>
                <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                  {selectedDayTxs.length} registros en esta fecha
                </p>
              </div>
              <button 
                onClick={() => setSubTab('operations')} 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '0.72rem', borderRadius: 'var(--radius-sm)' }}
              >
                + Añadir en este día
              </button>
            </div>
            <div className="tx-items" style={{ flex: 1, overflowY: 'auto' }}>
              {selectedDayTxs.length > 0 ? (
                selectedDayTxs.map((tx) => (
                  <div key={tx.id} className="tx-item">
                    <div className="tx-left">
                      <div className={`tx-icon-wrapper ${tx.type}`}>
                        {tx.type === 'income' ? <Plus size={16} /> : <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>-</span>}
                      </div>
                      <div className="tx-info">
                        <h4>{tx.description || tx.category}</h4>
                        <p><span className="tx-badge">{tx.category}</span></p>
                      </div>
                    </div>
                    <div className="tx-right">
                      <div className={`tx-amount ${tx.type}`}>
                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="tx-actions">
                        <button type="button" onClick={() => handleTransactionEdit(tx)} title="Editar"><Edit3 size={14} /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setDeletingTransaction(tx); }} className="delete" title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem' }}>
                  Sin movimientos registrados para el {selectedDate}.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📊 SUB-VISTA 3: ANALÍTICA & GRÁFICOS */}
      {subTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Analytics 
            transactions={safeTransactions} 
            selectedDate={selectedDate} 
          />
        </div>
      )}

      {/* 🎯 SUB-VISTA 4: PRESUPUESTOS & RESPALDOS */}
      {subTab === 'budgets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Panel de Respaldos */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Copias de Seguridad Físicas</h3>
              <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '3px 0 0 0' }}>
                Exporta tus transacciones en JSON o restaura un respaldo previo.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleExportBackup} className="btn btn-secondary" style={{ borderRadius: 'var(--radius-md)' }}>
                <Download size={14} />
                <span>Exportar JSON</span>
              </button>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>
                <Upload size={14} />
                <span>Importar JSON</span>
                <input type="file" accept=".json" onChange={handleImportBackup} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          {/* Panel de Presupuestos (Dashboard) */}
          <Dashboard 
            transactions={safeTransactions} 
            selectedDate={selectedDate} 
            onBudgetChange={refreshSnapshots} 
            showBudgets={true}
            showStats={false}
          />
        </div>
      )}

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
                  <strong>Protección Local Activa:</strong> El almacenamiento persistente está activado. Se guarda un punto de restauración automático diario (últimos 10 días).
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
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px', borderRadius: 'var(--radius-sm)' }}
                          title="Descargar archivo JSON de esta copia"
                        >
                          <Download size={12} />
                          <span>Descargar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoringSnapshotId(snap.id)}
                          className="btn btn-primary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px', background: 'var(--primary-grad)', borderRadius: 'var(--radius-sm)' }}
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

      {/* 🗑️ MODAL DE BORRADO DE REGISTRO */}
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
              Estás a punto de borrar <strong>"{deletingTransaction.description || deletingTransaction.category}"</strong> por <strong style={{ color: deletingTransaction.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>${Number(deletingTransaction.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong> del {deletingTransaction.date}.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setDeletingTransaction(null)}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteTransaction}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem 1rem', background: 'var(--danger-grad)', boxShadow: '0 4px 12px var(--danger-glow)', borderRadius: 'var(--radius-md)' }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⚠️ MODAL DE RESTAURACIÓN DE RESPALDO */}
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
                style={{ flex: 1, padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmRestoreSnapshot}
                className="btn btn-primary"
                style={{ flex: 1, padding: '0.65rem 1rem', background: 'var(--primary-grad)', borderRadius: 'var(--radius-md)' }}
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
