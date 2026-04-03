<script lang="ts" setup>
import type { ProductCategoryListItem } from '#/api';

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
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createCategoryApi,
  deleteCategoryApi,
  getCategoryListApi,
  updateCategoryApi,
} from '#/api';

defineOptions({ name: 'ProductCategoryPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const createLoading = ref(false);
const editLoading = ref(false);
const dataSource = ref<ProductCategoryListItem[]>([]);
const total = ref(0);
const createOpen = ref(false);
const editOpen = ref(false);

const filters = reactive({
  categoryName: '',
  enabled: undefined as number | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const createForm = reactive({
  categoryCode: '',
  categoryName: '',
  enabled: 1,
  parentId: undefined as number | undefined,
  sort: 0,
});

const columns = [
  { dataIndex: 'categoryCode', key: 'categoryCode', title: '分类编码' },
  { dataIndex: 'categoryName', key: 'categoryName', title: '分类名称' },
  { dataIndex: 'parentId', key: 'parentId', title: '父分类ID' },
  { dataIndex: 'sort', key: 'sort', title: '排序' },
  { dataIndex: 'enabled', key: 'enabled', title: '状态' },
  { key: 'actions', title: '操作', width: 180 },
];

const canCreate = () => accessStore.accessCodes.includes('category:create');
const canUpdate = () => accessStore.accessCodes.includes('category:update');
const canDelete = () => accessStore.accessCodes.includes('category:delete');

async function loadData() {
  loading.value = true;
  try {
    const res = await getCategoryListApi({
      categoryName: filters.categoryName || undefined,
      enabled:
        filters.enabled === undefined ? undefined : filters.enabled === 1,
      page: pagination.current,
      size: pagination.pageSize,
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
  if (!createForm.categoryCode || !createForm.categoryName) {
    message.warning('请填写分类编码和分类名称');
    return;
  }
  createLoading.value = true;
  try {
    await createCategoryApi({
      categoryCode: createForm.categoryCode,
      categoryName: createForm.categoryName,
      enabled: createForm.enabled === 1,
      parentId: createForm.parentId,
      sort: createForm.sort,
    });
    message.success('创建分类成功');
    createOpen.value = false;
    createForm.categoryCode = '';
    createForm.categoryName = '';
    createForm.enabled = 1;
    createForm.parentId = undefined;
    createForm.sort = 0;
    await loadData();
  } finally {
    createLoading.value = false;
  }
}

function openEdit(item: ProductCategoryListItem) {
  editForm.id = item.id;
  editForm.categoryCode = item.categoryCode || '';
  editForm.categoryName = item.categoryName || '';
  editForm.parentId = item.parentId;
  editForm.sort = item.sort || 0;
  editForm.enabled = item.enabled ? 1 : 0;
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.id || !editForm.categoryCode || !editForm.categoryName) {
    message.warning('请填写分类编码和分类名称');
    return;
  }
  editLoading.value = true;
  try {
    await updateCategoryApi({
      categoryCode: editForm.categoryCode,
      categoryName: editForm.categoryName,
      enabled: editForm.enabled === 1,
      id: editForm.id,
      parentId: editForm.parentId,
      sort: editForm.sort,
    });
    message.success('更新分类成功');
    editOpen.value = false;
    await loadData();
  } finally {
    editLoading.value = false;
  }
}

async function removeCategory(item: ProductCategoryListItem) {
  await deleteCategoryApi({ id: item.id });
  message.success('删除分类成功');
  await loadData();
}

function onSearch() {
  pagination.current = 1;
  loadData();
}

function onReset() {
  filters.categoryName = '';
  filters.enabled = undefined;
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

const editForm = reactive({
  categoryCode: '',
  categoryName: '',
  enabled: 1,
  id: undefined as number | undefined,
  parentId: undefined as number | undefined,
  sort: 0,
});

loadData();
</script>

<template>
  <Page title="分类管理">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="分类名称">
          <Input
            v-model:value="filters.categoryName"
            allow-clear
            placeholder="请输入分类名称"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="filters.enabled"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
            allow-clear
            placeholder="请选择状态"
            style="width: 160px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button v-if="canCreate()" type="dashed" @click="openCreate">
              新增分类
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
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'">
            <Tag
              :color="
                (record as ProductCategoryListItem).enabled
                  ? 'success'
                  : 'default'
              "
            >
              {{
                (record as ProductCategoryListItem).enabled ? '启用' : '禁用'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record as ProductCategoryListItem)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="canDelete()"
                title="确认删除该分类？"
                @confirm="removeCategory(record as ProductCategoryListItem)"
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
      title="新增商品分类"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="分类编码" required>
          <Input v-model:value="createForm.categoryCode" />
        </Form.Item>
        <Form.Item label="分类名称" required>
          <Input v-model:value="createForm.categoryName" />
        </Form.Item>
        <Form.Item label="父分类ID">
          <InputNumber
            v-model:value="createForm.parentId"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="createForm.sort"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="createForm.enabled"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="editLoading"
      title="编辑商品分类"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="分类编码" required>
          <Input v-model:value="editForm.categoryCode" />
        </Form.Item>
        <Form.Item label="分类名称" required>
          <Input v-model:value="editForm.categoryName" />
        </Form.Item>
        <Form.Item label="父分类ID">
          <InputNumber
            v-model:value="editForm.parentId"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="editForm.sort"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="editForm.enabled"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
