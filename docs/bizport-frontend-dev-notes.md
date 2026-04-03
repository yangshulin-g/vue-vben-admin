# BizPort 后台前端改造记录（持续更新）

本文档用于记录 `apps/web-antd` 的改造进度、关键实现、注意事项和下一步开发入口，避免下次续开发时重复排查。

## 1. 当前阶段结论

- `P0` 已完成：认证、权限、动态菜单、路由联调打通。
- `P1` 已扩展到全模块可联调版本（第二轮补充了“可造数 + 关键 CRUD”）：
  - 订单：列表/详情/发货/收货/取消
  - 商品：列表/详情/状态切换/新增（多 SKU）/编辑（多 SKU）
  - 分类：列表查询/新增/编辑/删除
  - 客户：列表/新增/编辑/删除
  - 客户分组：列表/新增/编辑/删除 + 分组成员查看
  - 支付：按订单对账查询
  - 购物车：按客户ID查询
  - 系统：管理员列表、角色列表、菜单树、操作日志
  - 统计：销售、库存、收款

## 2. 已完成的核心改造

### 2.1 基础联调（P0）

- 前端开发环境
  - `apps/web-antd/.env.development`
    - `VITE_NITRO_MOCK=false`（关闭 mock）
  - `apps/web-antd/vite.config.mts`
    - `/api` 代理到 `http://localhost:9999`
- 权限模式切换
  - `apps/web-antd/src/preferences.ts`
    - `accessMode: 'backend'`
    - `defaultHomePath: '/product'`

### 2.2 认证与用户信息适配

- `apps/web-antd/src/api/core/auth.ts`
  - 登录改为：`POST /auth/admin/login`
  - 登出改为：`POST /auth/logout`
  - 权限码改为从 `/auth/userinfo.permissions` 获取
- `apps/web-antd/src/api/core/user.ts`
  - 用户信息改为：`GET /auth/userinfo`
  - 新增后端结构到前端 `UserInfo` 的映射逻辑
- `apps/web-antd/src/api/request.ts`
  - 保留 `code=0` 成功判定
  - refresh token 逻辑置空（后端暂未提供 refresh 接口）
- `apps/web-antd/src/store/auth.ts`
  - 登录返回 token 直接取字符串
  - `accessCodes` 取 `userinfo.permissions`

### 2.3 菜单与路由适配

- `apps/web-antd/src/api/core/menu.ts`
  - 菜单来源：`GET /auth/menus`
  - 过滤按钮节点（`menuType=3`）
  - 目录节点映射为 `BasicLayout`
  - 叶子节点优先使用后端 `component`（如 `order/list`、`product/list`）
  - 无 `component` 回落到占位页 `/_core/biz-placeholder/index`

### 2.4 占位页补齐（避免 404）

新增或补齐以下视图文件（可访问，未实装业务）：

- `views/product/category.vue`
- `views/customer/list.vue`
- `views/customer/group.vue`
- `views/order/cart.vue`
- `views/payment/list.vue`
- `views/system/admin.vue`
- `views/system/role.vue`
- `views/system/menu.vue`
- `views/system/log.vue`
- `views/statistics/sales.vue`
- `views/statistics/inventory.vue`
- `views/statistics/payment.vue`
- `views/_core/biz-placeholder/index.vue`

## 3. 订单模块（已实装）

### 3.1 文件

- API
  - `apps/web-antd/src/api/biz/order.ts`
  - `apps/web-antd/src/api/biz/index.ts`
  - `apps/web-antd/src/api/index.ts`（导出 `biz`）
- 页面
  - `apps/web-antd/src/views/order/list.vue`

### 3.2 已接接口

- 列表：`POST /api/v1/order/admin/list`
- 详情：`POST /api/v1/order/detail`
- 取消：`POST /api/v1/order/cancel`
- 发货：`POST /api/v1/order/ship`
- 收货：`POST /api/v1/order/complete`

### 3.3 页面能力

