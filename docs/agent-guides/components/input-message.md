---
schema_version: 1
name: input-message
kind: component
status: stable
typecheck_examples: true
locale: zh-CN
summary: 面向 AI 对话与指令输入的自适应高度消息框，提供附件、模型选择与发送动作槽位。
package_import: "@zeron/ui/input-message"
registry_import: "@/components/ui/input-message"
source: packages/ui/src/components/input-message.tsx
registry: packages/ui/registry.json
related:
  - chat-thread
  - model-selector
  - button
---

# InputMessage

## 视觉角色与空间配比（Design & Spatial Rules）

- **对话界面的视觉锚点**：`InputMessage` 位于会话流底部或初始欢迎页中央，最大宽度应与上方 `ChatThread` 消息流保持一致（单栏对话推荐 `max-w-3xl` 居中，分栏工作区推荐填满左侧会话面板）。
- **工具栏槽位克制原则**：底部辅助工具栏左侧建议只放 `1~3` 个高频触发器（如“上传附件”、“模型切换 `ModelSelector`”、“深度思考开关”），右侧永远固定为唯一的高辨识度“发送 / 停止生成”主按钮。
- **自适应高度与滚动过渡**：随用户输入自然增高至设定阈值后转为内部滚动，避免输入框无限撑高挤压上方历史消息视野。

## Use when

- 构建 AI 聊天室、Copilot 侧边栏、Agent 任务指令台或多模态 Prompt 输入区。

## Do not use when

- 常规表单中的静态多行备注或简介输入：使用 `Textarea` 与 `Field`。
- 单行结构化语法搜索或筛选框：使用 `FilterQueryInput` 或 `InputGroup`。

## 公共契约与安全定制

- 使用组件公开的文本值、提交/中止回调、附件列表与工具栏插槽；生成进行中（streaming）时将主按钮平滑切换为“停止生成”状态，不要在外部再额外放一个停止按钮。

## 工作区集成示例

```tsx
import { useState } from "react";
import { InputMessage } from "@zeron/ui/input-message";

export function Composer({ send }: { send: (text: string) => void }) {
  const [value, setValue] = useState("");
  return <InputMessage value={value} onValueChange={setValue} maxRows={5}
    onSend={text => { send(text); setValue(""); }} placeholder="输入消息" />;
}
```
