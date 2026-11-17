"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip, type TooltipPayloadEntry } from "recharts";
import { ChartDataTable, type ChartDataTableProps } from "#components/chart-primitives";
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

export { DonutSummary, TimeSeriesChart, type DonutSummaryProps, type TimeSeriesChartProps } from "#components/chart-summary";

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
