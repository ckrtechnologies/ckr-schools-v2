import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/teacher-manager/",
  plugins: [react()],
  server: {
    port: 5178,
    host: true,
    proxy: {
      '/api': 'http://localhost:5006',
      '/cdn': 'http://localhost:5006',
      '/uploads': 'http://localhost:5006'
    }
  }
});
