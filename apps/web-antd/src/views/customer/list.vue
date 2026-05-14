<script lang="ts" setup>
import type {
  CustomerAccountDetailRes,
  CustomerDetailRes,
  CustomerItem,
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
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createCustomerAccountApi,
  createCustomerApi,
  deleteCustomerApi,
  getCustomerAccountDetailApi,
  getCustomerDetailApi,
  getCustomerListApi,
  resetCustomerAccountPasswordApi,
  updateCustomerAccountStatusApi,
  updateCustomerApi,
} from '#/api';

defineOptions({ name: 'CustomerListPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const createLoading = ref(false);
const editLoading = ref(false);
const dataSource = ref<CustomerItem[]>([]);
const total = ref(0);
const createOpen = ref(false);
const editOpen = ref(false);
const detailOpen = ref(false);
const detailLoading = ref(false);
const detailData = ref<CustomerDetailRes | null>(null);
const accountLoading = ref(false);
const accountData = ref<CustomerAccountDetailRes | null>(null);

const filters = reactive({
  status: undefined as number | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const createForm = reactive({
  contactAddress: '',
  contactPerson: '',
  contactPhone: '',
  customerCode: '',
  customerName: '',
  customerType: 1,
  remark: '',
  salesmanId: undefined as number | undefined,
});

const statusOptions = [
  { label: '正常', value: 1 },
  { label: '禁用', value: 2 },
];

const columns = [
  { dataIndex: 'customerCode', key: 'customerCode', title: '客户编码' },
  { dataIndex: 'customerName', key: 'customerName', title: '客户名称' },
  { dataIndex: 'contactPerson', key: 'contactPerson', title: '联系人' },
  { dataIndex: 'contactPhone', key: 'contactPhone', title: '联系电话' },
  { dataIndex: 'customerType', key: 'customerType', title: '类型' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'remark', key: 'remark', title: '备注' },
  { key: 'actions', title: '操作', width: 220 },
];

const canCreate = () => accessStore.accessCodes.includes('customer:create');
const canUpdate = () => accessStore.accessCodes.includes('customer:update');
const canDelete = () => accessStore.accessCodes.includes('customer:delete');
const canDetail = () => accessStore.accessCodes.includes('customer:detail');
const canAccountCreate = () =>
  accessStore.accessCodes.includes('customer:account:create');
const canAccountDetail = () =>
  accessStore.accessCodes.includes('customer:account:detail');
const canAccountStatusUpdate = () =>
  accessStore.accessCodes.includes('customer:account:status:update');
const canAccountPasswordReset = () =>
  accessStore.accessCodes.includes('customer:account:password:reset');

function customerTypeText(value?: number) {
  if (value === 1) return '批发商';
  if (value === 2) return '零售商';
  return '-';
}

function statusText(value?: number) {
  if (value === 1) return '正常';
  if (value === 2) return '禁用';
  return '-';
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getCustomerListApi({
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

function openCreate() {
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.customerCode || !createForm.customerName) {
    message.warning('请填写客户编码和客户名称');
    return;
  }
  createLoading.value = true;
  try {
    await createCustomerApi({
      contactAddress: createForm.contactAddress || undefined,
      contactPerson: createForm.contactPerson || undefined,
      contactPhone: createForm.contactPhone || undefined,
      customerCode: createForm.customerCode,
      customerName: createForm.customerName,
      customerType: createForm.customerType,
      remark: createForm.remark || undefined,
      salesmanId: createForm.salesmanId,
    });
    message.success('创建客户成功');
    createOpen.value = false;
    createForm.customerCode = '';
    createForm.customerName = '';
    createForm.contactAddress = '';
    createForm.contactPerson = '';
    createForm.contactPhone = '';
    createForm.customerType = 1;
    createForm.remark = '';
    createForm.salesmanId = undefined;
    await loadData();
  } finally {
    createLoading.value = false;
  }
}

function openEdit(item: CustomerItem) {
  editForm.id = item.customerId;
  editForm.customerCode = item.customerCode || '';
  editForm.customerName = item.customerName || '';
  editForm.customerType = item.customerType || 1;
  editForm.status = item.status || 1;
  editForm.contactPerson = item.contactPerson || '';
  editForm.contactPhone = item.contactPhone || '';
  editForm.contactAddress = item.contactAddress || '';
  editForm.salesmanId = item.salesmanId;
  editForm.remark = item.remark || '';
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.id || !editForm.customerCode || !editForm.customerName) {
    message.warning('请填写完整的客户信息');
    return;
  }
  editLoading.value = true;
  try {
    await updateCustomerApi({
      contactAddress: editForm.contactAddress || undefined,
      contactPerson: editForm.contactPerson || undefined,
      contactPhone: editForm.contactPhone || undefined,
      customerCode: editForm.customerCode,
      customerName: editForm.customerName,
      customerType: editForm.customerType,
      id: editForm.id,
      remark: editForm.remark || undefined,
      salesmanId: editForm.salesmanId,
      status: editForm.status,
    });
    message.success('更新客户成功');
    editOpen.value = false;
    await loadData();
  } finally {
    editLoading.value = false;
  }
}

async function removeCustomer(item: CustomerItem) {
  await deleteCustomerApi({ id: item.customerId });
  message.success('删除客户成功');
  await loadData();
}

async function openDetail(item: CustomerItem) {
  detailOpen.value = true;
  detailLoading.value = true;
  accountData.value = null;
  try {
    detailData.value = await getCustomerDetailApi({ id: item.customerId });
    if (canAccountDetail()) {
      await loadAccountDetail(item.customerId);
    }
  } finally {
    detailLoading.value = false;
  }
}

async function loadAccountDetail(customerId: number) {
  accountLoading.value = true;
  try {
    accountData.value = await getCustomerAccountDetailApi({ customerId });
  } finally {
    accountLoading.value = false;
  }
}

function showPasswordResult(
  title: string,
  password?: string,
  username?: string,
) {
  Modal.success({
    content: `${username ? `用户名：${username}\n` : ''}密码：${password || '-'}\n仅当前可见，请及时通知客户。`,
    title,
  });
}

async function createAccount() {
  if (!detailData.value) return;
  accountLoading.value = true;
  try {
    const res = await createCustomerAccountApi({
      customerId: detailData.value.id,
    });
    message.success('客户账号开通成功');
    showPasswordResult('客户账号已开通', res.initialPassword, res.username);
    await loadAccountDetail(detailData.value.id);
  } catch {
    // 全局拦截器已展示具体错误信息
  } finally {
    accountLoading.value = false;
  }
}

async function toggleAccountStatus() {
  if (!detailData.value || !accountData.value?.opened) return;
  const nextStatus = accountData.value.status === 1 ? 0 : 1;
  accountLoading.value = true;
  try {
    await updateCustomerAccountStatusApi({
      customerId: detailData.value.id,
      status: nextStatus,
    });
    message.success(nextStatus === 1 ? '客户账号已启用' : '客户账号已禁用');
    await loadAccountDetail(detailData.value.id);
  } catch {
    // 全局拦截器已展示具体错误信息
  } finally {
    accountLoading.value = false;
  }
}

async function resetAccountPassword() {
  if (!detailData.value || !accountData.value?.opened) return;
  accountLoading.value = true;
  try {
    const res = await resetCustomerAccountPasswordApi({
      customerId: detailData.value.id,
    });
    message.success('客户账号密码已重置');
    showPasswordResult('客户账号密码已重置', res.newPassword, res.username);
    await loadAccountDetail(detailData.value.id);
  } catch {
    // 全局拦截器已展示具体错误信息
  } finally {
    accountLoading.value = false;
  }
}

function onSearch() {
  pagination.current = 1;
  loadData();
}

function onReset() {
  filters.status = undefined;
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

const editForm = reactive({
  contactAddress: '',
  contactPerson: '',
  contactPhone: '',
  customerCode: '',
  customerName: '',
  customerType: 1,
  id: undefined as number | undefined,
  remark: '',
  salesmanId: undefined as number | undefined,
  status: 1,
});

loadData();
</script>

<template>
  <Page title="客户列表">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="状态">
          <Select
            v-model:value="filters.status"
            :options="statusOptions"
            allow-clear
            placeholder="请选择状态"
            style="width: 180px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button v-if="canCreate()" type="dashed" @click="openCreate">
              新增客户
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
          total,
          showSizeChanger: true,
          onChange: onTableChange,
          onShowSizeChange: onTableChange,
        }"
        row-key="customerId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'customerType'">
            {{ customerTypeText(record.customerType) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'success' : 'default'">
              {{ statusText(record.status) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="canDetail()"
                size="small"
                type="link"
                @click="openDetail(record as CustomerItem)"
              >
                详情
              </Button>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record as CustomerItem)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="canDelete()"
                title="确认删除该客户？"
                @confirm="removeCustomer(record as CustomerItem)"
              >
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="createLoading"
      title="新增客户"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="客户编码" required>
          <Input v-model:value="createForm.customerCode" />
        </Form.Item>
        <Form.Item label="客户名称" required>
          <Input v-model:value="createForm.customerName" />
        </Form.Item>
        <Form.Item label="客户类型">
          <Select
            v-model:value="createForm.customerType"
            :options="[
              { label: '批发商', value: 1 },
              { label: '零售商', value: 2 },
            ]"
          />
        </Form.Item>
        <Form.Item label="联系人">
          <Input v-model:value="createForm.contactPerson" />
        </Form.Item>
        <Form.Item label="联系电话">
          <Input v-model:value="createForm.contactPhone" />
        </Form.Item>
        <Form.Item label="联系地址">
          <Input v-model:value="createForm.contactAddress" />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="createForm.remark" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="editLoading"
      title="编辑客户"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="客户编码" required>
          <Input v-model:value="editForm.customerCode" />
        </Form.Item>
        <Form.Item label="客户名称" required>
          <Input v-model:value="editForm.customerName" />
        </Form.Item>
        <Form.Item label="客户类型">
          <Select
            v-model:value="editForm.customerType"
            :options="[
              { label: '批发商', value: 1 },
              { label: '零售商', value: 2 },
            ]"
          />
        </Form.Item>
        <Form.Item label="客户状态">
          <Select v-model:value="editForm.status" :options="statusOptions" />
        </Form.Item>
        <Form.Item label="联系人">
          <Input v-model:value="editForm.contactPerson" />
        </Form.Item>
        <Form.Item label="联系电话">
          <Input v-model:value="editForm.contactPhone" />
        </Form.Item>
        <Form.Item label="联系地址">
          <Input v-model:value="editForm.contactAddress" />
        </Form.Item>
        <Form.Item label="备注">
          <Input v-model:value="editForm.remark" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      :title="`客户详情 ${detailData?.customerName || ''}`"
      width="720px"
    >
      <div v-if="detailLoading">加载中...</div>
      <Descriptions v-else-if="detailData" :column="2" bordered size="small">
        <Descriptions.Item label="客户编码">
          {{ detailData.customerCode }}
        </Descriptions.Item>
        <Descriptions.Item label="客户名称">
          {{ detailData.customerName }}
        </Descriptions.Item>
        <Descriptions.Item label="客户类型">
          {{ customerTypeText(detailData.customerType) }}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {{ statusText(detailData.status) }}
        </Descriptions.Item>
        <Descriptions.Item label="联系人">
          {{ detailData.contactPerson || '-' }}
        </Descriptions.Item>
        <Descriptions.Item label="联系电话">
          {{ detailData.contactPhone || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" label="联系地址">
          {{ detailData.contactAddress || '-' }}
        </Descriptions.Item>
        <Descriptions.Item :span="2" label="备注">
          {{ detailData.remark || '-' }}
        </Descriptions.Item>
      </Descriptions>
      <Card class="mt-4" size="small" title="账号面板">
        <template #extra>
          <Space>
            <Button
              v-if="canAccountCreate() && !accountData?.opened"
              :loading="accountLoading"
              size="small"
              type="primary"
              @click="createAccount"
            >
              开通账号
            </Button>
            <Button
              v-if="canAccountStatusUpdate() && accountData?.opened"
              :loading="accountLoading"
              size="small"
              @click="toggleAccountStatus"
            >
              {{ accountData?.status === 1 ? '禁用账号' : '启用账号' }}
            </Button>
            <Button
              v-if="canAccountPasswordReset() && accountData?.opened"
              :loading="accountLoading"
              size="small"
              @click="resetAccountPassword"
            >
              重置密码
            </Button>
          </Space>
        </template>
        <div v-if="accountLoading">账号信息加载中...</div>
        <Descriptions v-else :column="2" bordered size="small">
          <Descriptions.Item label="开通状态">
            <Tag :color="accountData?.opened ? 'success' : 'default'">
              {{ accountData?.opened ? '已开通' : '未开通' }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="账号状态">
            <Tag
              v-if="accountData?.opened"
              :color="accountData?.status === 1 ? 'success' : 'default'"
            >
              {{ accountData?.status === 1 ? '启用' : '禁用' }}
            </Tag>
            <span v-else>-</span>
          </Descriptions.Item>
          <Descriptions.Item label="用户名">
            {{ accountData?.username || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="手机号">
            {{ accountData?.phone || detailData?.contactPhone || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="默认登录标识">
            {{ accountData?.username || detailData?.contactPhone || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="开通时间">
            {{ accountData?.createdAt || '-' }}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </Modal>
  </Page>
</template>
