import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import fs from 'fs-extra';
import os from 'os';

let mainWindow: BrowserWindow | null;
let store: any = null;
let isShuttingDown = false;

// Safe console wrapper to prevent EIO errors
const safeConsole = {
  log: (...args: any[]) => {
    if (isShuttingDown) return;
    try {
      console.log(...args);
    } catch (error: any) {
      if (error.code !== 'EIO') {
        throw error;
      }
      // Silently ignore EIO errors during shutdown
    }
  },
  error: (...args: any[]) => {
    if (isShuttingDown) return;
    try {
      console.error(...args);
    } catch (error: any) {
      if (error.code !== 'EIO') {
        throw error;
      }
    }
  },
  warn: (...args: any[]) => {
    if (isShuttingDown) return;
    try {
      console.warn(...args);
    } catch (error: any) {
      if (error.code !== 'EIO') {
        throw error;
      }
    }
  }
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Initialize electron-store with dynamic import
async function initializeStore() {
  try {
    const StoreModule = await import('electron-store');
    const Store = StoreModule.default;
    store = new Store();
    safeConsole.log('📦 Electron store initialized successfully');
    safeConsole.log('📂 Store location:', store.path);
    return store;
  } catch (error) {
    safeConsole.error('❌ Failed to initialize electron-store:', error);
    throw error;
  }
}

// Get store instance (initializes if needed)
async function getStore() {
  if (!store) {
    await initializeStore();
  }
  return store;
}

// Get local network IP for backend discovery
function getLocalNetworkIP(): string {
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'localhost';
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const iface = networkInterfaces[interfaceName];
    if (iface) {
      iface.forEach((ifaceInfo) => {
        if (ifaceInfo.family === 'IPv4' && !ifaceInfo.internal) {
          localIp = ifaceInfo.address;
        }
      });
    }
  });
  
  return localIp;
}

const createWindow = async () => {
  // Initialize store first
  await initializeStore();

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    icon: path.join(process.cwd(), 'assets', 'icon.png'),
    fullscreen: true,
    title: 'FrahaPharmacy POS',
  });

  // Load the app - using Vite's development server or built files
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    // Open the DevTools in development
   // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log network information
  const localIp = getLocalNetworkIP();
  safeConsole.log('🚀 FrahaPharmacy POS - Electron Frontend');
  safeConsole.log('═'.repeat(50));
  safeConsole.log(`📍 Local Backend: http://localhost:3000`);
  safeConsole.log(`🌐 Network Backend: http://${localIp}:3000`);
  safeConsole.log(`💡 Make sure backend server is running on the server computer`);
  safeConsole.log('═'.repeat(50));
};
// ===== ELECTRON-STORE IPC HANDLERS =====
ipcMain.handle('store-get', async (event, key) => {
  try {
    const storeInstance = await getStore();
    const value = storeInstance.get(key);
    safeConsole.log(`📦 Main: Store GET ${key}`);
    return value;
  } catch (error) {
    safeConsole.error(`❌ Main: Store GET error for ${key}:`, error);
    return null;
  }
});

