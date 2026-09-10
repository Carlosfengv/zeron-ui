import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/credit-usage-01/credit-usage.tsx",
  ),
  "utf8",
);
const types = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/credit-usage-01/credit-usage-types.ts",
  ),
  "utf8",
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8"),
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"),
);
const capabilities = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/block-capabilities.json"), "utf8"),
);

describe("Credit Usage 01 contract", () => {
  it("is exported and registered as a React data block", () => {
    expect(packageJson.exports["./credit-usage-01"]).toBe(
      "./src/application/credit-usage-01/index.ts",
    );
    expect(capabilities["credit-usage-01"]).toEqual({
      framework: "react",
      kind: "data-block",
    });

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "credit-usage-01",
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: ["@lobehub/icons", "tw-animate-css"],
      registryDependencies: [
        "badge",
        "button",
        "card",
        "icon-context",
        "inline-notice",
        "switch",
        "tabs",
        "utils",
      ],
    });
    expect(item.files).toHaveLength(4);
  });

  it("composes existing Zeron components around a small block-owned chart", () => {
    for (const component of ["Badge", "Button", "Card", "InlineNotice", "Switch", "Tabs"]) {
      expect(source).toContain(component);
    }
    expect(source).toContain('role="progressbar"');
    expect(source).toContain('className="flex h-7 w-full overflow-hidden');
    expect(source).toContain("max-w-[520px]");
    expect(source).not.toContain("sm:grid-cols-2");
    expect(source).not.toContain("splitRows");
    expect(source).toContain("badgeColors[model.color]");
    expect(source).toContain("modelProviderLogos[model.provider]");
    expect(source).not.toMatch(/\b(?:px|py)-5\b/);
    expect(source).not.toMatch(/\bsm:(?:px|py)-6\b/);
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(source).not.toContain("<AppShell");
  });

  it("keeps billing mutations and routing caller-owned", () => {
    expect(types).toContain("onCycleChange?:");
    expect(types).toContain("onAutoSwitchChange?:");
    expect(types).toContain("onSetLimit?:");
    expect(types).toContain("onUpgrade?:");
    expect(types).toContain("CreditUsageFormatters");
    expect(types).toContain("formatters?: CreditUsageFormatters");
    expect(source).toContain("actions?.onCycleChange?.");
    expect(source).toContain("actions?.onAutoSwitchChange?.");
  });
});
