"use client";

import { Area, AreaChart, Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@zeron/ui/chart";
import { chartColor } from "@zeron/ui/chart-primitives";
import type { CreditTopUpLabels, CreditTopUpUsage } from "./credit-top-up-types";

export function CreditTopUpChart({ usage, labels, format }: { usage: CreditTopUpUsage; labels: CreditTopUpLabels; format: (value: number) => string }) {
  const color = chartColor(usage.colorIndex);
  const data = usage.history.map((point, index) => ({ ...point, index }));
  const axes = <>
    <CartesianGrid vertical={false} stroke="var(--border-subtle)" strokeDasharray="3 4" />
    <XAxis dataKey="index" axisLine={false} tickLine={false} tickFormatter={index => data[index]?.label ?? ""} interval="preserveStartEnd" minTickGap={4} tickMargin={8} height={24} />
    <YAxis axisLine={false} tickLine={false} tickCount={3} width={30} tickFormatter={format} domain={[0, "auto"]} />
    <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={value => data[Number(value)]?.label ?? ""} valueFormatter={value => `${format(Number(value))} ${labels.credits}`} />} />
  </>;
  return <div className="min-w-0">
    {data.length ? <ChartContainer className="h-36 min-h-0" config={{ value: { label: usage.label, color } }} aria-label={usage.label}>
      {usage.chart === "area" ? <AreaChart data={data} margin={{ top: 8, right: 20, bottom: 0, left: 0 }} accessibilityLayer>
        {axes}<Area dataKey="value" type="linear" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.12} strokeWidth={2} dot={{ r: 2.5, fill: "var(--color-value)", strokeWidth: 0 }} isAnimationActive={false} />
      </AreaChart> : <ComposedChart data={data} margin={{ top: 8, right: 20, bottom: 0, left: 0 }} accessibilityLayer>
        {axes}<Bar dataKey="value" fill="var(--color-value)" fillOpacity={usage.chart === "stem" ? 0.3 : 1} barSize={usage.chart === "stem" ? 2 : 12} radius={usage.chart === "stem" ? 0 : [4, 4, 0, 0]} isAnimationActive={false} />
        {usage.chart === "stem" && <Line dataKey="value" stroke="none" tooltipType="none" dot={{ r: 4, fill: "var(--color-value)", strokeWidth: 0 }} activeDot={false} isAnimationActive={false} />}
      </ComposedChart>}
    </ChartContainer> : <p className="flex h-36 items-center justify-center text-label text-fg-subtle">{labels.emptyHistory}</p>}
    {data.length > 0 && <table className="sr-only">
      <caption>{usage.label}</caption>
      <thead><tr><th scope="col">{labels.historyColumn}</th><th scope="col">{labels.credits}</th></tr></thead>
      <tbody>{data.map(point => <tr key={point.index}><th scope="row">{point.label}</th><td>{format(point.value)}</td></tr>)}</tbody>
    </table>}
  </div>;
}
