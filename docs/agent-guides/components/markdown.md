---
schema_version: 1
name: markdown
kind: component
status: stable
summary: 渲染安全的 GFM 内容与流式状态，表格复用 Table，围栏代码复用 CodeBlock。
package_import: "@zeron/ui/markdown"
registry_import: "@/components/ui/markdown"
source: packages/ui/src/components/markdown.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related:
  - table
  - checkbox
  - code-block
  - chat-message
---

# Markdown

## Installation

```bash
npx zeron-ui add markdown
```

```tsx
import { Markdown } from "@zeron/ui/markdown";

export function Example() {
  return <Markdown text="### 回复\n\n支持 **GFM** 与行内 `code`。" streaming streamingLabel="正在生成回复" />;
}
```

## Core rules

- text 是完整的累积 Markdown；宿主随新内容更新 text 与 streaming。组件不会连接模型或生成文本。
- 根容器默认使用父级 100% 可用宽度，即使处于 items-start 的 flex 布局也不按内容收缩。表格及两种模式的代码包装层统一满宽，标题、段落、列表、引用、脚注及分隔线按父级正文宽度排列；图片保持固有比例且不超出父级。宽表格、长代码在自身区域横向滚动，不撑开页面。宿主使用 min-w-0 配合受限列宽；不要在演示或 Block 中给 Markdown 额外添加固定宽度上限。自定义 components 负责保留上述约定。
- 支持 GFM 表格、任务列表及普通换行。表格复用 Table、TableHeader、TableBody、TableRow、TableHead 和 TableCell，使用 variant=bordered、size=md，通过 text-body / --font-size-body 统一表头与正文为 14px；外框、颜色、字号与分隔线都由 Table 组件层维护。Markdown 只保留外部段落间距，并转交列对齐数据；TableBody 统一去掉最后一行分隔线。静态正文行不传 index，表格横向滚动限定在内容区域。
- codeVariant 默认 block，围栏代码复用现有 CodeBlock；plain 使用轻量 pre 元素，适合执行日志。
- codeMessages 转交 CodeBlock 的工具栏文案；footnoteLabel 与 footnoteBackLabel 分别本地化脚注标题与返回链接。围栏代码的元信息支持 filename="path/to/file.ts" 或 title="path/to/file.ts"，仅用于 CodeBlock 文件名展示。
- 围栏的语言标记透传为 CodeBlock 的 file.lang，不由展示文件名覆盖；完整保留 c++、c# 等别名。没有语言标记时继续由文件名推断，没有展示文件名时使用 snippet.txt。
- 不启用原始 HTML，链接沿用 react-markdown 的默认协议过滤。components 接受公开 MarkdownComponents 类型覆盖指定元素；自定义渲染器负责自己的安全。
- streamingLabel 默认英文，需要根据当前语言覆盖。状态指示遵循减少动态效果偏好。
- className 与原生 div 属性只用于布局和无障碍命名，避免覆盖内部语义颜色。

Chat Thread 的 ChatMarkdown 只适配会话文案；Agent Trace 选择 plain 模式。两者共享此 UI 组件。

Chat Markdown Block 提供可直接嵌入的回复组合与完整排版示例。统一正文使用 text-body / leading-6，段落间距 12px；标题前间距按 H1–H6 为 32/24/20/16/16/16px。代码、表格与引用间距 16px，分隔线使用 hairline 与 24px 间距。列表保留起始编号与嵌套关系，任务列表复用只读 Checkbox，不额外显示圆点，图片限制在正文宽度内。脚注引用、目标与返回链接使用每个实例独立的 ID，避免多条回复互相跳转。完整规范见 chat-markdown-01 指南。
