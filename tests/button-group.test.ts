import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/button-group.tsx"),
  "utf8"
);
const buttonSource = readFileSync(
  join(ROOT, "packages/ui/src/components/button.tsx"),
  "utf8"
);

describe("ButtonGroup contract", () => {
  it("groups independent actions without inventing selection semantics", () => {
    expect(source).toContain('role = "group"');
    expect(source).toContain('data-slot="button-group"');
    expect(source).not.toContain('role="tablist"');
    expect(source).not.toContain('role="radiogroup"');
  });

  it("supports connected horizontal and vertical layouts", () => {
    expect(source).toContain('orientation: "horizontal"');
    expect(source).toContain('horizontal: [');
    expect(source).toContain('vertical: [');
    expect(source).toContain("rounded-l-none");
    expect(source).toContain("rounded-t-none");
    expect(source).toContain(
      ">[data-slot=button-background]]:border-l-0"
    );
    expect(source).toContain(
      ">[data-slot=button-background]]:border-t-0"
    );
    expect(buttonSource).toContain('data-slot="button-background"');
    expect(source).toContain("focus-visible]:z-control");
  });

  it("exports composable text and separator helpers", () => {
    expect(source).toContain('data-slot="button-group-text"');
    expect(source).toContain('data-slot="button-group-separator"');
    expect(source).toContain('role="separator"');
    expect(source).toContain("ButtonGroupSeparatorProps");
    expect(source).toContain("ButtonGroupTextProps");
  });

  it("uses project semantic tokens instead of hard-coded visual values", () => {
    expect(source).toContain("border-border");
    expect(source).toContain("bg-muted");
    expect(source).toContain("text-fg-muted");
    expect(source).toContain("shadow-control");
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/\b(?:rgb|hsl|oklch)\(/i);
  });
});
