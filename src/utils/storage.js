// Sistema de persistencia soberana local para LifeOS Finanzas (SQLite embebido en Tauri v2 + Fallback IndexedDB)
import { invoke } from '@tauri-apps/api/core';
import {
  getAllTransactions as idbGetAllTransactions,
  addTransaction as idbAddTransaction,
  updateTransaction as idbUpdateTransaction,
  deleteTransactionDB as idbDeleteTransactionDB,
  getAllBudgets as idbGetAllBudgets,
  setBudgets as idbSetBudgets,
  getAllCategories as idbGetAllCategories,
  setCategories as idbSetCategories,
  getSnapshots as idbGetSnapshots,
  createAutoSnapshot as idbCreateAutoSnapshot,
  restoreFromSnapshot as idbRestoreFromSnapshot,
  replaceTransactions as idbReplaceTransactions
} from './db';

export const isTauri = () => typeof window !== 'undefined' && Boolean(window.__TAURI_INTERNALS__);

// Bandera para evitar migración repetida en memoria durante la sesión
let migrationAttempted = false;

// Inicialización de persistencia y auto-migración desde IndexedDB hacia SQLite
export const initializeStorage = async () => {
  if (isTauri() && !migrationAttempted) {
    migrationAttempted = true;
    try {
      const sqliteTxs = await invoke('sqlite_get_transactions');
      if (Array.isArray(sqliteTxs) && sqliteTxs.length === 0) {
        // Verificar si IndexedDB tiene registros previos para migrar
        const idbTxs = await idbGetAllTransactions();
        if (Array.isArray(idbTxs) && idbTxs.length > 0) {
          console.log(`[SQLite Migration] Migrando ${idbTxs.length} registros desde IndexedDB a SQLite...`);
          for (const tx of idbTxs) {
            await invoke('sqlite_save_transaction', {
              tx: {
                id: tx.id || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                amount: parseFloat(tx.amount) || 0,
                type: tx.type || 'expense',
                category: tx.category || 'Otros',
                paymentMethod: tx.paymentMethod || 'Débito',
                date: tx.date || getTodayLocalDateStr(),
                description: tx.description || '',
                createdAt: tx.createdAt || new Date().toISOString()
              }
            });
          }
          console.log('[SQLite Migration] Migración completada exitosamente.');
        }
      }
    } catch (e) {
      console.warn('[Storage] Error comprobando migración a SQLite:', e);
    }
  }
};

// Helper para obtener fecha local en formato 'YYYY-MM-DD' (evita desfase UTC)
export const getTodayLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- TRANSACCIONES ---
export const getTransactions = async () => {
  if (isTauri()) {
    try {
      const list = await invoke('sqlite_get_transactions');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('[Storage SQLite] Error obteniendo transacciones:', e);
    }
  }
  const list = await idbGetAllTransactions();
  return Array.isArray(list) ? list : [];
};

export const saveTransaction = async (transaction) => {
  const normalized = {
    id: transaction.id || '',
    amount: parseFloat(transaction.amount) || 0,
    type: transaction.type || 'expense',
    category: transaction.category || 'Otros',
    paymentMethod: transaction.paymentMethod || 'Débito',
    date: transaction.date || getTodayLocalDateStr(),
    description: transaction.description || null,
    createdAt: transaction.createdAt || null
  };

  if (isTauri()) {
    try {
      return await invoke('sqlite_save_transaction', { tx: normalized });
    } catch (e) {
      console.error('[Storage SQLite] Error guardando transacción:', e);
    }
  }

  if (transaction.id) {
    await idbUpdateTransaction(normalized);
  } else {
    await idbAddTransaction(normalized);
  }
  return await idbGetAllTransactions();
};

export const deleteTransaction = async (id, txRecord) => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_delete_transaction', { id: String(id) });
    } catch (e) {
      console.error('[Storage SQLite] Error eliminando transacción:', e);
    }
  }

  if (id !== undefined && id !== null && id !== '') {
    await idbDeleteTransactionDB(id);
  }
  let all = await idbGetAllTransactions();
  const initialLength = all.length;
  all = all.filter(t => {
    if (id !== undefined && id !== null && id !== '') {
      if (t.id === id || String(t.id) === String(id)) return false;
    }
    if (txRecord) {
      if (t.id && txRecord.id && (t.id === txRecord.id || String(t.id) === String(txRecord.id))) return false;
      if (!t.id && !txRecord.id && t.date === txRecord.date && t.amount === txRecord.amount && t.category === txRecord.category) return false;
    }
    return true;
  });

  if (all.length !== initialLength) {
    await idbReplaceTransactions(all);
  }
  return all;
};

