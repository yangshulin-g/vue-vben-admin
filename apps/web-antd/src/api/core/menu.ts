import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

interface BackendMenuNode {
  children?: BackendMenuNode[];
  component?: string;
  icon?: string;
  id: number;
  menuName: string;
  menuType: number;
  path?: string;
  sort?: number;
  status?: number;
  visible?: number;
}

function normalizePath(path: string, parentPath: string) {
  if (!path) {
    return parentPath ? `${parentPath}/index` : '/index';
  }

  if (path.startsWith('/')) {
    return path;
  }

  const prefix = parentPath.endsWith('/')
    ? parentPath.slice(0, -1)
    : parentPath;
  return `${prefix}/${path}`.replaceAll(/\/+/g, '/');
}

function mapMenuNode(
  node: BackendMenuNode,
  parentPath: string,
): null | RouteRecordStringComponent {
  // 按钮权限不参与路由生成
  if (node.menuType === 3) {
    return null;
  }

  const path = normalizePath(node.path ?? '', parentPath);
  const mappedChildren = (node.children ?? [])
    .map((child) => mapMenuNode(child, path))
    .filter((item): item is RouteRecordStringComponent => !!item)
    .sort((a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0));

  const isDirectory = node.menuType === 1 || mappedChildren.length > 0;

  return {
    children: mappedChildren.length > 0 ? mappedChildren : undefined,
    component: isDirectory
      ? 'BasicLayout'
      : node.component || '/_core/biz-placeholder/index',
    meta: {
      hideInMenu: node.visible === 0 || node.status === 0,
      icon: node.icon,
      order: node.sort ?? 0,
      title: node.menuName,
    },
    name: `Menu_${node.id}`,
    path,
  };
}

/**
 * 获取用户所有菜单
 */
export async function getAllMenusApi() {
  const menus = await requestClient.get<BackendMenuNode[]>('/auth/menus');
  return menus
    .map((item) => mapMenuNode(item, ''))
    .filter((item): item is RouteRecordStringComponent => !!item)
    .sort((a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0));
}
