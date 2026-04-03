import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

export interface BizUserInfo extends UserInfo {
  customerId?: string;
  nickname?: string;
  permissions: string[];
  phone?: string;
  userType?: string;
}

interface BackendUserInfoResponse {
  customerId?: unknown;
  id: unknown;
  nickname?: unknown;
  permissions?: string[];
  phone?: unknown;
  roles?: string[];
  userType?: string;
  username: unknown;
}

function toText(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  const data =
    await requestClient.get<BackendUserInfoResponse>('/auth/userinfo');

  return {
    avatar: '',
    customerId: data.customerId ? toText(data.customerId) : undefined,
    desc: '',
    homePath: '/product',
    nickname: data.nickname ? toText(data.nickname) : undefined,
    permissions: data.permissions ?? [],
    phone: data.phone ? toText(data.phone) : undefined,
    realName: toText(data.nickname || data.username) || '管理员',
    roles: data.roles ?? [],
    token: '',
    userId: toText(data.id),
    userType: data.userType,
    username: toText(data.username),
  } as BizUserInfo;
}
