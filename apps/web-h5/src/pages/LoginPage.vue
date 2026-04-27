<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { customerLogin } from '@/lib/api';

const route = useRoute();
const router = useRouter();
const identifier = ref('');
const password = ref('');
const loading = ref(false);
const errorText = ref('');

async function submit() {
  if (!identifier.value || !password.value) {
    errorText.value = '请输入账号和密码';
    return;
  }
  loading.value = true;
  errorText.value = '';
  try {
    await customerLogin(identifier.value.trim(), password.value);
    await router.replace((route.query.redirect as string) || '/products');
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="stack">
    <section class="hero-card">
      <div class="badge">客户侧最小商城</div>
      <h1 class="section-title" style="margin-top: 14px">BizPort 客户登录</h1>
      <p class="subtle-text" style="color: rgb(246 243 234 / 80%)">
        支持手机号或用户名登录。登录后可浏览商品、管理购物车、提交订单并上传线下付款凭证。
      </p>
    </section>

    <section class="page-card">
      <div class="form-grid">
        <div>
          <label class="field-label">手机号 / 用户名</label>
          <input
            v-model="identifier"
            class="input"
            placeholder="请输入手机号或用户名"
            @keyup.enter="submit"
          />
        </div>
        <div>
          <label class="field-label">密码</label>
          <input
            v-model="password"
            class="input"
            placeholder="请输入密码"
            type="password"
            @keyup.enter="submit"
          />
        </div>
        <div v-if="errorText" class="empty-state" style="padding: 12px 14px">
          {{ errorText }}
        </div>
        <button :disabled="loading" class="primary-btn" @click="submit">
          {{ loading ? '登录中...' : '登录并进入商城' }}
        </button>
      </div>
    </section>
  </div>
</template>
