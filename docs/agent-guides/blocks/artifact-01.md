---
schema_version: 1
name: artifact-01
kind: block
status: stable
locale: zh-CN
summary: 复用对话工作区的内容创作，支持 HTML、Markdown、代码、历史版本和变更对比。
package_import: "@zeron/blocks/artifact-01"
registry_import: "@/components/blocks/artifact-01"
source: packages/blocks/src/application/artifact-01/artifact-workspace.tsx
types: packages/blocks/src/application/artifact-01/artifact-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [chat-workspace-01, chat-thread-01, code-block, markdown, tabs, input-message]
---

# Artifact

安装 `npx zeron-ui add artifact-01 input-message`。React 数据 Block，无 Next.js 或模型 SDK 依赖。

```tsx
"use client";
import { useState } from "react";
import { ArtifactWorkspace, type ArtifactDocument } from "@zeron/blocks/artifact-01";
import { InputMessage } from "@zeron/ui/input-message";

export function ArtifactExample() {
  const [draft, setDraft] = useState("");
  const artifact: ArtifactDocument = { id: "page", title: "Welcome", filename: "welcome.html", kind: "html", revisions: [{ id: "v1", content: "<h1>Hello</h1>" }] };
  return <div className="h-96"><ArtifactWorkspace artifact={artifact} composer={<InputMessage layout="compact" value={draft} onValueChange={setDraft} />} /></div>;
}
```

ArtifactWorkspace 组合 ChatWorkspace 和 ArtifactPreviewPanel，透传会话、尺寸、面板开关与窄屏选择属性。ArtifactPreviewPanel 可独立使用。GeneratedArtifactCard 复用 ArtifactCard，通过 onOpen(document, revisionId) 打开精确版本；窄屏应同时设置 activePane="artifacts"。

宿主传入 ArtifactDocument：id、title、filename、kind（html / markdown / code）与 revisions，修订按时间正序且 ID 唯一。修订含 id、content、label?、status?（ready / streaming / error）、error?。streaming 强制展示代码并禁用复制、下载、预览和变更；error 显示错误与可选 onRetry。code 不显示效果预览。HTML 通过 sandbox="allow-scripts" 的 srcDoc iframe 运行，不授予 allow-same-origin；这不等于网络隔离。代码使用 CodeBlock，Markdown 使用 Markdown，变更使用 CodeDiff，对比前一修订。不编译 JSX/TSX。

revisionId / onRevisionChange 支持受控选择。非受控状态默认跟随最新修订，用户选择后保持历史版本。无效 ID 回退最新版本。onRestore(document, revision) 只在历史版本可用，宿主应在 resolve 前追加新修订而不是改写历史；失败时 reject。成功后非受控面板跟随最新修订；请求期间若用户已切换版本或文档，则保留用户选择。受控模式由宿主同步更新 revisionId。恢复中锁定后续恢复请求，允许浏览其他版本。失败提示绑定原文档与版本，不延续到其他内容。

当前修订内已访问的代码、预览与变更保持挂载，切换视图保留页面输入、滚动位置和展开状态；未访问视图按需加载。新修订释放旧视图，避免历史版本持续占用 iframe；刷新只重建预览，不影响源码和变更视图。生成中不会挂载 HTML 预览。

onClose / onRetry 由宿主处理；关闭面板应同时返回 chat 并恢复输入区焦点。复制和下载使用选择版本，刷新重建 HTML iframe，展开调用浏览器 Fullscreen API。labels 与 locale 提供双语控件文案。

createArtifactDemoDocuments 与 createPricingArtifactHtml 仅提供自包含本地数据。文档演示模拟流式生成、停止、重试、历史恢复，附件与模型不参与真实请求。生产接入需要替换生成、持久化与历史管理。
