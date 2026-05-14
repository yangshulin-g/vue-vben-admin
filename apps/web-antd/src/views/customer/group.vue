<script lang="ts" setup>
import type { CustomerItem, GroupItem, GroupPriceItem } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  addCustomerToGroupApi,
  batchSetGroupPriceApi,
  createCustomerGroupApi,
  deleteCustomerGroupApi,
  getCustomerGroupListApi,
  getCustomerListApi,
  getGroupCustomersApi,
  getGroupPriceListApi,
  removeCustomerFromGroupApi,
  removeGroupPriceApi,
  setGroupPriceApi,
  updateCustomerGroupApi,
} from '#/api';

defineOptions({ name: 'CustomerGroupPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const dataSource = ref<GroupItem[]>([]);
const total = ref(0);

const detailOpen = ref(false);
const detailLoading = ref(false);
const createOpen = ref(false);
const createLoading = ref(false);
const editOpen = ref(false);
const editLoading = ref(false);
const currentGroupName = ref('');
const currentGroupId = ref<null | number>(null);
const groupCustomers = ref<CustomerItem[]>([]);
const addMemberLoading = ref(false);
const addMemberForm = reactive({
  customerKeyword: '',
});

const priceOpen = ref(false);
const priceLoading = ref(false);
const priceList = ref<GroupPriceItem[]>([]);
const currentPriceGroupId = ref<null | number>(null);
const currentPriceGroupName = ref('');
const priceEditOpen = ref(false);
const priceEditLoading = ref(false);
const priceBatchOpen = ref(false);
const priceBatchLoading = ref(false);
const priceEditForm = reactive({
  price: undefined as number | undefined,
  skuCode: '',
});
const priceBatchForm = reactive({
  text: '',
});
const priceFilter = reactive({
  skuCode: '',
});
const priceMode = ref<'create' | 'edit'>('create');

const createForm = reactive({
  description: '',
  enabled: 1,
  groupCode: '',
  groupName: '',
  sort: 0,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { dataIndex: 'groupCode', key: 'groupCode', title: '分组编码' },
  { dataIndex: 'groupName', key: 'groupName', title: '分组名称' },
  { dataIndex: 'enabled', key: 'enabled', title: '状态' },
  { dataIndex: 'sort', key: 'sort', title: '排序' },
  { dataIndex: 'description', key: 'description', title: '描述' },
  { key: 'actions', title: '操作', width: 300 },
];

const canCreate = () =>
  accessStore.accessCodes.includes('customer:group:create');
const canUpdate = () =>
  accessStore.accessCodes.includes('customer:group:update');
const canDelete = () =>
  accessStore.accessCodes.includes('customer:group:delete');
const canGroupAdd = () =>
  accessStore.accessCodes.includes('customer:group:add');
const canGroupRemove = () =>
  accessStore.accessCodes.includes('customer:group:remove');
const canPriceList = () =>
  accessStore.accessCodes.includes('customer:group:price:list');
const canPriceSet = () =>
  accessStore.accessCodes.includes('customer:group:price:set');
const canPriceRemove = () =>
  accessStore.accessCodes.includes('customer:group:price:remove');

const customerColumns = [
  { dataIndex: 'customerCode', key: 'customerCode', title: '客户编码' },
  { dataIndex: 'customerName', key: 'customerName', title: '客户名称' },
  { dataIndex: 'contactPerson', key: 'contactPerson', title: '联系人' },
  { dataIndex: 'contactPhone', key: 'contactPhone', title: '联系电话' },
  { key: 'actions', title: '操作', width: 80 },
];

const priceColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'price', key: 'price', title: '分组价格' },
  { dataIndex: 'createdAt', key: 'createdAt', title: '创建时间' },
  { key: 'actions', title: '操作', width: 120 },
];

function statusText(enabled?: number) {
  return enabled === 1 ? '启用' : '禁用';
}

function isCustomerMatched(item: CustomerItem, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  return [
    item.customerCode,
    item.customerName,
    item.contactPhone,
    item.contactPerson,
  ].some(
    (value) => `${value || ''}`.trim().toLowerCase() === normalizedKeyword,
  );
}

function isCustomerFuzzyMatched(item: CustomerItem, keyword: string) {
  const normalizedKeyword = keyword.trim().toLowerCase();
  return [
    item.customerCode,
    item.customerName,
    item.contactPhone,
    item.contactPerson,
  ].some((value) =>
    `${value || ''}`.trim().toLowerCase().includes(normalizedKeyword),
  );
}

async function resolveCustomer(keyword: string) {
  const normalizedKeyword = keyword.trim();
  if (!normalizedKeyword) {
    message.warning('请输入客户编码、名称或手机号');
    return;
  }

  const res = await getCustomerListApi({ page: 1, size: 500 });
  const customers = res.list ?? [];
  const exactMatched = customers.filter((item) =>
    isCustomerMatched(item, normalizedKeyword),
  );
  const fuzzyMatched =
    exactMatched.length > 0
      ? exactMatched
      : customers.filter((item) =>
          isCustomerFuzzyMatched(item, normalizedKeyword),
        );

  if (fuzzyMatched.length === 0) {
    message.warning('未找到对应客户，请检查客户编码、名称或手机号');
    return;
  }
  if (fuzzyMatched.length > 1) {
    message.warning('匹配到多个客户，请输入更完整的客户编码或手机号');
    return;
  }
  return fuzzyMatched[0];
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getCustomerGroupListApi({
      page: pagination.current,
      size: pagination.pageSize,
    });
    dataSource.value = res.list ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

async function loadGroupCustomers() {
  if (!currentGroupId.value) return;
  detailLoading.value = true;
  try {
    const res = await getGroupCustomersApi(currentGroupId.value, 1, 200);
    groupCustomers.value = res.list ?? [];
  } finally {
    detailLoading.value = false;
  }
}

async function openGroupCustomers(group: GroupItem) {
  detailOpen.value = true;
  currentGroupName.value = group.groupName || '';
  currentGroupId.value = group.groupId;
  addMemberForm.customerKeyword = '';
  await loadGroupCustomers();
}

async function addMemberToCurrentGroup() {
  const customer = await resolveCustomer(addMemberForm.customerKeyword);
  const customerId = customer?.customerId;
  if (!currentGroupId.value || !customerId) {
    return;
  }
  addMemberLoading.value = true;
  try {
    await addCustomerToGroupApi({
      customerIds: [customerId],
      groupId: currentGroupId.value,
    });
    message.success('添加成员成功');
    addMemberForm.customerKeyword = '';
    await loadGroupCustomers();
  } finally {
    addMemberLoading.value = false;
  }
}

async function removeMemberFromCurrentGroup(customerId: number) {
  if (!currentGroupId.value) return;
  await removeCustomerFromGroupApi({
    customerId,
    groupId: currentGroupId.value,
  });
  message.success('移除成员成功');
  await loadGroupCustomers();
}

function openCreate() {
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.groupCode || !createForm.groupName) {
    message.warning('请填写分组编码和分组名称');
    return;
  }
  createLoading.value = true;
  try {
    await createCustomerGroupApi({
      description: createForm.description || undefined,
      enabled: createForm.enabled,
      groupCode: createForm.groupCode,
      groupName: createForm.groupName,
      sort: createForm.sort,
    });
    message.success('创建分组成功');
    createOpen.value = false;
    createForm.groupCode = '';
    createForm.groupName = '';
    createForm.description = '';
    createForm.sort = 0;
    createForm.enabled = 1;
    await loadData();
  } finally {
    createLoading.value = false;
  }
}

function openEdit(item: GroupItem) {
  editForm.id = item.groupId;
  editForm.groupCode = item.groupCode || '';
  editForm.groupName = item.groupName || '';
  editForm.sort = item.sort || 0;
  editForm.enabled = item.enabled || 1;
  editForm.description = item.description || '';
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.id || !editForm.groupCode || !editForm.groupName) {
    message.warning('请填写分组编码和分组名称');
    return;
  }
  editLoading.value = true;
  try {
    await updateCustomerGroupApi({
      description: editForm.description || undefined,
      enabled: editForm.enabled,
      groupCode: editForm.groupCode,
      groupName: editForm.groupName,
      id: editForm.id,
      sort: editForm.sort,
    });
    message.success('更新分组成功');
    editOpen.value = false;
    await loadData();
  } finally {
    editLoading.value = false;
  }
}

