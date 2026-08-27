import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/status-overview.tsx"),
  "utf8",
);
const packageJson = JSON.parse(readFileSync(join(ROOT, "packages/ui/package.json"), "utf8"));
const registry = JSON.parse(readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8"));

describe("StatusOverview contract", () => {
  it("is publicly exported and installable from the registry", () => {
    expect(packageJson.exports["./status-overview"]).toBe("./src/components/status-overview.tsx");

    const item = registry.items.find((entry: { name: string }) => entry.name === "status-overview");
    expect(item).toMatchObject({
      type: "registry:ui",
      registryDependencies: ["surfaces", "tooltip", "utils"],
      files: [
        {
          path: "packages/ui/src/components/status-overview.tsx",
          target: "components/ui/status-overview.tsx",
        },
      ],
    });
  });

  it("uses the documented semantic colors, surface recipe, and empty-state texture", () => {
    expect(source).toContain("rounded-xl border-[0.5px] border-border bg-surface-floating p-3");
    expect(source).toContain("bg-success-border");
    expect(source).toContain("bg-warning-border");
    expect(source).toContain("bg-danger-border");
    expect(source).toContain("bg-info-border");
    expect(source).toContain("bg-neutral-status-border");
    expect(source).toContain("var(--neutral-status-border)");
    expect(source).toContain("text-fg-success");
    expect(source).toContain("text-fg-warning");
    expect(source).toContain("text-fg-danger");
  });

  it("keeps timeline and nodes as discriminated content while requiring state explanations", () => {
    expect(source).toContain('type: "timeline"');
    expect(source).toContain('type: "nodes"');
    expect(source).toContain("start: number;");
    expect(source).toContain("end: number;");
    expect(source).toContain("emptyContent: ReactNode;");
    expect(source).toContain('state: "stale" | "unavailable" | "error"');
    expect(source).toContain("statusMessage: ReactNode;");
    expect(source).toContain('"children" | "content"');
  });

  it("uses one active-descendant grid and one shared tooltip instead of per-segment targets", () => {
    expect(source).toContain('role="grid"');
    expect(source).toContain("aria-activedescendant={activeCellId}");
    expect(source).toContain('role="gridcell"');
    expect(source).toContain('data-slot="status-overview-active-anchor"');
    expect(source).toContain("pointer-events-none");
    expect(source).toContain("forceOpen={tooltipOpen}");
    expect(source).toContain("focus-visible:ring-inset focus-visible:ring-focus-ring");
  });
});
