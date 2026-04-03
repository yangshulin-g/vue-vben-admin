<script lang="ts" setup>
import type { CartItem } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  Form,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
} from 'ant-design-vue';

import {
  getShoppingCartListApi,
  removeFromCartApi,
  updateCartQuantityApi,
} from '#/api';

defineOptions({ name: 'ShoppingCartPage' });

const loading = ref(false);
const dataSource = ref<CartItem[]>([]);
const total = ref(0);
const actionLoading = ref(false);
const editOpen = ref(false);
const accessStore = useAccessStore();

const form = reactive({
  customerId: undefined as number | undefined,
  page: 1,
  size: 20,
});

const columns = [
  { dataIndex: 'cartId', key: 'cartId', title: '购物车ID' },
  { dataIndex: 'productCode', key: 'productCode', title: '商品编码' },
  { dataIndex: 'productName', key: 'productName', title: '商品名称' },
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU' },
  { dataIndex: 'quantity', key: 'quantity', title: '数量' },
  { dataIndex: 'price', key: 'price', title: '单价' },
  { dataIndex: 'totalAmount', key: 'totalAmount', title: '小计' },
  { key: 'actions', title: '操作', width: 180 },
];

const editForm = reactive({
  cartId: undefined as number | undefined,
  quantity: 1,
});

async function loadData() {
  if (!form.customerId) {
    return;
  }
  loading.value = true;
  try {
    const res = await getShoppingCartListApi({
      customerId: form.customerId,
      page: form.page,
      size: form.size,
    });
    dataSource.value = res.list ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onReset() {
  form.customerId = undefined;
  dataSource.value = [];
  total.value = 0;
}

function canUpdate() {
  return accessStore.accessCodes.includes('cart:update');
}

function canRemove() {
  return accessStore.accessCodes.includes('cart:remove');
}

function openEdit(item: CartItem) {
  editForm.cartId = item.cartId;
  editForm.quantity = item.quantity || 1;
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.cartId || !editForm.quantity) return;
  actionLoading.value = true;
  try {
    await updateCartQuantityApi({
      cartId: editForm.cartId,
      quantity: editForm.quantity,
    });
    message.success('购物车数量更新成功');
    editOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function removeItem(item: CartItem) {
  if (!item.cartId) return;
  await removeFromCartApi({ cartId: item.cartId });
  message.success('移除成功');
  await loadData();
}
</script>

<template>
  <Page title="购物车查询">
    <Alert class="mb-4" show-icon type="info">
      <template #message>说明</template>
      <template #description>
        本页仅按客户查询/维护<strong>购物车行</strong>。客户在手机/小程序端加购后的<strong>正式下单</strong>走购物车结算接口；若需在后台代替客户录单（不经购物车），请前往订单列表使用「创建订单」代客下单。
      </template>
    </Alert>
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="客户ID">
          <InputNumber
            v-model:value="form.customerId"
            :min="1"
            placeholder="请输入客户ID"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" @click="loadData">查询</Button>
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
        :pagination="false"
        row-key="cartId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record as CartItem)"
              >
                改数量
              </Button>
              <Popconfirm
                v-if="canRemove()"
                title="确认移除该商品？"
                @confirm="removeItem(record as CartItem)"
              >
                <Button danger size="small" type="link">移除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="actionLoading"
      title="更新购物车数量"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="数量">
          <InputNumber
            v-model:value="editForm.quantity"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
