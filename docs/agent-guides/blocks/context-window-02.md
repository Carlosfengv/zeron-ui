---
schema_version: 1
name: context-window-02
kind: block
status: stable
locale: zh-CN
summary: 精简的上下文容量卡片，包含模型、分类矩阵、文件展开与对话压缩。
package_import: "@zeron/blocks/context-window-02"
registry_import: "@/components/blocks/context-window-02"
source: packages/blocks/src/application/context-window-02/context-window-compact.tsx
types: packages/blocks/src/application/context-window-02/context-window-compact-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [context-window, context-window-01, container, badge, button, alert, inline-notice, pie-chart]
---

# Context Window 02

共享 UI 已下沉到 `@zeron/ui/context-window`（Registry：`@/components/ui/context-window`）。旧 block 的组件、文案、类型与演示工厂继续兼容。通用组件说明见 [ContextWindow](../components/context-window.md)。

安装 `npx zeron-ui add context-window-02`。用于嵌入会话侧栏、弹出面板或已有页面的紧凑 React 数据 block，保留宿主布局。

```tsx
"use client";
import { useState } from "react";
import { ContextWindowCompact, ContextWindowUsage, createContextWindowCompactDemoData, contextWindowCompactZhLabels } from "@zeron/blocks/context-window-02";

export function ContextWindowCompactPreview() {
  const [data] = useState(createContextWindowCompactDemoData);
  return <div className="space-y-3">
    <ContextWindowUsage data={data} locale="zh-CN" />
    <ContextWindowCompact data={data} locale="zh-CN" labels={contextWindowCompactZhLabels} />
  </div>;
}
```

Registry 消费项目改用 `@/components/blocks/context-window-02`。`data` 与 context-window-01 共用 ContextWindowData；本 block 只展示 capacity、systemTokens、toolTokens、docs、history、memory 和可选 session.model。总量由记录计算；capacity 必须为有限正数，token 必须为有限非负数，同一类别 id 唯一且非空。无效输入显示错误。超容量保留真实总量与百分比，剩余钳制为零。token 使用 k/M/B，百分比与可访问精确计数按 locale 格式化。

在 Popover 或已有表面中传 `embedded`，仅渲染内容与操作，不生成 Container、ContainerBody 或 ContainerFooter 的背景、边框和留白；外层表面统一管理这些样式。独立使用时默认保留原来的 Container 卡片。

240 格矩阵与 context-window-01 共用最大余数分配；顺序为系统、工具、文件、对话、记忆、剩余。中性色和品牌色来自现有语义变量，无新增主题变量。矩阵是分类容量可视化，无日期轴；真实数量同时提供在文本分类明细中。

`title` 可替换标题；Claude 模型名称默认搭配现有图标库的彩色 Claude 标志，`modelIcon` 可覆盖默认值并为其他模型提供装饰图标。`labels` 支持局部覆盖，提供 English/Zh 两组默认值。locale 语法无效时数值格式回退到 en-US，不中断渲染。宿主以新 data 对象传入更新后的快照，避免原地修改被 memo 缓存保留。

文件行使用 Button 展开本地只读列表，提供 aria-expanded/aria-controls；列表只在展开时创建条目，限高并独立滚动，支持 Tab 聚焦后使用方向键或 PageDown 滚动。

用量与容量使用相同的正文大小，仅用字重和颜色区分；分类明细统一使用正文大小，文件展开按钮通过 Button 的 md 尺寸保持一致。底部显示剩余容量。

`ContextWindowUsage` 用于按钮或工具栏内的紧凑用量读数，接收相同的 data、locale 和原生 span 属性。内部复用 PieChart / PieSlice，以 used 和 remaining 真实数量绘制 16px 圆环，文字由实际 used / capacity 本地化计算；超容量显示满环及实际百分比，非法数据显示破折号。图形关闭入场与悬停效果，并通过 aria-hidden、inert 保持装饰性；外层 Button 负责焦点与展开行为。把该复合读数作为 Button 内容时，提供上下文含义的可访问文案，不再使用普通 circle 图标或固定百分比。

`onCompact` 与 `compacting` 由宿主控制；回调缺失时隐藏压缩操作。压缩中、历史为空、无非零未固定记录时禁用压缩。block 不修改快照。加载使用 info InlineNotice；错误与无效快照使用 danger Alert，onRetry 位于 AlertAction。`notice` 是成功反馈，使用 success InlineNotice + InlineNoticeContent，由常驻的礼貌播报区域统一播报；加载、错误、无效数据或压缩中隐藏旧成功提示。宿主在开始新操作时清空旧 notice。真实压缩、持久化与模型服务均由宿主接入。

Registry 依赖 context-window UI，并保留 context-window-01/context-window-data.ts 与 context-window-types.ts 的兼容转导出，可与完整版并存。精简 block 通过适配层保留默认 Claude 图标；通用 UI 的 modelIcon 由宿主提供。示例工厂是固定的 175.6k / 200k 快照；文档演示在本地模拟压缩并保留固定记录，不连接模型服务。
