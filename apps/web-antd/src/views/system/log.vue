<script lang="ts" setup>
import type { LogItem } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { getOperationLogApi } from '#/api';

defineOptions({ name: 'SystemLogPage' });

const loading = ref(false);
const dataSource = ref<LogItem[]>([]);
const total = ref(0);

const filters = reactive({
  module: '',
  status: undefined as number | undefined,
  username: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 80 },
  { dataIndex: 'username', key: 'username', title: '操作人' },
  { dataIndex: 'module', key: 'module', title: '模块' },
  { dataIndex: 'operation', key: 'operation', title: '操作' },
  { dataIndex: 'requestMethod', key: 'requestMethod', title: '请求方式' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'costTime', key: 'costTime', title: '耗时(ms)' },
  { dataIndex: 'createdAt', key: 'createdAt', title: '时间' },
];

async function loadData() {
  loading.value = true;
  try {
    const res = await getOperationLogApi({
      module: filters.module || undefined,
      page: pagination.current,
      size: pagination.pageSize,
      status: filters.status,
      username: filters.username || undefined,
    });
    dataSource.value = res.list ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  pagination.current = 1;
  loadData();
}

function onReset() {
  filters.module = '';
  filters.status = undefined;
  filters.username = '';
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

loadData();
</script>

<template>
  <Page title="操作日志">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="操作人">
          <Input
            v-model:value="filters.username"
            allow-clear
            placeholder="请输入操作人"
          />
        </Form.Item>
        <Form.Item label="模块">
          <Input
            v-model:value="filters.module"
            allow-clear
            placeholder="请输入模块名"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="filters.status"
            :options="[
              { label: '成功', value: 1 },
              { label: '失败', value: 0 },
            ]"
            allow-clear
            placeholder="请选择状态"
            style="width: 160px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" @click="onSearch">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total,
          showSizeChanger: true,
          onChange: onTableChange,
          onShowSizeChange: onTableChange,
        }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'success' : 'error'">
              {{ record.status === 1 ? '成功' : '失败' }}
            </Tag>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
