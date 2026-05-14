import { requestClient } from '#/api/request';

export interface PaymentReconciliationReq {
  orderId: number;
  page?: number;
  size?: number;
}

export interface ReconciliationPaymentItem {
  id?: number;
  amount?: number;
  auditAt?: string;
  auditBy?: number;
  auditRemark?: string;
  auditStatus?: string;
  outTradeNo?: string;
  paymentMethod?: string;
  paymentNo?: string;
  paymentSn?: string;
  paymentStatus?: string;
  paymentTime?: string;
  remark?: string;
  tradeType?: string;
  transactionId?: string;
  voucherUrl?: string;
}

export interface RefundRecordItem {
  auditAt?: string;
  auditBy?: number;
  auditRemark?: string;
  createdAt?: string;
  customerId?: number;
  id?: number;
  orderId?: number;
  paymentId?: number;
  reason?: string;
  refundAmount?: number;
  refundNo?: string;
  source?: string;
  status?: string;
  successTime?: string;
  wechatRefundId?: string;
  wechatStatus?: string;
}

export interface ReconciliationRes {
  discountAmount?: number;
  finalAmount?: number;
  orderId: number;
  orderNo?: string;
  paidAmount?: number;
  paymentStatus?: string;
  paymentSummaryStatus?: string;
  payments?: ReconciliationPaymentItem[];
  totalAmount?: number;
  unpaidAmount?: number;
}

export async function getOrderReconciliationApi(
  data: PaymentReconciliationReq,
) {
  return requestClient.post<ReconciliationRes>(
    '/api/v1/payment/reconciliation',
    data,
  );
}

export async function processPaymentApi(data: {
  amount: number;
  orderId: number;
  paymentMethod: string;
  paymentSn?: string;
  remark?: string;
  voucherUrl?: string;
}) {
  return requestClient.post<{ paymentId?: number; success?: boolean }>(
    '/api/v1/payment/process',
    data,
  );
}

export async function getPaymentDetailApi(data: { id: number }) {
  return requestClient.post<ReconciliationPaymentItem>(
    '/api/v1/payment/detail',
    data,
  );
}

export async function getOrderPaymentListApi(data: { orderId: number }) {
  return requestClient.post<{
    list: ReconciliationPaymentItem[];
    total: number;
  }>('/api/v1/payment/order/list', data);
}

export async function updatePaymentRecordApi(data: {
  amount: number;
  id: number;
  paymentMethod: string;
  paymentSn?: string;
  remark?: string;
  voucherUrl?: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/payment/update',
    data,
  );
}

export async function approvePaymentApi(data: {
  auditRemark?: string;
  id: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/payment/audit/approve',
    data,
  );
}

export async function rejectPaymentApi(data: {
  auditRemark?: string;
  id: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/payment/audit/reject',
    data,
  );
}

export async function mockConfirmPaymentApi(data: { id: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/payment/callback/mock-confirm',
    data,
  );
}

export async function getRefundListApi(data: {
  orderId?: number;
  page?: number;
  paymentId?: number;
  size?: number;
  status?: string;
}) {
  return requestClient.post<{
    list: RefundRecordItem[];
    total: number;
  }>('/api/v1/refund/list', data);
}

export async function directCreateRefundApi(data: {
  paymentId: number;
  reason?: string;
  refundAmount: number;
}) {
  return requestClient.post<RefundRecordItem>(
    '/api/v1/refund/direct/create',
    data,
  );
}

export async function auditRefundApi(data: {
  approved: boolean;
  auditRemark?: string;
  refundId: number;
}) {
  return requestClient.post<RefundRecordItem>('/api/v1/refund/audit', data);
}
