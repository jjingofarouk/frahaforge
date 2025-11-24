import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Only use IPC if electron is available
if (window.electron?.ipcRenderer) {
  window.electron.ipcRenderer.once('ipc-example', (arg: any) => {
    console.log('[IPC Reply]:', arg);
  });
  window.electron.ipcRenderer.send('ipc-example', ['ping']);
}

console.log(
  '👋 FrahaPharmacy App is being loaded by "renderer.ts", included via Vite',
);