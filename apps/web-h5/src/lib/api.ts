import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

import axios from 'axios';

import {
  clearSession,
  getCurrentCustomerId,
  saveSession,
  sessionState,
} from './session';

interface BaseResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface CustomerUserInfo {
  customerId?: number;
  id?: number | string;
  phone?: string;
  userType?: string;
  username?: string;
}

export interface ProductListItem {
  id: number;
  mainImage?: string;
  productCode?: string;
  productName?: string;
  skuList?: Array<{
    price?: number;
    skuCode?: string;
    specification?: Record<string, unknown>;
    stock?: number;
  }>;
}

export interface ProductDetailRes {
  description?: string;
  images?: Array<{
    imageId?: number;
    imageUrl?: string;
    isMain?: boolean;
    sort?: number;
  }>;
  mainImage?: string;
  productCode?: string;
  productId: number;
  productName?: string;
  skuList?: Array<{
    price?: number;
    skuCode?: string;
    specification?: Record<string, unknown>;
    stock?: number;
  }>;
  unit?: string;
}

export interface CartItem {
  customerId?: number;
  id: number;
  price?: number;
  productCode?: string;
  productName?: string;
  quantity?: number;
  skuCode?: string;
  specification?: Record<string, unknown>;
  subtotal?: number;
}

export interface CustomerOrderItem {
  createdAt?: string;
  finalAmount?: number;
  hasPendingPayment?: boolean;
  id: number;
  orderNo?: string;
  paymentStatus?: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  status?: 'CANCELLED' | 'COMPLETED' | 'CREATED' | 'SHIPPED';
  totalAmount?: number;
}

export interface OrderDetailRes {
  contactAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  customerRemark?: string;
  customerName?: string;
  finalAmount?: number;
  id: number;
  items?: Array<{
    price?: number;
    productName?: string;
    quantity?: number;
    skuCode?: string;
    specification?: string;
    totalAmount?: number;
  }>;
  orderNo?: string;
  paymentStatus?: 'FULLY_PAID' | 'PARTIALLY_PAID' | 'UNPAID';
  status?: 'CANCELLED' | 'COMPLETED' | 'CREATED' | 'SHIPPED';
}

export interface PaymentItem {
  amount?: number;
  auditRemark?: string;
  auditStatus?: string;
  id?: number;
  paymentMethod?: string;
  paymentSn?: string;
  paymentStatus?: string;
  paymentTime?: string;
  remark?: string;
  voucherUrl?: string;
}

export interface ReconciliationRes {
  finalAmount?: number;
  orderId: number;
  orderNo?: string;
  paidAmount?: number;
  paymentStatus?: string;
  payments?: PaymentItem[];
  unpaidAmount?: number;
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (sessionState.token) {
    config.headers.Authorization = `Bearer ${sessionState.token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response: AxiosResponse<BaseResponse<unknown>>) => {
    const body = response.data as BaseResponse<unknown>;
    if (body.code !== 0) {
      return Promise.reject(new Error(body.message || '请求失败'));
    }
    return body.data as never;
  },
  (error: AxiosError<{ message?: string }>) => {
    const message =
      error.response?.data?.message || error.message || '请求失败';
    if (error?.response?.status === 401) {
      clearSession();
    }
    return Promise.reject(new Error(message));
  },
);

export { sessionState };

export async function customerLogin(identifier: string, password: string) {
  const isPhone = /^1\d{10}$/.test(identifier);
  const token = (await http.post('/auth/customer/login', {
    password,
    phone: isPhone ? identifier : undefined,
    username: isPhone ? undefined : identifier,
  })) as string;
  const user = await getUserInfo();
  saveSession(token, user);
  return user;
}

export async function getUserInfo() {
  return (await http.get('/auth/userinfo')) as CustomerUserInfo;
}

export async function bootstrapSession() {
  if (!sessionState.token) {
    return null;
  }
  const user = await getUserInfo();
  saveSession(sessionState.token, user);
  return user;
}

export async function logout() {
  try {
    await http.post('/auth/logout');
  } finally {
    clearSession();
  }
}

export async function getProductList(keyword = '') {
  return (await http.post('/api/v1/product/page', {
    page: 1,
    productName: keyword || undefined,
    size: 50,
    status: 'ON_SHELF',
  })) as {
    list: ProductListItem[];
    total: number;
  };
}

export async function getProductDetail(productId: number) {
  return (await http.post('/api/v1/product/detail', {
    productId,
  })) as ProductDetailRes;
}

export async function addToCart(
  productCode: string,
  skuCode: string,
  quantity: number,
) {
  return http.post('/api/v1/shopping-cart/add', {
    customerId: getCurrentCustomerId(),
    productCode,
    quantity,
    skuCode,
  });
}

export async function getCartList() {
  return (await http.post('/api/v1/shopping-cart/list', {
    customerId: getCurrentCustomerId(),
    page: 1,
    size: 200,
  })) as {
    list: CartItem[];
    total: number;
  };
}

export async function updateCartQuantity(cartId: number, quantity: number) {
  return http.post('/api/v1/shopping-cart/update', {
    cartId,
    quantity,
  });
}

export async function removeCartItem(cartId: number) {
  return http.post('/api/v1/shopping-cart/remove', {
    cartId,
  });
}

export async function createOrder(cartIds: number[], customerRemark?: string) {
  return (await http.post('/api/v1/order/create', {
    cartIds,
    customerId: getCurrentCustomerId(),
    customerRemark,
  })) as {
    orderId?: number;
    orderNo?: string;
  };
}

export async function getOrders() {
  return (await http.post('/api/v1/order/customer/list', {
    customerId: getCurrentCustomerId(),
    page: 1,
    size: 200,
  })) as {
    list: CustomerOrderItem[];
    total: number;
  };
}

export async function getOrderDetail(orderId: number) {
  return (await http.post('/api/v1/order/detail', {
    orderId,
  })) as OrderDetailRes;
}

export async function getOrderReconciliation(orderId: number) {
  return (await http.post('/api/v1/payment/reconciliation', {
    orderId,
    page: 1,
    size: 100,
  })) as ReconciliationRes;
}

export async function cancelOrder(orderId: number) {
  return http.post('/api/v1/order/cancel', {
    orderId,
  });
}

export async function confirmReceipt(orderId: number) {
  return http.post('/api/v1/order/complete', {
    orderId,
  });
}

export async function uploadVoucher(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', 'voucher');
  const result = (await http.post('/api/v1/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })) as {
    url?: string;
  };
  return result.url || '';
}

export async function submitOfflinePayment(
  orderId: number,
  amount: number,
  paymentMethod: 'bank_transfer' | 'offline',
  paymentSn: string,
  voucherUrl: string,
  remark?: string,
) {
  return http.post('/api/v1/payment/process', {
    amount,
    orderId,
    paymentMethod,
    paymentSn,
    remark,
    voucherUrl,
  });
}

export function formatSpec(specification?: Record<string, unknown>) {
  if (!specification) return '';
  return Object.entries(specification)
    .filter(
      ([, value]) =>
        value !== null && value !== undefined && `${value}`.trim() !== '',
    )
    .map(([key, value]) => `${key}: ${value}`)
    .join(' / ');
}
