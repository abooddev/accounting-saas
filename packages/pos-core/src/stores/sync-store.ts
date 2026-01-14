import { create } from 'zustand';
import type { SyncStatus, SyncQueueItem } from '../types';

interface SyncState {
  status: SyncStatus;
  queue: SyncQueueItem[];

  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSync: (date: Date) => void;
  addToQueue: (item: Omit<SyncQueueItem, 'id' | 'attempts' | 'lastAttempt' | 'status' | 'error' | 'createdAt'>) => void;
  removeFromQueue: (id: string) => void;
  updateQueueItem: (id: string, updates: Partial<SyncQueueItem>) => void;
  getQueueStats: () => { pending: number; failed: number };
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: {
    isOnline: true,
    lastSync: null,
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
  },
  queue: [],

  setOnline: (isOnline) => {
    set((state) => ({
      status: { ...state.status, isOnline },
    }));
  },

  setSyncing: (isSyncing) => {
    set((state) => ({
      status: { ...state.status, isSyncing },
    }));
  },

  setLastSync: (date) => {
    set((state) => ({
      status: { ...state.status, lastSync: date },
    }));
  },

  addToQueue: (item) => {
    const newItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      attempts: 0,
      lastAttempt: null,
      status: 'pending',
      error: null,
      createdAt: new Date(),
    };

    set((state) => {
      const newQueue = [...state.queue, newItem];
      return {
        queue: newQueue,
        status: {
          ...state.status,
          pendingCount: newQueue.filter((i) => i.status === 'pending').length,
          failedCount: newQueue.filter((i) => i.status === 'failed').length,
        },
      };
    });
  },

  removeFromQueue: (id) => {
    set((state) => {
      const newQueue = state.queue.filter((item) => item.id !== id);
      return {
        queue: newQueue,
        status: {
          ...state.status,
          pendingCount: newQueue.filter((i) => i.status === 'pending').length,
          failedCount: newQueue.filter((i) => i.status === 'failed').length,
        },
      };
    });
  },

  updateQueueItem: (id, updates) => {
    set((state) => {
      const newQueue = state.queue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
      return {
        queue: newQueue,
        status: {
          ...state.status,
          pendingCount: newQueue.filter((i) => i.status === 'pending').length,
          failedCount: newQueue.filter((i) => i.status === 'failed').length,
        },
      };
    });
  },

  getQueueStats: () => {
    const queue = get().queue;
    return {
      pending: queue.filter((i) => i.status === 'pending').length,
      failed: queue.filter((i) => i.status === 'failed').length,
    };
  },
}));
