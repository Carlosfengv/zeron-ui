import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const sourcePath = join(
  ROOT,
  "packages/blocks/src/application/resource-metric-list-01/resource-metric-list.tsx"
);
const source = readFileSync(sourcePath, "utf8");
const packageJson = JSON.parse(readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8"));
const registry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"));

describe("Resource Metric List 1 block contract", () => {
  it("is publicly exported and installable with every Figma asset", () => {
    expect(packageJson.exports["./resource-metric-list-01"]).toBe(
      "./src/application/resource-metric-list-01/index.ts"
    );

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "resource-metric-list-01"
    );
    expect(item).toMatchObject({
      type: "registry:block",
      registryDependencies: ["detail-list", "utils"],
    });
    expect(item.files).toHaveLength(8);
    for (const name of ["platform", "cluster", "host", "vm", "network", "storage"]) {
      expect(
        existsSync(
          join(
            ROOT,
            `packages/blocks/src/application/resource-metric-list-01/assets/${name}.svg`
          )
        )
      ).toBe(true);
    }
  });

  it("matches the Figma dimensions, hierarchy, and semantic colors", () => {
    expect(source).toContain("max-w-[700px]");
    expect(source).toContain("min-h-10");
    expect(source).toContain("w-40");
    expect(source).toContain("h-3");
    expect(source).toContain("<DetailList");
    expect(source).toContain("<DetailListItem");
    expect(source).toContain("<DetailListLabel");
    expect(source).toContain("<DetailListValue");
    expect(source).toContain('className={cn(\n        "w-full max-w-[700px] gap-0 p-0 py-[3.5px]"');
    expect(source).toContain('brand: "bg-brand"');
    expect(source).toContain('warning: "bg-warning"');
    expect(source).toContain('danger: "bg-destructive"');
    expect(source).toContain('neutral: "bg-neutral"');
  });

  it("keeps the six designed resources while allowing inventory data replacement", () => {
    expect(source).toContain("items?: readonly ResourceMetricItem[]");
    expect(source).toContain('label: "平台层级资源"');
    expect(source).toContain('label: "集群"');
    expect(source).toContain('label: "宿主机"');
    expect(source).toContain('label: "云主机"');
    expect(source).toContain('label: "网络资源"');
    expect(source).toContain('label: "存储资源"');
  });

  it("exposes list and status distributions to assistive technology", () => {
    expect(source).toContain('aria-label={ariaLabel}');
    expect(source).toContain('role="img"');
    expect(source).toContain("statusLabel");
    expect(source).toContain("tabular-nums");
  });
});
