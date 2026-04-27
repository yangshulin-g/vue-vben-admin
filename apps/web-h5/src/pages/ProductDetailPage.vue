<script setup lang="ts">
import type { ProductDetailRes } from '@/lib/api';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { addToCart, formatSpec, getProductDetail } from '@/lib/api';

const route = useRoute();
const router = useRouter();
const detail = ref<null | ProductDetailRes>(null);
const loading = ref(false);
const submitting = ref(false);
const quantity = ref(1);
const selectedSkuCode = ref('');
const errorText = ref('');

const currentSku = computed(() =>
  detail.value?.skuList?.find((item) => item.skuCode === selectedSkuCode.value),
);

async function loadDetail() {
  loading.value = true;
  errorText.value = '';
  try {
    const res = await getProductDetail(Number(route.params.id));
    detail.value = res;
    selectedSkuCode.value = res.skuList?.[0]?.skuCode || '';
  } catch (error) {
    errorText.value =
      error instanceof Error ? error.message : '商品详情加载失败';
  } finally {
    loading.value = false;
  }
}

async function submitAddToCart() {
  if (!detail.value?.productCode || !selectedSkuCode.value) {
    errorText.value = '请选择SKU';
    return;
  }
  submitting.value = true;
  try {
    await addToCart(
      detail.value.productCode,
      selectedSkuCode.value,
      quantity.value,
    );
    await router.push('/cart');
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '加入购物车失败';
  } finally {
    submitting.value = false;
  }
}

onMounted(loadDetail);
</script>

<template>
  <div class="stack">
    <section v-if="loading" class="empty-state">商品详情加载中...</section>
    <section v-else-if="errorText" class="empty-state">{{ errorText }}</section>
    <template v-else-if="detail">
      <img
        :src="
          detail.images?.find((item) => item.isMain)?.imageUrl ||
          detail.mainImage ||
          'https://placehold.co/800x600?text=BizPort'
        "
        alt=""
        class="detail-image"
      />

      <section class="page-card stack">
        <div class="row">
          <div>
            <div class="badge">商品详情</div>
            <h2 class="section-title" style="margin-top: 10px">
              {{ detail.productName }}
            </h2>
          </div>
          <div class="price-text">
            ￥{{ Number(currentSku?.price || 0).toFixed(2) }}
          </div>
        </div>
        <div class="subtle-text">
          {{ detail.description || '暂无商品描述' }}
        </div>
        <div class="meta-list">
          <div class="meta-row">
            <span>商品编号</span>
            <strong>{{ detail.productCode || '-' }}</strong>
          </div>
          <div class="meta-row">
            <span>单位</span>
            <strong>{{ detail.unit || '-' }}</strong>
          </div>
          <div class="meta-row">
            <span>可售库存</span>
            <strong>{{ currentSku?.stock ?? 0 }}</strong>
          </div>
        </div>
      </section>

      <section class="page-card stack">
        <h3 class="section-title">选择SKU</h3>
        <div class="spec-list">
          <button
            v-for="sku in detail.skuList || []"
            :key="sku.skuCode"
            class="spec-option"
            :class="[selectedSkuCode === sku.skuCode ? 'is-active' : '']"
            @click="selectedSkuCode = sku.skuCode || ''"
          >
            <div class="row">
              <strong>{{ sku.skuCode || '-' }}</strong>
              <span>￥{{ Number(sku.price || 0).toFixed(2) }}</span>
            </div>
            <div class="subtle-text">
              {{ formatSpec(sku.specification) || '默认规格' }}
            </div>
          </button>
        </div>
        <div class="row">
          <span class="field-label" style="margin: 0">数量</span>
          <div class="qty-box">
            <button @click="quantity = Math.max(1, quantity - 1)">-</button>
            <strong>{{ quantity }}</strong>
            <button @click="quantity += 1">+</button>
          </div>
        </div>
        <button
          :disabled="submitting"
          class="primary-btn"
          @click="submitAddToCart"
        >
          {{ submitting ? '加入中...' : '加入购物车' }}
        </button>
      </section>
    </template>
  </div>
</template>
