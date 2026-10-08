---
schema_version: 1
name: live-line-chart
kind: component
status: stable
locale: zh-CN
summary: 数据 time 是 Unix 秒，最新 value 为独立必填属性。
source: packages/ui/src/components/live-line-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [live-line-chart, chart-core, area-chart]
package_import: "@zeron/ui/live-line-chart"
registry_import: "@/components/ui/live-line-chart"
---

# live-line-chart

安装 `npx zeron-ui add live-line-chart chart-primitives button`。React 19、Tailwind 4，保留参考 API 与几何，颜色使用 Zeron Token。

数据 time 是 Unix 秒，最新 value 为独立必填属性。默认窗口 30 秒、5 个刻度、前导 0、lerpSpeed 0.08、高度 300px。paused 冻结滚动，最新值插值和 Y 域仍继续更新。非法窗口／刻度／速度回到默认值。示例每秒更新，支持停止并在卸载清理；组件不创建 WebSocket。

图表只有一个键盘入口，方向键／Home／End 查看，Escape 清除。原始数据表负责可访问的数值说明。图例 layout／overflow 由调用 API 控制，不添加布局选择控件。共享 Tooltip 从 chart-core 导入，避免和旧 Recharts 契约混用。

```tsx
"use client";
import { useEffect, useState } from "react";
import { LiveLineChart, LiveLine, LiveXAxis, LiveYAxis, type LiveLinePoint } from "@zeron/ui/live-line-chart";
import { Grid, ChartTooltip } from "@zeron/ui/chart-core";
import { Button } from "@zeron/ui/button";
import { ChartDataTable } from "@zeron/ui/chart-primitives";

function StreamDemo({windowSecs=30,leading=0,minimal=false}:{windowSecs?:number;leading?:number;minimal?:boolean}) {
  const [data, setData] = useState<LiveLinePoint[]>([]);
  const [value, setValue] = useState(42);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(true);
  useEffect(() => {
    if (!running) return;
    let step = 0;
    const update = () => { const time = Date.now() / 1000; const next = 42 + Math.sin(step++ / 4) * 9; setValue(next); setData(previous => [...previous.filter(point => point.time >= time - 120),{time,value:next}]); };
    update(); const timer = window.setInterval(update, 1000); return () => window.clearInterval(timer);
  }, [running]);
  return <div className="w-full"><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setPaused(v => !v)}>{paused ? "Resume scrolling" : "Pause scrolling"}</Button><Button size="sm" variant="secondary" onClick={() => setRunning(v => !v)}>{running ? "Stop source" : "Start source"}</Button></div><LiveLineChart data={data} value={value} window={windowSecs} nowOffsetUnits={leading} paused={paused} exaggerate={minimal}><Grid horizontal /><LiveLine dataKey="value" pulse={!minimal} badge={!minimal} fill={!minimal} momentumColors={minimal ? {up:"var(--chart-1)",down:"var(--chart-3)",flat:"var(--chart-2)"} : undefined} /><LiveXAxis /><LiveYAxis /><ChartTooltip showDatePill={false} /></LiveLineChart><ChartDataTable caption="Live samples (Unix seconds)" columns={["Time (s)","Value"]} rows={data.map(point => ({id:String(point.time),label:String(point.time),values:[point.value.toFixed(2)]}))} /></div>;
}
function BasicDemo() { return <StreamDemo />; }
export function Example() { return <BasicDemo />; }
```
