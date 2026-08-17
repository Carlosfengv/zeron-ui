import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(join(ROOT, "packages/blocks/src/application/cluster-environment-detail-01/cluster-environment-detail.tsx"), "utf8");
const packageJson = JSON.parse(readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8"));
const registry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"));

describe("Cluster Environment Detail 1 block contract", () => {
  it("is publicly exported and installable with both composed resource blocks", () => {
    expect(packageJson.exports["./cluster-environment-detail-01"]).toBe("./src/application/cluster-environment-detail-01/index.ts");
    const item = registry.items.find((entry: { name: string }) => entry.name === "cluster-environment-detail-01");
    expect(item).toMatchObject({ type: "registry:block", registryDependencies: expect.arrayContaining(["resource-metric-list-01", "resource-status-all-01"]) });
  });

  it("composes the required blocks and existing project primitives", () => {
    expect(source).toContain('from "@zeron/blocks/resource-metric-list-01"');
    expect(source).toContain('from "@zeron/blocks/resource-status-all-01"');
    expect(source).toContain("<ResourceMetricList");
    expect(source).toContain("<ResourceStatusAll");
    expect(source).toContain("<PageLayout");
    expect(source).toContain("<Tabs");
    expect(source).toContain("<MetricCard");
    expect(source).toContain("<DataTable");
    expect(source).toContain("<DataTableToolbar");
    expect(source).toContain("<Separator");
  });

  it("does not introduce local image assets or raw Figma colors", () => {
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(source).not.toContain("<img");
  });
});
