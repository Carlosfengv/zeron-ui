import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const sourceRoots = ["app", "docs", "packages/ui/src", "packages/blocks/src", "scripts"];

function sourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(join(ROOT, directory), { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...sourceFiles(path));
    else if (/\.(?:[cm]?[jt]sx?|css)$/.test(entry.name)) files.push(path);
  }
  return files;
}

const sources = sourceRoots
  .flatMap(sourceFiles)
  .map((path) => [path, readFileSync(join(ROOT, path), "utf8")]);

describe("Tailwind native radius contract", () => {
  it("does not retain the runtime shape system", () => {
    for (const [path, source] of sources) {
      expect(source, path).not.toMatch(/(?:ShapeProvider|useShapeContext|useShape\(|shapeMap|ShapeVariant)/);
      expect(source, path).not.toMatch(/(?:system\/shape-context|system\/design-tokens)/);
      expect(source, path).not.toMatch(/--(?:control|focus|selection|container|full)-radius|--shape-input-radius/);
    }
  });

  it("uses Tailwind's native rounded scale instead of semantic radius aliases", () => {
    for (const [path, source] of sources) {
      expect(source, path).not.toMatch(/rounded-(?:control|focus|selection|container)/);
      expect(source, path).not.toMatch(/rounded-\[(?:8|10|12|16|20|22|24)px\]/);
    }
  });

  it("measures native rendered radii for merge and split motion", () => {
    const proximity = readFileSync(join(ROOT, "packages/ui/src/hooks/use-proximity-hover.ts"), "utf8");
    const mergeSplit = readFileSync(join(ROOT, "packages/ui/src/hooks/use-merge-split.tsx"), "utf8");

    expect(proximity).toContain("getComputedStyle(element).borderTopLeftRadius");
    expect(proximity).toContain('"zeron:radius-change"');
    expect(mergeSplit).toContain("radius: s.radius");
    expect(mergeSplit).not.toMatch(/useMergeSplitBlocks\([^)]*,[^)]*,/);
  });

  it("does not publish removed shape files or registry dependencies", () => {
    const pkg = readFileSync(join(ROOT, "packages/ui/package.json"), "utf8");
    const registry = readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8");

    expect(pkg).not.toContain("shape-context");
    expect(pkg).not.toContain("design-tokens");
    expect(registry).not.toContain("shape-context");
    expect(registry).not.toContain("design-tokens");
    expect(existsSync(join(ROOT, "public/r/shape-context.json"))).toBe(false);
    const surfaces = readFileSync(join(ROOT, "public/r/surfaces.json"), "utf8");
    expect(surfaces).not.toMatch(/radius-(?:control|focus|selection|container|full)/);
    expect(surfaces).not.toMatch(/--(?:control|focus|selection|container|full)-radius/);
  });
});
