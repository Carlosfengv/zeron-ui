import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { frozenReleaseSchema, publishedInstallationVerificationSchema } from "../scripts/agent-release-record.mjs";
import { activatePreparedOutput, readFrozenReleases, restoreAgentRelease } from "../scripts/restore-agent-release.mjs";
import { loadAgentSchema } from "../scripts/load-agent-schema.mjs";
import { assembleCatalogRelease, verifyCatalogReleaseFiles } from "../scripts/agent-catalog-release.mjs";
import { siteBuildCommands } from "../scripts/build-site.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";
import { publishedGuideMarkdown } from "../lib/agent-catalog/guides";
import { createCatalogQuery } from "../lib/agent-catalog/query";
import { artifactOrigin, releaseFixture, reference } from "./helpers/agent-release-fixture.mjs";

let parent, schemas, oldest, previous, current;
const objects = new Map();
const reads = [];
const fetcher = async (url, options) => {
  expect(options.headers.authorization).toBeUndefined();
  reads.push(url);
  return objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
};
beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-release-restore-"));
  schemas = await loadAgentSchema();
  const directory = path.join(parent, "records");
  oldest = await releaseFixture({ directory, label: "a", objects, schemas });
  previous = await releaseFixture({ directory, label: "b", objects, schemas, aliases: ["button", "button-old"], history: [oldest.localRef] });
  current = await releaseFixture({ directory, label: "c", objects, schemas, aliases: ["button", "button-old", "button-new"], history: [previous.localRef, oldest.localRef] });
}, 20000);
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

describe("frozen release contracts", () => {
  it("rejects unknown fields, crossed stage URLs, self-history and partial npm matrices", () => {
    expect(frozenReleaseSchema.safeParse(current.record).success).toBe(true);
    for (const change of [{ extra: true }, { history: [current.localRef] }, { history: [oldest.localRef, oldest.localRef] },
      { registry: { ...current.record.registry, manifest: { ...current.record.registry.manifest, url: `${artifactOrigin}/r/releases/foreign/manifest.json` } } }]) {
      expect(frozenReleaseSchema.safeParse({ ...current.record, ...change }).success).toBe(false);
    }
    expect(publishedInstallationVerificationSchema.safeParse({ ...current.verification, matrices: current.verification.matrices.slice(1) }).success).toBe(false);
    expect(publishedInstallationVerificationSchema.safeParse({ ...current.verification, matrices: Array(4).fill(current.verification.matrices[0]) }).success).toBe(false);
    for (const integrity of ["sha512-YQ==", `sha512-${Buffer.alloc(63).toString("base64")}`, current.verification.cli.distIntegrity.replace(/A==$/, "B==")]) {
      expect(schemas.cliIntegritySchema.safeParse(integrity).success).toBe(false);
    }
  });

  it("binds local records by raw bytes and follows only two declared historical records", async () => {
    const records = await readFrozenReleases(current.filename);
    expect(records.map(record => record.catalog.version)).toEqual([current, previous, oldest].map(entry => entry.record.catalog.version));
    const selection = path.join(parent, "records/current.json");
    await writeFile(selection, serialize({ schemaVersion: 1, current: current.localRef }));
    expect(await readFrozenReleases(selection)).toEqual(records);
    await expect(readFrozenReleases(current.filename, { requireCommitted: true })).rejects.toMatchObject({ code: "RECORD_OUTSIDE_COMMITTED_RELEASES" });
    const corruptSelection = { schemaVersion: 1, current: { ...current.localRef, sha256: "0".repeat(64) } };
    await writeFile(selection, serialize(corruptSelection));
    await expect(readFrozenReleases(selection)).rejects.toMatchObject({ code: "LOCAL_RECORD_HASH_MISMATCH" });
  });

  it("recomputes catalog identity and exact files rather than trusting version strings", async () => {
    await expect(verifyCatalogReleaseFiles(current.catalog.files, current.catalogStage.manifest, { schemas })).resolves.toMatchObject({ runtime: current.catalog.runtime });
    const files = new Map(current.catalog.files);
    files.set("items/component:button.md", Buffer.from("changed guide"));
    await expect(verifyCatalogReleaseFiles(files, current.catalogStage.manifest, { schemas })).rejects.toThrow("exact runtime");
    const altered = JSON.parse(files.get("runtime.json"));
    altered.catalog.items[0].markdown = "https://foreign.invalid/item.md";
    altered.details["component:button"].item.markdown = altered.catalog.items[0].markdown;
    files.set("runtime.json", Buffer.from(serialize(altered)));
    await expect(verifyCatalogReleaseFiles(files, current.catalogStage.manifest, { schemas })).rejects.toThrow("outside its fixed version");
  });

  it("does not rebuild legacy Skills in release mode and rejects ambiguous build modes", () => {
    expect(siteBuildCommands().flat()).toContain("skills:build");
    const commands = siteBuildCommands({ mode: "release", release: "docs/agent-data/releases/current.json" });
    expect(commands.flat()).not.toContain("skills:build");
    expect(commands).toContainEqual(["agents:build", "--mode", "release", "--release", "docs/agent-data/releases/current.json"]);
    for (const input of [{ mode: "release" }, { mode: "development", release: "record" }, { mode: "other" }]) expect(() => siteBuildCommands(input)).toThrow();
  });
});

