import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // BizPort 后端代理目标地址
            target: 'http://localhost:9999',
            ws: true,
          },
          '/auth/admin': {
            changeOrigin: true,
            target: 'http://localhost:9999',
            ws: true,
          },
          '/auth/customer': {
            changeOrigin: true,
            target: 'http://localhost:9999',
            ws: true,
          },
          '/auth/logout': {
            changeOrigin: true,
            target: 'http://localhost:9999',
            ws: true,
          },
          '/auth/userinfo': {
            changeOrigin: true,
            target: 'http://localhost:9999',
            ws: true,
          },
          '/auth/menus': {
            changeOrigin: true,
            target: 'http://localhost:9999',
            ws: true,
          },
          '/uploads': {
            changeOrigin: true,
            target: 'http://localhost:9999',
            ws: true,
          },
        },
      },
    },
  };
});
