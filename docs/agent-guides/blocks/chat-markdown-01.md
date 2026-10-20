---
schema_version: 1
name: chat-markdown-01
kind: block
status: stable
locale: zh-CN
summary: 统一 AI 回复内容排版，复用 Markdown、Table、CodeBlock 与 ChatMessage。
package_import: "@zeron/blocks/chat-markdown-01"
registry_import: "@/components/blocks/chat-markdown-01"
source: packages/blocks/src/application/chat-markdown-01/chat-markdown-response.tsx
types: packages/blocks/src/application/chat-markdown-01/chat-markdown-response.tsx
registry: packages/blocks/registry.json
typecheck_examples: true
related: [markdown, checkbox, table, code-block, chat-message]
---

# Chat Markdown

安装 `npx zeron-ui add chat-markdown-01`。在已有会话或阅读区中使用，不增加应用外壳和滚动区。

```tsx
import { ChatMarkdownResponse, createChatMarkdownDemoText } from "@zeron/blocks/chat-markdown-01";
import { ChatMessageAuthor } from "@zeron/ui/chat-message";

export function ResponsePreview() {
  return <ChatMarkdownResponse
    text={createChatMarkdownDemoText("zh-CN")}
    author={<ChatMessageAuthor model="Zeron AI" provider="示例回复" />}
    streamingLabel="正在生成回复"
    copyLabels={{ copy: "复制回复", copied: "已复制", copyFailed: "复制失败" }}
  />;
}
```

Registry 消费项目改用 `@/components/blocks/chat-markdown-01` 与 `@/components/ui/chat-message`。

`codeMessages` 本地化 CodeBlock 工具栏；`footnoteLabel` 与 `footnoteBackLabel` 本地化脚注标题与返回文案。代码围栏元信息接受 filename="hooks/example.ts" 或 title="hooks/example.ts"，作为现有代码工具栏中的文件名。

`text` 是累积 Markdown；`streaming` 为生成状态，不创建网络流。`author` 接受消息身份节点。省略 `actions` 时显示默认复制操作，`actions={null}` 明确隐藏操作，其他节点替换默认操作；生成期间及空白正文不显示操作。停止后复制已有原文。`copyLabels` 本地化复制反馈，`streamingLabel` 本地化生成状态。`codeVariant` 为 block（默认）或 plain；`components` 透传 Markdown 的公开渲染覆盖，调用方负责其安全。原生 article 属性用于布局与无障碍命名，`className` 只控制外部布局。

## 统一内容样式

| 内容 | 规范 |
| --- | --- |
| 阅读区域 | max-w-3xl，居中，min-w-0；宿主拥有滚动与页面边距 |
| 正文 | text-body 配套字号与行高（14px / 20px）、fg-default；段落间距 12px，首尾无额外段落外边距 |
| 标题 | H1 heading / semibold；H2 title / semibold；H3 body / semibold；H4 body / medium；H5 label / semibold；H6 label / medium / muted |
| 标题间距 | H1 顶部 32px；H2 24px；H3 20px；H4–H6 16px；首标题无顶部间距 |
| 强调 | strong semibold；em italic；删除线保留语义 |
| 行内代码 | label 等宽字体、raised 背景、小圆角；允许在长行中换行 |
| 围栏代码 | CodeBlock 自带工具栏、语法高亮、复制与换行；外部间距 16px |
| 表格 | Table bordered / md，表头与正文使用 text-body / --font-size-body（14px）；外部间距 16px；列对齐透传，横向滚动留在表格内 |
| 列表 | 保留起始编号、嵌套结构；条目间距 4px；嵌套列表间距 4px |
| 任务列表 | 复用 Checkbox 的只读状态，以任务正文提供无障碍名称，不显示额外圆点 |
| 引用 | 左侧 border、正文 muted、内缩 16px，外部间距 16px |
| 分隔线 | hairline / border，上下间距 24px |
| 图片 | 原生内容图片保持宽高比、最大正文宽度、延迟加载；不是框架静态资源 |
| 脚注 | 每个 Markdown 实例拥有独立 ID，引用与返回链接留在同一条回复 |
| 链接 | 默认文字色、下划线；悬停与键盘聚焦提供反馈 |

以上样式在共享 UI Markdown 层维护；本 Block 复用此组件，其他会话可通过公开入口接入。不要在会话容器增加全局 prose 样式或覆盖 Table / CodeBlock 内部几何、颜色、分隔线和工具栏。

## 行为与验证边界

不启用原始 HTML，沿用 react-markdown 默认 URL 协议过滤。自定义 components 需自行保证安全。演示初始为完整回复，重播逐步追加本地文本，停止保留内容，显示全文恢复完整内容。用户上滚后暂停跟随，点击回到最新内容恢复。该入口复用 ChatScrollToLatest：tertiary / sm 描边按钮、向下箭头，底部居中、间距 16px，使用共享的 24px 最新位置阈值。演示不调用模型、请求搜索或保存会话；真实请求与取消由宿主接入。

演示使用 ResizeObserver 观测正文与阅读区；代码高亮、内容加载或窗口变化后，保持跟随时继续停留在底部，暂停时不主动滚动。已完成内容同样保持该规则，不依赖模拟计时器是否运行。点击回到最新内容后将焦点交还阅读区。模拟播放是否完成由播放状态和当前文本长度直接计算，卸载时清理计时器与布局观测。代码高亮语言来自围栏标记，并优先于展示文件名的扩展名，保留 python、c++、c# 等语言标记。
