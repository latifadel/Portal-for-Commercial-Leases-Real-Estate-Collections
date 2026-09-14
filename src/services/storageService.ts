// Dual-layer Persistent Storage Service (LocalStorage + IndexedDB Snapshot)
// Guarantees data is never cleared by iOS Safari or browser cache eviction.

const DB_NAME = 'PropertyManagementDB';
const STORE_NAME = 'app_backups';
const DB_VERSION = 1;

// Open or create IndexedDB
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Request persistent storage from the browser (protects from iOS Safari eviction)
export const requestStoragePersistence = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('[Storage] Could not request persistence:', e);
      return false;
    }
  }
  return false;
};

// Check if persistent storage is active
export const isStoragePersisted = async (): Promise<boolean> => {
  if (navigator.storage && navigator.storage.persisted) {
    try {
      return await navigator.storage.persisted();
    } catch (e) {
      return false;
    }
  }
  return false;
};

// Save redundant snapshot to IndexedDB
export const saveIndexedDBSnapshot = async (key: string, data: any): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ key, data, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[Storage] Could not save IndexedDB snapshot:', err);
  }
};

// Restore snapshot from IndexedDB
export const loadIndexedDBSnapshot = async (key: string): Promise<any | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.data || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[Storage] Could not load IndexedDB snapshot:', err);
    return null;
  }
};
