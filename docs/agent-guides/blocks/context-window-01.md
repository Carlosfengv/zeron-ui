---
schema_version: 1
name: context-window-01
kind: block
status: stable
locale: zh-CN
summary: 上下文 token 容量、缓存、分类矩阵与内容查看面板。
package_import: "@zeron/blocks/context-window-01"
registry_import: "@/components/blocks/context-window-01"
source: packages/blocks/src/application/context-window-01/context-window.tsx
types: packages/blocks/src/application/context-window-01/context-window-types.ts
registry: packages/blocks/registry.json
typecheck_examples: true
related: [container, badge, button, tabs, tooltip, inline-notice]
---

# Context Window 01

安装 `npx zeron-ui add context-window-01`。嵌入现有页面的 React 数据 block，保留宿主布局。Registry 消费项目改用 `@/components/blocks/context-window-01` 入口。

```tsx
"use client";
import { useState } from "react";
import { ContextWindow, createContextWindowDemoData, contextWindowZhLabels } from "@zeron/blocks/context-window-01";

export function ContextWindowPreview() {
  const [data] = useState(createContextWindowDemoData);
  return <ContextWindow data={data} locale="zh-CN" labels={contextWindowZhLabels} />;
}
```

data 包含正数 capacity、非负 systemTokens/toolTokens 和 docs/memory/history 记录。每类 id 必须唯一且非空；tokens 为非负有限数值。零值有效，无效输入或无法表示的合计、使用比例显示错误。所有分类总量均从记录计算；超出容量时仍展示真实用量，剩余为零，矩阵按实际总量缩放。tokensPerTurn 是宿主提供的正数估计；省略、零值、无效值或无法表示的估算不展示预计剩余轮次。

cache 可省略，hitRate 为 0–1 比例，saved/cachedTokens/newTokens 是非负数值或 null。未知值显示 —，不补零。token 数量统一使用英语数量级缩写 k/M/B，最多一位小数，如 3200 → 3.2k、1200000 → 1.2M、2400000000 → 2.4B，不随界面语言改为万或亿；locale/currency 控制百分比、整数计数和金额。source/detail 已由宿主本地化。session 可省略。

tab/onTabChange 支持受控分类；省略 tab 时保持本地状态。内容条目为只读展示，pinned 由宿主提供并显示固定状态。onCompact() 由宿主处理，block 不修改数据。compacting 禁用压缩并使用 Button loading，历史全部固定时也禁用压缩。缺少回调时隐藏操作；footerActions 由宿主传入。loading/error/onRetry/notice 提供异步状态与反馈。

矩阵由 400 格表示分类比例，使用最大余数法分配，细小分类可能不足一格；真实数值保留在键盘可访问的图例中。系统、工具、文档、历史固定映射至 chart-1、chart-2、chart-4、chart-5；记忆使用 chart-1 与 chart-5 的等量混色，剩余使用中性槽位 chart-6。分类配色避开黄色 chart-3 与红色 chart-7。矩阵、图例圆点、内容圆点与条目进度共用该映射，读取颜色变量以跟随主题。图例点击文档/记忆/历史可切换内容。Tooltip 展示分类前三条记录。现有 HeatmapChart 要求日期与数值强度，与无时间轴的 token 容量语义不符；此处仅实现业务矩阵，不复制日历热力图。所有颜色与动效使用既有变量与语义时长。

内容列表独立滚动。分类图例使用三列两行，每项名称与数值水平排列，窄屏长名称截断，完整名称与数值仍通过可访问标签提供；顶部统计在窄屏上下排列。示例数据工厂是固定演示快照，不表示模型查询。文档预览本地模拟实时变化和压缩，完整保留固定记录；真实压缩、缓存成本与持久化由宿主接入。
