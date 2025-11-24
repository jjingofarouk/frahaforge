// src/renderer/electron.d.ts
export interface ElectronAPI {
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    delete: (key: string) => Promise<{ success: boolean; error?: string }>;
    clear: () => Promise<{ success: boolean; error?: string }>;
  };
  ipcRenderer: {
    send: (channel: string, data: any) => void;
    on: (channel: string, func: (...args: any[]) => void) => () => void;
    once: (channel: string, func: (...args: any[]) => void) => void;
    invoke: (channel: string, data: any) => Promise<any>;
    removeAllListeners: (channel: string) => void;
  };
  app: {
    reloadApp: () => void;
    minimizeApp: () => void;
    maximizeApp: () => void;
    closeApp: () => void;
    uploadProductImage: (data: any) => Promise<any>;
    downloadProductImage: (product: any) => Promise<any>;
    selectDirectory: () => Promise<any>;
    selectFile: (options?: any) => Promise<any>;
    print: (options: any) => Promise<any>;
    getSystemInfo: () => Promise<any>;
    getNetworkInfo: () => Promise<any>;
    checkBackendHealth: (backendUrl?: string) => Promise<any>;
    discoverBackendServers: () => Promise<any>;
  };
  backend: {
    fetch: (endpoint: string, options?: RequestInit) => Promise<any>;
    get: (endpoint: string) => Promise<any>;
    post: (endpoint: string, data: any) => Promise<any>;
    put: (endpoint: string, data: any) => Promise<any>;
    delete: (endpoint: string) => Promise<any>;
    setBackendUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
    getBackendUrl: () => Promise<string>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}