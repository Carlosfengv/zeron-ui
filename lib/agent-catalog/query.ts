import { createHash } from "node:crypto";
import { toolSchemas, type QueryResult, type ResultMeta, type ToolErrorCode, type ToolInputs, type ToolName } from "./contracts";
import type { AgentRuntime, CatalogItem } from "./schema";
import { renderExampleLinks } from "./example-links.mjs";

const normalize = (text: string) => text.normalize("NFKC").trim().toLocaleLowerCase("en-US").replace(/\s+/g, " ");
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const jsonBytes = (value: unknown) => Buffer.byteLength(JSON.stringify(value), "utf8");
class QueryError extends Error {
  constructor(readonly code: ToolErrorCode, message: string, readonly details: Record<string, unknown> = {}) { super(message); }
}

export function compatibility(item: CatalogItem, framework?: "react" | "next" | "vite") {
  if (!item.framework || !framework) return "unknown" as const;
  return item.framework === "react" || (item.framework === "next" && framework === "next") ? "compatible" as const : "incompatible" as const;
}
function matches(item: CatalogItem, filters: ToolInputs["list_components"] | ToolInputs["search_components"]) {
  return (filters.includeSupportItems || item.kind !== "support") && (!filters.kind || item.kind === filters.kind)
    && (!filters.framework || compatibility(item, filters.framework) !== "incompatible")
    && (filters.installable === undefined || item.installable === filters.installable)
    && (!("collection" in filters) || !filters.collection || item.collection === filters.collection)
    && (!("domain" in filters) || !filters.domain || item.domains.includes(filters.domain));
}
function summary(item: CatalogItem, locale: "zh-CN" | "en", framework?: "react" | "next" | "vite", matchedBy: string[] = []) {
  const titleLocale = item.title[locale] ? locale : "en";
  const summaryLocale = item.summary[locale] ? locale : "en";
  return { id: item.id, registryName: item.registryName, title: item.title[titleLocale]!, summary: item.summary[summaryLocale]!,
    titleLocale, summaryLocale, kind: item.kind, collection: item.collection, framework: item.framework,
    compatibility: compatibility(item, framework), installable: item.installable, coverage: item.coverage,
    docs: item.docs, markdown: item.markdown, detailUrl: item.detailUrl, matchedBy };
}
export function scoreItem(item: CatalogItem, query: string) {
  const needle = normalize(query);
  if (normalize(item.id) === needle || item.aliases.some((alias) => normalize(alias) === needle)) return { score: 1000000, reasons: ["exact identity or alias"] };
  if (item.aliases.some((alias) => normalize(alias).startsWith(needle)) || normalize(item.id).startsWith(needle)) return { score: 10000, reasons: ["identity prefix"] };
  const fields = [
    { name: "title", values: Object.values(item.title), weight: 120 },
    { name: "keywords", values: item.keywords, weight: 100 },
    { name: "useCases", values: item.useCases, weight: 70 },
    { name: "summary", values: Object.values(item.summary), weight: 30 },
  ];
  const stopWords = new Set(["a", "an", "the", "in", "for", "with", "to", "of", "and", "my", "build", "create", "page", "component"]);
  const tokens = needle.split(/[^\p{L}\p{N}]+/u).filter((token) => token.length > 1 && !stopWords.has(token));
  let score = 0;
  const reasons: string[] = [];
  for (const field of fields) {
    const values = field.values.filter((value): value is string => typeof value === "string").map(normalize);
    const exact = values.some((value) => value === needle);
    const phrase = values.some((value) => value.includes(needle));
    const reverse = values.filter((value) => value.length >= 2 && needle.includes(value)).map((value) => Math.min([...value].length, 10)).sort((a, b) => b - a).slice(0, 3).reduce((total, weight) => total + weight, 0);
    const hits = tokens.filter((token) => values.some((value) => value.includes(token))).length;
    const points = (exact ? 5 : phrase ? 3 : 0) + reverse + hits;
    if (points) { score += field.weight * points; reasons.push(field.name); }
  }
  return { score, reasons };
}

