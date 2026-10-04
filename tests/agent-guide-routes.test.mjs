import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadAgentSchema } from "../scripts/load-agent-schema.mjs";
import { assembleCatalogRelease, verifyCatalogReleaseFiles } from "../scripts/agent-catalog-release.mjs";
import { restoreAgentRelease } from "../scripts/restore-agent-release.mjs";
import { guideMarkdownForRuntime, publishedGuideMarkdown } from "../lib/agent-catalog/guides";
import { artifactFileUrl } from "../scripts/agent-artifacts.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";
import { releaseFixture } from "./helpers/agent-release-fixture.mjs";

const mapping = routes => ({ schemaVersion: 1, routes });
const oldRoute = { path: "components/button.md", itemId: "component:button" };
let schemas, parent, fixture;
const objects = new Map();
beforeAll(async () => {
  schemas = await loadAgentSchema();
  parent = await mkdtemp(path.join(tmpdir(), "zeron-guide-routes-"));
  fixture = await releaseFixture({ directory: path.join(parent, "records"), label: "a", objects, schemas });
});
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });
const assemble = runtime => assembleCatalogRelease({ runtime, identities: fixture.identities, verification: fixture.verification,
  skillRelease: fixture.skill.release, source: fixture.record.source, siteBaseUrl: fixture.record.siteBaseUrl, schemas });

