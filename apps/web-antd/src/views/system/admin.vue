<script lang="ts" setup>
import type { AdminItem } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
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
  assignUserRoleApi,
  createAdminApi,
  deleteAdminApi,
  getAdminDetailApi,
  getAdminListApi,
  getRoleListApi,
  resetAdminPasswordApi,
  updateAdminApi,
  updateAdminStatusApi,
} from '#/api';

defineOptions({ name: 'SystemAdminPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const actionLoading = ref(false);
const dataSource = ref<AdminItem[]>([]);
const total = ref(0);
const roleOptions = ref<Array<{ label: string; value: number }>>([]);
const createOpen = ref(false);
const editOpen = ref(false);
const roleOpen = ref(false);
const resetOpen = ref(false);
const currentAdminId = ref<number>();

const filters = reactive({
  status: undefined as number | undefined,
  username: '',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID' },
  { dataIndex: 'username', key: 'username', title: '用户名' },
  { dataIndex: 'nickname', key: 'nickname', title: '昵称' },
  { dataIndex: 'roleNames', key: 'roleNames', title: '角色' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { key: 'actions', title: '操作', width: 340 },
];

const createForm = reactive({
  nickname: '',
  password: '',
  roleIds: [] as number[],
  username: '',
});

const editForm = reactive({
  adminId: undefined as number | undefined,
  nickname: '',
  username: '',
});

const roleForm = reactive({
  roleIds: [] as number[],
});

const resetForm = reactive({
  newPassword: '',
});

const canCreate = () => accessStore.accessCodes.includes('system:admin:create');
const canUpdate = () => accessStore.accessCodes.includes('system:admin:update');
const canDelete = () => accessStore.accessCodes.includes('system:admin:delete');
const canAssign = () => accessStore.accessCodes.includes('system:admin:assign');
const canResetPwd = () =>
  accessStore.accessCodes.includes('system:admin:resetpwd');

async function loadData() {
  loading.value = true;
  try {
    const res = await getAdminListApi({
      page: pagination.current,
      size: pagination.pageSize,
      status: filters.status,
      username: filters.username || undefined,
    });
    dataSource.value = res.list ?? [];
    total.value = res.total ?? 0;
  } finally {
    loading.value = false;
  }
}

async function loadRoleOptions() {
  const res = await getRoleListApi({ page: 1, size: 500 });
  roleOptions.value = (res.list || []).map((item) => ({
    label: item.roleName || `角色#${item.id}`,
    value: item.id,
  }));
}

function onSearch() {
  pagination.current = 1;
  loadData();
}

function onReset() {
  filters.status = undefined;
  filters.username = '';
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

function openCreate() {
  createForm.username = '';
  createForm.password = '';
  createForm.nickname = '';
  createForm.roleIds = [];
  createOpen.value = true;
}

async function submitCreate() {
  if (!createForm.username || !createForm.password) {
    message.warning('请输入用户名和密码');
    return;
  }
  actionLoading.value = true;
  try {
    await createAdminApi({
      nickname: createForm.nickname || undefined,
      password: createForm.password,
      roleIds: createForm.roleIds,
      username: createForm.username,
    });
    message.success('创建管理员成功');
    createOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

function openEdit(record: AdminItem) {
  editForm.adminId = record.id;
  editForm.username = record.username || '';
  editForm.nickname = record.nickname || '';
  editOpen.value = true;
}

async function submitEdit() {
  if (!editForm.adminId) return;
  actionLoading.value = true;
  try {
    await updateAdminApi({
      adminId: editForm.adminId,
      nickname: editForm.nickname || undefined,
      username: editForm.username || undefined,
    });
    message.success('更新管理员成功');
    editOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

async function changeStatus(record: AdminItem, status: number) {
  await updateAdminStatusApi({ adminId: record.id, status });
  message.success('状态更新成功');
  await loadData();
}

async function removeAdmin(record: AdminItem) {
  await deleteAdminApi({ adminId: record.id });
  message.success('删除管理员成功');
  await loadData();
}

async function openAssignRole(record: AdminItem) {
  currentAdminId.value = record.id;
  roleForm.roleIds = [];
  const detail = await getAdminDetailApi({ adminId: record.id });
  roleForm.roleIds = (detail.roles || []).map((r) => r.id);
  roleOpen.value = true;
}

async function submitAssignRole() {
  if (!currentAdminId.value) return;
  actionLoading.value = true;
  try {
    await assignUserRoleApi({
      adminId: currentAdminId.value,
      roleIds: roleForm.roleIds,
    });
    message.success('角色分配成功');
    roleOpen.value = false;
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

function openResetPwd(record: AdminItem) {
  currentAdminId.value = record.id;
  resetForm.newPassword = '';
  resetOpen.value = true;
}

async function submitResetPwd() {
  if (!currentAdminId.value || !resetForm.newPassword) {
    message.warning('请输入新密码');
    return;
  }
  actionLoading.value = true;
  try {
    await resetAdminPasswordApi({
      adminId: currentAdminId.value,
      newPassword: resetForm.newPassword,
    });
    message.success('重置密码成功');
    resetOpen.value = false;
  } finally {
    actionLoading.value = false;
  }
}

loadRoleOptions();
loadData();
</script>

<template>
  <Page title="管理员管理">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="用户名">
          <Input
            v-model:value="filters.username"
            allow-clear
            placeholder="请输入用户名"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="filters.status"
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
              新增管理员
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
          <template v-if="column.key === 'roleNames'">
            {{ (record.roleNames || []).join(', ') || '-' }}
          </template>
          <template v-else-if="column.key === 'status'">
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
                @click="openEdit(record as AdminItem)"
              >
                编辑
              </Button>
              <Button
                v-if="canUpdate() && (record as AdminItem).status !== 1"
                size="small"
                type="link"
                @click="changeStatus(record as AdminItem, 1)"
              >
                启用
              </Button>
              <Button
                v-if="canUpdate() && (record as AdminItem).status === 1"
                size="small"
                type="link"
                @click="changeStatus(record as AdminItem, 0)"
              >
                禁用
              </Button>
              <Button
                v-if="canAssign()"
                size="small"
                type="link"
                @click="openAssignRole(record as AdminItem)"
              >
                分配角色
              </Button>
              <Button
                v-if="canResetPwd()"
                size="small"
                type="link"
                @click="openResetPwd(record as AdminItem)"
              >
                重置密码
              </Button>
              <Popconfirm
                v-if="canDelete()"
                title="确认删除该管理员？"
                @confirm="removeAdmin(record as AdminItem)"
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
      title="新增管理员"
      @ok="submitCreate"
    >
      <Form layout="vertical">
        <Form.Item label="用户名" required>
          <Input v-model:value="createForm.username" />
        </Form.Item>
        <Form.Item label="密码" required>
          <Input v-model:value="createForm.password" type="password" />
        </Form.Item>
        <Form.Item label="昵称">
          <Input v-model:value="createForm.nickname" />
        </Form.Item>
        <Form.Item label="角色">
          <Select
            v-model:value="createForm.roleIds"
            :options="roleOptions"
            mode="multiple"
            placeholder="请选择角色"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="editOpen"
      :confirm-loading="actionLoading"
      title="编辑管理员"
      @ok="submitEdit"
    >
      <Form layout="vertical">
        <Form.Item label="用户名">
          <Input v-model:value="editForm.username" />
        </Form.Item>
        <Form.Item label="昵称">
          <Input v-model:value="editForm.nickname" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="roleOpen"
      :confirm-loading="actionLoading"
      title="分配角色"
      @ok="submitAssignRole"
    >
      <Form layout="vertical">
        <Form.Item label="角色">
          <Select
            v-model:value="roleForm.roleIds"
            :options="roleOptions"
            mode="multiple"
            placeholder="请选择角色"
          />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="resetOpen"
      :confirm-loading="actionLoading"
      title="重置密码"
      @ok="submitResetPwd"
    >
      <Form layout="vertical">
        <Form.Item label="新密码" required>
          <Input v-model:value="resetForm.newPassword" type="password" />
        </Form.Item>
      </Form>
    </Modal>
  </Page>
</template>
