<script lang="ts" setup>
import type {
  OrderListItem,
  ReconciliationPaymentItem,
  ReconciliationRes,
  RefundRecordItem,
} from '#/api';

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
  approvePaymentApi,
  auditRefundApi,
  directCreateRefundApi,
  getAdminOrderListApi,
  getOrderPaymentListApi,
  getOrderReconciliationApi,
  getRefundListApi,
  mockConfirmPaymentApi,
  processPaymentApi,
  rejectPaymentApi,
  updatePaymentRecordApi,
} from '#/api';
import BizImageUpload from '#/components/biz-upload/BizImageUpload.vue';

defineOptions({ name: 'PaymentListPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const actionLoading = ref(false);
const detail = ref<null | ReconciliationRes>(null);
const payments = ref<ReconciliationPaymentItem[]>([]);
const refunds = ref<RefundRecordItem[]>([]);
const createOpen = ref(false);
const editOpen = ref(false);
const auditOpen = ref(false);
const refundOpen = ref(false);

const form = reactive({
  orderId: undefined as number | undefined,
  orderKeyword: '',
});

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
  remark: '',
  voucherUrl: '',
});

const auditForm = reactive({
  action: 'approve' as 'approve' | 'reject',
  auditRemark: '',
  id: undefined as number | undefined,
});

const refundForm = reactive({
  paymentId: undefined as number | undefined,
  reason: '',
  refundAmount: 0,
});

const paymentColumns = [
  { dataIndex: 'id', key: 'id', title: '支付记录号', width: 110 },
  {
    dataIndex: 'paymentMethod',
    key: 'paymentMethod',
    title: '支付方式',
    width: 110,
  },
  {
    dataIndex: 'paymentStatus',
    key: 'paymentStatus',
    title: '支付状态',
    width: 120,
  },
  {
    dataIndex: 'auditStatus',
    key: 'auditStatus',
    title: '审核状态',
    width: 120,
  },
  { dataIndex: 'amount', key: 'amount', title: '金额', width: 100 },
  {
    dataIndex: 'paymentTime',
    key: 'paymentTime',
    title: '支付时间',
    width: 180,
  },
  { dataIndex: 'paymentSn', key: 'paymentSn', title: '流水号', width: 180 },
  { dataIndex: 'remark', key: 'remark', title: '备注' },
  { key: 'actions', title: '操作', width: 220 },
];

const refundColumns = [
  { dataIndex: 'refundNo', key: 'refundNo', title: '退款单号', width: 180 },
  { dataIndex: 'paymentId', key: 'paymentId', title: '支付ID', width: 90 },
  {
    dataIndex: 'refundAmount',
    key: 'refundAmount',
    title: '退款金额',
    width: 100,
  },
  { dataIndex: 'source', key: 'source', title: '来源', width: 100 },
  { dataIndex: 'status', key: 'status', title: '状态', width: 130 },
  { dataIndex: 'reason', key: 'reason', title: '原因' },
  { key: 'refundActions', title: '操作', width: 180 },
];

const paymentStatusColorMap: Record<string, string> = {
  FAILED: 'error',
  PAID: 'success',
  PENDING_CALLBACK: 'processing',
  SUBMITTED: 'warning',
};

const paymentStatusTextMap: Record<string, string> = {
  FAILED: '支付失败',
  PAID: '已支付',
  PENDING_CALLBACK: '待回调',
  SUBMITTED: '已提交',
};

const auditStatusColorMap: Record<string, string> = {
  APPROVED: 'success',
  NOT_REQUIRED: 'default',
  PENDING: 'warning',
  REJECTED: 'error',
};

const auditStatusTextMap: Record<string, string> = {
  APPROVED: '已通过',
  NOT_REQUIRED: '无需审核',
  PENDING: '待审核',
  REJECTED: '已驳回',
};

const paymentMethodTextMap: Record<string, string> = {
  alipay: '支付宝',
  bank_transfer: '银行转账',
  offline: '线下转账',
  wechat: '微信',
};

const canProcess = () => accessStore.accessCodes.includes('payment:process');
const canUpdate = () => accessStore.accessCodes.includes('payment:update');
const canApprove = () =>
  accessStore.accessCodes.includes('payment:audit:approve');
const canReject = () =>
  accessStore.accessCodes.includes('payment:audit:reject');
const canMockConfirm = () =>
  accessStore.accessCodes.includes('payment:callback:mock-confirm');
const canRefundList = () => accessStore.accessCodes.includes('refund:list');
const canDirectRefund = () =>
  accessStore.accessCodes.includes('refund:direct:create');
