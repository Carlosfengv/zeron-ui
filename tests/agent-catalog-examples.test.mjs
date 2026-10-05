import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { assembleCatalogRelease, verifyCatalogReleaseFiles } from "../scripts/agent-catalog-release.mjs";
import { createExampleSourceManifest } from "../scripts/agent-example-sources.mjs";
import { loadAgentSchema } from "../scripts/load-agent-schema.mjs";
import { restoreAgentRelease } from "../scripts/restore-agent-release.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";
import { createCatalogQuery } from "../lib/agent-catalog/query";
import { releaseFixture } from "./helpers/agent-release-fixture.mjs";
import { fixtureExampleEvidence } from "./helpers/agent-example-evidence-fixture.mjs";

// All public resources and successful reports are explicit in-memory fixtures.
// These tests establish neither real installation, browser execution nor CI trust.
let directory, schemas, fixture;
const objects = new Map(), reads = [];
const fetcher = async (url, options) => {
  expect(options.headers.authorization).toBeUndefined(); reads.push(url);
  return objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
};
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "zeron-catalog-examples-")); schemas = await loadAgentSchema();
  fixture = await releaseFixture({ directory: path.join(directory, "records"), label: "a", schemas, objects, includeExamples: true });
}, 20000);
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });
function baseline() {
  const runtime = structuredClone(fixture.catalog.runtime); delete runtime.examples;
  for (const item of runtime.catalog.items) {
    const detail = runtime.details[item.id]; delete detail.examples;
    item.coverage = detail.guide !== null ? "guided" : "basic"; detail.item = structuredClone(item);
  }
  return runtime;
}
const assemble = overrides => assembleCatalogRelease({ runtime: baseline(), identities: fixture.identities, verification: fixture.verification,
  skillRelease: fixture.skill.release, source: fixture.record.source, siteBaseUrl: fixture.record.siteBaseUrl, schemas, examples: fixture.examples, ...overrides });
const copyExamples = () => ({ prepared: structuredClone(fixture.examples.prepared), sources: { ...fixture.examples.sources,
  manifest: structuredClone(fixture.examples.sources.manifest), files: new Map(fixture.examples.sources.files) },
  verification: structuredClone(fixture.examples.verification), attachments: new Map(fixture.examples.attachments) });

