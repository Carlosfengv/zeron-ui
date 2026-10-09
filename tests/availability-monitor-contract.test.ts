import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/model-detail-02/model-availability.tsx",
  ),
  "utf8",
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"),
);

describe("Model detail availability contract", () => {
  it("ships with the model page without a standalone block dependency", () => {
    expect(registry.items.some(
      (entry: { name: string }) => entry.name === "availability-monitor-01",
    )).toBe(false);
    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "model-detail-02",
    );

    expect(item).toMatchObject({
      dependencies: expect.arrayContaining(["@visx/curve@4.0.0", "tw-animate-css"]),
      registryDependencies: expect.arrayContaining([
        "button",
        "card",
        "line-chart",
        "chart-core",
        "container",
        "metric-card",
        "status-overview",
        "utils",
        "chart-primitives",
      ]),
      files: expect.arrayContaining([
        expect.objectContaining({
          path: "packages/blocks/src/application/model-detail-02/model-availability.tsx",
          target: "components/blocks/model-detail-02/model-availability.tsx",
        }),
      ]),
    });
    expect(item.registryDependencies).not.toContain("availability-monitor-01");
  });

  it("keeps the OpenRouter reference copy, values, and documentation destinations", () => {
    expect(source).toContain("availability = 99.3");
    expect(source).toContain("routedAvailability = 99.84");
    expect(source).toContain("directAvailability = 95.58");
    expect(source).toContain('rangeLabel = "Sep 5, 9 AM - Sep 8, 9 AM"');
    expect(source).toContain("Uptime is the percentage of the past 3 days");
    expect(source).toContain(
      "https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints",
    );
    expect(source).toContain("https://openrouter.ai/docs/provider-routing");
  });

  it("uses Zeron primitives and the current Zeron chart components for the responsive composition", () => {
    expect(source).toContain('from "@zeron/ui/container"');
    expect(source).toContain('from "@zeron/ui/metric-card"');
    expect(source).toContain('from "@zeron/ui/card"');
    expect(source).toContain('from "@zeron/ui/status-overview"');
    expect(source).toContain("<LineChart");
    expect(source).toContain("<ChartDataTable");
    expect(source).toContain("yDomain={[75, 100]}");
    expect(source).toContain("tickValues={[75, 82, 89, 96, 100]}");
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("pressed: visibleSeries[item.key]");
    expect(source).toContain("<ChartLegend");
    expect(source).toContain("contained = true");
    expect(source).toContain("{contained ? (");
  });

  it("models the reference incident window in the 72-hour strip", () => {
    expect(source).toContain("new Set([22, 26, 27, 32])");
    expect(source).toContain('{ at: 0, label: "Sat" }');
    expect(source).toContain('{ at: 72, label: "Now" }');
  });
});
