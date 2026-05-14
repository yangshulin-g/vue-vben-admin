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

const menuIconByPath: Record<string, string> = {
  '/customer': 'lucide:users',
  '/customer/group': 'lucide:users-round',
  '/customer/list': 'lucide:user-round',
  '/order': 'lucide:file-text',
  '/order/cart': 'lucide:shopping-cart',
  '/order/list': 'lucide:clipboard-list',
  '/payment': 'lucide:credit-card',
  '/payment/list': 'lucide:receipt-text',
  '/product': 'lucide:shopping-bag',
  '/product/category': 'lucide:tags',
  '/product/list': 'lucide:package',
  '/product/stock': 'lucide:warehouse',
  '/statistics': 'lucide:bar-chart',
  '/statistics/inventory': 'lucide:boxes',
  '/statistics/payment': 'lucide:wallet-cards',
  '/statistics/sales': 'lucide:line-chart',
  '/system': 'lucide:settings',
  '/system/admin': 'lucide:user-cog',
  '/system/file-asset': 'lucide:folder-open',
  '/system/log': 'lucide:file-clock',
  '/system/menu': 'lucide:list-tree',
  '/system/role': 'lucide:shield-check',
  '/system/storage-config': 'lucide:hard-drive',
};

const menuIconByName: Record<string, string> = {
  分组: 'lucide:users-round',
  分类: 'lucide:tags',
  商品: 'lucide:package',
  客户: 'lucide:users',
  库存: 'lucide:warehouse',
  支付: 'lucide:credit-card',
  收款: 'lucide:wallet-cards',
  文件: 'lucide:folder-open',
  日志: 'lucide:file-clock',
  管理员: 'lucide:user-cog',
  系统: 'lucide:settings',
  菜单: 'lucide:list-tree',
  角色: 'lucide:shield-check',
  订单: 'lucide:file-text',
  购物车: 'lucide:shopping-cart',
  销售: 'lucide:line-chart',
};

function normalizeIcon(icon?: string) {
  const normalizedIcon = icon?.trim();
  if (!normalizedIcon) {
    return '';
  }
  return normalizedIcon.includes(':')
    ? normalizedIcon
    : `lucide:${normalizedIcon}`;
}

function resolveMenuIcon(node: BackendMenuNode, path: string) {
  const configuredIcon = normalizeIcon(node.icon);
  if (configuredIcon) {
    return configuredIcon;
  }

  const pathIcon = menuIconByPath[path];
  if (pathIcon) {
    return pathIcon;
  }

  const matchedName = Object.keys(menuIconByName).find((keyword) =>
    node.menuName.includes(keyword),
  );
  return matchedName ? menuIconByName[matchedName] : 'lucide:circle-dot';
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
    .toSorted((a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0));

  const isDirectory = node.menuType === 1 || mappedChildren.length > 0;

  return {
    children: mappedChildren.length > 0 ? mappedChildren : undefined,
    component: isDirectory
      ? 'BasicLayout'
      : node.component || '/_core/biz-placeholder/index',
    meta: {
      hideInMenu: node.visible === 0 || node.status === 0,
      icon: resolveMenuIcon(node, path),
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
    .toSorted((a, b) => (a.meta?.order ?? 0) - (b.meta?.order ?? 0));
}
