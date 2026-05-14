<script lang="ts" setup>
import type { PaymentConfigDetail } from '#/api';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  message,
  Space,
  Switch,
} from 'ant-design-vue';

import {
  getPaymentConfigDetailApi,
  testPaymentConfigApi,
  updatePaymentConfigApi,
} from '#/api';

defineOptions({ name: 'SystemPaymentConfigPage' });

const accessStore = useAccessStore();
const loading = ref(false);
const saving = ref(false);
const testing = ref(false);

const formState = reactive<PaymentConfigDetail>({
  apiV3Key: '',
  appId: '',
  appSecret: '',
  enableH5: false,
  enableJsapi: false,
  enableNative: false,
  enabled: false,
  mchId: '',
  merchantSerialNo: '',
  notifyUrl: '',
  privateKey: '',
  refundNotifyUrl: '',
  wechatpayPublicKey: '',
});

const canDetail = () =>
  accessStore.accessCodes.includes('system:payment-config:detail');
const canUpdate = () =>
  accessStore.accessCodes.includes('system:payment-config:update');
const canTest = () =>
  accessStore.accessCodes.includes('system:payment-config:test');

function applyDetail(detail: PaymentConfigDetail) {
  Object.assign(formState, detail);
}

function payload(): PaymentConfigDetail {
  return { ...formState };
}

async function loadDetail() {
  if (!canDetail()) return;
  loading.value = true;
  try {
    applyDetail(await getPaymentConfigDetailApi());
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  if (!canUpdate()) return;
  saving.value = true;
  try {
    await updatePaymentConfigApi(payload());
    message.success('支付配置已保存');
    await loadDetail();
  } catch {
    // 全局拦截器已展示具体错误
  } finally {
    saving.value = false;
  }
}

async function testConfig() {
  if (!canTest()) return;
  testing.value = true;
  try {
    await testPaymentConfigApi(payload());
    message.success('配置格式校验通过');
  } catch {
    // 全局拦截器已展示具体错误
  } finally {
    testing.value = false;
  }
}

loadDetail();
</script>

<template>
  <Page title="支付配置">
    <Alert
      class="mb-4"
      message="第一批仅支持微信支付商户模式。密钥字段回显会脱敏，保存 ******** 表示保留旧值。"
      show-icon
      type="warning"
    />

    <Card :loading="loading">
      <Form layout="vertical">
        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Form.Item label="启用微信支付">
            <Switch
              v-model:checked="formState.enabled"
              :disabled="!canUpdate()"
            />
          </Form.Item>
          <Form.Item label="启用支付形态">
            <Space wrap>
              <span>H5</span>
              <Switch
                v-model:checked="formState.enableH5"
                :disabled="!canUpdate()"
              />
              <span>JSAPI</span>
              <Switch
                v-model:checked="formState.enableJsapi"
                :disabled="!canUpdate()"
              />
              <span>Native</span>
              <Switch
                v-model:checked="formState.enableNative"
                :disabled="!canUpdate()"
              />
            </Space>
          </Form.Item>

          <Form.Item label="AppID">
            <Input v-model:value="formState.appId" :disabled="!canUpdate()" />
          </Form.Item>
          <Form.Item label="AppSecret">
            <Input.Password
              v-model:value="formState.appSecret"
              :disabled="!canUpdate()"
            />
          </Form.Item>
          <Form.Item label="商户号 mchId">
            <Input v-model:value="formState.mchId" :disabled="!canUpdate()" />
          </Form.Item>
          <Form.Item label="APIv3 Key">
            <Input.Password
              v-model:value="formState.apiV3Key"
              :disabled="!canUpdate()"
            />
          </Form.Item>
          <Form.Item label="商户证书序列号">
            <Input
              v-model:value="formState.merchantSerialNo"
              :disabled="!canUpdate()"
            />
          </Form.Item>
          <Form.Item label="微信支付平台公钥">
            <Input.TextArea
              v-model:value="formState.wechatpayPublicKey"
              :auto-size="{ minRows: 3, maxRows: 8 }"
              :disabled="!canUpdate()"
            />
          </Form.Item>
          <Form.Item label="商户私钥" class="lg:col-span-2">
            <Input.TextArea
              v-model:value="formState.privateKey"
              :auto-size="{ minRows: 4, maxRows: 12 }"
              :disabled="!canUpdate()"
            />
          </Form.Item>
          <Form.Item label="支付回调地址">
            <Input
              v-model:value="formState.notifyUrl"
              :disabled="!canUpdate()"
            />
          </Form.Item>
          <Form.Item label="退款回调地址">
            <Input
              v-model:value="formState.refundNotifyUrl"
              :disabled="!canUpdate()"
            />
          </Form.Item>
        </div>

        <Space>
          <Button
            :disabled="!canUpdate()"
            :loading="saving"
            type="primary"
            @click="saveConfig"
          >
            保存配置
          </Button>
          <Button :disabled="!canTest()" :loading="testing" @click="testConfig">
            测试配置
          </Button>
        </Space>
      </Form>
    </Card>
  </Page>
</template>
