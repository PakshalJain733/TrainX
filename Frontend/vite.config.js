import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const handleProxyError = (proxy) => {
  proxy.on('error', (err) => {
    if (['ECONNABORTED', 'ECONNRESET', 'EPIPE'].includes(err.code)) return;
    console.error('Proxy error:', err);
  });
  proxy.on('proxyReqWs', (_proxyReq, _req, socket) => {
    socket.on('error', (err) => {
      if (['ECONNABORTED', 'ECONNRESET', 'EPIPE'].includes(err.code)) return;
      console.error('WS Socket error:', err);
    });
  });
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: handleProxyError,
      },
      '/interviews': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: handleProxyError,
      },
    },
  },
})
