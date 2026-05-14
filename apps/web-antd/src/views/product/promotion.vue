<script lang="ts" setup>
import type { PromotionItem } from '#/api';

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
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createPromotionApi,
  getPromotionDetailApi,
  getPromotionListApi,
  updatePromotionApi,
  updatePromotionStatusApi,
} from '#/api';

defineOptions({ name: 'PromotionPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const saveLoading = ref(false);
const detailLoading = ref(false);
const actionLoading = ref(false);
const dataSource = ref<PromotionItem[]>([]);
const total = ref(0);
const saveOpen = ref(false);
const detailOpen = ref(false);
const detailData = ref<null | PromotionItem>(null);

const filters = reactive({
  activityName: '',
  activityType: undefined as string | undefined,
  status: undefined as string | undefined,
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const saveForm = reactive({
  activityName: '',
  activityType: 'FULL_REDUCTION',
  discountAmount: undefined as number | undefined,
  endAt: '',
  id: undefined as number | undefined,
  remark: '',
  skuItems: [
    {
      activityPrice: 0,
      skuCode: '',
      tempKey: `${Date.now()}`,
    },
  ],
  startAt: '',
  status: 'DRAFT',
  thresholdAmount: undefined as number | undefined,
});

const typeOptions = [
  { label: '满减', value: 'FULL_REDUCTION' },
  { label: '限时价', value: 'LIMITED_PRICE' },
];

const statusOptions = [
  { label: '草稿', value: 'DRAFT' },
  { label: '启用', value: 'ACTIVE' },
  { label: '暂停', value: 'PAUSED' },
  { label: '结束', value: 'ENDED' },
];

const statusText: Record<string, string> = {
  ACTIVE: '启用',
  DRAFT: '草稿',
  ENDED: '结束',
  PAUSED: '暂停',
};

const statusColor: Record<string, string> = {
  ACTIVE: 'success',
  DRAFT: 'default',
  ENDED: 'default',
  PAUSED: 'warning',
};

const columns = [
  { dataIndex: 'activityName', key: 'activityName', title: '活动名称' },
  { dataIndex: 'activityType', key: 'activityType', title: '类型' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  { dataIndex: 'startAt', key: 'startAt', title: '开始时间' },
  { dataIndex: 'endAt', key: 'endAt', title: '结束时间' },
  { key: 'actions', title: '操作', width: 260 },
];

const skuColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'activityPrice', key: 'activityPrice', title: '活动价' },
];

const canList = () => accessStore.accessCodes.includes('promotion:list');
const canDetail = () => accessStore.accessCodes.includes('promotion:detail');
const canCreate = () => accessStore.accessCodes.includes('promotion:create');
const canUpdate = () => accessStore.accessCodes.includes('promotion:update');
const canStatus = () => accessStore.accessCodes.includes('promotion:status');

function createEmptySkuItem() {
  return {
    activityPrice: 0,
    skuCode: '',
    tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

function resetSaveForm() {
  saveForm.id = undefined;
  saveForm.activityName = '';
  saveForm.activityType = 'FULL_REDUCTION';
  saveForm.status = 'DRAFT';
  saveForm.startAt = '';
  saveForm.endAt = '';
  saveForm.thresholdAmount = undefined;
  saveForm.discountAmount = undefined;
  saveForm.remark = '';
  saveForm.skuItems = [createEmptySkuItem()];
}

function addSkuItem() {
  saveForm.skuItems.push(createEmptySkuItem());
}

function removeSkuItem(tempKey: string) {
  if (saveForm.skuItems.length <= 1) {
    message.warning('至少保留一条限时价 SKU');
    return;
  }
  saveForm.skuItems = saveForm.skuItems.filter(
    (item) => item.tempKey !== tempKey,
  );
}

async function loadData() {
  if (!canList()) return;
  loading.value = true;
  try {
    const res = await getPromotionListApi({
      activityName: filters.activityName || undefined,
      activityType: filters.activityType,
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

function onSearch() {
  pagination.current = 1;
  loadData();
}

function onReset() {
  filters.activityName = '';
  filters.activityType = undefined;
  filters.status = undefined;
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

function openCreate() {
  resetSaveForm();
  saveOpen.value = true;
}

async function openEdit(record: any) {
  if (!canUpdate()) return;
  const detail = await getPromotionDetailApi({ id: record.id });
  saveForm.id = detail.id;
  saveForm.activityName = detail.activityName || '';
  saveForm.activityType = detail.activityType || 'FULL_REDUCTION';
  saveForm.status = detail.status || 'DRAFT';
  saveForm.startAt = detail.startAt || '';
  saveForm.endAt = detail.endAt || '';
  saveForm.thresholdAmount = Number(detail.thresholdAmount ?? 0);
  saveForm.discountAmount = Number(detail.discountAmount ?? 0);
  saveForm.remark = detail.remark || '';
  saveForm.skuItems = detail.skuItems?.map((item) => ({
    activityPrice: Number(item.activityPrice ?? 0),
    skuCode: item.skuCode || '',
    tempKey: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  })) ?? [createEmptySkuItem()];
  saveOpen.value = true;
}

function buildSavePayload() {
  if (!saveForm.activityName.trim()) {
    throw new Error('请填写活动名称');
  }
  const payload = {
    activityName: saveForm.activityName.trim(),
    activityType: saveForm.activityType,
    discountAmount: saveForm.discountAmount,
    endAt: saveForm.endAt || undefined,
    remark: saveForm.remark || undefined,
    skuItems: undefined as
      | Array<{ activityPrice: number; skuCode: string }>
      | undefined,
    startAt: saveForm.startAt || undefined,
    status: saveForm.status,
    thresholdAmount: saveForm.thresholdAmount,
  };
  if (saveForm.activityType === 'LIMITED_PRICE') {
    payload.skuItems = saveForm.skuItems.map((item) => ({
      activityPrice: Number(item.activityPrice),
      skuCode: item.skuCode.trim(),
    }));
    if (payload.skuItems.some((item) => !item.skuCode)) {
      throw new Error('请填写限时价 SKU');
    }
  }
  return payload;
}

async function submitSave() {
  saveLoading.value = true;
  try {
    const payload = buildSavePayload();
    if (saveForm.id) {
      await updatePromotionApi({ ...payload, id: saveForm.id });
      message.success('营销活动已更新');
    } else {
      await createPromotionApi(payload);
      message.success('营销活动已创建');
    }
    saveOpen.value = false;
    await loadData();
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    saveLoading.value = false;
  }
}

async function openDetail(record: any) {
  if (!canDetail()) return;
  detailOpen.value = true;
  detailLoading.value = true;
  try {
    detailData.value = await getPromotionDetailApi({ id: record.id });
  } finally {
    detailLoading.value = false;
  }
}

async function changeStatus(record: any, status: string) {
  actionLoading.value = true;
  try {
    await updatePromotionStatusApi({ id: record.id, status });
    message.success('营销活动状态已更新');
    await loadData();
  } finally {
    actionLoading.value = false;
  }
}

loadData();
</script>

<template>
  <Page title="营销活动">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="活动名称">
          <Input
            v-model:value="filters.activityName"
            allow-clear
            placeholder="请输入活动名称"
          />
        </Form.Item>
        <Form.Item label="类型">
          <Select
            v-model:value="filters.activityType"
            :options="typeOptions"
            allow-clear
            placeholder="请选择类型"
            style="width: 140px"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select
            v-model:value="filters.status"
            :options="statusOptions"
            allow-clear
            placeholder="请选择状态"
            style="width: 140px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button v-if="canCreate()" type="dashed" @click="openCreate">
              新增活动
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
          <template v-if="column.key === 'activityType'">
            {{ record.activityType === 'LIMITED_PRICE' ? '限时价' : '满减' }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColor[record.status] || 'default'">
              {{ statusText[record.status] || record.status || '-' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space>
              <Button size="small" type="link" @click="openDetail(record)">
                详情
              </Button>
              <Button
                v-if="canUpdate()"
                size="small"
                type="link"
                @click="openEdit(record)"
              >
                编辑
              </Button>
              <Select
                v-if="canStatus()"
                :options="statusOptions"
                placeholder="改状态"
                size="small"
                style="width: 100px"
                @change="(value) => changeStatus(record, String(value))"
              />
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="saveOpen"
      :confirm-loading="saveLoading"
      :title="saveForm.id ? '编辑营销活动' : '新增营销活动'"
      width="760px"
      @ok="submitSave"
    >
      <Form layout="vertical">
        <Form.Item label="活动名称" required>
          <Input v-model:value="saveForm.activityName" allow-clear />
        </Form.Item>
        <Form.Item label="活动类型" required>
          <Select
            v-model:value="saveForm.activityType"
            :options="typeOptions"
          />
        </Form.Item>
        <Form.Item label="状态">
          <Select v-model:value="saveForm.status" :options="statusOptions" />
        </Form.Item>
        <Space>
          <Form.Item label="开始时间">
            <Input
              v-model:value="saveForm.startAt"
              placeholder="2026-05-07T09:00:00"
            />
          </Form.Item>
          <Form.Item label="结束时间">
            <Input
              v-model:value="saveForm.endAt"
              placeholder="2026-05-31T23:59:59"
            />
          </Form.Item>
        </Space>
        <template v-if="saveForm.activityType === 'FULL_REDUCTION'">
          <Space>
            <Form.Item label="满减门槛" required>
              <InputNumber v-model:value="saveForm.thresholdAmount" :min="0" />
            </Form.Item>
            <Form.Item label="减免金额" required>
              <InputNumber v-model:value="saveForm.discountAmount" :min="0" />
            </Form.Item>
          </Space>
        </template>
        <template v-else>
          <Table
            :columns="[
              { key: 'skuCode', title: 'SKU编码' },
              { key: 'activityPrice', title: '活动价' },
              { key: 'actions', title: '操作', width: 80 },
            ]"
            :data-source="saveForm.skuItems"
            :pagination="false"
            row-key="tempKey"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'skuCode'">
                <Input v-model:value="record.skuCode" placeholder="SKU编码" />
              </template>
              <template v-else-if="column.key === 'activityPrice'">
                <InputNumber
                  v-model:value="record.activityPrice"
                  :min="0.01"
                  style="width: 140px"
                />
              </template>
              <template v-else-if="column.key === 'actions'">
                <Button
                  size="small"
                  type="link"
                  @click="removeSkuItem(record.tempKey)"
                >
                  删除
                </Button>
              </template>
            </template>
          </Table>
          <Button class="mt-3" type="dashed" @click="addSkuItem">
            添加 SKU
          </Button>
        </template>
        <Form.Item class="mt-4" label="备注">
          <Input v-model:value="saveForm.remark" allow-clear />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="detailOpen"
      :footer="null"
      title="营销活动详情"
      width="760px"
    >
      <Descriptions v-if="detailData" bordered :column="2" size="small">
        <Descriptions.Item label="活动名称">
          {{ detailData.activityName }}
        </Descriptions.Item>
        <Descriptions.Item label="类型">
          {{ detailData.activityType === 'LIMITED_PRICE' ? '限时价' : '满减' }}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {{ statusText[detailData.status || ''] || detailData.status }}
        </Descriptions.Item>
        <Descriptions.Item label="满减">
          {{ detailData.thresholdAmount || '-' }} /
          {{ detailData.discountAmount || '-' }}
        </Descriptions.Item>
      </Descriptions>
      <Table
        v-if="detailData?.activityType === 'LIMITED_PRICE'"
        class="mt-4"
        :columns="skuColumns"
        :data-source="detailData?.skuItems || []"
        :loading="detailLoading"
        :pagination="false"
        row-key="id"
        size="small"
      />
    </Modal>
  </Page>
</template>
