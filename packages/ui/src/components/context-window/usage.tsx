"use client";

import { useMemo } from "react";
import { PieChart, PieSlice, type PieData } from "#components/pie-chart";
import { cn } from "#system/utils";
import { getContextWindowUsage } from "./data";
import type { ContextWindowUsageProps } from "./types";

/** A compact readout for context triggers; the host owns the button and popover. */
export function ContextWindowUsage({ data, locale = "en-US", className, ...props }: ContextWindowUsageProps) {
  const usage = useMemo(() => getContextWindowUsage(data), [data]);
  const slices = useMemo<PieData[]>(() => usage ? [
    { label: "used", value: usage.used, color: "currentColor" },
    { label: "remaining", value: usage.totals.free, color: "var(--border)" },
  ] : [], [usage]);
  const percent = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
    } catch {
      return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 });
    }
  }, [locale]);

  return (
    <span data-slot="context-window-usage" className={cn("inline-flex items-center gap-1.5 align-middle text-label tabular-nums", className)} {...props}>
      {usage ? <>
        <span aria-hidden="true" inert className="pointer-events-none inline-flex size-4 shrink-0">
          <PieChart data={slices} size={16} innerRadius={6} hoverOffset={0}
            startAngle={0} endAngle={Math.PI * 2} hoveredIndex={null}>
            <PieSlice index={0} animate={false} showGlow={false} hoverEffect="none" />
            <PieSlice index={1} animate={false} showGlow={false} hoverEffect="none" />
          </PieChart>
        </span>
        <span>{percent.format(usage.ratio)}</span>
      </> : "—"}
    </span>
  );
}