async function removeGroup(item: GroupItem) {
  await deleteCustomerGroupApi({ id: item.groupId });
  message.success('删除分组成功');
  await loadData();
}

async function loadPriceList() {
  if (!currentPriceGroupId.value) return;
  priceLoading.value = true;
  try {
    priceList.value =
      (await getGroupPriceListApi({ groupId: currentPriceGroupId.value })) ??
      [];
  } finally {
    priceLoading.value = false;
  }
}

async function openPriceModal(group: GroupItem) {
  if (!canPriceList()) return;
  priceOpen.value = true;
  currentPriceGroupId.value = group.groupId;
  currentPriceGroupName.value = group.groupName || '';
  priceFilter.skuCode = '';
  await loadPriceList();
}

function openCreatePrice() {
  priceMode.value = 'create';
  priceEditForm.skuCode = '';
  priceEditForm.price = undefined;
  priceEditOpen.value = true;
}

function openEditPrice(item: GroupPriceItem) {
  priceMode.value = 'edit';
  priceEditForm.skuCode = item.skuCode || '';
  priceEditForm.price = item.price;
  priceEditOpen.value = true;
}

async function submitPrice() {
  if (
    !currentPriceGroupId.value ||
    !priceEditForm.skuCode ||
    priceEditForm.price === undefined
  ) {
    message.warning('请填写SKU编码和价格');
    return;
  }
  priceEditLoading.value = true;
  try {
    await setGroupPriceApi({
      groupId: currentPriceGroupId.value,
      price: priceEditForm.price,
      skuCode: priceEditForm.skuCode.trim(),
    });
    message.success(
      priceMode.value === 'create' ? '新增定价成功' : '更新定价成功',
    );
    priceEditOpen.value = false;
    await loadPriceList();
  } finally {
    priceEditLoading.value = false;
  }
}