function cursorOffset(cursor: string | undefined, hash: string, version: string, total: number) {
  if (!cursor) return 0;
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error("format");
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (!value || value.v !== version || value.f !== hash || !Number.isSafeInteger(value.o) || value.o < 0 || value.o >= total) throw new Error("position");
    return value.o as number;
  } catch { throw new QueryError("INVALID_CURSOR", "Cursor does not match this version, query, or page position. Start the query again."); }
}
const cursorFor = (offset: number, hash: string, version: string) => Buffer.from(JSON.stringify({ v: version, f: hash, o: offset })).toString("base64url");

function resolveItem(runtime: AgentRuntime, value: string) {
  const exact = runtime.catalog.items.find((item) => item.id === value);
  if (exact) return exact;
  const candidates = runtime.catalog.items.filter((item) => item.aliases.some((alias) => normalize(alias) === normalize(value)));
  if (!candidates.length) throw new QueryError("ITEM_NOT_FOUND", "No catalog item has this identity or registered alias.", { id: value });
  if (candidates.length > 1) throw new QueryError("AMBIGUOUS_ITEM", "Use a stable ID to disambiguate this alias.", { id: value, candidates: candidates.map((item) => item.id) });
  return candidates[0];
}

type Chapter = { name: string; text: string; contentLocale: "zh-CN" | "en" | null; startByte?: number; endByte?: number };
type MarkdownFence = { opening: string; marker: string } | null;
function nextMarkdownFence(line: string, active: MarkdownFence): MarkdownFence {
  const fence = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
  if (!fence) return active;
  if (!active) return fence[1][0] === "`" && fence[2].includes("`") ? null : { opening: line, marker: fence[1] };
  return fence[1][0] === active.marker[0] && fence[1].length >= active.marker.length && !fence[2].trim() ? null : active;
}
// Split on lines and close/reopen long fenced blocks so each part remains valid Markdown.
function chapterParts(chapter: Chapter): Chapter[] {
  if (jsonBytes(chapter) <= 18000) return [chapter];
  const parts: string[] = [];
  let text = "";
  let fence: MarkdownFence = null;
  let closing = "";
  for (const originalLine of chapter.text.split("\n")) {
    // A pathological long line is explicitly segmented by Unicode code point.
    const lines: string[] = [];
    let line = "";
    let lineBytes = 2;
    for (const point of originalLine) {
      const pointBytes = jsonBytes(point) - 2;
      if (lineBytes + pointBytes > 10000) { lines.push(line); line = ""; lineBytes = 2; }
      line += point; lineBytes += pointBytes;
    }
    lines.push(line);
    for (const current of lines) {
      if (jsonBytes(text + current + "\n" + closing) > 16000 && text) {
        parts.push(text + closing);
        text = fence ? `${fence.opening}\n` : "";
      }
      text += `${current}\n`;
      fence = nextMarkdownFence(current, fence);
      closing = fence ? `${fence.marker}\n` : "";
    }
  }
  if (text) parts.push(text + closing);
  return parts.map((text, index) => ({ ...chapter, name: `${chapter.name} (part ${index + 1}/${parts.length})`, text }));
}
// Text references preserve every byte; Markdown display helpers must not alter them.
function textParts(chapter: Chapter): Chapter[] {
  const parts: Chapter[] = [];
  let text = "";
  let serializedBytes = 2;
  let startByte = 0;
  let endByte = 0;
  const flush = () => {
    parts.push({ ...chapter, text, startByte, endByte });
    text = ""; serializedBytes = 2; startByte = endByte;
  };
  for (const point of chapter.text) {
    const pointBytes = jsonBytes(point) - 2;
    if (serializedBytes + pointBytes > 16000 && text) flush();
    text += point; serializedBytes += pointBytes; endByte += Buffer.byteLength(point, "utf8");
  }
  if (text || !parts.length) flush();
  return parts;
}
function readChapters(chapters: Chapter[], cursor: string | undefined, identity: unknown, meta: ResultMeta, baseData: Record<string, unknown> = {}, availableSections = chapters.map((chapter) => chapter.name), split = chapterParts) {
  const chunks = chapters.flatMap(split);
  const hash = fingerprint(identity);
  const offset = cursorOffset(cursor, hash, meta.catalogVersion!, chunks.length);
  const sections: Chapter[] = [];
  let next = offset;
  // Reserve space for text-only clients, item metadata and protocol packaging.
  while (next < chunks.length && jsonBytes({ meta, data: { ...baseData, sections: [...sections, chunks[next]], availableSections } }) < 24000) sections.push(chunks[next++]);
  if (next === offset && next < chunks.length) throw new Error("Chapter metadata exceeds response budget");
  return { sections, availableSections, truncated: next < chunks.length,
    nextCursor: next < chunks.length ? cursorFor(next, hash, meta.catalogVersion!) : null };
}
function markdownSections(text: string): Chapter[] {
  const lines = text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "").split("\n");
  const chapters: Chapter[] = [];
  let name = "Introduction";
  let content: string[] = [];
  let fence: MarkdownFence = null;
  const seen = new Map<string, number>();
  const flush = () => {
    if (!content.join("\n").trim()) return;
    const count = (seen.get(name) ?? 0) + 1; seen.set(name, count);
    chapters.push({ name: count === 1 ? name : `${name} (${count})`, text: content.join("\n"), contentLocale: null });
  };
  for (const line of lines) {
    fence = nextMarkdownFence(line, fence);
    const heading = !fence && line.match(/^#{1,3}\s+(.+?)\s*#*$/);
    if (heading) { flush(); name = heading[1]; content = [line]; } else content.push(line);
  }
  flush();
  return chapters;
}

