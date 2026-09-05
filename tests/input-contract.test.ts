import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/input.tsx"),
  "utf8"
);

describe("Input contract", () => {
  it("normalizes nullable sizes before looking up file-input styles", () => {
    expect(source).toContain('const resolvedSize = size ?? "md";');
    expect(source).toContain("fileInputLineHeightClasses[resolvedSize]");
  });
});
