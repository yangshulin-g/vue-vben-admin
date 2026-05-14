import { requestClient } from '#/api/request';

export type OrderStatus = 'CANCELLED' | 'COMPLETED' | 'CREATED' | 'SHIPPED';

export type OrderPaymentStatus = 'FULLY_PAID' | 'PARTIALLY_PAID' | 'UNPAID';

/** 与后端 OrderSourceEnum 一致 */
export type OrderSource = 'ADMIN_PROXY' | 'CUSTOMER_CART';

export interface OrderListReq {
  customerName?: string;
  orderNo?: string;
  page: number;
  paymentStatus?: string;
  size: number;
  status?: string;
}

export interface OrderListItem {
  bizRemark?: string;
  contactPerson?: string;
  contactPhone?: string;
  createdAt?: string;
  customerId: number;
  customerName: string;
  customerRemark?: string;
  discountAmount: number;
  finalAmount: number;
  id: number;
  /** 未迁移的旧数据可能为空 */
  orderSource?: OrderSource;
  orderNo: string;
  paymentStatus?: OrderPaymentStatus;
  status: OrderStatus;
  totalAmount: number;
}

export interface BasePageRes<T> {
  list: T[];
  total: number;
}

export interface OrderDetailReq {
  orderId: number;
}

export interface OrderDetailItem {
  price: number;
  productCode: string;
  productName: string;
  quantity: number;
  skuCode: string;
  specification?: string;
  totalAmount: number;
}

export interface OrderDetailRes {
  bizRemark?: string;
  contactAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  customerName?: string;
  customerRemark?: string;
  discountAmount?: number;
  finalAmount?: number;
  fulfillmentOrders?: FulfillmentItem[];
  holdDeadline?: string;
  id: number;
  items?: OrderDetailItem[];
  orderNo?: string;
  orderSource?: OrderSource;
  paymentStatus?: OrderPaymentStatus;
  status?: OrderStatus;
  totalAmount?: number;
}

export interface AdminCreateOrderReq {
  bizRemark?: string;
  customerId: number;
  customerRemark?: string;
  items: Array<{
    quantity: number;
    skuCode: string;
  }>;
}

export interface FulfillmentItem {
  createdAt?: string;
  customerId?: number;
  customerName?: string;
  finishedAt?: string;
  fulfillmentNo?: string;
  id: number;
  items?: Array<{
    completedQuantity?: number;
    id?: number;
    productCode?: string;
    productName?: string;
    quantity?: number;
    remark?: string;
    skuAttributes?: string;
    skuCode?: string;
  }>;
  logs?: Array<{
    content?: string;
    createdAt?: string;
    id?: number;
    operatorName?: string;
    status?: string;
  }>;
  orderId?: number;
  orderNo?: string;
  planFinishAt?: string;
  planStartAt?: string;
  remark?: string;
  source?: string;
  status?: string;
}

export interface QuoteItem {
  customerId?: number;
  customerGroupId?: number;
  customerGroupName?: string;
  customerName?: string;
  discountAmount?: number;
  finalAmount?: number;
  id: number;
  items?: Array<{
    basePrice?: number;
    id?: number;
    productCode?: string;
    productName?: string;
    quantity?: number;
    quotePrice?: number;
    remark?: string;
    skuAttributes?: string;
    skuCode?: string;
    totalAmount?: number;
  }>;
  quoteNo?: string;
  remark?: string;
  status?: string;
  targetType?: 'CUSTOMER' | 'CUSTOMER_GROUP';
  totalAmount?: number;
  validUntil?: string;
}

export async function getAdminOrderListApi(data: OrderListReq) {
  return requestClient.post<BasePageRes<OrderListItem>>(
    '/api/v1/order/admin/list',
    data,
  );
}

export async function getOrderDetailApi(data: OrderDetailReq) {
  return requestClient.post<OrderDetailRes>('/api/v1/order/detail', data);
}

export async function cancelOrderApi(orderId: number) {
  return requestClient.post<{ success: boolean }>('/api/v1/order/cancel', {
    orderId,
  });
}

