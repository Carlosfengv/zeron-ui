---
schema_version: 1
name: funnel-chart
kind: component
status: stable
locale: zh-CN
summary: 保留参考几何和动画的横向、纵向分层漏斗，支持受控悬停、渐变、图案和键盘高亮。
package_import: "@zeron/ui/funnel-chart"
registry_import: "@/components/ui/funnel-chart"
source: packages/ui/src/components/funnel-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [chart-primitives, surfaces]
---

# FunnelChart

安装 `npx zeron-ui add funnel-chart`。此组件只依赖 Motion、surfaces 和 utils；不安装 Recharts、Visx 或其他 chart。工作区从 `@zeron/ui/funnel-chart` 导入，Registry 消费项目从 `@/components/ui/funnel-chart` 导入。

`data: FunnelStage[]` 按业务阶段顺序传入 label、value，可带 displayValue、color、gradient。百分比为当前 value / 首项 value × 100，首项必须大于 0，其余必须是非负有限数。不排序、不删掉零值、不计算相邻阶段转化率。空数组不渲染；非法数据只保留屏幕阅读器可访问的原始值，不生成路径或虚构百分比。业务空态和数据错误提示由宿主提供。

默认横向、三层曲线、4px 间距、2.2 / 1 比例，纵向默认 1 / 1.8。最后一段保持最后阶段宽度。`style` 可覆盖容器尺寸。`edges="straight"` 使用直边；`labelLayout="grouped"` 才使用 labelOrientation 和 labelAlign。默认 spread 保留横向上/中/下、纵向左/中/右分布。长文本在可用空间内截断，title 与隐藏有序列表保留完整值。

默认系列颜色 `var(--chart-1)`；显式 stage.color 覆盖全局 color；gradient 首个颜色控制外层，最内层使用渐变；renderPattern 的最内层优先于渐变。renderPattern 必须用组件提供的实例唯一 id 作为 pattern 的 id。grid 默认 false，true 开启交替 muted 背景和 border 分隔线；对象可分别控制 bands / lines / 颜色 / 线宽 / 透明度。

传入 hoveredIndex（包括 null）即为受控模式，onHoverChange 请求宿主更新状态；省略 hoveredIndex 则组件内部维护悬停，保持参考仅在受控模式调用回调的行为。鼠标离开阶段清除高亮，包括点击图表获得焦点后；键盘聚焦时保留键盘高亮。一个 Tab 停靠点，横向使用左右箭头，纵向使用上下箭头，Home / End 跳到首尾，Escape 和失焦清除高亮。数据为空、失效或下标越界时清除内部高亮，受控状态不被隐式改写。不要通过颜色隐藏原始值。

默认 enterTransition 为 1.1s tween、ease [0.85, 0, 0.15, 1]，staggerDelay 为 0.12s。更改 transition 后需要通过 React key 重挂载以重播；尊重 prefers-reduced-motion，停止入场与悬停缩放并清理动画和尺寸监听。

```tsx
"use client";

import { useState } from "react";
import { FunnelChart, type FunnelStage } from "@zeron/ui/funnel-chart";

const data: FunnelStage[] = [
  { label: "访问", value: 12000 },
  { label: "注册", value: 4800 },
  { label: "付费", value: 1200 },
];

export function SignupFunnel() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  return <FunnelChart data={data} hoveredIndex={hoveredIndex} onHoverChange={setHoveredIndex} />;
}
```

layers 归一化为 1–64 的整数，非有限值回退 3；gap 非负并在空间不足时缩小到保留至少一半绘图空间；非有限 gap 回退 4。零尺寸不生成 SVG，容器恢复可测量尺寸后重新绘制。使用 ResizeObserver 的布局尺寸，父容器的 transform 不改变内部 gap 和标签坐标；同尺寸通知不重新绘图。入场完成和重播保持 SVG / pattern 节点，避免重挂载。超出第一阶段的正常有限值允许超过 100%，保持参考的 overflow-visible 语义；宿主负责业务有效性。

需要可见原始数据表时额外安装 chart-primitives 并组合 ChartDataTable，传入宿主本地化的列名、caption 和数字格式。不要将可视化计算结果写回原始数据。
