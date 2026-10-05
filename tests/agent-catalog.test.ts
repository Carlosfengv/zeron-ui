import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import evaluation from "../docs/agent-data/search-evaluation.json";
import { outputSchemas, type QueryResult } from "../lib/agent-catalog/contracts";
import { createCatalogQuery } from "../lib/agent-catalog/query";
import { loadSnapshots, snapshots } from "../lib/agent-catalog/runtime";
import { runtimeSchema, type AgentRuntime } from "../lib/agent-catalog/schema";
import { addSkillReference } from "./helpers/skill-reference-fixture";

const query = createCatalogQuery(snapshots);
const current = snapshots.versions.find((entry) => entry.catalog.catalogVersion === snapshots.currentVersion)!;
function page(result: QueryResult) {
  const parsed = outputSchemas.search_components.parse(result);
  if (!parsed.data) throw new Error(parsed.error?.code);
  return parsed.data;
}
function error(result: QueryResult) {
  if (!("error" in result)) throw new Error("Expected a tool error");
  return result.error;
}
function verifiedFixture() {
  const runtime: AgentRuntime = structuredClone(current);
  runtime.catalog.mode = "release";
  runtime.catalog.catalogUrl = `https://fixtures.example/ai/releases/${runtime.catalog.catalogVersion}/catalog.json`;
  runtime.catalog.sourceRevision = "a".repeat(40);
  runtime.catalog.registryReleaseId = "fixture-01";
  runtime.installation = { cliVersion: "1.2.3", cliDistIntegrity: `sha512-${Buffer.alloc(64).toString("base64")}`,
    registryBase: "https://fixtures.example/r/releases/fixture-01", registryManifestSha256: runtime.catalog.registryManifestSha256,
    staticCheckedItems: runtime.catalog.items.filter((item) => item.installable).map((item) => item.id),
    matrices: [{ framework: "vite", packageManager: "pnpm", testedItems: ["component:button"], passed: true }] };
  return loadSnapshots({ currentVersion: runtime.catalog.catalogVersion, versions: [runtime] });
}

