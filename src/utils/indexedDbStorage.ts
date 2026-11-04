import { CleanReferralRecord } from '../types/referral';

const DB_NAME = 'AlMulkMarketIntelligenceDB';
const DB_VERSION = 2;
const STORE_NAME = 'referral_records';
const MEDIA_STORE = 'welcome_media';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB tidak didukung di browser ini.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(MEDIA_STORE)) {
        db.createObjectStore(MEDIA_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRecordsToIndexedDB(records: CleanReferralRecord[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // Clear old records
    store.clear();

    // Insert new records in batches
    for (const record of records) {
      store.put(record);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Gagal menyimpan ke IndexedDB:', err);
  }
}

export async function loadRecordsFromIndexedDB(): Promise<CleanReferralRecord[] | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const records = request.result as CleanReferralRecord[];
        if (records && records.length > 0) {
          resolve(records);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Gagal membaca dari IndexedDB:', err);
    return null;
  }
}

export async function clearRecordsFromIndexedDB(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (err) {
    console.warn('Gagal membersihkan IndexedDB:', err);
  }
}

// Media storage helpers for custom Welcome Screen assets (videos, photos, logos)
export async function saveMediaToIndexedDB(key: string, data: Blob | string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(MEDIA_STORE, 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    store.put(data, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn(`Gagal menyimpan media ${key} ke IndexedDB:`, err);
  }
}

export async function loadMediaFromIndexedDB(key: string): Promise<Blob | string | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(MEDIA_STORE, 'readonly');
    const store = tx.objectStore(MEDIA_STORE);
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn(`Gagal memuat media ${key} dari IndexedDB:`, err);
    return null;
  }
}

export async function deleteMediaFromIndexedDB(key: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(MEDIA_STORE, 'readwrite');
    const store = tx.objectStore(MEDIA_STORE);
    store.delete(key);
  } catch (err) {
    console.warn(`Gagal menghapus media ${key} dari IndexedDB:`, err);
  }
}