- 列表筛选（订单号/客户名称/状态）+ 分页
- 订单详情弹窗（含订单项）
- 订单留货（`/api/v1/order/hold`）
- 订单备注编辑（`/api/v1/order/remark/update`，支持客户备注/业务备注）
- 按钮权限控制：
  - `order:ship`
  - `order:complete`
  - `order:cancel`
  - `order:hold`
  - `order:remark:update`
- 状态流转动作：
  - 待发货 -> 确认发货
  - 已发货 -> 确认收货
  - 待付款/待发货 -> 取消订单

### 3.4 注意

- 通用状态接口 `/api/v1/order/status/update` 已废弃，不在页面主流程使用。
- 发货弹窗中的物流公司/单号是可选（与后端约定一致）。

## 4. 商品与分类模块（已实装第二版）

### 4.1 文件

- API
  - `apps/web-antd/src/api/biz/product.ts`
  - `apps/web-antd/src/api/biz/index.ts`
- 页面
  - `apps/web-antd/src/views/product/list.vue`

### 4.2 已接接口

- 商品列表：`POST /api/v1/product/page`
- 商品详情：`POST /api/v1/product/detail`
- 商品状态更新：`POST /api/v1/product/status/update`
- 商品新增：`POST /api/v1/product/create`
- 商品更新：`POST /api/v1/product/update`
- 分类列表（用于筛选下拉）：`POST /api/v1/category/page`
- 分类新增：`POST /api/v1/category/create`
- 分类更新：`POST /api/v1/category/update`
- 分类删除：`POST /api/v1/category/delete`

### 4.3 页面能力

- 筛选（商品名/分类/状态）+ 分页
- 详情弹窗（基础信息 + SKU 表）
- 上架/下架动作
- 商品新增弹窗（最小必填字段 + 多 SKU 创建）
- 商品编辑弹窗（基于详情回填，多 SKU 编辑）
- SKU 规格改造为“键值对编辑器”（不再手写 JSON），并在表格中展示规格预览
- SKU 交互优化：新增 SKU 自动继承上一行规格，且支持“复制上行规格”
- 商品详情 SKU 规格展示过滤 `null/空值`，避免出现 `xxx: null` 的脏展示
- 分类页列表查询（分类名/启用状态）
- 分类新增/编辑弹窗 + 删除动作

## 5. 客户模块（已实装第三版）

### 5.1 文件

- API
  - `apps/web-antd/src/api/biz/customer.ts`
- 页面
  - `apps/web-antd/src/views/customer/list.vue`
  - `apps/web-antd/src/views/customer/group.vue`

### 5.2 页面能力

- 客户列表查询（基础分页 + 状态筛选）+ 新增客户
- 客户详情弹窗（`/api/v1/customer/detail`）
- 客户分组列表查询 + 新增分组 + 编辑/删除
- 分组成员管理：查看成员、添加成员、移除成员
- 分组定价管理：查看、新增、编辑、删除、批量设置

### 5.3 本轮新增接口

- `POST /api/v1/customer/create`
- `POST /api/v1/customer/update`
- `POST /api/v1/customer/delete`
- `POST /api/v1/customer/group/create`
- `POST /api/v1/customer/group/update`
- `POST /api/v1/customer/group/delete`
- `POST /api/v1/customer/detail`
- `POST /api/v1/customer/group/add`
- `POST /api/v1/customer/group/remove`
- `POST /api/v1/customer/group/price/list`
- `POST /api/v1/customer/group/price/set`
- `POST /api/v1/customer/group/price/batch-set`
- `POST /api/v1/customer/group/price/remove`

## 5.4 库存管理模块（本轮新增）

### 5.4.1 文件

- API
  - `apps/web-antd/src/api/biz/stock.ts`
  - `apps/web-antd/src/api/biz/index.ts`
- 页面
  - `apps/web-antd/src/views/product/stock.vue`

### 5.4.2 页面能力

