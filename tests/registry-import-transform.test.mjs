import { describe, expect, it } from "vitest";
import { transformRegistryImports } from "../packages/registry/scripts/transform-imports.mjs";

describe("Registry import transform", () => {
  it("rewrites imports, dynamic imports, type imports, re-exports, and private package aliases structurally", () => {
    const source = [
      'import type { ButtonProps } from "@zeron/ui/button";',
      'import { useThing } from "@zeron/ui/hooks/use-thing";',
      'export { cn } from "#system/utils";',
      'export type { Item } from "#components/item";',
      'type Lazy = import("@zeron/ui/system/theme-context").Theme;',
      'const loadTheme = () => import("@zeron/ui/system/theme-context");',
    ].join("\n");
    const output = transformRegistryImports(source);

    expect(output).toContain('from "@ui/button"');
    expect(output).toContain('from "@hooks/use-thing"');
    expect(output).toContain('from "@lib/utils"');
    expect(output).toContain('from "@ui/item"');
    expect(output.match(/import\("@lib\/theme-context"\)/g)).toHaveLength(2);
  });

  it("parses TypeScript as TypeScript so generic arrows are not rewritten as JSX", () => {
    const source = [
      'import { cn } from "@zeron/ui/system/utils";',
      'export const identity = <T>(value: T): T => value;',
    ].join("\n");

    const output = transformRegistryImports(source, "engine-utils.ts");

    expect(output).toContain('from "@lib/utils"');
    expect(output).toContain("identity = <T>(value: T): T => value;");
    expect(output).not.toContain("</>");
  });

  it("preserves TSX syntax while rewriting its imports", () => {
    const output = transformRegistryImports(
      'import { Button } from "@zeron/ui/button"; export const Demo = () => <Button />;',
      "demo.tsx",
    );

    expect(output).toContain('from "@ui/button"');
    expect(output).toContain("<Button />");
  });

  it("rejects malformed source instead of emitting a broken Registry artifact", () => {
    expect(() => transformRegistryImports("export const = ;", "broken.ts")).toThrow(
      "Cannot transform Registry imports in broken.ts",
    );
  });
});
