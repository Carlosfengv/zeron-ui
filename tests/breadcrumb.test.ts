import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "packages/ui/src/components/breadcrumb.tsx"),
  "utf8"
);

describe("BreadcrumbPage rendering contract", () => {
  it("renders its child label in the standard current-page branch", () => {
    expect(source).toContain("{children}\n    </span>");
  });

  it("renders the selected resource label in the resource-switcher branch", () => {
    expect(source).toContain('<span className="truncate">{label}</span>');
  });
});
