<script setup lang="ts">
import type { CustomerOrderItem } from '@/lib/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { cancelOrder, confirmReceipt, getOrders } from '@/lib/api';

const router = useRouter();
const loading = ref(false);
const errorText = ref('');
const orders = ref<CustomerOrderItem[]>([]);

const orderStatusTextMap: Record<string, string> = {
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  CREATED: '已创建',
  SHIPPED: '已发货',
};

const paymentStatusTextMap: Record<string, string> = {
  FULLY_PAID: '已付清',
  PARTIALLY_PAID: '部分付款',
  UNPAID: '未付款',
};

async function loadOrders() {
  loading.value = true;
  errorText.value = '';
  try {
    const res = await getOrders();
    orders.value = res.list || [];
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '订单加载失败';
  } finally {
    loading.value = false;
  }
}

async function doCancel(orderId: number) {
  await cancelOrder(orderId);
  await loadOrders();
}

async function doConfirmReceipt(orderId: number) {
  await confirmReceipt(orderId);
  await loadOrders();
}

function showPendingBadge(order: CustomerOrderItem): boolean {
  return Boolean(
    order.hasPendingPayment && order.paymentStatus !== 'FULLY_PAID',
  );
}

onMounted(loadOrders);
</script>

<template>
  <div class="stack">
    <section class="page-card">
      <div class="badge">我的订单</div>
      <h2 class="section-title" style="margin-top: 12px">订单与付款跟踪</h2>
    </section>

    <section v-if="loading" class="empty-state">订单加载中...</section>
    <section v-else-if="errorText" class="empty-state">{{ errorText }}</section>
    <section v-else-if="orders.length === 0" class="empty-state">
      暂无订单记录。
    </section>
    <section v-else class="order-grid">
      <article v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-card__body stack">
          <div class="row">
            <strong>{{ order.orderNo || `订单#${order.id}` }}</strong>
            <span class="badge">{{
              orderStatusTextMap[order.status || ''] || order.status || '-'
            }}</span>
          </div>
          <div class="meta-list">
            <div class="meta-row">
              <span>支付状态</span>
              <strong>{{
                paymentStatusTextMap[order.paymentStatus || ''] ||
                order.paymentStatus ||
                '-'
              }}</strong>
              <template v-if="showPendingBadge(order)">
                <span class="badge pending-badge">凭证待审核</span>
              </template>
            </div>
            <div class="meta-row">
              <span>订单金额</span>
              <strong>￥{{ Number(order.finalAmount || 0).toFixed(2) }}</strong>
            </div>
            <div class="meta-row">
              <span>创建时间</span>
              <strong>{{ order.createdAt || '-' }}</strong>
            </div>
          </div>
          <div class="actions">
            <button
              v-if="
                order.status !== 'CANCELLED' &&
                order.paymentStatus !== 'FULLY_PAID'
              "
              class="primary-btn"
              @click="router.push(`/orders/${order.id}/pay`)"
            >
              上传付款凭证
            </button>
            <button
              v-if="order.status === 'SHIPPED'"
              class="secondary-btn"
              @click="doConfirmReceipt(order.id)"
            >
              确认收货
            </button>
            <button
              v-if="
                order.status === 'CREATED' && order.paymentStatus === 'UNPAID'
              "
              class="danger-btn"
              @click="doCancel(order.id)"
            >
              取消订单
            </button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.pending-badge {
  margin-left: 6px;
  font-size: 12px;
}
</style>
