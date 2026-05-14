<script lang="ts" setup>
import { computed } from 'vue';

import { AuthPageLayout } from '@vben/layouts';
import { preferences } from '@vben/preferences';

const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const logoDark = computed(() => preferences.logo.sourceDark);
</script>

<template>
  <AuthPageLayout
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    page-description="商品、库存、订单、客户与支付一体化管理"
    page-title="单商家批发订货管理系统"
  >
    <!-- 自定义工具栏 -->
    <!-- <template #toolbar></template> -->
  </AuthPageLayout>
</template>
