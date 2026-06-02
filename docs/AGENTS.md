# Repository Guidelines

## Scope

- These instructions apply to the entire workspace rooted here.
- The workspace contains a Spring Boot backend in `BizPort/`, a pnpm/Vue admin monorepo in `vue-vben-admin/`, and a customer H5 storefront in `bizport-h5/`.
- Check for more-specific `AGENTS.md` files before editing nested directories; nested instructions override these.
- For BizPort backend work, always consider the documents under `BizPort/doc/` and `BizPort/docs/` before changing behavior.

## General Workflow

- Keep changes focused on the requested task and avoid unrelated refactors.
- Prefer `rg`/`rg --files` for searches.
- Use `apply_patch` for file edits.
- Do not commit changes, create branches, or run destructive git commands unless explicitly requested.
- When adding or changing behavior, update nearby tests or docs if the project already has an obvious place for them.

## Backend: `BizPort/`

- Product positioning: single-merchant, single-tenant wholesale ordering/admin system for county-level apparel/shoes merchants; it is not yet a multi-tenant SaaS platform.
- Current state: MVP admin backend is mostly usable; customer-facing storefront lives in `bizport-h5/`.
- Java version: 17; default local Java may be 8, so set `JAVA_HOME` to a JDK 17 before Maven commands if needed.
- Framework: Spring Boot 3.5, MyBatis-Plus, PostgreSQL, Redis, Sa-Token, springdoc-openapi.
- Run Maven commands from `BizPort/`.
- Useful commands:
  - `mvn -q -DskipTests compile`
  - `mvn test`
  - `mvn spring-boot:run`
- Local services are expected to be PostgreSQL on `localhost:5432` using database `biz_port`, and Redis on `localhost:6379`; `BizPort/shell/docker-compose.yml` can start supporting services.
- Initialization SQL lives in `BizPort/shell/initdb/init.sql`; incremental migration/backfill SQL lives in `BizPort/shell/initdb/migrate.sql`.
- Local file storage uses `./uploads` with URL prefix `/uploads`.

## BizPort Backend Architecture

- Follow the documented layering: `Controller -> Handler -> Service -> Mapper -> DB`.
- Controllers must extend `BaseController`, validate request DTOs, call `processHandler`, and return `BaseResponse.success(...)`; do not call `handler.doBusiness()` directly.
- Handlers are the only business orchestration and transaction boundary; implement `IBusinessHandler` and put `@Transactional(rollbackFor = Exception.class)` on `doBusiness`.
- Do not call one Handler from another Handler; orchestrate multiple Services inside the current Handler.
- Services provide reusable atomic capabilities, should be interface-based (`I*Service` + `*ServiceImpl`), and must not define `@Transactional`.
- Services may inject only their own domain Mapper directly; cross-domain writes should be coordinated by Handler, while complex reads may use Mapper-level JOIN SQL for performance.
- Mappers are the database access layer and may use MyBatis annotations or XML.

## BizPort Coding Rules

- Request DTOs must extend `BaseRequest`, be named `*Req`, and include JSR-303 validation annotations.
- Response DTOs must implement `Serializable`, be named `*Res`, and use the unified response model.
- Pagination uses `pageNo` and `pageSize` in requests, and `total` plus `records` in responses.
- Module-specific enums belong under `model/{module}/entity/enums/`; only truly shared enums belong under `common/model/enums/`.
- Use `BeanCopyUtil` for bean copying where it matches existing patterns.
- Define shared constants in `SysConstant` and keep them grouped by module.
- Database tables and fields use lowercase snake_case; base fields should align with `BaseEntity`.
- PostgreSQL IDs use `BIGSERIAL PRIMARY KEY`, MyBatis-Plus `IdType.AUTO`, and inserts should not manually specify `id`.
- Time fields are `created_at` and `updated_at`, not `create_time` or `update_time`.

## BizPort Permissions and Frontend Coupling

- Admin frontend menus and permissions are database-driven, not hardcoded only in the frontend.
- When adding backend permissions, keep the three parts in sync: backend permission code, database menu/button permission rows, and frontend permission usage.
- New permissions or menus must be reflected in both full initialization SQL and incremental migration SQL when appropriate.
- Frontend page components are resolved from database `component` values to `src/views/**/*.vue`; button permissions use `menuType=3`.
- Customer H5 permissions are also real backend permissions. When exposing an endpoint to H5 customers, keep Sa-Token permission annotations and `CustomerAccessPolicy` in sync; do not bypass permission failures in H5 with mock data.

