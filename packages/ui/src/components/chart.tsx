"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipPayloadEntry } from "recharts";
import { ChartDataTable, chartSeriesColor, createChartNumberFormatter, createChartTimeFormatter, visualizationLayout, type ChartDataTableProps, type VisualizationSegment } from "#components/chart-primitives";
import { cn } from "#system/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<string, {
  label?: React.ReactNode;
  color?: string;
  theme?: Partial<Record<keyof typeof THEMES, string>>;
}>;

const ChartContext = React.createContext<ChartConfig | null>(null);
const ChartWidthContext = React.createContext<number | undefined>(undefined);

function useChartConfig() {
  const config = React.useContext(ChartContext);
  if (!config) throw new Error("Chart components must be used within a ChartContainer.");
  return config;
}

function ChartStyle({ config, id }: { config: ChartConfig; id: string }) {
  const entries = Object.entries(config).filter(([key, item]) => /^[\p{L}\p{N}_-]+$/u.test(key) && (item.color || item.theme));
  if (!entries.length) return null;

  return <style dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES).map(([theme, selector]) => `${selector} [data-chart=${id}] {\n${entries.map(([key, item]) => {
      const color = item.theme?.[theme as keyof typeof THEMES] ?? item.color;
      return color ? `  --color-${key}: ${color};` : "";
    }).join("\n")}\n}`).join("\n"),
  }} />;
}

export function ChartContainer({ children, className, config, id, dataTable, onKeyDown, ...props }: React.ComponentPropsWithoutRef<"div"> & {
  config: ChartConfig;
  dataTable?: ChartDataTableProps;
}) {
  const generatedId = React.useId();
  const [width, setWidth] = React.useState<number>();
  const chartId = `chart-${(id ?? generatedId).replace(/[^\p{L}\p{N}_-]/gu, "")}`;
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    onKeyDown?.(event);
    // Let Recharts handle its keys, then keep host page-navigation shortcuts out.
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key) && event.target instanceof Element && event.target.closest('[role="application"]')) event.stopPropagation();
  };

  return <ChartContext.Provider value={config}><ChartWidthContext.Provider value={width}><div data-chart={chartId} onKeyDown={handleKeyDown} className={cn("flex min-h-40 min-w-0 w-full justify-center text-label [&_.recharts-cartesian-axis-tick_text]:fill-[var(--fg-subtle)] [&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-surface:focus-visible]:outline [&_.recharts-surface:focus-visible]:outline-2 [&_.recharts-surface:focus-visible]:outline-focus-ring", className)} {...props}><ChartStyle config={config} id={chartId} /><ResponsiveContainer debounce={80} onResize={(nextWidth) => setWidth(nextWidth)}>{children as React.ReactElement}</ResponsiveContainer></div>{dataTable && <ChartDataTable {...dataTable} />}</ChartWidthContext.Provider></ChartContext.Provider>;
}

export const ChartTooltip = Tooltip;

export const chartTrendPreset = {
  margin: { top: 12, right: 12, bottom: 0, left: 0 },
  grid: { vertical: false, stroke: "var(--border)", strokeDasharray: "3 5" },
  axis: { axisLine: false, tickLine: false, minTickGap: 50 },
} as const;

export interface TimeSeriesChartProps {
  data: readonly { timestamp: number; values: Record<string, number | null> }[];
  series: readonly { id: string; label: string; color?: string }[];
  locale: string;
  timeZone: string;
  label: string;
  domain?: readonly [number, number];
  className?: string;
  formatValue?: (value: unknown) => string;
  dataSummary?: string;
}

