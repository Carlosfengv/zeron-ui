import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/icons/src/icon-context.tsx"),
  "utf8"
);

it("keeps the workspace dependency pointed from UI to icons", () => {
  const ui = JSON.parse(readFileSync(join(ROOT, "packages/ui/package.json"), "utf8"));
  const icons = JSON.parse(readFileSync(join(ROOT, "packages/icons/package.json"), "utf8"));
  expect(ui.dependencies["@zeron/icons"]).toBe("workspace:*");
  expect(icons.dependencies["@zeron/ui"]).toBeUndefined();
});

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
