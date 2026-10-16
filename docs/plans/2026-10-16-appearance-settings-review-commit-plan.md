# Appearance Settings：Review 与 Commit 计划

日期：2026-10-16。基于 HEAD `e9ccb47c`，范围为 `appearance-settings-01`。用户已授权提交到 GitHub main，按本文边界在独立 checkout 中准备提交，原工作区的其他任务改动保留。

## Review 结论与修复

| 项目 | 结论与处理 |
| --- | --- |
| 窄屏长翻译溢出 | 在 320px 视口扩展 density 标签后，ContainerBody 的 scrollWidth 曾达到 593px。控制区增加 min-width 约束，TabsList 通过公开 className 限制最大宽度并允许内部横向滚动。修复后 ContainerBody 的 clientWidth 与 scrollWidth 均为 270px；577px 的长标签只在 238px 的 Tabs 内滚动。未修改 Tabs、TabItem 的字号、尺寸或形状。 |
| 组件组织 | 将主题预览中的嵌套渲染函数整理为私有 ThemePreviewPane，复用强调色样式对象，展开导出和密度参数类型。色板通过公开 badge-colors 入口导入，不经 Badge 组件入口。 |
| 回调类型边界 | 移除 theme、density、motion 回调中将任意 string 强制转换为枚举的写法，明确只提交受支持值。保留完整受控 value/onValueChange 和宿主保存职责。 |
| 测试缺口 | 增加主题选择、动效菜单回调、宿主主题不被修改的行为验证；密度测试通过 tablist 的可访问名称定位，避免依赖控件出现顺序。 |
| 用户已确认的设计 | ContainerHeader 承载标题及描述；内容层不再添加 p-1/sm:p-4；第一强调色读取 var(--brand)；两组密度使用 pill Tabs。全部保留。 |
| 共享原语与业务边界 | 未修改 UI 原语、全局主题、持久化或应用外壳。原生元素只组织设置内容与装饰性主题预览。 |

组件清单、设计规则和浏览器证据保存在 `output/appearance-settings/`；该目录被 Git 忽略，不计入提交。具体结果以 `review-verification.json` 和 `review-after.json` 为准。静态规则未覆盖的内联样式、动态类名已人工核对：样式值来自共享色板或 brand token，className 使用已存在的 light/dark 模式。

当前混合工作区的复验：7 个测试文件、49 项测试通过；全项目类型检查、完整设计 lint、Registry 检查和生成产物一致性检查通过；独立 Vite/npm 消费者安装并构建通过。浏览器检查覆盖 1440px 桌面、390px 手机及 320px 长标签压力场景，主题、强调色、独立密度与动效菜单均已操作，未发现页面错误。block 继续使用 13 类公开 UI 组件、16 处 JSX 使用；本次静态报告为 0 错误、0 警告。

## 推荐一个原子提交

```text
feat(blocks): add appearance settings block
```

包含最终实现、回归测试、演示和文档、发现目录、Registry 及相应生成产物。它们共同组成一个可发现、可安装的 block；不拆成只有源码而尚未注册或缺少文档入口的中间提交。

### 可整文件加入的新增文件

- `packages/blocks/src/application/appearance-settings-01/` 的实现、类型、文案和导出。
- `docs/components/blocks/AppearanceSettingsDemo.tsx`。
- `docs/pages/blocks/appearance-settings-01/`。
- `docs/content/{en,zh-CN}/blocks/appearance-settings-01.json`。
- `docs/agent-guides/blocks/appearance-settings-01.md`。
- `app/[locale]/docs/blocks/(detail)/appearance-settings-01/page.tsx`。
- `tests/appearance-settings-interaction.test.tsx`。
- 本计划。
- 隔离生成后的 `public/r/appearance-settings-01.json` 和新 `public/docs-source/<hash>.txt`，以实际生成的哈希为准。

### 共享文件只选此 block 的改动

| 文件 | 应进入提交的部分 |
| --- | --- |
| `packages/blocks/package.json`、`block-capabilities.json`、`registry.json`、`src/catalog.ts` | 仅新增 appearance-settings-01 的导出、React data-block 能力、依赖与文件列表；保留原有其他条目的顺序。 |
| `docs/catalog/artifacts.ts`、`docs/manifest.ts` | 仅新增此外观 block 的发现条目。 |
| `docs/components/blocks/{BlockPreview,StandaloneBlockDemo}.tsx`、`standalone-blocks.ts` | 仅新增 appearance 演示加载器、导入、switch 分支及 slug；不包含 usage-timeline/usage-forecast 的已有排序调整。 |
| `docs/agent-data/{components,guide-routes,item-identities}.json` | 仅新增此外观 block 的语义信息、指南路由与身份；指南路由保持排序。不包含其他条目重排、格式化及 capacity-index-chart。 |
| `docs/content/{en,zh-CN}/common.json` | 仅新增此外观 block 的描述。 |
| `scripts/preview-source-allowlist.mjs` | 仅新增此外观 block 的源码列表。 |
| `scripts/test-consumer-installs.mjs` | 仅新增 appearance 的 Next 和 Vite 消费者示例。 |
| `tests/docs-artifact-catalog.test.ts` | block 数量由 58 变 59、嵌入式 block 数量由 32 变 33，以及 data-block 列表加入 appearance。 |
| `tests/i18n-document-manifest.test.ts` | 增加 appearance 属于 blocks 的断言；基于当前 HEAD 单独加入 appearance 时，文档数量应为 **142**，legacyDocRedirects 仍为 **82**。不包含 capacity 图表断言和其他删除。 |

