import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;

describe("rule-flow-editor-01 contract", () => {
  it("publishes a React data block with its complete source closure", () => {
    const packageJson = JSON.parse(readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8"));
    const capabilities = JSON.parse(readFileSync(join(ROOT, "packages/blocks/block-capabilities.json"), "utf8"));
    const registry = JSON.parse(readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "rule-flow-editor-01");

    expect(packageJson.exports["./rule-flow-editor-01"]).toBe("./src/application/rule-flow-editor-01/index.ts");
    expect(capabilities["rule-flow-editor-01"]).toEqual({ framework: "react", kind: "data-block" });
    expect(item).toMatchObject({
      type: "registry:block",
      registryDependencies: expect.arrayContaining(["badge", "button", "card", "icon-context", "input", "select", "sortable-collection", "utils"]),
    });
    expect(item.files.map((file: { target: string }) => file.target)).toEqual([
      "components/blocks/rule-flow-editor-01/rule-flow-types.ts",
      "components/blocks/rule-flow-editor-01/rule-flow-editor.tsx",
      "components/blocks/rule-flow-editor-01/index.ts",
    ]);
  });

  it("uses Zeron components and semantic tokens instead of the attachment palette", () => {
    const source = readFileSync(
      join(ROOT, "packages/blocks/src/application/rule-flow-editor-01/rule-flow-editor.tsx"),
      "utf8",
    );
    const publicEntry = readFileSync(
      join(ROOT, "packages/blocks/src/application/rule-flow-editor-01/index.ts"),
      "utf8",
    );

    expect(source).toContain('from "@zeron/ui/card"');
    expect(source).toContain('from "@zeron/ui/select"');
    expect(source).toContain('from "@zeron/ui/system/icon-context"');
    expect(source).toContain("bg-surface-base");
    expect(source).toContain("text-fg-muted");
    expect(source).not.toContain(
      "[&_[data-slot=sortable-collection-item]",
    );
    expect(source).not.toMatch(/--(?:page|ink|line-strong|accent)|bg-page|text-ink|shadow-card|shadow-btn/);
    expect(publicEntry).toContain("RuleFlowActionField");
    expect(publicEntry).toContain("RuleFlowActionPhase");
  });
});
