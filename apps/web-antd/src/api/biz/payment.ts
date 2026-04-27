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
  paymentMethod?: string;
  paymentSn?: string;
  paymentStatus?: string;
  paymentTime?: string;
  remark?: string;
  voucherUrl?: string;
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
