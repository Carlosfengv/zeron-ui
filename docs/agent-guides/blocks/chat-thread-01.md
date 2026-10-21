---
schema_version: 1
name: chat-thread-01
kind: block
status: stable
locale: zh-CN
summary: 可组合的流式会话、消息版本、历史阅读锚点与检查点恢复。
package_import: "@zeron/blocks/chat-thread-01"
registry_import: "@/components/blocks/chat-thread-01"
source: packages/blocks/src/application/chat-thread-01/chat-thread.tsx
types: packages/blocks/src/application/chat-thread-01/chat-thread-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [chat-message, message-navigation, input-message, scroll-area, code-block, thinking-steps, model-selector, context-window-02, toast, separator, inline-notice, empty, button]
---

# Chat Thread

`ChatThread`、全部消息组合、文案与历史辅助函数已下沉为 [AI component](../components/chat-thread.md)。原 `@zeron/blocks/chat-thread-01` 与所有模块路径保持兼容，演示数据和示例生成器继续由 block 提供。仅安装共享组件时使用 `npx zeron-ui add chat-thread input-message`。

安装 `npx zeron-ui add chat-thread-01 input-message`。这是 React 数据 Block，不依赖 Next.js 或 AI SDK。消息、请求、版本、检查点和持久化由宿主持有。

```tsx
"use client";
import { useRef, useState } from "react";
import { ChatThread, ChatUserMessage, ChatAssistantMessage, ChatMarkdown, chatThreadZhLabels } from "@zeron/ui/chat-thread";
import { InputMessage } from "@zeron/ui/input-message";

export function ThreadExample() {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const editor = useRef<HTMLTextAreaElement>(null);
  return <div className="h-96 min-h-0">
    <ChatThread labels={chatThreadZhLabels} locale="zh-CN" composerRef={editor}
      composer={<InputMessage textareaRef={editor} layout="compact" value={draft} onValueChange={setDraft}
        onSend={(text) => { setMessages((items) => [...items, { id: crypto.randomUUID(), text }]); setDraft(""); }} />}>
      <ChatAssistantMessage id="welcome" text="可以开始提问。"><ChatMarkdown text="可以开始提问。" /></ChatAssistantMessage>
      {messages.map((message, index) => <ChatUserMessage key={message.id} id={message.id} text={message.text} pin={index === messages.length - 1} />)}
    </ChatThread>
  </div>;
}
```

Registry 消费项目将共享组件导入替换为 `@/components/ui/chat-thread` 和 `@/components/ui/input-message`。应用层只挂载一个 `Toaster`。模型选择与上下文控件是独立可选 AI components，通过 InputMessage 的公开插槽接入，需要时单独安装。

上下文触发器组合 @zeron/ui/context-window 的 ContextWindowUsage 与标准 Button / Popover，和弹层的 ContextWindowCompact 传入同一 data 快照。圆环复用 PieChart，百分比从实际用量计算，不能使用普通圆形图标或写死数值。

## 职责边界

ChatMessage 是无需 Provider 的单条消息呈现；ChatThread 协调会话滚动、历史阅读位置、导航、检查点请求与 composer。ChatUserMessage / ChatAssistantMessage 注册稳定唯一 ID，并复用 ChatMessage 及其公开原语。基础 ChatMessage 不注册消息，直接替代线程消息会使空态判断、导航和锚点缺少条目信息。输入框通过 composer 插槽组合；消息、版本、模型请求与持久化仍属于宿主。

## 兼容别名

以下导出及类型继续保留；源码 @deprecated 只提供推荐入口提示。新组合从 `@zeron/ui/chat-message` 导入规范名称，普通线程消息使用 ChatUserMessage / ChatAssistantMessage 自动协调文案与状态。

| 兼容名称 | 推荐名称 | 替换时保留 |
| --- | --- | --- |
| ChatAction | ChatMessageAction | 直接别名，函数身份相同，无需上下文 |
| ChatCopy | ChatMessageCopy | 线程 copy / copied / copyFailed 文案 |
| ChatBranchSwitch | ChatMessageBranchSwitch | 线程 previous / next / version 文案及 disabled |
| ChatAttachments | ChatMessageAttachments | 线程 conversation 文案作为 label |
| ChatEditor | ChatMessageEditor | 线程编辑文案与 busy 或 pending 对应的 disabled；仍可取消 |
| ChatFile | ChatMessageFile | 同一附件结构 |
| ChatBranch | ChatMessageBranch | 同一受控版本结构 |
| ChatResponseMetrics | ChatMessageMetrics | 同一回复统计结构 |

