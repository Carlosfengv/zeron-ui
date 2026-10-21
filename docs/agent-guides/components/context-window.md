---
schema_version: 1
name: context-window
kind: component
status: stable
locale: zh-CN
summary: 共享上下文快照的完整面板、精简面板和用量指示器，压缩与数据更新由宿主控制。
package_import: "@zeron/ui/context-window"
registry_import: "@/components/ui/context-window"
source: packages/ui/src/components/context-window.tsx
types: packages/ui/src/components/context-window/types.ts
registry: packages/ui/registry.json
typecheck_examples: true
related: [context-window-01, context-window-02, input-message, popover, pie-chart]
---

# ContextWindow

安装 `npx zeron-ui add context-window`。独立 AI component，无需安装聊天 block 或其演示数据；Registry 消费项目将导入替换为 `@/components/ui/context-window`。

```tsx
"use client";
import { useState } from "react";
import {
  ContextWindow, ContextWindowCompact, ContextWindowUsage,
  contextWindowZhLabels, contextWindowCompactZhLabels, type ContextWindowData,
} from "@zeron/ui/context-window";

export function ContextPanels({ snapshot, onCompact }: { snapshot: ContextWindowData; onCompact: () => void }) {
  const [tab, setTab] = useState<"docs" | "memory" | "history">("docs");
  return <div className="space-y-4">
    <ContextWindowUsage data={snapshot} locale="zh-CN" />
    <ContextWindow data={snapshot} tab={tab} onTabChange={setTab} locale="zh-CN"
      labels={contextWindowZhLabels} onCompact={onCompact} />
    <ContextWindowCompact data={snapshot} locale="zh-CN"
      labels={contextWindowCompactZhLabels} onCompact={onCompact} />
  </div>;
}
```

三个入口共用 ContextWindowData：正数 capacity、非负 systemTokens/toolTokens 及 docs/memory/history 记录。每类记录的 id 非空且唯一、tokens 有限非负；source/detail 为宿主已本地化文案。可选 cache 提供 0–1 命中率和金额/token 指标，未知值为 null；tokensPerTurn 是预计每轮用量，session 提供模型、轮次和名称。以新的 data 对象更新记录，避免原地修改被 memo 保留。

需要在服务端纯计算时，从 `@zeron/ui/context-window/data`（Registry：`@/components/ui/context-window/data`）导入数据工具；独立文案也可从 `@zeron/ui/context-window/labels` 导入。

getContextWindowUsage(data) 返回共享总量、比例、状态和可选剩余轮次，无效或无法表示的用量返回 null。超容量保留真实比例且剩余为零。allocateContextWindowCells(totals, capacity, cellCount?, categories?) 仅接收已校验总量，使用最大余数法；完整面板 400 格，精简面板 240 格。它们是无日期轴的分类容量矩阵。真实计数也提供在图例、分类与可访问标签中，不以颜色单独传达用量。

完整 ContextWindow 保留缓存、受控或本地分类 tab/defaultTab/onTabChange、只读记录、固定状态及 live、onSettings、onClose、footerActions。locale/currency 格式化百分比、整数与缓存金额；token 用 k/M/B。ContextWindowCompact 支持文件展开、剩余容量、modelIcon 和 embedded；无效 locale 回退 en-US。shared UI 不依赖任何提供方，模型图标由宿主传入。

在 Popover 内使用 embedded 避免嵌套 Container 表面，外层管理边框、留白和展开行为。ContextWindowUsage 接收相同 data、locale 和原生 span 属性；使用 PieChart/PieSlice 绘制装饰性 16px 用量环，图形 aria-hidden/inert，无额外焦点。按钮宿主需添加“上下文用量”等可访问标签。非法快照显示破折号，超容量显示满环及真实比例。

onCompact 只发出意图，组件不修改快照、不调用模型或保存数据；宿主负责 compacting、loading、error、onRetry 与 notice。缺少回调隐藏操作；忙碌、空历史或全部固定时禁用压缩，精简面板还会排除零 token 记录。精简面板在加载、错误、无效或压缩中隐藏旧成功提示。完整与精简面板分别导出 contextWindowEnglishLabels/contextWindowZhLabels、contextWindowCompactEnglishLabels/contextWindowCompactZhLabels，支持局部 labels 覆盖。

旧 @zeron/blocks/context-window-01 和 context-window-02 入口保留所有组件、类型、文案和数据工厂。第一个 block 兼容导出共享完整面板，第二个兼容导出用量指示器并以轻量适配层保留默认 Claude 标志，modelIcon 覆盖规则不变。演示工厂和业务演示留在 block 中，新的 UI 不反向依赖 block。
