<script lang="ts" setup>
import type { OrderListItem, ReconciliationRes } from '#/api';

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
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  getAdminOrderListApi,
  getOrderPaymentListApi,
  getOrderReconciliationApi,
  processPaymentApi,
  updatePaymentRecordApi,
} from '#/api';
import BizImageUpload from '#/components/biz-upload/BizImageUpload.vue';

defineOptions({ name: 'PaymentListPage' });

const loading = ref(false);
const actionLoading = ref(false);
const detail = ref<null | ReconciliationRes>(null);
const payments = ref<any[]>([]);
const createOpen = ref(false);
const editOpen = ref(false);
const accessStore = useAccessStore();

const form = reactive({
  orderKeyword: '',
  orderId: undefined as number | undefined,
});

const paymentColumns = [
  { dataIndex: 'id', key: 'id', title: '支付ID' },
  { dataIndex: 'paymentTime', key: 'paymentTime', title: '支付时间' },
  { dataIndex: 'paymentMethod', key: 'paymentMethod', title: '支付方式' },
  { dataIndex: 'paymentStatus', key: 'paymentStatus', title: '支付状态' },
  { dataIndex: 'amount', key: 'amount', title: '金额' },
  { dataIndex: 'paymentSn', key: 'paymentSn', title: '流水号' },
  { dataIndex: 'remark', key: 'remark', title: '备注' },
  { key: 'actions', title: '操作', width: 150 },
];

const createForm = reactive({
  amount: 0,
  paymentMethod: 'offline',
  paymentSn: '',
  remark: '',
  voucherUrl: '',
});

const editForm = reactive({
  amount: 0,
  id: undefined as number | undefined,
  paymentMethod: 'offline',
  paymentSn: '',
  paymentStatus: 'paid',
  paymentTime: '',
  remark: '',
  voucherUrl: '',
});

function canProcess() {
  return accessStore.accessCodes.includes('payment:process');
}

function canUpdate() {
  return accessStore.accessCodes.includes('payment:update');
}

async function resolveOrderId() {
  const keyword = `${form.orderKeyword || ''}`.trim();
  if (!keyword) {
    message.warning('请先输入订单ID或订单号');
    return false;
  }

  if (/^\d+$/.test(keyword)) {
    form.orderId = Number(keyword);
    return true;
  }

  const res = await getAdminOrderListApi({
    orderNo: keyword,
    page: 1,
    size: 20,
  });
  const matchedOrder = (res.list || []).find(
    (item: OrderListItem) => item.orderNo === keyword,
  );
  if (!matchedOrder) {
    message.warning('未找到对应订单，请检查订单号');
    return false;
  }
  form.orderId = matchedOrder.id;
  return true;
}

