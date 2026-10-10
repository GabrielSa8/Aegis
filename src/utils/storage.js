// Sistema de persistencia local y respaldos para LifeOS Finanzas
import {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransactionDB,
  getAllBudgets,
  setBudgets,
  getAllCategories,
  setCategories,
  getSnapshots,
  createAutoSnapshot,
  restoreFromSnapshot,
  replaceTransactions
} from './db';

// No se necesita inicializar storage con localStorage; IndexedDB gestiona su propio esquema.
// La función se mantiene vacía por compatibilidad.
export const initializeStorage = () => {}

// Helper para obtener fecha local en formato 'YYYY-MM-DD' (evita desfase UTC de toISOString)
export const getTodayLocalDateStr = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// --- TRANSACCIONES ---
export const getTransactions = async () => {
  // Devuelve todas las transacciones desde IndexedDB
  const list = await getAllTransactions();
  return Array.isArray(list) ? list : [];
};

export const saveTransaction = async (transaction) => {
  const normalized = {
    ...transaction,
    amount: parseFloat(transaction.amount) || 0,
  };

  if (transaction.id) {
    // Actualizar existente
    await updateTransaction(normalized);
  } else {
    // Crear nueva
    await addTransaction(normalized);
  }
  // Retornar siempre el listado completo actualizado para evitar desincronización de estado en React
  return await getAllTransactions();
};

export const deleteTransaction = async (id, txRecord) => {
  if (id !== undefined && id !== null && id !== '') {
    await deleteTransactionDB(id);
  }
  
  // Obtener listado de la base de datos
  let all = await getAllTransactions();
  
  // Garantizar eliminación en memoria (por si hubo discrepancia de tipo de id o registro sin id)
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

  // Si el filtro en memoria eliminó algo que IndexedDB no había limpiado aún:
  if (all.length !== initialLength) {
    await replaceTransactions(all);
  }

  return all;
};

// --- PRESUPUESTOS ---
export const getBudgets = async () => {
  const budgets = await getAllBudgets();
  return budgets && typeof budgets === 'object' ? budgets : {};
};

export const saveBudget = async (category, amount) => {
  const budgets = await getAllBudgets();
  budgets[category] = parseFloat(amount) || 0;
  await setBudgets(budgets);
  return budgets;
};

export const deleteBudget = async (category) => {
  const budgets = await getAllBudgets();
  delete budgets[category];
  await setBudgets(budgets);
  return budgets;
};

// --- CATEGORÍAS ---
export const getCategories = async () => {
  const cats = await getAllCategories();
  return Array.isArray(cats) ? cats : [];
};

export const addCategory = async (category) => {
  const categories = await getAllCategories();
  const trimmed = category.trim();
  if (trimmed && !categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
    categories.push(trimmed);
    await setCategories(categories);
  }
  return categories;
};

export const updateCategory = async (oldName, newName) => {
  const categories = await getAllCategories();
  const trimmedNew = newName.trim();
  if (!trimmedNew || oldName === trimmedNew) return categories;

  const index = categories.indexOf(oldName);
  if (index !== -1) {
    if (categories.includes(trimmedNew)) {
      categories.splice(index, 1);
    } else {
      categories[index] = trimmedNew;
    }
    await setCategories(categories);
  }

  // Actualizar presupuestos
  const budgets = await getAllBudgets();
  if (budgets[oldName] !== undefined) {
    budgets[trimmedNew] = (budgets[trimmedNew] || 0) + budgets[oldName];
    delete budgets[oldName];
    await setBudgets(budgets);
  }

  // Actualizar transacciones afectadas únicamente
  const transactions = await getAllTransactions();
  const affected = transactions.filter(t => t.category === oldName);
  for (const t of affected) {
    t.category = trimmedNew;
    await updateTransaction(t);
  }
  return categories;
};

