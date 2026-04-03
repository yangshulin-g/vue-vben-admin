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
