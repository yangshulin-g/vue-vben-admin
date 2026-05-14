import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5566,
    proxy: {
      '/api': {
        changeOrigin: true,
        target: 'http://localhost:9999',
      },
      '/auth': {
        changeOrigin: true,
        target: 'http://localhost:9999',
      },
      '/uploads': {
        changeOrigin: true,
        target: 'http://localhost:9999',
      },
    },
  },
});
