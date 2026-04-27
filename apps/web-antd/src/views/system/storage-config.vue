<script lang="ts" setup>
import type { StorageConfigDetail } from '#/api';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Select,
  Space,
} from 'ant-design-vue';

import {
  getStorageConfigDetailApi,
  testStorageConfigApi,
  updateStorageConfigApi,
} from '#/api';

defineOptions({ name: 'SystemStorageConfigPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);

const providerOptions = [
  { label: '本地存储', value: 'local' },
  { label: '阿里云 OSS', value: 'aliyun-oss' },
  { label: '腾讯云 COS', value: 'tencent-cos' },
  { label: 'MinIO', value: 'minio' },
];

function createDefaultState(): StorageConfigDetail {
  return {
    provider: 'local',
    restartRequired: true,
    local: {
      basePath: './uploads',
      urlPrefix: '/uploads',
    },
    aliyun: {
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      dirPrefix: '',
      domain: '',
      endpoint: '',
    },
    tencent: {
      bucket: '',
      dirPrefix: '',
      domain: '',
      region: '',
      secretId: '',
      secretKey: '',
    },
    minio: {
      accessKey: '',
      bucket: '',
      dirPrefix: '',
      domain: '',
      endpoint: '',
      secretKey: '',
    },
  };
}

const formState = reactive<StorageConfigDetail>(createDefaultState());

const canDetail = () =>
  accessStore.accessCodes.includes('system:storage:detail');
const canUpdate = () =>
  accessStore.accessCodes.includes('system:storage:update');
const canTest = () => accessStore.accessCodes.includes('system:storage:test');

const isLocal = computed(() => formState.provider === 'local');
const isAliyun = computed(() => formState.provider === 'aliyun-oss');
const isTencent = computed(() => formState.provider === 'tencent-cos');
const isMinio = computed(() => formState.provider === 'minio');

function applyDetail(detail: StorageConfigDetail) {
  const defaults = createDefaultState();
  Object.assign(formState, defaults, {
    ...detail,
    aliyun: { ...defaults.aliyun, ...detail.aliyun },
    local: { ...defaults.local, ...detail.local },
    minio: { ...defaults.minio, ...detail.minio },
    tencent: { ...defaults.tencent, ...detail.tencent },
  });
}

function buildPayload(): StorageConfigDetail {
  return {
    provider: formState.provider,
    local: { ...formState.local },
    aliyun: { ...formState.aliyun },
    tencent: { ...formState.tencent },
    minio: { ...formState.minio },
  };
}

async function loadDetail() {
  if (!canDetail()) {
    return;
  }
  loading.value = true;
  try {
    const detail = await getStorageConfigDetailApi();
    applyDetail(detail);
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  if (!canUpdate()) {
    return;
  }
  saving.value = true;
  try {
    await updateStorageConfigApi(buildPayload());
    message.success('存储配置已保存，重启后端后生效');
  } catch {
    // 全局拦截器已展示具体错误信息
  } finally {
    saving.value = false;
  }
}

async function testConfig() {
  if (!canTest()) {
    return;
  }
  testing.value = true;
  try {
    await testStorageConfigApi(buildPayload());
    message.success('连接测试成功');
  } catch {
    // 全局拦截器已展示具体错误信息
  } finally {
    testing.value = false;
  }
}

loadDetail();
</script>

<template>
  <Page title="存储配置">
    <Alert
      class="mb-4"
      message="当前配置保存在数据库中。保存后需要重启后端，新的存储提供方才会生效。"
      show-icon
      type="warning"
    />

    <Card :loading="loading">
      <Form layout="vertical">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Form.Item label="当前存储提供方" class="lg:col-span-2">
            <Select
              v-model:value="formState.provider"
              :disabled="!canUpdate()"
              :options="providerOptions"
              style="max-width: 320px"
            />
          </Form.Item>

          <template v-if="isLocal">
            <Form.Item label="本地存储目录">
              <Input
                v-model:value="formState.local.basePath"
                :disabled="!canUpdate()"
                placeholder="例如 ./uploads"
              />
            </Form.Item>
            <Form.Item label="访问前缀">
              <Input
                v-model:value="formState.local.urlPrefix"
                :disabled="!canUpdate()"
                placeholder="例如 /uploads"
              />
            </Form.Item>
          </template>

          <template v-if="isAliyun">
            <Form.Item label="Endpoint">
              <Input
                v-model:value="formState.aliyun.endpoint"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="Bucket">
              <Input
                v-model:value="formState.aliyun.bucket"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="AccessKeyId">
              <Input
                v-model:value="formState.aliyun.accessKeyId"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="AccessKeySecret">
              <Input.Password
                v-model:value="formState.aliyun.accessKeySecret"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="自定义域名">
              <Input
                v-model:value="formState.aliyun.domain"
                :disabled="!canUpdate()"
                placeholder="可选"
              />
            </Form.Item>
            <Form.Item label="目录前缀">
              <Input
                v-model:value="formState.aliyun.dirPrefix"
                :disabled="!canUpdate()"
                placeholder="可选"
              />
            </Form.Item>
          </template>

          <template v-if="isTencent">
            <Form.Item label="Bucket">
              <Input
                v-model:value="formState.tencent.bucket"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="Region">
              <Input
                v-model:value="formState.tencent.region"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="SecretId">
              <Input
                v-model:value="formState.tencent.secretId"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="SecretKey">
              <Input.Password
                v-model:value="formState.tencent.secretKey"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="自定义域名">
              <Input
                v-model:value="formState.tencent.domain"
                :disabled="!canUpdate()"
                placeholder="可选"
              />
            </Form.Item>
            <Form.Item label="目录前缀">
              <Input
                v-model:value="formState.tencent.dirPrefix"
                :disabled="!canUpdate()"
                placeholder="可选"
              />
            </Form.Item>
          </template>

          <template v-if="isMinio">
            <Form.Item label="Endpoint">
              <Input
                v-model:value="formState.minio.endpoint"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="Bucket">
              <Input
                v-model:value="formState.minio.bucket"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="AccessKey">
              <Input
                v-model:value="formState.minio.accessKey"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="SecretKey">
              <Input.Password
                v-model:value="formState.minio.secretKey"
                :disabled="!canUpdate()"
              />
            </Form.Item>
            <Form.Item label="自定义域名">
              <Input
                v-model:value="formState.minio.domain"
                :disabled="!canUpdate()"
                placeholder="可选"
              />
            </Form.Item>
            <Form.Item label="目录前缀">
              <Input
                v-model:value="formState.minio.dirPrefix"
                :disabled="!canUpdate()"
                placeholder="可选"
              />
            </Form.Item>
          </template>
        </div>

        <Form.Item class="mt-4">
          <Space>
            <Button v-if="canTest()" :loading="testing" @click="testConfig">
              测试连接
            </Button>
            <Button
              v-if="canUpdate()"
              :loading="saving"
              type="primary"
              @click="saveConfig"
            >
              保存配置
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  </Page>
</template>