- 手动调整库存（入库/出库/调整）
- 库存变动记录查询（分页）
- 低库存预警列表查询
- 预警阈值更新
- 依赖后端菜单：`/product/stock`（`component=product/stock`）
- 依赖后端权限：`stock:adjust` / `stock:log:list` / `stock:alert:list` / `stock:alert:update`

## 6. 支付模块（已实装第一版）

### 6.1 文件

- API
  - `apps/web-antd/src/api/biz/payment.ts`
- 页面
  - `apps/web-antd/src/views/payment/list.vue`

### 6.2 页面能力

- 输入订单ID查询对账
- 展示订单收款汇总（应收/已收/未收）
- 展示支付记录明细列表

## 7. 购物车模块（已实装第一版）

### 7.1 文件

- API
  - `apps/web-antd/src/api/biz/cart.ts`
- 页面
  - `apps/web-antd/src/views/order/cart.vue`

### 7.2 页面能力

- 输入客户ID查询购物车明细
- 展示商品/SKU/数量/金额

## 8. 系统管理模块（已实装第一版）

### 8.1 文件

- API
  - `apps/web-antd/src/api/biz/system.ts`
- 页面
  - `apps/web-antd/src/views/system/admin.vue`
  - `apps/web-antd/src/views/system/role.vue`
  - `apps/web-antd/src/views/system/menu.vue`
  - `apps/web-antd/src/views/system/log.vue`

### 8.2 页面能力

- 管理员列表（用户名/状态筛选）
- 角色列表（角色名筛选）
- 菜单树浏览（树状表）
- 操作日志列表（操作人/模块/状态筛选）

## 9. 统计模块（已实装第一版）

### 9.1 文件

- API
  - `apps/web-antd/src/api/biz/statistics.ts`
- 页面
  - `apps/web-antd/src/views/statistics/sales.vue`
  - `apps/web-antd/src/views/statistics/inventory.vue`
  - `apps/web-antd/src/views/statistics/payment.vue`

### 9.2 页面能力

- 销售统计：区间查询 + 日销售明细
- 库存统计：低库存阈值查询 + 低库存清单 + 跳转库存管理
- 收款统计：区间查询 + 支付方式统计表

## 10. 重要坑位与排查要点

### 10.0 列表筛选行挤压样式

- 问题：各模块列表页 `Form layout="inline"` 在换行后上下间距过小，视觉拥挤。
- 处理：新增 `apps/web-antd/src/bizport-overrides.css` 并在 `src/main.ts` 全局引入。
- 生效范围：卡片内的 inline 筛选表单统一增加行间距，避免两行贴在一起。

### 10.1 新功能不显示/按钮灰掉

- 若库存管理页面或分组定价按钮不显示，先执行后端 `shell/initdb/migrate.sql`，确保菜单与权限已入库。
- 本轮新增依赖的权限包括：
  - `stock:*`
  - `customer:group:price:list`
  - `customer:group:price:set`
  - `customer:group:price:remove`

### 5.1 看得到菜单但点开 404

优先检查：

1. 后端 `sys_menu.component` 是否存在且对应 `src/views` 下文件；
2. `menu.ts` 是否把叶子节点误映射到 `BasicLayout`；
3. 是否命中了占位页回落逻辑（可通过路由 path 判断）。

### 5.2 超级管理员登录后无权限

排查 DB：

- `admin_user` 是否存在
- `sys_user_role` 是否有当前 admin 的角色绑定（`super_admin`）

### 5.3 登录成功但路由不刷新

- 退出重登一次（会重建动态路由）
- 清理浏览器缓存后再试

## 11. 下次开发建议顺序

1. 将“只读页”升级为完整 CRUD（创建/更新/删除）
2. 补齐各模块详情页中的编辑弹窗与表单校验
3. 接入文件上传（商品图、支付凭证）
4. 接入库存调整、分组定价、角色分配、菜单分配等深层操作
5. 将统计页面改为图表版（当前是表格+描述）

## 12. 本轮关键改动文件清单（汇总）