除 ChatAction 外，上述组件适配器需要 ChatThread 上下文。不能直接改名后丢失继承状态。ChatMarkdown、ChatCheckpoint、ChatDivider 与消息包装组件仍为会话 API，不属于这些兼容别名。

## 布局与滚动

宿主提供受限高度，Block 使用一个会话滚动视口。空状态与消息状态保持 composer 的 DOM 身份，保留焦点、附件和草稿。`empty` 替换默认空状态标题。

助手消息及正文复用 ChatMessage 的满宽布局，按 article 的 100% 可用宽度显示表格、CodeBlock、CodeDiff 等块内容，不按内容收缩；用户气泡维持 80% 上限。会话整体阅读宽度仍由宿主布局管理，宽表与超长代码在自身区域横向滚动。

Block 整体使用 Floating 表面。默认空状态复用 Empty；历史失败、回复错误和停止提示复用 InlineNotice；检查点与时间分隔线复用 Separator 的 subtle 色调；右侧消息导航复用 MessageNavigation 的紧凑短线、当前位置、键盘与 Popover 预览。恢复弹层使用 PopoverHeader、PopoverTitle、PopoverDescription、PopoverFooter 和默认内边距。元信息经 ChatMessage.meta 插槽排版，Block 仅管理外部布局、会话状态、历史树和滚动锚点，不复制基础组件样式。

消息 `id` 在线程内必须唯一，同一逻辑消息跨版本保持稳定；切换逻辑消息使用新的 ID。`pin` 只标记刚发送的用户轮次。短回复下方保留阅读空间，使该轮次可以位于顶部；回复增长超出视口后继续跟随。用户主动向上阅读后暂停跟随，点击回到最新内容恢复。入口复用 ChatScrollToLatest 的 tertiary / sm 描边按钮、向下箭头和中英文文案，位于输入区上方居中，间距 16px；与其他会话共用 24px 最新位置阈值。代码高亮、图片加载和输入区增高通过布局观测处理。桌面消息导航中每条短线对应一个用户轮次，预览问题和紧随其后的助手回复首段；点击跳转并聚焦用户消息。Tab 只进入侧轨一次，上下方向键与 Home / End 移动焦点，Enter / Space 选择，Escape 关闭预览。导航在消息过多时仅滚动自身；窄屏省略侧轨，保留原生会话滚动与键盘。

`hasOlder`、`loadingOlder` 和 `onLoadOlder` 控制前插历史。回调返回 Promise，或在历史提交前保持 `loadingOlder=true`。加载期间记录可见消息及偏移，完成后恢复；失败时保留消息并显示可重试错误。历史加载期间禁用编辑、重试、版本和检查点恢复，并暂缓已有的撤销操作；恢复或撤销进行中禁用历史加载入口，避免异步变更交错。不要在完成加载后再异步追加消息而提前撤掉 loadingOlder。

`bookmarkedIds` 保存受控的逻辑用户消息 ID，`onBookmarkChange(messageId, bookmarked)` 透传导航预览的收藏请求。提供回调才显示右上角按钮；外部更新 bookmarkedIds 后才改变收藏显示。`bookmarkLabels` 本地化收藏及取消收藏文案。宿主负责持久化、失败处理和版本间的状态策略，组件不自行更改收藏状态。演示使用页面状态模拟收藏。

## 消息组合

`ChatUserMessage` 接收 `text`、`time: Date`、`files: readonly ChatMessageFile[]`（旧 ChatFile 类型别名保持兼容）、`attachments`、`onEdit`、`branch`、`checkpoint`。远程文件使用 `{ id, name, type?, size?, url? }`；无 URL 的文件显示文件信息。附件只展示，不上传。自定义附件可以复用 `FileThumbnail`；旧 ChatMessage 的 `files: File[]` 保持兼容。

`ChatAssistantMessage` 的 `children` 可放入 ThinkingSteps、工具结果、ChatMarkdown、CodeBlock、CodeDiff 等。`text` 是复制用的纯文本；不提供时不显示复制按钮。`streaming` 隐藏操作，`last` 常显操作。支持 `meta`、`onRetry`、`error`、`stopped`，以及受控 `feedback: "up" | "down" | null` / `onFeedback`。