export const deleteCategory = async (categoryName) => {
  const categories = await getAllCategories();
  const index = categories.indexOf(categoryName);
  if (index !== -1) {
    categories.splice(index, 1);
    if (!categories.includes('Otros')) {
      categories.push('Otros');
    }
    await setCategories(categories);
  }

  // Borrar presupuesto
  await deleteBudget(categoryName);

  // Mover transacciones afectadas a "Otros"
  const transactions = await getAllTransactions();
  const affected = transactions.filter(t => t.category === categoryName);
  for (const t of affected) {
    t.category = 'Otros';
    await updateTransaction(t);
  }
  return categories;
};

// --- EXPORTAR E IMPORTAR RESPALDOS (JSON) ---
export const exportBackup = async () => {
  const data = {
    transactions: await getTransactions(),
    budgets: await getBudgets(),
    categories: await getCategories(),
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `lifeos_finance_backup_${getTodayLocalDateStr()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importBackup = async (fileContent) => {
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

    await replaceTransactions(transactions);
    if (parsed.budgets && typeof parsed.budgets === 'object') {
      await setBudgets(parsed.budgets);
    }
    if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
      await setCategories(parsed.categories);
    }
    
    return { success: true, count: parsed.transactions.length };
  } catch (e) {
    console.error('Error al importar copia de seguridad:', e);
    return { success: false, error: e.message };
  }
};

// --- SINCRONIZACIÓN CON SERVIDOR (DESACTIVADO) ---
// En la versión offline‑only, las funciones simplemente indican que el servidor está indisponible.
export const pullFromServer = async () => {
  return { success: true, skipped: true };
};

export const syncToServer = async () => {
  return true;
};

// --- MOTOR DE FECHAS FINANCIERAS (CICLOS DEL 22 AL 22) ---

/**
 * Obtiene el rango de fechas [startDate, endDate], el mes financiero (0-11) y el año financiero
 * correspondientes a una fecha de referencia dada.
 * @param {string} dateStr Fecha en formato 'YYYY-MM-DD'
 */
export const getFinancialMonthRange = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') {
    dateStr = getTodayLocalDateStr();
  }
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = (parseInt(parts[1], 10) || 1) - 1; // 0-11
  const day = parseInt(parts[2], 10) || 1;

  let startDate, endDate, financialMonth, financialYear;

  if (day < 22) {
    // Si estamos antes del 22, el ciclo abarca desde el 22 del mes anterior al 22 de este mes.
    startDate = new Date(year, month - 1, 22, 0, 0, 0, 0);
    endDate = new Date(year, month, 22, 23, 59, 59, 999);
    financialMonth = (month + 12) % 12; // Etiquetado con el mes actual
    financialYear = month === 0 ? year - 1 : year;
  } else {
    // Si estamos en el 22 o después, el ciclo abarca desde el 22 de este mes al 22 del mes siguiente.
    startDate = new Date(year, month, 22, 0, 0, 0, 0);
    endDate = new Date(year, month + 1, 22, 23, 59, 59, 999);
    financialMonth = (month + 1) % 12; // Etiquetado con el mes siguiente
    financialYear = month === 11 ? year + 1 : year;
  }

  return { startDate, endDate, financialMonth, financialYear };
};

/**
 * Comprueba si un string de fecha en formato 'YYYY-MM-DD' cae dentro de un rango de fechas.
 * @param {string} dateStr Fecha a validar ('YYYY-MM-DD')
 * @param {Date} startDate Objeto Date de inicio de rango
 * @param {Date} endDate Objeto Date de fin de rango
 */
export const isDateInRange = (dateStr, startDate, endDate) => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const parts = dateStr.split('-');
  if (parts.length < 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  // Se crea a las 12:00:00 para evitar problemas de husos horarios locales
  const checkDate = new Date(y, m, d, 12, 0, 0, 0);
  return checkDate >= startDate && checkDate <= endDate;
};

// --- AUTO RESPALDOS ---
export { getSnapshots, createAutoSnapshot, restoreFromSnapshot };

export const requestPersistentStorage = async () => {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        console.log(`[Storage] Persistencia de almacenamiento concedida: ${granted}`);
      } else {
        console.log('[Storage] Almacenamiento ya está en modo persistente.');
      }
    } catch (e) {
      console.warn('[Storage] Error al solicitar persistencia de almacenamiento:', e);
    }
  }
};
