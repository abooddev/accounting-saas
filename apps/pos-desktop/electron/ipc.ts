import { ipcMain, BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Storage directory for persistent data
const getStoragePath = (): string => {
  const userDataPath = app.getPath('userData');
  const storagePath = path.join(userDataPath, 'storage');

  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }

  return storagePath;
};

export function setupIPCHandlers(mainWindow: BrowserWindow): void {
  // App info handlers
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  // Window control handlers
  ipcMain.on('window:minimize', () => {
    mainWindow.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    mainWindow.close();
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow.isMaximized();
  });

  // Storage handlers (simple file-based storage)
  ipcMain.handle('storage:get', async (_, key: string) => {
    try {
      const filePath = path.join(getStoragePath(), `${key}.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data).value;
      }
      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  });

  ipcMain.handle('storage:set', async (_, key: string, value: string) => {
    try {
      const filePath = path.join(getStoragePath(), `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify({ value, timestamp: Date.now() }));
    } catch (error) {
      console.error('Storage set error:', error);
      throw error;
    }
  });

  ipcMain.handle('storage:remove', async (_, key: string) => {
    try {
      const filePath = path.join(getStoragePath(), `${key}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Storage remove error:', error);
      throw error;
    }
  });

  // Printer handlers (placeholders for future implementation)
  ipcMain.handle('printer:print', async (_, receiptData: any) => {
    // TODO: Implement actual printing logic
    // This is a placeholder that will be enhanced with thermal printer support
    console.log('Print requested:', receiptData);

    // For now, return success
    // In production, this would interface with:
    // - ESC/POS printers via serial port or USB
    // - Windows printer API
    // - CUPS on Linux/macOS

    return {
      success: true,
      message: 'Print functionality will be implemented in a future update',
    };
  });

  ipcMain.handle('printer:getPrinters', async () => {
    // TODO: Implement printer enumeration
    // For now, return empty list
    // In production, this would:
    // - List available USB/Serial printers
    // - List network printers
    // - List Windows/CUPS printers

    try {
      // Electron's built-in printer list
      const printers = mainWindow.webContents.getPrintersAsync
        ? await mainWindow.webContents.getPrintersAsync()
        : [];

      return printers.map((printer: any) => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        isDefault: printer.isDefault,
      }));
    } catch (error) {
      console.error('Error getting printers:', error);
      return [];
    }
  });

  ipcMain.handle('printer:openCashDrawer', async () => {
    // TODO: Implement cash drawer control
    // This typically sends ESC/POS command to open drawer
    // Command varies by printer model

    console.log('Cash drawer open requested');

    // Placeholder - would send command like:
    // Buffer.from([0x1B, 0x70, 0x00, 0x19, 0xFA]) for most ESC/POS printers

    return true;
  });

  // Scanner handlers (placeholder for hardware barcode scanner)
  // In production, this would listen to:
  // - USB HID barcode scanners
  // - Serial port scanners
  // - Keyboard wedge scanners (handled by browser)

  // Note: Most barcode scanners work as keyboard wedge devices,
  // so they're handled by the browser's keyboard events.
  // This IPC channel is for advanced scanner integration.
}

// Cleanup IPC handlers when app closes
export function cleanupIPCHandlers(): void {
  ipcMain.removeAllListeners('app:getVersion');
  ipcMain.removeAllListeners('window:minimize');
  ipcMain.removeAllListeners('window:maximize');
  ipcMain.removeAllListeners('window:close');
  ipcMain.removeAllListeners('window:isMaximized');
  ipcMain.removeAllListeners('storage:get');
  ipcMain.removeAllListeners('storage:set');
  ipcMain.removeAllListeners('storage:remove');
  ipcMain.removeAllListeners('printer:print');
  ipcMain.removeAllListeners('printer:getPrinters');
  ipcMain.removeAllListeners('printer:openCashDrawer');
}
