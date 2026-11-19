# 文档站 IA 与 AI 设计指南提交计划

2026-11-19 的提交候选以本地已知的 `origin/main`（`0e7798c1`）为父版本。原开发工作区位于 `50845895`，两者分别有 2 和 26 笔独有提交。本次从目标基线提取两笔增量，共 44 个文件。目标基线已经包含的并行特性继续作为基线内容。

| 顺序 | Commit message | 文件 | 验收重点 |
| --- | --- | ---: | --- |
| 1 | `feat(agents): publish design rules and 20 verified guides` | 29 | 指南、公开契约、开发与冻结 Release 的语料一致性 |
| 2 | `feat(docs): connect search, design actions and gallery filters` | 15 | 中英文发现路径、键盘操作、契约链接、剪贴板与场景筛选 |

第二笔的 AI 提示词直接引用第一笔新增的设计规则。工作区内 `agent-run-01`、`fallback-chain-01`、`context-map`、`decision-tree`、`packages/icons` 等并行改动均排除在增量之外。两份补丁均针对 `0e7798c1` 导出。切换父版本时需在新基线上重新合并共享文件、生成目录并复验。

## 第一笔 · 设计规则与 20 篇指南

| 范围 | 文件与改动 |
| --- | --- |
| 规则与 Release（4） | `lib/agent-catalog/design-rules.mjs`、`scripts/build-agent-catalog.mjs`、`scripts/agent-catalog-release.mjs`、`tests/agent-release-restore.test.mjs`。开发目录与新 Release 使用同一组 5 条设计规则，历史 Release 仍按冻结时的模板校验。 |
| 指南（20） | 下列 14 篇组件指南和 6 篇模板指南均带有纳入类型检查的 TSX 示例。 |
| 路由（1） | `docs/agent-data/guide-routes.json` 仅增加上述 20 条记录。 |
| 已跟踪的生成产物（4） | `docs/generated/agent-guide-loaders.generated.ts`、`public/llms.txt`、`public/llms-small.txt`、`public/llms-full.txt`，均在提交目标基线上重新生成。 |

**组件指南**

- `docs/agent-guides/components/ask-user-questions.md`
- `docs/agent-guides/components/auth-layout.md`
- `docs/agent-guides/components/card.md`
- `docs/agent-guides/components/container.md`
- `docs/agent-guides/components/detail-list.md`
- `docs/agent-guides/components/dropdown.md`
- `docs/agent-guides/components/empty.md`
- `docs/agent-guides/components/input-message.md`
- `docs/agent-guides/components/popover.md`
- `docs/agent-guides/components/resizable.md`
- `docs/agent-guides/components/skeleton.md`
- `docs/agent-guides/components/tabs.md`
- `docs/agent-guides/components/thinking-steps.md`
- `docs/agent-guides/components/top-nav.md`

**整页与流程指南**

- `docs/agent-guides/blocks/agent-session-detail-01.md`
- `docs/agent-guides/blocks/agent-trace-01.md`
- `docs/agent-guides/blocks/login-01.md`
- `docs/agent-guides/blocks/personal-settings-01.md`
- `docs/agent-guides/blocks/provider-create-form-01.md`
- `docs/agent-guides/blocks/signup-01.md`

本候选共有 128 篇指南，超过单文件 512 KiB 的上下文预算。`public/llms-full.txt` 自动切换为分类索引。已依据 `public/ai/context/manifest.json` 校验各分片哈希、拼接原始字节，并逐篇与 128 个源文件核对。`public/ai/` 和 `docs/generated/agent-runtime/` 由构建或 Release 恢复生成，遵循现有 Git 忽略规则。

## 第二笔 · 文档站发现与 AI 动作

| 范围 | 文件与改动 |
| --- | --- |
| 搜索与导航（2） | `docs/components/shell/site/site-command-palette.tsx`、`docs/components/shell/site/site-shell.tsx`。全局 ⌘K / Ctrl+K、中文检索、键盘选择与图标导航。 |
| 详情与推荐（4） | `docs/lib/ai-prompt-builder.ts`、`docs/lib/ai-design-assets.ts`、`docs/components/content/AiDesignActions.tsx`、`docs/components/content/DocPage.tsx`。按 Registry ID 生成契约地址、保留完整安装参数、按依赖双向推荐。剪贴板权限被拒时显示可手动复制的完整提示词。 |
| 共享文件（3） | `docs/components/blocks/BlockDetailPageView.tsx` 只接入 AI 动作与组件链接。`docs/components/blocks/BlocksGallery.tsx` 只引入 6 组场景筛选及其 URL 和摘要。`docs/pages/introduction.tsx` 只增加 4 个设计语言入口。画廊沿用目标分支的图标类型、英文搜索字段和网格断点。 |
| 图标目录（4） | `app/[locale]/docs/icons/page.tsx`、`docs/pages/icons/catalog/page.tsx`、`docs/content/en/icons/catalog.json`、`docs/content/zh-CN/icons/catalog.json`。语义图标预览、区分免费与授权风格、搜索框可访问名称、本地化计数与复制反馈。 |
| 回归与交接（2） | `tests/docs-ia-design-actions.test.tsx` 和本计划。覆盖 11 个契约入口、剪贴板拒绝与重试、双语图标目录、依赖互链、中文键盘搜索与场景 URL。 |

## 执行顺序

从当前仓库根目录执行。两份本地补丁位于被 Git 忽略的 `output/commit-plans/docs-ia-2026-11-19/`。下列命令在独立工作树创建提交，可保留开发工作区中的并行修改。使用项目固定的 pnpm 10.12.4。

```bash
repo=$(git rev-parse --show-toplevel)
patches="$repo/output/commit-plans/docs-ia-2026-11-19"
target="${repo}-docs-ia-ai-guides"
git worktree add -b feat/docs-ia-ai-guides "$target" 0e7798c1
cd "$target"
pnpm install --frozen-lockfile
```

**第一笔**

```bash
git apply --check --index "$patches/01-agent-guides.patch"
git apply --index "$patches/01-agent-guides.patch"
pnpm skills:build && pnpm agents:guides:build && pnpm agents:build
pnpm agents:guides:check && pnpm agents:check
pnpm agents:guides:examples:check && pnpm agents:evaluate
pnpm exec vitest run --config vitest.config.mts tests/agent-context.test.mjs tests/agent-catalog-generation.test.mjs tests/agent-release-restore.test.mjs
git diff --exit-code
git diff --cached --check && git diff --cached --stat
git commit -m "feat(agents): publish design rules and 20 verified guides"
```

**第二笔**

```bash
git apply --check --index "$patches/02-docs-ia.patch"
git apply --index "$patches/02-docs-ia.patch"
pnpm typecheck && pnpm lint && pnpm lint:design
pnpm docs:routes:check && pnpm docs:loaders:check
pnpm test:i18n:unit && pnpm test:mcp
pnpm exec vitest run --config vitest.config.mts \
  tests/layout-shell-contract.test.ts tests/navigation-loading.test.tsx \
  tests/resource-catalog-preview-contract.test.ts tests/component-covers.test.ts \
  tests/agent-catalog-generation.test.mjs tests/docs-ia-design-actions.test.tsx
git diff --exit-code
git diff --cached --check && git diff --cached --stat
git commit -m "feat(docs): connect search, design actions and gallery filters"
git log --oneline 0e7798c1..HEAD
git diff --stat 0e7798c1..HEAD
```
