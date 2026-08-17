import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const pageLayout = readFileSync(
  join(ROOT, "packages/ui/src/components/page-layout.tsx"),
  "utf8"
);

describe("PageLayout columns contract", () => {
  it("exports the structural two-column primitives without creating a main landmark", () => {
    expect(pageLayout).toContain("export interface PageColumnsProps");
    expect(pageLayout).toContain("const PageColumns = forwardRef");
    expect(pageLayout).toContain('data-slot="page-columns"');
    expect(pageLayout).toContain('data-slot="page-primary"');
    expect(pageLayout).toContain('data-slot="page-aside"');
    expect(pageLayout).toContain("PageColumns,");
    expect(pageLayout).toContain("PagePrimary,");
    expect(pageLayout).toContain("PageAside,");
  });

  it("keeps DOM order collapsed while pinning primary left and aside right at each supported breakpoint", () => {
    expect(pageLayout).toContain('lg:[&:has(>_[data-slot=page-aside])]:grid-cols-[minmax(0,1fr)_var(--page-aside-width)]');
    expect(pageLayout).toContain('lg:[&:has(>_[data-slot=page-aside])>_[data-slot=page-primary]]:col-start-1');
    expect(pageLayout).toContain('lg:[&:has(>_[data-slot=page-aside])>_[data-slot=page-aside]]:col-start-2');
    expect(pageLayout).toContain('xl:[&:has(>_[data-slot=page-aside])]:grid-cols-[minmax(0,1fr)_var(--page-aside-width)]');
    expect(pageLayout).toContain('xl:[&:has(>_[data-slot=page-aside])>_[data-slot=page-primary]]:col-start-1');
    expect(pageLayout).toContain('xl:[&:has(>_[data-slot=page-aside])>_[data-slot=page-aside]]:col-start-2');
    expect(pageLayout).not.toContain('data-slot="page-aside" className={cn("min-w-0 order-');
  });

  it("uses a local width variable and normalizes numeric widths", () => {
    expect(pageLayout).toContain('"--page-aside-width": toCssDimension(asideWidth)');
    expect(pageLayout).toContain('typeof value === "number" ? `${value}px` : value');
    expect(pageLayout).toContain('"grid min-w-0 grid-cols-1 items-start gap-5"');
  });
});
