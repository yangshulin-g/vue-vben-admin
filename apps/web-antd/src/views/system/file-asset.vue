<script lang="ts" setup>
import type { FileAssetDetail, FileAssetItem } from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import {
  deleteFileAssetApi,
  getFileAssetDetailApi,
  getFileAssetListApi,
  uploadFileAssetApi,
} from '#/api';

defineOptions({ name: 'SystemFileAssetPage' });

const accessStore = useAccessStore();

const loading = ref(false);
const uploading = ref(false);
const deletingId = ref<number>();
const dataSource = ref<FileAssetItem[]>([]);
const total = ref(0);
const detailOpen = ref(false);
const detailData = ref<FileAssetDetail | null>(null);

const filters = reactive({
  assetName: '',
  assetType: undefined as string | undefined,
  bizType: '',
  provider: undefined as string | undefined,
});

const uploadForm = reactive({
  remark: '',
  type: 'other',
});

const pagination = reactive({
  current: 1,
  pageSize: 10,
});

const providerOptions = [
  { label: '本地存储', value: 'local' },
  { label: '阿里云 OSS', value: 'aliyun-oss' },
  { label: '腾讯云 COS', value: 'tencent-cos' },
  { label: 'MinIO', value: 'minio' },
];

const assetTypeOptions = [
  { label: '图片', value: 'IMAGE' },
  { label: '文件', value: 'FILE' },
];

const bizTypeOptions = [
  { label: '商品', value: 'product' },
  { label: '支付凭证', value: 'voucher' },
  { label: '头像', value: 'avatar' },
  { label: '其他', value: 'other' },
];

const columns = [
  { dataIndex: 'id', key: 'id', title: 'ID', width: 90 },
  { dataIndex: 'assetName', key: 'assetName', title: '文件名' },
  { dataIndex: 'assetType', key: 'assetType', title: '资源类型', width: 120 },
  { dataIndex: 'bizType', key: 'bizType', title: '业务类型', width: 120 },
  { dataIndex: 'provider', key: 'provider', title: '存储', width: 140 },
  { dataIndex: 'fileSize', key: 'fileSize', title: '大小', width: 120 },
  {
    dataIndex: 'uploadedByName',
    key: 'uploadedByName',
    title: '上传人',
    width: 140,
  },
  { dataIndex: 'createdAt', key: 'createdAt', title: '创建时间', width: 180 },
  { key: 'actions', title: '操作', width: 260 },
];

const canList = () =>
  accessStore.accessCodes.includes('system:file-asset:list');
const canDetail = () =>
  accessStore.accessCodes.includes('system:file-asset:detail');
const canUpload = () =>
  accessStore.accessCodes.includes('system:file-asset:upload');
const canDelete = () =>
  accessStore.accessCodes.includes('system:file-asset:delete');

const detailUrl = computed(() => detailData.value?.url || '');
const isImageDetail = computed(() => {
  if (!detailData.value) {
    return false;
  }
  const contentType = (detailData.value.contentType || '').toLowerCase();
  const fileExt = (detailData.value.fileExt || '').toLowerCase();
  return (
    detailData.value.assetType === 'IMAGE' ||
    contentType.startsWith('image/') ||
    ['bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'].includes(fileExt)
  );
});

function formatFileSize(value?: number) {
  if (!value) return '-';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024)
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

