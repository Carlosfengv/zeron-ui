import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const dataTableSource = readFileSync(
  join(ROOT, "packages/ui/src/components/data-table.tsx"),
  "utf8"
);
const personalSettingsSource = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/personal-settings-01/personal-settings.tsx"
  ),
  "utf8"
);

describe("DataTable pagination contract", () => {
  it("keeps a controlled page size available in the rows-per-page select", () => {
    expect(dataTableSource).toContain(
      "const pageSize = table.getState().pagination.pageSize;"
    );
    expect(dataTableSource).toContain("const resolvedPageSizeOptions = pageSizeOptions.includes(pageSize)");
    expect(dataTableSource).toContain("[...pageSizeOptions, pageSize].sort((left, right) => left - right)");
    expect(dataTableSource).toContain("resolvedPageSizeOptions.map((option) =>");
  });

  it("keeps settings table mock data stable while pagination updates", () => {
    expect(personalSettingsSource).toContain(
      "const data = useMemo(() => [...apiKeys], []);"
    );
    expect(personalSettingsSource).toContain(
      "const data = useMemo(() => [...credentials], []);"
    );
    expect(personalSettingsSource).not.toContain("data: [...apiKeys]");
    expect(personalSettingsSource).not.toContain("data: [...credentials]");
  });
});
