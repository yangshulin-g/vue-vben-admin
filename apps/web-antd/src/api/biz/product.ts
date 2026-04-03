import { requestClient } from '#/api/request';

export interface ProductListReq {
  categoryId?: number;
  page: number;
  productName?: string;
  size: number;
  status?: 'DRAFT' | 'OFF_SHELF' | 'ON_SHELF';
}

export interface ProductCategoryInfo {
  categoryCode?: string;
  categoryId?: number;
  categoryName?: string;
  parentId?: number;
}

export interface ProductSkuInfo {
  price?: number;
  skuCode?: string;
  skuImage?: string;
  skuId?: number;
  specification?: Record<string, unknown> | string;
  stock?: number;
}

export interface ProductImageItem {
  imageId?: number;
  imageUrl?: string;
  isMain?: boolean;
  sort?: number;
}

export interface ProductListItem {
  brandId?: number;
  category?: ProductCategoryInfo;
  id: number;
  mainImage?: string;
  productCode?: string;
  productName?: string;
  skuList?: ProductSkuInfo[];
  status?: 'DRAFT' | 'OFF_SHELF' | 'ON_SHELF';
}

export interface ListPageRes<T> {
  list: T[];
  total: number;
}

export interface ProductDetailReq {
  productId: number;
}

export interface ProductDetailRes {
  brandId?: number;
  category?: ProductCategoryInfo;
  categoryPath?: ProductCategoryInfo[];
  description?: string;
  images?: ProductImageItem[];
  mainImage?: string;
  productCode?: string;
  productId: number;
  productName?: string;
  skuList?: ProductSkuInfo[];
  status?: 'DRAFT' | 'OFF_SHELF' | 'ON_SHELF';
  unit?: string;
}

export interface ProductStatusReq {
  productId: number;
  status: 'DRAFT' | 'OFF_SHELF' | 'ON_SHELF';
}

export interface ProductCategoryListReq {
  categoryName?: string;
  enabled?: boolean;
  page: number;
  parentId?: number;
  size: number;
}

export interface ProductCategoryListItem {
  categoryCode?: string;
  categoryName?: string;
  enabled?: boolean;
  id: number;
  parentId?: number;
  sort?: number;
}

export async function getProductListApi(data: ProductListReq) {
  return requestClient.post<ListPageRes<ProductListItem>>(
    '/api/v1/product/page',
    data,
  );
}

export async function createProductApi(data: {
  brandId?: number;
  categoryId: number;
  description?: string;
  mainImage: string;
  productCode: string;
  productName: string;
  skuList: Array<{
    price: number;
    skuCode: string;
    skuImage?: string;
    specification?: Record<string, unknown>;
    stock: number;
  }>;
  unit: string;
}) {
  return requestClient.post<{ productId?: number }>(
    '/api/v1/product/create',
    data,
  );
}

export async function updateProductApi(data: {
  brandId?: number;
  categoryId: number;
  description?: string;
  mainImage?: string;
  productCode: string;
  productId: number;
  productName: string;
  skuList: Array<{
    price: number;
    skuCode: string;
    skuId?: number;
    skuImage?: string;
    specification?: Record<string, unknown> | string;
    stock: number;
  }>;
  unit: string;
}) {
  return requestClient.post<{ productId?: number }>(
    '/api/v1/product/update',
    data,
  );
}

export async function getProductDetailApi(data: ProductDetailReq) {
  return requestClient.post<ProductDetailRes>('/api/v1/product/detail', data);
}

export async function addProductImageApi(data: {
  imageUrl: string;
  isMain?: boolean;
  productCode: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/product/image/add',
    data,
  );
}

export async function removeProductImageApi(data: { imageId: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/product/image/remove',
    data,
  );
}

export async function sortProductImageApi(data: {
  imageId: number;
  sort: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/product/image/sort',
    data,
  );
}

export async function setMainProductImageApi(data: {
  imageId: number;
  productCode: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/product/image/main',
    data,
  );
}

export async function updateProductStatusApi(data: ProductStatusReq) {
  return requestClient.post<{ success: boolean }>(
    '/api/v1/product/status/update',
    data,
  );
}

export async function getCategoryListApi(data: ProductCategoryListReq) {
  return requestClient.post<ListPageRes<ProductCategoryListItem>>(
    '/api/v1/category/page',
    data,
  );
}

export async function createCategoryApi(data: {
  categoryCode: string;
  categoryName: string;
  enabled: boolean;
  parentId?: number;
  sort: number;
}) {
  return requestClient.post<{ categoryId?: number }>(
    '/api/v1/category/create',
    data,
  );
}

export async function updateCategoryApi(data: {
  categoryCode: string;
  categoryName: string;
  enabled: boolean;
  id: number;
  parentId?: number;
  sort: number;
}) {
  return requestClient.post<{ categoryId?: number }>(
    '/api/v1/category/update',
    data,
  );
}

export async function deleteCategoryApi(data: { id: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/category/delete',
    data,
  );
}