async function loadData() {
  if (!canList()) {
    dataSource.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  try {
    const res = await getFileAssetListApi({
      assetName: filters.assetName || undefined,
      assetType: filters.assetType,
      bizType: filters.bizType || undefined,
      page: pagination.current,
      provider: filters.provider,
      size: pagination.pageSize,
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
  filters.assetName = '';
  filters.assetType = undefined;
  filters.bizType = '';
  filters.provider = undefined;
  pagination.current = 1;
  loadData();
}

function onTableChange(page: number, pageSize: number) {
  pagination.current = page;
  pagination.pageSize = pageSize;
  loadData();
}

async function openDetail(record: FileAssetItem) {
  if (!canDetail()) {
    return;
  }
  detailData.value = await getFileAssetDetailApi({ id: record.id });
  detailOpen.value = true;
}

async function removeAsset(record: FileAssetItem) {
  deletingId.value = record.id;
  try {
    await deleteFileAssetApi({ id: record.id });
    message.success('删除文件资源成功');
    await loadData();
  } finally {
    deletingId.value = undefined;
  }
}

async function copyUrl(record: FileAssetDetail | FileAssetItem | null) {
  const url = record?.url;
  if (!url) {
    message.warning('当前资源没有可复制的地址');
    return;
  }
  await navigator.clipboard.writeText(url);
  message.success('已复制文件地址');
}

async function handleUpload(options: any) {
  uploading.value = true;
  try {
    const file = options.file as File;
    await uploadFileAssetApi(file, {
      remark: uploadForm.remark || undefined,
      type: uploadForm.type,
    });
    options.onSuccess?.({});
    message.success('文件上传成功');
    await loadData();
  } catch (error: any) {
    options.onError?.(error);
    message.error(error?.message || '文件上传失败');
  } finally {
    uploading.value = false;
  }
}

loadData();
</script>

<template>
  <Page title="文件资源库">
    <Card class="mb-4">
      <Form layout="inline">
        <Form.Item label="文件名">
          <Input
            v-model:value="filters.assetName"
            allow-clear
            placeholder="请输入文件名"
          />
        </Form.Item>
        <Form.Item label="资源类型">
          <Select
            v-model:value="filters.assetType"
            :options="assetTypeOptions"
            allow-clear
            placeholder="请选择资源类型"
            style="width: 140px"
          />
        </Form.Item>
        <Form.Item label="业务类型">
          <Select
            v-model:value="filters.bizType"
            :options="bizTypeOptions"
            allow-clear
            placeholder="请选择业务类型"
            style="width: 160px"
          />
        </Form.Item>
        <Form.Item label="存储方式">
          <Select
            v-model:value="filters.provider"
            :options="providerOptions"
            allow-clear
            placeholder="请选择存储方式"
            style="width: 160px"
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" @click="onSearch">查询</Button>
            <Button @click="onReset">重置</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>

    <Card>
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <Select
          v-model:value="uploadForm.type"
          :options="bizTypeOptions"
          style="width: 160px"
        />
        <Input
          v-model:value="uploadForm.remark"
          placeholder="上传备注，可选"
          style="width: 240px"
        />
        <Upload
          v-if="canUpload()"
          :custom-request="handleUpload"
          :show-upload-list="false"
        >
          <Button :loading="uploading" type="primary">
            {{ uploading ? '上传中...' : '上传文件' }}
          </Button>
        </Upload>
      </div>

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
          <template v-if="column.key === 'assetType'">
            <Tag
              :color="record.assetType === 'IMAGE' ? 'processing' : 'default'"
            >
              {{ record.assetType === 'IMAGE' ? '图片' : '文件' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'provider'">
            <Tag>{{ record.provider || '-' }}</Tag>
          </template>
          <template v-else-if="column.key === 'fileSize'">
            {{ formatFileSize(record.fileSize) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space wrap>
              <Button
                v-if="canDetail()"
                size="small"
                type="link"
                @click="openDetail(record as FileAssetItem)"
              >
                详情
              </Button>
              <Button
                size="small"
                type="link"
                @click="copyUrl(record as FileAssetItem)"
              >
                复制地址
              </Button>
              <Popconfirm
                v-if="canDelete()"
                title="确认删除该文件资源？"
                @confirm="removeAsset(record as FileAssetItem)"
              >
                <Button
                  :loading="deletingId === record.id"
                  danger
                  size="small"
                  type="link"
                >
                  删除
                </Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Modal
      v-model:open="detailOpen"
      destroy-on-close
      :footer="null"
      title="文件资源详情"
      width="760px"
    >
      <div class="space-y-4">
        <div
          v-if="isImageDetail && detailUrl"
          class="flex justify-center rounded border border-dashed border-gray-200 bg-gray-50 p-4"
        >
          <Image :src="detailUrl" style="max-height: 320px" />
        </div>
        <Descriptions :column="2" bordered size="small">
          <Descriptions.Item label="ID">{{ detailData?.id }}</Descriptions.Item>
          <Descriptions.Item label="文件名">
            {{ detailData?.assetName || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="资源类型">
            {{ detailData?.assetType || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="业务类型">
            {{ detailData?.bizType || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="存储提供方">
            {{ detailData?.provider || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="文件大小">
            {{ formatFileSize(detailData?.fileSize) }}
          </Descriptions.Item>
          <Descriptions.Item label="文件扩展名">
            {{ detailData?.fileExt || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="内容类型">
            {{ detailData?.contentType || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="桶/容器">
            {{ detailData?.bucketOrContainer || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="对象键">
            {{ detailData?.objectKey || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="上传人">
            {{ detailData?.uploadedByName || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {{ detailData?.createdAt || '-' }}
          </Descriptions.Item>
          <Descriptions.Item label="访问地址" :span="2">
            <div class="flex items-center justify-between gap-3">
              <span class="break-all">{{ detailData?.url || '-' }}</span>
              <Button size="small" type="link" @click="copyUrl(detailData)">
                复制地址
              </Button>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="备注" :span="2">
            {{ detailData?.remark || '-' }}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Modal>
  </Page>
</template>
