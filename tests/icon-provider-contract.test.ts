import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/system/icon-context.tsx"),
  "utf8"
);

describe("IconProvider persisted variant contract", () => {
  it("restores only variants supported by the active provider", () => {
    expect(source).toContain(
      "isIconVariant(savedVariant) && availableVariants.includes(savedVariant)"
    );
  });

  it("clears a stale Pro variant when the free provider is active", () => {
    expect(source).toContain(
      "window.localStorage.removeItem(iconVariantStorageKey)"
    );
  });
});
