<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';

import { logout } from '@/lib/api';
import { sessionState } from '@/lib/session';

const route = useRoute();
const router = useRouter();

const title = computed(() => `${route.meta.title || 'BizPort 客户商城'}`);
const showNav = computed(() => route.path !== '/login');

const navItems = [
  { label: '商品', to: '/products' },
  { label: '购物车', to: '/cart' },
  { label: '订单', to: '/orders' },
];

async function handleLogout() {
  await logout();
  await router.replace('/login');
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div>
        <div class="app-title">{{ title }}</div>
        <div v-if="sessionState.user?.username" class="app-subtitle">
          {{ sessionState.user.username }}
        </div>
      </div>
      <button v-if="showNav" class="ghost-btn" @click="handleLogout">
        退出
      </button>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <nav v-if="showNav" class="bottom-nav">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        class="bottom-nav__item"
        :class="[route.path.startsWith(item.to) ? 'is-active' : '']"
        :to="item.to"
      >
        {{ item.label }}
      </RouterLink>
    </nav>
  </div>
</template>
