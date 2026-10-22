# AI components 提交执行记录

日期：2026-10-21。执行依据：[review / commit 计划](2026-10-21-artifact-panels-local-models-review-commit-plan.md)。

分支：`codex/ai-component-extractions`，基于 `origin/main` 的 `b888249d2ac12524c6b2ba320f96916404a7aef9`。所有源码迁移、生成、验证和提交在独立 managed worktree 中完成，没有切换、重置或回写原工作区，没有 push。

## 提交顺序

| 顺序 | Commit | 内容 |
| --- | --- | --- |
| 1 | `586c777b fix(blocks): improve local model context selection` | 多行上下文选项、Field 标签关联、合法非预设值、双语说明、依赖元数据与回归。 |
| 2 | `6fcb96d6 refactor(ai): promote model selector component` | ModelSelector UI、旧 block 转发、独立文档、安装与兼容测试。 |
| 3 | `e5219c3f refactor(ai): share context window components` | 共用完整 / 精简 / 用量视图，保留旧入口；补齐尚未落地、且会话演示需要的 context-window-02 及分发闭环。 |
| 4 | `0d53c59c refactor(ai): promote artifact card component` | 展示型 ArtifactCard 与完整资源的 block 适配；保留 URL、字节大小和审阅规则。此笔仍使用原 block 的面板辅助函数，可独立安装。 |
| 5 | `2e8cf063 refactor(ai): promote chat thread component` | 会话职责、消息职责与兼容别名说明、旧模块和数据导出、独立文档与演示。图标依赖由 UI 持有，旧 block 不重复声明。 |
| 6 | `refactor(ai): extract shared artifact panels and rendering`（本文件所在提交） | 两个面板、内部 renderer、旧 block 与 helper 路径适配、真实 Input 的静态 HTML 示例、文档、元数据和回归。 |

远端已有的 ChatWorkspace、Artifact、会话菜单和基础控件没有重新作为新功能引入。未收录其他 AI components 下沉、AI Chat 产品过滤、表格、图表、Agent Message Trace 或共享控件的独立修改。

ContextWindow 的精简 block 在基线中尚不存在，因此前置提交同时补齐它的公开导出、能力声明、目录、路由、预览、Agent 身份与指南。它沿用基线的 shared 产品分类，未夹带尚未提交的 AI Chat 分类功能。

ArtifactCard 的中间适配先依赖原 block 的 labels / utils，最后一笔才转向共享 ArtifactPanel helper。ChatThread 兼容测试仅约束本次拥有的组件和旧入口；Tool Calls / Subagents 消费者维持原实现，其旧会话依赖继续通过兼容层工作。

## 验证

| 候选 | 结果 |
| --- | --- |
| Local Models | 5 文件、53 项测试；Next / pnpm、Vite / pnpm 两个干净消费者及 Vite 的 Next 专属 block 拒绝检查通过。 |
| ModelSelector | 6 文件、45 项测试通过。 |
| ContextWindow | 9 文件、71 项测试通过，包括两个 block 与一个 UI family 的安装闭包。 |
| ArtifactCard | 7 文件、85 项测试通过，包括旧工作区和 Artifact 回归。 |
| ChatThread | 9 文件、115 项测试通过；清理 block 的冗余图标依赖后，两个组件 / 分发文件的 5 项测试再次通过。 |
| Artifact 最终候选 | 16 文件、156 项测试通过，包括内容渲染、两个组件、两个旧 block、prompt、演示、安装与 Local Models。 |
| 类型、样式和生成 | 每笔 typecheck、完整 design lint、相关源码检查、Registry 和文档生成一致性通过；指南示例检查通过。最后一笔仅新增 docs:sources 的两条生成 / 检查脚本，没有增加 npm 依赖或修改 lockfile。 |
| 最终干净消费者 | 四个前置 UI、两个面板 UI、两个旧 block 各自通过 Next / pnpm 和 Vite / pnpm，共 16 项；加上首笔 Local Models 的 2 项，共 18 项。每项独立安装，使用打包 CLI 和 HTTP Registry，验证类型与生产构建。 |
| 完整文档站 | 生产构建退出成功，完成 503 个静态页面生成。 |

消费者运行前保存了递归 Registry 字节指纹；后续源码整理未改变四个前置 UI 的安装闭包。两个面板的类型文件清理了末尾多余空行，Registry 生成器已经规范化这类空白，因此所有 Registry 文件字节及四个 Artifact 安装闭包均保持不变，没有把旧快照当作变更后的另一份安装结果。

生产浏览器验证覆盖：

- Input 的真实组件标记、32px 高度、6px Field 间距、原生标签关联与聚焦、跨视图草稿保留、刷新重置、原 sandbox 和 390px 内部无溢出。
- Local Models 的标签激活、Esc 返回焦点、键盘选择 8K 后缓存变为 3.1 GB、卸载禁用、390px 多行选项与深浅主题。
- 资源面板的 Markdown、src/config.ts → src/settings.ts、并排 diff、审阅后待办数更新。
- 修订面板恢复历史 HTML 后追加第 3 版、显示恢复后的内容，以及 Markdown 变更视图。
- chat-workspace-01 与 artifact-01 的原文档页面返回 200，并呈现工作区与内容面板。

以上最终交互检查没有 pageerror。首次自动化脚本的等待条件与实际面板 / 菜单角色不符，已按页面快照改正；最终验证没有为此修改产品组件。

## 日志范围与保留边界

完整构建成功，但日志包含文档首页的 `MISSING_MESSAGE: introduction` 诊断；相关首页和原有文案加载逻辑未修改。本地生产预览的 Vercel 统计脚本返回 404，消费者保留第三方 use-client、chunk 和既有临时 npm fixture 的 audit 提示，不声称日志无警告，也未自动升级依赖。

原工作区保持在 main / `38e30d38`，其 Git index 与执行前相同。期间检测到额外的 Agent Message Trace 和关联生成产物变化；本次没有覆盖这些并行修改，也没有将它们加入本分支。全程未在原工作区暂存或提交，没有 reset、stash 或清理用户文件。

本地完整证据、消费者日志、闭包指纹、所有权审计和浏览器截图保存在原工作区忽略的 `output/ai-component-commits/`，不提交。GPU、模型、持久化、文件保存与分享仍由宿主接入，本次验证的是本地 UI、演示和安装分发契约。