function openBatchPrice() {
  priceBatchForm.text = '';
  priceBatchOpen.value = true;
}

function parseBatchPriceText(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const items: Array<{ price: number; skuCode: string }> = [];
  lines.forEach((line, idx) => {
    const [skuCodeRaw, priceRaw] = line.split(/[,\s]+/);
    const skuCode = (skuCodeRaw || '').trim();
    const price = Number(priceRaw);
    if (!skuCode || Number.isNaN(price) || price < 0) {
      throw new Error(`第${idx + 1}行格式错误，应为：SKU编码,价格`);
    }
    items.push({ price, skuCode });
  });
  return items;
}

async function submitBatchPrice() {
  if (!currentPriceGroupId.value) return;
  if (!priceBatchForm.text.trim()) {
    message.warning('请先输入批量数据');
    return;
  }
  priceBatchLoading.value = true;
  try {
    const items = parseBatchPriceText(priceBatchForm.text);
    await batchSetGroupPriceApi({
      groupId: currentPriceGroupId.value,
      items,
    });
    message.success(`批量设置成功，共 ${items.length} 条`);
    priceBatchOpen.value = false;
    await loadPriceList();
  } catch (error: any) {
    message.error(error?.message || '批量设置失败');
  } finally {
    priceBatchLoading.value = false;
  }
}

async function removePrice(item: GroupPriceItem) {
  if (!currentPriceGroupId.value || !item.skuCode) return;
  await removeGroupPriceApi({
    groupId: currentPriceGroupId.value,
    skuCode: item.skuCode,
  });
  message.success('删除定价成功');
  await loadPriceList();
}

function getFilteredPriceList() {
  const keyword = priceFilter.skuCode.trim().toLowerCase();
  if (!keyword) return priceList.value;
  return priceList.value.filter((item) =>
    `${item.skuCode || ''}`.toLowerCase().includes(keyword),
  );
}

const editForm = reactive({
  description: '',
  enabled: 1,
  groupCode: '',
  groupName: '',
  id: undefined as number | undefined,
  sort: 0,
});

loadData();
</script>

