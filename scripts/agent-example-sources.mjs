import path from "node:path";
import { fileURLToPath } from "node:url";
import { realpath } from "node:fs/promises";
import { z } from "zod";
import ts from "typescript";
import { fileInventory } from "./published-consumer-runtime.mjs";
import { readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";
import { loadAgentSchema } from "./load-agent-schema.mjs";

const workspace = fileURLToPath(new URL("..", import.meta.url));
export const exampleSourceDirectory = "tests/fixtures/agent-examples";
export const exampleDeclarationPath = "docs/agent-data/examples.json";
export const exampleIds = ["resource-detail", "resource-list", "settings"];
export const exampleStateCases = {
  "resource-list": ["loading", "success", "empty", "error", "forbidden", "stale-read", "filter-reset", "sort-reset", "pagination", "navigation-context"],
  "resource-detail": ["loading", "success", "empty", "error", "forbidden", "not-found", "stale-read", "saving", "save-error", "save-forbidden", "readonly", "navigation-context"],
  settings: ["loading", "success", "empty", "error", "forbidden", "saving", "save-error", "save-forbidden", "readonly", "validation", "dirty-reset", "duplicate-submit"],
};
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const id = z.string().regex(/^[a-z][a-z-]*:[a-z0-9][a-z0-9-]*$/);
const filename = z.string().max(256).regex(/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*\.(?:ts|tsx|md)$/);
const sortedUnique = values => new Set(values).size === values.length && values.every((value, index) => index === 0 || values[index - 1] < value);
const paths = z.array(filename).min(1).max(64).refine(sortedUnique, "Source paths must be unique and sorted");
const ids = z.array(id).min(1).max(64).refine(sortedUnique, "Adopted IDs must be unique and sorted");
export const exampleProfileSchema = z.object({ framework: z.enum(["next", "vite"]), packageManager: z.enum(["npm", "pnpm"]) }).strict();
const profileKey = profile => `${profile.framework}:${profile.packageManager}`;
const exampleSchema = z.object({
  exampleId: z.enum(exampleIds), entry: filename, adoptedItems: ids, sources: paths,
  profiles: z.array(exampleProfileSchema).min(1).max(4).refine(values => sortedUnique(values.map(profileKey)), "Profiles must be unique and sorted"),
  notApplicable: z.object({ empty: z.string().trim().min(8).max(256).optional() }).strict(),
}).strict().superRefine((example, context) => {
  if (example.entry !== `${example.exampleId}/page.tsx` || !example.sources.includes(example.entry)) context.addIssue({ code: "custom", message: "Example entry must be its declared page and belong to its sources" });
  if ((example.exampleId !== "resource-list") !== Boolean(example.notApplicable.empty)) context.addIssue({ code: "custom", message: "Only detail and settings explain the inapplicable collection empty state" });
});
export const exampleDeclarationsSchema = z.object({
  schemaVersion: z.literal(1), hostEntry: filename, instructions: filename,
  examples: z.array(exampleSchema).length(3),
}).strict().superRefine((declarations, context) => {
  if (serialize(declarations.examples.map(example => example.exampleId)) !== serialize(exampleIds)) context.addIssue({ code: "custom", message: "Declare all three examples exactly once in sorted order" });
  if (!declarations.hostEntry.endsWith(".tsx") || !declarations.instructions.endsWith(".md")) context.addIssue({ code: "custom", message: "The host is TSX and run instructions are Markdown" });
});
const sourceFile = z.object({ path: filename, bytes: z.number().int().nonnegative().max(2 * 1024 * 1024), sha256: hash }).strict();
const registryItem = z.object({ itemId: id, registryName: z.string().regex(/^[a-z0-9][a-z0-9-]*$/) }).strict();
export const exampleSourceManifestSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("agent-example-source-manifest"),
  declaration: z.object({ path: z.literal(exampleDeclarationPath), bytes: z.number().int().positive().max(256 * 1024), sha256: hash }).strict(),
  declarations: exampleDeclarationsSchema, files: z.array(sourceFile).min(1).max(64), hostSources: paths, hostAdoptedItems: ids,
  hostRegistryItems: z.array(registryItem).min(1).max(64),
}).strict().superRefine((manifest, context) => {
  const issue = message => context.addIssue({ code: "custom", message });
  const names = manifest.files.map(file => file.path);
  if (!sortedUnique(names) || manifest.files.reduce((sum, file) => sum + file.bytes, 0) > 8 * 1024 * 1024) issue("Example inventory must be unique, sorted and within 8 MiB");
  const available = new Set(names);
  if (!available.has(manifest.declarations.instructions) || !manifest.hostSources.includes(manifest.declarations.hostEntry)) issue("Missing host or run instructions");
  if (manifest.hostSources.some(name => !available.has(name)) || manifest.declarations.examples.some(example => example.sources.some(name => !manifest.hostSources.includes(name)))) issue("Declared example sources must belong to the actual host inventory");
  if (manifest.declarations.examples.some(example => example.adoptedItems.some(id => !manifest.hostAdoptedItems.includes(id)))) issue("Example adoption must belong to the installed host scope");
  if (serialize(manifest.hostRegistryItems.map(item => item.itemId)) !== serialize(manifest.hostAdoptedItems)
    || new Set(manifest.hostRegistryItems.map(item => item.registryName)).size !== manifest.hostRegistryItems.length) issue("Registry names must uniquely resolve the complete adopted host scope");
});