async function queryReconciliation() {
  loading.value = true;
  try {
    const resolved = await resolveOrderId();
    if (!resolved || !form.orderId) {
      detail.value = null;
      payments.value = [];
      return;
    }
    detail.value = await getOrderReconciliationApi({
      orderId: form.orderId,
      page: 1,
      size: 100,
    });
    const listRes = await getOrderPaymentListApi({ orderId: form.orderId });
    payments.value = listRes.list || detail.value.payments || [];
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  if (!detail.value?.orderId) {
    message.warning('请先查询订单');
    return;
  }
  createForm.amount = Number(detail.value?.unpaidAmount || 0);
  createForm.paymentMethod = 'offline';
  createForm.paymentSn = '';
  createForm.remark = '';
  createForm.voucherUrl = '';
  createOpen.value = true;
}

async function submitCreate() {
  if (!detail.value?.orderId || !createForm.amount) {
    message.warning('请填写支付金额');
    return;
  }
  actionLoading.value = true;
  try {
    await processPaymentApi({
      amount: createForm.amount,
      orderId: detail.value.orderId,
      paymentMethod: createForm.paymentMethod,
      paymentSn: createForm.paymentSn || undefined,
      remark: createForm.remark || undefined,
      voucherUrl: createForm.voucherUrl || undefined,
    });
    message.success('新增支付记录成功');
    createOpen.value = false;
    await queryReconciliation();
  } finally {
    actionLoading.value = false;
  }
}

function openEdit(record: any) {
  editForm.id = record.id;
  editForm.amount = Number(record.amount || 0);
  editForm.paymentMethod = record.paymentMethod || 'offline';
  editForm.paymentStatus = record.paymentStatus || 'paid';
  editForm.paymentTime = record.paymentTime || '';
  editForm.paymentSn = record.paymentSn || '';
  editForm.voucherUrl = record.voucherUrl || '';
  editForm.remark = record.remark || '';
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.id || !editForm.amount) return;
  actionLoading.value = true;
  try {
    await updatePaymentRecordApi({
      amount: editForm.amount,
      id: editForm.id,
      paymentMethod: editForm.paymentMethod,
      paymentSn: editForm.paymentSn || undefined,
      paymentStatus: editForm.paymentStatus,
      paymentTime: editForm.paymentTime || undefined,
      remark: editForm.remark || undefined,
      voucherUrl: editForm.voucherUrl || undefined,
    });
    message.success('支付记录更新成功');
    editOpen.value = false;
    await queryReconciliation();
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <Page title="支付对账">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="订单">
          <Input
            v-model:value="form.orderKeyword"
            allow-clear
            placeholder="请输入订单ID或订单号"
            style="width: 200px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              :loading="loading"
              type="primary"
              @click="queryReconciliation"
            >
              查询对账
            </Button>
            <Button v-if="canProcess()" type="dashed" @click="openCreate">
              新增支付
            </Button>
          </Space>
        </Form.Item>
      </Form>
      <div class="mt-3 text-xs text-gray-500">
        支持直接输入订单内部 ID，或从订单列表复制订单号后在这里查询。
      </div>
    </Card>

    <Card v-if="detail">
      <Descriptions
        :column="3"
        bordered
        class="mb-4"
        size="small"
        title="订单汇总"
      >
        <Descriptions.Item label="订单号">
          {{ detail.orderNo }}
        </Descriptions.Item>
        <Descriptions.Item label="订单ID">
          {{ detail.orderId }}
        </Descriptions.Item>
        <Descriptions.Item label="对账状态">
          <Tag>{{ detail.paymentSummaryStatus || '-' }}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="订单总额">
          {{ detail.totalAmount }}
        </Descriptions.Item>
        <Descriptions.Item label="优惠金额">
          {{ detail.discountAmount }}
        </Descriptions.Item>
        <Descriptions.Item label="应付金额">
          {{ detail.finalAmount }}
        </Descriptions.Item>
        <Descriptions.Item label="已付金额">
          {{ detail.paidAmount }}
        </Descriptions.Item>
        <Descriptions.Item label="未付金额">
          {{ detail.unpaidAmount }}
        </Descriptions.Item>
      </Descriptions>

      <Table
        :columns="paymentColumns"
        :data-source="payments"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <Popconfirm
              v-if="canUpdate()"
              title="确认编辑该支付记录？"
              @confirm="openEdit(record)"
            >
              <Button size="small" type="link">编辑</Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="actionLoading"
      title="新增支付记录"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="支付金额" required>
          <InputNumber
            v-model:value="createForm.amount"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="支付方式">
          <Select
            v-model:value="createForm.paymentMethod"
            :options="[
              { label: '线下', value: 'offline' },
              { label: '微信', value: 'wechat' },
              { label: '支付宝', value: 'alipay' },
              { label: '银行转账', value: 'bank_transfer' },
            ]"
          />
        </Form.Item>
        <Form.Item label="支付流水号">
          <Input v-model:value="createForm.paymentSn" />
        </Form.Item>
        <Form.Item label="支付凭证">
          <BizImageUpload
            v-model="createForm.voucherUrl"
            button-text="上传支付凭证"
            type="voucher"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="createForm.remark" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="actionLoading"
      title="编辑支付记录"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="支付金额" required>
          <InputNumber
            v-model:value="editForm.amount"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="支付方式">
          <Select
            v-model:value="editForm.paymentMethod"
            :options="[
              { label: '线下', value: 'offline' },
              { label: '微信', value: 'wechat' },
              { label: '支付宝', value: 'alipay' },
              { label: '银行转账', value: 'bank_transfer' },
            ]"
          />
        </Form.Item>
        <Form.Item label="支付状态">
          <Select
            v-model:value="editForm.paymentStatus"
            :options="[
              { label: '待支付', value: 'pending' },
              { label: '已支付', value: 'paid' },
              { label: '支付失败', value: 'failed' },
            ]"
          />
        </Form.Item>
        <Form.Item label="支付时间">
          <Input
            v-model:value="editForm.paymentTime"
            placeholder="2026-01-01T10:00:00"
          />
        </Form.Item>
        <Form.Item label="支付流水号">
          <Input v-model:value="editForm.paymentSn" />
        </Form.Item>
        <Form.Item label="支付凭证">
          <BizImageUpload
            v-model="editForm.voucherUrl"
            button-text="上传支付凭证"
            type="voucher"
          />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="editForm.remark" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
