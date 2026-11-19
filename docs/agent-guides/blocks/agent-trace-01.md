---
schema_version: 1
name: agent-trace-01
kind: block
status: stable
typecheck_examples: true
locale: zh-CN
summary: 支持轮次感知（Turn-aware）、本地轨迹 JSON 导入与原始记录检查的 Agent 执行调用链调试整页工作台。
registry_import: "@/components/blocks/agent-trace-01"
source: packages/blocks/src/application/agent-trace-01/agent-trace.tsx
registry: packages/blocks/registry.json
related:
  - app-shell
  - page-layout
  - resizable
  - detail-list
  - tabs
  - badge
---

# Agent Trace 01

## 版式母版与跨业务设计改写（Visual Archetype & Adaptation）

- **所属页面母版**：**母版 4 · 主从分栏调试与检查工作台（Master-Detail Inspector Archetype）**。
- **空间分区比例**：采用有界全屏布局（`PageLayout size="full"`），上方为会话/轨迹摘要与过滤工具栏，主体通过双栏或分栏呈现：**左侧为按对话轮次（Turns）与工具调用展开的层级树/时间线（默认 68%），右侧为选中节点的参数、耗时、Token 消耗与 原始记录检查器（默认 32%）**。
- **如何改写为其他可观测场景**：
  - 可直接迁移用于 **Workflow 节点执行日志调试**、**RAG 检索召回分片检查台** 或 **Webhook 投递Payload排障页**——保留“左层级流 + 右结构化详情/代码检查”的黄金骨架，仅替换节点元数据字段。

## Use when

- 需要按对话轮次深度排查 Agent 的 Prompt 输入、工具入参/出参、子任务耗时与异常堆栈，或允许开发者上传本地 Trace JSON 文件离线诊断。

## Do not use when

- 仅需在对话页面侧边嵌入紧凑的实时瀑布流概览条：使用 `agent-message-trace-01`。
- 观察多智能体宏观委派拓扑树而非单次调用原始 JSON：可参考 `agent-orchestration-01`。

## 直接安装与集成契约

```bash
npx zeron-ui add agent-trace-01
```

- 若宿主应用已包含外层 `Sidebar`，复用同一导航上下文并避免双层 `AppShell` 嵌套；将轨迹数据源对接至项目的 OpenTelemetry / LangGraph / 网关 Trace 接口。

## 工作区集成示例

```tsx
import { AgentTrace } from "@zeron/blocks/agent-trace-01";

export function TraceInspector({ data }: { data: unknown }) {
  return <AgentTrace layout="embedded" defaultView="trace" data={data} allowUpload={false} locale="zh-CN" />;
}
```
