export const chartTypes = [
  { kind: "line", slug: "line-chart", name: "LineChart", sourceHref: "/docs/blocks/support-analytics-01" },
  { kind: "area", slug: "area-chart", name: "AreaChart", sourceHref: "/docs/blocks/ai-gateway-overview-01" },
  { kind: "bar", slug: "bar-chart", name: "BarChart", sourceHref: "/docs/blocks/support-analytics-01" },
  { kind: "pie", slug: "pie-chart", name: "PieChart", sourceHref: "/docs/components/chart" },
  { kind: "donut", slug: "donut-chart", name: "DonutChart", sourceHref: "/docs/blocks/project-monitor-01" },
] as const;

export type ChartType = (typeof chartTypes)[number]["kind"];
