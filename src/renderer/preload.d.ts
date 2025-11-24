export {};

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send: (channel: string, data: any) => void;
        on: (channel: string, func: (...args: unknown[]) => void) => void;
        once: (channel: string, func: (...args: unknown[]) => void) => void;
      };
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<boolean>;
        delete: (key: string) => Promise<boolean>;
      };
      getServerPort: () => Promise<number>;
    };
  }
}