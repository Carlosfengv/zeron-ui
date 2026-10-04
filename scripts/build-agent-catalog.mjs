import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { parse as parseYaml } from "yaml";
import ts from "typescript";
import { canonical, readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";
import { generateAgentGuideLoaders } from "./generate-agent-guide-loaders.mjs";
import { assertContextBudget, buildFullContext, contextBudgets } from "./agent-context.mjs";
import { readSkillTexts } from "./skill-text-references.mjs";
import { renderExampleLinks } from "../lib/agent-catalog/example-links.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const site = "https://zeron-ui.vercel.app";
async function json(relative) { return JSON.parse((await readOwnedFile(root, relative)).toString("utf8")); }

async function loadSources(temporary) {
  const outfile = path.join(temporary, "sources.mjs");
  await build({ entryPoints: [path.join(root, "docs/agent-data/sources.ts")], outfile, bundle: true, platform: "node", format: "esm", logLevel: "silent" });
  return import(pathToFileURL(outfile).href);
}
function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("Agent guide requires YAML frontmatter");
  const data = parseYaml(match[1]);
  if (data?.schema_version !== 1 || typeof data.name !== "string" || typeof data.summary !== "string") throw new Error("Invalid agent guide frontmatter");
  return data;
}
function exportsFrom(files) {
  const names = new Set();
  for (const file of files ?? []) {
    if (!/\.[cm]?[jt]sx?$/.test(file.path) || typeof file.content !== "string") continue;
    const source = ts.createSourceFile(file.path, file.content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const statement of source.statements) {
      if (ts.isExportDeclaration(statement) && statement.exportClause && ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) names.add(element.name.text);
      } else if (statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
        if (statement.name && ts.isIdentifier(statement.name)) names.add(statement.name.text);
        if (ts.isVariableStatement(statement)) for (const declaration of statement.declarationList.declarations) if (ts.isIdentifier(declaration.name)) names.add(declaration.name.text);
      }
    }
  }
  return [...names].sort();
}
async function localizedTitle(doc) {
  if (!doc) return null;
  const filename = `docs/content/zh-CN/${doc.sourceCollection ?? doc.collection}/${doc.slug}.json`;
  const data = await json(filename).catch(() => null);
  if (!data) return null;
  const values = Object.values(data).filter((value) => value && typeof value === "object");
  return values.map((value) => value.title ?? value.name).find((value) => typeof value === "string") ?? null;
}
export function renderDetail(detail) {
  const { item } = detail;
  const text = `# ${item.title.en}\n\n${item.summary.en}\n\n- ID: ${item.id}\n- Registry: ${item.registryName ?? "not installable"}\n- Framework: ${item.framework ?? "unknown"}\n- Documentation coverage: ${item.coverage}\n- Source exports: ${detail.exports.join(", ") || "Consult linked documentation"}\n- Guide language: ${detail.guideLocale ?? "No detailed guide"}\n\n## Use when\n\n${item.useCases.map((value) => `- ${value}`).join("\n") || "Read the task and installed public types before adopting this item."}\n\n## Do not use when\n\n${item.whenNotToUse.map((value) => `- ${value}`).join("\n") || "Do not assume a similarly named library has the same API."}\n\n## Integration\n\nUse public props and slots. Preserve host navigation and scroll ownership. Connect real data and callbacks; demo content is not an integration. The installed source is the API authority.\n\n${detail.guide ?? "No detailed guide is maintained for this item. Check the installed source and linked documentation."}\n`;
  return detail.examples ? `${text}\n## Runnable examples\n\n${renderExampleLinks(detail.examples)}` : text;
}
export async function buildAgentCatalog({ output = root, check = false, publishedInputs = undefined, writeOutputs = true } = {}) {
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-agent-catalog-"));
  try {
    const schemaFile = path.join(temporary, "schema.mjs");
    await build({ entryPoints: [path.join(root, "lib/agent-catalog/schema.ts")], outfile: schemaFile, bundle: true, platform: "node", format: "esm", logLevel: "silent" });
    const { runtimeSchema, createItemIdentityRegistry, guideRoutesSchema } = await import(pathToFileURL(schemaFile).href);
    const identities = createItemIdentityRegistry(await json("docs/agent-data/item-identities.json"));
    const { docEntries, artifactCatalog, standalonePages, pathnameOf } = await loadSources(temporary);
    const semantics = await json("docs/agent-data/components.json");
    const synonyms = await json("docs/agent-data/search-synonyms.json");
    const registryBytes = async name => {
      if (!publishedInputs) return readOwnedFile(root, `public/r/${name}`);
      const bytes = publishedInputs.registry.files.get(name);
      if (!Buffer.isBuffer(bytes)) throw new Error("Verified Registry source file is missing");
      return bytes;
    };
    const indexBytes = await registryBytes("registry.json");
    const registry = JSON.parse(indexBytes.toString("utf8"));
    const registryItems = new Map();
    const registryFiles = [];
    registryFiles.push({ path: "registry.json", bytes: indexBytes.length, sha256: sha256(indexBytes) });
    for (const entry of [...registry.items].sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      if (!/^[a-z0-9-]+$/.test(entry.name) || registryItems.has(entry.name)) throw new Error(`Duplicate or invalid Registry name: ${entry.name}`);
      const bytes = await registryBytes(`${entry.name}.json`);
      const item = JSON.parse(bytes.toString("utf8"));
      if (item.name !== entry.name || !item.meta?.zeron) throw new Error(`Invalid Registry identity/capability: ${entry.name}`);
      registryItems.set(entry.name, item);
      registryFiles.push({ path: `${entry.name}.json`, bytes: bytes.length, sha256: sha256(bytes) });
    }
    for (const item of registryItems.values()) {
      for (const dependency of item.registryDependencies ?? []) {
        const dependencyBase = publishedInputs ? `${publishedInputs.registry.manifest.baseUrl}/` : `${site}/r/`;
        const localName = dependency.startsWith(dependencyBase) ? dependency.slice(dependencyBase.length).replace(/\.json$/, "") : dependency;
        if (!dependency.startsWith("http") || dependency.startsWith(dependencyBase)) if (!registryItems.has(localName)) throw new Error(`Missing Registry dependency: ${item.name} -> ${dependency}`);
      }
    }
    for (const name of [...Object.keys(semantics), ...Object.keys(synonyms)]) {
      if (!registryItems.has(name)) throw new Error(`Semantic metadata references unknown Registry item: ${name}`);
    }
    const guideKeys = await generateAgentGuideLoaders({ check: true });
    const guides = new Map();
    for (const key of guideKeys) {
      const bytes = await readOwnedFile(root, `docs/agent-guides/${key}`);
      const text = bytes.toString("utf8");
      const meta = frontmatter(text);
      if (guides.has(meta.name)) throw new Error(`Duplicate guide identity: ${meta.name}`);
      if (!registryItems.has(meta.name)) throw new Error(`Guide without registered item: ${meta.name}`);
      for (const related of meta.related ?? []) if (!registryItems.has(related)) throw new Error(`Unknown guide relation: ${meta.name} -> ${related}`);
      if (meta.source) await readOwnedFile(root, meta.source);
      guides.set(meta.name, { text, meta, key, sha256: sha256(bytes) });
    }
    const guideRoutes = guideRoutesSchema.parse(await json("docs/agent-data/guide-routes.json"));
    const byGuidePath = new Map(guideRoutes.routes.map(route => [route.path, route.itemId]));
    for (const guide of guides.values()) {
      if (byGuidePath.get(guide.key) !== identities.resolve("registry", guide.meta.name).id) throw new Error(`Guide source differs from explicit route identity: ${guide.key}`);
    }
    const details = {};
    const items = [];
    const mappedDocs = new Set();
    for (const item of registryItems.values()) {
      const artifact = artifactCatalog.find((value) => value.registryName === item.name);
      const doc = docEntries.find((value) => value.registryItem?.name === item.name || (value.slug === item.name && !value.registryItem));
      if (doc) mappedDocs.add(`${doc.collection}/${doc.slug}`);
      const guide = guides.get(item.name);
      const semantic = semantics[item.name] ?? {};
      const capability = item.meta.zeron;
      if (artifact && (artifact.installation.framework !== capability.framework || artifact.installation.kind !== capability.kind)) throw new Error(`Conflicting capability: ${item.name}`);
      const support = !["registry:ui", "registry:block", "registry:component"].includes(item.type);
      const identity = identities.resolve("registry", item.name, [item.name, doc?.slug].filter(Boolean));
      const { id } = identity;
      const entry = {
        id, slug: doc?.slug ?? item.name, registryName: item.name,
        kind: support ? "support" : artifact?.kind ?? (item.type === "registry:block" ? "block" : "component"),
        collection: doc?.collection ?? (support ? "support" : item.type === "registry:block" ? "blocks" : "components"),
        title: { en: item.title ?? artifact?.title ?? doc?.name ?? item.name, "zh-CN": await localizedTitle(doc) ?? (doc?.name && /\p{Script=Han}/u.test(doc.name) ? doc.name : null) },
        summary: { en: doc?.description ?? item.description ?? item.name, "zh-CN": guide?.meta.locale === "en" ? null : guide?.meta.summary ?? null },
        keywords: [...new Set([item.name, doc?.slug, doc?.section, ...(artifact?.searchTerms ?? []), ...(semantic.keywords ?? []), ...(synonyms[item.name] ?? [])].filter(Boolean))],
        useCases: semantic.useCases ?? [], whenNotToUse: semantic.whenNotToUse ?? [],
        related: (guide?.meta.related ?? []).map((name) => identities.resolve("registry", name).id),
        framework: capability.framework, react: capability.react ?? null, tailwind: capability.tailwind ?? null,
        installable: true, installationKind: capability.kind,
        readiness: artifact?.readiness ?? null, dataMode: artifact?.dataMode ?? null, devices: artifact?.devices ?? null,
        domains: artifact?.domains ?? [], docs: doc ? `${site}${pathnameOf(doc)}` : null,
        markdown: `${site}/ai/items/${encodeURIComponent(id)}.md`, detailUrl: `${site}/ai/items/${encodeURIComponent(id)}.json`,
        coverage: guide ? "guided" : "basic", aliases: identity.aliases,
      };
      items.push(entry);
      details[id] = { item: entry, guide: guide?.text ?? null, guideLocale: guide ? guide.meta.locale ?? "zh-CN" : null,
        exports: exportsFrom(item.files), sourceFiles: (item.files ?? []).map((file) => file.path),
        dependencies: item.dependencies ?? [], registryDependencies: item.registryDependencies ?? [], keyApi: semantic.keyApi ?? [] };
    }
    for (const doc of docEntries.filter((value) => !mappedDocs.has(`${value.collection}/${value.slug}`))) {
      if (doc.registryItem) throw new Error(`Document references missing Registry: ${doc.slug}`);
      const identity = identities.resolve("document", `${doc.collection}/${doc.slug}`, [doc.slug]);
      const { id } = identity;
      const entry = { id, slug: doc.slug, registryName: null, kind: "reference", collection: doc.collection,
        title: { en: doc.name, "zh-CN": await localizedTitle(doc) }, summary: { en: doc.description ?? doc.name, "zh-CN": null },
        keywords: [doc.slug, doc.section], useCases: [], whenNotToUse: [], related: [], framework: null, react: null, tailwind: null,
        installable: false, installationKind: null, readiness: null, dataMode: null, devices: null, domains: [],
        docs: `${site}${pathnameOf(doc)}`, markdown: `${site}/ai/items/${encodeURIComponent(id)}.md`, detailUrl: `${site}/ai/items/${encodeURIComponent(id)}.json`, coverage: "basic", aliases: identity.aliases };
      items.push(entry);
      details[id] = { item: entry, guide: null, guideLocale: null, exports: [], sourceFiles: [], dependencies: [], registryDependencies: [], keyApi: [] };
    }
    for (const page of standalonePages) {
      const identity = identities.resolve("page", page.slug, [page.slug]);
      const { id } = identity;
      const entry = { id, slug: page.slug, registryName: null, kind: page.kind, collection: page.collection,
        title: { en: page.title, "zh-CN": null }, summary: { en: page.description, "zh-CN": null }, keywords: page.searchTerms,
        useCases: [], whenNotToUse: ["This page is a standalone demo and has no Registry installation artifact."], related: [], framework: null, react: null, tailwind: null,
        installable: false, installationKind: null, readiness: page.readiness, dataMode: page.dataMode, devices: page.devices, domains: page.domains,
        docs: `${site}${page.href}`, markdown: `${site}/ai/items/${encodeURIComponent(id)}.md`, detailUrl: `${site}/ai/items/${encodeURIComponent(id)}.json`, coverage: "basic", aliases: identity.aliases };
      items.push(entry); details[id] = { item: entry, guide: null, guideLocale: null, exports: [], sourceFiles: [], dependencies: [], registryDependencies: [], keyApi: [] };
    }
    items.sort((a, b) => a.id.localeCompare(b.id, "en"));
    identities.assertComplete();
    if (new Set(items.map((item) => item.id)).size !== items.length) throw new Error("Duplicate catalog ID");
    const skillSources = new Map();
    async function collectSkill(name, directory, prefix = "") {
      for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
        if (entry.isSymbolicLink()) throw new Error(`Skill symlink: ${name}/${prefix}${entry.name}`);
        if (entry.isDirectory()) await collectSkill(name, path.join(directory, entry.name), `${prefix}${entry.name}/`);
        else if (entry.isFile()) skillSources.set(`${name}/${prefix}${entry.name}`, await readOwnedFile(root, `.agents/skills/${name}/${prefix}${entry.name}`));
        else throw new Error(`Skill sources require regular files: ${name}/${prefix}${entry.name}`);
      }
    }
    if (publishedInputs) {
      for (const [name, bytes] of publishedInputs.skill.files) if (name.startsWith("sources/")) skillSources.set(name.slice("sources/".length), bytes);
    } else for (const name of ["zeron-page-builder", "swap-to-zeronui"]) await collectSkill(name, path.join(root, ".agents/skills", name));
    const skillManifest = publishedInputs ? publishedInputs.skillRelease : await json("public/skills/manifest.json");
    const skillFiles = [...skillSources].map(([relative, bytes]) => ({ path: relative, bytes: bytes.length, sha256: sha256(bytes) })).sort((a, b) => a.path < b.path ? -1 : 1);
    if (serialize(skillFiles) !== serialize(skillManifest.files)) throw new Error("Skill source inventory differs from distribution; rebuild Skills before the catalog");
    const skills = await readSkillTexts(skillManifest.files, relative => skillSources.get(relative));
    const payload = { items, details, guideRoutes, skills, registryFiles, identities: identities.identities,
      skillManifestSha256: sha256(publishedInputs ? publishedInputs.skill.files.get("manifest.json") : await readOwnedFile(root, "public/skills/manifest.json")) };
    const catalogVersion = sha256(serialize(payload));
    const catalog = { schemaVersion: 1, mode: "development", catalogVersion, catalogUrl: null, sourceRevision: null,
      registryReleaseId: null, skillVersion: skillManifest.skillVersion ?? skillManifest.version, registryManifestSha256: sha256(serialize(registryFiles)), items };
    const runtime = { catalog, details, guideRoutes, skills, installation: null };
    runtimeSchema.parse(runtime);
    const publicFiles = new Map([
      ["ai/catalog.json", serialize(catalog)],
      [`ai/releases/${catalogVersion}/catalog.json`, serialize(catalog)],
      ["ai/guide-routes.json", serialize(guideRoutes)],
      [`ai/releases/${catalogVersion}/guide-routes.json`, serialize(guideRoutes)],
    ]);
    for (const [id, detail] of Object.entries(details)) for (const suffix of ["json", "md"]) {
      const body = suffix === "json" ? serialize(detail) : renderDetail(detail);
      publicFiles.set(`ai/items/${id}.${suffix}`, body);
      publicFiles.set(`ai/releases/${catalogVersion}/items/${id}.${suffix}`, body);
    }
    const intro = `# Zeron UI for agents\n\nRead the catalog and exact installed types before choosing a component.\n\n- [AI usage](${site}/docs/ai)\n- [Catalog](${site}/ai/catalog.json)\n- [Skills installation](${site}/skills/install.md)\n\n## Install\n\nUse the verified Zeron CLI. Start with init when components.json is missing; inspect add --dry-run before installing. React 19 and Tailwind 4 are required; Next-only blocks must not be directly installed in Vite. Workspace @zeron/ui imports do not establish consumer import paths.\n\n## Design rules\n\nUse semantic tokens and public variants, sizes and icon slots. Preserve keyboard focus, loading and disabled states. Reuse the host shell, assign one scroll owner per region, and replace demo data with real callbacks. A clean static check is not runtime verification.\n`;
    const list = items.filter((item) => item.kind !== "support").map((item) => `- [${item.title.en}](${item.markdown}): ${item.summary.en}${item.installable ? ` Registry: ${item.registryName}.` : " Not installable."}`).join("\n");
    const guideIndex = [...guides.values()].map((guide) => `- [${guide.meta.name}](${site}/agent-guides/${guide.key})`).join("\n");
    const texts = {
      "llms-small.txt": `${intro}\nFor item-level context read the catalog and Markdown links.\n`,
      "llms.txt": `${intro}\n## Catalog\n\n${list}\n\n## Detailed agent guides\n\n${guideIndex}\n`,
    };
    const contextFiles = buildFullContext({ intro, guides: [...guides.values()], site });
    texts["llms-full.txt"] = contextFiles.get("llms-full.txt");
    for (const [filename, body] of contextFiles) if (filename !== "llms-full.txt") publicFiles.set(filename, body);
    for (const [name, body] of Object.entries(texts)) {
      const limit = name === "llms-small.txt" ? contextBudgets.small : name === "llms.txt" ? contextBudgets.index : contextBudgets.full;
      assertContextBudget(name, body, limit);
      if (check) {
        if (await readFile(path.join(root, "public", name), "utf8").catch(() => null) !== body) throw new Error(`${name} is stale; run pnpm agents:build`);
      } else publicFiles.set(name, body);
    }
    assertContextBudget("ai/instructions.md", intro, contextBudgets.instructions);
    publicFiles.set("ai/instructions.md", intro);
    if (!check && writeOutputs) {
      for (const [relative, body] of publicFiles) {
        const target = path.join(output, "public", relative);
        await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, body);
      }
      const runtimePath = path.join(output, "docs/generated/agent-runtime/current.json");
      await mkdir(path.dirname(runtimePath), { recursive: true }); await writeFile(runtimePath, serialize(runtime));
      await writeFile(path.join(path.dirname(runtimePath), "bundle.json"), serialize({ currentVersion: catalogVersion, versions: [runtime] }));
    }
    return { runtime: canonical(runtime), guideCount: guides.size, files: publicFiles.size };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const options = { mode: "development", check: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (seen.has(key)) throw new Error("Duplicate agent build option");
    seen.add(key);
    if (key === "--check") options.check = true;
    else if (["--mode", "--release"].includes(key) && args[index + 1] && !args[index + 1].startsWith("--")) options[key.slice(2)] = args[++index];
    else throw new Error("Usage: agents:build [--check] [--mode development] | --mode release --release <committed-record-or-selection>");
  }
  if (options.mode === "development" && !options.release) {
    const result = await buildAgentCatalog({ check: options.check });
    console.log(`Agent catalog: ${result.runtime.catalog.items.length} items, ${result.guideCount} guides, ${result.runtime.catalog.catalogVersion}`);
  } else if (options.mode === "release" && options.release && !options.check) {
    const { restoreAgentRelease } = await import("./restore-agent-release.mjs");
    const result = await restoreAgentRelease({ release: options.release, requireCommitted: true });
    console.log(`Restored frozen agent catalog ${result.catalogVersion}; ${result.versions.length} versions, ${result.downloadedBytes} verified public bytes`);
  } else throw new Error("Release mode needs an explicit committed record and cannot fall back to development or use --check");
}