// --- PRESUPUESTOS ---
export const getBudgets = async () => {
  if (isTauri()) {
    try {
      const budgets = await invoke('sqlite_get_budgets');
      return budgets && typeof budgets === 'object' ? budgets : {};
    } catch (e) {
      console.error('[Storage SQLite] Error obteniendo presupuestos:', e);
    }
  }
  const budgets = await idbGetAllBudgets();
  return budgets && typeof budgets === 'object' ? budgets : {};
};

export const saveBudget = async (category, amount) => {
  const num = parseFloat(amount) || 0;
  if (isTauri()) {
    try {
      return await invoke('sqlite_save_budget', { category, amount: num });
    } catch (e) {
      console.error('[Storage SQLite] Error guardando presupuesto:', e);
    }
  }
  const budgets = await idbGetAllBudgets();
  budgets[category] = num;
  await idbSetBudgets(budgets);
  return budgets;
};

export const deleteBudget = async (category) => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_delete_budget', { category });
    } catch (e) {
      console.error('[Storage SQLite] Error eliminando presupuesto:', e);
    }
  }
  const budgets = await idbGetAllBudgets();
  delete budgets[category];
  await idbSetBudgets(budgets);
  return budgets;
};

// --- CATEGORÍAS ---
export const getCategories = async () => {
  if (isTauri()) {
    try {
      const cats = await invoke('sqlite_get_categories');
      return Array.isArray(cats) && cats.length > 0 ? cats : [];
    } catch (e) {
      console.error('[Storage SQLite] Error obteniendo categorías:', e);
    }
  }
  const cats = await idbGetAllCategories();
  return Array.isArray(cats) ? cats : [];
};

export const addCategory = async (category) => {
  const trimmed = category.trim();
  if (!trimmed) return await getCategories();

  if (isTauri()) {
    try {
      return await invoke('sqlite_add_category', { category: trimmed });
    } catch (e) {
      console.error('[Storage SQLite] Error agregando categoría:', e);
    }
  }
  const categories = await idbGetAllCategories();
  if (!categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    categories.push(trimmed);
    await idbSetCategories(categories);
  }
  return categories;
};

export const updateCategory = async (oldName, newName) => {
  const trimmedNew = newName.trim();
  if (!trimmedNew || oldName === trimmedNew) return await getCategories();

  if (isTauri()) {
    try {
      return await invoke('sqlite_update_category', { oldName, newName: trimmedNew });
    } catch (e) {
      console.error('[Storage SQLite] Error actualizando categoría:', e);
    }
  }

  const categories = await idbGetAllCategories();
  const index = categories.indexOf(oldName);
  if (index !== -1) {
    if (categories.includes(trimmedNew)) {
      categories.splice(index, 1);
    } else {
      categories[index] = trimmedNew;
    }
    await idbSetCategories(categories);
  }

  const budgets = await idbGetAllBudgets();
  if (budgets[oldName] !== undefined) {
    budgets[trimmedNew] = (budgets[trimmedNew] || 0) + budgets[oldName];
    delete budgets[oldName];
    await idbSetBudgets(budgets);
  }

  const transactions = await idbGetAllTransactions();
  const affected = transactions.filter(t => t.category === oldName);
  for (const t of affected) {
    t.category = trimmedNew;
    await idbUpdateTransaction(t);
  }
  return categories;
};

export const deleteCategory = async (categoryName) => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_delete_category', { category: categoryName });
    } catch (e) {
      console.error('[Storage SQLite] Error eliminando categoría:', e);
    }
  }

  const categories = await idbGetAllCategories();
  const index = categories.indexOf(categoryName);
  if (index !== -1) {
    categories.splice(index, 1);
    if (!categories.includes('Otros')) {
      categories.push('Otros');
    }
    await idbSetCategories(categories);
  }
  await deleteBudget(categoryName);
  const transactions = await idbGetAllTransactions();
  const affected = transactions.filter(t => t.category === categoryName);
  for (const t of affected) {
    t.category = 'Otros';
    await idbUpdateTransaction(t);
  }
  return categories;
};

// --- TIMELINE MAESTRO CRUZADO (MELI, TADÚ, CERTS, UNI) ---
export const getTimelineEvents = async () => {
  if (isTauri()) {
    try {
      const list = await invoke('sqlite_get_timeline_events');
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error('[Storage SQLite] Error obteniendo timeline:', e);
    }
  }
  return [];
};

