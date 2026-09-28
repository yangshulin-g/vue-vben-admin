<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Form,
  Table,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getPaymentStatisticsApi } from '#/api';

defineOptions({ name: 'StatisticsPaymentPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const loadError = ref('');
const summary = ref<any>(null);
const form = reactive({
  range: [dayjs().subtract(30, 'day'), dayjs()] as [Dayjs, Dayjs],
});

const methodText: Record<string, string> = {
  bank_transfer: '银行转账',
  offline: '线下支付',
  unknown: '未知',
  wechat: '微信支付',
};

const methodColumns = [
  { dataIndex: 'paymentMethod', key: 'paymentMethod', title: '支付方式' },
  { dataIndex: 'count', key: 'count', title: '笔数' },
  { dataIndex: 'amount', key: 'amount', title: '金额' },
];

const canQuery = () => accessStore.accessCodes.includes('statistics:payment');

function readError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string } } })
    ?.response?.data;
  return data?.message || fallback;
}

function methodLabel(method?: string) {
  if (!method) return '-';
  return methodText[method] || method;
}

async function loadData() {
  if (!canQuery()) {
    summary.value = null;
    loadError.value = '';
    return;
  }
  loading.value = true;
  loadError.value = '';
  try {
    summary.value = await getPaymentStatisticsApi({
      endDate: form.range[1]?.format('YYYY-MM-DD'),
      startDate: form.range[0]?.format('YYYY-MM-DD'),
    });
  } catch (error) {
    summary.value = null;
    loadError.value = readError(error, '收款统计加载失败');
  } finally {
    loading.value = false;
  }
}

loadData();
</script>

<template>
  <Page title="收款统计">
    <Alert
      v-if="!canQuery()"
      class="mb-4"
      message="当前账号没有收款统计权限（statistics:payment），无法查询。"
      show-icon
      type="warning"
    />
    <Alert
      v-else-if="loadError"
      class="mb-4"
      :message="loadError"
      show-icon
      type="error"
    />
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="时间范围">
          <DatePicker.RangePicker v-model:value="form.range" />
        </Form.Item>
        <Form.Item>
          <Button
            :disabled="!canQuery()"
            :loading="loading"
            type="primary"
            @click="loadData"
          >
            查询
          </Button>
        </Form.Item>
      </Form>
    </Card>
    <Card v-if="summary">
      <Descriptions :column="2" bordered class="mb-4" size="small">
        <Descriptions.Item label="收款总额">
          {{ summary.totalPaymentAmount }}
        </Descriptions.Item>
        <Descriptions.Item label="收款笔数">
          {{ summary.totalPaymentCount }}
        </Descriptions.Item>
      </Descriptions>
      <Table
        :columns="methodColumns"
        :data-source="summary.paymentMethodStats || []"
        :locale="{ emptyText: '该时间范围内没有收款记录' }"
        :pagination="false"
        row-key="paymentMethod"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'paymentMethod'">
            {{ methodLabel(record.paymentMethod) }}
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
