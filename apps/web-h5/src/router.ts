import { createRouter, createWebHistory } from 'vue-router';

import { bootstrapSession } from '@/lib/api';
import { sessionState } from '@/lib/session';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/',
      redirect: '/products',
    },
    {
      path: '/products',
      component: () => import('@/pages/ProductListPage.vue'),
      meta: { title: '商品列表' },
    },
    {
      path: '/product/:id',
      component: () => import('@/pages/ProductDetailPage.vue'),
      meta: { title: '商品详情' },
    },
    {
      path: '/cart',
      component: () => import('@/pages/CartPage.vue'),
      meta: { title: '购物车' },
    },
    {
      path: '/checkout',
      component: () => import('@/pages/CheckoutPage.vue'),
      meta: { title: '提交订单' },
    },
    {
      path: '/orders',
      component: () => import('@/pages/OrdersPage.vue'),
      meta: { title: '我的订单' },
    },
    {
      path: '/orders/:id/pay',
      component: () => import('@/pages/OrderPayPage.vue'),
      meta: { title: '上传付款凭证' },
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.meta.public) {
    return true;
  }
  if (!sessionState.token) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    };
  }
  if (!sessionState.user) {
    try {
      await bootstrapSession();
    } catch {
      return {
        path: '/login',
        query: {
          redirect: to.fullPath,
        },
      };
    }
  }
  return true;
});

export default router;