## BizPort Security and Risk Notes

- Do not log sensitive fields such as passwords, tokens, or secrets; operation logging is known to need masking.
- After password reset/change flows, invalidate old Sa-Token sessions where appropriate.
- Avoid user-enumeration login errors; prefer a generic username/password failure message.
- Consider password-strength validation and login-failure throttling when touching auth flows.
- Be careful with permission caching and role/menu updates; cache invalidation issues have been a historical risk.
- `mvn test` may require real local PostgreSQL/Redis and can fail in sandboxed environments for connectivity rather than compile reasons.

## Frontend: `vue-vben-admin/`

- Package manager: pnpm.
- Node engine: see `vue-vben-admin/package.json`.
- Run pnpm commands from `vue-vben-admin/`.
- Useful commands:
  - `pnpm install`
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint`
  - `pnpm test:unit`
- For targeted app work, prefer filtered commands such as `pnpm -F <package> ...`.
- Follow existing Vue, TypeScript, ESLint, and monorepo package patterns.
- BizPort admin app development commonly uses port `5666`, API prefix `/api`, and Vite proxy to backend `http://localhost:9999`.
- Before production builds, verify BizPort API configuration because existing production env may still point to upstream Vben mock services.

## Frontend: `bizport-h5/`

- Product surface: customer-facing H5 storefront for the single-merchant wholesale ordering system. It is the active H5 implementation; archived experiments live under `archive/h5-experiments/`.
- Stack: uni-app + Vue 3 + TypeScript + Pinia. Do not introduce React, Tailwind, lucide-react, motion, or other Figma-export runtime dependencies into this app.
- UI library: use Wot UI (`@wot-ui/ui`) in npm mode for controls, feedback, tab bars, popups, loading states, and form inputs. Do not switch to `uni_modules` unless explicitly requested.
- Package manager: pnpm. Run H5 commands from `bizport-h5/`.
- Useful commands:
  - `pnpm typecheck`
  - `pnpm build:h5`
  - `pnpm dev:h5`
- Local H5 dev server uses `http://127.0.0.1:5666/`; if sandboxed execution cannot bind the port, rerun with host/port permission or start it from the local terminal.
- Wot UI npm integration depends on:
  - `pages.json` `easycom` mapping `wd-*` to `@wot-ui/ui/components/wd-$1/wd-$1.vue`
  - `tsconfig.json` type entry `@wot-ui/ui/global`
  - `App.vue` wrapping the app with `wd-config-provider`, plus global `wd-toast` and `wd-dialog`
