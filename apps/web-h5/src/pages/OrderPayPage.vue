<script setup lang="ts">
import type { OrderDetailRes, ReconciliationRes } from '@/lib/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  getOrderDetail,
  getOrderReconciliation,
  submitOfflinePayment,
  uploadVoucher,
} from '@/lib/api';

const route = useRoute();
const loading = ref(false);
const uploading = ref(false);
const submitting = ref(false);
const detail = ref<null | OrderDetailRes>(null);
const reconciliation = ref<null | ReconciliationRes>(null);
const paymentMethod = ref<'bank_transfer' | 'offline'>('offline');
const amount = ref(0);
const paymentSn = ref('');
const remark = ref('');
const voucherUrl = ref('');
const errorText = ref('');
const successText = ref('');

const orderId = computed(() => Number(route.params.id));
const finalAmountText = computed(() =>
  Number(reconciliation.value?.finalAmount || 0).toFixed(2),
);
const unpaidAmountText = computed(() =>
  Number(reconciliation.value?.unpaidAmount || 0).toFixed(2),
);

async function loadOrder() {
  loading.value = true;
  errorText.value = '';
  try {
    detail.value = await getOrderDetail(orderId.value);
    reconciliation.value = await getOrderReconciliation(orderId.value);
    amount.value = Number(reconciliation.value.unpaidAmount || 0);
  } catch (error) {
    errorText.value =
      error instanceof Error ? error.message : '订单信息加载失败';
  } finally {
    loading.value = false;
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  uploading.value = true;
  errorText.value = '';
  try {
    voucherUrl.value = await uploadVoucher(file);
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '凭证上传失败';
  } finally {
    uploading.value = false;
  }
}

async function submitPayment() {
  if (!voucherUrl.value || !paymentSn.value || !amount.value) {
    errorText.value = '请完整填写支付信息并上传凭证';
    return;
  }
  submitting.value = true;
  errorText.value = '';
  successText.value = '';
  try {
    await submitOfflinePayment(
      orderId.value,
      amount.value,
      paymentMethod.value,
      paymentSn.value,
      voucherUrl.value,
      remark.value || undefined,
    );
    await loadOrder();
    paymentSn.value = '';
    remark.value = '';
    voucherUrl.value = '';
    successText.value = '付款凭证已提交，等待平台审核';
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '提交付款失败';
  } finally {
    submitting.value = false;
  }
}

onMounted(loadOrder);
</script>

<template>
  <div class="stack">
    <section v-if="loading" class="empty-state">订单信息加载中...</section>
    <section v-else-if="errorText" class="empty-state">{{ errorText }}</section>
    <section
      v-if="successText"
      class="empty-state"
      style="color: #52c41a; background: #f6ffed; border-color: #b7eb8f"
    >
      {{ successText }}
    </section>
    <template v-else-if="detail && reconciliation">
      <section class="page-card stack">
        <div class="badge">上传线下付款凭证</div>
        <h2 class="section-title">
          {{ detail.orderNo || `订单#${detail.id}` }}
        </h2>
        <div class="meta-list">
          <div class="meta-row">
            <span>履约状态</span>
            <strong>{{ detail.status || '-' }}</strong>
          </div>
          <div class="meta-row">
            <span>支付状态</span>
            <strong>{{ reconciliation.paymentStatus || '-' }}</strong>
          </div>
          <div class="meta-row">
            <span>应付金额</span>
            <strong>￥{{ finalAmountText }}</strong>
          </div>
          <div class="meta-row">
            <span>未付金额</span>
            <strong>￥{{ unpaidAmountText }}</strong>
          </div>
        </div>
      </section>

      <section class="page-card stack">
        <div>
          <label class="field-label">支付方式</label>
          <select v-model="paymentMethod" class="select">
            <option value="offline">线下转账</option>
            <option value="bank_transfer">银行转账</option>
          </select>
        </div>
        <div>
          <label class="field-label">本次支付金额</label>
          <input
            v-model="amount"
            class="input"
            min="0"
            step="0.01"
            type="number"
          />
        </div>
        <div>
          <label class="field-label">支付流水号</label>
          <input
            v-model="paymentSn"
            class="input"
            placeholder="请输入转账流水号"
          />
        </div>
        <div>
          <label class="field-label">支付凭证</label>
          <input class="input" type="file" @change="handleFileChange" />
          <div class="subtle-text" style="margin-top: 8px">
            {{
              uploading
                ? '凭证上传中...'
                : voucherUrl
                  ? `已上传：${voucherUrl}`
                  : '请选择图片文件上传'
            }}
          </div>
        </div>
        <div>
          <label class="field-label">备注</label>
          <textarea
            v-model="remark"
            class="textarea"
            placeholder="可填写转账说明"
          ></textarea>
        </div>
        <button
          :disabled="submitting"
          class="primary-btn"
          @click="submitPayment"
        >
          {{ submitting ? '提交中...' : '提交付款凭证' }}
        </button>
      </section>

      <section class="page-card stack">
        <h3 class="section-title">历史支付记录</h3>
        <div v-if="!reconciliation.payments?.length" class="empty-state">
          暂无支付记录
        </div>
        <article
          v-for="payment in reconciliation.payments || []"
          :key="payment.id"
          class="order-card"
        >
          <div class="order-card__body meta-list">
            <div class="meta-row">
              <span>支付方式</span>
              <strong>{{ payment.paymentMethod || '-' }}</strong>
            </div>
            <div class="meta-row">
              <span>支付状态</span>
              <strong>{{ payment.paymentStatus || '-' }}</strong>
            </div>
            <div class="meta-row">
              <span>审核状态</span>
              <strong>{{ payment.auditStatus || '-' }}</strong>
            </div>
            <div class="meta-row">
              <span>金额</span>
              <strong>￥{{ Number(payment.amount || 0).toFixed(2) }}</strong>
            </div>
            <div class="meta-row">
              <span>流水号</span>
              <strong>{{ payment.paymentSn || '-' }}</strong>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>
