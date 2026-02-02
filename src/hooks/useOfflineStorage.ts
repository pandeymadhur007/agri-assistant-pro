import { useState, useEffect, useCallback } from 'react';

// IndexedDB wrapper for offline data storage
const DB_NAME = 'gram-ai-offline';
const DB_VERSION = 1;

interface OfflineStore {
  marketPrices: any[];
  cropCalendar: any[];
  chatHistory: any[];
  scanHistory: any[];
  schemes: any[];
  lastSync: Record<string, number>;
}

const STORES = ['marketPrices', 'cropCalendar', 'chatHistory', 'scanHistory', 'schemes', 'lastSync'];

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      STORES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id', autoIncrement: true });
        }
      });
    };
  });
};

export const useOfflineStorage = <T>(storeName: keyof OfflineStore) => {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      return new Promise<T[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as T[]);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`Failed to load ${storeName}:`, error);
      return [];
    }
  }, [storeName]);

  // Save data to IndexedDB
  const saveData = useCallback(async (items: T[]) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing data
      store.clear();
      
      // Add new data
      items.forEach(item => {
        store.add(item);
      });
      
      // Update last sync time
      const syncTransaction = db.transaction('lastSync', 'readwrite');
      const syncStore = syncTransaction.objectStore('lastSync');
      syncStore.put({ id: storeName, timestamp: Date.now() });
      
      setData(items);
      setLastSynced(new Date());
    } catch (error) {
      console.error(`Failed to save ${storeName}:`, error);
    }
  }, [storeName]);

  // Add single item
  const addItem = useCallback(async (item: T) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.add(item);
      
      setData(prev => [...prev, item]);
    } catch (error) {
      console.error(`Failed to add item to ${storeName}:`, error);
    }
  }, [storeName]);

  // Clear store
  const clearData = useCallback(async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.clear();
      setData([]);
    } catch (error) {
      console.error(`Failed to clear ${storeName}:`, error);
    }
  }, [storeName]);

  // Load on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const loaded = await loadData();
      setData(loaded);
      
      // Get last sync time
      try {
        const db = await openDB();
        const transaction = db.transaction('lastSync', 'readonly');
        const store = transaction.objectStore('lastSync');
        const request = store.get(storeName);
        request.onsuccess = () => {
          if (request.result?.timestamp) {
            setLastSynced(new Date(request.result.timestamp));
          }
        };
      } catch {
        // Ignore sync time errors
      }
      
      setIsLoading(false);
    };
    init();
  }, [loadData, storeName]);

  return {
    data,
    isLoading,
    lastSynced,
    saveData,
    addItem,
    clearData,
    refresh: loadData,
  };
};

// Hook to check online status
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Hook to sync data when coming back online
export const useSyncOnReconnect = (syncFn: () => Promise<void>) => {
  const isOnline = useOnlineStatus();
  const [wasPreviouslyOffline, setWasPreviouslyOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setWasPreviouslyOffline(true);
    } else if (wasPreviouslyOffline) {
      // Coming back online - sync data
      syncFn().catch(console.error);
      setWasPreviouslyOffline(false);
    }
  }, [isOnline, wasPreviouslyOffline, syncFn]);

  return isOnline;
};
