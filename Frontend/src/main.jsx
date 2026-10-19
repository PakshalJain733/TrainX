import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Auto-recover from stale chunk dynamic import failures on new production deployments
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite chunk preload error detected, reloading page to fetch latest deployment...', event);
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('dynamically imported module') ||
    msg.includes('Failed to load module script') ||
    msg.includes('Expected a JavaScript-or-Wasm module script')
  ) {
    const lastReload = sessionStorage.getItem('chunk_error_reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
      sessionStorage.setItem('chunk_error_reload', String(now));
      window.location.reload();
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
