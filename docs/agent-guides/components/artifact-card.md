---
schema_version: 1
name: artifact-card
kind: component
status: stable
summary: 生成内容卡片，展示文件类型、说明与审阅状态，保留宿主记录的打开回调。
package_import: "@zeron/ui/artifact-card"
registry_import: "@/components/ui/artifact-card"
source: packages/ui/src/components/artifact-card.tsx
types: packages/ui/src/components/artifact-card/types.ts
registry: packages/ui/registry.json
typecheck_examples: true
related: [file-type, info-item, chat-workspace-01, artifact-01, chat-message]
---

# ArtifactCard

安装 `npx zeron-ui add artifact-card`。无需 Chat Thread、生成正文、版本或预览运行时。

```tsx
"use client";
import { ArtifactCard, type ArtifactCardItem } from "@zeron/ui/artifact-card";

type GeneratedFile = ArtifactCardItem & { documentId: string };

export function GeneratedFiles({ files, onOpen }: { files: readonly GeneratedFile[]; onOpen: (id: string) => void }) {
  return <ArtifactCard resources={files} locale="zh-CN" title="本次生成" onOpen={(file) => onOpen(file.documentId)} />;
}
```

Registry 消费项目改用 `@/components/ui/artifact-card`。resources 中每项仅要求唯一稳定 id、name、kind；kind 为 code/markdown/text/image/url/file，可选 description（非交互说明）与 review（pending/accepted/rejected）。URL 项使用网页图标，其余复用 FileType。

onOpen 返回完整原始对象，泛型保留宿主附加字段。组件不复制资源，不获取文件，不自行打开链接、创建 iframe 或管理版本。getDescription(resource) 和 getReviewStatus(resource) 提供显示投影，适配现有业务模型；审阅投影存在时，其 undefined 结果明确隐藏状态。ReactNode 说明不得包含嵌套交互控件，因为 InfoItem 使用原生 button 作为整行根元素。

title、locale、labels 提供标题与本地化，导出 artifactCardEnLabels/artifactCardZhLabels。className、style 与 HTML 属性用于外部布局。内部的文件图标、信息层级、焦点与边框遵循共享组件契约。

chat-workspace-01 的旧 ArtifactCard 仍接受原有 ArtifactCardProps、ArtifactResource 和完整 ArtifactLabels。它作为适配层复用本组件，保留 UTF-8 文件大小、显式 size 优先、网页地址过滤及显示，以及有 previousContent 的版本审阅规则。onOpen 继续返回原始版本资源。artifact-01 的 GeneratedArtifactCard 与 ArtifactWorkspace 导出不变。面板预览和版本操作继续由这些 block 提供。
