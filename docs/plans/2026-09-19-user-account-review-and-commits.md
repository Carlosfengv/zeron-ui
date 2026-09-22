# 用户账号 Block：会话整理、Review 与提交计划

日期：2026-09-19。范围：本会话的账号菜单、页面接入、演示、文档与发布产物。尚未暂存或创建 commit。

## 最终交付范围

- 新增 `user-account-01`，复用 SidebarAccountMenu，提供受控主题、语言、账号动作及扩展菜单。
- ZAIops、资源工作区和个人设置接入统一账号入口，保留资源工作区旧账号接口。
- 账号封面、详情预览和独立 Demo 居中；嵌入侧栏时不套居中画布。
- Demo 中的通知和个人设置是静态菜单项，无回调，`closeOnClick: false`；点击不跳转、不弹窗、不关闭菜单。
- 账号 trigger 左右内边距为 1.6 个 spacing 单位，默认 6.4px；上下内边距保持原值。
- 通知中心 Block 已移除，没有源码、文档、导出、安装产物或测试残留。它未进入 HEAD，因此无需单独创建删除或 revert commit。
- 真实登出和偏好保存由使用方接入；文档演示只结束演示会话。

## Review 结果

| 问题 | 影响 | 处理 |
| --- | --- | --- |
| 账号 Demo 静态导入完整个人设置页面 | 打开账号预览会引入设置、图表等无关模块 | 将设置适配移入 PersonalSettingsAccountDemo；设置和 ZAIops 分支使用 lazy/Suspense，账号预览直接渲染。未对包体积降幅做量化承诺。 |
| 资源工作区的 account.className 覆盖折叠样式 | 接入自定义 className 后，折叠态可能继续展示姓名和邮箱 | 在展开 account 属性后合并 className，保留必要的折叠样式。 |
| 子菜单展开后变为 disabled，选项仍未禁用 | 已打开的 RadioItem 与父项状态不一致 | 将 disabled 传给每个 RadioItem，加入展开后禁用的交互测试。 |
| 设置示例的资料邮箱与账号入口不同 | 同一演示会话出现两个身份 | 设置示例的名称、邮箱和头像缩写统一从 account.user 派生。 |
| 静态菜单行为缺少自动回归覆盖 | 后续修改可能恢复默认的点击关闭 | 添加通知、个人设置点击后菜单继续打开、无 Dialog 的测试。 |

保留已经验证的受限设置导航、防止重复登出、失败后重试和外部 pending 状态行为。没有发现需要继续阻塞本次账号功能的已知问题；全仓类型检查的既有失败见下文。

## Commit 1

`feat(ui): extend sidebar account menu controls`

内容：受控展开、上下弹出方向、菜单和子菜单禁用、trigger 水平内边距。

文件：

- `packages/ui/src/components/sidebar-account-menu.tsx`
- `public/r/sidebar-account-menu.json`
- `tests/sidebar-source-contract.test.ts`：仅暂存 `side="top"` 改为 `menuSide` 的断言部分。

这个测试文件也包含 Demo 迁移断言；应拆分 hunk 或编辑暂存补丁，将 UserAccountDemo 相关断言留给 Commit 3。

## Commit 2

`feat(blocks): add reusable user account entry`

依赖 Commit 1。内容：账号 Block、业务接入契约、现有页面迁移、安装元数据及回归测试。

源码与注册：

- `packages/blocks/src/application/user-account-01/`
- `packages/blocks/src/application/zaiops-operations-01/zaiops-operations.tsx`
- `packages/blocks/src/application/resource-workspace-shell-01/resource-workspace-shell.tsx`
- `packages/blocks/src/application/personal-settings-01/personal-settings.tsx`
- `packages/blocks/src/application/personal-settings-01/index.ts`
- `packages/blocks/package.json`
- `packages/blocks/block-capabilities.json`
- `packages/blocks/registry.json`
- `packages/blocks/src/catalog.ts`

生成文件：

- `public/r/user-account-01.json`
- `public/r/zaiops-operations-01.json`
- `public/r/resource-workspace-shell-01.json`
- `public/r/personal-settings-01.json`
- `public/r/registry.json`

测试与安装验证：

