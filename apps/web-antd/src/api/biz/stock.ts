import { requestClient } from '#/api/request';

export interface StockAdjustReq {
  changeType: 'MANUAL_ADJUST' | 'MANUAL_IN' | 'MANUAL_OUT';
  quantity: number;
  remark?: string;
  skuCode: string;
}

export interface StockLogQueryReq {
  changeType?: string;
  page: number;
  size: number;
  skuCode?: string;
}

export interface StockChangeLogItem {
  afterStock?: number;
  beforeStock?: number;
  changeQuantity?: number;
  changeType?: string;
  createdAt?: string;
  id?: number;
  operatorName?: string;
  referenceNo?: string;
  remark?: string;
  skuCode?: string;
}

export interface StockAlertItem {
  alertThreshold?: number;
  availableStock?: number;
  productCode?: string;
  productName?: string;
  skuCode?: string;
  stock?: number;
}

export async function stockAdjustApi(data: StockAdjustReq) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/stock/adjust',
    data,
  );
}

export async function getStockLogListApi(data: StockLogQueryReq) {
  return requestClient.post<{ list?: StockChangeLogItem[]; total?: number }>(
    '/api/v1/stock/log/list',
    data,
  );
}

export async function getStockAlertListApi() {
  return requestClient.post<StockAlertItem[]>('/api/v1/stock/alert/list', {});
}

export async function updateStockAlertThresholdApi(data: {
  skuCode: string;
  threshold: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/stock/alert/threshold/update',
    data,
  );
}
