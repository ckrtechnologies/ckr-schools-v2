import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Two production targets share this code:
//   base "/"       -> school subdomain root (vision.ckrschools.online)
//   base "/admin/" -> platform-domain path   (ckrschools.online/admin/)
// deployment/build.sh builds both.
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': 'http://localhost:5006',
      '/cdn': 'http://localhost:5006',
      '/uploads': 'http://localhost:5006'
    }
  }
})
