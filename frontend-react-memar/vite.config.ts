import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// المنفذ 3015 (سجل المنافذ) + بروكسي /api إلى Laravel :8010 لتجنّب CORS في التطوير.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3015,
    proxy: {
      '/api': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
    },
  },
});
