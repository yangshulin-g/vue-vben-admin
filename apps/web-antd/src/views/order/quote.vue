<script lang="ts" setup>
import type { CustomerItem, GroupItem, QuoteItem } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  convertQuoteToOrderApi,
  createQuoteApi,
  exportQuoteApi,
  getCustomerGroupListApi,
  getCustomerListApi,
  getGroupCustomersApi,
  getQuoteDetailApi,
  getQuoteListApi,
  updateQuoteStatusApi,
} from '#/api';

defineOptions({ name: 'QuoteOrderPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const createLoading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const createOpen = ref(false);
const convertOpen = ref(false);
const detailOpen = ref(false);
const dataSource = ref<QuoteItem[]>([]);
const customerOptions = ref<Array<{ label: string; value: number }>>([]);
const groupOptions = ref<Array<{ label: string; value: number }>>([]);
const groupCustomerOptions = ref<Array<{ label: string; value: number }>>([]);
const detailData = ref<null | QuoteItem>(null);
const convertQuote = ref<null | QuoteItem>(null);
const total = ref(0);

const filters = reactive({
  quoteNo: '',
  status: undefined as string | undefined,
  targetType: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const createForm = reactive({
  customerId: undefined as number | undefined,
  customerGroupId: undefined as number | undefined,
  items: [
    {
      quantity: 1,
      quotePrice: 0,
      remark: '',
      skuCode: '',
      tempKey: `${Date.now()}`,
    },
  ],
  remark: '',
  targetType: 'CUSTOMER' as 'CUSTOMER' | 'CUSTOMER_GROUP',
  validUntil: '',
});

const convertForm = reactive({
  bizRemark: '',
  customerId: undefined as number | undefined,
  customerRemark: '',
});

const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '已发送', value: 'SENT' },
  { label: '已接受', value: 'ACCEPTED' },
  { label: '已过期', value: 'EXPIRED' },
  { label: '已取消', value: 'CANCELLED' },
];

const statusText: Record<string, string> = {
  ACCEPTED: '已接受',
  CANCELLED: '已取消',
  DRAFT: '草稿',
  EXPIRED: '已过期',
  SENT: '已发送',
};

const statusColor: Record<string, string> = {
  ACCEPTED: 'success',
  CANCELLED: 'default',
  DRAFT: 'default',
  EXPIRED: 'warning',
  SENT: 'processing',
};

const columns = [
  { dataIndex: 'quoteNo', key: 'quoteNo', title: '报价单号' },
  { key: 'target', title: '报价对象' },
  { dataIndex: 'finalAmount', key: 'finalAmount', title: '报价金额' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'validUntil', key: 'validUntil', title: '有效期' },
  { key: 'actions', title: '操作', width: 240 },
];

const itemColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'productName', key: 'productName', title: '商品' },
  { dataIndex: 'basePrice', key: 'basePrice', title: '原价' },
  { dataIndex: 'quotePrice', key: 'quotePrice', title: '报价' },
  { dataIndex: 'quantity', key: 'quantity', title: '数量' },
  { dataIndex: 'totalAmount', key: 'totalAmount', title: '小计' },
];

const canList = () => accessStore.accessCodes.includes('quote:list');
const canDetail = () => accessStore.accessCodes.includes('quote:detail');
const canCreate = () => accessStore.accessCodes.includes('quote:create');
const canStatus = () => accessStore.accessCodes.includes('quote:status');
const canExport = () => accessStore.accessCodes.includes('quote:export');
const canConvert = () =>
  accessStore.accessCodes.includes('quote:convert-order');

const targetTypeOptions = [
  { label: '客户', value: 'CUSTOMER' },
  { label: '客户分组', value: 'CUSTOMER_GROUP' },
];

function targetText(record?: null | Partial<QuoteItem>) {
  if (!record) return '-';
  return record.targetType === 'CUSTOMER_GROUP'
    ? `客户分组：${record.customerGroupName || '-'}`
    : `客户：${record.customerName || '-'}`;
}