- `apps/web-antd/.env.development`
- `apps/web-antd/vite.config.mts`
- `apps/web-antd/src/preferences.ts`
- `apps/web-antd/src/api/core/auth.ts`
- `apps/web-antd/src/api/core/user.ts`
- `apps/web-antd/src/api/core/menu.ts`
- `apps/web-antd/src/api/request.ts`
- `apps/web-antd/src/store/auth.ts`
- `apps/web-antd/src/api/index.ts`
- `apps/web-antd/src/api/biz/index.ts`
- `apps/web-antd/src/api/biz/order.ts`
- `apps/web-antd/src/api/biz/product.ts`
- `apps/web-antd/src/api/biz/customer.ts`
- `apps/web-antd/src/api/biz/payment.ts`
- `apps/web-antd/src/api/biz/system.ts`
- `apps/web-antd/src/api/biz/statistics.ts`
- `apps/web-antd/src/api/biz/cart.ts`
- `apps/web-antd/src/views/order/list.vue`
- `apps/web-antd/src/views/product/list.vue`
- `apps/web-antd/src/views/product/category.vue`
- `apps/web-antd/src/views/customer/list.vue`
- `apps/web-antd/src/views/customer/group.vue`
- `apps/web-antd/src/views/order/cart.vue`
- `apps/web-antd/src/views/payment/list.vue`
- `apps/web-antd/src/views/system/admin.vue`
- `apps/web-antd/src/views/system/role.vue`
- `apps/web-antd/src/views/system/menu.vue`
- `apps/web-antd/src/views/system/log.vue`
- `apps/web-antd/src/views/statistics/sales.vue`
- `apps/web-antd/src/views/statistics/inventory.vue`
- `apps/web-antd/src/views/statistics/payment.vue`
- `apps/web-antd/src/views/_core/biz-placeholder/index.vue`

## 13. 第二轮收尾（一次性补齐）

### 13.1 质量基线（已完成）

- 已清理历史 TypeScript 报错，`web-antd` 当前 `typecheck` 通过。
- 关键修复点：
  - `api/biz/index.ts` 导出冲突（通过重命名分页类型规避）
  - `api/request.ts` refresh token 返回类型
  - `order/list.vue` 的表格 record 强类型索引
  - `statistics/sales.vue`、`statistics/payment.vue` 的日期范围类型
  - `payment/list.vue` 的无用导入

### 13.2 系统管理模块（从列表页升级为可操作页）

- 管理员页 `views/system/admin.vue`
  - 新增：创建、编辑、启用/禁用、删除、重置密码、分配角色
  - 新增弹窗：创建弹窗、编辑弹窗、分配角色弹窗、重置密码弹窗
- 角色页 `views/system/role.vue`
  - 新增：创建、编辑、删除、分配菜单
  - 新增弹窗：创建弹窗、编辑弹窗、菜单分配弹窗
- 菜单页 `views/system/menu.vue`
  - 新增：创建菜单、编辑菜单、删除菜单、按节点加子菜单
  - 新增弹窗：创建弹窗、编辑弹窗

### 13.3 支付/购物车闭环增强

- 支付页 `views/payment/list.vue`
  - 在原“对账查询”基础上新增：
    - 新增支付记录（`/api/v1/payment/process`）
    - 编辑支付记录（`/api/v1/payment/update`）
    - 订单支付记录列表（`/api/v1/payment/order/list`）
- 购物车页 `views/order/cart.vue`
  - 新增：更新数量（`/api/v1/shopping-cart/update`）
  - 新增：移除商品（`/api/v1/shopping-cart/remove`）

### 13.4 API 层新增

- `api/biz/system.ts`
  - 管理员：create/update/status/update/detail/delete/assign/reset
  - 角色：create/update/delete/detail/assign-menu
  - 菜单：create/update/delete
- `api/biz/payment.ts`
  - process/detail/order-list/update
- `api/biz/cart.ts`
  - update/remove

### 13.5 按钮权限矩阵（已接入页面显示控制）

