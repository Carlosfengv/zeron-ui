import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/metric-card.tsx"),
  "utf8"
);
const packageJson = JSON.parse(readFileSync(join(ROOT, "packages/ui/package.json"), "utf8"));
const registry = JSON.parse(readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8"));

describe("MetricCard contract", () => {
  it("is publicly exported and installable from the registry", () => {
    expect(packageJson.exports["./metric-card"]).toBe("./src/components/metric-card.tsx");

    const item = registry.items.find((entry: { name: string }) => entry.name === "metric-card");
    expect(item).toMatchObject({
      type: "registry:ui",
      files: [
        {
          path: "packages/ui/src/components/metric-card.tsx",
          target: "components/ui/metric-card.tsx",
        },
      ],
    });
  });

  it("uses the project surface, boundary, typography, and state tokens", () => {
    expect(source).toContain("rounded-xl border-[0.5px] border-border bg-surface-floating p-3");
    expect(source).toContain("text-body text-fg-muted");
    expect(source).toContain("text-heading font-semibold tabular-nums");
    expect(source).toContain("text-fg-success");
    expect(source).toContain("text-fg-warning");
    expect(source).toContain("text-fg-danger");
    expect(source).toContain("hover:bg-hover");
    expect(source).toContain("focus-visible:ring-1 focus-visible:ring-focus-ring");
  });

  it("has no fixed or inherited minimum card height", () => {
    expect(source).toContain("flex h-auto min-h-0 self-start min-w-0 flex-col");
    expect(source).not.toContain("min-h-[60px]");
  });

  it("supports all documented content modes and accessible whole-card interaction", () => {
    expect(source).toContain('type: "none"');
    expect(source).toContain('type: "breakdown"');
    expect(source).toContain('type: "visualization"');
    expect(source).toContain("interactive?: boolean");
    expect(source).toContain('role="list"');
    expect(source).toContain('role="img"');
    expect(source).toContain("aria-label={visualLabel}");
    expect(source).toContain("aria-label={actionLabel ?? label}");
    expect(source).toContain("aria-busy={loading || undefined}");
  });

  it("renders inspectable line and bar charts rather than decorative sparklines", () => {
    expect(source).toContain('chart: "line" | "area" | "bar"');
    expect(source).toContain("type MetricChartDatum");
    expect(source).toContain("chartMargin");
    expect(source).toContain("const minimumChartDataPoints = 24");
    expect(source).toContain('data-slot="metric-card-chart-insufficient"');
    expect(source).toContain("overflow-hidden text-fg-brand");
    expect(source).not.toContain("text-border-subtle");
    expect(source).toContain("onPointerMove={updateActivePoint}");
    expect(source).toContain('"ArrowLeft", "ArrowRight", "Home", "End"');
    expect(source).toContain('data-slot="metric-card-chart-tooltip"');
    expect(source).toContain('chart === "bar"');
    expect(source).toContain('data-slot="metric-card-chart-area"');
    expect(source).toContain('fillOpacity={chart === "line" ? 0.1 : 0.16}');
    expect(source).toContain('baseline: chart === "line" ? chartHeight : y(0)');
  });
});
