---
schema_version: 1
name: context-map
kind: component
status: stable
locale: zh-CN
summary: 按 token 分布展示上下文的交互式矩形树图，支持区块详情、Agent 切换和压缩前后对比。
package_import: "@zeron/ui/context-map"
registry_import: "@/components/ui/context-map"
source: packages/ui/src/components/context-map.tsx
types: packages/ui/src/components/context-map/data.ts
registry: packages/ui/registry.json
typecheck_examples: true
related: [context-window]
---

# Context Map

安装 `npx zeron-ui add context-map`。Registry 消费项目从 `@/components/ui/context-map` 导入。

```tsx
import { ContextMap, type ContextBlock } from "@zeron/ui/context-map";

const system: ContextBlock = { id: "system", label: "系统提示词", kind: "system", tokens: 6200 };
const chat: ContextBlock = { id: "chat", label: "对话", kind: "chat", tokens: 42900 };
const summary: ContextBlock = { id: "summary", label: "摘要", kind: "summary", tokens: 8600 };

export function ContextComparison() {
  return <ContextMap
    blocks={[system, summary]}
    limit={200000}
    compaction={{ before: [system, chat], summarized: ["chat"], summary: "summary" }}
  />;
}
```

按希望展示的顺序传入 `blocks`，跨快照保留稳定的区块 ID。区块面积随 token 占比变化，剩余容量用虚线区块显示。区块支持键盘聚焦、点击固定和 Escape 关闭。可在 `detail` 和 `items` 中提供说明与子项。

切换 Agent 时，由宿主通过 `onAgentChange` 更新 `blocks` 和 `compaction`。`view` 和 `onViewChange` 可控制当前压缩快照，默认显示压缩后。传入 `compaction={null}` 显示待压缩提示，也可用 `status` 展示压缩进度。通过 `contextMapZhLabels` 和 `locale="zh-CN"` 设置中文界面。

交互参考 [affectUI Context Map](https://www.affectui.com/components/context-map)。
