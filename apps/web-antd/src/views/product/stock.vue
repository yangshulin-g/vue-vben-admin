<script lang="ts" setup>
import type { StockAlertItem, StockChangeLogItem } from '#/api';

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
  Select,
  Space,
  Table,
  Tabs,
} from 'ant-design-vue';

import {
  getStockAlertListApi,
  getStockLogListApi,
  stockAdjustApi,
  updateStockAlertThresholdApi,
} from '#/api';

defineOptions({ name: 'StockManagePage' });

const accessStore = useAccessStore();
const activeKey = ref('adjust');

const canAdjust = () => accessStore.accessCodes.includes('stock:adjust');
const canLogList = () => accessStore.accessCodes.includes('stock:log:list');
const canAlertList = () => accessStore.accessCodes.includes('stock:alert:list');
const canAlertUpdate = () =>
  accessStore.accessCodes.includes('stock:alert:update');

const adjustLoading = ref(false);
const adjustForm = reactive({
  changeType: 'MANUAL_IN' as 'MANUAL_ADJUST' | 'MANUAL_IN' | 'MANUAL_OUT',
  quantity: 1,
  remark: '',
  skuCode: '',
});

const changeTypeOptions = [
  { label: '手动入库', value: 'MANUAL_IN' },
  { label: '手动出库', value: 'MANUAL_OUT' },
  { label: '手动调整', value: 'MANUAL_ADJUST' },
];

const logLoading = ref(false);
const logDataSource = ref<StockChangeLogItem[]>([]);
const logTotal = ref(0);
const logFilters = reactive({
  changeType: undefined as string | undefined,
  skuCode: '',
});
const logPagination = reactive({
  current: 1,
  pageSize: 10,
});
const logColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'changeType', key: 'changeType', title: '变动类型' },
  { dataIndex: 'changeQuantity', key: 'changeQuantity', title: '变动数量' },
  { dataIndex: 'beforeStock', key: 'beforeStock', title: '变动前库存' },
  { dataIndex: 'afterStock', key: 'afterStock', title: '变动后库存' },
  { dataIndex: 'operatorName', key: 'operatorName', title: '操作人' },
  { dataIndex: 'remark', key: 'remark', title: '备注' },
  { dataIndex: 'createdAt', key: 'createdAt', title: '时间' },
];

const alertLoading = ref(false);
const alertDataSource = ref<StockAlertItem[]>([]);
const alertColumns = [
  { dataIndex: 'skuCode', key: 'skuCode', title: 'SKU编码' },
  { dataIndex: 'productCode', key: 'productCode', title: '商品编码' },
  { dataIndex: 'productName', key: 'productName', title: '商品名称' },
  { dataIndex: 'stock', key: 'stock', title: '当前库存' },
  { dataIndex: 'alertThreshold', key: 'alertThreshold', title: '预警阈值' },
];
const thresholdForm = reactive({
  skuCode: '',
  threshold: 10,
});
const thresholdLoading = ref(false);

async function submitAdjust() {
  if (!adjustForm.skuCode.trim() || adjustForm.quantity <= 0) {
    message.warning('请填写SKU编码和有效数量');
    return;
  }
  adjustLoading.value = true;
  try {
    await stockAdjustApi({
      changeType: adjustForm.changeType,
      quantity: adjustForm.quantity,
      remark: adjustForm.remark || undefined,
      skuCode: adjustForm.skuCode.trim(),
    });
    message.success('库存调整成功');
    adjustForm.quantity = 1;
    adjustForm.remark = '';
    await loadLogList();
    await loadAlertList();
  } finally {
    adjustLoading.value = false;
  }
}

async function loadLogList() {
  if (!canLogList()) return;
  logLoading.value = true;
  try {
    const res = await getStockLogListApi({
      changeType: logFilters.changeType,
      page: logPagination.current,
      size: logPagination.pageSize,
      skuCode: logFilters.skuCode || undefined,
    });
    logDataSource.value = res.list ?? [];
    logTotal.value = res.total ?? 0;
  } finally {
    logLoading.value = false;
  }
}

function onLogSearch() {
  logPagination.current = 1;
  loadLogList();
}

