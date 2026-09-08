import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/availability-monitor-01/availability-monitor.tsx",
  ),
  "utf8",
);
const blockIndex = readFileSync(
  join(ROOT, "packages/blocks/src/application/availability-monitor-01/index.ts"),
  "utf8",
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"),
);

describe("AvailabilityMonitor contract", () => {
  it("is exported and declares its complete install contract", () => {
    expect(blockIndex).toContain("AvailabilityMonitor");
    expect(blockIndex).toContain("AvailabilityTimelineMarker");

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "availability-monitor-01",
    );

    expect(item).toMatchObject({
      dependencies: ["recharts", "tw-animate-css"],
      registryDependencies: [
        "button",
        "card",
        "chart",
        "container",
        "metric-card",
        "status-overview",
        "utils",
      ],
    });
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

  it("uses Zeron primitives and the shadcn chart wrapper for the responsive composition", () => {
    expect(source).toContain('from "@zeron/ui/container"');
    expect(source).toContain('from "@zeron/ui/metric-card"');
    expect(source).toContain('from "@zeron/ui/card"');
    expect(source).toContain('from "@zeron/ui/status-overview"');
    expect(source).toContain("<ChartContainer");
    expect(source).toContain("domain={[75, 100]}");
    expect(source).toContain("ticks={[75, 82, 89, 96, 100]}");
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("aria-pressed={visible}");
    expect(source).toContain("contained = true");
    expect(source).toContain("{contained ? (");
  });

  it("models the reference incident window in the 72-hour strip", () => {
    expect(source).toContain("new Set([22, 26, 27, 32])");
    expect(source).toContain('{ at: 0, label: "Sat" }');
    expect(source).toContain('{ at: 72, label: "Now" }');
  });
});
