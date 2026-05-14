<script setup lang="ts">
import type { OrderDetailRes, ReconciliationRes } from '@/lib/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  applyRefund,
  createWechatPayment,
  getOrderDetail,
  getOrderReconciliation,
  getWechatOauthAuthorizeUrl,
  submitOfflinePayment,
  uploadVoucher,
} from '@/lib/api';

const route = useRoute();
const loading = ref(false);
const uploading = ref(false);
const submitting = ref(false);
const wechatPaying = ref(false);
const refunding = ref(false);
const detail = ref<null | OrderDetailRes>(null);
const reconciliation = ref<null | ReconciliationRes>(null);
const paymentMethod = ref<'bank_transfer' | 'offline'>('offline');
const amount = ref(0);
const paymentSn = ref('');
const remark = ref('');
const voucherUrl = ref('');
const nativeCodeUrl = ref('');
const refundReason = ref('');
const errorText = ref('');
const successText = ref('');

const orderId = computed(() => Number(route.params.id));
const finalAmountText = computed(() =>
  Number(reconciliation.value?.finalAmount || 0).toFixed(2),
);
const unpaidAmountText = computed(() =>
  Number(reconciliation.value?.unpaidAmount || 0).toFixed(2),
);
const nativeQrUrl = computed(() =>
  nativeCodeUrl.value
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(nativeCodeUrl.value)}`
    : '',
);
const paidWechatPayment = computed(() =>
  reconciliation.value?.payments?.find(
    (item) => item.paymentMethod === 'wechat' && item.paymentStatus === 'PAID',
  ),
);
const canRefund = computed(
  () =>
    detail.value?.status === 'CREATED' &&
    detail.value?.paymentStatus !== 'UNPAID' &&
    Boolean(paidWechatPayment.value?.id),
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

function selectWechatTradeType(): 'H5' | 'JSAPI' | 'NATIVE' {
  const ua = window.navigator.userAgent.toLowerCase();
  if (ua.includes('micromessenger')) {
    return 'JSAPI';
  }
  if (/android|iphone|ipad|ipod|mobile/.test(ua)) {
    return 'H5';
  }
  return 'NATIVE';
}

async function invokeJsapiPay(payParams: {
  appId?: string;
  nonceStr?: string;
  packageValue?: string;
  paySign?: string;
  signType?: string;
  timeStamp?: string;
}) {
  const bridge = (window as any).WeixinJSBridge;
  if (!bridge) {
    const auth = await getWechatOauthAuthorizeUrl(window.location.href);
    if (auth.authorizeUrl) {
      window.location.href = auth.authorizeUrl;
      return;
    }
    throw new Error('当前微信环境不可用');
  }
  bridge.invoke(
    'getBrandWCPayRequest',
    {
      appId: payParams.appId,
      nonceStr: payParams.nonceStr,
      package: payParams.packageValue,
      paySign: payParams.paySign,
      signType: payParams.signType,
      timeStamp: payParams.timeStamp,
    },
    async () => {
      await loadOrder();
    },
  );
}

async function startWechatPayment() {
  const payAmount = Number(reconciliation.value?.unpaidAmount || 0);
  if (payAmount <= 0) {
    errorText.value = '当前订单无需继续支付';
    return;
  }
  wechatPaying.value = true;
  errorText.value = '';
  successText.value = '';
  nativeCodeUrl.value = '';
  try {
    const tradeType = selectWechatTradeType();
    if (tradeType === 'JSAPI' && route.query.wechatOAuth !== '1') {
      const returnUrl = new URL(window.location.href);
      returnUrl.searchParams.set('wechatOAuth', '1');
      const auth = await getWechatOauthAuthorizeUrl(returnUrl.toString());
      if (auth.authorizeUrl) {
        window.location.href = auth.authorizeUrl;
        return;
      }
    }
    const result = await createWechatPayment(
      orderId.value,
      payAmount,
      tradeType,
    );
    if (result.tradeType === 'H5' && result.h5Url) {
      window.location.href = result.h5Url;
      return;
    }
    if (result.tradeType === 'JSAPI') {
      await invokeJsapiPay(result);
      return;
    }
    if (result.tradeType === 'NATIVE' && result.codeUrl) {
      nativeCodeUrl.value = result.codeUrl;
      successText.value = '请使用微信扫码完成支付，支付后刷新订单状态';
      return;
    }
    successText.value = '微信预支付已创建';
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '微信支付失败';
  } finally {
    wechatPaying.value = false;
  }
}

async function submitRefund() {
  const paymentId = paidWechatPayment.value?.id;
  if (!paymentId) {
    errorText.value = '没有可退款的微信支付记录';
    return;
  }
  refunding.value = true;
  errorText.value = '';
  successText.value = '';
  try {
    await applyRefund(
      paymentId,
      Number(paidWechatPayment.value?.amount || 0),
      refundReason.value || undefined,
    );
    successText.value = '退款申请已提交，等待平台审核';
    refundReason.value = '';
    await loadOrder();
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '退款申请失败';
  } finally {
    refunding.value = false;
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
        <div class="badge">微信支付</div>
        <div class="meta-list">
          <div class="meta-row">
            <span>本次支付金额</span>
            <strong>￥{{ unpaidAmountText }}</strong>
          </div>
        </div>
        <button
          :disabled="
            wechatPaying || Number(reconciliation.unpaidAmount || 0) <= 0
          "
          class="primary-btn"
          @click="startWechatPayment"
        >
          {{ wechatPaying ? '处理中...' : '微信支付' }}
        </button>
        <div v-if="nativeCodeUrl" class="subtle-text">
          <img :src="nativeQrUrl" alt="微信支付二维码" class="pay-qr" />
          <div>Native 二维码内容：{{ nativeCodeUrl }}</div>
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

      <section v-if="canRefund" class="page-card stack">
        <div class="badge">申请退款</div>
        <div class="meta-list">
          <div class="meta-row">
            <span>可申请金额</span>
            <strong>￥{{ Number(paidWechatPayment?.amount || 0).toFixed(2) }}</strong>
          </div>
        </div>
        <textarea
          v-model="refundReason"
          class="textarea"
          placeholder="请填写退款原因"
        ></textarea>
        <button :disabled="refunding" class="primary-btn" @click="submitRefund">
          {{ refunding ? '提交中...' : '申请退款' }}
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

<style scoped>
.pay-qr {
  display: block;
  width: 220px;
  height: 220px;
  margin: 12px auto;
  background: #fff;
}
</style>
