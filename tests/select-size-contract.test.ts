import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const selectSource = fs.readFileSync(
  path.join(process.cwd(), "packages/ui/src/components/select.tsx"),
  "utf8"
);

describe("Select item density", () => {
  it("uses the 32px control token by default and the 36px token for large triggers", () => {
    expect(selectSource).toContain('default: "h-control-sm"');
    expect(selectSource).toContain('large: "h-control-md"');
    expect(selectSource).toContain('props.size === "lg" ? "large" : "default"');
  });
});