describe("catalog runnable example binding (pure fixtures, not release approval)", () => {
  it("serves fixed task resources and the full host inventory without upgrading host-only coverage", async () => {
    const candidate = await releaseFixture({ directory: path.join(directory, "task-context"), label: "b", schemas, objects,
      includeExamples: true, textSelection: true, extraSkillSources: new Map([
        ["zeron-page-builder/references/task-context.md", Buffer.from("# Tasks\n\nRead relevant contracts.")],
        ["zeron-page-builder/scripts/check-rendered-controls.mjs", Buffer.from("export const check = true;\n")],
      ]) });
    const base = candidate.catalog.baseUrl;
    const detail = createCatalogQuery({ currentVersion: candidate.catalog.runtime.catalog.catalogVersion, versions: [candidate.catalog.runtime] }).call("get_component", { id: "sidebar", sections: ["overview", "examples"] });
    expect(detail.data.item.coverage).not.toBe("example-verified");
    expect(detail.data.sections[0].text).toContain(`${base}/skills/zeron-page-builder/references/task-context.md`);
    expect(detail.data.sections[1].text).toContain(`${base}/examples/sources/app.tsx`);
    expect(detail.data.sections[1].text).toContain(`${base}/examples/source-manifest.json`);
    expect(candidate.catalog.files.get("items/component:sidebar.md").toString()).toContain(`${base}/examples/sources/app.tsx`);
    expect(candidate.catalog.files.get("skills/zeron-page-builder/scripts/check-rendered-controls.mjs").toString()).toBe("export const check = true;\n");
    await verifyCatalogReleaseFiles(candidate.catalog.files, candidate.catalogStage.manifest, { schemas });
  });
  it("rejects supplied coverage, links and a prebuilt runtime descriptor, with or without a report", async () => {
    for (const change of [runtime => { runtime.catalog.items[0].coverage = "example-verified"; },
      runtime => { runtime.details["component:button"].item.coverage = "example-verified"; },
      runtime => { runtime.details["component:button"].examples = []; },
      runtime => { runtime.examples = fixture.catalog.runtime.examples; }]) {
      const runtime = baseline(); change(runtime);
      await expect(assemble({ runtime })).rejects.toThrow("cannot supply verified example");
      await expect(assemble({ runtime, examples: undefined })).rejects.toThrow("cannot supply verified example");
    }
  });

  it("derives only declared adoption and packs every raw source, instructions, input and report", async () => {
    const result = await assemble();
    expect(result.runtime).toEqual(fixture.catalog.runtime);
    expect(result.executionTrust).toBe("not-verified-by-pure-assembly");
    const adopted = [...new Set(fixture.examples.sources.manifest.declarations.examples.flatMap(example => example.adoptedItems))].sort();
    expect(result.runtime.catalog.items.filter(item => item.coverage === "example-verified").map(item => item.id).sort()).toEqual(adopted);
    expect(result.runtime.catalog.items.find(item => item.id === "support:tokens").coverage).toBe("basic");
    expect(result.runtime.catalog.items.find(item => item.id === "block:login-01").coverage).toBe("basic");
    expect(result.files.get("examples/declarations.json")).toEqual(fixture.examples.sources.declaration);
    expect(result.files.get("examples/verification.json").toString()).toBe(serialize(fixture.examples.verification));
    for (const [name, bytes] of fixture.examples.sources.files) expect(result.files.get(`examples/sources/${name}`)).toEqual(bytes);
    expect(result.identity.examples).toEqual(result.runtime.examples);
    expect(result.files.get("items/component:button.md").toString()).toContain(`${result.baseUrl}/examples/sources/README.md`);
  });

  it("rejects incomplete rows, missing proof bytes, changed source and crossed fixed resources", async () => {
    for (const change of [examples => { examples.verification.rows.pop(); },
      examples => { examples.attachments.delete(examples.verification.rows[0].checks.states.url); },
      examples => { examples.sources.files.set("README.md", Buffer.from("substituted instructions")); },
      examples => { examples.prepared.input.source.lockfileSha256 = "0".repeat(64); },
      examples => { examples.prepared.input.skill.manifest.sha256 = "0".repeat(64); },
      examples => { examples.prepared.npm.cli.tarballBytes++; },
      examples => { examples.prepared.scope.items.find(item => item.name === "button").registryDependencies = []; }]) {
      const examples = copyExamples(); change(examples); await expect(assemble({ examples })).rejects.toThrow();
    }
    await expect(assemble({ source: { ...fixture.record.source, sourceInputSha256: "0".repeat(64) } })).rejects.toThrow("resource binding");
  });

  it("changes content identity when raw instructions or the complete report changes", async () => {
    const examples = copyExamples();
    examples.sources.files.set("README.md", Buffer.concat([examples.sources.files.get("README.md"), Buffer.from("\nArchived fixture instructions.\n")]));
    examples.sources.manifest = createExampleSourceManifest(examples.sources.declaration, examples.sources.files, examples.sources.manifest.hostRegistryItems);
    const regenerated = fixtureExampleEvidence(examples.prepared, examples.sources);
    examples.verification = regenerated.report; examples.attachments = regenerated.attachments;
    const result = await assemble({ examples });
    expect(result.runtime.catalog.catalogVersion).not.toBe(fixture.catalog.runtime.catalog.catalogVersion);
    expect(result.runtime.examples.instructions.sha256).toBe(sha256(examples.sources.files.get("README.md")));
    expect(result.identity.contextTemplates["llms.txt"]).not.toContain(result.runtime.catalog.catalogVersion);
  });

  it("reconstructs the import graph even when declarations, manifest and report are coherently forged", async () => {
    const examples = copyExamples(), declaration = structuredClone(examples.sources.manifest.declarations);
    declaration.examples[0].adoptedItems = declaration.examples[0].adoptedItems.filter(id => id !== "component:button");
    examples.sources.declaration = Buffer.from(serialize(declaration)); examples.sources.manifest.declarations = declaration;
    examples.sources.manifest.declaration.bytes = examples.sources.declaration.length;
    examples.sources.manifest.declaration.sha256 = sha256(examples.sources.declaration);
    const synthetic = fixtureExampleEvidence(examples.prepared, examples.sources);
    examples.verification = synthetic.report; examples.attachments = synthetic.attachments;
    await expect(assemble({ examples })).rejects.toThrow("DECLARATION_IMPORT_GRAPH_MISMATCH");
  });

  it("verifies exact packaged files and rejects substitutions or missing source bytes", async () => {
    await expect(verifyCatalogReleaseFiles(fixture.catalog.files, fixture.catalogStage.manifest, { schemas })).resolves.toMatchObject({
      runtime: fixture.catalog.runtime, examples: { input: fixture.examples.prepared.input, verification: fixture.examples.verification } });
    for (const change of [files => { files.delete("examples/sources/shared/contracts.ts"); },
      files => { files.set("examples/sources/README.md", Buffer.from("changed")); },
      files => { files.set("examples/unlisted.json", Buffer.from("{}\n")); },
      files => { files.set("examples/verification.json", Buffer.from(JSON.stringify(fixture.examples.verification))); }]) {
      const files = new Map(fixture.catalog.files); change(files);
      await expect(verifyCatalogReleaseFiles(files, fixture.catalogStage.manifest, { schemas })).rejects.toThrow();
    }
  });

  it("runtime rejects unsupported claims, unknown adoption, crossed links and development evidence", () => {
    for (const change of [runtime => { delete runtime.examples; },
      runtime => { runtime.catalog.mode = "development"; },
      runtime => { runtime.examples.entries[0].adoptedItems.push("support:tokens"); },
      runtime => { runtime.examples.entries[0].adoptedItems.push("component:unknown"); },
      runtime => { runtime.examples.entries[0].profiles.push(runtime.examples.entries[0].profiles[0]); },
      runtime => { runtime.details["component:button"].examples[0].source = "https://foreign.invalid/source.tsx"; },
      runtime => { runtime.catalog.items.find(item => item.id === "block:login-01").coverage = "example-verified"; runtime.details["block:login-01"].item.coverage = "example-verified"; }]) {
      const runtime = structuredClone(fixture.catalog.runtime); change(runtime); expect(schemas.runtimeSchema.safeParse(runtime).success).toBe(false);
    }
    const runtime = baseline(); runtime.catalog.mode = "development"; runtime.catalog.catalogUrl = null; runtime.installation = null;
    runtime.catalog.items[0].coverage = "example-verified"; runtime.details[runtime.catalog.items[0].id].item.coverage = "example-verified";
    expect(schemas.runtimeSchema.safeParse(runtime).success).toBe(false);
  });

  it("MCP and fixed Markdown expose only each item's own fixed source and declared combinations", () => {
    const runtime = fixture.catalog.runtime, query = createCatalogQuery({ currentVersion: runtime.catalog.catalogVersion, versions: [runtime] });
    const result = query.call("get_component", { id: "component:button", sections: ["examples"], locale: "en" });
    expect(result.data.item.coverage).toBe("example-verified");
    const text = result.data.sections.map(section => section.text).join("\n");
    expect(text).toContain(`${fixture.catalog.baseUrl}/examples/sources/resource-list/page.tsx`);
    expect(text).toContain("next × npm"); expect(text).toContain("vite × pnpm");
    const support = query.call("get_component", { id: "support:tokens", sections: ["examples"] });
    expect(support.data.sections[0].text).not.toContain("Fixed verification report");
    expect(result.meta.catalogVersion).toBe(runtime.catalog.catalogVersion);
  });
});

