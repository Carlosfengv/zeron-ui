import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const buttonSource = readFileSync(
  join(ROOT, "packages/ui/src/components/button.tsx"),
  "utf8"
);
const dataTableSource = readFileSync(
  join(ROOT, "packages/ui/src/components/data-table.tsx"),
  "utf8"
);
const exampleSource = readFileSync(
  join(ROOT, "docs/pages/components/data-table/data-table-examples.tsx"),
  "utf8"
);

describe("DataTable faceted-filter contract", () => {
  it("renders a dashed tertiary border through Button's background layer", () => {
    expect(buttonSource).toContain("dashed?: boolean");
    expect(buttonSource).toContain('dashed && "border-dashed"');
    expect(dataTableSource).toContain("dashed={!hasSelectedOptions}");
  });

  it("allows a semantic filter icon that remains fixed after selection", () => {
    expect(dataTableSource).toContain("filterIcon?: IconComponent");
    expect(dataTableSource).toContain("icon={meta?.filterIcon}");
    expect(dataTableSource).toContain(
      "const LeadingIcon = FilterIcon ?? (hasSelectedOptions ? CircleX : CirclePlus);"
    );
    expect(exampleSource).toContain('const StatusIcon = useIcon("dot")');
    expect(exampleSource).toContain("filterIcon: StatusIcon");
  });
});
