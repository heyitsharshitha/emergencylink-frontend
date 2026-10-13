import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server on 5173 (matches the backend's default CORS origins).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.js'], css: false },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom', 'react-router-dom'], charts: ['recharts'], markdown: ['react-markdown'] } } },
  },
});
