import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { adaptExampleImports, assertExampleSourcesUnchanged, exampleDeclarationPath, exampleDeclarationsSchema,
  exampleSourceDirectory, exampleSourceManifestSchema, exampleSourcesSha256, readExampleSourceManifest } from "../scripts/agent-example-sources.mjs";
import { materializeExamples } from "../scripts/agent-examples.mjs";
import { loadAgentSchema } from "../scripts/load-agent-schema.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

const workspace = fileURLToPath(new URL("..", import.meta.url));
const directories = [];
let schemas, baseline;
beforeAll(async () => { schemas = await loadAgentSchema(); baseline = await readExampleSourceManifest({ schemas }); });
afterEach(async () => { await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))); });
async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), "zeron-example-sources-"));
  directories.push(root);
  await mkdir(path.join(root, "docs/agent-data"), { recursive: true });
  await cp(path.join(workspace, exampleSourceDirectory), path.join(root, exampleSourceDirectory), { recursive: true });
  for (const relative of [exampleDeclarationPath, "docs/agent-data/item-identities.json"]) await cp(path.join(workspace, relative), path.join(root, relative));
  const source = path.join(root, exampleSourceDirectory);
  return { root, source, read: () => readExampleSourceManifest({ root, schemas }),
    append: async (name, text) => writeFile(path.join(source, name), Buffer.concat([await readFile(path.join(source, name)), Buffer.from(text)])) };
}

