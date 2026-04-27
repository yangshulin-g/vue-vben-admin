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
