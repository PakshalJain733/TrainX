import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/interviews': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');
          if (normalized.includes('node_modules')) {
            if (normalized.includes('/@monaco-editor/')) {
              return 'vendor-monaco';
            }
            if (normalized.includes('/lucide-react/')) {
              return 'vendor-icons';
            }
            if (
              normalized.includes('/node_modules/react/') ||
              normalized.includes('/node_modules/react-dom/') ||
              normalized.includes('/node_modules/react-is/') ||
              normalized.includes('/node_modules/react-router/') ||
              normalized.includes('/node_modules/react-router-dom/') ||
              normalized.includes('/node_modules/scheduler/') ||
              normalized.includes('/node_modules/use-sync-external-store/')
            ) {
              return 'vendor-react';
            }
            if (normalized.includes('/recharts/')) {
              return 'vendor-charts';
            }
            if (
              normalized.includes('/xlsx/') ||
              normalized.includes('/socket.io-client/') ||
              normalized.includes('/qrcode/')
            ) {
              return 'vendor-utils';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
