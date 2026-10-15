"use client";

import { useLocale } from "next-intl";
import { ChartLegend } from "@zeron/ui/chart-primitives";
import { HeatmapMatrix, CHART_SCALE_VARS } from "@zeron/ui/heatmap-chart";

const start = Date.UTC(2026, 8, 15);
const rhythm = [0, 0, 0, 0, 0, 0, .1, .4, .75, 1, 1, .9, .8, .9, .8, .7, .6, .3, 0, .1, .4, .5, .2, 0];
const data = Array.from({ length: 30 }, (_, column) => ({ bin: column, bins: Array.from({ length: 24 }, (_, row) => {
  const date = new Date(start + column * 86_400_000 + row * 3_600_000);
  const weekend = [0, 6].includes(date.getUTCDay());
  return { bin: row, date, count: column === 29 && row > 9 ? NaN : Math.round(rhythm[row] * (weekend ? 3 : 8) * (.75 + ((column + row) % 4) / 12)) };
}) }));
const points = [{ column: 6, row: 12, label: "Limit reached" }, { column: 17, row: 14, label: "Limit reached" }];

export function HeatmapMatrixDemo() {
  const locale = useLocale();
  const chinese = locale === "zh-CN";
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  return <div className="min-w-0 w-full space-y-5">
    <HeatmapMatrix ariaLabel={chinese ? "每小时资源活跃度" : "Hourly resource activity"} data={data} height={320} minWidth={640}
      columns={data.map((column, index) => ({ id: String(index), label: weekday.format(column.bins[0].date),
        groupLabel: index % 7 === 0 ? date.format(column.bins[0].date) : undefined, weekend: [0, 6].includes(column.bins[0].date.getUTCDay()), locked: [6, 7, 17].includes(index) ? 1 : 0 }))}
      rowLabels={Array.from({ length: 24 }, (_, hour) => hour % 6 === 0 ? `${String(hour).padStart(2, "0")}:00` : "")}
      points={points} lockedLabel={chinese ? "锁定" : "Locked"} formatHeader={(_, at) => date.format(at)}
      formatLabel={(count, at) => `${String(at.getUTCHours()).padStart(2, "0")}:00 · ${count} ${chinese ? "活跃资源" : "active resources"}`} />
    <ChartLegend className="flex flex-wrap gap-4 text-body" items={CHART_SCALE_VARS.map((color, index) => ({ id: String(index), color, label: ["0", "1–2", "3–4", "5–6", "7+"][index] }))} />
  </div>;
}

export const heatmapMatrixCode = `import { HeatmapMatrix } from "@/components/ui/heatmap-chart";

const start = Date.UTC(2026, 9, 1);
const data = Array.from({ length: 14 }, (_, column) => ({
  bin: column,
  bins: Array.from({ length: 24 }, (_, row) => ({
    bin: row, date: new Date(start + column * 86400000 + row * 3600000),
    count: row >= 8 && row < 17 ? (column + row) % 9 : 0,
  })),
}));

export default function Example() {
  return <HeatmapMatrix ariaLabel="Hourly activity" data={data}
    columns={data.map((column, index) => ({
      id: String(index), label: column.bins[0].date.getUTCDate(),
    }))}
    rowLabels={Array.from({ length: 24 }, (_, hour) => hour % 6 === 0 ? hour + ":00" : "")}
    points={[{ column: 3, row: 12, label: "Limit reached" }]}
    height={320} max={8} minWidth={640} />;
}`;