function downloadFileContent(file?: {
  contentBase64?: string;
  contentType?: string;
  filename?: string;
}) {
  if (!file?.contentBase64) {
    message.warning('文件内容为空');
    return;
  }
  const binary = atob(file.contentBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  const blob = new Blob([bytes], {
    type:
      file.contentType ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.filename || 'quote.xlsx';
  link.click();
  URL.revokeObjectURL(url);
}

function resetCreateForm() {
  createForm.customerId = undefined;
  createForm.customerGroupId = undefined;
  createForm.targetType = 'CUSTOMER';
  createForm.validUntil = '';
  createForm.remark = '';
  createForm.items = [createEmptyItem()];
}

function createEmptyItem() {
  return {
    quantity: 1,
    quotePrice: 0,
    remark: '',
    skuCode: '',
    tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

function addItem() {
  createForm.items.push(createEmptyItem());
}

function removeItem(tempKey: string) {
  if (createForm.items.length <= 1) {
    message.warning('至少保留一行报价明细');
    return;
  }
  createForm.items = createForm.items.filter(
    (item) => item.tempKey !== tempKey,
  );
}

async function loadCustomers() {
  const res = await getCustomerListApi({ page: 1, size: 200, status: 1 });
  customerOptions.value = (res.list ?? []).map((item: CustomerItem) => ({
    label: `${item.customerName || '-'} (${item.customerCode || '-'})`,
    value: item.customerId,
  }));
}

async function loadGroups() {
  const res = await getCustomerGroupListApi({ page: 1, size: 200, status: 1 });
  groupOptions.value = (res.list ?? []).map((item: GroupItem) => ({
    label: `${item.groupName || '-'} (${item.groupCode || '-'})`,
    value: Number(item.groupId ?? item.id),
  }));
}

async function loadData() {
  if (!canList()) return;
  loading.value = true;
  try {
    const res = await getQuoteListApi({
      page: pagination.current,
      quoteNo: filters.quoteNo || undefined,
      size: pagination.pageSize,
      status: filters.status,
      targetType: filters.targetType,
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
  filters.quoteNo = '';
  filters.status = undefined;
  filters.targetType = undefined;
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

function openCreate() {
  resetCreateForm();
  createOpen.value = true;
}

async function submitCreate() {
  if (createForm.targetType === 'CUSTOMER' && !createForm.customerId) {
    message.warning('请选择客户');
    return;
  }
  if (
    createForm.targetType === 'CUSTOMER_GROUP' &&
    !createForm.customerGroupId
  ) {
    message.warning('请选择客户分组');
    return;
  }
  const items = createForm.items.map((item) => ({
    quantity: Number(item.quantity),
    quotePrice: Number(item.quotePrice),
    remark: item.remark || undefined,
    skuCode: item.skuCode.trim(),
  }));
  if (items.some((item) => !item.skuCode || item.quantity <= 0)) {
    message.warning('请填写有效的 SKU 和数量');
    return;
  }
  createLoading.value = true;
  try {
    await createQuoteApi({
      customerGroupId:
        createForm.targetType === 'CUSTOMER_GROUP'
          ? createForm.customerGroupId
          : undefined,
      customerId:
        createForm.targetType === 'CUSTOMER'
          ? createForm.customerId
          : undefined,
      items,
      remark: createForm.remark || undefined,
      targetType: createForm.targetType,
      validUntil: createForm.validUntil || undefined,
    });
    message.success('报价单已创建');
    createOpen.value = false;
    await loadData();
  } finally {
    createLoading.value = false;
  }
}

async function openDetail(record: any) {
  if (!canDetail()) return;
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detailData.value = await getQuoteDetailApi({ id: record.id });
  } finally {
    detailLoading.value = false;
  }
}

async function changeStatus(record: any, status: string) {
  actionLoading.value = true;
  try {
    await updateQuoteStatusApi({ id: record.id, status });
    message.success('报价单状态已更新');
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function exportQuote(record: any) {
  actionLoading.value = true;
  try {
    downloadFileContent(await exportQuoteApi({ id: record.id }));
  } finally {
    actionLoading.value = false;
  }
}

async function openConvert(record: Partial<QuoteItem>) {
  if (!canConvert()) return;
  if (!record.id) {
    message.warning('报价单信息不完整');
    return;
  }
  convertQuote.value = await getQuoteDetailApi({ id: record.id });
  convertForm.customerId = undefined;
  convertForm.customerRemark = '';
  convertForm.bizRemark = '';
  groupCustomerOptions.value = [];

  if (convertQuote.value.targetType === 'CUSTOMER_GROUP') {
    const groupId = convertQuote.value.customerGroupId;
    if (!groupId) {
      message.warning('报价单缺少客户分组信息');
      return;
    }
    const res = await getGroupCustomersApi(groupId, 1, 200);
    groupCustomerOptions.value = (res.list ?? []).map((item: CustomerItem) => ({
      label: `${item.customerName || '-'} (${item.customerCode || '-'})`,
      value: item.customerId,
    }));
  }

  convertOpen.value = true;
}

async function submitConvert() {
  if (!convertQuote.value?.id) return;
  if (
    convertQuote.value.targetType === 'CUSTOMER_GROUP' &&
    !convertForm.customerId
  ) {
    message.warning('请选择客户');
    return;
  }
  actionLoading.value = true;
  try {
    const res = await convertQuoteToOrderApi({
      bizRemark: convertForm.bizRemark || undefined,
      customerId:
        convertQuote.value.targetType === 'CUSTOMER_GROUP'
          ? convertForm.customerId
          : undefined,
      customerRemark: convertForm.customerRemark || undefined,
      quoteId: convertQuote.value.id,
    });
    message.success(`已转订单${res.orderNo ? `：${res.orderNo}` : ''}`);
    convertOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

loadCustomers();
loadGroups();
loadData();
</script>

<template>
  <Page title="报价单">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="报价单号">
          <Input
            v-model:value="filters.quoteNo"
            allow-clear
            placeholder="请输入报价单号"
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
        <Form.Item label="报价对象">
          <Select
            v-model:value="filters.targetType"
            :options="targetTypeOptions"
            allow-clear
            placeholder="请选择对象"
            style="width: 160px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button v-if="canCreate()" type="dashed" @click="openCreate">
              新增报价
            </Button>
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
          <template v-else-if="column.key === 'target'">
            {{ targetText(record) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openDetail(record)">
                详情
              </Button>
              <Button
                v-if="canExport()"
                size="small"
                type="link"
                @click="exportQuote(record)"
              >
                导出
              </Button>
              <Button
                v-if="canConvert()"
                size="small"
                type="link"
                @click="openConvert(record)"
              >
                转订单
              </Button>
              <Select
                v-if="canStatus()"
                :options="statusOptions"
                placeholder="改状态"
                size="small"
                style="width: 110px"
                @change="(value) => changeStatus(record, String(value))"
              />
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="createLoading"
      title="新增报价单"
      width="820px"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="报价对象" required>
          <Select
            v-model:value="createForm.targetType"
            :options="targetTypeOptions"
            @change="
              () => {
                createForm.customerId = undefined;
                createForm.customerGroupId = undefined;
              }
            "
          />
        </Form.Item>
        <Form.Item
          v-if="createForm.targetType === 'CUSTOMER'"
          label="客户"
          required
        >
          <Select
            v-model:value="createForm.customerId"
            :options="customerOptions"
            placeholder="请选择客户"
            show-search
          />
        </Form.Item>
        <Form.Item v-else label="客户分组" required>
          <Select
            v-model:value="createForm.customerGroupId"
            :options="groupOptions"
            placeholder="请选择客户分组"
            show-search
          />
        </Form.Item>
        <Form.Item label="有效期">
          <Input
            v-model:value="createForm.validUntil"
            placeholder="例如 2026-05-31T23:59:59"
          />
        </Form.Item>
        <Table
          :columns="[
            { key: 'skuCode', title: 'SKU编码' },
            { key: 'quotePrice', title: '报价' },
            { key: 'quantity', title: '数量' },
            { key: 'remark', title: '备注' },
            { key: 'actions', title: '操作', width: 80 },
          ]"
          :data-source="createForm.items"
          :pagination="false"
          row-key="tempKey"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'skuCode'">
              <Input v-model:value="record.skuCode" placeholder="SKU编码" />
            </template>
            <template v-else-if="column.key === 'quotePrice'">
              <InputNumber
                v-model:value="record.quotePrice"
                :min="0"
                style="width: 120px"
              />
            </template>
            <template v-else-if="column.key === 'quantity'">
              <InputNumber
                v-model:value="record.quantity"
                :min="1"
                style="width: 100px"
              />
            </template>
            <template v-else-if="column.key === 'remark'">
              <Input v-model:value="record.remark" placeholder="可选" />
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                size="small"
                type="link"
                @click="removeItem(record.tempKey)"
              >
                删除
              </Button>
            </template>
          </template>
        </Table>
        <Button class="mt-3" type="dashed" @click="addItem">添加明细</Button>
        <Form.Item class="mt-4" label="备注">
          <Input v-model:value="createForm.remark" allow-clear />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      title="报价单详情"
      width="860px"
    >
      <Descriptions v-if="detailData" bordered :column="2" size="small">
        <Descriptions.Item label="报价单号">
          {{ detailData.quoteNo }}
        </Descriptions.Item>
        <Descriptions.Item label="报价对象">
          {{ targetText(detailData) }}
        </Descriptions.Item>
        <Descriptions.Item label="报价金额">
          {{ detailData.finalAmount }}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {{ statusText[detailData.status || ''] || detailData.status }}
        </Descriptions.Item>
      </Descriptions>
      <Table
        class="mt-4"
        :columns="itemColumns"
        :data-source="detailData?.items || []"
        :loading="detailLoading"
        :pagination="false"
        row-key="id"
        size="small"
      />
    </Modal>

    <Modal
      v-model:open="convertOpen"
      :confirm-loading="actionLoading"
      title="报价单转订单"
      width="560px"
      @ok="submitConvert"
    >
      <Form layout="vertical">
        <Form.Item label="报价对象">
          {{ targetText(convertQuote) }}
        </Form.Item>
        <Form.Item
          v-if="convertQuote?.targetType === 'CUSTOMER_GROUP'"
          label="客户"
          required
        >
          <Select
            v-model:value="convertForm.customerId"
            :options="groupCustomerOptions"
            placeholder="请选择该分组下客户"
            show-search
          />
        </Form.Item>
        <Form.Item label="客户备注">
          <Input v-model:value="convertForm.customerRemark" allow-clear />
        </Form.Item>
        <Form.Item label="业务备注">
          <Input v-model:value="convertForm.bizRemark" allow-clear />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
