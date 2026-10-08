"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "#system/utils";
import { useHeatmap } from "./heatmap-context";
import { getHeatmapColumnMonthAnchor } from "./heatmap-utils";

export interface HeatmapXAxisProps {
  /** Additional class name for labels */
  className?: string;
}

const monthFmt = new Intl.DateTimeFormat("en-US", { month: "short" });

export const HeatmapXAxis = memo(function HeatmapXAxis({
  className,
}: HeatmapXAxisProps) {
  const { containerRef, data, margin, xScale, width } = useHeatmap();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const labels = useMemo(() => {
    const ticks: { label: string; x: number; key: string }[] = [];
    let lastMonthKey = "";

    for (let columnIndex = 0; columnIndex < data.length; columnIndex++) {
      const column = data[columnIndex];
      if (!column) {
        continue;
      }

      const monthAnchor = getHeatmapColumnMonthAnchor(column);
      if (!monthAnchor) {
        continue;
      }

      const monthKey = `${monthAnchor.getFullYear()}-${monthAnchor.getMonth()}`;
      if (monthKey === lastMonthKey) {
        continue;
      }

      ticks.push({
        label: monthFmt.format(monthAnchor),
        x: margin.left + xScale(columnIndex),
        key: monthKey,
      });
      lastMonthKey = monthKey;
    }

    // Keep the reference positions, thinning only labels that would overlap
    // at narrow widths. Three-letter month labels need about 32px at 12px.
    let previousX = -Infinity;
    return ticks.filter(tick => {
      if (tick.x - previousX < 32 || tick.x + 24 > width) return false;
      previousX = tick.x;
      return true;
    });
  }, [data, margin.left, xScale, width]);

  const container = containerRef.current;
  if (!(mounted && container)) {
    return null;
  }

  return createPortal(
    labels.map((tick) => (
      <div
        className="pointer-events-none absolute"
        key={tick.key}
        style={{
          top: 0,
          left: tick.x,
          width: 0,
          display: "flex",
          justifyContent: "flex-start",
        }}
      >
        <span
          className={cn(
            "whitespace-nowrap text-fg-subtle text-label",
            className
          )}
        >
          {tick.label}
        </span>
      </div>
    )),
    container
  );
});

HeatmapXAxis.displayName = "HeatmapXAxis";

export default HeatmapXAxis;
