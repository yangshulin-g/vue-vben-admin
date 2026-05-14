import { requestClient } from '#/api/request';

export interface CustomerListReq {
  page: number;
  size: number;
  status?: number;
}

export interface CustomerItem {
  contactAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  customerCode?: string;
  /** 客户主键；列表接口与 {@link id} 等价，由 {@link getCustomerListApi} 等归一 */
  customerId: number;
  customerName?: string;
  customerType?: number;
  remark?: string;
  salesmanId?: number;
  status?: number;
  /** 后端列表/详情常用字段名，与 customerId 等价 */
  id?: number;
}

export interface CustomerDetailRes extends CustomerItem {
  id: number;
}

export interface CustomerAccountDetailRes {
  createdAt?: string;
  customerId: number;
  customerUserId?: number;
  opened?: boolean;
  phone?: string;
  status?: number;
  username?: string;
}

export interface CreateCustomerAccountRes {
  customerId?: number;
  initialPassword?: string;
  phone?: string;
  success?: boolean;
  username?: string;
}

export interface ResetCustomerAccountPasswordRes {
  customerId?: number;
  newPassword?: string;
  success?: boolean;
  username?: string;
}

/** 后端列表项常只返回 id，统一为 customerId，供下拉框 value 使用 */
function normalizeCustomerRow(
  row: Omit<CustomerItem, 'customerId'> & {
    customerId?: number;
    id?: number;
  },
): CustomerItem {
  const cid = row.customerId ?? row.id;
  return {
    ...row,
    customerId: Number(cid),
  } as CustomerItem;
}

export interface GroupItem {
  customerCount?: number;
  description?: string;
  enabled?: number;
  groupCode?: string;
  groupId: number;
  groupName?: string;
  id?: number;
  sort?: number;
}

export interface ListRes<T> {
  list: T[];
  total: number;
}

export async function getCustomerListApi(data: CustomerListReq) {
  const res = await requestClient.post<
    ListRes<
      Omit<CustomerItem, 'customerId'> & {
        customerId?: number;
        id?: number;
      }
    >
  >('/api/v1/customer/list', data);
  return {
    total: res.total,
    list: (res.list ?? []).map((row) => normalizeCustomerRow(row)),
  };
}

export async function createCustomerApi(data: {
  contactAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  customerCode: string;
  customerName: string;
  customerType: number;
  remark?: string;
  salesmanId?: number;
}) {
  return requestClient.post<{ customerId?: number }>(
    '/api/v1/customer/create',
    data,
  );
}

export async function updateCustomerApi(data: {
  contactAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  customerCode: string;
  customerName: string;
  customerType: number;
  id: number;
  remark?: string;
  salesmanId?: number;
  status: number;
}) {
  return requestClient.post<{ customerId?: number }>(
    '/api/v1/customer/update',
    data,
  );
}

export async function deleteCustomerApi(data: { id: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/delete',
    data,
  );
}

export async function getCustomerGroupListApi(data: CustomerListReq) {
  return requestClient.post<ListRes<GroupItem>>(
    '/api/v1/customer/group/list',
    data,
  );
}

export async function createCustomerGroupApi(data: {
  description?: string;
  enabled: number;
  groupCode: string;
  groupName: string;
  sort: number;
}) {
  return requestClient.post<{ groupId?: number }>(
    '/api/v1/customer/group/create',
    data,
  );
}

export async function updateCustomerGroupApi(data: {
  description?: string;
  enabled: number;
  groupCode: string;
  groupName: string;
  id: number;
  sort: number;
}) {
  return requestClient.post<{ groupId?: number }>(
    '/api/v1/customer/group/update',
    data,
  );
}

export async function deleteCustomerGroupApi(data: { id: number }) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/group/delete',
    data,
  );
}

export async function getGroupCustomersApi(
  groupId: number,
  page = 1,
  size = 20,
) {
  const res = await requestClient.post<
    ListRes<
      Omit<CustomerItem, 'customerId'> & {
        customerId?: number;
        id?: number;
      }
    >
  >('/api/v1/customer/group/customers', {
    groupId,
    page,
    size,
  });
  return {
    total: res.total,
    list: (res.list ?? []).map((row) => normalizeCustomerRow(row)),
  };
}

export interface GroupDetailRes {
  description?: string;
  enabled?: number;
  groupCode?: string;
  groupName?: string;
  id: number;
  sort?: number;
}

export interface GroupPriceItem {
  createdAt?: string;
  groupId?: number;
  id?: number;
  price?: number;
  skuCode?: string;
  updatedAt?: string;
}

export async function getCustomerDetailApi(data: { id: number }) {
  const res = await requestClient.post<
    CustomerDetailRes & { customerId?: number }
  >('/api/v1/customer/detail', data);
  return normalizeCustomerRow(res) as CustomerDetailRes;
}

export async function getCustomerAccountDetailApi(data: {
  customerId: number;
}) {
  return requestClient.post<CustomerAccountDetailRes>(
    '/api/v1/customer/account/detail',
    data,
  );
}

export async function createCustomerAccountApi(data: { customerId: number }) {
  return requestClient.post<CreateCustomerAccountRes>(
    '/api/v1/customer/account/create',
    data,
  );
}

export async function updateCustomerAccountStatusApi(data: {
  customerId: number;
  status: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/account/status/update',
    data,
  );
}

export async function resetCustomerAccountPasswordApi(data: {
  customerId: number;
}) {
  return requestClient.post<ResetCustomerAccountPasswordRes>(
    '/api/v1/customer/account/password/reset',
    data,
  );
}

export async function getCustomerGroupDetailApi(data: { id: number }) {
  return requestClient.post<GroupDetailRes>(
    '/api/v1/customer/group/detail',
    data,
  );
}

export async function addCustomerToGroupApi(data: {
  customerIds: number[];
  groupId: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/group/add',
    data,
  );
}

export async function removeCustomerFromGroupApi(data: {
  customerId: number;
  groupId: number;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/group/remove',
    data,
  );
}

export async function getGroupPriceListApi(data: { groupId: number }) {
  return requestClient.post<GroupPriceItem[]>(
    '/api/v1/customer/group/price/list',
    data,
  );
}

export async function setGroupPriceApi(data: {
  groupId: number;
  price: number;
  skuCode: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/group/price/set',
    data,
  );
}

export async function batchSetGroupPriceApi(data: {
  groupId: number;
  items: Array<{ price: number; skuCode: string }>;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/group/price/batch-set',
    data,
  );
}

export async function removeGroupPriceApi(data: {
  groupId: number;
  skuCode: string;
}) {
  return requestClient.post<{ success?: boolean }>(
    '/api/v1/customer/group/price/remove',
    data,
  );
}
