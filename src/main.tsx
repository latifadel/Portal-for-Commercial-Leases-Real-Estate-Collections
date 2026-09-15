import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register PWA service worker
if ('serviceWorker' in navigator && ((import.meta as any).env?.PROD || (import.meta as any).env?.MODE === 'production')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
