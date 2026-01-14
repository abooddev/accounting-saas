export interface SyncQueueItem {
  id: string;
  entityType: 'sale' | 'session' | 'cash_movement' | 'barcode_link';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: unknown;
  priority: number;
  attempts: number;
  lastAttempt: Date | null;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error: string | null;
  createdAt: Date;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
}

export interface PendingBarcodeLink {
  barcode: string;
  productId: string;
  linkedBy: string;
  linkedAt: Date;
  syncStatus: 'pending' | 'synced';
}
