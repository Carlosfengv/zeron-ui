"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip, type TooltipPayloadEntry } from "recharts";
import { cn } from "#system/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = Record<string, {
  label?: React.ReactNode;
  color?: string;
  theme?: Partial<Record<keyof typeof THEMES, string>>;
}>;

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChartConfig() {
  const config = React.useContext(ChartContext);
  if (!config) throw new Error("Chart components must be used within a ChartContainer.");
  return config;
}

function ChartStyle({ config, id }: { config: ChartConfig; id: string }) {
  const entries = Object.entries(config).filter(([, item]) => item.color || item.theme);
  if (!entries.length) return null;

  return <style dangerouslySetInnerHTML={{
    __html: Object.entries(THEMES).map(([theme, selector]) => `${selector} [data-chart=${id}] {\n${entries.map(([key, item]) => {
      const color = item.theme?.[theme as keyof typeof THEMES] ?? item.color;
      return color ? `  --color-${key}: ${color};` : "";
    }).join("\n")}\n}`).join("\n"),
  }} />;
}

export function ChartContainer({ children, className, config, id, ...props }: React.ComponentPropsWithoutRef<"div"> & {
  config: ChartConfig;
}) {
  const generatedId = React.useId();
  const chartId = `chart-${id ?? generatedId.replace(/:/g, "")}`;

  return <ChartContext.Provider value={config}><div data-chart={chartId} className={cn("flex min-h-40 w-full justify-center text-label [&_.recharts-cartesian-axis-tick_text]:fill-[var(--fg-subtle)] [&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none", className)} {...props}><ChartStyle config={config} id={chartId} /><ResponsiveContainer>{children as React.ReactElement}</ResponsiveContainer></div></ChartContext.Provider>;
}

export const ChartTooltip = Tooltip;

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
  if (!active || !payload?.length) return null;

  return <div className={cn("grid min-w-36 gap-1.5 rounded-lg border-[0.5px] border-border bg-surface-floating px-3 py-2 text-label shadow-floating", className)}><p className="font-medium text-fg-default">{labelFormatter ? labelFormatter(label ?? "") : label}</p><div className="grid gap-1.5">{payload.filter((item) => item.type !== "none").map((item) => {
    const key = String(item.dataKey ?? item.name ?? "value");
    const itemConfig = config[key];
    const color = item.color ?? `var(--color-${key})`;
    const name = String(itemConfig?.label ?? item.name ?? key);
    return <div className="flex items-center justify-between gap-4" key={key}><span className="flex items-center gap-1.5 text-fg-muted">{!hideIndicator && <span aria-hidden className="size-2 rounded-[2px]" style={{ backgroundColor: color }} />}{name}</span><span className="font-medium tabular-nums text-fg-default">{valueFormatter ? valueFormatter(item.value, name) : String(item.value ?? "—")}</span></div>;
  })}</div></div>;
}