function onLogReset() {
  logFilters.changeType = undefined;
  logFilters.skuCode = '';
  logPagination.current = 1;
  loadLogList();
}

function onLogTableChange(page: number, pageSize: number) {
  logPagination.current = page;
  logPagination.pageSize = pageSize;
  loadLogList();
}

async function loadAlertList() {
  if (!canAlertList()) return;
  alertLoading.value = true;
  try {
    alertDataSource.value = (await getStockAlertListApi()) ?? [];
  } finally {
    alertLoading.value = false;
  }
}

async function submitThreshold() {
  if (!thresholdForm.skuCode.trim() || thresholdForm.threshold < 0) {
    message.warning('请填写SKU编码和有效阈值');
    return;
  }
  thresholdLoading.value = true;
  try {
    await updateStockAlertThresholdApi({
      skuCode: thresholdForm.skuCode.trim(),
      threshold: thresholdForm.threshold,
    });
    message.success('预警阈值更新成功');
    await loadAlertList();
  } finally {
    thresholdLoading.value = false;
  }
}

loadLogList();
loadAlertList();
</script>

<template>
  <Page title="库存管理">
    <Card>
      <Tabs v-model:active-key="activeKey">
        <Tabs.TabPane key="adjust" tab="手动调整">
          <Form layout="vertical">
            <Form.Item label="SKU编码" required>
              <Input
                v-model:value="adjustForm.skuCode"
                allow-clear
                placeholder="请输入SKU编码"
                style="max-width: 420px"
              />
            </Form.Item>
            <Form.Item label="变动类型" required>
              <Select
                v-model:value="adjustForm.changeType"
                :options="changeTypeOptions"
                style="max-width: 220px"
              />
            </Form.Item>
            <Form.Item label="数量" required>
              <InputNumber
                v-model:value="adjustForm.quantity"
                :min="1"
                style="width: 100%; max-width: 220px"
              />
            </Form.Item>
            <Form.Item label="备注">
              <Input
                v-model:value="adjustForm.remark"
                allow-clear
                placeholder="可选，记录本次调整原因"
                style="max-width: 540px"
              />
            </Form.Item>
            <Button
              v-if="canAdjust()"
              :loading="adjustLoading"
              type="primary"
              @click="submitAdjust"
            >
              提交调整
            </Button>
          </Form>
        </Tabs.TabPane>

        <Tabs.TabPane key="log" tab="库存变动记录">
          <Card class="mb-4">
            <Form layout="inline">
              <Form.Item label="SKU编码">
                <Input
                  v-model:value="logFilters.skuCode"
                  allow-clear
                  placeholder="请输入SKU编码"
                />
              </Form.Item>
              <Form.Item label="变动类型">
                <Select
                  v-model:value="logFilters.changeType"
                  :options="changeTypeOptions"
                  allow-clear
                  placeholder="请选择类型"
                  style="width: 180px"
                />
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" @click="onLogSearch">查询</Button>
                  <Button @click="onLogReset">重置</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
          <Table
            :columns="logColumns"
            :data-source="logDataSource"
            :loading="logLoading"
            :pagination="{
              current: logPagination.current,
              pageSize: logPagination.pageSize,
              total: logTotal,
              showSizeChanger: true,
              onChange: onLogTableChange,
              onShowSizeChange: onLogTableChange,
            }"
            row-key="id"
          />
        </Tabs.TabPane>

        <Tabs.TabPane key="alert" tab="低库存预警">
          <Card class="mb-4">
            <Form layout="inline">
              <Form.Item label="SKU编码">
                <Input
                  v-model:value="thresholdForm.skuCode"
                  allow-clear
                  placeholder="请输入SKU编码"
                />
              </Form.Item>
              <Form.Item label="阈值">
                <InputNumber v-model:value="thresholdForm.threshold" :min="0" />
              </Form.Item>
              <Form.Item>
                <Button
                  v-if="canAlertUpdate()"
                  :loading="thresholdLoading"
                  type="primary"
                  @click="submitThreshold"
                >
                  更新阈值
                </Button>
              </Form.Item>
            </Form>
          </Card>
          <Table
            :columns="alertColumns"
            :data-source="alertDataSource"
            :loading="alertLoading"
            :pagination="false"
            row-key="skuCode"
          />
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