当前工作区的文档数量 **143**、legacyDocRedirects **83** 同时包含未提交的容量图表。直接将该测试文件整体暂存，会让外观 block 的提交依赖其他任务。保持当前混合工作区的正确断言；在隔离的暂存版本中使用 142/82，不通过删除测试或放宽断言规避。

### 生成产物在隔离范围内重新生成

以下文件混有其他任务结果，不能从当前工作区整文件暂存：

- `public/r/registry.json`。
- `public/llms.txt`、`public/llms-full.txt`。
- `docs/generated/{agent-guide-loaders,block-page-loaders,page-loaders}.generated.ts`。
- `docs/i18n/content-loaders.generated.ts`。
- `docs/lib/block-preview-sources.generated.ts`。

先在以 HEAD 为基础的隔离暂存版本或临时 checkout 中只应用本计划范围的源码、目录和测试改动，再依次执行：

```sh
node scripts/generate-document-loaders.mjs
node scripts/generate-document-routes.mjs
node scripts/generate-preview-sources.mjs
node scripts/generate-agent-guide-loaders.mjs
pnpm --filter @zeron/registry build
node scripts/build-skill-distribution.mjs
node scripts/build-agent-catalog.mjs
```

将该隔离版本的产物随 feature 一起提交。不要手工复制混合工作区的完整 Registry、LLM 文档或生成 loader，也不要修改它们来绕过检查。

## 提交前检查

在隔离后的最终提交快照中运行以下检查；当前工作区的通过记录不替代这一步。

```sh
pnpm exec vitest run --config vitest.config.mts \
  tests/appearance-settings-interaction.test.tsx \
  tests/docs-artifact-catalog.test.ts \
  tests/i18n-document-manifest.test.ts \
  tests/i18n-message-parity.test.ts \
  tests/block-standalone-demo-contract.test.ts \
  tests/registry-consistency.test.mjs \
  tests/workflow-gallery.test.ts
pnpm typecheck
pnpm lint:design
pnpm registry:check
node scripts/generate-document-loaders.mjs --check
node scripts/generate-document-routes.mjs --check
node scripts/generate-preview-sources.mjs --check
node scripts/build-agent-catalog.mjs --check
```

独立消费者验证范围限定为此外观 block，例如：

```sh
ZERON_CONSUMER_PACKAGE_MANAGERS= \
ZERON_VITE_CONSUMER_COMPONENTS=appearance-settings-01 \
node scripts/test-consumer-installs.mjs
```

最后核对 `git diff --cached --check`、`git diff --cached --stat` 与完整暂存差异。本次按用户授权执行 commit，并以普通 fast-forward push 推送到 main。

## 本次不包含

- `capacity-index-chart` 的源码、组件导出、Registry、内容、路由、封面及测试。
- `app/(internal)/component-canvas/`、`app/[locale]/chart-demo/` 及其测试。
- `middleware.ts`、`docs/components/shell/site/sidebar-layout.tsx`、`tsconfig.json`。
- `packages/ui/package.json`、`packages/ui/registry.json`、`docs/generated/component-page-loaders.generated.ts`。
- 其他组件卡片文案、组件封面生成脚本，以及已有条目的重排或格式化。
- `output/` 中的截图、日志、组件统计与临时安装证据。

这些改动均保留在原工作区，本次 review 不回退、不暂存，也不为外观 block 的提交引入依赖。

## 隔离提交验证记录

2026-10-16 在基于 `e9ccb47c` 的独立 checkout 中完成：

- 文档数量为 142、legacyDocRedirects 为 82；未加入 capacity-index-chart。
- 7 个测试文件、49 项测试全部通过。
- 全项目类型检查和完整设计 lint 通过。
- Registry 全部 170 项检查通过，Agent catalog 为 179 项、78 份指南。
- 文档 loaders、路由、预览源码和 Agent catalog 的生成一致性检查通过。
- 独立 Vite/npm 项目通过打包 CLI 安装此外观 block 并构建成功。
- 原工作区未参与暂存；工作副本的其他未提交文件在推送前后核对内容哈希。