- The design source for the current H5 rebuild is the project-root `Wholesale Clothing App Design.zip` Figma Make export. Treat its React/Tailwind source and `src/imports/*.png` assets as the visual source of truth unless the user provides a newer design source.
- Exported Figma image assets used by H5 belong in `bizport-h5/src/static/figma-export/`. Avoid replacing them with hand-made placeholder SVGs when implementing designed screens.
- Global H5 visual tokens should follow the Figma export: white/`#F7F7F7`/`#F8F9FB` backgrounds, primary orange `#FF6600`, black/orange high-contrast buttons, rounded mobile cards, fixed bottom actions, and a 4-tab bottom navigation for Home, Category, Cart, and Mine.
- Keep Wot UI theme variables aligned with the Figma palette. In practice, Wot CSS variables also need to be defined in `src/styles/global.scss` under `:root,page`; relying only on `wd-config-provider` may not override every H5 component style.
- Keep the H5 frontend mobile-first. The app shell and fixed bars should be constrained to a mobile-width container so desktop preview does not stretch bottom navigation or action bars across the full browser width.
- Native uni `tabBar` is intentionally not used for the H5 shell. The app uses `src/components/AppTabBar.vue` with `wd-tabbar`; `src/utils/navigation.ts` uses `uni.reLaunch` for custom tab switching.
- Prefer Wot UI components over native elements: `wd-button`, `wd-search`, `wd-input`, `wd-textarea`, `wd-checkbox`, `wd-radio`, `wd-input-number`, `wd-popup`, `wd-empty`, `wd-skeleton`, and `wd-loadmore`.
- Homepage banner behavior should use `wd-swiper`; broadcast/marquee should not expose a raw horizontal scrollbar. Ranking or product strips may remain horizontal only if scrollbars are hidden and card widths are stable.
- Category pages should use `wd-sidebar` for first-level categories and a natural right-side content area.
- Cart, checkout, product-detail SKU, payment method, address, share, and hold-stock interactions should use Wot popups/sheets rather than hand-written `modal-mask` overlays.
- Wot `wd-popup` defaults to a low z-index. Any popup that must appear above fixed bottom action bars should set an explicit high `:z-index`, commonly `120` or higher.
- Login is password-based for this project: account/phone plus password, calling `/auth/customer/login`. Do not implement SMS-code login unless the backend capability is added and the user asks for it.
- The H5 API layer follows BizPort backend response semantics: only `BaseResponse.code === 0` is success; login token is persisted locally; authenticated requests send the current Bearer token and compatible Sa-Token header where the H5 request wrapper already does so.
- Authenticated H5 business APIs that require `customerId` must restore session from local storage before sending requests. If Pinia has a token but no user/customer id, refresh `/auth/userinfo` first; do not send an empty `customerId` to backend cart/order APIs.
- Real H5 transaction flow should keep using backend APIs for login/user info, category/product, cart, order, payment reconciliation, WeChat prepay, offline payment, and available refund endpoints.
- For real main-chain pages such as category, product, cart, order, order detail, payment, and reconciliation, do not use mock fallbacks to hide backend errors. Show a clear error/empty state and fix the backend/API adapter when needed.
- Pages whose backend capability is incomplete, such as messages, favorites, address, reservation/hold-stock, FAQ, and parts of after-sales, should show explicit empty/unavailable states and must not fake local records, fake saves, or mock fallbacks. `bizport-h5/src/data/mock.ts` has been removed; do not reintroduce mock data to hide backend gaps.
- Order-level payment status values are `UNPAID`, `PARTIALLY_PAID`, and `FULLY_PAID`; `PAID` is a payment-record-level status. H5 order list/detail logic must not compare order `paymentStatus` only to `PAID`.
- Customer order list responses may include `hasPendingPayment`. When it is true, show a pending-review state such as `付款审核中` and hide `去付款`/`去支付` actions until backend audit changes the payment state.
- Offline or bank-transfer payment registration creates a payment record that may remain pending audit while the order status is still `CREATED`; this is expected and should not be treated as an unpaid order that needs another payment.
- When adapting Figma export code, translate the page structure and interaction into Vue/uni-app + SCSS components. Do not paste React/Tailwind code directly.
- Known H5 pitfall: Wot UI `@wot-ui/ui@2.0.8` has had a local TypeScript issue where `ConfigProviderProvide` lacked `theme`; if still present, preserve the pnpm patch under `bizport-h5/patches/` and the `patchedDependencies` entry until a dependency upgrade proves it is fixed.
- Known H5 pitfall: current Wot UI `wd-empty` uses the `tip` prop for displayed text; `description` will not render the empty-state copy.
- Known H5 pitfall: `uni.switchTab` only works for pages listed in `pages.json` `tabBar`; non-tab pages such as orders, payment, and detail pages must use `uni.navigateTo`.
- Known H5 pitfall: fixed headers, bottom actions, and custom tab bars need the same max-width as `.app-shell`; otherwise desktop H5 preview shows full-width bars that do not match the mobile design.
- Known H5 pitfall: Wot icon names may differ from expected names. If an icon renders blank, verify the exact Wot icon name. The current H5 bottom tabs use known-good Wot icons `home`, `apps`, `archive`, and `user`.
- Shared H5 page headers should use `src/components/PageHeader.vue`. Keep the header single-line, title centered independently from left/right actions, and put page content padding below the header rather than on a root wrapper that moves the header down.
- For H5 segmented filters such as order status, prefer a lightweight segmented control with a sliding selected indicator and subtle content transition over a full-width hard tab bar when it sits above card lists.
- Current unfinished H5 integration work: visually implemented mock-backed pages still need real backend endpoints before production use for messages, favorites, address management, reservation/hold-stock, FAQ content management, and full after-sales state transitions.
- Current unfinished H5 payment work: WeChat H5/JSAPI payment depends on real merchant configuration, callback domain, and backend return fields; the frontend should handle returned fields but should not invent merchant/payment backend behavior.

