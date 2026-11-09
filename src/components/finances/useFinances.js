import { useState, useEffect, useMemo, useCallback } from 'react';
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
  getFinanceCutoffDay,
  setFinanceCutoffDay,
  isDateInRange,
  getTimelineEvents,
  saveTimelineEvent,
  toggleTimelineEvent,
  deleteTimelineEvent,
  processAutoMsiInstallments
} from '../../utils/storage';

export function useFinances() {
  const [subTab, setSubTab] = useState('operations'); // 'operations' | 'accounts' | 'timeline' | 'calendar' | 'analytics' | 'budgets'
  const [transactions, setTransactions] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getTodayLocalDateStr());
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [snapshots, setSnapshots] = useState([]);
  const [showBackupsModal, setShowBackupsModal] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState(null);
  const [visibleLimit, setVisibleLimit] = useState(30);

  const refreshSnapshots = useCallback(async () => {
    try {
      await createAutoSnapshot();
      const snaps = await getSnapshots();
      setSnapshots(snaps || []);
    } catch (err) {
      console.error('Error refrescando snapshots:', err);
    }
  }, []);

  const refreshTimeline = useCallback(async () => {
    try {
      const list = await getTimelineEvents();
      setTimelineEvents(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error refrescando timeline:', err);
    }
  }, []);

  const refreshTransactionsAndSnapshots = useCallback(async () => {
    try {
      const list = await getTransactions();
      setTransactions(Array.isArray(list) ? list : []);
      await refreshSnapshots();
      await refreshTimeline();
    } catch (err) {
      console.error('Error refrescando transacciones y snapshots:', err);
    }
  }, [refreshSnapshots, refreshTimeline]);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        await initializeStorage();
        await requestPersistentStorage();
        await createAutoSnapshot();
        await processAutoMsiInstallments();
        if (!isMounted) return;
        const [snaps, list, evts] = await Promise.all([
          getSnapshots(),
          getTransactions(),
          getTimelineEvents()
        ]);
        if (isMounted) {
          setSnapshots(snaps || []);
          setTransactions(Array.isArray(list) ? list : []);
          setTimelineEvents(Array.isArray(evts) ? evts : []);
        }
      } catch (err) {
        console.error('Error inicializando finanzas:', err);
      }
    };
    init();
    return () => { isMounted = false; };
  }, []);

  const safeTransactions = useMemo(() => {
    return Array.isArray(transactions) ? transactions : [];
  }, [transactions]);

  const [cutoffDay, setCutoffDay] = useState(() => getFinanceCutoffDay());

  // Escuchar cambios de día de corte
  useEffect(() => {
    const handleCutoffChange = (e) => {
      if (typeof e.detail === 'number') {
        setCutoffDay(e.detail);
      }
    };
    window.addEventListener('aegis-cutoff-day-changed', handleCutoffChange);
    return () => window.removeEventListener('aegis-cutoff-day-changed', handleCutoffChange);
  }, []);

  // Escuchar cambios reactivos de transacciones (MSI, liquidación TDC, importaciones)
  useEffect(() => {
    const handleTxChanged = (e) => {
      if (e.detail && Array.isArray(e.detail)) {
        setTransactions(e.detail);
      } else {
        refreshTransactionsAndSnapshots();
      }
    };
    window.addEventListener('aegis:transactions-changed', handleTxChanged);
    return () => window.removeEventListener('aegis:transactions-changed', handleTxChanged);
  }, [refreshTransactionsAndSnapshots]);

  const handleUpdateCutoffDay = useCallback((newDay) => {
    const updated = setFinanceCutoffDay(newDay);
    setCutoffDay(updated);
  }, []);

  // Navegar ciclos (anterior / siguiente con offset seguro)
  const handleShiftCycle = useCallback((offsetCycles) => {
    if (!offsetCycles) return;
    setSelectedDate((prevDate) => {
      const { startDate, endDate } = getFinancialMonthRange(prevDate, cutoffDay);
      const target = offsetCycles < 0
        ? new Date(startDate.getTime() - 15 * 24 * 60 * 60 * 1000)
        : new Date(endDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      const yStr = target.getFullYear();
      const mStr = String(target.getMonth() + 1).padStart(2, '0');
      const dStr = String(target.getDate()).padStart(2, '0');
      return `${yStr}-${mStr}-${dStr}`;
    });
  }, [cutoffDay]);

  const { startDate, endDate } = useMemo(() => {
    return getFinancialMonthRange(selectedDate, cutoffDay);
  }, [selectedDate, cutoffDay]);

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

  const isTodayCutoff = useMemo(() => new Date().getDate() === cutoffDay, [cutoffDay]);

  const selectedDayEvents = useMemo(() => {
    return (timelineEvents || []).filter((e) => e.date === selectedDate);
  }, [timelineEvents, selectedDate]);

  const handleToggleTimelineEvent = async (id, completed) => {
    try {
      const updated = await toggleTimelineEvent(id, completed);
      setTimelineEvents(Array.isArray(updated) ? updated : await getTimelineEvents());
    } catch (error) {
      console.error('Error alternando evento del timeline:', error);
    }
  };

  const handleSaveTimelineEvent = async (evt) => {
    try {
      const updated = await saveTimelineEvent(evt);
      setTimelineEvents(Array.isArray(updated) ? updated : await getTimelineEvents());
    } catch (error) {
      console.error('Error guardando evento en timeline:', error);
    }
  };

  const handleDeleteTimelineEvent = async (id) => {
    try {
      const updated = await deleteTimelineEvent(id);
      setTimelineEvents(Array.isArray(updated) ? updated : await getTimelineEvents());
    } catch (error) {
      console.error('Error eliminando evento de timeline:', error);
    }
  };

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
    setSubTab('operations');
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

  return {
    subTab,
    setSubTab,
    safeTransactions,
    timelineEvents,
    selectedDate,
    setSelectedDate,
    editingTransaction,
    snapshots,
    showBackupsModal,
    setShowBackupsModal,
    deletingTransaction,
    setDeletingTransaction,
    restoringSnapshotId,
    setRestoringSnapshotId,
    visibleLimit,
    setVisibleLimit,
    startDate,
    endDate,
    cutoffDay,
    handleUpdateCutoffDay,
    handleShiftCycle,
    monthlyTxs,
    visibleMonthlyTxs,
    selectedDayTxs,
    selectedDayEvents,
    isToday22: isTodayCutoff,
    isTodayCutoff,
    refreshSnapshots,
    refreshTimeline,
    refreshTransactionsAndSnapshots,
    handleToggleTimelineEvent,
    handleSaveTimelineEvent,
    handleDeleteTimelineEvent,
    handleTransactionSave,
    handleTransactionEdit,
    handleCancelEdit,
    confirmDeleteTransaction,
    handleExportBackup,
    handleImportBackup,
    handleDownloadSnapshot,
    confirmRestoreSnapshot
  };
}
