import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5179,
    host: true,
    proxy: {
      '/api': 'http://localhost:5006',
      '/cdn': 'http://localhost:5006',
      '/uploads': 'http://localhost:5006'
    }
  }
});