export async function confirmShipmentApi(data: {
  forceShip?: boolean;
  forceShipReason?: string;
  orderId: number;
  shippingCompany?: string;
  shippingNo?: string;
}) {
  return requestClient.post<{ shippedAt?: string; success: boolean }>(
    '/api/v1/order/ship',
    data,
  );
}

export async function confirmReceiptApi(orderId: number) {
  return requestClient.post<{ completedAt?: string; success: boolean }>(
    '/api/v1/order/complete',
    { orderId },
  );
}

export async function holdOrderApi(data: {
  holdDeadline: string;
  orderId: number;
}) {
  return requestClient.post<{ success?: boolean }>('/api/v1/order/hold', data);
}

export async function updateOrderRemarkApi(data: {
  bizRemark?: string;
  customerRemark?: string;
  orderId: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/order/remark/update',
    data,
  );
}

export async function adminCreateOrderApi(data: AdminCreateOrderReq) {
  return requestClient.post<{ orderId?: number; orderNo?: string }>(
    '/api/v1/order/admin/create',
    data,
  );
}

export async function getFulfillmentListApi(data: {
  orderId?: number;
  orderNo?: string;
  page: number;
  size: number;
  status?: string;
}) {
  return requestClient.post<BasePageRes<FulfillmentItem>>(
    '/api/v1/fulfillment/list',
    data,
  );
}

export async function getFulfillmentDetailApi(data: { id: number }) {
  return requestClient.post<FulfillmentItem>(
    '/api/v1/fulfillment/detail',
    data,
  );
}

export async function createFulfillmentFromOrderApi(data: {
  orderId: number;
  planFinishAt?: string;
  planStartAt?: string;
  remark?: string;
}) {
  return requestClient.post<FulfillmentItem>(
    '/api/v1/fulfillment/create-from-order',
    data,
  );
}

export async function updateFulfillmentApi(data: {
  id: number;
  planFinishAt?: string;
  planStartAt?: string;
  remark?: string;
}) {
  return requestClient.post<FulfillmentItem>(
    '/api/v1/fulfillment/update',
    data,
  );
}

export async function updateFulfillmentStatusApi(data: {
  id: number;
  remark?: string;
  status: string;
}) {
  return requestClient.post<FulfillmentItem>(
    '/api/v1/fulfillment/status/update',
    data,
  );
}

export async function addFulfillmentProgressLogApi(data: {
  content: string;
  fulfillmentId: number;
}) {
  return requestClient.post<FulfillmentItem>(
    '/api/v1/fulfillment/progress/log',
    data,
  );
}

export async function getQuoteListApi(data: {
  customerGroupId?: number;
  customerId?: number;
  page: number;
  quoteNo?: string;
  size: number;
  status?: string;
  targetType?: string;
}) {
  return requestClient.post<BasePageRes<QuoteItem>>('/api/v1/quote/list', data);
}

export async function getQuoteDetailApi(data: { id: number }) {
  return requestClient.post<QuoteItem>('/api/v1/quote/detail', data);
}

export async function createQuoteApi(data: {
  customerGroupId?: number;
  customerId?: number;
  items: Array<{
    quantity: number;
    quotePrice: number;
    remark?: string;
    skuCode: string;
  }>;
  remark?: string;
  targetType: 'CUSTOMER' | 'CUSTOMER_GROUP';
  validUntil?: string;
}) {
  return requestClient.post<QuoteItem>('/api/v1/quote/create', data);
}

export async function updateQuoteApi(
  data: Parameters<typeof createQuoteApi>[0] & {
    id: number;
  },
) {
  return requestClient.post<QuoteItem>('/api/v1/quote/update', data);
}

export async function updateQuoteStatusApi(data: {
  id: number;
  status: string;
}) {
  return requestClient.post<QuoteItem>('/api/v1/quote/status/update', data);
}

export async function exportQuoteApi(data: { id: number }) {
  return requestClient.post<import('./product').FileContentRes>(
    '/api/v1/quote/export',
    data,
  );
}

export async function convertQuoteToOrderApi(data: {
  bizRemark?: string;
  customerId?: number;
  customerRemark?: string;
  quoteId: number;
}) {
  return requestClient.post<{ orderId?: number; orderNo?: string }>(
    '/api/v1/quote/convert-to-order',
    data,
  );
}