describe("explicit versioned guide routes", () => {
  it("rejects unsafe, duplicate, unsorted and ambiguous declarations", () => {
    const invalid = [mapping([oldRoute, oldRoute]), mapping([{ ...oldRoute, path: "../button.md" }]),
      mapping([{ ...oldRoute, path: "components/button%2Fprivate.md" }]), mapping([{ ...oldRoute, extra: true }]),
      mapping([oldRoute, { ...oldRoute, path: "blocks/new.md" }])];
    for (const input of invalid) expect(schemas.guideRoutesSchema.safeParse(input).success).toBe(false);
    expect(schemas.guideRoutesSchema.parse(mapping([{ ...oldRoute, path: "blocks/new.md" }, oldRoute])).routes).toHaveLength(2);
  });
  it("keeps an old path after both Registry name and UI classification change", () => {
    const runtime = structuredClone(fixture.catalog.runtime);
    const item = runtime.catalog.items[0];
    Object.assign(item, { registryName: "renamed-button", slug: "renamed-button", kind: "block", collection: "blocks", aliases: ["button", "renamed-button"] });
    runtime.details[item.id].item = structuredClone(item);
    runtime.guideRoutes = mapping([{ path: "blocks/renamed-button.md", itemId: item.id }, oldRoute]);
    const parsed = schemas.runtimeSchema.parse(runtime);
    const snapshots = { currentVersion: parsed.catalog.catalogVersion, versions: [parsed] };
    expect(publishedGuideMarkdown(snapshots, "components", "button.md")).toBe(parsed.details[item.id].guide);
    expect(publishedGuideMarkdown(snapshots, "blocks", "renamed-button.md")).toBe(parsed.details[item.id].guide);
    expect(publishedGuideMarkdown(snapshots, "components", "renamed-button.md")).toBeNull();
    expect(publishedGuideMarkdown(snapshots, "blocks", "button.md")).toBeNull();
  });
  it("requires every route to own an existing guide and every guide to have a route", () => {
    for (const routes of [[], [{ ...oldRoute, itemId: "component:missing" }]]) {
      expect(schemas.runtimeSchema.safeParse({ ...fixture.catalog.runtime, guideRoutes: mapping(routes) }).success).toBe(false);
    }
    const runtime = structuredClone(fixture.catalog.runtime);
    runtime.details[oldRoute.itemId].guide = null;
    runtime.details[oldRoute.itemId].guideLocale = null;
    expect(schemas.runtimeSchema.safeParse(runtime).success).toBe(false);
  });
  it("does not derive missing paths from names when an explicit mapping exists", () => {
    const runtime = structuredClone(fixture.catalog.runtime);
    runtime.guideRoutes = mapping([{ ...oldRoute, path: "blocks/explicit.md" }]);
    expect(guideMarkdownForRuntime(runtime, "components", "button.md")).toBeNull();
    expect(guideMarkdownForRuntime(runtime, "blocks", "explicit.md")).toBe(runtime.details[oldRoute.itemId].guide);
    delete runtime.guideRoutes;
    expect(guideMarkdownForRuntime(runtime, "components", "button.md")).toBe(runtime.details[oldRoute.itemId].guide);
  });
  it("binds the mapping into content identity and the exact stage files", async () => {
    const runtime = structuredClone(fixture.catalog.runtime);
    runtime.guideRoutes.routes.push({ ...oldRoute, path: "components/retained-alias.md" });
    const first = await assemble(runtime);
    const second = await assemble(runtime);
    expect(first.runtime.catalog.catalogVersion).toBe(second.runtime.catalog.catalogVersion);
    expect(first.runtime.catalog.catalogVersion).not.toBe(fixture.record.catalog.version);
    expect(first.files.get("guide-routes.json").toString()).toBe(serialize(runtime.guideRoutes));
    const files = new Map(fixture.catalog.files);
    const altered = structuredClone(fixture.catalog.runtime);
    altered.guideRoutes = runtime.guideRoutes;
    files.set("runtime.json", Buffer.from(serialize(altered)));
    files.set("guide-routes.json", Buffer.from(serialize(runtime.guideRoutes)));
    await expect(verifyCatalogReleaseFiles(files, fixture.catalogStage.manifest, { schemas })).rejects.toThrow("identity mismatch");
    const missing = new Map(fixture.catalog.files);
    missing.delete("guide-routes.json");
    await expect(verifyCatalogReleaseFiles(missing, fixture.catalogStage.manifest, { schemas })).rejects.toThrow("exact runtime");
    delete runtime.guideRoutes;
    await expect(assemble(runtime)).rejects.toThrow("require explicit guide routes");
  });
  it("retains old snapshot verification without injecting a current mapping", async () => {
    const identity = structuredClone(fixture.catalog.identity);
    delete identity.guideRoutes;
    const runtime = structuredClone(fixture.catalog.runtime);
    delete runtime.guideRoutes;
    const version = sha256(serialize(identity));
    const before = fixture.catalog.baseUrl;
    const baseUrl = before.slice(0, -64) + version;
    runtime.catalog.catalogVersion = version;
    runtime.catalog.catalogUrl = `${baseUrl}/catalog.json`;
    for (const item of runtime.catalog.items) {
      item.markdown = artifactFileUrl(baseUrl, `items/${item.id}.md`);
      item.detailUrl = artifactFileUrl(baseUrl, `items/${item.id}.json`);
      runtime.details[item.id].item = structuredClone(item);
    }
    const files = new Map([...fixture.catalog.files].filter(([name]) => name !== "guide-routes.json").map(([name, bytes]) => [name, Buffer.from(bytes.toString().replaceAll(before, baseUrl))]));
    files.set("catalog.json", Buffer.from(serialize(runtime.catalog)));
    files.set("runtime.json", Buffer.from(serialize(runtime)));
    files.set("identity.json", Buffer.from(serialize(identity)));
    files.set("items/component:button.json", Buffer.from(serialize(runtime.details[oldRoute.itemId])));
    const manifest = { ...fixture.catalogStage.manifest, releaseId: version, baseUrl, files: [...files].map(([name, bytes]) => ({
      ...fixture.catalogStage.manifest.files.find(file => file.path === name), url: artifactFileUrl(baseUrl, name), bytes: bytes.length, sha256: sha256(bytes),
    })) };
    await expect(verifyCatalogReleaseFiles(files, manifest, { schemas })).resolves.toMatchObject({ runtime });
  });
  it("rejects removing or rebinding a published path", () => {
    expect(() => schemas.validateGuideRouteEvolution(mapping([oldRoute]), mapping([]))).toThrow("Keep the published guide path");
    expect(() => schemas.validateGuideRouteEvolution(mapping([oldRoute]), mapping([{ ...oldRoute, itemId: "component:other" }]))).toThrow("Keep the published guide path");
    expect(schemas.validateGuideRouteEvolution(mapping([oldRoute]), mapping([{ path: "blocks/new.md", itemId: oldRoute.itemId }, oldRoute])).routes).toHaveLength(2);
  });
  it("restores each historical mapping from its own frozen bytes", async () => {
    const current = await releaseFixture({ directory: path.join(parent, "history"), label: "b", objects, schemas,
      guideRoutes: mapping([{ path: "blocks/new-location.md", itemId: oldRoute.itemId }, oldRoute]), history: [fixture.localRef] });
    // Records are local references; copy the prior raw record into the selected record's directory.
    const { copyFile } = await import("node:fs/promises");
    await copyFile(fixture.filename, path.join(parent, "history", fixture.localRef.path));
    const output = path.join(parent, "restored");
    const fetcher = async url => objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
    await restoreAgentRelease({ release: current.filename, output, fetcher, downloadOptions: { sleep: async () => {} } });
    const bundle = JSON.parse(await readFile(path.join(output, "docs/generated/agent-runtime/bundle.json"), "utf8"));
    expect(bundle.versions[0].guideRoutes).toEqual(current.catalog.runtime.guideRoutes);
    expect(bundle.versions[1].guideRoutes).toEqual(fixture.catalog.runtime.guideRoutes);
    expect(guideMarkdownForRuntime(bundle.versions[1], "blocks", "new-location.md")).toBeNull();
    expect(guideMarkdownForRuntime(bundle.versions[1], "components", "button.md")).toBe(fixture.catalog.runtime.details[oldRoute.itemId].guide);
    expect(await readFile(path.join(output, "public/ai/guide-routes.json"), "utf8")).toBe(serialize(current.catalog.runtime.guideRoutes));
  });
  it("refuses activation when a later frozen release removes an older published path", async () => {
    const current = await releaseFixture({ directory: path.join(parent, "broken-history"), label: "c", objects, schemas,
      guideRoutes: mapping([{ path: "blocks/replacement.md", itemId: oldRoute.itemId }]), history: [fixture.localRef] });
    const { copyFile } = await import("node:fs/promises");
    await copyFile(fixture.filename, path.join(parent, "broken-history", fixture.localRef.path));
    const output = path.join(parent, "broken-output");
    const fetcher = async url => objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
    await expect(restoreAgentRelease({ release: current.filename, output, fetcher, downloadOptions: { sleep: async () => {} } })).rejects.toThrow("Keep the published guide path");
    await expect(readFile(path.join(output, "docs/generated/agent-runtime/bundle.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
