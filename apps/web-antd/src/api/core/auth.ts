import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值（后端直接返回 token 字符串） */
  export type LoginResult = string;
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/admin/login', data);
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post<string>('/auth/logout');
}

/**
 * 获取用户权限码
 * 后端未提供独立权限接口，复用 userinfo 中的 permissions 字段
 */
export async function getAccessCodesApi() {
  const userInfo = await requestClient.get<{ permissions?: string[] }>(
    '/auth/userinfo',
  );
  return userInfo.permissions ?? [];
}