const canAuditRefund = () => accessStore.accessCodes.includes('refund:audit');

async function resolveOrderId() {
  const keyword = `${form.orderKeyword || ''}`.trim();
  if (!keyword) {
    message.warning('请先输入订单号');
    return false;
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
      refunds.value = [];
      return;
    }

    detail.value = await getOrderReconciliationApi({
      orderId: form.orderId,
      page: 1,
      size: 100,
    });
    const listRes = await getOrderPaymentListApi({ orderId: form.orderId });
    payments.value = listRes.list || detail.value.payments || [];
    if (canRefundList()) {
      const refundRes = await getRefundListApi({
        orderId: form.orderId,
        page: 1,
        size: 100,
      });
      refunds.value = refundRes.list || [];
    }
  } finally {
    loading.value = false;
  }
}

function openRefund(record: ReconciliationPaymentItem) {
  refundForm.paymentId = record.id;
  refundForm.refundAmount = Number(record.amount || 0);
  refundForm.reason = '';
  refundOpen.value = true;
}

async function submitRefund() {
  if (!refundForm.paymentId || !refundForm.refundAmount) {
    return;
  }
  actionLoading.value = true;
  try {
    await directCreateRefundApi({
      paymentId: refundForm.paymentId,
      reason: refundForm.reason || undefined,
      refundAmount: refundForm.refundAmount,
    });
    message.success('手动退款已提交');
    refundOpen.value = false;
    await queryReconciliation();
  } finally {
    actionLoading.value = false;
  }
}

async function auditRefund(record: RefundRecordItem, approved: boolean) {
  if (!record.id) return;
  actionLoading.value = true;
  try {
    await auditRefundApi({ approved, refundId: record.id });
    message.success(approved ? '退款审核通过' : '退款已驳回');
    await queryReconciliation();
  } finally {
    actionLoading.value = false;
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
    message.success('支付记录提交成功');
    createOpen.value = false;
    await queryReconciliation();
  } finally {
    actionLoading.value = false;
  }
}