describe("catalog query against the generated full catalog", () => {
  it("distinguishes document slug, immutable identity, and installation name", () => {
    const result = outputSchemas.get_component.parse(query.call("get_component", { id: "resource-catalog-01", locale: "en" }));
    expect(result.data?.item.id).toBe("block:model-mcp-marketplace-01");
    expect(result.data?.item.registryName).toBe("model-mcp-marketplace-01");
  });
  it("meets the bilingual task evaluation threshold without counting negative cases", () => {
    const knownIds = new Set(current.catalog.items.map((item) => item.id));
    for (const task of evaluation) expect(task.expected.every((id) => knownIds.has(id))).toBe(true);
    expect(evaluation.filter((entry) => entry.locale === "zh-CN")).toHaveLength(18);
    expect(evaluation.filter((entry) => entry.locale === "en")).toHaveLength(15);
    const failures = evaluation.filter((entry) => {
      const ids = page(query.call("search_components", { query: entry.query, locale: entry.locale, limit: 3 })).items.map((item) => item.id);
      return !entry.expected.some((id) => ids.includes(id));
    });
    expect(failures, JSON.stringify(failures, null, 2)).toHaveLength(0);
  });
  it("returns empty results for a valid unmatched query and rejects empty queries", () => {
    expect(page(query.call("search_components", { query: "unobtainium-xyzqplkjh" }))).toEqual({ items: [], total: 0, nextCursor: null });
    expect(() => query.call("search_components", { query: "  " })).toThrow();
    expect(() => query.call("list_components", { limit: 21 })).toThrow();
    expect(() => query.call("list_components", { unknownField: true })).toThrow();
  });
  it("paginates the entire catalog without duplication, hiding support items by default", () => {
    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const data = page(query.call("list_components", { limit: 20, ...(cursor ? { cursor } : {}) }));
      ids.push(...data.items.map((item) => item.id)); cursor = data.nextCursor;
    } while (cursor);
    expect(ids.length).toBe(current.catalog.items.filter((item) => item.kind !== "support").length);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.some((id) => id.startsWith("support:"))).toBe(false);
    expect(page(query.call("list_components", { kind: "support", includeSupportItems: true })).items.length).toBeGreaterThan(0);
  });
  it("binds cursors to query, locale, filters, and version", () => {
    const { nextCursor } = page(query.call("list_components", { limit: 1 }));
    expect(nextCursor).not.toBeNull();
    expect(error(query.call("list_components", { limit: 1, locale: "en", cursor: nextCursor })).code).toBe("INVALID_CURSOR");
    expect(error(query.call("list_components", { limit: 1, kind: "page", cursor: nextCursor })).code).toBe("INVALID_CURSOR");
    expect(error(query.call("list_components", { cursor: "__proto__" })).code).toBe("INVALID_CURSOR");
  });
  it.each(["list_components", "search_components"] as const)("continues %s when the discovered version becomes explicit", (name) => {
    const input = { limit: 1, ...(name === "search_components" ? { query: "resource" } : {}) };
    const first = query.call(name, input);
    const firstPage = page(first);
    expect(firstPage.nextCursor).not.toBeNull();
    const second = page(query.call(name, { ...input, catalogVersion: first.meta.catalogVersion, cursor: firstPage.nextCursor }));
    expect(second.items).toHaveLength(1);
    expect(second.items[0].id).not.toBe(firstPage.items[0].id);
    const implicitAgain = page(query.call(name, { ...input, cursor: second.nextCursor }));
    expect(implicitAgain.items[0].id).not.toBe(second.items[0].id);
  });
  it.each(["list_components", "search_components"] as const)("keeps %s cursors bound to the selected version and filters", (name) => {
    const older = structuredClone(current);
    older.catalog.catalogVersion = "b".repeat(64);
    const versioned = createCatalogQuery(loadSnapshots({ currentVersion: current.catalog.catalogVersion, versions: [current, older] }));
    const input = { limit: 1, ...(name === "search_components" ? { query: "resource" } : {}) };
    const { nextCursor } = page(versioned.call(name, input));
    expect(nextCursor).not.toBeNull();
    expect(error(versioned.call(name, { ...input, cursor: nextCursor, catalogVersion: older.catalog.catalogVersion })).code).toBe("INVALID_CURSOR");
    expect(error(versioned.call(name, { ...input, cursor: nextCursor, locale: "en" })).code).toBe("INVALID_CURSOR");
    expect(error(versioned.call(name, { ...input, cursor: nextCursor, framework: "vite" })).code).toBe("INVALID_CURSOR");
    if (name === "search_components") expect(error(versioned.call(name, { ...input, cursor: nextCursor, query: "button" })).code).toBe("INVALID_CURSOR");
  });
  it("never recommends known Next-only blocks for an explicit Vite target", () => {
    const data = page(query.call("list_components", { framework: "vite", limit: 20 }));
    expect(data.items.every((item) => item.framework !== "next")).toBe(true);
    expect(page(query.call("search_components", { query: "cluster-environment-detail-01", framework: "vite" })).items.some((item) => item.id === "block:cluster-environment-detail-01")).toBe(false);
    expect(error(query.call("get_install_command", { ids: ["cluster-environment-detail-01"], packageManager: "npm", targetFramework: "vite" })).code).toBe("FRAMEWORK_INCOMPATIBLE");
  });
  it("fails batch installation atomically and refuses unverified development commands", () => {
    const failed = error(query.call("get_install_command", { ids: ["button", "workflow"], packageManager: "npm", targetFramework: "vite" }));
    expect(failed.code).toBe("NOT_INSTALLABLE"); expect(failed.details.commands).toBeNull();
    expect(error(query.call("get_install_command", { ids: ["button"], packageManager: "npm" })).code).toBe("TARGET_ENVIRONMENT_REQUIRED");
    expect(error(query.call("get_install_command", { ids: ["button"], packageManager: "npm", targetFramework: "vite" })).code).toBe("INSTALLATION_UNVERIFIED");
    expect(error(query.call("get_component", { id: "__proto__" })).code).toBe("ITEM_NOT_FOUND");
  });
  it("generates pinned commands only for the verified fixture matrix and reports per-item scope", () => {
    const fixtures = createCatalogQuery(verifiedFixture());
    const result = outputSchemas.get_install_command.parse(fixtures.call("get_install_command", { ids: ["button", "button", "input"], packageManager: "pnpm", targetFramework: "vite" }));
    if (!result.data) throw new Error(result.error?.code);
    expect(result.data.commands.install).toBe("pnpm dlx zeron-ui@1.2.3 add button input --registry https://fixtures.example/r/releases/fixture-01");
    expect(result.data.arguments.dryRun.at(-1)).toBe("--dry-run");
    expect(result.data.itemVerification.map((item) => item.consumerTested)).toEqual([true, false]);
    expect(result.meta.warnings.length).toBeGreaterThan(0);
    expect(error(fixtures.call("get_install_command", { ids: ["button"], packageManager: "npm", targetFramework: "vite" })).code).toBe("INSTALLATION_UNVERIFIED");
  });
  it("isolates selected versions and never substitutes a new guide for an unavailable version", () => {
    const old = structuredClone(current);
    old.catalog.catalogVersion = "b".repeat(64);
    old.details["component:button"].guide = "Old guide only";
    const loaded = loadSnapshots({ currentVersion: current.catalog.catalogVersion, versions: [current, old] });
    const versioned = createCatalogQuery(loaded);
    const prior = versioned.call("get_component", { id: "button", catalogVersion: old.catalog.catalogVersion, sections: ["usage"] });
    expect(JSON.stringify(prior)).toContain("Old guide only");
    expect(JSON.stringify(versioned.call("get_component", { id: "button", sections: ["usage"] }))).not.toContain("Old guide only");
    const unavailable = versioned.call("get_component", { id: "button", catalogVersion: "c".repeat(64) });
    expect(error(unavailable).code).toBe("VERSION_UNAVAILABLE"); expect(unavailable.meta.catalogVersion).toBeNull(); expect(unavailable.meta.catalogUrl).toBeNull();
    expect(() => { loaded.versions[0].details["component:button"].guide = "mutation"; }).toThrow();
  });
  it("returns reference allowlists and precise sections without file traversal", () => {
    const result = outputSchemas.get_skill.parse(query.call("get_skill", { name: "zeron-page-builder" }));
    if (!result.data) throw new Error(result.error?.code);
    expect(result.data.references).toContain("SKILL.md"); expect(result.data.availableSections.length).toBeGreaterThan(1);
    expect(error(query.call("get_skill", { name: "zeron-page-builder", reference: "../../package.json" })).code).toBe("REFERENCE_NOT_FOUND");
    expect(error(query.call("get_skill", { name: "zeron-page-builder", reference: "__proto__" })).code).toBe("REFERENCE_NOT_FOUND");
    expect(error(query.call("get_skill", { name: "zeron-page-builder", section: "Not a real heading" })).code).toBe("SECTION_NOT_FOUND");
  });
  it("requires stable IDs for ambiguous aliases and marks unknown compatibility", () => {
    const fixture = structuredClone(current);
    for (const id of ["component:button", "component:input"]) {
      fixture.catalog.items.find((item) => item.id === id)!.aliases.push("shared-alias");
      fixture.details[id].item.aliases.push("shared-alias");
    }
    const instance = createCatalogQuery(loadSnapshots({ currentVersion: fixture.catalog.catalogVersion, versions: [fixture] }));
    expect(error(instance.call("get_component", { id: "shared-alias" })).code).toBe("AMBIGUOUS_ITEM");
    const demos = page(query.call("list_components", { framework: "vite", installable: false }));
    expect(demos.items.length).toBeGreaterThan(0);
    expect(demos.items.every((item) => item.compatibility === "unknown")).toBe(true);
  });
  it("reports all selectable chapters and ignores headings inside nested Markdown fences", () => {
    const fixture = structuredClone(current);
    addSkillReference(fixture, "references/fences.md", "# Example\n\n````md\n```tsx\n## Not a section\n```\n`````\n\n## Actual section\nBody\n");
    const instance = createCatalogQuery(loadSnapshots({ currentVersion: fixture.catalog.catalogVersion, versions: [fixture] }));
    const skill = outputSchemas.get_skill.parse(instance.call("get_skill", { name: "zeron-page-builder", reference: "references/fences.md", section: "Actual section" }));
    expect(skill.data?.availableSections).toEqual(["Example", "Actual section"]);
    expect(skill.data?.sections.map((section) => section.name)).toEqual(["Actual section"]);
    const component = outputSchemas.get_component.parse(instance.call("get_component", { id: "button", sections: ["api"] }));
    expect(component.data?.availableSections).toEqual(["overview", "usage", "api", "examples", "installation", "sources"]);
  });
  it("paginates a large reference completely without exceeding response or Markdown block budgets", () => {
    const fixture = structuredClone(current);
    addSkillReference(fixture, "references/large.md", "# Large example\n\n```tsx\n" + Array.from({ length: 7000 }, (_, index) => `// row ${index}: 中文`).join("\n") + "\n```\n");
    const instance = createCatalogQuery(loadSnapshots({ currentVersion: fixture.catalog.catalogVersion, versions: [fixture] }));
    let cursor: string | null = null;
    const pages: string[] = [];
    do {
      const result = outputSchemas.get_skill.parse(instance.call("get_skill", { name: "zeron-page-builder", reference: "references/large.md", ...(cursor ? { cursor } : {}) }));
      if (!result.data) throw new Error(result.error?.code);
      expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(65536);
      for (const section of result.data.sections) {
        expect((section.text.match(/^```/gm) ?? []).length % 2).toBe(0);
        pages.push(section.text);
      }
      cursor = result.data.nextCursor;
      if (cursor) expect(result.data.truncated).toBe(true);
    } while (cursor);
    expect(pages.length).toBeGreaterThan(1);
    const combined = pages.join("\n");
    for (let index = 0; index < 7000; index++) expect(combined).toContain(`// row ${index}: 中文`);
  });
  it("rejects forged runtime installation metadata or missing relationships", () => {
    const fixture = structuredClone(verifiedFixture().versions[0]);
    fixture.installation!.registryManifestSha256 = "f".repeat(64);
    expect(runtimeSchema.safeParse(fixture).success).toBe(false);
    const missing = structuredClone(current);
    missing.catalog.items[0].related = ["component:missing"];
    expect(runtimeSchema.safeParse(missing).success).toBe(false);
    expect(() => loadSnapshots({ currentVersion: "f".repeat(64), versions: [current] })).toThrow();
  });
  it("preserves raw non-Markdown UTF-8 with byte ranges and version-bound continuation", () => {
    const fixture = structuredClone(current);
    const raw = "\uFEFF---\r\n# not a Markdown heading\r\n```js\r\n" + "中文🙂\\\"\t".repeat(12000) + "\r\n```";
    addSkillReference(fixture, "scripts/raw-reference.mjs", raw);
    const older = structuredClone(fixture);
    older.catalog.catalogVersion = "d".repeat(64);
    addSkillReference(older, "scripts/raw-reference.mjs", "old text without final newline");
    const instance = createCatalogQuery(loadSnapshots({ currentVersion: fixture.catalog.catalogVersion, versions: [fixture, older] }));
    let cursor: string | null = null;
    let position = 0;
    let count = 0;
    const chunks: Buffer[] = [];
    do {
      const result = outputSchemas.get_skill.parse(instance.call("get_skill", { name: "zeron-page-builder", reference: "scripts/raw-reference.mjs", section: "Content", ...(cursor ? { cursor } : {}) }));
      if (!result.data) throw new Error(result.error?.code);
      expect(result.data.contentFormat).toBe("text");
      expect(result.data.availableSections).toEqual(["Content"]);
      expect(result.data.sourceBytes).toBe(Buffer.byteLength(raw));
      expect(result.data.sourceSha256).toBe(createHash("sha256").update(raw).digest("hex"));
      for (const section of result.data.sections) {
        const bytes = Buffer.from(section.text);
        expect(section.name).toBe("Content");
        expect(section.startByte).toBe(position);
        position += bytes.length;
        expect(section.endByte).toBe(position);
        chunks.push(bytes);
      }
      cursor = result.data.nextCursor;
      if (cursor) expect(error(instance.call("get_skill", { name: "zeron-page-builder", reference: "scripts/raw-reference.mjs", section: "Content", cursor, catalogVersion: older.catalog.catalogVersion })).code).toBe("INVALID_CURSOR");
      expect(++count).toBeLessThan(100);
    } while (cursor);
    expect(count).toBeGreaterThan(1);
    expect(Buffer.concat(chunks)).toEqual(Buffer.from(raw));
    const prior = outputSchemas.get_skill.parse(instance.call("get_skill", { name: "zeron-page-builder", reference: "scripts/raw-reference.mjs", catalogVersion: older.catalog.catalogVersion }));
    expect(prior.data?.sections[0].text).toBe("old text without final newline");
    const wrongRange = structuredClone(prior);
    wrongRange.data!.sections[0].endByte! += 1;
    expect(outputSchemas.get_skill.safeParse(wrongRange).success).toBe(false);
    expect(error(instance.call("get_skill", { name: "zeron-page-builder", reference: "scripts/raw-reference.mjs", section: "not a Markdown heading" })).code).toBe("SECTION_NOT_FOUND");
  });
  it("rejects unselected text and malformed selection rather than widening the runtime allowlist", () => {
    const unselected = structuredClone(current);
    unselected.skills["zeron-page-builder"]["assets/unselected.json"] = "{}";
    expect(runtimeSchema.safeParse(unselected).success).toBe(false);
    const legacy = structuredClone(current);
    legacy.skills["zeron-page-builder"] = { "SKILL.md": "# legacy", "agents/openai.yaml": "name: example" };
    legacy.skills["swap-to-zeronui"] = { "SKILL.md": "# legacy" };
    expect(runtimeSchema.safeParse(legacy).success).toBe(false);
  });
});
