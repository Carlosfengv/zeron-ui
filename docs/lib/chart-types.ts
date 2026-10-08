export const chartTypes = [
  { kind: "line", slug: "line-chart", name: "LineChart", sourceHref: "/docs/components/line-chart" },
  { kind: "area", slug: "area-chart", name: "AreaChart", sourceHref: "/docs/components/area-chart" },
  { kind: "bar", slug: "bar-chart", name: "BarChart", sourceHref: "/docs/components/bar-chart" },
  { kind: "pie", slug: "pie-chart", name: "PieChart", sourceHref: "/docs/components/pie-chart" },
] as const;

export type ChartType = (typeof chartTypes)[number]["kind"];