- `tests/account-blocks-interaction.test.tsx`
- `tests/resource-list-page-contract.test.ts`
- `scripts/test-consumer-installs.mjs`

生成文件应与对应源码一起提交，不单独提交过渡版本，也不手工编辑最终 Registry 内容。

## Commit 3

`docs(blocks): publish centered user account previews`

依赖 Commit 2。内容：居中预览、静态菜单示例、按需加载、文档、目录和双语内容。

演示与页面：

- `docs/components/blocks/AccountBlocksDemo.tsx`
- `docs/components/blocks/PersonalSettingsAccountDemo.tsx`
- `docs/components/blocks/BlockPreview.tsx`
- `docs/components/blocks/StandaloneBlockDemo.tsx`
- `docs/components/blocks/standalone-blocks.ts`
- `docs/components/shell/site/zaiops-sidebar-preview.tsx`
- `docs/pages/blocks/user-account-01/page.tsx`
- `docs/pages/blocks/zaiops-operations-01/page.tsx`
- `docs/pages/blocks/personal-settings-01/PersonalSettingsBlockDocClient.tsx`

文档与目录：

- `docs/agent-guides/blocks/user-account-01.md`
- `docs/content/en/blocks/user-account-01.json`
- `docs/content/zh-CN/blocks/user-account-01.json`
- `docs/content/en/common.json`：仅 `docMeta.descriptions.user-account-01`。
- `docs/content/zh-CN/common.json`：仅 `docMeta.descriptions.user-account-01`。
- `docs/catalog/artifacts.ts`
- `docs/manifest.ts`
- `docs/generated/block-page-loaders.generated.ts`
- `docs/generated/page-loaders.generated.ts`
- `docs/i18n/content-loaders.generated.ts`
- `tests/i18n-document-manifest.test.ts`
- `tests/sidebar-source-contract.test.ts`：剩余 Demo 迁移断言。
- 本整理文档可随此提交，或仅作为执行清单保留。

两份 common.json 同时包含其他工作的 `navigation.home` 改动；只暂存账号描述对应的 hunk。

## 本次不应混入的工作区修改

- 首页、站点导航、npm 版本展示与相关路由测试：`app/[locale]/page.tsx`、`docs/pages/home.tsx`、`docs/components/shell/site/site-shell.tsx`、home/common-slim 翻译、`docs/lib/npm-release.server.ts`、npm-release 与首页路由测试等。
- CLI 迁移能力：`packages/cli/` 下的修改、新增 swap 模块与测试、迁移 fixtures 和迁移验证脚本。
- 技能与分发：`.agents/skills/`、`docs/skills/`、SkillInstall/CopyPrompt、相关构建脚本、介绍页与技能测试。
- 根目录 `package.json`、`pnpm-lock.yaml`、README、CI、`.gitignore`、`vercel.json` 及既有 swap 计划，属于上述其他工作。

执行时逐文件检查 `git diff` 和 `git diff --cached`，不要使用 `git add .`。本计划没有进行实际暂存。

## 验证记录

- 本轮：8 个相关测试文件、61 个测试通过。
- 本轮：全量 `pnpm lint:design` 通过；新增 Demo 与交互测试文件的 ESLint 检查通过。
- 本轮：`pnpm --filter @zeron/blocks typecheck` 通过。
- 本轮：重新生成 Registry，`pnpm registry:check` 通过，共 129 项。
- 本轮：个人设置的延迟加载和统一账号资料在浏览器中验证。
- 本会话此前：Next.js/Vite 消费端账号安装及构建通过；本轮未重复运行消费端构建。
- 本会话此前：封面与详情中心点一致、左右 6.4px 内边距、静态菜单点击、主题和语言切换、窄屏交互已在浏览器验证。
- 全仓 `tsc --noEmit` 仍失败于未在本会话修改的既有测试类型问题：`commit-history.test.ts`、`i18n-message-parity.test.ts`、`infinite-log-controller.test.tsx`、`tree-scenarios.test.tsx`。不能将 Block 类型检查通过表述为全仓类型检查通过。

提交前检查暂存补丁与上述范围一致，并运行 `git diff --cached --check`。每步完成后再进入下一步；若期间有其他会话继续修改相同文件，应重新检查 hunk 归属。
