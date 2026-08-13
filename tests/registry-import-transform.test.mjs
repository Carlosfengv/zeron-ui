import { describe, expect, it } from "vitest";
import { transformRegistryImports } from "../packages/registry/scripts/transform-imports.mjs";

describe("Registry import transform", () => {
  it("rewrites imports, type imports, re-exports, and private package aliases structurally", () => {
    const source = [
      'import type { ButtonProps } from "@zeron/ui/button";',
      'import { useThing } from "@zeron/ui/hooks/use-thing";',
      'export { cn } from "#system/utils";',
      'export type { Item } from "#components/item";',
      'type Lazy = import("@zeron/ui/system/theme-context").Theme;',
    ].join("\n");
    const output = transformRegistryImports(source);

    expect(output).toContain('from "@ui/button"');
    expect(output).toContain('from "@hooks/use-thing"');
    expect(output).toContain('from "@lib/utils"');
    expect(output).toContain('from "@ui/item"');
    expect(output).toContain('import("@lib/theme-context")');
  });
});
