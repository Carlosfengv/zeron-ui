import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const root = fileURLToPath(new URL("..", import.meta.url));
const example = "docs/pages/components/artifact-preview-panel/preview-document.tsx";
const destination = path.join(root, "docs/pages/components/artifact-preview-panel/preview-document.generated.json");
const check = process.argv.includes("--check");
const sources = [example, "packages/ui/src/components/field.tsx", "packages/ui/src/components/input.tsx", "packages/ui/src/tokens/control-size.ts"];
const stylesheet = [
  '@import "tailwindcss" source(none);',
  '@import "@zeron/tokens/styles.css";',
  ...sources.map((source) => `@source "./${source}";`),
].join("\n");
const { css } = await postcss([tailwindcss({ base: root, optimize: true })]).process(stylesheet, {
  from: path.join(root, "artifact-preview-example.css"), map: false,
});
// Bundle only local components. React and Base UI use the installed Node runtime.
const bundle = await build({
  entryPoints: [path.join(root, example)], bundle: true, platform: "node", format: "esm",
  packages: "external", jsx: "automatic", write: false,
  alias: {
    "@zeron/ui/field": path.join(root, "packages/ui/src/components/field.tsx"),
    "@zeron/ui/input": path.join(root, "packages/ui/src/components/input.tsx"),
  },
});
// Keep external package resolution inside the workspace without shipping a runtime bundle.
const temporary = await mkdtemp(path.join(root, "node_modules/.artifact-preview-"));
try {
  const modulePath = path.join(temporary, "document.mjs");
  await writeFile(modulePath, bundle.outputFiles[0].text);
  const { ArtifactPreviewDocument } = await import(pathToFileURL(modulePath).href);
  const bodies = Object.fromEntries(["en", "zh-CN"].map((locale) => [locale,
    [false, true].map((updated) => renderToStaticMarkup(createElement(ArtifactPreviewDocument, { locale, updated }))),
  ]));
  const generated = JSON.stringify({ generatedBy: "scripts/generate-artifact-preview-example.mjs", css, bodies }, null, 2) + "\n";
  const current = await readFile(destination, "utf8").catch((error) => { if (error.code === "ENOENT") return null; throw error; });
  if (current !== generated) {
    if (check) throw new Error("Artifact preview example is stale. Run pnpm docs:sources:build.");
    await writeFile(destination, generated);
  }
  console.log(`${check ? "Checked" : "Generated"} artifact preview HTML from Field, FieldLabel and Input.`);
} finally { await rm(temporary, { recursive: true, force: true }); }
