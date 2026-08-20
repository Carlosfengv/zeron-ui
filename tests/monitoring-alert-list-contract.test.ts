import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(join(ROOT, "packages/blocks/src/application/monitoring-alert-list-01/monitoring-alert-list.tsx"), "utf8");
const registry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"));

describe("Monitoring Alert List 1 block contract", () => {
  it("provides resolution actions and resolution-record previews", () => {
    expect(source).toContain("MonitoringAlertResolutionAction");
    expect(source).toContain("ResolutionRecords");
    expect(source).toContain("resolutionRecords?: readonly MonitoringAlertResolutionRecord[]");
    expect(source).toContain('label="处置"');
    expect(source).toContain('label="不再提醒"');
  });

  it("declares the primitives required for resolution history", () => {
    const item = registry.items.find((entry: { name: string }) => entry.name === "monitoring-alert-list-01");
    expect(item).toMatchObject({ registryDependencies: expect.arrayContaining(["button-group", "popover"]) });
  });
});
