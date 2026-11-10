import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production is served from /superadmin/ on the platform domain.
// `npm run dev` stays at the root for convenience.
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || (command === 'build' ? '/superadmin/' : '/'),
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5006',
        changeOrigin: true,
        headers: {
          host: 'superadmin.ckrschools.online'
        }
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
}));
