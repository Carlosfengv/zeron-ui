import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "packages/ui/src/components/breadcrumb.tsx"),
  "utf8"
);

describe("BreadcrumbPage rendering contract", () => {
  it("renders an optional icon before its child label in the standard current-page branch", () => {
    expect(source).toContain("{iconSlot}\n      <span className=\"truncate\">{children}</span>");
  });

  it("renders an optional 20px rounded icon before the resource-switcher label", () => {
    expect(source).toContain('data-slot="breadcrumb-page-icon"');
    expect(source).toContain("size-5");
    expect(source).toContain("rounded");
    expect(source).toContain("{iconSlot}\n              <span className=\"truncate\">{label}</span>");
  });
});
