<script lang="ts" setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  Form,
  InputNumber,
  Table,
} from 'ant-design-vue';

import { getInventoryStatisticsApi } from '#/api';

defineOptions({ name: 'StatisticsInventoryPage' });

const loading = ref(false);
const router = useRouter();
const summary = ref<any>(null);
const form = reactive({
  lowStockThreshold: 10,
});

const lowStockColumns = [
  { dataIndex: 'productCode', key: 'productCode', title: '商品编码' },
  { dataIndex: 'productName', key: 'productName', title: '商品名称' },
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'stock', key: 'stock', title: '库存' },
];

async function loadData() {
  loading.value = true;
  try {
    summary.value = await getInventoryStatisticsApi({
      lowStockThreshold: form.lowStockThreshold,
    });
  } finally {
    loading.value = false;
  }
}

function goStockManage() {
  router.push('/product/stock');
}

loadData();
</script>

<template>
  <Page title="库存统计">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="低库存阈值">
          <InputNumber v-model:value="form.lowStockThreshold" :min="1" />
        </Form.Item>
        <Form.Item>
          <Button :loading="loading" type="primary" @click="loadData">
            查询
          </Button>
        </Form.Item>
        <Form.Item>
          <Button type="dashed" @click="goStockManage">去库存管理</Button>
        </Form.Item>
      </Form>
    </Card>
    <Card v-if="summary">
      <Descriptions :column="3" bordered class="mb-4" size="small">
        <Descriptions.Item label="商品总数">
          {{ summary.totalProducts }}
        </Descriptions.Item>
        <Descriptions.Item label="SKU总数">
          {{ summary.totalSkus }}
        </Descriptions.Item>
        <Descriptions.Item label="总库存">
          {{ summary.totalStock }}
        </Descriptions.Item>
        <Descriptions.Item label="库存总值">
          {{ summary.totalStockValue }}
        </Descriptions.Item>
        <Descriptions.Item label="低库存SKU数">
          {{ summary.lowStockSkuCount }}
        </Descriptions.Item>
      </Descriptions>
      <Table
        :columns="lowStockColumns"
        :data-source="summary.lowStockItems || []"
        :pagination="false"
        row-key="skuCode"
      />
    </Card>
  </Page>
</template>
