---
schema_version: 1
name: artifact-preview-panel
kind: component
status: stable
locale: zh-CN
summary: HTML、Markdown 与代码的修订预览、变更对比和宿主恢复操作。
package_import: "@zeron/ui/artifact-preview-panel"
registry_import: "@/components/ui/artifact-preview-panel"
source: packages/ui/src/components/artifact-preview-panel.tsx
types: packages/ui/src/components/artifact-preview-panel/types.ts
registry: packages/ui/registry.json
typecheck_examples: true
related: [artifact-panel, artifact-card, artifact-01, code-block, markdown, tabs]
---

# ArtifactPreviewPanel

安装 `npx zeron-ui add artifact-preview-panel`。独立 AI component，无需 ChatWorkspace、ChatThread 或聊天 block。Registry 导入为 `@/components/ui/artifact-preview-panel`。

```tsx
"use client";
import { ArtifactPreviewPanel, type ArtifactPreviewPanelProps } from "@zeron/ui/artifact-preview-panel";

export function RevisionPreview(props: ArtifactPreviewPanelProps) {
  return <div className="h-96 min-h-0"><ArtifactPreviewPanel {...props} locale="zh-CN" /></div>;
}
```

artifact 是宿主持有的 ArtifactDocument 或 null。文档包含 id、title、filename、kind（html/markdown/code）与按时间正序的只读 revisions；修订 id 唯一，包含 content、可选 label、status（ready/streaming/error）与 error。null 或空修订显示空状态。组件不获取模型结果、不编译 JSX/TSX、不保存文档。

revisionId/onRevisionChange 支持可选受控选择。非受控默认跟随最新修订，用户选择后保持历史版本。无效 ID 回退最新。onRestore(document, revision) 只为历史版本提供入口，宿主应追加新修订后再 resolve，不改写原历史；失败 reject。恢复中锁定重复请求，允许浏览其他版本。完成时若用户已切换文档或修订，保留其选择；失败提示绑定原文档与修订。受控模式由宿主同步 revisionId。

streaming 强制显示代码并禁用复制、下载、预览与变更。error 显示宿主错误与可选 onRetry(document, revision)。onClose 请求关闭；处于全屏时先退出全屏。复制/下载使用当前选中修订。刷新只重建当前预览，不影响源码和差异视图。展开调用 Fullscreen API，失败显示反馈。

当前修订内访问过的 Code、Preview、Changes 保持挂载，保留输入、滚动与展开；未访问视图延迟加载。新修订释放旧视图，避免保留无限 iframe。代码复用 CodeBlock，Markdown 复用 Markdown，差异复用 CodeDiff 对比上一修订。HTML 使用 sandbox="allow-scripts" 的 srcDoc iframe，不授予 same-origin；沙箱不代表网络隔离。

labels 支持 Partial<ArtifactPreviewLabels>，导出 artifactPreviewEnLabels 与 artifactPreviewZhLabels，也可从 `/labels` 导入。locale 控制双语文案，className 管理外部布局，宿主提供受限高度。恢复和持久化属于宿主，组件只协调选择、视图与操作意图。

两种面板仅共用内部 artifact-content-renderer 的 Markdown、CodeBlock、CodeDiff 渲染与内容间距，Registry 自动安装此共享依赖，不需要宿主直接调用。ArtifactPanel 的 ArtifactCodePreview 适配资源的 path/previousPath/previousContent，保留代码内工具栏与统一/分栏差异，空 previousContent 仍可对比。ArtifactPreviewPanel 的 ArtifactContent 适配选中与上一修订，隐藏代码内工具栏，固定统一差异；HTML 沙箱不经过共享渲染器。两种数据模型、状态、延迟加载与宿主操作继续独立。原 `/artifact-panel/code-preview`、`/artifact-preview-panel/content` 和 block 转发模块保留原名称及参数。

旧 `@zeron/blocks/artifact-01` 保留 ArtifactPreviewPanel、ArtifactDocument、ArtifactRevision、全部原类型、labels、ArtifactWorkspace、GeneratedArtifactCard 和演示生成器。原预览、内容与文案模块转发到共享实现；ArtifactWorkspace 继续组合 ChatWorkspace 与此组件。多资源审阅使用 ArtifactPanel，不与单文档历史合并成同一个状态模型。
