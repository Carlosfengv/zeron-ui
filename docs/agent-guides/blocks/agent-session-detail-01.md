---
schema_version: 1
name: agent-session-detail-01
kind: block
status: stable
typecheck_examples: true
locale: zh-CN
summary: 集成智能体导航、会话快速切换与内嵌执行轨迹的 Agent 会话详情整页工作台。
registry_import: "@/components/blocks/agent-session-detail-01"
source: packages/blocks/src/application/agent-session-detail-01/agent-session-detail.tsx
registry: packages/blocks/registry.json
related:
  - app-shell
  - sidebar
  - page-layout
  - tabs
  - detail-list
  - badge
---

# Agent Session Detail 01

## 版式母版与跨业务设计改写（Visual Archetype & Adaptation）

- **所属页面母版**：**主从对象详情工作台（Resource & Session Detail Archetype）**。
- **空间与信息层级**：
  1. **页头上下文区**：页头展示当前 Agent、会话名称与状态，用户可在侧栏按 Agent 分组选择其他会话。
  2. **多维详情视图区**：结合会话概览指标（Token、费用、耗时）与内嵌的完整执行调用链轨迹，避免用户为了看同一会话的消息与 Trace 而在两个不同路由间反复跳出。
- **跨业务改写指南**：适合改写为任何**“高频连续审阅单据/会话”**的后台详情页（如客服工单质检详情、自动化流水线运行详情、风控审核单详情）——关键是保留与详情并列的会话导航，让用户在审阅过程中保持位置。

## Use when

- 从会话列表（如 `ai-gateway-session-list-01`）点入单条会话后，需要一站式审阅该会话的完整上下文、模型耗时归因与调用轨迹。

## Do not use when

- 浏览和筛选成百上千条历史会话记录：使用 `ai-gateway-session-list-01`。

## 直接安装与集成契约

```bash
npx zeron-ui add agent-session-detail-01
```

- 宿主提供 `sessions`，通过 `activeSessionId` 与 `onActiveSessionChange` 同步路由。模板中的对话发送使用本地演示逻辑，接入生产会话时需要替换。

## 工作区集成示例

```tsx
import { AgentSessionDetail, type AgentSession } from "@zeron/blocks/agent-session-detail-01";

export function SessionDetails({ sessions, id, select }: {
  sessions: AgentSession[]; id: string; select: (id: string) => void;
}) {
  return <AgentSessionDetail sessions={sessions} activeSessionId={id} onActiveSessionChange={select} />;
}
```
