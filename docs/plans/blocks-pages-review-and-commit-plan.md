# Blocks / Pages 拆分审查与提交计划

日期：2026-09-14
范围：本次文档站分类、路由、导航、搜索、兼容跳转、文档和测试。
提交状态：已按本文三组边界执行。

## 1. 结论与边界

当前 35 项业务展示分为 25 个页面和 10 个区块。Agent Trace 1、通用无限日志表格属于页面。两个集合分别提供列表、详情、筛选和分类内翻页。

本次修改的是文档发现与浏览方式。Registry 安装名称、类型、源码、依赖和安装目标没有迁移。消费者 `registry:page` 和独立 `registry:component` 的建设仍按 [资产迁移方案](./registry-asset-model-and-migration.md) 分阶段推进。

用户原有的 `packages/cli/package.json`、`packages/cli/tests/cli.test.js` 修改不属于本次提交范围。

## 2. 审查发现及修复

| 级别 | 发现与影响 | 修复与验收 |
| --- | --- | --- |
| P2 | 键盘事件保留旧路径：从 Blocks 点击 Pages 后按右方向键，会进入 Blocks 的 Availability Monitor | 路径变化时更新键盘处理器；尊重组件已消费的键盘事件；浏览器验证跨集合、连续翻页及主导航方向键 |
| P2 | Pages 原本只在客户端显示列表，初始响应缺少标题和卡片，影响无脚本读取与内容发现 | 在请求时渲染列表；生产 HTTP 测试检查两个集合及筛选结果的初始 HTML |
| P2 | 每次搜索输入调用路由替换，触发页面请求；URL 同步会裁剪空格，并丢失其他参数和锚点 | 使用 Next 支持的原生 history 同步本地筛选；保留原始输入和已有 URL 状态；验证多词搜索、零结果、返回恢复、语言切换以及搜索期间无路由请求 |
| P2 | 中文历史路径先跳入 `/zh-cn/docs/pages/...`，再由语言中间件处理，产生额外跳转和非规范路径 | 旧中文入口直接 308 到无前缀的中文 Pages 地址，保留查询参数；覆盖 `/zh-cn` 和 `/zh-CN` |
| P3 | Gallery 使用固定头部高度相减；实际移动端头部为 101px，页面产生 5px 多余滚动 | 列表页由 AppShell 分配剩余空间；详情页继续自然滚动；验证移动端无文档溢出且底部卡片可达 |
| P2 | Marketplace 的旧测试强制所有卡片使用 `/docs/blocks`，与新增 Pages 冲突 | 验证稳定 slug、当前公开地址和安装名称；生产及浏览器测试验证真实链接 |
| P3 | 所有未来 Pages 都会自动获得旧 Block 重定向；方案中旧形态数量与新导航数量容易混淆 | 仅为来源确实是 Blocks 的页面生成迁移跳转；文档明确 25 个展示页面与 20 个消费者路由候选的不同口径 |

没有将业务实现重写、Registry 格式迁移或 CLI 版本调整混入这次修复。

## 3. Commit 计划

本次按以下顺序提交。修复随对应功能进入提交，无需另造一条仅记录审查过程的 fix commit。

### Commit 1：文档分类与浏览行为

建议标题：`feat(docs): separate blocks and pages collections`

提交内容：分类数据、双集合路由、来源与公开路径分离、旧地址跳转、站点导航与语言文案、搜索和布局修复，以及原有单元测试的必要更新。

明确暂存范围：

