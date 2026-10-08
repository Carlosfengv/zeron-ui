"use client";
import { useMemo } from "react";
import { rawChartValue } from "./chart-data";
export function ChartSourceData({ data }: { data: readonly unknown[] }) {
  return useMemo(() => <div className="sr-only" data-slot="chart-source-data">{data.map((row, index) => <p key={index}>{row && typeof row === "object" ? Object.entries(row).map(([key, value]) => `${key}: ${rawChartValue(value)}`).join(", ") : rawChartValue(row)}</p>)}</div>, [data]);
}
