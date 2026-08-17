import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/separator.tsx"),
  "utf8"
);
const dataGridPrimitives = readFileSync(
  join(ROOT, "packages/ui/src/components/data-grid/data-grid-primitives.tsx"),
  "utf8"
);
const dataGridShortcuts = readFileSync(
  join(
    ROOT,
    "packages/ui/src/components/data-grid/data-grid-keyboard-shortcuts.tsx"
  ),
  "utf8"
);

describe("Separator contract", () => {
  it("uses Base UI for accessible separator semantics", () => {
    expect(source).toContain('@base-ui/react/separator');
    expect(source).toContain('orientation = "horizontal"');
    expect(source).toContain('data-slot="separator"');
  });

  it("matches the Figma gutter and centered one-pixel rule", () => {
    expect(source).toContain("h-2 w-full after:h-px after:w-full");
    expect(source).toContain("w-2 self-stretch after:h-full after:w-px");
    expect(source).toContain("after:bg-border");
  });

  it("is the shared separator used by Data Grid", () => {
    expect(dataGridPrimitives).not.toContain("SeparatorPrimitive");
    expect(dataGridShortcuts).toContain(
      'import { Separator } from "../separator"'
    );
  });

  it("does not hard-code visual colors", () => {
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/\b(?:rgb|hsl|oklch)\(/i);
  });
});
