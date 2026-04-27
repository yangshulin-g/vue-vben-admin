<script setup lang="ts">
import type { CartItem } from '@/lib/api';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { createOrder, getCartList } from '@/lib/api';

const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const items = ref<CartItem[]>([]);
const customerRemark = ref('');
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
    errorText.value =
      error instanceof Error ? error.message : '结算数据加载失败';
  } finally {
    loading.value = false;
  }
}

async function submitOrder() {
  if (items.value.length === 0) {
    errorText.value = '购物车为空，无法提交订单';
    return;
  }
  submitting.value = true;
  try {
    await createOrder(
      items.value.map((item) => item.id),
      customerRemark.value || undefined,
    );
    await router.replace('/orders');
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '提交订单失败';
  } finally {
    submitting.value = false;
  }
}

onMounted(loadCart);
</script>

<template>
  <div class="stack">
    <section class="page-card">
      <div class="badge">提交订单</div>
      <h2 class="section-title" style="margin-top: 12px">确认购物车并下单</h2>
      <div class="subtle-text">
        订单提交后会进入订单列表，可继续上传线下付款凭证。
      </div>
    </section>

    <section v-if="loading" class="empty-state">结算数据加载中...</section>
    <section v-else-if="errorText" class="empty-state">{{ errorText }}</section>
    <section v-else-if="items.length === 0" class="empty-state">
      当前没有待结算商品。
    </section>
    <template v-else>
      <section class="cart-grid">
        <article v-for="item in items" :key="item.id" class="cart-card">
          <div class="cart-card__body">
            <div class="row">
              <strong>{{ item.productName || '-' }}</strong>
              <span>{{ item.skuCode || '-' }}</span>
            </div>
            <div class="subtle-text">数量 {{ item.quantity || 0 }}</div>
            <div class="row" style="margin-top: 10px">
              <span>单价 ￥{{ Number(item.price || 0).toFixed(2) }}</span>
              <strong>￥{{ Number(item.subtotal || 0).toFixed(2) }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="page-card stack">
        <div>
          <label class="field-label">客户备注</label>
          <textarea
            v-model="customerRemark"
            class="textarea"
            placeholder="例如：请尽快安排发货"
          ></textarea>
        </div>
        <div class="meta-row">
          <span>订单金额</span>
          <strong>￥{{ totalAmount.toFixed(2) }}</strong>
        </div>
        <button :disabled="submitting" class="primary-btn" @click="submitOrder">
          {{ submitting ? '提交中...' : '提交订单' }}
        </button>
      </section>
    </template>
  </div>
</template>
