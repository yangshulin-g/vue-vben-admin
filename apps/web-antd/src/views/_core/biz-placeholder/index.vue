<script lang="ts" setup>
import { useRoute } from 'vue-router';

defineOptions({ name: 'BizPlaceholderPage' });

const route = useRoute();
</script>

<template>
  <div class="p-5">
    <h2 class="text-xl">{{ route.meta?.title || '业务页面' }}</h2>
    <p class="mt-2 text-sm opacity-70">
      该菜单页面已接入路由，当前为占位页。下一步会替换为真实业务功能。
    </p>
    <p class="mt-2 text-xs opacity-60">当前路径：{{ route.path }}</p>
  </div>
</template>
