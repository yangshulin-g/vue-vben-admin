<script setup lang="ts">
import type { ProductListItem } from '@/lib/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { formatSpec, getProductList } from '@/lib/api';

const router = useRouter();
const loading = ref(false);
const keyword = ref('');
const products = ref<ProductListItem[]>([]);
const errorText = ref('');

async function loadProducts() {
  loading.value = true;
  errorText.value = '';
  try {
    const res = await getProductList(keyword.value.trim());
    products.value = res.list || [];
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '商品加载失败';
  } finally {
    loading.value = false;
  }
}

function openDetail(id: number) {
  router.push(`/product/${id}`);
}

onMounted(loadProducts);
</script>

<template>
  <div class="stack">
    <section class="hero-card">
      <div class="row">
        <div>
          <div class="badge">最小闭环</div>
          <h2 class="section-title" style="margin-top: 12px">商品列表</h2>
        </div>
      </div>
      <div class="form-grid" style="margin-top: 14px">
        <input
          v-model="keyword"
          class="input"
          placeholder="搜索商品名称"
          @keyup.enter="loadProducts"
        />
        <button :disabled="loading" class="secondary-btn" @click="loadProducts">
          {{ loading ? '查询中...' : '搜索商品' }}
        </button>
      </div>
    </section>

    <section v-if="errorText" class="empty-state">{{ errorText }}</section>
    <section v-else-if="products.length === 0 && !loading" class="empty-state">
      暂无可售商品
    </section>
    <section class="product-grid">
      <article
        v-for="item in products"
        :key="item.id"
        class="product-card"
        @click="openDetail(item.id)"
      >
        <img
          :src="item.mainImage || 'https://placehold.co/800x600?text=BizPort'"
          alt=""
          class="product-card__image"
        />
        <div class="product-card__body stack">
          <div class="row">
            <strong>{{ item.productName || '-' }}</strong>
            <span class="badge muted">{{ item.productCode || '-' }}</span>
          </div>
          <div class="subtle-text">
            {{
              formatSpec(item.skuList?.[0]?.specification) ||
              '点击查看SKU与规格'
            }}
          </div>
          <div class="row">
            <span class="price-text">
              ￥{{ Number(item.skuList?.[0]?.price || 0).toFixed(2) }}
            </span>
            <span class="subtle-text">
              库存 {{ item.skuList?.[0]?.stock ?? 0 }}
            </span>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>
