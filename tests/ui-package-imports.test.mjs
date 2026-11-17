import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { expect, it } from "vitest";

const ui = fileURLToPath(new URL("../packages/ui/", import.meta.url));
const components = join(ui, "src/components");
const manifest = JSON.parse(readFileSync(join(ui, "package.json"), "utf8"));
const requireFromUI = createRequire(join(ui, "package.json"));
const entries = readdirSync(components, { withFileTypes: true }).flatMap(entry => {
  if (!entry.isDirectory()) return [];
  return readdirSync(join(components, entry.name))
    .filter(file => /^index\.tsx?$/.test(file))
    .map(file => [entry.name, file]);
});
const projects = [join(ui, "tsconfig.json"), fileURLToPath(new URL("../tsconfig.json", import.meta.url))]
  .map(config => ts.parseJsonConfigFileContent(ts.readConfigFile(config, ts.sys.readFile).config, ts.sys, dirname(config)));

it.each(entries)("#components/%s resolves to the same directory entry in package imports and both TS projects", (name, file) => {
  const alias = `#components/${name}`;
  const entry = join(components, name, file);
  expect(manifest.imports[alias]).toBe(`./src/components/${name}/${file}`);
  expect(requireFromUI.resolve(alias)).toBe(entry);
  for (const { options } of projects) {
    expect(ts.resolveModuleName(alias, join(components, "tabs.tsx"), options, ts.sys).resolvedModule?.resolvedFileName).toBe(entry);
  }
});