describe("isolated release restoration", () => {
  const options = { fetcher, downloadOptions: { attempts: 1, retryDelayMs: 0 } };
  it("restores current plus two historical catalogs and Skills from public bytes without fetching Registry sources", async () => {
    const output = path.join(parent, "success");
    const result = await restoreAgentRelease({ ...options, release: current.filename, output });
    expect(result.status).toBe("passed");
    expect(result.versions).toEqual([current, previous, oldest].map(entry => entry.record.catalog.version));
    const bundle = JSON.parse(await readFile(path.join(output, "docs/generated/agent-runtime/bundle.json"), "utf8"));
    expect(bundle.versions.map(runtime => runtime.skills["zeron-page-builder"]["SKILL.md"])).toEqual(["c", "b", "a"].map(label => `# zeron-page-builder\n\nHistorical fixture ${label}.\n`));
    expect(bundle.versions.map(runtime => runtime.details["component:button"].guide)).toEqual([current, previous, oldest].map(entry => entry.catalog.runtime.details["component:button"].guide));
    expect(publishedGuideMarkdown(bundle, "components", "button.md")).toBe(current.catalog.runtime.details["component:button"].guide);
    expect(publishedGuideMarkdown(bundle, "blocks", "button.md")).toBeNull();
    const query = createCatalogQuery(bundle);
    expect(query.call("get_skill", { name: "zeron-page-builder", locale: "en", catalogVersion: oldest.record.catalog.version }).data.sections[0].text).toContain("Historical fixture a");
    const installation = query.call("get_install_command", { ids: ["component:button"], packageManager: "npm", targetFramework: "vite" });
    expect(installation.data.commands.install).toContain(`zeron-ui@1.2.3 add button --registry ${current.registry.manifest.baseUrl}`);
    expect(await readFile(path.join(output, "public/skills/manifest.json"), "utf8")).toBe(serialize(current.skill.release));
    expect(await readFile(path.join(output, "public/ai/items/component:button.json"), "utf8")).toBe(current.catalog.files.get("items/component:button.json").toString("utf8"));
    expect(reads.some(url => /\/r\/releases\/[^/]+\/button\.json$/.test(url))).toBe(false);
    expect(await readdir(path.join(output, "output"))).toEqual([]);
  }, 10000);

  it("restores historical JSON/YAML/scripts from each bundle's own selection and preserves legacy Markdown", async () => {
    const directory = path.join(parent, "records");
    const references = label => new Map([
      ["zeron-page-builder/agents/openai.yaml", Buffer.from(`---\r\n# ${label}\r\n名字: 🙂`)],
      ["swap-to-zeronui/assets/schema.json", Buffer.from(`{"version":"${label}"}`)],
      ["swap-to-zeronui/scripts/inert.mjs", Buffer.from(`throw new Error('${label}: never execute');`)],
    ]);
    const prior = await releaseFixture({ directory, label: "e", objects, schemas, textSelection: true, extraSkillSources: references("old") });
    const selected = await releaseFixture({ directory, label: "f", objects, schemas, textSelection: true, extraSkillSources: references("new"), history: [prior.localRef, oldest.localRef] });
    const output = path.join(parent, "text-restoration");
    await restoreAgentRelease({ ...options, release: selected.filename, output });
    const bundle = JSON.parse(await readFile(path.join(output, "docs/generated/agent-runtime/bundle.json"), "utf8"));
    expect(bundle.versions.map(runtime => runtime.skills["zeron-page-builder"]["agents/openai.yaml"])).toEqual(["---\r\n# new\r\n名字: 🙂", "---\r\n# old\r\n名字: 🙂", undefined]);
    const query = createCatalogQuery(bundle);
    const result = query.call("get_skill", { name: "swap-to-zeronui", reference: "scripts/inert.mjs", catalogVersion: prior.record.catalog.version });
    expect(result.data.contentFormat).toBe("text");
    expect(result.data.sections[0].text).toBe("throw new Error('old: never execute');");
    expect(query.call("get_skill", { name: "zeron-page-builder", reference: "agents/openai.yaml", catalogVersion: oldest.record.catalog.version }).error.code).toBe("REFERENCE_NOT_FOUND");
    const forged = structuredClone(selected.catalog.runtime);
    delete forged.skills["swap-to-zeronui"]["assets/schema.json"];
    await expect(assembleCatalogRelease({ runtime: forged, identities: selected.identities, verification: selected.verification, skillRelease: selected.skill.release,
      source: selected.record.source, siteBaseUrl: selected.record.siteBaseUrl, schemas })).rejects.toThrow();
  }, 10000);
  it("fails a missing completion without replacing existing output, then supports an identical retry", async () => {
    const output = path.join(parent, "retry");
    await mkdir(path.join(output, "docs/generated/agent-runtime"), { recursive: true });
    const original = path.join(output, "docs/generated/agent-runtime/bundle.json");
    await writeFile(original, "prior deployment");
    const missing = current.record.catalog.completion.url;
    const bytes = objects.get(missing);
    objects.delete(missing);
    try { await expect(restoreAgentRelease({ ...options, release: current.filename, output })).rejects.toMatchObject({ code: "NOT_FOUND" }); }
    finally { objects.set(missing, bytes); }
    expect(await readFile(original, "utf8")).toBe("prior deployment");
    await expect(restoreAgentRelease({ ...options, release: current.filename, output })).resolves.toMatchObject({ status: "passed" });
  });

  it("rejects wrong public bytes, crossed redirects, decoded-byte budgets and stalls without activation", async () => {
    const ref = current.record.catalog.manifest;
    const variants = [
      { fetcher: async url => url === ref.url ? new Response("wrong") : fetcher(url, { headers: {} }), code: "HASH_OR_SIZE_MISMATCH" },
      { fetcher: async () => new Response(null, { status: 302, headers: { location: "https://foreign.invalid/x" } }), code: "INVALID_REDIRECT" },
      { maxTotalBytes: 1, code: "TOTAL_BODY_TOO_LARGE" },
      { fetcher: () => new Promise(() => {}), timeoutMs: 5, code: "TIMEOUT" },
    ];
    for (const [index, variant] of variants.entries()) {
      const { code, ...change } = variant;
      const output = path.join(parent, `failed-${index}`);
      await expect(restoreAgentRelease({ ...options, ...change, release: current.filename, output })).rejects.toMatchObject({ code });
      await expect(readFile(path.join(output, "docs/generated/agent-runtime/bundle.json"))).rejects.toMatchObject({ code: "ENOENT" });
      expect(await readdir(path.join(output, "output"))).toEqual([]);
    }
  });

  it("rejects output symlinks and respects an existing lock", async () => {
    const output = path.join(parent, "unsafe");
    await mkdir(path.join(output, "public"), { recursive: true });
    const victim = path.join(parent, "victim");
    await mkdir(victim);
    await writeFile(path.join(victim, "keep"), "untouched");
    await symlink(victim, path.join(output, "public/skills"));
    await expect(restoreAgentRelease({ ...options, release: oldest.filename, output })).rejects.toMatchObject({ code: "UNSAFE_OUTPUT_PATH" });
    expect(await readFile(path.join(victim, "keep"), "utf8")).toBe("untouched");
    await mkdir(path.join(output, "output/.agent-restore.lock"));
    await expect(restoreAgentRelease({ ...options, release: oldest.filename, output })).rejects.toMatchObject({ code: "RESTORE_LOCKED" });
    expect(await readdir(path.join(output, "output/.agent-restore.lock"))).toEqual([]);
  });

  it("rejects a completion with trusted but inconsistent counters and preserves prior output", async () => {
    const url = current.record.catalog.completion.url;
    const original = objects.get(url);
    const completion = JSON.parse(original);
    completion.files += 1;
    const wrong = Buffer.from(serialize(completion));
    objects.set(url, wrong);
    const directory = path.join(parent, "counter-record");
    await mkdir(directory);
    const filename = path.join(directory, path.basename(current.filename));
    const record = { ...current.record, history: [], catalog: { ...current.record.catalog, completion: reference(url, wrong) } };
    await writeFile(filename, serialize(record));
    try {
      await expect(restoreAgentRelease({ ...options, release: filename, output: path.join(parent, "counter-output") })).rejects.toMatchObject({ code: "INCOMPLETE_STAGE" });
    } finally { objects.set(url, original); }
  });

  it("checks identity evolution against previous published bytes rather than the current identity file", async () => {
    const dropped = await releaseFixture({ directory: path.join(parent, "records"), label: "d", objects, schemas, history: [previous.localRef] });
    await expect(restoreAgentRelease({ ...options, release: dropped.filename, output: path.join(parent, "identity-loss") })).rejects.toThrow("previously published aliases");
  });

  it("rolls back all earlier output replacements when a later prepared file is missing", async () => {
    const output = path.join(parent, "activation-rollback");
    const stage = path.join(parent, "activation-stage");
    const targets = ["public/ai", "public/skills", "docs/generated/agent-runtime", "public/llms-small.txt", "public/llms.txt", "public/llms-full.txt"];
    for (const target of targets) {
      const directory = !target.endsWith(".txt");
      const original = path.join(output, target, ...(directory ? ["original"] : []));
      const prepared = path.join(stage, "prepared", target, ...(directory ? ["prepared"] : []));
      await mkdir(path.dirname(original), { recursive: true });
      await mkdir(path.dirname(prepared), { recursive: true });
      await writeFile(original, "old");
      if (target !== "public/llms-full.txt") await writeFile(prepared, "new");
    }
    await expect(activatePreparedOutput(output, stage)).rejects.toMatchObject({ code: "ENOENT" });
    for (const target of targets) expect(await readFile(path.join(output, target, ...(!target.endsWith(".txt") ? ["original"] : [])), "utf8")).toBe("old");
  });

  it("keeps exact original UTF-8 ranges and hashes when context URLs are expanded after version hashing", async () => {
    const guide = `# Large fixture\n\n\`\`\`tsx\n${"const label = '中文';\n".repeat(30000)}\`\`\`\n`;
    const large = await releaseFixture({ directory: path.join(parent, "records"), label: "e", objects, schemas, guide });
    const contextManifest = JSON.parse(large.catalog.files.get("ai/context/manifest.json"));
    const parts = contextManifest.guides[0].parts;
    expect(parts.length).toBeGreaterThan(1);
    const originals = parts.map(part => {
      const bytes = large.catalog.files.get(part.path);
      expect(bytes.length).toBe(part.bytes);
      expect(sha256(bytes)).toBe(part.sha256);
      expect(part.url).toContain(large.catalog.baseUrl);
      const source = bytes.subarray(part.sourceOffsetByte, part.sourceOffsetByte + part.sourceLengthBytes);
      expect(sha256(source)).toBe(part.sourceSha256);
      return source;
    });
    expect(Buffer.concat(originals)).toEqual(Buffer.from(guide));
    await expect(verifyCatalogReleaseFiles(large.catalog.files, large.catalogStage.manifest, { schemas })).resolves.toMatchObject({ runtime: large.catalog.runtime });
  }, 10000);
});