export class ExampleSourceError extends Error {
  constructor(code) { super(`Agent example sources failed: ${code}`); this.code = code; }
}
const fail = code => { throw new ExampleSourceError(code); };
const same = (left, right) => serialize(left) === serialize(right);
const sorted = values => [...values].sort();
function utf8(bytes) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    if (text.includes("\0")) fail("SOURCE_ENCODING");
    return text;
  } catch { fail("SOURCE_ENCODING"); }
}

/** Visit all ESM source references, including type imports; never execute a module. */
function visitImports(ast, visit) {
  const walk = node => {
    if (ts.isImportEqualsDeclaration(node) || (ts.isCallExpression(node)
      && (node.expression.kind === ts.SyntaxKind.ImportKeyword
        || (ts.isIdentifier(node.expression) && node.expression.text === "require")
        || (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "require")))) fail("DYNAMIC_SOURCE_IMPORT");
    let literal;
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier) literal = node.moduleSpecifier;
    if (ts.isImportTypeNode(node)) literal = ts.isLiteralTypeNode(node.argument) ? node.argument.literal : node.argument;
    if (literal) {
      if (!ts.isStringLiteral(literal)) fail("SOURCE_IMPORT");
      visit(literal);
    }
    ts.forEachChild(node, walk);
  };
  walk(ast);
}

export function adaptExampleImports(bytes, filename, framework) {
  if (!["next", "vite"].includes(framework)) fail("SOURCE_FRAMEWORK");
  const text = utf8(bytes);
  const ast = ts.createSourceFile(filename, text, ts.ScriptTarget.Latest, true);
  if (ast.parseDiagnostics.length) fail("SOURCE_SYNTAX");
  const prefix = framework === "next" ? "@/components/ui/" : "@/src/components/ui/";
  const replacements = [];
  visitImports(ast, literal => {
    if (literal.text.startsWith("#components/")) replacements.push({ start: literal.getStart(ast), end: literal.end,
      text: JSON.stringify(`${prefix}${literal.text.slice("#components/".length)}`) });
  });
  let result = text;
  for (const replacement of replacements.sort((a, b) => b.start - a.start)) result = result.slice(0, replacement.start) + replacement.text + result.slice(replacement.end);
  return Buffer.from(result);
}

/** Read the real import graph; declarations cannot conceal dependencies or invent adoption. */
export async function readExampleSourceManifest({ root = workspace, schemas } = {}) {
  schemas ??= await loadAgentSchema();
  const identities = schemas.itemIdentitiesSchema.parse(JSON.parse((await readOwnedFile(root, "docs/agent-data/item-identities.json")).toString("utf8")));
  const declarationBytes = await readOwnedFile(root, exampleDeclarationPath);
  const directory = path.join(await realpath(root), exampleSourceDirectory);
  if (await realpath(directory) !== directory) fail("SOURCE_DIRECTORY_LINK");
  const inventory = await fileInventory(directory, { exclude: [], maxFiles: 64, maxTotalBytes: 8 * 1024 * 1024 });
  const raw = new Map();
  for (const file of inventory) {
    const bytes = await readOwnedFile(directory, file.path);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) fail("SOURCE_CHANGED");
    raw.set(file.path, bytes);
  }
  return createExampleSourceManifest(declarationBytes, raw, identities.items.filter(item => item.type === "registry" && item.status === "active")
    .map(item => ({ itemId: item.id, registryName: item.key })));
}