describe("business example source contract", () => {
  it("reads exact bytes, actual source closures and Registry names without claiming runtime verification", async () => {
    expect(baseline.files).toHaveLength(10);
    expect(baseline.hostSources).toHaveLength(9);
    expect(baseline.hostAdoptedItems).toHaveLength(11);
    expect(baseline.hostRegistryItems.map(item => item.itemId)).toEqual(baseline.hostAdoptedItems);
    expect(baseline.declarations.examples.map(example => example.exampleId)).toEqual(["resource-detail", "resource-list", "settings"]);
    expect(baseline).not.toHaveProperty("passed");
    expect(baseline).not.toHaveProperty("catalogVersion");
    for (const file of baseline.files) {
      const bytes = await readFile(path.join(workspace, exampleSourceDirectory, file.path));
      expect(file).toEqual({ path: file.path, bytes: bytes.length, sha256: sha256(bytes) });
    }
    expect(exampleSourcesSha256(await readExampleSourceManifest({ schemas }))).toBe(exampleSourcesSha256(baseline));
  });
  it("rejects duplicate, unsafe, unknown and incomplete declarations", () => {
    const edits = [
      value => { value.unknown = true; },
      value => { value.examples.pop(); },
      value => { value.examples.reverse(); },
      value => { value.examples[1] = value.examples[0]; },
      value => { value.examples[0].entry = "../private.tsx"; },
      value => { value.examples[0].sources.push("../private.ts"); },
      value => { value.examples[0].sources.push("shared/%2Fprivate.ts"); },
      value => { value.examples[0].sources.push(value.examples[0].sources[0]); },
      value => { value.examples[0].adoptedItems.reverse(); },
      value => { value.examples[0].adoptedItems.push(value.examples[0].adoptedItems[0]); },
      value => { value.examples[0].profiles.push(value.examples[0].profiles[0]); },
      value => { value.examples[0].profiles[0].packageManager = "yarn"; },
      value => { value.examples[0].profiles[0].passed = true; },
      value => { value.examples[0].notApplicable = {}; },
      value => { value.examples[0].notApplicable.empty = " "; },
      value => { value.examples[1].notApplicable.empty = "Skip all empty collection tests."; },
      value => { value.hostEntry = "README.md"; },
    ];
    for (const edit of edits) { const value = structuredClone(baseline.declarations); edit(value); expect(exampleDeclarationsSchema.safeParse(value).success).toBe(false); }
  });
  it("rejects forged installation mappings, file identities and inventory budgets", () => {
    const edits = [
      value => { value.files.push(value.files[0]); },
      value => { value.files[0].path = "/outside.ts"; },
      value => { value.files[0].sha256 = "invalid"; },
      value => { value.files[0].bytes = 2 * 1024 * 1024 + 1; },
      value => { for (const file of value.files) file.bytes = 2 * 1024 * 1024; },
      value => { value.files = value.files.filter(file => file.path !== "README.md"); },
      value => { value.hostSources = value.hostSources.filter(file => file !== "app.tsx"); },
      value => { value.hostRegistryItems.pop(); },
      value => { value.hostRegistryItems[1].registryName = value.hostRegistryItems[0].registryName; },
      value => { value.hostRegistryItems[0].registryName = "../outside"; },
    ];
    for (const edit of edits) { const value = structuredClone(baseline); edit(value); expect(exampleSourceManifestSchema.safeParse(value).success).toBe(false); }
  });
  it("detects hidden adoption and stale source declarations from the real import graph", async () => {
    const f = await fixture();
    const declarations = structuredClone(baseline.declarations);
    declarations.examples[0].adoptedItems = declarations.examples[0].adoptedItems.filter(id => id !== "component:button");
    await writeFile(path.join(f.root, exampleDeclarationPath), serialize(declarations));
    await expect(f.read()).rejects.toMatchObject({ code: "DECLARATION_IMPORT_GRAPH_MISMATCH" });
    declarations.examples[0] = structuredClone(baseline.declarations.examples[0]);
    declarations.examples[0].sources = declarations.examples[0].sources.filter(name => name !== "shared/contracts.ts");
    await writeFile(path.join(f.root, exampleDeclarationPath), serialize(declarations));
    await expect(f.read()).rejects.toMatchObject({ code: "DECLARATION_IMPORT_GRAPH_MISMATCH" });
  });
  it.each([
    ['import "#components/not-registered";\n', "UNREGISTERED_COMPONENT_IMPORT"],
    ['import "#components/button/private";\n', "UNREGISTERED_COMPONENT_IMPORT"],
    ['import "node:fs";\n', "UNDECLARED_EXTERNAL_IMPORT"],
    ['import "../../../outside";\n', "SOURCE_IMPORT_ESCAPE"],
    ['import "./missing";\n', "MISSING_OR_AMBIGUOUS_SOURCE_IMPORT"],
    ['type Hidden = import("#components/not-registered").Hidden;\n', "UNREGISTERED_COMPONENT_IMPORT"],
    ['const hidden = import("react");\n', "DYNAMIC_SOURCE_IMPORT"],
    ['const hidden = require("react");\n', "DYNAMIC_SOURCE_IMPORT"],
    ['const hidden = module.require("react");\n', "DYNAMIC_SOURCE_IMPORT"],
    ['import hidden = require("react");\n', "DYNAMIC_SOURCE_IMPORT"],
    ['const invalid = ;\n', "SOURCE_SYNTAX"],
  ])("rejects unsupported or concealed imports: %s", async (text, code) => {
    const f = await fixture(); await f.append("resource-list/page.tsx", text);
    await expect(f.read()).rejects.toMatchObject({ code });
  });
  it("includes type-only imports and terminates cyclic source traversal", async () => {
    const f = await fixture();
    await f.append("shared/contracts.ts", 'export type NoticeModule = typeof import("./notices");\n');
    await f.append("shared/notices.tsx", 'export type ContractsModule = typeof import("./contracts");\n');
    expect((await f.read()).hostSources).toEqual(baseline.hostSources);
    expect((await f.read()).declarations.examples).toEqual(baseline.declarations.examples);
  });
  it("requires unique relative resolutions and every TS file to be reachable", async () => {
    const f = await fixture();
    await writeFile(path.join(f.source, "shared/notices.ts"), "export {};\n");
    await expect(f.read()).rejects.toMatchObject({ code: "MISSING_OR_AMBIGUOUS_SOURCE_IMPORT" });
    await rm(path.join(f.source, "shared/notices.ts"));
    await writeFile(path.join(f.source, "unused.ts"), "export {};\n");
    await expect(f.read()).rejects.toMatchObject({ code: "UNREACHABLE_SOURCE_FILE" });
  });
  it("preserves stable IDs through Registry renames and rejects a retired import", async () => {
    const f = await fixture();
    const identityFile = path.join(f.root, "docs/agent-data/item-identities.json");
    const identities = JSON.parse(await readFile(identityFile, "utf8"));
    const item = identities.items.find(item => item.id === "component:button");
    item.key = "renamed-button"; item.aliases.push("renamed-button"); item.aliases.sort();
    await writeFile(identityFile, serialize(identities));
    for (const file of baseline.files.filter(file => /\.(ts|tsx)$/.test(file.path))) {
      const name = path.join(f.source, file.path);
      await writeFile(name, (await readFile(name, "utf8")).replaceAll("#components/button", "#components/renamed-button"));
    }
    const actual = await f.read();
    expect(actual.hostRegistryItems.find(item => item.itemId === "component:button").registryName).toBe("renamed-button");
    expect(actual.hostAdoptedItems).toEqual(baseline.hostAdoptedItems);
    item.status = "retired"; item.retirementReason = "The source has been retired.";
    await writeFile(identityFile, serialize(identities));
    await expect(f.read()).rejects.toMatchObject({ code: "UNREGISTERED_COMPONENT_IMPORT" });
  });
  it("binds raw BOM, CRLF, instruction and declaration bytes rather than normalized text", async () => {
    const f = await fixture();
    const filename = path.join(f.source, "shared/contracts.ts");
    const bytes = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from((await readFile(filename, "utf8")).replaceAll("\n", "\r\n"))]);
    await writeFile(filename, bytes);
    const first = await f.read();
    expect(first.files.find(file => file.path === "shared/contracts.ts")).toEqual({ path: "shared/contracts.ts", bytes: bytes.length, sha256: sha256(bytes) });
    expect(exampleSourcesSha256(first)).not.toBe(exampleSourcesSha256(baseline));
    await f.append("README.md", "\nInstructions changed.\n");
    await expect(assertExampleSourcesUnchanged(first, { root: f.root, schemas })).rejects.toMatchObject({ code: "SOURCE_CHANGED" });
    const second = await f.read();
    const declaration = path.join(f.root, exampleDeclarationPath);
    await writeFile(declaration, Buffer.concat([await readFile(declaration), Buffer.from("\n")]));
    await expect(assertExampleSourcesUnchanged(second, { root: f.root, schemas })).rejects.toMatchObject({ code: "SOURCE_CHANGED" });
  });
  it("rejects invalid UTF-8, NUL and non-regular source files", async () => {
    const f = await fixture();
    const filename = path.join(f.source, "README.md");
    for (const bytes of [Buffer.from([0xc3, 0x28]), Buffer.from("bad\0text")]) {
      await writeFile(filename, bytes);
      await expect(f.read()).rejects.toMatchObject({ code: "SOURCE_ENCODING" });
    }
    await rm(filename);
    await symlink(path.join(workspace, exampleSourceDirectory, "README.md"), filename);
    await expect(f.read()).rejects.toMatchObject({ code: "NON_REGULAR_CONSUMER_FILE" });
  });
  it("rejects a symlink replacing the entire source directory", async () => {
    const f = await fixture();
    await rm(f.source, { recursive: true });
    await symlink(path.join(workspace, exampleSourceDirectory), f.source, "dir");
    await expect(f.read()).rejects.toMatchObject({ code: "SOURCE_DIRECTORY_LINK" });
  });
  it("adapts single quotes, reexports and type imports without changing prose or comments", () => {
    const input = Buffer.from('\uFEFFimport { Button } from \'#components/button\';\r\nexport { Button } from "#components/button";\r\ntype ButtonModule = typeof import(\'#components/button\');\r\nconst prose = "#components/button"; // "#components/button"\r\n');
    const output = adaptExampleImports(input, "sample.ts", "vite").toString("utf8");
    expect(output.startsWith("\uFEFF")).toBe(true);
    expect(output.match(/@\/src\/components\/ui\/button/g)).toHaveLength(3);
    expect(output).toContain('const prose = "#components/button"; // "#components/button"\r\n');
    expect(output.match(/\r\n/g)).toHaveLength(4);
  });
  it("rejects stale sources before writing a consumer", async () => {
    const f = await fixture();
    const manifest = await f.read();
    await f.append("settings/page.tsx", "\n// Changed since selection.\n");
    const consumer = path.join(f.root, "consumer");
    await mkdir(consumer);
    await expect(materializeExamples(consumer, "vite", { manifest, sourceRoot: f.root, schemas })).rejects.toMatchObject({ code: "SOURCE_CHANGED" });
    await expect(readFile(path.join(consumer, "examples/settings/page.tsx"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
