---
schema_version: 1
name: chat-message
kind: component
status: stable
summary: 组合消息气泡、附件、复制、编辑和受控版本切换，无需会话 Provider。
package_import: "@zeron/ui/chat-message"
registry_import: "@/components/ui/chat-message"
source: packages/ui/src/components/chat-message.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related:
  - markdown
  - input-message
  - inline-notice
  - chat-thread
---

# ChatMessage

## Agent intent

单条用户或助手消息使用 ChatMessage，无需会话 Provider。完整会话使用 [ChatThread](chat-thread.md) 和 ChatUserMessage / ChatAssistantMessage；后两者注册消息 ID，再复用 ChatMessage。基础 ChatMessage 不注册线程消息，不能直接替代线程消息包装组件。旧 chat-thread-01 继续提供兼容导出与演示数据。

## Installation and imports

```bash
npx zeron-ui add chat-message
```

```tsx
import {
  ChatMessage, ChatMessageCopy, ChatMessageAction,
  ChatMessageAttachments, ChatMessageEditor, ChatMessageBranchSwitch, ChatMessageAuthor,
  type ChatMessageFile, type ChatMessageBranch,
} from "@zeron/ui/chat-message";
```

## Composition

```tsx
import { ChatMessage, ChatMessageCopy, ChatMessageAttachments } from "@zeron/ui/chat-message";

export function Example() {
  const text = "请审阅设计说明。";
  return (
    <ChatMessage from="user" actionsVisibility="always"
      attachments={<ChatMessageAttachments label="附件" files={[{ id: "brief", name: "brief.md", size: 2048 }]} />}
      actions={<ChatMessageCopy text={text} labels={{ copy: "复制", copied: "已复制", copyFailed: "复制失败" }} />}>
      {text}
    </ChatMessage>
  );
}
```

## Core rules

- 所有子组件均可独立使用，不需要 ChatThread Provider。基础样式复用 Button、Tooltip、Textarea 和图标系统。
- `ChatScrollToLatest` 统一会话的“回到最新内容”入口，复用 Button 的 tertiary / sm 与 arrow-down 前置图标，外层为底部居中、16px 间距的定位层。`locale` 默认 en，以 zh 开头时使用中文；`label` 可覆盖文案。`className` 只用于外层定位，例如在线程输入区上方使用 bottom-full pb-4。`onClick` 必填，disabled 可选；按钮固定 type=button，避免提交输入表单。宿主负责显隐、滚动和恢复跟随；使用导出的 `CHAT_SCROLL_FOLLOW_THRESHOLD`（24px）判断是否仍在最新位置。Chat Thread、Chat Workspace、Markdown 回复示例、Agent Trace 与 Agent Session Detail 复用同一入口。
- `files` 保留本地 File[] 的现有能力。历史文件使用 `attachments` 插槽与 ChatMessageAttachments；描述包含 id、name，可选 size（字节）、type 和 url。URL 允许 HTTP(S)、blob 或相对地址。align 默认为 end；label 提供列表无障碍名称。
- ChatMessageAction 的 label 为必填无障碍名称；pressed 控制切换操作状态。
- ChatMessageCopy 复制原始 text，以 live status 播报成功或失败，支持 disabled 与 labels（copy、copied、copyFailed）。
- ChatMessageEditor 接受 text、onSave、onCancel；onSave 成功或未改动时调用 onCancel 关闭，失败保留草稿。disabled 冻结输入与保存，保留现有草稿，仍可取消；用于宿主变更历史期间阻止提交。Enter 保存、Shift+Enter 换行、Escape 取消；输入法组词不会提交。labels 可覆盖 edit、cancel、save、saveFailed。
- ChatMessageBranchSwitch 接受 branch（从零开始的 index、count、onChange）；宿主保存版本内容及其后继。无效范围或少于两个版本时隐藏。disabled 冻结切换；labels 可覆盖 previous、next 与 version（接收从一开始的序号及总数）。
- 富文本使用独立 Markdown；不在 ChatMessage 内隐式解析字符串。actionsVisibility 默认为 auto，触屏始终可见；最新回复可设 always。
- assistant 消息及正文使用父级/article 的 100% 可用宽度，不按内容收缩或复用 user 的 80% 气泡上限。表格、CodeBlock、CodeDiff 等块内容在此宽度内自适应；超长代码和宽表保留内部横向滚动。会话整体阅读宽度由宿主控制，Block 无需另加消息内部宽度覆盖。
- 回复身份通过 `header={<ChatMessageAuthor model="Sonnet 5.5" logo={modelLogo} provider="Anthropic" />}` 插槽组合。模型 Logo 为装饰信息，名称为 medium 字重、provider 为灰色；缺失字段省略，长名称自动换行。header 在生成与悬停之外持续可见，样式统一由 ChatMessageAuthor 管理。
- 回复统计通过 `meta={<ChatMessageMeta metrics={metrics} />}` 插槽组合，ChatMessage 统一维护它与 actions 的间距、换行和显隐。业务或 Block 不另写元信息页脚样式，不在指标前重复模型名称。
- 回复错误、停止提示与编辑保存失败复用 InlineNotice / InlineNoticeContent。错误使用 emphasized + danger，并显式设置 role=alert；静态或停止提示保持静默。请求、重试与状态切换由宿主负责。
- ChatMessageAttachment 渲染单个附件卡片，ChatMessageAttachments 渲染附件列表；两者均接受本地 File 与历史 ChatMessageFile，预览、文件名和大小共用一个边框。InputMessage 同样使用该卡片，保留移除操作。FileThumbnail 的 bordered=false 用于由外层卡片统一承载边框。
- ChatMessageMeta 接受 metrics、locale 与 labels，并保留可选 model 用于自定义页脚信息；普通回复的模型身份使用 ChatMessageAuthor。metrics 包含 ttftMs、inputTokens、outputTokens、durationMs；时间以毫秒传入，token 使用非负整数。token 自动换算为 k、M、B，最多保留一位小数，悬停和辅助技术提供带千分位的完整数值。指标窄屏自动换行；缺失或无效指标省略，保留 0。这些数据与模型身份属于该次回复，不随模型选择器改变。

## 与会话的边界

ChatMessage 管理单条消息布局与局部操作，ChatThread 管理会话滚动、历史阅读位置、导航、检查点请求及持续挂载的 composer。单条消息示例只展示呈现，不代表已接入完整会话。模型请求、消息/版本存储和真实恢复属于宿主。

ChatScrollToLatest 是会话级导航按钮，继续从 chat-message 导出以兼容现有 API；其显隐、滚动与跟随由宿主或 ChatThread 协调，不属于消息数据管理。

ChatAction、ChatCopy、ChatBranchSwitch、ChatAttachments、ChatEditor 是 chat-thread 的兼容名称。新独立组合使用 ChatMessage* 规范名称；替换适配器时显式传入其原先继承的 labels，并保留 disabled。完整映射见 [ChatThread 兼容说明](chat-thread.md#兼容别名)。

## Ownership

组件只负责消息呈现与局部编辑交互。模型请求、反馈写入、版本存储、恢复和历史树属于宿主。
