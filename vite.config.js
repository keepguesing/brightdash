import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react({ jsxRuntime: 'classic' })],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
  },
});