export function createCatalogQuery(snapshots: { currentVersion: string; versions: AgentRuntime[] }) {
  const versions = new Map(snapshots.versions.map((runtime) => [runtime.catalog.catalogVersion, runtime]));
  function run(input: { locale: "zh-CN" | "en"; catalogVersion?: string }, operation: (runtime: AgentRuntime, meta: ResultMeta) => Record<string, unknown>): QueryResult {
    const runtime = versions.get(input.catalogVersion ?? snapshots.currentVersion);
    const meta: ResultMeta = { schemaVersion: 1, requestedLocale: input.locale, catalogVersion: runtime?.catalog.catalogVersion ?? null,
      catalogUrl: runtime?.catalog.catalogUrl ?? null, sourceRevision: runtime?.catalog.sourceRevision ?? null, mode: runtime?.catalog.mode ?? null,
      warnings: runtime?.catalog.mode === "development" ? ["Development catalog: resources and installation combinations have not been published and verified."] : [] };
    try {
      if (!runtime) throw new QueryError("VERSION_UNAVAILABLE", "This deployment does not contain the requested catalog. Read the previously saved immutable catalog URL or start with the current catalog.", { requestedVersion: input.catalogVersion, availableVersions: [...versions.keys()] });
      return { meta, data: operation(runtime, meta) };
    } catch (error) {
      if (!(error instanceof QueryError)) throw error;
      return { meta, error: { code: error.code, message: error.message, details: error.details } };
    }
  }
  function list(input: ToolInputs["list_components"] | ToolInputs["search_components"]): QueryResult {
    return run(input, (runtime, meta) => {
      // The cursor binds the resolved version separately; making it explicit
      // after discovery must not change the query/filter fingerprint.
      const { cursor, catalogVersion: _catalogVersion, ...parameters } = input;
      const hash = fingerprint({ sort: "keyword-v1", ...parameters, ...("query" in input ? { query: normalize(input.query) } : {}) });
      const ranked = runtime.catalog.items.filter((item) => matches(item, input)).map((item) => ({ item, ...("query" in input ? scoreItem(item, input.query) : { score: 1, reasons: [] }) }))
        .filter((match) => match.score > 0).sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id, "en"));
      const offset = cursorOffset(cursor, hash, runtime.catalog.catalogVersion, ranked.length);
      const items = [];
      let next = offset;
      while (next < ranked.length && items.length < input.limit) {
        const match = ranked[next];
        const row = summary(match.item, input.locale, input.framework, match.reasons);
        if (jsonBytes({ meta, items: [...items, row] }) > 18000) break;
        items.push(row); next++;
      }
      if (!items.length && ranked.length) throw new Error("Catalog summary exceeds response budget");
      return { items, total: ranked.length, nextCursor: next < ranked.length ? cursorFor(next, hash, runtime.catalog.catalogVersion) : null };
    });
  }
  function component(input: ToolInputs["get_component"]): QueryResult {
    return run(input, (runtime, meta) => {
      const item = resolveItem(runtime, input.id);
      const detail = runtime.details[item.id];
      const content: Record<string, Chapter> = {
        overview: { name: "overview", text: `${item.title.en}\n${item.summary[input.locale] ?? item.summary.en}\nCoverage: ${item.coverage}`, contentLocale: item.summary[input.locale] ? input.locale : "en" },
        usage: { name: "usage", text: [...item.useCases, ...item.whenNotToUse.map((value) => `Avoid: ${value}`), detail.guide ?? "No detailed guide is maintained. Check the installed public types before using this item."].join("\n\n"), contentLocale: detail.guideLocale },
        api: { name: "api", text: `Public exports: ${detail.exports.join(", ") || "Not recorded"}\n${detail.keyApi.join("\n")}\nThe installed source is authoritative. This is not a complete Props declaration.`, contentLocale: "en" },
        examples: { name: "examples", text: detail.examples ? renderExampleLinks(detail.examples) : detail.guide ? "Examples, if maintained, are included in the usage guide. No separate runnable example has been verified for this catalog item." : "No maintained example is available for this item.", contentLocale: "en" },
        installation: { name: "installation", text: `Installable: ${item.installable}\nRegistry name: ${item.registryName ?? "none"}\nFramework: ${item.framework ?? "unknown"}\nReact: ${item.react ?? "unknown"}; Tailwind: ${item.tailwind ?? "unknown"}\nUse get_install_command to check the exact published CLI and resource combination.`, contentLocale: "en" },
        sources: { name: "sources", text: [`Documentation: ${item.docs ?? "none"}`, `Markdown: ${item.markdown}`, ...detail.sourceFiles, `Dependencies: ${detail.dependencies.join(", ")}`, `Registry dependencies: ${detail.registryDependencies.join(", ")}`].join("\n"), contentLocale: "en" },
      };
      if (item.coverage === "basic") meta.warnings.push("Only basic metadata is available; no detailed guide or runnable example is implied.");
      const selected = [...new Set(input.sections ?? Object.keys(content))];
      const baseData = { item: summary(item, input.locale) };
      return { ...baseData, ...readChapters(selected.map((name) => content[name]), input.cursor, { tool: "get_component", id: item.id, selected, locale: input.locale }, meta, baseData, Object.keys(content)) };
    });
  }
  function install(input: ToolInputs["get_install_command"]): QueryResult {
    return run(input, (runtime, meta) => {
      const issues: { id: string; code: ToolErrorCode; message: string }[] = [];
      const selected = new Map<string, CatalogItem>();
      for (const id of input.ids) {
        try {
          const item = resolveItem(runtime, id); selected.set(item.id, item);
          if (!item.installable) throw new QueryError("NOT_INSTALLABLE", "This item is a reference or demo without an installation artifact.");
          if (compatibility(item, input.targetFramework) === "incompatible") throw new QueryError("FRAMEWORK_INCOMPATIBLE", "This item is incompatible with the requested framework.");
        } catch (error) {
          if (!(error instanceof QueryError)) throw error;
          issues.push({ id, code: error.code, message: error.message });
        }
      }
      if (issues.length) throw new QueryError(issues[0].code, "No commands were generated because at least one item failed validation.", { items: issues, commands: null });
      if (!input.targetFramework || input.targetFramework === "react") throw new QueryError("TARGET_ENVIRONMENT_REQUIRED", "Inspect the local project and specify next or vite before generating an executable command.", { commands: null, prerequisites: ["React 19", "Tailwind 4", "Next.js or Vite", "npm or pnpm"] });
      const verification = runtime.installation;
      const matrix = verification?.matrices.find((entry) => entry.framework === input.targetFramework && entry.packageManager === input.packageManager);
      const items = [...selected.values()];
      if (!verification || !matrix || items.some((item) => !item.framework || !verification.staticCheckedItems.includes(item.id))) throw new QueryError("INSTALLATION_UNVERIFIED", "The exact published CLI, resource closure, and target environment have not been verified together.", { commands: null,
        installationGuide: runtime.catalog.mode === "release" ? `${new URL(runtime.catalog.catalogUrl!).origin}/skills/releases/${runtime.catalog.skillVersion}/install.md` : "https://zeron-ui.vercel.app/skills/install.md" });
      const executable = input.packageManager === "npm" ? "npx" as const : "pnpm" as const;
      const args = [...(executable === "pnpm" ? ["dlx"] : []), `zeron-ui@${verification.cliVersion}`, "add", ...items.map((item) => item.registryName!), "--registry", verification.registryBase];
      const dryRun = [...args, "--dry-run"];
      const shellArgument = (value: string) => /^[a-zA-Z0-9@:/._-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
      const command = (arguments_: string[]) => [executable, ...arguments_].map(shellArgument).join(" ");
      const itemVerification = items.map((item) => ({ id: item.id, staticClosureChecked: true as const, consumerTested: matrix.testedItems.includes(item.id) }));
      if (itemVerification.some((item) => !item.consumerTested)) meta.warnings.push("The installation engine is verified for this environment; some requested items have only static dependency-closure verification.");
      return { cliVersion: verification.cliVersion, cliDistIntegrity: verification.cliDistIntegrity, registryBase: verification.registryBase,
        packageManager: input.packageManager, targetFramework: input.targetFramework, commands: { dryRun: command(dryRun), install: command(args) },
        arguments: { executable, dryRun, install: args }, itemVerification,
        prerequisites: ["React 19 and Tailwind 4", "Initialize components.json with the pinned CLI if missing", "Review add --dry-run and local source conflicts before installation", "Run local type, build, and interaction checks after business integration"] };
    });
  }
  function skill(input: ToolInputs["get_skill"]): QueryResult {
    return run(input, (runtime, meta) => {
      if (!Object.hasOwn(runtime.skills, input.name)) throw new QueryError("SKILL_NOT_FOUND", "This skill is not included in the selected catalog.");
      const references = runtime.skills[input.name];
      if (!Object.hasOwn(references, input.reference)) throw new QueryError("REFERENCE_NOT_FOUND", "Use an exact reference from the skill manifest.", { references: Object.keys(references).sort() });
      const text = references[input.reference];
      const markdown = input.reference.endsWith(".md");
      const chapters: Chapter[] = markdown ? markdownSections(text) : [{ name: "Content", text, contentLocale: null }];
      const selected = input.section ? chapters.filter((chapter) => chapter.name === input.section) : chapters;
      if (!selected.length) throw new QueryError("SECTION_NOT_FOUND", "This section is not included in the selected reference.", { availableSections: chapters.map((chapter) => chapter.name) });
      const baseData = { name: input.name, reference: input.reference, references: Object.keys(references).sort(), skillVersion: runtime.catalog.skillVersion,
        contentFormat: markdown ? "markdown" : "text", sourceBytes: Buffer.byteLength(text, "utf8"), sourceSha256: createHash("sha256").update(text, "utf8").digest("hex"),
        installationGuide: runtime.catalog.mode === "release" ? `${new URL(runtime.catalog.catalogUrl!).origin}/skills/releases/${runtime.catalog.skillVersion}/install.md` : "https://zeron-ui.vercel.app/skills/install.md" };
      return { ...baseData, ...readChapters(selected, input.cursor, { tool: "get_skill", name: input.name, reference: input.reference, section: input.section, locale: input.locale }, meta, baseData, chapters.map((chapter) => chapter.name), markdown ? chapterParts : textParts) };
    });
  }
  return {
    call(name: ToolName, input: unknown): QueryResult {
      switch (name) {
        case "search_components": return list(toolSchemas.search_components.parse(input));
        case "list_components": return list(toolSchemas.list_components.parse(input));
        case "get_component": return component(toolSchemas.get_component.parse(input));
        case "get_install_command": return install(toolSchemas.get_install_command.parse(input));
        case "get_skill": return skill(toolSchemas.get_skill.parse(input));
      }
    },
  };
}
