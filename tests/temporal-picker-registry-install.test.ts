import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Temporal picker registry item", () => {
  it("installs the complete picker family and every internal implementation file", () => {
    const registry = JSON.parse(readFileSync(resolve(root, "packages/ui/registry.json"), "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "temporal-picker");
    const targets = item.files.map((file: { target: string }) => file.target);

    expect(item.registryDependencies).toEqual(expect.arrayContaining([
      "calendar",
      "input-group",
      "mobile-drawer",
      "popover",
      "use-touch-primary",
    ]));
    expect(targets).toEqual(expect.arrayContaining([
      "components/ui/temporal-picker/index.ts",
      "components/ui/temporal-picker/temporal-utils.ts",
      "components/ui/temporal-picker/time-field.tsx",
      "components/ui/temporal-picker/date-time-pickers.tsx",
    ]));
  });

  it("publishes a transformed standalone registry artifact", () => {
    const artifact = JSON.parse(readFileSync(resolve(root, "public/r/temporal-picker.json"), "utf8"));
    expect(artifact.registryDependencies).toContain("https://zeron-ui.vercel.app/r/calendar.json");
    expect(artifact.files).toHaveLength(9);
  });
});
