import { requestClient } from '#/api/request';

export interface CartListReq {
  customerId: number;
  page: number;
  size: number;
}

export interface CartItem {
  cartId?: number;
  customerId?: number;
  price?: number;
  productCode?: string;
  productName?: string;
  quantity?: number;
  skuCode?: string;
  skuSpecification?: string;
  stock?: number;
  totalAmount?: number;
}

export interface CartListRes {
  list: CartItem[];
  total: number;
}

export async function getShoppingCartListApi(data: CartListReq) {
  return requestClient.post<CartListRes>('/api/v1/shopping-cart/list', data);
}

export async function updateCartQuantityApi(data: {
  cartId: number;
  quantity: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/shopping-cart/update',
    data,
  );
}

export async function removeFromCartApi(data: { cartId: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/shopping-cart/remove',
    data,
  );
}
