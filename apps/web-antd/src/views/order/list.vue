<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type {
  CustomerItem,
  OrderDetailRes,
  OrderListItem,
  OrderPaymentStatus,
  OrderStatus,
  ProductDetailRes,
  ProductListItem,
} from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Steps,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  adminCreateOrderApi,
  cancelOrderApi,
  confirmReceiptApi,
  confirmShipmentApi,
  getAdminOrderListApi,
  getCustomerListApi,
  getOrderDetailApi,
  getProductDetailApi,
  getProductListApi,
  holdOrderApi,
  updateOrderRemarkApi,
} from '#/api';

defineOptions({ name: 'OrderListPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const detailLoading = ref(false);
const shipLoading = ref(false);
const dataSource = ref<OrderListItem[]>([]);
const total = ref(0);
const detailOpen = ref(false);
const shipOpen = ref(false);
const holdOpen = ref(false);
const holdLoading = ref(false);
const remarkOpen = ref(false);
const remarkLoading = ref(false);
const createDrawerOpen = ref(false);
const createStep = ref(0);
const createSubmitting = ref(false);
const customerLoading = ref(false);
const productSearchLoading = ref(false);
const currentOrderId = ref<null | number>(null);
const currentOrderNo = ref('');
const detailData = ref<null | OrderDetailRes>(null);
const customerOptions = ref<CustomerItem[]>([]);
const productSearchOptions = ref<ProductListItem[]>([]);
const productDetailCache = reactive<Record<number, ProductDetailRes>>({});

const filters = reactive({
  customerName: '',
  orderNo: '',
  paymentStatus: undefined as string | undefined,
  status: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const shipForm = reactive({
  forceShip: false,
  forceShipReason: '',
  shippingCompany: '',
  shippingNo: '',
});
const holdForm = reactive({
  holdDeadline: undefined as Dayjs | undefined,
});
const remarkForm = reactive({
  bizRemark: '',
  customerRemark: '',
});

interface OrderCreateSkuOption {
  label: string;
  price: number;
  stock: number;
  value: string;
}

interface OrderCreateItemForm {
  key: string;
  productId?: number;
  quantity: number;
  skuCode?: string;
  skuOptions: OrderCreateSkuOption[];
  unitPrice?: number;
}

const createOrderForm = reactive({
  bizRemark: '',
  customerId: undefined as number | undefined,
  customerRemark: '',
  items: [] as OrderCreateItemForm[],
});

const statusOptions = [
  { label: '已创建', value: 'CREATED' },
  { label: '已发货', value: 'SHIPPED' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

const paymentStatusOptions = [
  { label: '未付款', value: 'UNPAID' },
  { label: '部分付款', value: 'PARTIALLY_PAID' },
  { label: '已付清', value: 'FULLY_PAID' },
];

const statusColorMap: Record<OrderStatus, string> = {
  CANCELLED: 'default',
  COMPLETED: 'success',
  CREATED: 'processing',
  SHIPPED: 'blue',
};

const statusTextMap: Record<OrderStatus, string> = {
  CANCELLED: '已取消',
  COMPLETED: '已完成',
  CREATED: '已创建',
  SHIPPED: '已发货',
};

const paymentStatusColorMap: Record<OrderPaymentStatus, string> = {
  FULLY_PAID: 'success',
  PARTIALLY_PAID: 'warning',
  UNPAID: 'default',
};

const paymentStatusTextMap: Record<OrderPaymentStatus, string> = {
  FULLY_PAID: '已付清',
  PARTIALLY_PAID: '部分付款',
  UNPAID: '未付款',
};

const canShip = computed(() => accessStore.accessCodes.includes('order:ship'));
const canForceShip = computed(() =>
  accessStore.accessCodes.includes('order:ship:force'),
);
const canComplete = computed(() =>
  accessStore.accessCodes.includes('order:complete'),
);
const canCancel = computed(() =>
  accessStore.accessCodes.includes('order:cancel'),
);
const canHold = computed(() => accessStore.accessCodes.includes('order:hold'));
const canRemarkUpdate = computed(() =>
  accessStore.accessCodes.includes('order:remark:update'),
);
const canAdminCreate = computed(() =>
  accessStore.accessCodes.includes('order:admin:create'),
);

const customerSelectOptions = computed(() =>
  customerOptions.value.map((item) => ({
    label: `${item.customerName || '-'} / ${item.contactPerson || '-'} / ${item.contactPhone || '-'}`,
    value: item.customerId,
  })),
);

const productSelectOptions = computed(() =>
  productSearchOptions.value.map((item) => ({
    label: `${item.productName || '-'} (${item.productCode || '-'})`,
    value: item.id,
  })),
);

const selectedCustomer = computed(() =>
  customerOptions.value.find(
    (item) => item.customerId === createOrderForm.customerId,
  ),
);

const estimatedAmount = computed(() =>
  createOrderForm.items.reduce(
    (sum, item) =>
      sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
    0,
  ),
);

const createOrderSteps = [
  { title: '选择客户' },
  { title: '录入明细（直录）' },
  { title: '确认代客单' },
];

const columns = [
  { dataIndex: 'orderNo', key: 'orderNo', title: '订单号' },
  {
    dataIndex: 'orderSource',
    key: 'orderSource',
    title: '下单方式',
    width: 120,
  },
  { dataIndex: 'customerName', key: 'customerName', title: '客户' },
  { dataIndex: 'contactPerson', key: 'contactPerson', title: '联系人' },
  { dataIndex: 'contactPhone', key: 'contactPhone', title: '联系电话' },
  { dataIndex: 'finalAmount', key: 'finalAmount', title: '实付金额' },
  { dataIndex: 'status', key: 'status', title: '履约状态' },
  { dataIndex: 'paymentStatus', key: 'paymentStatus', title: '支付状态' },
  { dataIndex: 'createdAt', key: 'createdAt', title: '创建时间' },
  { key: 'actions', title: '操作', width: 340 },
];

const createOrderColumns = [
  { key: 'product', title: '商品', width: 260 },
  { key: 'sku', title: 'SKU', width: 260 },
  { key: 'unitPrice', title: '原价单价', width: 120 },
  { key: 'stock', title: '当前库存', width: 100 },
  { key: 'quantity', title: '数量', width: 120 },
  { key: 'subtotal', title: '原价小计', width: 120 },
  { key: 'actions', title: '操作', width: 100 },
];

function createOrderItem(): OrderCreateItemForm {
  return {
    key: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    quantity: 1,
    skuOptions: [],
  };
}

function resetCreateOrderForm() {
  createOrderForm.customerId = undefined;
  createOrderForm.customerRemark = '';
  createOrderForm.bizRemark = '';
  createOrderForm.items = [createOrderItem()];
  createStep.value = 0;
}

function addCreateOrderItem() {
  createOrderForm.items.push(createOrderItem());
}

function removeCreateOrderItem(key: string) {
  if (createOrderForm.items.length <= 1) {
    message.warning('至少保留一行商品');
    return;
  }
  createOrderForm.items = createOrderForm.items.filter(
    (item) => item.key !== key,
  );
}

function formatSpecification(specification: any) {
  if (!specification || typeof specification !== 'object') {
    return '';
  }
  return Object.entries(specification)
    .filter(
      ([, value]) =>
        value !== null && value !== undefined && `${value}`.trim() !== '',
    )
    .map(([key, value]) => `${key}: ${value}`)
    .join('，');
}

async function loadCustomerOptions() {
  customerLoading.value = true;
  try {
    const res = await getCustomerListApi({ page: 1, size: 200 });
    customerOptions.value = res.list ?? [];
  } finally {
    customerLoading.value = false;
  }
}

function mergeProductOptions(items: ProductListItem[]) {
  const productMap = new Map<number, ProductListItem>();
  [...productSearchOptions.value, ...items].forEach((item) => {
    productMap.set(item.id, item);
  });
  productSearchOptions.value = [...productMap.values()];
}

async function searchProducts(keyword = '') {
  productSearchLoading.value = true;
  try {
    const res = await getProductListApi({
      page: 1,
      productName: keyword || undefined,
      size: 50,
    });
    mergeProductOptions(res.list ?? []);
  } finally {
    productSearchLoading.value = false;
  }
}

async function ensureProductDetail(productId: number) {
  if (!productDetailCache[productId]) {
    productDetailCache[productId] = await getProductDetailApi({ productId });
  }
  return productDetailCache[productId];
}

async function handleProductChange(
  productId: number,
  row: OrderCreateItemForm,
) {
  row.productId = productId;
  row.skuCode = undefined;
  row.unitPrice = undefined;
  row.skuOptions = [];
  const detail = await ensureProductDetail(productId);
  row.skuOptions =
    detail.skuList?.map((sku) => ({
      label: `${sku.skuCode || '-'}${formatSpecification(sku.specification) ? ` / ${formatSpecification(sku.specification)}` : ''}`,
      price: Number(sku.price || 0),
      stock: Number(sku.stock || 0),
      value: sku.skuCode || '',
    })) ?? [];
}

function handleSkuChange(skuCode: string, row: OrderCreateItemForm) {
  row.skuCode = skuCode;
  const selectedSku = row.skuOptions.find((item) => item.value === skuCode);
  row.unitPrice = selectedSku?.price;
}

function openCreateDrawer() {
  resetCreateOrderForm();
  createDrawerOpen.value = true;
  if (customerOptions.value.length === 0) {
    loadCustomerOptions();
  }
  if (productSearchOptions.value.length === 0) {
    searchProducts();
  }
}

function closeCreateDrawer() {
  resetCreateOrderForm();
  createDrawerOpen.value = false;
}

function validateCreateStep() {
  return validateCreateStepAt(createStep.value);
}

function validateCreateStepAt(step: number) {
  if (step === 0) {
    if (!createOrderForm.customerId) {
      message.warning('请先选择客户');
      return false;
    }
    return true;
  }

  if (step === 1) {
    for (const [index, item] of createOrderForm.items.entries()) {
      if (!item.productId) {
        message.warning(`请先选择第${index + 1}行商品`);
        return false;
      }
      if (!item.skuCode) {
        message.warning(`请先选择第${index + 1}行SKU`);
        return false;
      }
      if (!item.quantity || item.quantity <= 0) {
        message.warning(`第${index + 1}行数量必须大于0`);
        return false;
      }
    }
  }

  return true;
}

function handleCreateStepChange(targetStep: number) {
  if (targetStep <= createStep.value) {
    createStep.value = targetStep;
    return;
  }

  for (let step = createStep.value; step < targetStep; step += 1) {
    if (!validateCreateStepAt(step)) {
      return;
    }
  }

  createStep.value = targetStep;
}

function nextCreateStep() {
  handleCreateStepChange(Math.min(createStep.value + 1, 2));
}

function prevCreateStep() {
  createStep.value = Math.max(createStep.value - 1, 0);
}

async function submitAdminCreateOrder() {
  if (!validateCreateStep()) return;
  if (!createOrderForm.customerId) return;
  createSubmitting.value = true;
  try {
    const res = await adminCreateOrderApi({
      bizRemark: createOrderForm.bizRemark || undefined,
      customerId: createOrderForm.customerId,
      customerRemark: createOrderForm.customerRemark || undefined,
      items: createOrderForm.items.map((item) => ({
        quantity: item.quantity,
        skuCode: item.skuCode || '',
      })),
    });
    message.success(`订单创建成功：${res.orderNo || res.orderId || ''}`);
    createDrawerOpen.value = false;
    await loadOrderList();
  } finally {
    createSubmitting.value = false;
  }
}

async function loadOrderList() {
  loading.value = true;
  try {
    const res = await getAdminOrderListApi({
      customerName: filters.customerName || undefined,
      orderNo: filters.orderNo || undefined,
      page: pagination.current,
      paymentStatus: filters.paymentStatus,
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
  loadOrderList();
}

function onReset() {
  filters.customerName = '';
  filters.orderNo = '';
  filters.paymentStatus = undefined;
  filters.status = undefined;
  pagination.current = 1;
  loadOrderList();
}

async function openDetail(orderId: number) {
  detailLoading.value = true;
  detailOpen.value = true;
  try {
    detailData.value = await getOrderDetailApi({ orderId });
  } finally {
    detailLoading.value = false;
  }
}

function openShipModal(order: OrderListItem) {
  currentOrderId.value = order.id;
  currentOrderNo.value = order.orderNo;
  shipForm.forceShip = false;
  shipForm.forceShipReason = '';
  shipForm.shippingCompany = '';
  shipForm.shippingNo = '';
  shipOpen.value = true;
}

function openHoldModal(order: OrderListItem) {
  currentOrderId.value = order.id;
  currentOrderNo.value = order.orderNo;
  holdForm.holdDeadline = undefined;
  holdOpen.value = true;
}

function openRemarkModal(order: OrderListItem) {
  currentOrderId.value = order.id;
  currentOrderNo.value = order.orderNo;
  remarkForm.customerRemark = order.customerRemark || '';
  remarkForm.bizRemark = order.bizRemark || '';
  remarkOpen.value = true;
}

async function submitShip() {
  if (!currentOrderId.value) {
    return;
  }
  shipLoading.value = true;
  try {
    await confirmShipmentApi({
      forceShip: shipForm.forceShip || undefined,
      forceShipReason: shipForm.forceShipReason || undefined,
      orderId: currentOrderId.value,
      shippingCompany: shipForm.shippingCompany || undefined,
      shippingNo: shipForm.shippingNo || undefined,
    });
    message.success('确认发货成功');
    shipOpen.value = false;
    await loadOrderList();
  } finally {
    shipLoading.value = false;
  }
}

async function doComplete(orderId: number) {
  await confirmReceiptApi(orderId);
  message.success('确认收货成功');
  await loadOrderList();
}

async function doCancel(orderId: number) {
  await cancelOrderApi(orderId);
  message.success('取消订单成功');
  await loadOrderList();
}

async function submitHold() {
  if (!currentOrderId.value || !holdForm.holdDeadline) {
    message.warning('请选择留货截止时间');
    return;
  }
  holdLoading.value = true;
  try {
    await holdOrderApi({
      holdDeadline: holdForm.holdDeadline.format('YYYY-MM-DD HH:mm:ss'),
      orderId: currentOrderId.value,
    });
    message.success('设置留货成功');
    holdOpen.value = false;
    await loadOrderList();
  } finally {
    holdLoading.value = false;
  }
}

async function submitRemark() {
  if (!currentOrderId.value) return;
  remarkLoading.value = true;
  try {
    await updateOrderRemarkApi({
      bizRemark: remarkForm.bizRemark || undefined,
      customerRemark: remarkForm.customerRemark || undefined,
      orderId: currentOrderId.value,
    });
    message.success('备注更新成功');
    remarkOpen.value = false;
    await loadOrderList();
  } finally {
    remarkLoading.value = false;
  }
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadOrderList();
}

loadOrderList();
</script>

<template>
  <Page title="订单列表">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="订单号">
          <Input
            v-model:value="filters.orderNo"
            allow-clear
            placeholder="请输入订单号"
          />
        </Form.Item>
        <Form.Item label="客户名称">
          <Input
            v-model:value="filters.customerName"
            allow-clear
            placeholder="请输入客户名称"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="filters.status"
            :options="statusOptions"
            allow-clear
            placeholder="请选择状态"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item label="支付状态">
          <Select
            v-model:value="filters.paymentStatus"
            :options="paymentStatusOptions"
            allow-clear
            placeholder="请选择支付状态"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button
              v-if="canAdminCreate"
              type="dashed"
              @click="openCreateDrawer"
            >
              创建订单
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
          <template v-if="column.key === 'orderSource'">
            <Tag
              v-if="(record as OrderListItem).orderSource === 'ADMIN_PROXY'"
              color="orange"
            >
              代客下单
            </Tag>
            <Tag
              v-else-if="
                (record as OrderListItem).orderSource === 'CUSTOMER_CART'
              "
              color="blue"
            >
              客户购物车
            </Tag>
            <Tag v-else color="default">未标记</Tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <Tag
              :color="
                statusColorMap[
                  (record as OrderListItem)
                    .status as keyof typeof statusColorMap
                ]
              "
            >
              {{
                statusTextMap[
                  (record as OrderListItem).status as keyof typeof statusTextMap
                ] ?? (record as OrderListItem).status
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'paymentStatus'">
            <Tag
              v-if="(record as OrderListItem).paymentStatus"
              :color="
                paymentStatusColorMap[
                  (record as OrderListItem)
                    .paymentStatus as keyof typeof paymentStatusColorMap
                ]
              "
            >
              {{
                paymentStatusTextMap[
                  (record as OrderListItem)
                    .paymentStatus as keyof typeof paymentStatusTextMap
                ] ?? (record as OrderListItem).paymentStatus
              }}
            </Tag>
            <Tag v-else color="default">-</Tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                size="small"
                type="link"
                @click="openDetail((record as OrderListItem).id)"
              >
                详情
              </Button>

              <Button
                v-if="
                  canShip &&
                  (record as OrderListItem).status === 'CREATED' &&
                  ((record as OrderListItem).paymentStatus ===
                    'PARTIALLY_PAID' ||
                    (record as OrderListItem).paymentStatus === 'FULLY_PAID' ||
                    canForceShip)
                "
                size="small"
                type="link"
                @click="openShipModal(record as OrderListItem)"
              >
                {{
                  (record as OrderListItem).paymentStatus === 'UNPAID' &&
                  canForceShip
                    ? '强制发货'
                    : '确认发货'
                }}
              </Button>

              <Popconfirm
                v-if="
                  canComplete && (record as OrderListItem).status === 'SHIPPED'
                "
                title="确认将该订单标记为已完成？"
                @confirm="doComplete((record as OrderListItem).id)"
              >
                <Button size="small" type="link">确认收货</Button>
              </Popconfirm>

              <Popconfirm
                v-if="
                  canCancel &&
                  (record as OrderListItem).status === 'CREATED' &&
                  (record as OrderListItem).paymentStatus === 'UNPAID'
                "
                title="确认取消该订单？"
                @confirm="doCancel((record as OrderListItem).id)"
              >
                <Button danger size="small" type="link">取消订单</Button>
              </Popconfirm>
              <Button
                v-if="
                  canHold &&
                  (record as OrderListItem).status === 'CREATED' &&
                  (record as OrderListItem).paymentStatus === 'UNPAID'
                "
                size="small"
                type="link"
                @click="openHoldModal(record as OrderListItem)"
              >
                留货
              </Button>
              <Button
                v-if="canRemarkUpdate"
                size="small"
                type="link"
                @click="openRemarkModal(record as OrderListItem)"
              >
                备注
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      :title="`订单详情 ${detailData?.orderNo ?? ''}`"
      width="900px"
    >
      <div v-if="detailLoading">加载中...</div>
      <div v-else-if="detailData">
        <Descriptions :column="2" bordered class="mb-4" size="small">
          <Descriptions.Item label="订单号">
            {{ detailData.orderNo }}
          </Descriptions.Item>
          <Descriptions.Item label="下单方式">
            <Tag v-if="detailData.orderSource === 'ADMIN_PROXY'" color="orange">
              代客下单
            </Tag>
            <Tag
              v-else-if="detailData.orderSource === 'CUSTOMER_CART'"
              color="blue"
            >
              客户购物车
            </Tag>
            <Tag v-else color="default">未标记（历史数据）</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag
              v-if="detailData.status"
              :color="statusColorMap[detailData.status]"
            >
              {{ statusTextMap[detailData.status] ?? detailData.status }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付状态">
            <Tag
              v-if="detailData.paymentStatus"
              :color="paymentStatusColorMap[detailData.paymentStatus]"
            >
              {{
                paymentStatusTextMap[detailData.paymentStatus] ??
                detailData.paymentStatus
              }}
            </Tag>
            <span v-else>-</span>
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {{ detailData.customerName }}
          </Descriptions.Item>
          <Descriptions.Item label="联系人">
            {{ detailData.contactPerson }}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {{ detailData.contactPhone }}
          </Descriptions.Item>
          <Descriptions.Item label="地址">
            {{ detailData.contactAddress }}
          </Descriptions.Item>
          <Descriptions.Item label="总金额">
            {{ detailData.totalAmount }}
          </Descriptions.Item>
          <Descriptions.Item label="优惠金额">
            {{ detailData.discountAmount }}
          </Descriptions.Item>
          <Descriptions.Item label="实付金额">
            {{ detailData.finalAmount }}
          </Descriptions.Item>
          <Descriptions.Item label="留货截止">
            {{ detailData.holdDeadline }}
          </Descriptions.Item>
          <Descriptions.Item :span="2" label="客户备注">
            {{ detailData.customerRemark || '-' }}
          </Descriptions.Item>
          <Descriptions.Item :span="2" label="业务备注">
            {{ detailData.bizRemark || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <Table
          :columns="[
            { dataIndex: 'productName', key: 'productName', title: '商品' },
            { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU' },
            { dataIndex: 'specification', key: 'specification', title: '规格' },
            { dataIndex: 'price', key: 'price', title: '单价' },
            { dataIndex: 'quantity', key: 'quantity', title: '数量' },
            { dataIndex: 'totalAmount', key: 'totalAmount', title: '小计' },
          ]"
          :data-source="detailData.items || []"
          :pagination="false"
          row-key="skuCode"
          size="small"
        />
      </div>
    </Modal>

    <Modal
      v-model:open="shipOpen"
      :confirm-loading="shipLoading"
      :title="`确认发货 ${currentOrderNo}`"
      ok-text="确认发货"
      @ok="submitShip"
    >
      <Form layout="vertical">
        <Form.Item v-if="canForceShip" label="强制发货">
          <div class="flex items-center gap-3">
            <Switch v-model:checked="shipForm.forceShip" />
            <span class="text-xs text-gray-500">
              未付款订单仅可通过强制发货放行
            </span>
          </div>
        </Form.Item>
        <Form.Item v-if="shipForm.forceShip" label="强制发货原因" required>
          <Input
            v-model:value="shipForm.forceShipReason"
            allow-clear
            placeholder="请填写特批发货原因"
          />
        </Form.Item>
        <Form.Item label="物流公司">
          <Input
            v-model:value="shipForm.shippingCompany"
            allow-clear
            placeholder="可选，例如：顺丰"
          />
        </Form.Item>
        <Form.Item label="物流单号">
          <Input
            v-model:value="shipForm.shippingNo"
            allow-clear
            placeholder="可选，录入后便于追踪"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="holdOpen"
      :confirm-loading="holdLoading"
      :title="`设置留货 ${currentOrderNo}`"
      ok-text="确认留货"
      @ok="submitHold"
    >
      <Form layout="vertical">
        <Form.Item label="留货截止时间" required>
          <DatePicker
            v-model:value="holdForm.holdDeadline"
            show-time
            style="width: 100%"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="remarkOpen"
      :confirm-loading="remarkLoading"
      :title="`编辑备注 ${currentOrderNo}`"
      @ok="submitRemark"
    >
      <Form layout="vertical">
        <Form.Item label="客户备注">
          <Input.TextArea v-model:value="remarkForm.customerRemark" :rows="3" />
        </Form.Item>
        <Form.Item label="业务备注">
          <Input.TextArea v-model:value="remarkForm.bizRemark" :rows="3" />
        </Form.Item>
      </Form>
    </Modal>

    <Drawer
      v-model:open="createDrawerOpen"
      :footer-style="{ textAlign: 'right' }"
      :width="980"
      destroy-on-close
    >
      <template #title>
        <div class="flex flex-wrap items-center gap-2">
          <span>管理员代客下单</span>
          <Tag color="processing">不经购物车</Tag>
          <Tag>后台直录</Tag>
        </div>
      </template>

      <Alert class="mb-4" show-icon type="info">
        <template #message>与客户自助下单的区别</template>
        <template #description>
          <div class="text-sm leading-relaxed">
            <p class="mb-2">
              客户自助下单：端侧加购后从购物车结算，订单来自购物车行；「购物车」菜单仅可查询/维护，不能代结算。
            </p>
            <p class="mb-0">
              本条为代客：管理员任选客户并直录 SKU
              与数量，不经购物车；可填业务备注留痕。
            </p>
          </div>
        </template>
      </Alert>

      <Steps
        :current="createStep"
        :items="createOrderSteps"
        class="mb-6"
        @change="handleCreateStepChange"
      />

      <div :key="createStep">
        <div v-if="createStep === 0">
          <Form layout="vertical">
            <Form.Item label="选择客户" required>
              <Select
                v-model:value="createOrderForm.customerId"
                :loading="customerLoading"
                :options="customerSelectOptions"
                allow-clear
                option-filter-prop="label"
                placeholder="请选择客户"
                show-search
              />
            </Form.Item>
            <Form.Item
              extra="客户向商家说明的需求，会写入订单。"
              label="客户备注"
            >
              <Input.TextArea
                v-model:value="createOrderForm.customerRemark"
                :rows="3"
              />
            </Form.Item>
            <Form.Item
              extra="代客下单专用：电话/线下接单等内部说明，对应后台订单业务备注；客户自助购物车下单通常无此字段。"
              label="业务备注（内部）"
            >
              <Input.TextArea
                v-model:value="createOrderForm.bizRemark"
                :rows="3"
              />
            </Form.Item>
          </Form>

          <Descriptions
            v-if="selectedCustomer"
            :column="2"
            bordered
            class="mt-4"
            size="small"
            title="客户信息"
          >
            <Descriptions.Item label="客户名称">
              {{ selectedCustomer.customerName || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="联系人">
              {{ selectedCustomer.contactPerson || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {{ selectedCustomer.contactPhone || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="地址">
              {{ selectedCustomer.contactAddress || '-' }}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <div v-else-if="createStep === 1">
          <div class="mb-3 flex items-center justify-between">
            <div class="text-sm text-gray-500">
              此处为<strong>后台直录明细</strong>，不读取客户购物车。请按商品选择
              SKU 与数量，服务端会校验库存并按客户分组定价。
            </div>
            <Button size="small" type="dashed" @click="addCreateOrderItem">
              新增商品行
            </Button>
          </div>
          <Table
            :columns="createOrderColumns"
            :data-source="createOrderForm.items"
            :pagination="false"
            :scroll="{ x: 1100 }"
            row-key="key"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'product'">
                <Select
                  v-model:value="(record as OrderCreateItemForm).productId"
                  :filter-option="false"
                  :loading="productSearchLoading"
                  :options="productSelectOptions"
                  placeholder="请输入商品名称搜索"
                  show-search
                  style="width: 100%"
                  @change="
                    (value) =>
                      handleProductChange(
                        value as number,
                        record as OrderCreateItemForm,
                      )
                  "
                  @search="searchProducts"
                />
              </template>
              <template v-else-if="column.key === 'sku'">
                <Select
                  v-model:value="(record as OrderCreateItemForm).skuCode"
                  :disabled="!(record as OrderCreateItemForm).productId"
                  :options="(record as OrderCreateItemForm).skuOptions"
                  placeholder="请选择SKU"
                  style="width: 100%"
                  @change="
                    (value) =>
                      handleSkuChange(
                        value as string,
                        record as OrderCreateItemForm,
                      )
                  "
                />
              </template>
              <template v-else-if="column.key === 'unitPrice'">
                {{
                  Number(
                    (record as OrderCreateItemForm).unitPrice || 0,
                  ).toFixed(2)
                }}
              </template>
              <template v-else-if="column.key === 'stock'">
                {{
                  (record as OrderCreateItemForm).skuOptions.find(
                    (item) =>
                      item.value === (record as OrderCreateItemForm).skuCode,
                  )?.stock ?? '-'
                }}
              </template>
              <template v-else-if="column.key === 'quantity'">
                <InputNumber
                  v-model:value="(record as OrderCreateItemForm).quantity"
                  :min="1"
                  style="width: 100%"
                />
              </template>
              <template v-else-if="column.key === 'subtotal'">
                {{
                  (
                    Number((record as OrderCreateItemForm).unitPrice || 0) *
                    Number((record as OrderCreateItemForm).quantity || 0)
                  ).toFixed(2)
                }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button
                  danger
                  size="small"
                  type="link"
                  @click="
                    removeCreateOrderItem((record as OrderCreateItemForm).key)
                  "
                >
                  删除
                </Button>
              </template>
            </template>
          </Table>
          <div class="mt-3 text-xs text-gray-500">
            当前展示的是 SKU
            原价预估，最终成交金额以服务端按客户分组定价重新计算为准。
          </div>
        </div>

        <div v-else>
          <Descriptions
            :column="2"
            bordered
            class="mb-4"
            size="small"
            title="订单确认"
          >
            <Descriptions.Item label="客户名称">
              {{ selectedCustomer?.customerName || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="联系人">
              {{ selectedCustomer?.contactPerson || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="联系电话">
              {{ selectedCustomer?.contactPhone || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="地址">
              {{ selectedCustomer?.contactAddress || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="客户备注">
              {{ createOrderForm.customerRemark || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="业务备注">
              {{ createOrderForm.bizRemark || '-' }}
            </Descriptions.Item>
            <Descriptions.Item label="商品行数">
              {{ createOrderForm.items.length }}
            </Descriptions.Item>
            <Descriptions.Item label="原价预估合计">
              {{ estimatedAmount.toFixed(2) }}
            </Descriptions.Item>
          </Descriptions>

          <Table
            :columns="[
              { dataIndex: 'productId', key: 'productId', title: '商品ID' },
              { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
              { dataIndex: 'unitPrice', key: 'unitPrice', title: '原价单价' },
              { dataIndex: 'quantity', key: 'quantity', title: '数量' },
              { dataIndex: 'subtotal', key: 'subtotal', title: '原价小计' },
            ]"
            :data-source="
              createOrderForm.items.map((item) => ({
                key: item.key,
                productId: item.productId,
                quantity: item.quantity,
                skuCode: item.skuCode,
                subtotal: (
                  Number(item.unitPrice || 0) * Number(item.quantity || 0)
                ).toFixed(2),
                unitPrice: Number(item.unitPrice || 0).toFixed(2),
              }))
            "
            :pagination="false"
            row-key="key"
            size="small"
          />
          <div class="mt-3 text-xs text-gray-500">
            提交后将由后端统一执行库存校验、客户分组定价计算并生成正式订单。
          </div>
        </div>
      </div>

      <template #footer>
        <Space>
          <Button @click="closeCreateDrawer">取消</Button>
          <Button v-if="createStep > 0" @click="prevCreateStep">上一步</Button>
          <Button v-if="createStep < 2" type="primary" @click="nextCreateStep">
            下一步
          </Button>
          <Button
            v-else
            :loading="createSubmitting"
            type="primary"
            @click="submitAdminCreateOrder"
          >
            提交下单
          </Button>
        </Space>
      </template>
    </Drawer>
  </Page>
</template>
