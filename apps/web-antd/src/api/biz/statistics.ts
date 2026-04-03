import { requestClient } from '#/api/request';

export interface DateRangeReq {
  endDate?: string;
  startDate?: string;
}

export interface SalesStatisticsRes {
  cancelledOrders?: number;
  completedOrders?: number;
  dailySales?: Array<{
    date?: string;
    orderCount?: number;
    salesAmount?: number;
  }>;
  pendingOrders?: number;
  totalCustomers?: number;
  totalOrders?: number;
  totalSalesAmount?: number;
}

export interface InventoryStatisticsRes {
  lowStockItems?: Array<{
    productCode?: string;
    productName?: string;
    skuCode?: string;
    stock?: number;
  }>;
  lowStockSkuCount?: number;
  totalProducts?: number;
  totalSkus?: number;
  totalStock?: number;
  totalStockValue?: number;
}

export interface PaymentStatisticsRes {
  paymentMethodStats?: Array<{
    count?: number;
    method?: string;
    totalAmount?: number;
  }>;
  totalPaymentAmount?: number;
  totalPaymentCount?: number;
}

export async function getSalesStatisticsApi(data: DateRangeReq) {
  return requestClient.post<SalesStatisticsRes>(
    '/api/v1/statistics/sales',
    data,
  );
}

export async function getInventoryStatisticsApi(data: {
  lowStockThreshold?: number;
}) {
  return requestClient.post<InventoryStatisticsRes>(
    '/api/v1/statistics/inventory',
    data,
  );
}

export async function getPaymentStatisticsApi(data: DateRangeReq) {
  return requestClient.post<PaymentStatisticsRes>(
    '/api/v1/statistics/payment',
    data,
  );
}
