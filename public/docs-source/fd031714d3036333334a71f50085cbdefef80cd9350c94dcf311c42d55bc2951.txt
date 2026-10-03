"use client";

import type { ComponentPropsWithoutRef } from "react";
import { badgeColors, type BadgeColor } from "@zeron/ui/badge";
import { MetricCard } from "@zeron/ui/metric-card";
import { cn } from "@zeron/ui/system/utils";
import styles from "./storage-usage.module.css";

export interface StorageUsageItem {
  id: string;
  label: string;
  /** Use the same unit as capacity. */
  value: number;
  color: BadgeColor;
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
    { id: "contacts", label: "Contacts", value: 5.27, color: "indigo" },
    { id: "tasks", label: "Tasks", value: 4.16, color: "cyan" },
    { id: "deals", label: "Deals", value: 3.33, color: "green" },
    { id: "emails", label: "Emails", value: 2.63, color: "yellow" },
    { id: "companies", label: "Companies", value: 2.27, color: "red" },
    { id: "other", label: "Other", value: 1.14, color: "gray" },
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
  const items = data.items.map((item) => ({ ...item, value: nonnegative(item.value) }));
  const capacity = nonnegative(data.capacity);
  const used = items.reduce((total, item) => total + item.value, 0);
  const remaining = Math.max(0, capacity - used);
  const denominator = Math.max(capacity, used, 1);
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
          <div
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={denominator}
            aria-valuenow={used}
            aria-valuetext={`${summary}. ${remainingText}`}
            className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
            data-slot="storage-usage-bar"
            role="progressbar"
          >
            {items.map((item) => (
              <span
                aria-hidden="true"
                className="h-full min-w-0"
                data-slot="storage-usage-segment"
                key={item.id}
                style={{ backgroundColor: badgeColors[item.color], flexBasis: 0, flexGrow: item.value / denominator }}
              />
            ))}
            {remaining > 0 && (
              <span aria-hidden="true" className="h-full min-w-0 bg-muted" data-slot="storage-usage-remaining" style={{ flexBasis: 0, flexGrow: remaining / denominator }} />
            )}
          </div>
          {items.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0 text-label" data-slot="storage-usage-legend">
              {items.map((item) => (
                <li className="flex min-w-0 max-w-full items-start gap-1.5" key={item.id}>
                  <span aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 rounded-sm" style={{ backgroundColor: badgeColors[item.color] }} />
                  <span className="min-w-0 break-words text-fg-muted">{item.label}: <span className="tabular-nums text-fg-default">{formatValue(item.value)} {unit}</span></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      }
    />
  );
}
