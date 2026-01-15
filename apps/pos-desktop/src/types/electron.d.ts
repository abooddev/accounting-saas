// Type definitions for Electron API exposed via preload script

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
  message?: string;
}

export interface PrinterInfo {
  name: string;
  displayName: string;
  isDefault: boolean;
}

export interface ElectronAPI {
  // App info
  getAppVersion: () => Promise<string>;
  getPlatform: () => string;

  // Hardware integration
  printer: {
    print: (receiptData: PrintReceiptData) => Promise<PrintResult>;
    getPrinters: () => Promise<PrinterInfo[]>;
    openCashDrawer: () => Promise<boolean>;
  };

  scanner: {
    onScan: (callback: (barcode: string) => void) => void;
    removeListener: () => void;
  };

  // Storage
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

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
