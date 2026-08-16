import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const selectSource = fs.readFileSync(
  path.join(process.cwd(), "packages/ui/src/components/select.tsx"),
  "utf8"
);

describe("Select size and density", () => {
  it("keeps control size and menu density independent", () => {
    expect(selectSource).toContain("size?: ControlSize;");
    expect(selectSource).toContain("itemDensity?: SelectItemDensity;");
    expect(selectSource).toContain('size = "md"');
    expect(selectSource).toContain('itemDensity = "regular"');
    expect(selectSource).toContain('compact: "h-control-md');
    expect(selectSource).toContain('regular: "h-control-lg');
    expect(selectSource).toContain('comfortable: "h-control-xl');
    expect(selectSource).toContain("const { size } = useSelectContext();");
  });
});
