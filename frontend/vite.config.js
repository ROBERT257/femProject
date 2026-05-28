import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/health': 'http://localhost:8080',
      '/rehab-plans': 'http://localhost:8080',
      '/rehab-exercises': 'http://localhost:8080'
    }
  }
});
