import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served at the domain root. VITE_BASE_PATH exists only so the same build
// pipeline can host it under a path if that ever changes.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      '/api': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      '/cdn': {
        target: 'http://localhost:5006',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:5006',
        changeOrigin: true
      }
    }
  }
});