/** Rebuild an archived import graph from raw bytes; no current workspace content is consulted. */
export function createExampleSourceManifest(declarationBytes, raw, registryItems) {
  if (!Buffer.isBuffer(declarationBytes) || declarationBytes.length > 256 * 1024) fail("DECLARATION_BUDGET");
  if (!(raw instanceof Map) || raw.size < 1 || raw.size > 64) fail("SOURCE_INVENTORY");
  const registered = z.array(registryItem).min(1).max(1024).parse(registryItems);
  const byName = new Map(registered.map(item => [item.registryName, item.itemId]));
  if (byName.size !== registered.length || new Set(registered.map(item => item.itemId)).size !== registered.length) fail("REGISTRY_IDENTITY");
  const declarations = exampleDeclarationsSchema.parse(JSON.parse(utf8(declarationBytes)));
  const files = [...raw].map(([path, bytes]) => {
    if (!Buffer.isBuffer(bytes)) fail("SOURCE_BYTES");
    return sourceFile.parse({ path, bytes: bytes.length, sha256: sha256(bytes) });
  }).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (files.reduce((total, file) => total + file.bytes, 0) > 8 * 1024 * 1024) fail("SOURCE_INVENTORY");
  const texts = new Map(files.map(file => [file.path, utf8(raw.get(file.path))]));
  const edges = new Map();
  const components = new Map();
  for (const [name, text] of texts) {
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const ast = ts.createSourceFile(name, text, ts.ScriptTarget.Latest, true);
    if (ast.parseDiagnostics.length) fail("SOURCE_SYNTAX");
    const dependencies = new Set();
    const adopted = new Set();
    visitImports(ast, literal => {
        const value = literal.text;
        if (value.startsWith(".")) {
          const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), value));
          if (resolved.startsWith("../") || resolved === ".." || path.posix.isAbsolute(resolved) || value.includes("\\")) fail("SOURCE_IMPORT_ESCAPE");
          const candidates = /\.(ts|tsx)$/.test(resolved) ? [resolved] : [`${resolved}.ts`, `${resolved}.tsx`];
          const matches = candidates.filter(candidate => texts.has(candidate));
          if (matches.length !== 1) fail("MISSING_OR_AMBIGUOUS_SOURCE_IMPORT");
          dependencies.add(matches[0]);
        } else if (value.startsWith("#components/")) {
          const name = value.slice("#components/".length);
          if (!/^[a-z0-9][a-z0-9-]*$/.test(name) || !byName.has(name)) fail("UNREGISTERED_COMPONENT_IMPORT");
          adopted.add(byName.get(name));
        } else if (!["react", "@tanstack/react-table"].includes(value)) fail("UNDECLARED_EXTERNAL_IMPORT");
    });
    edges.set(name, dependencies); components.set(name, adopted);
  }
  const closure = entry => {
    const sources = new Set();
    const adopted = new Set();
    const visit = name => {
      if (sources.has(name)) return;
      if (!edges.has(name)) fail("MISSING_SOURCE_ENTRY");
      sources.add(name);
      for (const id of components.get(name)) adopted.add(id);
      for (const dependency of edges.get(name)) visit(dependency);
    };
    visit(entry);
    return { sources: sorted(sources), adoptedItems: sorted(adopted) };
  };
  const host = closure(declarations.hostEntry);
  if (!same(host.sources, files.filter(file => /\.(ts|tsx)$/.test(file.path)).map(file => file.path))) fail("UNREACHABLE_SOURCE_FILE");
  for (const example of declarations.examples) {
    const actual = closure(example.entry);
    if (!same(actual.sources, example.sources) || !same(actual.adoptedItems, example.adoptedItems)) fail("DECLARATION_IMPORT_GRAPH_MISMATCH");
  }
  return exampleSourceManifestSchema.parse({ schemaVersion: 1, kind: "agent-example-source-manifest",
    declaration: { path: exampleDeclarationPath, bytes: declarationBytes.length, sha256: sha256(declarationBytes) },
    declarations, files, hostSources: host.sources, hostAdoptedItems: host.adoptedItems,
    hostRegistryItems: host.adoptedItems.map(itemId => ({ itemId, registryName: registered.find(item => item.itemId === itemId).registryName })) });
}

/** A digest describes source inputs only; it does not promote an example to verified coverage. */
export function exampleSourcesSha256(input) { return sha256(serialize(exampleSourceManifestSchema.parse(input))); }

/** The same consumer host bytes are used by materialization and evidence validation. */
export function exampleHostEntry(input, framework) {
  const manifest = exampleSourceManifestSchema.parse(input);
  if (!["next", "vite"].includes(framework)) fail("SOURCE_FRAMEWORK");
  const host = `../examples/${manifest.declarations.hostEntry.slice(0, -4)}`;
  const content = framework === "next" ? `"use client";\nimport ExamplePreview from ${JSON.stringify(host)};\nexport default ExamplePreview;\n`
    : `import { createRoot } from "react-dom/client";\nimport ExamplePreview from ${JSON.stringify(host)};\nimport "./index.css";\ncreateRoot(document.getElementById("root")!).render(<ExamplePreview />);\n`;
  return { path: framework === "next" ? "app/page.tsx" : "src/main.tsx", content: Buffer.from(content) };
}

export async function assertExampleSourcesUnchanged(expected, options = {}) {
  const actual = await readExampleSourceManifest(options);
  if (exampleSourcesSha256(actual) !== exampleSourcesSha256(expected)) fail("SOURCE_CHANGED");
  return actual;
}