- 客户模块
  - `customer:create`、`customer:update`、`customer:delete`
- 客户分组模块
  - `customer:group:create`、`customer:group:update`、`customer:group:delete`
- 商品/分类模块
  - `product:create`、`product:update`、`product:status:update`
  - `category:create`、`category:update`、`category:delete`
- 管理员模块
  - `system:admin:create`、`system:admin:update`、`system:admin:delete`
  - `system:admin:assign`、`system:admin:resetpwd`
- 角色模块
  - `system:role:create`、`system:role:update`、`system:role:delete`、`system:role:assign`
- 菜单模块
  - `system:menu:create`、`system:menu:update`、`system:menu:delete`
- 支付/购物车模块
  - `payment:process`、`payment:update`
  - `cart:update`、`cart:remove`

### 13.6 严格验收记录（本轮）

- 前端：`pnpm -F @vben/web-antd run typecheck` 通过。
- 后端：`mvn -q -DskipTests compile` 通过。
- 运行态接口烟测：
  - `/v3/api-docs` 可访问（返回 OpenAPI 文档）
  - 关键业务接口在未登录状态下统一返回 401（鉴权链路正常）

### 13.7 已知限制

- 当前“商品编辑”按单 SKU 形态处理（满足快速联调；多 SKU 深度编辑可在下一轮扩展）。
- 若要完成“带权限的真实写操作回归”，需提供可登录管理员账号（当前未持有可用账号，故仅完成无鉴权 smoke）。

## 14. 文件上传能力（本轮新增）

### 14.1 文件

- API
  - `apps/web-antd/src/api/biz/file.ts`
  - `apps/web-antd/src/api/biz/index.ts`
- 组件
  - `apps/web-antd/src/components/biz-upload/BizImageUpload.vue`

### 14.2 已接接口

- 文件上传：`POST /api/v1/file/upload`
- 文件删除（预留）：`POST /api/v1/file/delete`

### 14.3 页面能力

- 新增通用单图上传组件 `BizImageUpload.vue`
- 组件对外提供：
  - `v-model` 绑定上传后的 URL
  - `type` 参数：`product` / `voucher` / `avatar`
  - `success` 事件：便于“先上传，再执行业务接口”场景复用
- 组件内置：
  - 图片预览
  - 上传中状态
  - 清空按钮
  - 当前 URL 展示

### 14.4 注意

- 当前前端统一按图片文件处理，默认 `accept=image/*`
- 删除接口已在 API 层预留，但当前页面“清空”仅清除表单值，不主动删除已上传文件
- 本地存储模式下，后端会返回可直接访问的图片 URL，前端无需拼接域名
- 若上传组件点击后接口返回 `403`，优先检查后端是否已执行最新 `shell/initdb/migrate.sql`，并重新登录后台以刷新 `file:upload` / `file:delete` 权限

## 15. 商品多图相册（本轮新增）

### 15.1 文件

- API
  - `apps/web-antd/src/api/biz/product.ts`
- 页面
  - `apps/web-antd/src/views/product/list.vue`

### 15.2 已接接口

- 商品图片添加：`POST /api/v1/product/image/add`
- 商品图片删除：`POST /api/v1/product/image/remove`
- 商品图片排序：`POST /api/v1/product/image/sort`
- 商品图片设为主图：`POST /api/v1/product/image/main`

### 15.3 页面能力

- 商品新增弹窗：
  - 主图字段从“手填 URL”改为上传组件
- 商品编辑弹窗：
  - 拆为“基础信息 / 相册管理”双标签页
  - 基础信息页主图字段改为上传组件
  - 相册页支持：
    - 上传新图片
    - 查看图片缩略图
    - 设置主图
    - 修改排序值并保存
    - 删除图片
- 编辑页每次相册操作后会自动重新拉取商品详情，保持主图/图片列表同步

### 15.4 注意

