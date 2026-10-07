import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const sourcePath = join(
  ROOT,
  "packages/blocks/src/application/resource-status-all-01/resource-status-all.tsx"
);
const source = readFileSync(sourcePath, "utf8");
const packageJson = JSON.parse(readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8"));
const registry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"));

describe("Resource Status All 1 block contract", () => {
  it("is publicly exported and installable with its chart dependency", () => {
    expect(packageJson.exports["./resource-status-all-01"]).toBe(
      "./src/application/resource-status-all-01/index.ts"
    );

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "resource-status-all-01"
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: ["tw-animate-css", "recharts"],
      registryDependencies: ["card", "utils", "chart-primitives", "chart"],
    });
    expect(item.files).toHaveLength(2);
  });

  it("uses the designed hierarchy and shared chart tokens", () => {
    expect(source).toContain('<Card');
    expect(source).toContain('<CardContent');
    expect(source).toContain('import { DonutSummary } from "@zeron/ui/chart"');
    expect(source).toContain('<DonutSummary');
    expect(source).toContain('<ChartLegend');
    expect(source).toContain('max-w-[701px]');
    expect(source).toContain('max-w-48');
    expect(source).toContain('rounded-xl');
    expect(source).toContain('border-hairline border-border');
    expect(source).toContain('ChartLegend, chartColor');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps the Figma values while deriving the chart and coverage from data", () => {
    expect(source).toContain('label: "正常", value: 1390');
    expect(source).toContain('label: "告警", value: 73');
    expect(source).toContain('label: "严重", value: 10');
    expect(source).toContain('label: "未知", value: 28');
    expect(source).toContain('statuses?: readonly ResourceStatusItem[]');
    expect(source).toContain('countsTowardCoverage?: boolean');
    expect(source).toContain('total={total}');
    expect(source).toContain('coveragePercentage');
  });

  it("exposes the chart and detailed status values to assistive technology", () => {
    expect(source).toContain('aria-label={`${totalLabel}');
    expect(source).toContain('<ChartLegend');
    expect(source).toContain('label: status.label');
    expect(source).toContain('value: formatValue(status.value)');
    expect(source).toContain('aria-label={ariaLabel}');
    expect(source).toContain('tabular-nums');
  });
});
