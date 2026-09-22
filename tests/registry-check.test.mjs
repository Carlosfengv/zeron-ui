import { describe, expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const metadata = { zeron: { framework: "react", react: "^19.0.0", tailwind: "^4.0.0", kind: "ui" } };

describe("Registry closure checker", () => {
  it("reports an internal alias missing from a recursive closure", () => {
    const errors = checkRegistry([{
      name: "button",
      meta: metadata,
      files: [{ path: "button.tsx", target: "components/ui/button.tsx", content: 'import { cx } from "@lib/utils";' }],
    }]);
    expect(errors).toContain("button: components/ui/button.tsx imports @lib/utils; expected lib/utils in its Registry closure");
  });

  it("accepts a dependency-provided internal file and its declared package", () => {
    const errors = checkRegistry([
      {
        name: "utils", meta: metadata, dependencies: ["clsx@^2.1.1"],
        files: [{ path: "utils.ts", target: "lib/utils.ts", content: 'export { clsx } from "clsx";' }],
      },
      {
        name: "button", meta: metadata, registryDependencies: ["utils"],
        files: [{ path: "button.tsx", target: "components/ui/button.tsx", content: 'import { clsx } from "@lib/utils";' }],
      },
    ]);
    expect(errors).toEqual([]);
  });

  it("accepts a type-only import supplied by its DefinitelyTyped package", () => {
    const errors = checkRegistry([{
      name: "code-engine",
      meta: metadata,
      dependencies: ["@types/hast@^3.0.4"],
      files: [{ path: "types.ts", target: "lib/code-engine/types.ts", content: 'import type { Element } from "hast"; export type Node = Element;' }],
    }]);
    expect(errors).toEqual([]);
  });

  it("does not treat a type package as a runtime dependency", () => {
    const errors = checkRegistry([{
      name: "code-engine",
      meta: metadata,
      dependencies: ["@types/hast@^3.0.4"],
      files: [{ path: "runtime.ts", target: "lib/code-engine/runtime.ts", content: 'import { value } from "hast"; export { value };' }],
    }]);
    expect(errors).toContain("code-engine: lib/code-engine/runtime.ts imports hast but hast is not declared in its closure dependencies");
  });
});
