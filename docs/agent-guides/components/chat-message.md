---
schema_version: 1
name: chat-message
kind: component
status: stable
summary: 聊天消息布局与由宿主管理的最新内容导航。
package_import: "@zeron/ui/chat-message"
registry_import: "@/components/ui/chat-message"
source: packages/ui/src/components/chat-message.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [button, input-message]
---

# ChatMessage

安装 `npx zeron-ui add chat-message`，消费项目使用 `@/components/ui/chat-message`。

```tsx
import { ChatMessage, ChatScrollToLatest } from "@zeron/ui/chat-message";

export function Conversation({ away, onLatest }: { away: boolean; onLatest: () => void }) {
  return <div className="relative min-h-40">
    <ChatMessage from="assistant">回复内容</ChatMessage>
    {away && <ChatScrollToLatest locale="zh-CN" onClick={onLatest} />}
  </div>;
}
```

ChatMessage 保留用户消息右对齐、助手正文左对齐与原生 File 附件；time 仅用于用户消息。宿主拥有内容与消息操作。

ChatScrollToLatest 复用 Button tertiary / sm，向下箭头与文案同排，绝对定位于宿主底部居中、间距 16px。宿主提供 relative 定位区域，并负责显示条件、滚动、焦点和恢复跟随。组件明确 type=button，不提交外层表单；disabled 禁止点击。locale 默认 en，zh 使用“回到最新内容”，其他语言使用“Scroll to latest”；label 可覆盖，className 仅用于浮层定位。CHAT_SCROLL_FOLLOW_THRESHOLD 为共享的 24px 最新位置阈值。
