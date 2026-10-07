"use client";

import { cn } from "#system/utils";
import { intFmt } from "../chart-formatters";
import { useLegendItem } from "./legend-context";

export interface LegendValueProps {
  /** Value class name. Default: "text-body tabular-nums" */
  className?: string;
  /** Show percentage alongside value. Default: false */
  showPercentage?: boolean;
  /** Percentage class name. Default: "text-label tabular-nums" */
  percentageClassName?: string;
  /** Format function for the value. Default: toLocaleString() */
  formatValue?: (value: number) => string;
  /** Format function for percentage. Default: (p) => `${p.toFixed(0)}%` */
  formatPercentage?: (percentage: number) => string;
}

export function LegendValue({
  className = "text-body tabular-nums",
  showPercentage = false,
  percentageClassName = "text-label tabular-nums",
  formatValue = intFmt,
  formatPercentage = (p) => `${p.toFixed(0)}%`,
}: LegendValueProps) {
  const { item, percentage } = useLegendItem();

  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-2 break-words text-fg-muted",
        className
      )}
    >
      <span className="min-w-0">{formatValue(item.value)}</span>
      {showPercentage && item.maxValue && (
        <span className={percentageClassName}>
          {formatPercentage(percentage)}
        </span>
      )}
    </span>
  );
}

LegendValue.displayName = "LegendValue";
