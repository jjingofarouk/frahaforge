import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Store operations with proper error handling
const store = {
  get: (key: string): Promise<any> => {
    return ipcRenderer.invoke('store-get', key);
  },
  set: (key: string, value: any): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('store-set', key, value);
  },
  delete: (key: string): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('store-delete', key);
  },
  clear: (): Promise<{ success: boolean; error?: string }> => {
    return ipcRenderer.invoke('store-clear');
  }
};

// IPC Renderer with all necessary methods
const ipcRendererMethods = {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: any[]) => func(...args);
    ipcRenderer.on(channel, subscription);
    
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  once: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.once(channel, (_event, ...args) => func(...args));
  },
  invoke: (channel: string, data: any) => {
    return ipcRenderer.invoke(channel, data);
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

// App functionality (file operations, window management, etc.)
const appAPI = {
  // App lifecycle
  reloadApp: () => ipcRenderer.send('app-reload'),
  minimizeApp: () => ipcRenderer.send('minimize-app'),
  maximizeApp: () => ipcRenderer.send('maximize-app'),
  closeApp: () => ipcRenderer.send('close-app'),
  
  // File operations
  uploadProductImage: (data: any) => ipcRenderer.invoke('upload-product-image', data),
  downloadProductImage: (product: any) => ipcRenderer.invoke('download-product-image', product),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFile: (options?: any) => ipcRenderer.invoke('select-file', options),
  
  // Print operations
  print: (options: any) => ipcRenderer.invoke('print', options),
  
  // System information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Network and backend discovery
  getNetworkInfo: () => ipcRenderer.invoke('get-network-info'),
  checkBackendHealth: (backendUrl?: string) => ipcRenderer.invoke('check-backend-health', backendUrl),
  discoverBackendServers: () => ipcRenderer.invoke('discover-backend-servers')
};

// Backend API utilities (for React components to call backend)
const backendAPI = {
  // FIXED: Direct URL - no store dependency
  fetch: async (endpoint: string, options: RequestInit = {}) => {
    try {
      // FIXED: Direct URL - no store lookup
      const backendUrl = 'http://192.168.1.3:3001';
      
      const response = await fetch(`${backendUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Backend API call failed:', error);
      throw error;
    }
  },
  
  // Convenience methods for common operations
  get: (endpoint: string) => backendAPI.fetch(endpoint),
  post: (endpoint: string, data: any) => 
    backendAPI.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any) => 
    backendAPI.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => 
    backendAPI.fetch(endpoint, { method: 'DELETE' }),
    
  // FIXED: Simple URL getter
  getBackendUrl: () => 'http://192.168.1.3:3001'
};

// Expose to renderer
contextBridge.exposeInMainWorld('electron', {
  store,
  ipcRenderer: ipcRendererMethods,
  app: appAPI,
  backend: backendAPI
});