// Simple IndexedDB wrapper for LifeOS local‑only storage.
// No external dependencies; uses the native IndexedDB API.

let dbPromise = null;

// Open (or reuse) the database connection.
function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open('lifeos-db', 1);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Store for each transaction (keyPath = 'id')
        if (!db.objectStoreNames.contains('transactions')) {
          db.createObjectStore('transactions', { keyPath: 'id' });
        }
        // Single store for miscellaneous metadata (budgets, categories)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      };
      request.onsuccess = (event) => {
        const db = event.target.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };
      request.onerror = (event) => {
        dbPromise = null;
        reject(event.target.error);
      };
    });
  }
  return dbPromise;
}

// ---------- Transactions ----------
export async function getAllTransactions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function addTransaction(transaction) {
  const db = await openDB();
  // Ensure an ID exists (IndexedDB will auto‑generate if omitted, but we keep same format)
  if (!transaction.id) {
    transaction.id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.add(transaction);
    tx.oncomplete = () => resolve(transaction);
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error);
  });
}

export async function updateTransaction(transaction) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.put(transaction);
    tx.oncomplete = () => resolve(transaction);
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error);
  });
}

export async function deleteTransactionDB(id) {
  if (id === undefined || id === null) return;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.delete(id);
    if (typeof id === 'string' && /^\d+$/.test(id)) {
      store.delete(Number(id));
    } else if (typeof id === 'number') {
      store.delete(String(id));
    }
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error);
  });
}

export async function replaceTransactions(transactions) {
  const db = await openDB();

  await new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error);
  });

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return;
  }

  await new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');

    tx.oncomplete = () => resolve();
    tx.onerror = (event) => reject(event.target.error);
    tx.onabort = (event) => reject(event.target.error);

    transactions.forEach((transaction) => {
      const record = { ...transaction };
      if (!record.id) {
        record.id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      }
      if (record.amount !== undefined) {
        record.amount = Number(record.amount) || 0;
      }
      store.put(record);
    });
  });
}

// ---------- Budgets (metadata) ----------
export async function getAllBudgets() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const request = store.get('budgets');
    request.onsuccess = () => resolve(request.result || {});
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function setBudgets(budgets) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put(budgets, 'budgets');
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error);
  });
}

// ---------- Categories (metadata) ----------
export async function getAllCategories() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const request = store.get('categories');
    request.onsuccess = () => {
      const defaultCategories = [
        'Comida & Bebida',
        'Vivienda & Renta',
        'Servicios (Luz, Internet, etc.)',
        'Transporte & Gasolina',
        'Salud & Médico',
        'Entretenimiento & Ocio',
        'Suscripciones',
        'Educación',
        'Ingresos (Sueldo/Ventas)',
        'Otros',
      ];
      resolve((Array.isArray(request.result) && request.result.length > 0) ? request.result : defaultCategories);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function setCategories(categories) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put(categories, 'categories');
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error);
  });
}

// ---------- Snapshots (metadata) ----------
export async function getSnapshots() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const request = store.get('snapshots');
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveSnapshots(snapshots) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('metadata', 'readwrite');
    const store = tx.objectStore('metadata');
    store.put(snapshots, 'snapshots');
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
    tx.onabort = (e) => reject(e.target.error);
  });
}

export async function createAutoSnapshot() {
  try {
    const transactions = await getAllTransactions();
    const budgets = await getAllBudgets();
    const categories = await getAllCategories();
    
    const snapshots = await getSnapshots();
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    const newSnapshot = {
      id: `snap_${Date.now()}`,
      timestamp: Date.now(),
      date: todayStr,
      transactionsCount: transactions.length,
      data: {
        transactions,
        budgets,
        categories
      }
    };
    
    // Refresh today's snapshot so it always reflects the latest local state.
    const updatedSnapshots = [newSnapshot, ...snapshots.filter(s => s.date !== todayStr)].slice(0, 10);
    await saveSnapshots(updatedSnapshots);
  } catch (error) {
    console.error('Failed to create automatic snapshot:', error);
  }
}

export async function restoreFromSnapshot(snapshotId) {
  const snapshots = await getSnapshots();
  const snapshot = snapshots.find(s => s.id === snapshotId);
  if (!snapshot) {
    throw new Error('Snapshot no encontrado.');
  }

  // 1. Restore transactions
  await replaceTransactions(snapshot.data.transactions || []);

  // 2. Restore budgets and categories
  await setBudgets(snapshot.data.budgets || {});
  await setCategories(snapshot.data.categories || []);
  
  return snapshot;
}

// Export helpers for convenience
export const dbHelpers = {
  getAllTransactions,
  addTransaction,
  updateTransaction,
  deleteTransactionDB,
  replaceTransactions,
  getAllBudgets,
  setBudgets,
  getAllCategories,
  setCategories,
  getSnapshots,
  saveSnapshots,
  createAutoSnapshot,
  restoreFromSnapshot
};
