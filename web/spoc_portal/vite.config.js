import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Production is served from /spoc/ on the platform domain, so the build must
// emit /spoc/assets/... URLs. `npm run dev` stays at the root for convenience.
// VITE_BASE_PATH overrides both (used by deployment/build.sh).
export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE_PATH || (command === 'build' ? '/spoc/' : '/'),
  plugins: [react()],
  server: {
    port: 5181,
    host: true,
    proxy: {
      '/api': 'http://localhost:5006',
      '/cdn': 'http://localhost:5006',
      '/uploads': 'http://localhost:5006'
    }
  }
}));