## Real Commerce Data Governance

- Treat BizPort as a real wholesale storefront, not a demo app. H5 and admin-visible data should look like county-level apparel/shoes wholesale operations: apparel categories, real customer names, realistic order snapshots, meaningful SKU specs, prices, inventory, and payment states.
- Prefer page-first investigation for H5/admin issues. Use the in-app browser to inspect visible UI and verify fixes; use commands, SQL, and APIs for root-cause analysis, bulk data repair, and final validation.
- Do not use frontend mock data, fake counters, fake coupons, fake points, fake payment methods, fake bank accounts, fake favorites, or "saved locally" behavior. If a backend capability is missing, show a clear unavailable/empty state instead.
- Runtime data changes that affect seed/demo state must be mirrored in `BizPort/shell/initdb/init.sql` and `BizPort/shell/initdb/migrate.sql`. Migration SQL must be idempotent and safe to run repeatedly.
- Old test/demo data such as `iPhone`, `MacBook`, `Samsung`, `电子产品`, `第一个商品`, `自动化测试商品`, and placeholder customers/orders must not be visible in H5 or admin lists. Hide by status or `is_delete` rather than filtering only in the frontend.
- When changing product categories, keep `product_category.parent_id`, `path`, H5 category display, and product `category_id` consistent. Do not rely on category `path` containing business codes if backend code expects numeric IDs; prefer `parent_id` for category path logic.

## Product, SKU, and Image Rules

- Real products must include a product code, name, business description, category, unit, status, main image, SKU list, prices, stock, and realistic specs such as `color`, `size`, and `material`.
- Product and order specs shown to users should be localized: `color -> 颜色`, `size -> 尺码`, `material -> 材质`. Avoid exposing electronics-specific keys such as `storage`, `memory`, `processor`, or `resolution` for apparel products.
- If there is no real sales metric, do not show `已售 0`. Prefer true inventory language such as `现货` or `仓库现货` based on backend stock.
- Current storage provider is MinIO (`storage.provider=minio`). Product images should be uploaded through backend storage/file upload flows and persisted as MinIO URLs in `product_info.main_image`, `product_image.image_url`, and `product_sku_info.sku_image`; do not use long-term H5 local static image fallbacks.
- H5 `uni-image` must be visually verified in the browser. A URL returning `200` is not enough; inspect rendered `uni-image` and confirm its inner `background-image` is not `none`.
- Prefer PNG/JPG/WebP product images for H5. SVG may be accessible by URL but still fail to render reliably in `uni-image`.

## Orders and Payment Realism

- H5 order list/detail should use real backend order/customer/payment data. Do not hide backend errors with generic product combinations or hardcoded order counts.
- Order status and payment status should be user-facing Chinese text, not raw backend enum values such as `CREATED`.
- Order-level payment statuses are `UNPAID`, `PARTIALLY_PAID`, and `FULLY_PAID`; payment-record statuses such as `PAID`, `SUBMITTED`, and `PENDING` are not interchangeable.
- If `hasPendingPayment` or a pending audit payment exists, show `付款审核中` and hide duplicate pay actions until backend audit changes the state.
- Do not invent Alipay, fake bank accounts, fake discounts, or fake payment assets. Payment UI should only expose real backend-supported flows such as WeChat prepay and offline/bank-transfer registration.

## Suggested Agent Responsibilities

- H5 page QA agent: inspect Home, Category, Product Detail, Cart, Orders, Order Detail, Payment, and Mine in the browser; flag visible fake data, gray images, enum leaks, or broken empty states.
- Data governance agent: maintain realistic products, SKUs, customers, orders, payment records, categories, and visibility flags in PostgreSQL and SQL migrations.
- Storage/image agent: upload product assets to MinIO, update DB image URLs, and verify H5 `uni-image` renders real images.
- SQL sync agent: keep runtime data fixes mirrored into `init.sql` and `migrate.sql`, preserving idempotency and avoiding duplicate seed rows.
- Payment/order agent: validate payment audit states, reconciliation display, order actions, and status labels across H5 and admin.

## Validation

- Start with the most targeted validation for the changed area, then run broader checks when appropriate.
- If validation cannot be run due to sandboxing, missing dependencies, or required services, report that clearly with the exact command to run.