/** Thin request trend: no aggregation, interpolation across nulls, or downsampling. */
export function TimeSeriesChart({ data, series, locale, timeZone, label, domain, className, formatValue = createChartNumberFormatter(locale, { maximumFractionDigits: 0 }), dataSummary }: TimeSeriesChartProps) {
  const points = data.filter((point) => Number.isFinite(new Date(point.timestamp).getTime()));
  const start = domain?.[0] ?? points.at(0)?.timestamp;
  const end = domain?.[1] ?? points.at(-1)?.timestamp;
  const formatTime = createChartTimeFormatter(locale, timeZone, start !== undefined && end !== undefined && end - start > 86400000 ? { month: "short", day: "numeric" } : undefined);
  const fullTime = createChartTimeFormatter(locale, timeZone, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  const dataTable: ChartDataTableProps = { caption: label, summary: dataSummary, columns: [timeZone, ...series.map((entry) => entry.label)], rows: data.map((point, index) => ({ id: `${point.timestamp}-${index}`, label: fullTime(point.timestamp), values: series.map((entry) => formatValue(point.values[entry.id])) })) };
  const invalidTimeNotice = points.length < data.length ? <p className="mb-2 text-label text-fg-warning">部分时间无效，请查看数据 / Invalid timestamps; view data</p> : null;
  if (!points.length) return <div className="min-w-0" data-slot="time-series-chart" aria-label={label}>{invalidTimeNotice}<p className="flex h-52 items-center justify-center text-label text-fg-subtle">暂无数据 / No data</p>{data.length > 0 && <ChartDataTable {...dataTable} />}</div>;
  const config = Object.fromEntries(series.map((entry, index) => [`series${index}`, { label: entry.label, color: entry.color ?? chartSeriesColor(entry.id) }]));
  const chartData = points.map((point) => ({ ...Object.fromEntries(series.map((entry, index) => [`series${index}`, typeof point.values[entry.id] === "number" && Number.isFinite(point.values[entry.id]) ? point.values[entry.id] : null])), timestamp: point.timestamp }));
  return <div className="min-w-0" data-slot="time-series-chart" data-time-zone={timeZone}>
    {invalidTimeNotice}
    <ChartContainer config={config} className={cn("h-52 min-h-0", className)} aria-label={label} dataTable={dataTable}>
      <AreaChart accessibilityLayer data={chartData} margin={chartTrendPreset.margin}>
        <CartesianGrid {...chartTrendPreset.grid} />
        <XAxis {...chartTrendPreset.axis} dataKey="timestamp" type="number" scale="time" domain={domain ? [...domain] : ["dataMin", "dataMax"]} tickFormatter={formatTime} />
        <YAxis axisLine={false} tickLine={false} allowDecimals={false} width={44} tickFormatter={formatValue} />
        <ChartTooltip allowEscapeViewBox={{ x: false, y: false }} content={<ChartTooltipContent labelFormatter={(value) => fullTime(Number(value))} valueFormatter={formatValue} />} />
        {series.map((entry, index) => <Area key={entry.id} dataKey={`series${index}`} type="linear" connectNulls={false} stroke={`var(--color-series${index})`} fill={`var(--color-series${index})`} fillOpacity={0.12} strokeWidth={2} dot={points.length === 1} isAnimationActive={false} />)}
      </AreaChart>
    </ChartContainer>
  </div>;
}

export interface DonutSummaryProps extends Omit<React.ComponentPropsWithoutRef<"div">, "children"> {
  segments: readonly VisualizationSegment[];
  total?: number | null;
  center?: React.ReactNode;
  innerRadius?: string;
}

/** Unassigned total stays a neutral track. Incomplete distributions require an explicit total. */
export function DonutSummary({ segments, total, center, innerRadius = "80%", className, ...props }: DonutSummaryProps) {
  const layout = visualizationLayout(segments, total);
  const data = layout.denominator > 0 ? [...segments.filter((segment) => segment.value !== null && Number.isFinite(segment.value) && segment.value > 0), ...(layout.remainder > 0 ? [{ id: "__remainder", label: "—", value: layout.remainder, color: "var(--muted)" }] : [])] : [];
  return <div role="img" className={cn("relative aspect-square w-full min-w-0 max-w-48", className)} data-slot="donut-summary" data-complete={layout.complete} data-overflow={layout.overflow} {...props}>
    <ChartContainer aria-hidden="true" className="absolute inset-0 h-full min-h-0" config={{}}>
      <PieChart accessibilityLayer={false}>
        <Pie data={[{ value: 1 }]} dataKey="value" fill="var(--muted)" innerRadius={innerRadius} outerRadius="100%" stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false} />
        {data.length > 0 && <Pie data={data} dataKey="value" innerRadius={innerRadius} outerRadius="100%" stroke="none" startAngle={90} endAngle={-270} isAnimationActive={false}>{data.map((entry) => <Cell key={entry.id} fill={entry.color ?? chartSeriesColor(entry.id)} />)}</Pie>}
      </PieChart>
    </ChartContainer>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex min-w-0 flex-col items-center justify-center gap-1 px-4 text-center tabular-nums text-fg-default">{center}</div>
  </div>;
}

export function ChartTooltipContent({ active, className, hideIndicator = false, label, labelFormatter, payload, valueFormatter }: {
  active?: boolean;
  className?: string;
  hideIndicator?: boolean;
  label?: string | number;
  labelFormatter?: (label: string | number) => React.ReactNode;
  payload?: readonly TooltipPayloadEntry[];
  valueFormatter?: (value: unknown, name: string) => React.ReactNode;
}) {
  const config = useChartConfig();
  const width = React.useContext(ChartWidthContext);
  if (!active || !payload?.length) return null;

  const maxWidth = width ? Math.max(1, width - 8) : 320;
  return <div style={{ maxWidth, minWidth: Math.min(144, maxWidth) }} className={cn("grid gap-1.5 rounded-lg border-hairline border-border bg-surface-floating px-3 py-2 text-label shadow-floating", className)}><p className="break-words font-medium text-fg-default">{labelFormatter ? labelFormatter(label ?? "") : label}</p><div className="grid gap-1.5">{payload.filter((item) => item.type !== "none").map((item) => {
    const key = String(item.dataKey ?? item.name ?? "value");
    const itemConfig = config[key];
    const color = item.color ?? `var(--color-${key})`;
    const name = String(itemConfig?.label ?? item.name ?? key);
    return <div className="flex min-w-0 items-start justify-between gap-4" key={key}><span className="flex min-w-0 items-start gap-1.5 text-fg-muted">{!hideIndicator && <span aria-hidden className="mt-1 size-2 shrink-0 rounded-[2px]" style={{ backgroundColor: color }} />}<span className="min-w-0 break-words">{name}</span></span><span className="break-words font-medium tabular-nums text-fg-default">{valueFormatter ? valueFormatter(item.value, name) : String(item.value ?? "—")}</span></div>;
  })}</div></div>;
}
