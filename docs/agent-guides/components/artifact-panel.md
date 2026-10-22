---
schema_version: 1
name: artifact-panel
kind: component
status: stable
locale: zh-CN
summary: 多资源预览、标签关闭、图片缩放与准确版本的审阅面板。
package_import: "@zeron/ui/artifact-panel"
registry_import: "@/components/ui/artifact-panel"
source: packages/ui/src/components/artifact-panel.tsx
types: packages/ui/src/components/artifact-panel/types.ts
registry: packages/ui/registry.json
typecheck_examples: true
related: [artifact-preview-panel, artifact-card, chat-workspace-01, tabs, code-block, markdown, file-type]
---

# ArtifactPanel

安装 `npx zeron-ui add artifact-panel`。独立 AI component，无需聊天 Provider、ChatThread、Resizable、ArtifactCard 或示例数据。Registry 导入为 `@/components/ui/artifact-panel`。

```tsx
"use client";
import { ArtifactPanel, type ArtifactPanelProps } from "@zeron/ui/artifact-panel";

export function Preview(props: ArtifactPanelProps) {
  return <div className="h-96 min-h-0"><ArtifactPanel {...props} locale="zh-CN" /></div>;
}
```

resources 是已打开资源的只读有序快照。每项 id 唯一且稳定，version 随内容变化，包含 name、kind，以及可选 path、messageId、status、error、downloadUrl、size。kind 为 code、markdown、text、image、url、file；code/markdown 有 content、可选 previousContent，code 还可传 previousPath，显式 review 为 pending/accepted/rejected。图片有 url/alt，网页有 url，普通文件可传 url/mimeType。普通文件只展示元信息和下载入口，不内置 Office/PDF 全文预览。

activeId/onActiveIdChange 可选受控；省略 activeId 时使用本地选择，defaultActiveId 只作初始值。移除活动资源后回退到剩余项。onCloseMany 存在时统一接收关闭集合，否则逐项调用 onClose；宿主移除打开项，不等于删除资源或完成审阅。关闭当前项优先选择右侧邻项，再回退左侧。更多菜单支持关闭其他与全部，Delete 关闭聚焦标签；溢出时保留当前项，菜单列出所有资源。addAction 在空面板仍显示，重复打开由宿主按 id 去重。

宿主通过 onReview(resource, decision) 提交具体 id/version，decision 为 accept/reject；成功后更新该版本的 review，再 resolve；失败 reject。面板不虚构成功。保存期间锁定重复审阅，仍可浏览其他资源。批量逐项保留部分失败，失败提示绑定版本，不转移到新内容。getPendingReviewResources(resources) 与面板共享就绪、可审阅、pending 的规则，保持宿主顺序；也可从 `@zeron/ui/artifact-panel/utils` 导入。

onReference(resource) 将结构化引用加入宿主草稿，不自动发送；onRetry(resource) 请求宿主重试。renderPreview(resource) 返回 undefined 才回退内置预览，可接入 PDF、浏览器或业务查看器。status=loading/error 显示反馈。已访问的资源保持挂载与局部状态；关闭或更新 version 释放旧预览。

代码/Markdown 差异复用 CodeDiff，文本复用 CodeBlock，Markdown 复用 Markdown。图片支持适应窗口、原始尺寸、绝对比例缩放、鼠标平移与原生触屏/键盘滚动。失败禁用图片控制，重试后恢复。网页使用过滤后的 HTTP(S) 或相对地址及沙箱 iframe，不授予 same-origin；图片/下载额外允许 blob。网站可能禁止内嵌，保留外部打开；刷新只重载对应网页，不实现跨域读取或导航历史。

labels 支持 Partial<ArtifactLabels>，导出 artifactEnLabels、artifactZhLabels，也可从 `/labels` 导入。保留原文案字段以兼容旧工作区。locale 控制语言，className 只管理外部布局；宿主提供受限高度。底部单一审阅区复用 Alert，标签、操作、错误与图标分别复用 Tabs、Button、InlineNotice、FileType 等公共能力。

两种面板仅共用内部 artifact-content-renderer 的 Markdown、CodeBlock、CodeDiff 渲染与内容间距，Registry 自动安装此共享依赖，不需要宿主直接调用。ArtifactPanel 的 ArtifactCodePreview 适配资源的 path/previousPath/previousContent，保留代码内工具栏与统一/分栏差异，空 previousContent 仍可对比。ArtifactPreviewPanel 的 ArtifactContent 适配选中与上一修订，隐藏代码内工具栏，固定统一差异；HTML 沙箱不经过共享渲染器。两种数据模型、状态、延迟加载与宿主操作继续独立。原 `/artifact-panel/code-preview`、`/artifact-preview-panel/content` 和 block 转发模块保留原名称及参数。

旧 `@zeron/blocks/chat-workspace-01` 保留全部面板、资源类型、labels、getPendingReviewResources、卡片适配、ChatWorkspace 与演示数据。原面板、标签、预览、代码、文案和工具模块均转发到此共享实现。ChatWorkspace 继续负责会话分栏。单文档修订历史使用 ArtifactPreviewPanel，两个组件不混用资源状态模型。
