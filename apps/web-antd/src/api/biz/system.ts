import { requestClient } from '#/api/request';

export interface PageReq {
  page?: number;
  size?: number;
}

export interface SystemPageRes<T> {
  list: T[];
  total: number;
}

export interface AdminItem {
  id: number;
  nickname?: string;
  roleCodes?: string[];
  roleNames?: string[];
  status?: number;
  username?: string;
}

export interface AdminDetail {
  id: number;
  nickname?: string;
  roles?: Array<{
    id: number;
    roleCode?: string;
    roleName?: string;
  }>;
  status?: number;
  username?: string;
}

export interface RoleItem {
  description?: string;
  id: number;
  roleCode?: string;
  roleName?: string;
  sort?: number;
  status?: number;
}

export interface RoleDetail {
  description?: string;
  id: number;
  menuIds?: number[];
  roleCode?: string;
  roleName?: string;
  sort?: number;
  status?: number;
}

export interface MenuTreeNode {
  children?: MenuTreeNode[];
  component?: string;
  icon?: string;
  id: number;
  menuName?: string;
  menuType?: number;
  parentId?: number;
  path?: string;
  permission?: string;
  sort?: number;
  status?: number;
  visible?: number;
}

export interface LogItem {
  costTime?: number;
  createdAt?: string;
  errorMsg?: string;
  id: number;
  ip?: string;
  module?: string;
  operation?: string;
  requestMethod?: string;
  status?: number;
  username?: string;
}

export interface FileAssetItem {
  assetName?: string;
  assetType?: string;
  bizType?: string;
  bucketOrContainer?: string;
  contentType?: string;
  createdAt?: string;
  fileExt?: string;
  fileSize?: number;
  id: number;
  objectKey?: string;
  provider?: string;
  remark?: string;
  uploadedBy?: number;
  uploadedByName?: string;
  uploadedByType?: string;
  url?: string;
}

export type FileAssetDetail = FileAssetItem;

export interface StorageConfigDetail {
  provider?: string;
  restartRequired?: boolean;
  local: {
    basePath?: string;
    urlPrefix?: string;
  };
  aliyun: {
    accessKeyId?: string;
    accessKeySecret?: string;
    bucket?: string;
    dirPrefix?: string;
    domain?: string;
    endpoint?: string;
  };
  tencent: {
    bucket?: string;
    dirPrefix?: string;
    domain?: string;
    region?: string;
    secretId?: string;
    secretKey?: string;
  };
  minio: {
    accessKey?: string;
    bucket?: string;
    dirPrefix?: string;
    domain?: string;
    endpoint?: string;
    secretKey?: string;
  };
}

export async function getAdminListApi(
  data: PageReq & { status?: number; username?: string },
) {
  return requestClient.post<SystemPageRes<AdminItem>>(
    '/api/v1/system/admin/list',
    data,
  );
}

export async function createAdminApi(data: {
  nickname?: string;
  password: string;
  roleIds?: number[];
  username: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/admin/create',
    data,
  );
}

export async function updateAdminApi(data: {
  adminId: number;
  nickname?: string;
  username?: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/admin/update',
    data,
  );
}

export async function updateAdminStatusApi(data: {
  adminId: number;
  status: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/admin/status/update',
    data,
  );
}

export async function resetAdminPasswordApi(data: {
  adminId: number;
  newPassword: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/admin/password/reset',
    data,
  );
}

export async function assignUserRoleApi(data: {
  adminId: number;
  roleIds: number[];
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/admin/role/assign',
    data,
  );
}

export async function getAdminDetailApi(data: { adminId: number }) {
  return requestClient.post<AdminDetail>('/api/v1/system/admin/detail', data);
}

export async function deleteAdminApi(data: { adminId: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/admin/delete',
    data,
  );
}

export async function getRoleListApi(data: PageReq & { roleName?: string }) {
  return requestClient.post<SystemPageRes<RoleItem>>(
    '/api/v1/system/role/list',
    data,
  );
}

export async function createRoleApi(data: {
  description?: string;
  roleCode: string;
  roleName: string;
  sort?: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/role/create',
    data,
  );
}

export async function updateRoleApi(data: {
  description?: string;
  roleCode: string;
  roleId: number;
  roleName: string;
  sort?: number;
  status?: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/role/update',
    data,
  );
}

export async function deleteRoleApi(data: { roleId: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/role/delete',
    data,
  );
}

export async function getRoleDetailApi(data: { roleId: number }) {
  return requestClient.post<RoleDetail>('/api/v1/system/role/detail', data);
}

export async function assignRoleMenuApi(data: {
  menuIds: number[];
  roleId: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/role/menu/assign',
    data,
  );
}

export async function getMenuTreeApi() {
  return requestClient.post<MenuTreeNode[]>('/api/v1/system/menu/tree', {});
}

export async function createMenuApi(data: {
  component?: string;
  icon?: string;
  menuName: string;
  menuType: number;
  parentId?: number;
  path?: string;
  permission?: string;
  sort?: number;
  visible?: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/menu/create',
    data,
  );
}

export async function updateMenuApi(data: {
  component?: string;
  icon?: string;
  menuId: number;
  menuName: string;
  menuType: number;
  parentId?: number;
  path?: string;
  permission?: string;
  sort?: number;
  status?: number;
  visible?: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/menu/update',
    data,
  );
}

export async function deleteMenuApi(data: { menuId: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/menu/delete',
    data,
  );
}

export async function getOperationLogApi(
  data: PageReq & {
    endDate?: string;
    module?: string;
    startDate?: string;
    status?: number;
    username?: string;
  },
) {
  return requestClient.post<SystemPageRes<LogItem>>(
    '/api/v1/system/log/list',
    data,
  );
}

export async function getFileAssetListApi(
  data: PageReq & {
    assetName?: string;
    assetType?: string;
    bizType?: string;
    endDate?: string;
    provider?: string;
    startDate?: string;
  },
) {
  return requestClient.post<SystemPageRes<FileAssetItem>>(
    '/api/v1/system/file-asset/list',
    data,
  );
}

export async function getFileAssetDetailApi(data: { id: number }) {
  return requestClient.post<FileAssetDetail>(
    '/api/v1/system/file-asset/detail',
    data,
  );
}

export async function uploadFileAssetApi(
  file: Blob | File,
  data?: {
    remark?: string;
    type?: string;
  },
) {
  const formData = new FormData();
  formData.append('file', file);
  if (data?.type) {
    formData.append('type', data.type);
  }
  if (data?.remark) {
    formData.append('remark', data.remark);
  }

  return requestClient.post<FileAssetDetail>(
    '/api/v1/system/file-asset/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
}

export async function deleteFileAssetApi(data: { id: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/file-asset/delete',
    data,
  );
}

export async function getStorageConfigDetailApi() {
  return requestClient.post<StorageConfigDetail>(
    '/api/v1/system/storage-config/detail',
    {},
  );
}

export async function updateStorageConfigApi(data: StorageConfigDetail) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/storage-config/update',
    data,
  );
}

export async function testStorageConfigApi(data: StorageConfigDetail) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/system/storage-config/test',
    data,
  );
}
