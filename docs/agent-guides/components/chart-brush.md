---
schema_version: 1
name: chart-brush
kind: component
status: stable
locale: zh-CN
summary: 同步原生手柄与覆盖层的受控时间选区与小图布局。
source: packages/ui/src/components/chart-brush.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [area-chart, chart-core, chart-brush, funnel-chart]
package_import: "@zeron/ui/chart-brush"
registry_import: "@/components/ui/chart-brush"
---

# chart-brush

安装 `npx zeron-ui add chart-brush`；在 AreaChart 小图中组合 ChartBrush，将回调值传给主图 xDomain。根图 style 可固定 height=80、aspectRatio=auto，margin.top/bottom=8 保留可用空间。

selection/initialSelection 的 start/end 必须是 Date。selection 未提供（undefined）为非受控，initialSelection 初始化；selection=null 清除原生 Visx 选区、纹理、中性色覆盖层和手柄；传入对象为受控，onSelectionChange 请求宿主更新。无效日期或完全位于轨道之外的范围不绘制选区。外部改变选区、时间域和容器尺寸均同步原生手柄；拖动时不重挂载 Brush。回调在预览和提交阶段都调用，不能当作只提交一次的事件。程序化 prop 同步不额外回调。

默认 brushDirection=horizontal、useWindowMoveEvents=true、handleSize=8、可见手柄24×4px、blurPx=0、fadeOuterEdges=false。未选时间范围以灰色中性色显示，默认无高斯模糊；整个轨道有 1px border，清除选区后仍保留。selectionPattern 可覆盖默认纹理。selectedBoxStyle 是 SVG rect 样式。左右手柄 role=slider，方向键调整1%范围，Home/End 到边界、Escape 清除；阻止事件传到主图键盘处理。

清空后保留键盘“Select full range”停靠点，Enter / Space 恢复完整范围并把焦点交给起始手柄；受控模式仍需宿主接受回调更新 selection，非受控模式同步真实拖拽窗口。

ChartBrushLayout 保留 data/xDataKey/xExtentMax、enabled、height、fitMainContent、className、children(layout)、brushStrip(layout)。layout 包含 xDomain/xDomainSlotCount/brushSelection/onBrushSelectionChange；参考布局在清除时恢复完整时间范围，单独 ChartBrush 的 null 则确实清除。不要混淆这两个清除契约。

```tsx
"use client";
import { useState } from "react";
import { AreaChart, Area } from "@zeron/ui/area-chart";
import { ChartBrush, type ChartBrushSelection } from "@zeron/ui/chart-brush";
const data = [{ date: "2026-10-01", value: 10 }, { date: "2026-10-02", value: 20 }];
export function Range() {
  const [selection, setSelection] = useState<ChartBrushSelection | null>(null);
  return <AreaChart data={data}><Area dataKey="value" /><ChartBrush selection={selection} onSelectionChange={setSelection} /></AreaChart>;
}
```
