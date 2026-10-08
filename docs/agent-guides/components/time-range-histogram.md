---
schema_version: 1
name: time-range-histogram
kind: component
status: stable
locale: zh-CN
summary: 保留时间桶和受控范围的直方图，普通系列使用全局 Chart 槽位，真实结果状态独立取色。
package_import: "@zeron/ui/time-range-histogram"
registry_import: "@/components/ui/time-range-histogram"
source: packages/ui/src/components/time-range-histogram.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [chart, chart-primitives]
---

# Time Range Histogram

`data` 为有序且不重叠的时间桶，每项包含 start、end、label 和系列计数。`series` 包含 dataKey、label、color 和可选 inactiveColor。`value` 与 `onValueChange` 由宿主控制，选择范围对齐到桶边界；保留真实时间、计数、指针与键盘操作，不通过颜色迁移改变查询或汇总。

方向键移动整个选区；Shift 加方向键调整选区结束边界。PageUp／PageDown 按五个桶移动，Home／End 移到边界；与 Shift 组合时同样只调整结束边界，使全范围选区也能用键盘缩小。

普通单系列传 `chartColor(1)`，比较系列固定 1–5 槽位；动态业务 key 可用 `chartSeriesColor(key)` 稳定取色，有限槽位允许碰撞。图形与图例复用同一个 series 配置。真实 success / warning / error 使用领域状态映射或 `chartStatusColors`，不要按数组下标把任意类别解释为状态。

`inactiveColor` 保留中性 surface，选择边界与手柄保留交互色；不将全部元素统一成系列色。`ariaLabel`、`formatRange`、`formatValue` 和边界标签由宿主本地化。父容器可收缩，图表保持可测量宽度。

```tsx
import { useState } from "react";
import { TimeRangeHistogram } from "@zeron/ui/time-range-histogram";
import { chartColor } from "@zeron/ui/chart-primitives";
const data = [{ start: 0, end: 1000, label: "00:00", requests: 12 }];
const series = [{ dataKey: "requests", label: "请求", color: chartColor(1) }];
export function RequestRange() {
  const [value, setValue] = useState({ start: 0, end: 1000 });
  return <TimeRangeHistogram ariaLabel="请求时间范围" data={data} series={series} value={value} onValueChange={setValue} />;
}
```

安装 `npx zeron-ui add time-range-histogram`，保留 Chart、chart-primitives 与 surfaces 的依赖链。主题切换通过全局变量生效，显式 series.color 覆盖继续接受可信 CSS 色值。
