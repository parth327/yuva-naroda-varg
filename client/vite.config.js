import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Builds into ../public-react (kept separate from the existing Express
// public/ folder so legacy EJS asset URLs never collide with the new app).
// In dev, Vite proxies /api and the legacy server-only routes (/qr, /view,
// /photo, /admin) straight through to Express on :3000 - same-origin from
// the browser's point of view via the Vite dev server, so cookies/session
// auth work without any CORS configuration.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public-react',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/qr': 'http://localhost:3000',
      '/photo': 'http://localhost:3000',
    },
  },
});