export const saveTimelineEvent = async (event) => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_save_timeline_event', { event });
    } catch (e) {
      console.error('[Storage SQLite] Error guardando evento en timeline:', e);
    }
  }
  return [];
};

export const toggleTimelineEvent = async (id, completed) => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_toggle_timeline_event', { id, completed });
    } catch (e) {
      console.error('[Storage SQLite] Error cambiando estado de evento:', e);
    }
  }
  return [];
};

export const deleteTimelineEvent = async (id) => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_delete_timeline_event', { id });
    } catch (e) {
      console.error('[Storage SQLite] Error borrando evento en timeline:', e);
    }
  }
  return [];
};

// --- AUTO RESPALDOS Y SNAPSHOTS ---
export const getSnapshots = async () => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_get_snapshots');
    } catch (e) {
      console.error('[Storage SQLite] Error obteniendo snapshots:', e);
    }
  }
  return await idbGetSnapshots();
};

export const createAutoSnapshot = async () => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_create_snapshot');
    } catch (e) {
      console.error('[Storage SQLite] Error creando snapshot:', e);
    }
  }
  return await idbCreateAutoSnapshot();
};

export const restoreFromSnapshot = async (snapshotId) => {
  if (isTauri()) {
    try {
      await invoke('sqlite_restore_snapshot', { snapshotId });
      return true;
    } catch (e) {
      console.error('[Storage SQLite] Error restaurando snapshot:', e);
      return false;
    }
  }
  return await idbRestoreFromSnapshot(snapshotId);
};

// --- EXPORTAR E IMPORTAR RESPALDOS (JSON) ---
export const exportBackup = async () => {
  if (isTauri()) {
    try {
      return await invoke('sqlite_export_backup');
    } catch (e) {
      console.error('[Storage SQLite] Error exportando respaldo:', e);
    }
  }
  const data = {
    transactions: await getTransactions(),
    budgets: await getBudgets(),
    categories: await getCategories(),
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const importBackup = async (fileContent) => {
  if (isTauri()) {
    try {
      const count = await invoke('sqlite_import_backup', { jsonStr: fileContent });
      return { success: true, count };
    } catch (e) {
      console.error('[Storage SQLite] Error importando respaldo en SQLite:', e);
    }
  }

  try {
    const parsed = JSON.parse(fileContent);
    if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
      throw new Error('Formato inválido: Falta el listado de transacciones.');
    }
    const transactions = parsed.transactions.map((transaction) => ({
      ...transaction,
      amount: parseFloat(transaction.amount) || 0,
      id: transaction.id || `tx_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    }));

    await idbReplaceTransactions(transactions);
    if (parsed.budgets && typeof parsed.budgets === 'object') {
      await idbSetBudgets(parsed.budgets);
    }
    if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
      await idbSetCategories(parsed.categories);
    }
    return { success: true, count: parsed.transactions.length };
  } catch (e) {
    console.error('Error al importar copia de seguridad:', e);
    return { success: false, error: e.message };
  }
};

// --- MOTOR DE FECHAS FINANCIERAS (CICLOS DEL 22 AL 22) ---
export const getFinancialMonthRange = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    dateStr = getTodayLocalDateStr();
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = (parseInt(parts[1], 10) || 1) - 1;
  const day = parseInt(parts[2], 10) || 1;

  let startDate, endDate, financialMonth, financialYear;

  if (day < 22) {
    startDate = new Date(year, month - 1, 22, 0, 0, 0, 0);
    endDate = new Date(year, month, 22, 23, 59, 59, 999);
    financialMonth = (month + 12) % 12;
    financialYear = month === 0 ? year - 1 : year;
  } else {
    startDate = new Date(year, month, 22, 0, 0, 0, 0);
    endDate = new Date(year, month + 1, 22, 23, 59, 59, 999);
    financialMonth = (month + 1) % 12;
    financialYear = month === 11 ? year + 1 : year;
  }

  return { startDate, endDate, financialMonth, financialYear };
};

export const isDateInRange = (dateStr, startDate, endDate) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  const checkDate = new Date(y, m, d, 12, 0, 0, 0);
  return checkDate >= startDate && checkDate <= endDate;
};

export const requestPersistentStorage = async () => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        await navigator.storage.persist();
      }
    } catch (e) {
      console.warn('[Storage] Error al solicitar persistencia de almacenamiento:', e);
    }
  }
};
