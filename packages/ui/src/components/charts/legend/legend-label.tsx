"use client";

import { cn } from "#system/utils";
import { useLegendItem } from "./legend-context";

export interface LegendLabelProps {
  /** Label class name. Default: "text-body font-medium" */
  className?: string;
}

export function LegendLabel({
  className = "text-body font-medium",
}: LegendLabelProps) {
  const { item } = useLegendItem();

  return (
    <span className={cn("min-w-0 break-words text-fg-default", className)}>
      {item.label}
    </span>
  );
}

LegendLabel.displayName = "LegendLabel";
