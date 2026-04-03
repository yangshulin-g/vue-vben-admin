<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
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

const loading = ref(false);
const summary = ref<any>(null);
const form = reactive({
  range: [dayjs().subtract(30, 'day'), dayjs()] as [Dayjs, Dayjs],
});

const methodColumns = [
  { dataIndex: 'method', key: 'method', title: '支付方式' },
  { dataIndex: 'count', key: 'count', title: '笔数' },
  { dataIndex: 'totalAmount', key: 'totalAmount', title: '金额' },
];

async function loadData() {
  loading.value = true;
  try {
    summary.value = await getPaymentStatisticsApi({
      endDate: form.range[1]?.format('YYYY-MM-DD'),
      startDate: form.range[0]?.format('YYYY-MM-DD'),
    });
  } finally {
    loading.value = false;
  }
}

loadData();
</script>

<template>
  <Page title="收款统计">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="时间范围">
          <DatePicker.RangePicker v-model:value="form.range" />
        </Form.Item>
        <Form.Item>
          <Button :loading="loading" type="primary" @click="loadData">
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
        :pagination="false"
        row-key="method"
      />
    </Card>
  </Page>
</template>