function openEdit(record: ReconciliationPaymentItem) {
  editForm.id = record.id;
  editForm.amount = Number(record.amount || 0);
  editForm.paymentMethod = record.paymentMethod || 'offline';
  editForm.paymentSn = record.paymentSn || '';
  editForm.voucherUrl = record.voucherUrl || '';
  editForm.remark = record.remark || '';
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.id || !editForm.amount) {
    return;
  }
  actionLoading.value = true;
  try {
    await updatePaymentRecordApi({
      amount: editForm.amount,
      id: editForm.id,
      paymentMethod: editForm.paymentMethod,
      paymentSn: editForm.paymentSn || undefined,
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

function openAudit(
  action: 'approve' | 'reject',
  record: ReconciliationPaymentItem,
) {
  auditForm.action = action;
  auditForm.id = record.id;
  auditForm.auditRemark = '';
  auditOpen.value = true;
}

async function submitAudit() {
  if (!auditForm.id) {
    return;
  }
  actionLoading.value = true;
  try {
    if (auditForm.action === 'approve') {
      await approvePaymentApi({
        auditRemark: auditForm.auditRemark || undefined,
        id: auditForm.id,
      });
      message.success('支付记录审核通过');
    } else {
      await rejectPaymentApi({
        auditRemark: auditForm.auditRemark || undefined,
        id: auditForm.id,
      });
      message.success('支付记录已驳回');
    }
    auditOpen.value = false;
    await queryReconciliation();
  } finally {
    actionLoading.value = false;
  }
}

async function doMockConfirm(id?: number) {
  if (!id) return;
  actionLoading.value = true;
  try {
    await mockConfirmPaymentApi({ id });
    message.success('模拟到账成功');
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
        <Form.Item label="订单号">
          <Input
            v-model:value="form.orderKeyword"
            allow-clear
            placeholder="请输入订单号"
            style="width: 220px"
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
        请从订单列表复制订单号后在这里查询支付对账。
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
        <Descriptions.Item label="支付状态">
          <Tag
            :color="
              paymentStatusColorMap[detail.paymentStatus || ''] || 'default'
            "
          >
            {{
              paymentStatusTextMap[detail.paymentStatus || ''] ||
              detail.paymentStatus ||
              '-'
            }}
          </Tag>
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
        :scroll="{ x: 1200 }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'paymentMethod'">
            {{
              paymentMethodTextMap[
                (record as ReconciliationPaymentItem).paymentMethod || ''
              ] ||
              (record as ReconciliationPaymentItem).paymentMethod ||
              '-'
            }}
          </template>
          <template v-else-if="column.key === 'paymentStatus'">
            <Tag
              :color="
                paymentStatusColorMap[
                  (record as ReconciliationPaymentItem).paymentStatus || ''
                ] || 'default'
              "
            >
              {{
                paymentStatusTextMap[
                  (record as ReconciliationPaymentItem).paymentStatus || ''
                ] ||
                (record as ReconciliationPaymentItem).paymentStatus ||
                '-'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'auditStatus'">
            <Tag
              :color="
                auditStatusColorMap[
                  (record as ReconciliationPaymentItem).auditStatus || ''
                ] || 'default'
              "
            >
              {{
                auditStatusTextMap[
                  (record as ReconciliationPaymentItem).auditStatus || ''
                ] ||
                (record as ReconciliationPaymentItem).auditStatus ||
                '-'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="
                  canUpdate() &&
                  (record as ReconciliationPaymentItem).paymentStatus !==
                    'PAID' &&
                  (record as ReconciliationPaymentItem).auditStatus !==
                    'REJECTED'
                "
                size="small"
                type="link"
                @click="openEdit(record as ReconciliationPaymentItem)"
              >
                编辑
              </Button>
              <Button
                v-if="
                  canApprove() &&
                  (record as ReconciliationPaymentItem).auditStatus ===
                    'PENDING'
                "
                size="small"
                type="link"
                @click="
                  openAudit('approve', record as ReconciliationPaymentItem)
                "
              >
                审核通过
              </Button>
              <Button
                v-if="
                  canReject() &&
                  (record as ReconciliationPaymentItem).auditStatus ===
                    'PENDING'
                "
                danger
                size="small"
                type="link"
                @click="
                  openAudit('reject', record as ReconciliationPaymentItem)
                "
              >
                审核驳回
              </Button>
              <Popconfirm
                v-if="
                  canMockConfirm() &&
                  (record as ReconciliationPaymentItem).paymentStatus ===
                    'PENDING_CALLBACK'
                "
                title="确认模拟该笔线上支付到账？"
                @confirm="
                  doMockConfirm((record as ReconciliationPaymentItem).id)
                "
              >
                <Button size="small" type="link">模拟到账</Button>
              </Popconfirm>
              <Button
                v-if="
                  canDirectRefund() &&
                  (record as ReconciliationPaymentItem).paymentMethod ===
                    'wechat' &&
                  (record as ReconciliationPaymentItem).paymentStatus === 'PAID'
                "
                size="small"
                type="link"
                @click="openRefund(record as ReconciliationPaymentItem)"
              >
                手动退款
              </Button>
            </Space>
          </template>
        </template>
      </Table>

      <Table
        v-if="canRefundList()"
        :columns="refundColumns"
        :data-source="refunds"
        :pagination="false"
        :scroll="{ x: 1000 }"
        class="mt-4"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag>
              {{ (record as RefundRecordItem).status || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'refundActions'">
            <Space
              v-if="
                canAuditRefund() &&
                (record as RefundRecordItem).status === 'PENDING_REVIEW'
              "
            >
              <Button
                size="small"
                type="link"
                @click="auditRefund(record as RefundRecordItem, true)"
              >
                通过
              </Button>
              <Button
                danger
                size="small"
                type="link"
                @click="auditRefund(record as RefundRecordItem, false)"
              >
                驳回
              </Button>
            </Space>
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
              { label: '线下转账', value: 'offline' },
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
              { label: '线下转账', value: 'offline' },
              { label: '微信', value: 'wechat' },
              { label: '支付宝', value: 'alipay' },
              { label: '银行转账', value: 'bank_transfer' },
            ]"
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

    <Modal
      v-model:open="auditOpen"
      :confirm-loading="actionLoading"
      :title="
        auditForm.action === 'approve' ? '审核通过支付记录' : '审核驳回支付记录'
      "
      @ok="submitAudit"
    >
      <Form layout="vertical">
        <Form.Item label="审核备注">
          <Input.TextArea
            v-model:value="auditForm.auditRemark"
            :rows="3"
            :placeholder="
              auditForm.action === 'approve'
                ? '可选，填写审核通过说明'
                : '可选，填写驳回原因'
            "
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="refundOpen"
      :confirm-loading="actionLoading"
      title="手动微信退款"
      @ok="submitRefund"
    >
      <Form layout="vertical">
        <Form.Item label="退款金额" required>
          <InputNumber
            v-model:value="refundForm.refundAmount"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="退款原因">
          <Input.TextArea v-model:value="refundForm.reason" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