<template>
  <Page title="客户分组">
    <Card class="mb-4">
      <Button v-if="canCreate()" type="dashed" @click="openCreate">
        新增分组
      </Button>
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
        row-key="groupId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'">
            <Tag :color="record.enabled === 1 ? 'success' : 'default'">
              {{ statusText(record.enabled) }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                size="small"
                type="link"
                @click="openGroupCustomers(record as GroupItem)"
              >
                查看成员
              </Button>
              <Button
                v-if="canPriceList()"
                size="small"
                type="link"
                @click="openPriceModal(record as GroupItem)"
              >
                定价
              </Button>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record as GroupItem)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="canDelete()"
                title="确认删除该分组？"
                @confirm="removeGroup(record as GroupItem)"
              >
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      :title="`${currentGroupName || '-'} - 成员列表`"
      width="900px"
    >
      <Card class="mb-4">
        <Form layout="inline">
          <Form.Item label="客户">
            <Input
              v-model:value="addMemberForm.customerKeyword"
              allow-clear
              placeholder="请输入客户编码、名称或手机号"
              style="width: 260px"
            />
          </Form.Item>
          <Form.Item>
            <Button
              v-if="canGroupAdd()"
              :loading="addMemberLoading"
              type="primary"
              @click="addMemberToCurrentGroup"
            >
              添加成员
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <Table
        :columns="customerColumns"
        :data-source="groupCustomers"
        :loading="detailLoading"
        :pagination="false"
        row-key="customerId"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <Popconfirm
              v-if="canGroupRemove()"
              title="确认移除该成员？"
              @confirm="
                removeMemberFromCurrentGroup(
                  (record as CustomerItem).customerId,
                )
              "
            >
              <Button danger size="small" type="link">移除</Button>
            </Popconfirm>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="priceOpen"
      :footer="null"
      :title="`${currentPriceGroupName || '-'} - 分组定价`"
      width="860px"
    >
      <div class="mb-3">
        <Space>
          <Input
            v-model:value="priceFilter.skuCode"
            allow-clear
            placeholder="按SKU编码筛选"
            style="width: 220px"
          />
          <Button
            v-if="canPriceSet()"
            size="small"
            type="dashed"
            @click="openCreatePrice"
          >
            新增定价
          </Button>
          <Button
            v-if="canPriceSet()"
            size="small"
            type="dashed"
            @click="openBatchPrice"
          >
            批量设置
          </Button>
        </Space>
      </div>
      <Table
        :columns="priceColumns"
        :data-source="getFilteredPriceList()"
        :loading="priceLoading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="canPriceSet()"
                size="small"
                type="link"
                @click="openEditPrice(record as GroupPriceItem)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="canPriceRemove()"
                title="确认删除该定价？"
                @confirm="removePrice(record as GroupPriceItem)"
              >
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Modal>

    <Modal
      v-model:open="priceEditOpen"
      :confirm-loading="priceEditLoading"
      :title="priceMode === 'create' ? '新增分组定价' : '编辑分组定价'"
      @ok="submitPrice"
    >
      <Form layout="vertical">
        <Form.Item label="SKU编码" required>
          <Input
            v-model:value="priceEditForm.skuCode"
            :disabled="priceMode === 'edit'"
          />
        </Form.Item>
        <Form.Item label="价格" required>
          <InputNumber
            v-model:value="priceEditForm.price"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="priceBatchOpen"
      :confirm-loading="priceBatchLoading"
      title="批量设置分组定价"
      width="720px"
      @ok="submitBatchPrice"
    >
      <Form layout="vertical">
        <Form.Item label="批量数据（每行：SKU编码,价格）" required>
          <Input.TextArea
            v-model:value="priceBatchForm.text"
            :rows="10"
            placeholder="例如：&#10;SKU-001, 99.9&#10;SKU-002, 109.5"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="createOpen"
      :confirm-loading="createLoading"
      title="新增客户分组"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="分组编码" required>
          <Input v-model:value="createForm.groupCode" />
        </Form.Item>
        <Form.Item label="分组名称" required>
          <Input v-model:value="createForm.groupName" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="createForm.sort"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="状态">
          <InputNumber
            v-model:value="createForm.enabled"
            :max="1"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input v-model:value="createForm.description" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="editLoading"
      title="编辑客户分组"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="分组编码" required>
          <Input v-model:value="editForm.groupCode" />
        </Form.Item>
        <Form.Item label="分组名称" required>
          <Input v-model:value="editForm.groupName" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="editForm.sort"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="状态">
          <InputNumber
            v-model:value="editForm.enabled"
            :max="1"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input v-model:value="editForm.description" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