```sh
git add \
  'app/[locale]/docs/blocks/page.tsx' \
  'app/[locale]/docs/pages/page.tsx' \
  'app/[locale]/docs/pages/[slug]/page.tsx' \
  app/sitemap.ts \
  docs/catalog/artifact-collections.ts \
  docs/catalog/artifacts.ts \
  docs/manifest.ts \
  docs/server/render-page.tsx \
  docs/components/blocks/BlocksGallery.tsx \
  docs/components/blocks/BlockDetailPage.tsx \
  docs/components/shell/site/site-shell.tsx \
  docs/components/shell/site/sidebar.tsx \
  docs/content/en/common.json \
  docs/content/en/common-slim.json \
  docs/content/zh-CN/common.json \
  docs/content/zh-CN/common-slim.json \
  next.config.ts \
  tests/docs-artifact-catalog.test.ts \
  tests/i18n-document-manifest.test.ts \
  tests/resource-catalog-preview-contract.test.ts \
  tests/layout-shell-contract.test.ts
```

验收：相关单元测试通过；生产构建通过；安装命令和预览源路径仍有效。该提交完整交付功能，不依赖后续文档提交。

### Commit 2：生产与浏览器回归覆盖

建议标题：`test(docs): cover collection routing and navigation`

提交内容：两个集合的初始 HTML、35 个详情在中英文下的访问与 canonical、25 个旧页面跳转、中文历史前缀、旧筛选参数、404、sitemap、键盘、搜索及移动端浏览行为。

```sh
git add \
  tests/docs-collections-production.test.ts \
  tests/docs-collections.e2e.ts \
  playwright.config.ts
```

验收命令（先使用 Commit 1 的生产构建）：

```sh
pnpm test tests/docs-collections-production.test.ts
pnpm exec playwright test tests/docs-collections.e2e.ts --config playwright.config.ts
```

该提交依赖 Commit 1；Playwright 配置保留原来的 i18n 测试入口。

### Commit 3：资产模型与后续实施文档

建议标题：`docs(registry): define asset layers and staged migration`

```sh
git add \
  docs/plans/registry-asset-model-and-migration.md \
  docs/plans/blocks-pages-review-and-commit-plan.md
```

提交内容：官方类型边界、36 个现有注册条目的逐项处置、Component 拆分候选、消费者路由试点、Template 发布约定、兼容策略、阶段验收和本次审查结论。

验收：清楚区分已完成的导航拆分与未实施的 Registry 协议迁移；数量、名称和路径与代码一致。

## 4. 测试范围与剩余问题

最终验证：

| 检查 | 结果 |
| --- | --- |
| 6 个相关单元测试文件 | 58 项通过 |
| 文档集合生产测试 | 1 项通过，遍历全部中英文详情与迁移地址 |
| 浏览器回归 | 3 项通过：跨集合键盘导航、搜索与历史、移动端滚动 |
| `pnpm build` | 通过，包含项目生产类型检查 |
| 修改的 TS/TSX 文件 lint、`git diff --check` | 通过 |
| 提交范围核对 | 26 个计划内文件完整覆盖本次改动，排除 2 个原有 CLI 修改 |

本地预览已更新至 `http://localhost:3116`。提交前使用 `git diff --cached --stat` 和 `git diff --cached --check` 核对本次暂存范围，避免包含原有 CLI 修改。

首次全量测试：126 个文件，716 项通过、10 项失败。其中一项是本次路由变更遗漏更新的 Marketplace 测试，现已修复。

对其余失败所在的 5 个文件限制并发复查：78 项通过、6 项失败。资源列表交互测试通过；剩余失败分布在 4 个文件：

- `tests/import-boundaries.test.mjs`：`types/hugeicons.d.ts` 不符合公共导出目录约定。
- `tests/registry-consistency.test.mjs`：同一声明文件不符合 Registry 源路径约定。
- `tests/semantic-tokens.test.mjs`：两项已有任意字体尺寸检查失败。
- `tests/infinite-log-table-interaction.test.tsx`：时间范围交互、Live 边界标记断言失败；首次全量运行还出现并发相关超时。

这些测试及其直接使用的业务源码、UI 源码、Registry 清单均未在本次修改；不能据此宣称整库测试已通过。它们应作为独立修复处理，避免扩大这次文档分类提交。
