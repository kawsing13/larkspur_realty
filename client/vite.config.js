import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, the browser only ever talks to the Vite server (5173). Vite proxies
// /api and /health through to the Express server (4000), so there is no CORS
// dance and cookies stay same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/health': 'http://localhost:4000',
    },
  },
});
