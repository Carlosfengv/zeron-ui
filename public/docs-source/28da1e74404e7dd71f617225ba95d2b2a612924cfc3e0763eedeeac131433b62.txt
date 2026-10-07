"use client";

import type { ComponentPropsWithoutRef } from "react";
import type { BadgeColor } from "@zeron/ui/badge";
import { MetricCard } from "@zeron/ui/metric-card";
import { ChartLegend, SegmentedBar, chartSeriesColor, type ChartColorIndex } from "@zeron/ui/chart-primitives";
import { cn } from "@zeron/ui/system/utils";
import styles from "./storage-usage.module.css";

export interface StorageUsageItem {
  id: string;
  label: string;
  /** Use the same unit as capacity. */
  value: number;
  /** @deprecated Legacy categorical name; colorIndex takes precedence. */
  color: BadgeColor;
  colorIndex?: ChartColorIndex;
}

export interface StorageUsageData {
  capacity: number;
  items: readonly StorageUsageItem[];
}

export interface StorageUsageProps
  extends Omit<ComponentPropsWithoutRef<typeof MetricCard>, "label" | "value" | "unit" | "meta" | "description" | "layout" | "footer" | "content" | "separator" | "leading" | "labelClassName" | "valueClassName"> {
  data: StorageUsageData;
  label?: string;
  unit?: string;
  locale?: string;
  formatters?: {
    value?: (value: number) => string;
    usageSummary?: (used: string, capacity: string, unit: string) => string;
    remaining?: (remaining: string, unit: string) => string;
  };
}

/** Consistent demo values retaining the reference's 20 GB allowance and 94% usage. */
export const storageUsageDemoData: StorageUsageData = {
  capacity: 20,
  items: [
    { id: "contacts", label: "Contacts", value: 5.27, color: "indigo", colorIndex: 1 },
    { id: "tasks", label: "Tasks", value: 4.16, color: "cyan", colorIndex: 2 },
    { id: "deals", label: "Deals", value: 3.33, color: "green", colorIndex: 3 },
    { id: "emails", label: "Emails", value: 2.63, color: "yellow", colorIndex: 4 },
    { id: "companies", label: "Companies", value: 2.27, color: "red", colorIndex: 5 },
    { id: "other", label: "Other", value: 1.14, color: "gray", colorIndex: 1 },
  ],
};

function nonnegative(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** An embedded storage metric with a category distribution and remaining capacity. */
export function StorageUsage({
  data,
  label = "Storage Usage",
  unit = "GB",
  locale = "en",
  formatters,
  className,
  ...props
}: StorageUsageProps) {
  const items = data.items.map((item) => ({ ...item, value: nonnegative(item.value), seriesColor: chartSeriesColor(item.id, item) }));
  const capacity = nonnegative(data.capacity);
  const used = items.reduce((total, item) => total + item.value, 0);
  const remaining = Math.max(0, capacity - used);
  const percentage = capacity > 0 ? used / capacity : used > 0 ? null : 0;
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const formatValue = formatters?.value ?? ((value: number) => numberFormat.format(value));
  const summary = formatters?.usageSummary?.(formatValue(used), formatValue(capacity), unit)
    ?? `${formatValue(used)} ${unit} used of ${formatValue(capacity)} ${unit}`;
  const remainingText = formatters?.remaining?.(formatValue(remaining), unit)
    ?? `${formatValue(remaining)} ${unit} remaining`;
  const percentageText = percentage === null ? "—" : new Intl.NumberFormat(locale, {
    style: "percent", maximumFractionDigits: 0,
  }).format(percentage);

  return (
    <MetricCard
      {...props}
      className={cn("w-full p-4", className)}
      description={summary}
      label={label}
      labelClassName={styles.metricTitle}
      layout="split"
      meta={remainingText}
      value={percentageText}
      valueClassName={styles.metricTitle}
      footer={
        <div className="grid min-w-0 gap-5" data-slot="storage-usage-content">
          <SegmentedBar
            mode="capacity"
            total={capacity}
            segments={items.map((item) => ({ ...item, color: item.seriesColor }))}
            valueText={`${summary}. ${remainingText}`}
            aria-label={label}
            data-slot="storage-usage-bar"
            segmentSlot="storage-usage-segment"
            remainderSlot="storage-usage-remaining"
          />
          {items.length > 0 && (
            <ChartLegend className="flex flex-wrap gap-x-4 gap-y-2" data-slot="storage-usage-legend" items={items.map((item) => ({ ...item, color: item.seriesColor, value: `${formatValue(item.value)} ${unit}` }))} />
          )}
        </div>
      }
    />
  );
}