- 旧商品若只有 `product_info.main_image`，但没有 `product_image` 记录，则相册页可能为空；此时可继续上传相册图补齐
- 当前排序交互采用“填写排序值 + 保存”，未做拖拽排序
- 本轮顺手补了后端一致性：相册“设为主图/删除主图”时，`product_info.main_image` 会同步更新，避免列表页与详情页主图不一致
- 若“相册管理”页签内操作按钮不显示，除检查权限入库外，还需重新登录一次，让 `product:image:*` 权限重新写入当前会话

## 16. 支付凭证上传（本轮新增）

### 16.1 文件

- 页面
  - `apps/web-antd/src/views/payment/list.vue`

### 16.2 页面能力

- 新增支付记录弹窗：
  - `voucherUrl` 从手填 URL 改为上传组件
- 编辑支付记录弹窗：
  - `voucherUrl` 从手填 URL 改为上传组件

### 16.3 注意

- 上传类型固定使用 `type=voucher`
- 仍沿用原有支付业务接口：
  - `POST /api/v1/payment/process`
  - `POST /api/v1/payment/update`

## 17. 管理员代客下单（本轮新增）

### 17.1 文件

- API
  - `apps/web-antd/src/api/biz/order.ts`
- 页面
  - `apps/web-antd/src/views/order/list.vue`

### 17.2 已接接口

- 管理端创建订单：`POST /api/v1/order/admin/create`
- 客户列表：`POST /api/v1/customer/list`
- 商品列表：`POST /api/v1/product/page`
- 商品详情（用于拉 SKU）：`POST /api/v1/product/detail`

### 17.3 页面能力

- 订单列表页新增“创建订单”按钮（权限：`order:admin:create`）
- 新增三步抽屉：
  1. 选择客户 + 填写客户备注/业务备注
  2. 添加商品行：搜索商品、选择 SKU、填写数量
  3. 确认提交：展示客户信息、商品行数、原价预估合计
- 商品行支持：
  - 动态新增/删除
  - 远程搜索商品
  - 按商品加载 SKU 下拉
  - 展示原价单价、库存、原价小计

### 17.4 注意

- 当前“确认提交”展示的是 SKU 原价预估，最终成交价仍以后端按客户分组定价重新计算为准
- 当前客户下拉使用现有客户列表接口加载，未单独新增后端模糊搜索接口
- 若按钮不显示，先确认后端已执行最新 `shell/initdb/migrate.sql`，并确保权限 `order:admin:create` 已分配
- 本轮联调发现：若数据库已补权限，但浏览器仍沿用旧登录会话，订单页不会立即出现“创建订单”按钮；重新登录后即可刷新权限
- 当前本地联调管理员账号：`superadmin / 123456`（仅本地开发环境使用；如密码调整，请同步更新这里）
- 2026-04-02 联调发现：管理员密码修改后，旧 token 仍可继续访问受保护页面；该问题已记录到后端 `docs/SECURITY_TODO.md`

## 18. 2026-04-02 验收阻塞修复

### 18.1 管理员代客下单步骤切换

- 文件
  - `apps/web-antd/src/views/order/list.vue`
- 修复点
  - 将代客下单步骤切换统一收敛到 `handleCreateStepChange`
  - 步骤头点击与底部“下一步”共用同一套校验逻辑
  - 在进入后续步骤前，会逐步校验当前步骤必填项
  - 为步骤内容区增加基于 `createStep` 的重新渲染键，避免抽屉内出现“步骤状态已变化但内容未刷新”的异常表现

### 18.2 支付页查询/录入入口

- 文件
  - `apps/web-antd/src/views/payment/list.vue`
- 修复点
  - 支付查询输入框由“仅订单ID”调整为“支持订单ID或订单号”
  - 若输入纯数字，则按订单 ID 查询
  - 若输入订单号，则先调用订单列表接口解析出内部订单 ID，再继续对账查询
  - “新增支付”改为依赖已查询出来的订单详情，避免只输入了文本但未完成有效查询时直接打开录入流程
- 体验补充
  - 页面新增帮助文案，明确支持从订单列表复制订单号后直接查询
