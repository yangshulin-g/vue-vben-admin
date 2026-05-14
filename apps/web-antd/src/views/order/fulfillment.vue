<script lang="ts" setup>
import type { FulfillmentItem } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  addFulfillmentProgressLogApi,
  getFulfillmentDetailApi,
  getFulfillmentListApi,
  updateFulfillmentApi,
  updateFulfillmentStatusApi,
} from '#/api';

defineOptions({ name: 'FulfillmentOrderPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const detailOpen = ref(false);
const detailData = ref<FulfillmentItem | null>(null);
const dataSource = ref<FulfillmentItem[]>([]);
const total = ref(0);

const filters = reactive({
  orderNo: '',
  status: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const statusForm = reactive({
  remark: '',
  status: 'IN_PROGRESS',
});

const logForm = reactive({
  content: '',
});

const updateForm = reactive({
  planFinishAt: '',
  planStartAt: '',
  remark: '',
});

const statusOptions = [
  { label: '待备货', value: 'PENDING' },
  { label: '备货中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

const statusText: Record<string, string> = {
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  IN_PROGRESS: '备货中',
  PENDING: '待备货',
};

const statusColor: Record<string, string> = {
  CANCELLED: 'default',
  COMPLETED: 'success',
  IN_PROGRESS: 'processing',
  PENDING: 'warning',
};

const columns = [
  { dataIndex: 'fulfillmentNo', key: 'fulfillmentNo', title: '备货单号' },
  { dataIndex: 'orderNo', key: 'orderNo', title: '来源订单' },
  { dataIndex: 'customerName', key: 'customerName', title: '客户' },
  { dataIndex: 'source', key: 'source', title: '来源' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'createdAt', key: 'createdAt', title: '创建时间' },
  { key: 'actions', title: '操作', width: 120 },
];

const itemColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'productName', key: 'productName', title: '商品' },
  { dataIndex: 'quantity', key: 'quantity', title: '备货数量' },
  { dataIndex: 'completedQuantity', key: 'completedQuantity', title: '已完成' },
  { dataIndex: 'remark', key: 'remark', title: '备注' },
];

const logColumns = [
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'content', key: 'content', title: '内容' },
  { dataIndex: 'operatorName', key: 'operatorName', title: '记录人' },
  { dataIndex: 'createdAt', key: 'createdAt', title: '时间' },
];

const canList = () => accessStore.accessCodes.includes('fulfillment:list');
const canDetail = () => accessStore.accessCodes.includes('fulfillment:detail');
const canUpdate = () => accessStore.accessCodes.includes('fulfillment:update');
const canUpdateStatus = () =>
  accessStore.accessCodes.includes('fulfillment:status');
const canLog = () => accessStore.accessCodes.includes('fulfillment:log');

async function loadData() {
  if (!canList()) return;
  loading.value = true;
  try {
    const res = await getFulfillmentListApi({
      orderNo: filters.orderNo || undefined,
      page: pagination.current,
      size: pagination.pageSize,
      status: filters.status,
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
  filters.orderNo = '';
  filters.status = undefined;
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

async function openDetail(record: any) {
  if (!canDetail()) return;
  detailOpen.value = true;
  detailLoading.value = true;
  statusForm.status =
    record.status === 'PROCESSING'
      ? 'IN_PROGRESS'
      : record.status || 'IN_PROGRESS';
  statusForm.remark = '';
  logForm.content = '';
  try {
    detailData.value = await getFulfillmentDetailApi({ id: record.id });
    updateForm.planStartAt = detailData.value.planStartAt || '';
    updateForm.planFinishAt = detailData.value.planFinishAt || '';
    updateForm.remark = detailData.value.remark || '';
  } finally {
    detailLoading.value = false;
  }
}

async function refreshDetail() {
  if (!detailData.value?.id) return;
  detailData.value = await getFulfillmentDetailApi({ id: detailData.value.id });
  updateForm.planStartAt = detailData.value.planStartAt || '';
  updateForm.planFinishAt = detailData.value.planFinishAt || '';
  updateForm.remark = detailData.value.remark || '';
}

async function submitUpdate() {
  if (!detailData.value?.id) return;
  actionLoading.value = true;
  try {
    await updateFulfillmentApi({
      id: detailData.value.id,
      planFinishAt: updateForm.planFinishAt || undefined,
      planStartAt: updateForm.planStartAt || undefined,
      remark: updateForm.remark || undefined,
    });
    message.success('备货单已更新');
    await refreshDetail();
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function submitStatus() {
  if (!detailData.value?.id) return;
  actionLoading.value = true;
  try {
    await updateFulfillmentStatusApi({
      id: detailData.value.id,
      remark: statusForm.remark || undefined,
      status: statusForm.status,
    });
    message.success('备货单状态已更新');
    await refreshDetail();
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function submitLog() {
  if (!detailData.value?.id || !logForm.content.trim()) {
    message.warning('请填写进度内容');
    return;
  }
  actionLoading.value = true;
  try {
    await addFulfillmentProgressLogApi({
      content: logForm.content.trim(),
      fulfillmentId: detailData.value.id,
    });
    message.success('进度已记录');
    logForm.content = '';
    await refreshDetail();
  } finally {
    actionLoading.value = false;
  }
}

loadData();
</script>

<template>
  <Page title="备货单">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="订单号">
          <Input
            v-model:value="filters.orderNo"
            allow-clear
            placeholder="请输入订单号"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="filters.status"
            :options="statusOptions"
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
          showSizeChanger: true,
          total,
          onChange: onTableChange,
          onShowSizeChange: onTableChange,
        }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="statusColor[record.status] || 'default'">
              {{ statusText[record.status] || record.status || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Button size="small" type="link" @click="openDetail(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      title="备货单详情"
      width="920px"
    >
      <Space direction="vertical" style="width: 100%">
        <Descriptions v-if="detailData" bordered :column="2" size="small">
          <Descriptions.Item label="备货单号">
            {{ detailData.fulfillmentNo }}
          </Descriptions.Item>
          <Descriptions.Item label="来源订单">
            {{ detailData.orderNo }}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {{ detailData.customerName }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {{ statusText[detailData.status || ''] || detailData.status }}
          </Descriptions.Item>
          <Descriptions.Item label="计划开始">
            {{ detailData.planStartAt || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="计划完成">
            {{ detailData.planFinishAt || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="备注" :span="2">
            {{ detailData.remark || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <Table
          :columns="itemColumns"
          :data-source="detailData?.items || []"
          :loading="detailLoading"
          :pagination="false"
          row-key="id"
          size="small"
        />

        <Card v-if="canUpdate()" size="small" title="基础信息">
          <Space wrap>
            <Input
              v-model:value="updateForm.planStartAt"
              placeholder="计划开始，如 2026-05-31T09:00:00"
              style="width: 250px"
            />
            <Input
              v-model:value="updateForm.planFinishAt"
              placeholder="计划完成，如 2026-06-05T18:00:00"
              style="width: 250px"
            />
            <Input
              v-model:value="updateForm.remark"
              placeholder="备注"
              style="width: 260px"
            />
            <Button
              :loading="actionLoading"
              type="primary"
              @click="submitUpdate"
            >
              保存
            </Button>
          </Space>
        </Card>

        <Card size="small" title="进度处理">
          <Space wrap>
            <Select
              v-model:value="statusForm.status"
              :options="statusOptions"
              style="width: 160px"
            />
            <Input
              v-model:value="statusForm.remark"
              placeholder="状态备注，可选"
              style="width: 280px"
            />
            <Button
              v-if="canUpdateStatus()"
              :loading="actionLoading"
              type="primary"
              @click="submitStatus"
            >
              更新状态
            </Button>
          </Space>
          <Space class="mt-3" wrap>
            <Input
              v-model:value="logForm.content"
              placeholder="填写进度日志"
              style="width: 450px"
            />
            <Button v-if="canLog()" :loading="actionLoading" @click="submitLog">
              记录进度
            </Button>
          </Space>
        </Card>

        <Table
          :columns="logColumns"
          :data-source="detailData?.logs || []"
          :pagination="false"
          row-key="id"
          size="small"
        />
      </Space>
    </Modal>
  </Page>
</template>
