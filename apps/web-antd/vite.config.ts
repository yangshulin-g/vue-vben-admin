import { defineConfig } from '@vben/vite-config';

const BIZPORT_ADMIN_PORT = 5666;
const BIZPORT_BACKEND_TARGET = 'http://localhost:9999';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        host: true,
        port: BIZPORT_ADMIN_PORT,
        strictPort: true,
        proxy: {
          '/api': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
            // BizPort 后端代理目标地址
            target: BIZPORT_BACKEND_TARGET,
            ws: true,
          },
          '/auth/admin': {
            changeOrigin: true,
            target: BIZPORT_BACKEND_TARGET,
            ws: true,
          },
          '/auth/customer': {
            changeOrigin: true,
            target: BIZPORT_BACKEND_TARGET,
            ws: true,
          },
          '/auth/logout': {
            changeOrigin: true,
            target: BIZPORT_BACKEND_TARGET,
            ws: true,
          },
          '/auth/userinfo': {
            changeOrigin: true,
            target: BIZPORT_BACKEND_TARGET,
            ws: true,
          },
          '/auth/menus': {
            changeOrigin: true,
            target: BIZPORT_BACKEND_TARGET,
            ws: true,
          },
          '/uploads': {
            changeOrigin: true,
            target: BIZPORT_BACKEND_TARGET,
            ws: true,
          },
        },
      },
    },
  };
});
