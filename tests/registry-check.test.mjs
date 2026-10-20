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

  it("resolves shared source against each closure's own dependencies", () => {
    const errors = checkRegistry([
      { name: "shared", meta: metadata, files: [{ target: "lib/shared.ts", content: 'export { value } from "required-package";' }] },
      { name: "declared", meta: metadata, registryDependencies: ["shared"], dependencies: ["required-package"] },
      { name: "missing", meta: metadata, registryDependencies: ["shared"] },
    ]);
    expect(errors).toEqual([
      "shared: lib/shared.ts imports required-package but required-package is not declared in its closure dependencies",
      "missing: lib/shared.ts imports required-package but required-package is not declared in its closure dependencies",
    ]);
  });

  it("checks different contents at the same target independently and rechecks revised source", () => {
    const file = { target: "lib/shared.ts", content: "export const ready = true;" };
    const safe = { name: "safe", meta: metadata, files: [file] };
    const invalid = { name: "invalid", meta: metadata, files: [{ ...file, content: 'export { value } from "missing-package";' }] };
    expect(checkRegistry([safe, invalid])).toEqual([
      "invalid: lib/shared.ts imports missing-package but missing-package is not declared in its closure dependencies",
    ]);
    file.content = invalid.files[0].content;
    expect(checkRegistry([safe])).toEqual([
      "safe: lib/shared.ts imports missing-package but missing-package is not declared in its closure dependencies",
    ]);
  });
});
