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

import { getSalesStatisticsApi } from '#/api';

defineOptions({ name: 'StatisticsSalesPage' });

const loading = ref(false);
const summary = ref<any>(null);
const form = reactive({
  range: [dayjs().subtract(30, 'day'), dayjs()] as [Dayjs, Dayjs],
});

const dailyColumns = [
  { dataIndex: 'date', key: 'date', title: '日期' },
  { dataIndex: 'orderCount', key: 'orderCount', title: '订单数' },
  { dataIndex: 'salesAmount', key: 'salesAmount', title: '销售额' },
];

async function loadData() {
  loading.value = true;
  try {
    summary.value = await getSalesStatisticsApi({
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
  <Page title="销售统计">
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
      <Descriptions :column="3" bordered class="mb-4" size="small">
        <Descriptions.Item label="总订单">
          {{ summary.totalOrders }}
        </Descriptions.Item>
        <Descriptions.Item label="总销售额">
          {{ summary.totalSalesAmount }}
        </Descriptions.Item>
        <Descriptions.Item label="总客户数">
          {{ summary.totalCustomers }}
        </Descriptions.Item>
        <Descriptions.Item label="已完成">
          {{ summary.completedOrders }}
        </Descriptions.Item>
        <Descriptions.Item label="待处理">
          {{ summary.pendingOrders }}
        </Descriptions.Item>
        <Descriptions.Item label="已取消">
          {{ summary.cancelledOrders }}
        </Descriptions.Item>
      </Descriptions>
      <Table
        :columns="dailyColumns"
        :data-source="summary.dailySales || []"
        :pagination="false"
        row-key="date"
      />
    </Card>
  </Page>
</template>
