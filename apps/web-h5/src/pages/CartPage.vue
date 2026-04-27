<script setup lang="ts">
import type { CartItem } from '@/lib/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  formatSpec,
  getCartList,
  removeCartItem,
  updateCartQuantity,
} from '@/lib/api';

const router = useRouter();
const loading = ref(false);
const items = ref<CartItem[]>([]);
const errorText = ref('');

const totalAmount = computed(() =>
  items.value.reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
);

async function loadCart() {
  loading.value = true;
  errorText.value = '';
  try {
    const res = await getCartList();
    items.value = res.list || [];
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '购物车加载失败';
  } finally {
    loading.value = false;
  }
}

async function changeQuantity(item: CartItem, delta: number) {
  const nextQuantity = Math.max(1, Number(item.quantity || 0) + delta);
  await updateCartQuantity(item.id, nextQuantity);
  await loadCart();
}

async function removeItem(item: CartItem) {
  await removeCartItem(item.id);
  await loadCart();
}

onMounted(loadCart);
</script>

<template>
  <div class="stack">
    <section class="page-card">
      <div class="row">
        <div>
          <div class="badge">购物车</div>
          <h2 class="section-title" style="margin-top: 12px">待结算商品</h2>
        </div>
        <button class="ghost-btn" @click="router.push('/products')">
          继续逛逛
        </button>
      </div>
    </section>

    <section v-if="loading" class="empty-state">购物车加载中...</section>
    <section v-else-if="errorText" class="empty-state">{{ errorText }}</section>
    <section v-else-if="items.length === 0" class="empty-state">
      购物车是空的，先去挑选商品。
    </section>
    <section v-else class="cart-grid">
      <article v-for="item in items" :key="item.id" class="cart-card">
        <div class="cart-card__body stack">
          <div class="row">
            <strong>{{ item.productName || '-' }}</strong>
            <span class="badge muted">{{ item.skuCode || '-' }}</span>
          </div>
          <div class="subtle-text">
            {{ formatSpec(item.specification) || '默认规格' }}
          </div>
          <div class="row">
            <span>单价 ￥{{ Number(item.price || 0).toFixed(2) }}</span>
            <strong>小计 ￥{{ Number(item.subtotal || 0).toFixed(2) }}</strong>
          </div>
          <div class="row">
            <div class="qty-box">
              <button @click="changeQuantity(item, -1)">-</button>
              <strong>{{ item.quantity || 0 }}</strong>
              <button @click="changeQuantity(item, 1)">+</button>
            </div>
            <button class="danger-btn" @click="removeItem(item)">移除</button>
          </div>
        </div>
      </article>
      <section class="page-card stack">
        <div class="meta-row">
          <span>合计</span>
          <strong>￥{{ totalAmount.toFixed(2) }}</strong>
        </div>
        <button class="primary-btn" @click="router.push('/checkout')">
          去提交订单
        </button>
      </section>
    </section>
  </div>
</template>
