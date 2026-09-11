import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(join(ROOT, "packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview.tsx"), "utf8");
const charts = readFileSync(join(ROOT, "packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-charts.tsx"), "utf8");
const dataAdapter = readFileSync(join(ROOT, "packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-data.ts"), "utf8");
const types = readFileSync(join(ROOT, "packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-types.ts"), "utf8");
const blockIndex = readFileSync(join(ROOT, "packages/blocks/src/application/ai-gateway-overview-01/index.ts"), "utf8");
const workspaceSidebar = readFileSync(join(ROOT, "packages/blocks/src/application/ai-gateway-workspace-sidebar.tsx"), "utf8");
const workspaceTypes = readFileSync(join(ROOT, "packages/blocks/src/application/ai-gateway-workspace-types.ts"), "utf8");
const registry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"));
const capabilities = JSON.parse(readFileSync(join(ROOT, "packages/blocks/block-capabilities.json"), "utf8"));

describe("AiGatewayOverview contract", () => {
  it("publishes a complete React data-block installation", () => {
    const item = registry.items.find((entry: { name: string }) => entry.name === "ai-gateway-overview-01");

    expect(capabilities["ai-gateway-overview-01"]).toEqual({ framework: "react", kind: "data-block" });
    expect(item).toMatchObject({
      dependencies: ["recharts", "tw-animate-css"],
      registryDependencies: ["badge", "button", "card", "chart", "container", "empty", "icon-context", "inline-notice", "metric-card", "nav-item", "nav-menu", "page-layout", "sidebar", "sidebar-identity-row", "skeleton", "tabs", "utils"],
    });
    expect(item.files).toHaveLength(8);
    expect(blockIndex).toContain("AiGatewayOverview");
    expect(blockIndex).toContain("createAiGatewayOverviewDemoData");
    expect(blockIndex).toContain("parseAiGatewayOverviewData");
    expect(dataAdapter).toContain("isAiGatewayOverviewData");
  });

  it("uses Zeron primitives and the shared shadcn chart wrapper", () => {
    expect(source).toContain('from "@zeron/ui/page-layout"');
    expect(source).toContain('from "@zeron/ui/metric-card"');
    expect(source).toContain('from "@zeron/ui/card"');
    expect(source).toContain('from "@zeron/ui/container"');
    expect(source.match(/<ContainerHeader className="py-1\.5">/g)).toHaveLength(4);
    expect(source.match(/<ContainerBody>/g)).toHaveLength(4);
    expect(workspaceSidebar).toContain('from "@zeron/ui/nav-item"');
    expect(workspaceSidebar).toContain('from "@zeron/ui/nav-menu"');
    expect(source).toContain('from "@zeron/ui/sidebar"');
    expect(source).toContain('from "@zeron/ui/tabs"');
    expect(source).toContain('availableRanges = ["1d", "7d", "30d", "90d"]');
    expect(source).toContain('variant="pill"');
    expect(source).not.toContain('variant="segment"');
    expect(charts).toContain('from "@zeron/ui/chart"');
    expect(charts).toContain("<ChartContainer");
    expect(charts).toContain("accessibilityLayer");
    const metricSeriesChart = charts.slice(
      charts.indexOf("export function MetricSeriesChart"),
      charts.indexOf("function latencyBucketLabel"),
    );
    expect(metricSeriesChart).toContain('dataKey="timestamp"');
    expect(metricSeriesChart).toContain("tickFormatter={formatValue}");
    expect(metricSeriesChart).not.toContain(" hide ");
    expect(source).toContain("return sidebarConfig ? (");
    expect(source).toContain('<SidebarProvider breakpointBehavior="drawer">');
    expect(workspaceSidebar).toContain('width="280px"');
    expect(source).toContain("<PageLayout");
    expect(source).toContain(
      '<PageContent className="overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl">',
    );
    expect(source).toContain(
      '<PageBody className="max-w-[1620px] flex-none overflow-visible overscroll-auto',
    );
    expect(source).toContain('<div className="grid gap-4 pb-20" id="overview">');
    expect(source).toContain('<RefreshIcon aria-hidden />');
    expect(source).toContain('sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]');
    expect(source).toContain('contentClassName="px-2 pt-2"');
    expect(source).toContain('className="grid min-w-0 gap-2 lg:grid-cols-2 xl:grid-cols-3"');
    expect(source).toContain('labelClassName="text-label font-medium"');
    expect(source).toContain("leading={");
    expect(source).not.toContain("[&_[data-slot=metric-card-label]]");
    expect(charts).not.toContain('label: "Requests"');
    expect(charts).not.toContain('label: "Cost"');
    expect(charts).not.toContain('label: "Error rate"');
    expect(`${source}\n${charts}`).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it("keeps business data and interactions caller-owned", () => {
    expect(types).toContain("data: AiGatewayOverviewData | null");
    expect(types).toContain("range: AiGatewayOverviewRange");
    expect(types).toContain('"1d" | "7d" | "30d" | "90d"');
    expect(types).toContain("costMicros: number");
    expect(types).toContain("p95LatencyMs: number | null");
    expect(types).toContain("onRangeChange?:");
    expect(types).toContain("onRefresh?:");
    expect(types).toContain("onProviderSelect?:");
    expect(workspaceTypes).toContain("onNavigationSelect?:");
    expect(workspaceTypes).toContain("event: MouseEvent<HTMLAnchorElement>");
    expect(types).toContain("sidebar?: AiGatewaySidebarOptions | false");
    expect(source).toContain('status === "refreshing"');
    expect(source).toContain('status === "error"');
  });
});
