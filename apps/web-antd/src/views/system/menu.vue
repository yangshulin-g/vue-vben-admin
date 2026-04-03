<script lang="ts" setup>
import type { MenuTreeNode } from '#/api';

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
  createMenuApi,
  deleteMenuApi,
  getMenuTreeApi,
  updateMenuApi,
} from '#/api';

defineOptions({ name: 'SystemMenuPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const actionLoading = ref(false);
const dataSource = ref<MenuTreeNode[]>([]);
const createOpen = ref(false);
const editOpen = ref(false);
const parentOptions = ref<Array<{ label: string; value: number }>>([]);

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 80 },
  { dataIndex: 'menuName', key: 'menuName', title: '菜单名' },
  { dataIndex: 'menuType', key: 'menuType', title: '类型' },
  { dataIndex: 'path', key: 'path', title: '路径' },
  { dataIndex: 'permission', key: 'permission', title: '权限标识' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { key: 'actions', title: '操作', width: 220 },
];

const createForm = reactive({
  component: '',
  icon: '',
  menuName: '',
  menuType: 2,
  parentId: 0,
  path: '',
  permission: '',
  sort: 0,
  visible: 1,
});

const editForm = reactive({
  component: '',
  icon: '',
  menuId: undefined as number | undefined,
  menuName: '',
  menuType: 2,
  parentId: 0,
  path: '',
  permission: '',
  sort: 0,
  status: 1,
  visible: 1,
});

const canCreate = () => accessStore.accessCodes.includes('system:menu:create');
const canUpdate = () => accessStore.accessCodes.includes('system:menu:update');
const canDelete = () => accessStore.accessCodes.includes('system:menu:delete');

function menuTypeText(value?: number) {
  if (value === 1) return '目录';
  if (value === 2) return '菜单';
  if (value === 3) return '按钮/API';
  return '-';
}

async function loadData() {
  loading.value = true;
  try {
    dataSource.value = await getMenuTreeApi();
    const options: Array<{ label: string; value: number }> = [
      { label: '顶级菜单', value: 0 },
    ];
    const walk = (nodes: MenuTreeNode[], prefix = '') => {
      (nodes || []).forEach((node) => {
        options.push({
          label: `${prefix}${node.menuName || `菜单#${node.id}`}`,
          value: node.id,
        });
        walk(node.children || [], `${prefix}${node.menuName || node.id} / `);
      });
    };
    walk(dataSource.value);
    parentOptions.value = options;
  } finally {
    loading.value = false;
  }
}

function openCreate(parentId = 0) {
  createForm.menuName = '';
  createForm.menuType = 2;
  createForm.parentId = parentId;
  createForm.path = '';
  createForm.component = '';
  createForm.permission = '';
  createForm.icon = '';
  createForm.sort = 0;
  createForm.visible = 1;
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.menuName) {
    message.warning('请输入菜单名称');
    return;
  }
  actionLoading.value = true;
  try {
    await createMenuApi({
      component: createForm.component || undefined,
      icon: createForm.icon || undefined,
      menuName: createForm.menuName,
      menuType: createForm.menuType,
      parentId: createForm.parentId,
      path: createForm.path || undefined,
      permission: createForm.permission || undefined,
      sort: createForm.sort,
      visible: createForm.visible,
    });
    message.success('创建菜单成功');
    createOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

function openEdit(item: MenuTreeNode) {
  editForm.menuId = item.id;
  editForm.menuName = item.menuName || '';
  editForm.menuType = item.menuType || 2;
  editForm.parentId = item.parentId || 0;
  editForm.path = item.path || '';
  editForm.component = item.component || '';
  editForm.permission = item.permission || '';
  editForm.icon = item.icon || '';
  editForm.sort = item.sort || 0;
  editForm.status = item.status ?? 1;
  editForm.visible = item.visible ?? 1;
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.menuId || !editForm.menuName) return;
  actionLoading.value = true;
  try {
    await updateMenuApi({
      component: editForm.component || undefined,
      icon: editForm.icon || undefined,
      menuId: editForm.menuId,
      menuName: editForm.menuName,
      menuType: editForm.menuType,
      parentId: editForm.parentId,
      path: editForm.path || undefined,
      permission: editForm.permission || undefined,
      sort: editForm.sort,
      status: editForm.status,
      visible: editForm.visible,
    });
    message.success('更新菜单成功');
    editOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function removeMenu(item: MenuTreeNode) {
  await deleteMenuApi({ menuId: item.id });
  message.success('删除菜单成功');
  await loadData();
}

loadData();
</script>

<template>
  <Page title="菜单管理">
    <Card class="mb-4">
      <Space>
        <Button :loading="loading" type="primary" @click="loadData">
          刷新菜单树
        </Button>
        <Button v-if="canCreate()" type="dashed" @click="openCreate(0)">
          新增菜单
        </Button>
      </Space>
    </Card>
    <Card>
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'menuType'">
            {{ menuTypeText(record.menuType) }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'success' : 'default'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="canCreate()"
                size="small"
                type="link"
                @click="openCreate(record.id)"
              >
                加子菜单
              </Button>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record as MenuTreeNode)"
              >
                编辑
              </Button>
              <Popconfirm
                v-if="canDelete()"
                title="确认删除该菜单？"
                @confirm="removeMenu(record as MenuTreeNode)"
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
      :confirm-loading="actionLoading"
      title="新增菜单"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="父菜单">
          <Select
            v-model:value="createForm.parentId"
            :options="parentOptions"
          />
        </Form.Item>
        <Form.Item label="菜单名称" required>
          <Input v-model:value="createForm.menuName" />
        </Form.Item>
        <Form.Item label="菜单类型">
          <Select
            v-model:value="createForm.menuType"
            :options="[
              { label: '目录', value: 1 },
              { label: '菜单', value: 2 },
              { label: '按钮/API', value: 3 },
            ]"
          />
        </Form.Item>
        <Form.Item label="路由路径">
          <Input v-model:value="createForm.path" />
        </Form.Item>
        <Form.Item label="组件路径">
          <Input v-model:value="createForm.component" />
        </Form.Item>
        <Form.Item label="权限标识">
          <Input v-model:value="createForm.permission" />
        </Form.Item>
        <Form.Item label="图标">
          <Input v-model:value="createForm.icon" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="createForm.sort"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="actionLoading"
      title="编辑菜单"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="父菜单">
          <Select v-model:value="editForm.parentId" :options="parentOptions" />
        </Form.Item>
        <Form.Item label="菜单名称" required>
          <Input v-model:value="editForm.menuName" />
        </Form.Item>
        <Form.Item label="菜单类型">
          <Select
            v-model:value="editForm.menuType"
            :options="[
              { label: '目录', value: 1 },
              { label: '菜单', value: 2 },
              { label: '按钮/API', value: 3 },
            ]"
          />
        </Form.Item>
        <Form.Item label="路由路径">
          <Input v-model:value="editForm.path" />
        </Form.Item>
        <Form.Item label="组件路径">
          <Input v-model:value="editForm.component" />
        </Form.Item>
        <Form.Item label="权限标识">
          <Input v-model:value="editForm.permission" />
        </Form.Item>
        <Form.Item label="图标">
          <Input v-model:value="editForm.icon" />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="editForm.status"
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
        </Form.Item>
        <Form.Item label="是否可见">
          <Select
            v-model:value="editForm.visible"
            :options="[
              { label: '显示', value: 1 },
              { label: '隐藏', value: 0 },
            ]"
          />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="editForm.sort"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
