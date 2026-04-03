<script lang="ts" setup>
import type { RoleItem } from '#/api';

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
  assignRoleMenuApi,
  createRoleApi,
  deleteRoleApi,
  getMenuTreeApi,
  getRoleDetailApi,
  getRoleListApi,
  updateRoleApi,
} from '#/api';

defineOptions({ name: 'SystemRolePage' });

const accessStore = useAccessStore();
const loading = ref(false);
const actionLoading = ref(false);
const dataSource = ref<RoleItem[]>([]);
const total = ref(0);
const createOpen = ref(false);
const editOpen = ref(false);
const assignOpen = ref(false);
const menuOptions = ref<Array<{ label: string; value: number }>>([]);

const filters = reactive({
  roleName: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID' },
  { dataIndex: 'roleCode', key: 'roleCode', title: '角色编码' },
  { dataIndex: 'roleName', key: 'roleName', title: '角色名称' },
  { dataIndex: 'description', key: 'description', title: '描述' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { key: 'actions', title: '操作', width: 260 },
];

const createForm = reactive({
  description: '',
  roleCode: '',
  roleName: '',
  sort: 0,
});

const editForm = reactive({
  description: '',
  roleCode: '',
  roleId: undefined as number | undefined,
  roleName: '',
  sort: 0,
  status: 1,
});

const assignForm = reactive({
  menuIds: [] as number[],
  roleId: undefined as number | undefined,
});

const canCreate = () => accessStore.accessCodes.includes('system:role:create');
const canUpdate = () => accessStore.accessCodes.includes('system:role:update');
const canDelete = () => accessStore.accessCodes.includes('system:role:delete');
const canAssign = () => accessStore.accessCodes.includes('system:role:assign');

async function loadData() {
  loading.value = true;
  try {
    const res = await getRoleListApi({
      page: pagination.current,
      roleName: filters.roleName || undefined,
      size: pagination.pageSize,
    });
    dataSource.value = res.list ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function loadMenuOptions() {
  const tree = await getMenuTreeApi();
  const flat: Array<{ label: string; value: number }> = [];
  const walk = (nodes: any[], prefix = '') => {
    (nodes || []).forEach((node) => {
      const label = `${prefix}${node.menuName || `菜单#${node.id}`}`;
      flat.push({ label, value: node.id });
      walk(node.children || [], `${label} / `);
    });
  };
  walk(tree);
  menuOptions.value = flat;
}

function onSearch() {
  pagination.current = 1;
  loadData();
}

function onReset() {
  filters.roleName = '';
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

function openCreate() {
  createForm.roleCode = '';
  createForm.roleName = '';
  createForm.description = '';
  createForm.sort = 0;
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.roleCode || !createForm.roleName) {
    message.warning('请输入角色编码和角色名称');
    return;
  }
  actionLoading.value = true;
  try {
    await createRoleApi({
      description: createForm.description || undefined,
      roleCode: createForm.roleCode,
      roleName: createForm.roleName,
      sort: createForm.sort,
    });
    message.success('创建角色成功');
    createOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

function openEdit(record: RoleItem) {
  editForm.roleId = record.id;
  editForm.roleCode = record.roleCode || '';
  editForm.roleName = record.roleName || '';
  editForm.description = record.description || '';
  editForm.status = record.status ?? 1;
  editForm.sort = record.sort ?? 0;
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.roleId || !editForm.roleCode || !editForm.roleName) return;
  actionLoading.value = true;
  try {
    await updateRoleApi({
      description: editForm.description || undefined,
      roleCode: editForm.roleCode,
      roleId: editForm.roleId,
      roleName: editForm.roleName,
      sort: editForm.sort,
      status: editForm.status,
    });
    message.success('更新角色成功');
    editOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function removeRole(record: RoleItem) {
  await deleteRoleApi({ roleId: record.id });
  message.success('删除角色成功');
  await loadData();
}

async function openAssignMenu(record: RoleItem) {
  assignForm.roleId = record.id;
  const detail = await getRoleDetailApi({ roleId: record.id });
  assignForm.menuIds = detail.menuIds || [];
  assignOpen.value = true;
}

async function submitAssignMenu() {
  if (!assignForm.roleId) return;
  actionLoading.value = true;
  try {
    await assignRoleMenuApi({
      menuIds: assignForm.menuIds,
      roleId: assignForm.roleId,
    });
    message.success('菜单分配成功');
    assignOpen.value = false;
  } finally {
    actionLoading.value = false;
  }
}

loadMenuOptions();
loadData();
</script>

<template>
  <Page title="角色管理">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="角色名称">
          <Input
            v-model:value="filters.roleName"
            allow-clear
            placeholder="请输入角色名称"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button v-if="canCreate()" type="dashed" @click="openCreate">
              新增角色
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
          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 1 ? 'success' : 'default'">
              {{ record.status === 1 ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record as RoleItem)"
              >
                编辑
              </Button>
              <Button
                v-if="canAssign()"
                size="small"
                type="link"
                @click="openAssignMenu(record as RoleItem)"
              >
                分配菜单
              </Button>
              <Popconfirm
                v-if="canDelete()"
                title="确认删除该角色？"
                @confirm="removeRole(record as RoleItem)"
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
      title="新增角色"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="角色编码" required>
          <Input v-model:value="createForm.roleCode" />
        </Form.Item>
        <Form.Item label="角色名称" required>
          <Input v-model:value="createForm.roleName" />
        </Form.Item>
        <Form.Item label="排序">
          <InputNumber
            v-model:value="createForm.sort"
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
      :confirm-loading="actionLoading"
      title="编辑角色"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="角色编码" required>
          <Input v-model:value="editForm.roleCode" />
        </Form.Item>
        <Form.Item label="角色名称" required>
          <Input v-model:value="editForm.roleName" />
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
        <Form.Item label="排序">
          <InputNumber
            v-model:value="editForm.sort"
            :min="0"
            style="width: 100%"
          />
        </Form.Item>
        <Form.Item label="描述">
          <Input v-model:value="editForm.description" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="assignOpen"
      :confirm-loading="actionLoading"
      title="分配菜单"
      @ok="submitAssignMenu"
    >
      <Form layout="vertical">
        <Form.Item label="菜单">
          <Select
            v-model:value="assignForm.menuIds"
            :options="menuOptions"
            mode="multiple"
            placeholder="请选择菜单"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