传 `model`、`modelLogo: ReactNode` 与 `provider`，由 ChatMessageAuthor 在回复正文上方显示模型 Logo、medium 字重的名称和灰色 provider，生成期间保持可见；未知字段可省略。传 `metrics: { ttftMs?, inputTokens?, outputTokens?, durationMs? }`，由底部 ChatMessageMeta 显示本次回复的首 token 延迟、输入/输出 token 与总耗时，TTFT 前不重复模型名称，窄屏自动换行。时间统一使用毫秒，token 为非负整数，自动换算为 k、M、B（最多一位小数），悬停和辅助技术提供带千分位的完整数值；缺失或无效指标省略。`meta` 用于额外的页脚信息。宿主应保存每次回复实际使用的模型、provider 与 Logo 对应关系；演示中的 token 是模拟数据，新生成回复的耗时来自本地计时。

`ChatMarkdown` 适配独立的 `@zeron/ui/markdown`，与 Agent Trace 共享安全 GFM 渲染，代码复用 Zeron CodeBlock；不启用原始 HTML。Registry 通过 markdown 依赖自动安装 UI 组件。工具结果使用应用实际数据通过 children 组合，不要求特定工具协议。

`ChatCopy`、`ChatBranchSwitch`、`ChatAttachments`、`ChatEditor` 为兼容适配器，在 ChatThread 内获取文案。独立使用时从 `@zeron/ui/chat-message` 导入对应的 ChatMessageCopy、ChatMessageBranchSwitch、ChatMessageAttachments 和 ChatMessageEditor，并按需传 labels；ChatAction 是 ChatMessageAction 的兼容导出。ChatCheckpoint 和 ChatDivider 保留为会话组合。

## 版本与业务状态

`branch` 是 `{ index, count, onChange }`，索引从零开始。组件只发出版本选择；宿主保留历史版本及对应后续对话，避免切换文字后保留不属于该版本的答案。编辑回调支持 Promise；失败后保留编辑草稿并显示错误。`busy` 禁用编辑、重试、版本和恢复操作。

InputMessage 的生成状态仍为 `idle | streaming`。生成期间发送可进入受控 `queue`；停止后默认继续释放下一条，与旧组件一致。恢复、编辑、版本切换时设置 `autoDispatchQueue=false`，避免状态切换触发意外发送；需要再次自动派发时由宿主显式恢复。`textareaRef` 提供公开编辑器引用，原根节点 ref 保持兼容。ScrollArea 新增 `viewportRef` / `viewportProps`，桌面与触屏都指向真实视口。

## 检查点与撤销

用户消息传 `checkpoint: { id, label?, files? }` 后显示恢复分隔线。`files` 是各轮次变更的文件路径，由宿主提供；确认时合并选中轮次与后续轮次的路径并去重。确认前显示将移除的消息数、文件数与路径，并淡化对应消息；没有文件时只提供恢复对话选项。

`onRestore(checkpointId, { code })` 负责真实变更。宿主应在成功后移除选中的用户消息及之后的消息，将原文和附件回填输入区，提交后再 resolve；失败时 reject，确认保持打开。`splitThreadHistory(messages, messageId)` 提供不修改原数组的拆分，返回 `{ kept, removed }`，`removed[0]` 是待回填的消息；未知 ID 返回完整 kept 与空 removed。

返回 `{ undo: () => void | Promise<void> }` 可提供撤销。快照应覆盖消息/版本选择、草稿、附件和队列。宿主后续产生新变更时，需使旧撤销失效或提供冲突处理；失败时保留 Undo 操作以便重试。真实文件恢复必须由宿主实现，不可把前端消息截断视为代码恢复完成。

`composerRef` 与 InputMessage 的 `textareaRef` 使用同一引用，恢复成功后聚焦编辑器并置光标到末尾。文案用 `labels` 覆盖，导出 `chatThreadEnLabels` 和 `chatThreadZhLabels`，时间通过 `locale` 格式化。

## 验证与演示

检查新会话节点身份、流式中止、队列冻结、历史锚点、编辑输入法、分支后续对话、异步恢复失败与撤销冲突。触屏操作持续可见；键盘焦点揭示操作；回复使用 log、aria-busy、评价按下状态和实时播报。

演示中的请求、模型、上下文和代码恢复为本地模拟，不请求模型、不上传附件、不修改磁盘。重播、新对话、错误重试、队列、分支、历史加载、恢复和撤销均可交互。接入生产时替换宿主模拟操作，而不是修改基础 UI 控件。
