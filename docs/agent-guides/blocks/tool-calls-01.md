---
schema_version: 1
name: tool-calls-01
kind: block
status: stable
summary: 组合 Chat Thread 的工具调用、搜索读取汇总、文件变更与命令执行确认。
package_import: "@zeron/blocks/tool-calls-01"
registry_import: "@/components/blocks/tool-calls-01"
source: packages/blocks/src/application/tool-calls-01/index.ts
types: packages/blocks/src/application/tool-calls-01/tool-calls-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [chat-thread-01, chat-message, accordion, badge, button, code-block, empty, inline-notice, input-message]
---

# Tool Calls

安装 `npx zeron-ui add tool-calls-01 input-message`。复用现有 Zeron 源码与语义变量，不依赖 Next.js、AI SDK 或新的会话外壳。

```tsx
"use client";
import { ToolCalls, toolCallsZhLabels, type ToolCall } from "@zeron/blocks/tool-calls-01";

const calls: ToolCall[] = [{ id: "test-1", kind: "command", label: "运行搜索测试",
  command: "pnpm test search", status: "approval-required" }];

export function ToolCallsExample() {
  return <ToolCalls items={calls} labels={toolCallsZhLabels} locale="zh-CN" />;
}
```

Registry 安装后的导入使用 `@/components/blocks/tool-calls-01`。`ToolCalls` 可以直接放入 `ChatAssistantMessage.children`，允许同一会话保留多个独立用户轮次。`ToolCallsThread` 为单轮组合，接收 `prompt` 和有序 `parts`；文本段 `{ id, kind: "text", text, streaming? }` 复用 ChatMarkdown，工具段 `{ id, kind: "tools", items, summary?, defaultOpen?, defaultExpandedIds? }` 复用 ToolCalls。宿主提供受限高度、composer、locale 和 chat-thread 文案。busy 从文本生成及 queued / running / approval-required 工具状态推导。

`ToolCall` 具有稳定 id、label、status 和可选 description、durationMs、output、error。kind 为 search（query、matches）、read / write（file: { name, contents }）、edit（oldFile、newFile）、command（command、cwd?、exitCode?）或 custom（input?）。搜索 matches 使用 `{ id, path, line?, preview }`。相同执行过程保持 id；新执行应使用新 id，避免过期请求覆盖新结果。时间单位为毫秒，无效时间省略，0 与空字符串作为有效结果保留。

状态为 queued、running、approval-required、completed、failed、denied、cancelled，使用 Badge 的语义 status。summary 可折叠整个调查组；每条调用复用 Accordion，Enter / Space 展开，保留键盘焦点与 ARIA 关联。默认展开初始 write / edit / failed / approval-required 项；增量加入的调用需要通过 expandedIds 或工具段的 defaultExpandedIds 规划展开状态，default* 仅在挂载时生效。数据更新不覆盖用户的展开选择。

代码和命令复用 CodeBlock 的复制与换行工具，文件差异复用 CodeDiff 的 unified 模式与变更统计。失败、确认和动作提交失败复用 InlineNotice，空列表复用 Empty。只组合公开 API；不覆盖基础控件的颜色、尺寸或内部选择器。

仅 command 且 approval-required 时显示执行确认；只在提供 onApproval 时显示允许、拒绝按钮。没有回调时保留只读待确认状态。`onApproval(call, "allow" | "deny")` 与 `onRetry(call)` 只请求宿主操作，不修改执行状态、不执行命令。宿主在真实状态提交后 resolve，失败时 reject；同一行提交期间阻止重复提交并显示 loading，失败保留内容与重试入口。同 id/status 的不可变快照更新不会清除提交状态或吞掉错误；id 或执行状态变化后旧请求失效，旧请求结束也不会解除新请求的锁定。服务端仍需负责实际执行、授权和请求去重。工具输出按照文本显示，不执行返回的 HTML 或命令。

`expandedIds / onExpandedChange` 支持受控展开，`defaultExpandedIds` 用于非受控初始值。labels 可部分覆盖，包括嵌套 status；导出 toolCallsEnLabels、toolCallsZhLabels。线程的 labels 单独属于 chat-thread，不会替代工具文案。

`userMessageProps` 透传时间、附件、编辑与版本；`assistantMessageProps` 透传模型、Logo、provider、指标与反馈、重试等。ToolCallsThread 拥有消息 id、text、children、streaming、last；调用输出单独显示，助手复制包含文本段。保持 ChatThread 唯一会话滚动和输入区归属。

演示重播固定的搜索排查流程，在命令处等待确认；允许后生成本地输出，拒绝或停止不生成成功结果。失败示例与工具重试可交互。演示不调用模型、不读写真实文件、不执行命令；自定义问题只替换演示提问，固定数据不回答任意问题。
