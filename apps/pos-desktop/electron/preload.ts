import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface exposed to renderer
export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;
  getPlatform: () => string;

  // Hardware integration placeholders
  printer: {
    print: (receiptData: PrintReceiptData) => Promise<PrintResult>;
    getPrinters: () => Promise<PrinterInfo[]>;
    openCashDrawer: () => Promise<boolean>;
  };

  scanner: {
    onScan: (callback: (barcode: string) => void) => void;
    removeListener: () => void;
  };

  // Storage (for offline data persistence)
  storage: {
    get: (key: string) => Promise<string | null>;
    set: (key: string, value: string) => Promise<void>;
    remove: (key: string) => Promise<void>;
  };

  // Network status
  network: {
    isOnline: () => boolean;
    onStatusChange: (callback: (isOnline: boolean) => void) => void;
    removeStatusListener: () => void;
  };

  // Window controls
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
  };
}

// Type definitions for printer
export interface PrintReceiptData {
  header?: string;
  lines: Array<{
    text: string;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    size?: 'normal' | 'large';
  }>;
  footer?: string;
  openDrawer?: boolean;
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
}

// Expose safe APIs to renderer through context bridge
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => process.platform,

  // Hardware integration (placeholders - to be implemented)
  printer: {
    print: (receiptData: PrintReceiptData) =>
      ipcRenderer.invoke('printer:print', receiptData),
    getPrinters: () =>
      ipcRenderer.invoke('printer:getPrinters'),
    openCashDrawer: () =>
      ipcRenderer.invoke('printer:openCashDrawer'),
  },

  scanner: {
    onScan: (callback: (barcode: string) => void) => {
      ipcRenderer.on('scanner:barcode', (_, barcode) => callback(barcode));
    },
    removeListener: () => {
      ipcRenderer.removeAllListeners('scanner:barcode');
    },
  },

  // Storage APIs
  storage: {
    get: (key: string) => ipcRenderer.invoke('storage:get', key),
    set: (key: string, value: string) => ipcRenderer.invoke('storage:set', key, value),
    remove: (key: string) => ipcRenderer.invoke('storage:remove', key),
  },

  // Network status
  network: {
    isOnline: () => navigator.onLine,
    onStatusChange: (callback: (isOnline: boolean) => void) => {
      const handleOnline = () => callback(true);
      const handleOffline = () => callback(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      // Store handlers for cleanup
      (window as any).__networkHandlers = { handleOnline, handleOffline };
    },
    removeStatusListener: () => {
      const handlers = (window as any).__networkHandlers;
      if (handlers) {
        window.removeEventListener('online', handlers.handleOnline);
        window.removeEventListener('offline', handlers.handleOffline);
        delete (window as any).__networkHandlers;
      }
    },
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },
} as ElectronAPI);

// Augment the Window interface
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
