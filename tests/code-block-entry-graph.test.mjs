import { describe, expect, it } from "vitest";
import * as esbuild from "esbuild";

const buildOptions = {
  bundle: true,
  write: false,
  metafile: true,
  platform: "browser",
  format: "esm",
  splitting: true,
  outdir: "out",
  jsx: "automatic",
  conditions: ["browser", "import", "module"],
  external: [
    "react",
    "react-dom",
    "@base-ui/*",
    "@hugeicons/*",
    "framer-motion",
  ],
  tsconfig: "packages/ui/tsconfig.json",
};

async function getInitialInputs(name, entryPoint) {
  const result = await esbuild.build({
    ...buildOptions,
    entryPoints: { [name]: entryPoint },
  });
  const entryOutput = Object.entries(result.metafile.outputs).find(
    ([, output]) => output.entryPoint === entryPoint
  )?.[0];
  expect(entryOutput).toBeDefined();

  const outputs = new Set();
  const visit = (file) => {
    if (outputs.has(file)) return;
    outputs.add(file);
    for (const imported of result.metafile.outputs[file]?.imports ?? []) {
      if (imported.kind !== "dynamic-import" && result.metafile.outputs[imported.path]) {
        visit(imported.path);
      }
    }
  };
  visit(entryOutput);

  return new Set(
    [...outputs].flatMap((file) =>
      Object.keys(result.metafile.outputs[file]?.inputs ?? {})
    )
  );
}

describe("code-block entry dependency graph", () => {
  it("keeps editor runtime out of the read-only entry", async () => {
    const inputs = await getInitialInputs(
      "readonly",
      "packages/ui/src/components/code-block/index.ts"
    );

    expect([...inputs].filter((file) => file.includes("/editor/"))).toEqual([]);
    expect(
      [...inputs].filter((file) => file.includes("@shikijs/langs/dist/langs/"))
    ).toEqual([]);
  });

  it("loads the editor runtime through the edit entry", async () => {
    const inputs = await getInitialInputs(
      "edit",
      "packages/ui/src/components/code-block/edit.tsx"
    );

    expect([...inputs].some((file) => file.endsWith("/editor/editor.ts"))).toBe(true);
    expect([...inputs].some((file) => file.endsWith("/editor/pieceTable.ts"))).toBe(true);
    expect([...inputs].some((file) => file.endsWith("/editor/searchPanel.ts"))).toBe(true);
  });
});