ipcMain.handle('store-set', async (event, key, value) => {
  try {
    const storeInstance = await getStore();
    storeInstance.set(key, value);
    safeConsole.log(`💾 Main: Store SET ${key}`);
    return { success: true };
  } catch (error) {
    safeConsole.error(`❌ Main: Store SET error for ${key}:`, error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('store-delete', async (event, key) => {
  try {
    const storeInstance = await getStore();
    storeInstance.delete(key);
    safeConsole.log(`🗑️ Main: Store DELETE ${key}`);
    return { success: true };
  } catch (error) {
    safeConsole.error(`❌ Main: Store DELETE error for ${key}:`, error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('store-clear', async (event) => {
  try {
    const storeInstance = await getStore();
    storeInstance.clear();
    safeConsole.log('🧹 Main: Store CLEARED');
    return { success: true };
  } catch (error) {
    safeConsole.error('❌ Main: Store CLEAR error:', error);
    return { success: false, error: String(error) };
  }
});

// ===== NETWORK & BACKEND IPC HANDLERS =====
ipcMain.handle('get-network-info', async (event) => {
  try {
    const localIp = getLocalNetworkIP();
    return { 
      localIp,
      platform: process.platform,
      hostname: os.hostname(),
      backendURLs: [
        `http://localhost:3000`,
        `http://127.0.0.1:3000`, 
        `http://${localIp}:3000`
      ]
    };
  } catch (error) {
    safeConsole.error('❌ Network info retrieval failed:', error);
    return { error: 'Failed to get network information' };
  }
});

ipcMain.handle('check-backend-health', async (event, backendUrl = 'http://localhost:3000') => {
  try {
    const response = await fetch(`${backendUrl}/api/health`);
    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        data,
        backendUrl 
      };
    } else {
      return { 
        success: false, 
        error: 'Backend not responding',
        backendUrl
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Backend server not running at ${backendUrl}. Please ensure the server computer is running the backend.`,
      backendUrl
    };
  }
});

ipcMain.handle('discover-backend-servers', async (event) => {
  try {
    const localIp = getLocalNetworkIP();
    const baseIP = localIp.substring(0, localIp.lastIndexOf('.') + 1);
    const servers = [];
    
    // Check common backend URLs
    const urlsToCheck = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      `http://${localIp}:3000`,
    ];
    
    // Also check other common server IPs in the network
    for (let i = 1; i <= 10; i++) {
      urlsToCheck.push(`http://${baseIP}${i}:3000`);
    }
    
    // Test each URL
    for (const url of urlsToCheck) {
      try {
        // Use AbortController to implement a timeout since fetch RequestInit doesn't support 'timeout'
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const response = await fetch(`${url}/api/health`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          servers.push({
            url,
            name: data.service || 'FrahaPharmacy Server',
            status: 'online',
            version: data.version || 'unknown'
          });
        }
      } catch (error) {
        // URL failed, continue to next
      }
    }
    
    return { success: true, servers };
  } catch (error) {
    safeConsole.error('❌ Backend discovery failed:', error);
    return { success: false, error: 'Backend discovery failed', servers: [] };
  }
});

// ===== APP RELOAD HANDLER =====
ipcMain.on('app-reload', (event, data) => {
  safeConsole.log('🔄 App reload requested');
  if (mainWindow) {
    mainWindow.reload();
  }
});

// ===== PRODUCT IMAGE HANDLERS =====
ipcMain.handle('upload-product-image', async (event, { filePath, fileName, productId, productName }) => {
  try {
    // Use app.getPath('userData') for proper asset storage
    const assetsDir = path.join(app.getPath('userData'), 'assets', 'product-images');
    await fs.ensureDir(assetsDir);
    
    const destinationPath = path.join(assetsDir, fileName);
    
    safeConsole.log('📤 Uploading image:', {
      source: filePath,
      destination: destinationPath,
      fileName: fileName,
      productId: productId,
      productName: productName
    });
    
    await fs.copyFile(filePath, destinationPath);
    
    safeConsole.log(`✅ Image uploaded successfully: ${fileName}`);
    
    return { 
      success: true, 
      filePath: destinationPath,
      fileName: fileName
    };
  } catch (error) {
    safeConsole.error('❌ Image upload failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('download-product-image', async (event, product) => {
  try {
    safeConsole.log('📥 Downloading image for product:', product);
    return { success: true, message: 'Download initiated' };
  } catch (error) {
    safeConsole.error('❌ Download failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// ===== FILE SYSTEM OPERATIONS =====
ipcMain.handle('select-directory', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory']
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false, canceled: true };
  } catch (error) {
    safeConsole.error('❌ Directory selection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('select-file', async (event, options = {}) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      ...options
    });
    
    if (!result.canceled && result.filePaths.length > 0) {
      return { success: true, path: result.filePaths[0] };
    }
    return { success: false, canceled: true };
  } catch (error) {
    safeConsole.error('❌ File selection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// ===== APPLICATION LIFECYCLE =====
ipcMain.on('minimize-app', (event) => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-app', (event) => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

// FIXED: Simple close handler - no graceful shutdown blocking
ipcMain.on('close-app', (event) => {
  safeConsole.log('🛑 Close app requested via IPC');
  if (mainWindow) {
    mainWindow.close();
  } else {
    // If no main window, quit the app
    app.quit();
  }
});

// ===== PRINT OPERATIONS =====
ipcMain.handle('print', async (event, options: any) => {
  try {
    safeConsole.log('🖨️ Print operation requested');
    if (mainWindow) {
      mainWindow.webContents.print(options, (success, errorType) => {
        if (!success) {
          safeConsole.error('❌ Print failed:', errorType);
        }
      });
    }
    return { success: true };
  } catch (error) {
    safeConsole.error('❌ Print operation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// ===== SYSTEM INFORMATION =====
ipcMain.handle('get-system-info', async (event) => {
  try {
    const os = await import('os');
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.getSystemVersion ? process.getSystemVersion() : 'unknown',
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      hostname: os.hostname()
    };
  } catch (error) {
    safeConsole.error('❌ System info retrieval failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// FIXED: Simplified shutdown handlers - no blocking
app.on('before-quit', (event) => {
  safeConsole.log('🛑 App is quitting...');
  isShuttingDown = true;
  // Allow the quit to proceed normally
});

app.on('window-all-closed', () => {
  safeConsole.log('🛑 All windows closed');
  // On macOS, keep app running even when all windows are closed
  if (process.platform !== 'darwin') {
    isShuttingDown = true;
    app.quit();
  }
});

// Handle process signals
process.on('SIGTERM', () => {
  safeConsole.log('🛑 Received SIGTERM, shutting down...');
  isShuttingDown = true;
  app.quit();
});

process.on('SIGINT', () => {
  safeConsole.log('🛑 Received SIGINT, shutting down...');
  isShuttingDown = true;
  app.quit();
});

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
  if (error.message.includes('EIO')) {
    // Ignore EIO errors during shutdown
    return;
  }
  safeConsole.error('💥 Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  safeConsole.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

// ===== APP LIFECYCLE =====
app.whenReady().then(async () => {
  safeConsole.log('🚀 FrahaPharmacy POS - Starting Electron Frontend');
  
  try {
    // Create the window (NO backend startup here)
    await createWindow();
    safeConsole.log('✅ Electron window created successfully');
    safeConsole.log('💡 Backend Server Requirements:');
    safeConsole.log('   - Run on server computer: cd fraha-backend && npm run dev');
    safeConsole.log('   - Ensure server computer and POS computers are on same network');
    safeConsole.log('   - Backend will be automatically discovered');
    
  } catch (error) {
    safeConsole.error('❌ Failed to start Electron app:', error);
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && !isShuttingDown) {
    createWindow();
  }
});