describe("frozen example restoration with injected public resources", () => {
  const options = { fetcher, downloadOptions: { attempts: 1 }, release: () => fixture.filename };
  it("restores archived raw sources and reads all actual external attachments before activation", async () => {
    const output = path.join(directory, "restored"), result = await restoreAgentRelease({ ...options, release: options.release(), output });
    expect(result.status).toBe("passed");
    const bundle = JSON.parse(await readFile(path.join(output, "docs/generated/agent-runtime/bundle.json")));
    expect(bundle.versions[0].examples).toEqual(fixture.catalog.runtime.examples);
    for (const [name, bytes] of fixture.examples.sources.files) {
      expect(await readFile(path.join(output, `public/ai/releases/${result.catalogVersion}/examples/sources/${name}`))).toEqual(bytes);
    }
    for (const url of fixture.examples.attachments.keys()) expect(reads).toContain(url);
    expect(reads).toContain(`${fixture.registry.manifest.baseUrl}/tokens.json`);
  }, 10000);

  it("keeps prior output intact when a public check or screenshot is missing", async () => {
    const row = fixture.examples.verification.rows[0];
    for (const [index, url] of [row.checks.states.url, row.checks.viewports[0].screenshot.url].entries()) {
      const output = path.join(directory, `missing-proof-${index}`), filename = path.join(output, "docs/generated/agent-runtime/bundle.json");
      await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, "prior output");
      const bytes = objects.get(url); objects.delete(url);
      try { await expect(restoreAgentRelease({ ...options, release: options.release(), output })).rejects.toThrow(); }
      finally { objects.set(url, bytes); }
      expect(await readFile(filename, "utf8")).toBe("prior output");
    }
  }, 10000);

  it("rejects tampered Registry bytes and bounded reads without replacing prior output", async () => {
    const output = path.join(directory, "corrupt-registry"), filename = path.join(output, "docs/generated/agent-runtime/bundle.json");
    await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, "prior output");
    const url = `${fixture.registry.manifest.baseUrl}/button.json`, bytes = objects.get(url); objects.set(url, Buffer.from("{}\n"));
    try { await expect(restoreAgentRelease({ ...options, release: options.release(), output })).rejects.toThrow(); }
    finally { objects.set(url, bytes); }
    expect(await readFile(filename, "utf8")).toBe("prior output");
    await expect(restoreAgentRelease({ ...options, release: options.release(), output, maxTotalBytes: 1 })).rejects.toMatchObject({ code: "TOTAL_BODY_TOO_LARGE" });
    expect(await readFile(filename, "utf8")).toBe("prior output");
  }, 10000);
});
