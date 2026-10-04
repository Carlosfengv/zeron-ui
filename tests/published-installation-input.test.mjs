import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { installationInputSchema, publishedInstallationVerificationSchema } from "../scripts/agent-release-record.mjs";
import { createInstallationInput, readPublishedCli, verifyPublishedInstallationInput, assertInstallationIdentitySource } from "../scripts/published-installation-input.mjs";
import { checkPublishedInstallationInput, parseInstallationCheckArgs, verifyPublicSourceContent } from "../scripts/check-published-installation-input.mjs";
import { buildSkillRelease } from "../scripts/create-skill-release.mjs";
import { artifactFiles } from "../scripts/agent-artifacts.mjs";
import { planArtifactPublication } from "../scripts/publish-agent-artifacts.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

const origin = "https://artifacts.example.invalid";
const site = "https://docs.example.invalid";
const source = { sourceRevision: "a".repeat(40), sourceInputSha256: "b".repeat(64), lockfileSha256: "c".repeat(64), sourceClean: true };
const tarball = gzipSync(Buffer.from("Explicit test tarball; no package execution or published consumer evidence."));
const cli = { name: "zeron-ui", version: "1.2.3", distIntegrity: `sha512-${createHash("sha512").update(tarball).digest("base64")}` };
const tarballUrl = "https://registry.npmjs.org/zeron-ui/-/zeron-ui-1.2.3.tgz";
const metadataUrl = "https://registry.npmjs.org/zeron-ui/1.2.3";
const metadata = () => ({ name: cli.name, version: cli.version, dist: { integrity: cli.distIntegrity, tarball: tarballUrl } });
const meta = { zeron: { framework: "react", react: "^19", tailwind: "^4", kind: "ui" } };
const matrices = ["next", "vite"].flatMap(framework => ["npm", "pnpm"].map(packageManager => ({ framework, packageManager,
  testedItems: framework === "next" ? ["component:button", "block:next-panel"] : ["component:button"] })));
let parent;
let input;
let objects;
let registryManifest;
let registryCompletion;
let skillManifest;
let skillCompletion;

beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-published-input-test-"));
  const directory = path.join(parent, "registry");
  await mkdir(directory);
  const baseUrl = `${origin}/r/releases/test-input`;
  const items = [
    { name: "utils", meta, files: [{ path: "utils.ts", target: "lib/utils.ts", content: 'export const id = "verified";' }] },
    { name: "button", meta, registryDependencies: [`${baseUrl}/utils.json`], files: [{ path: "button.ts", target: "components/ui/button.ts", content: 'import {id} from "@lib/utils"; export {id};' }] },
    { name: "next-panel", meta: { zeron: { ...meta.zeron, framework: "next", kind: "data-block" } },
      registryDependencies: [`${baseUrl}/button.json`], files: [{ path: "next-panel.ts", target: "components/blocks/next-panel.ts", content: 'export const nextPanel = true;' }] },
  ];
  await writeFile(path.join(directory, "registry.json"), serialize({ items }));
  for (const item of items) await writeFile(path.join(directory, `${item.name}.json`), serialize(item));
  registryManifest = { schemaVersion: 1, kind: "registry", releaseId: "test-input", baseUrl, provenance: source,
    files: await artifactFiles(directory, baseUrl) };
  await writeFile(path.join(directory, "manifest.json"), serialize(registryManifest));
  const registryPlan = await planArtifactPublication(directory, registryManifest);
  registryCompletion = registryPlan.completion;
  const skill = await buildSkillRelease({ artifactBaseUrl: origin, siteBaseUrl: site, outputBase: path.join(parent, "skills") });
  skillManifest = skill.manifest;
  const skillPlan = await planArtifactPublication(skill.directory, skillManifest);
  skillCompletion = skillPlan.completion;
  input = createInstallationInput({ source, siteBaseUrl: site, registryManifest, registryCompletion, skillManifest, skillCompletion, cli,
    items: [{ id: "component:button", registryName: "button" }, { id: "block:next-panel", registryName: "next-panel" }, { id: "support:utils", registryName: "utils" }],
    matrices, nextOnlyRejectionItem: "block:next-panel" });
  objects = new Map([[metadataUrl, Buffer.from(serialize(metadata()))], [tarballUrl, tarball]]);
  for (const [stageDirectory, plan] of [[directory, registryPlan], [skill.directory, skillPlan]]) {
    for (const entry of plan.entries) objects.set(entry.url, entry.role === "completion" ? Buffer.from(serialize(plan.completion)) : await readFile(path.join(stageDirectory, entry.path)));
  }
}, 15000);
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

function publicStore() {
  const entries = new Map([...objects].map(([url, bytes]) => [url, Buffer.from(bytes)]));
  const fetcher = vi.fn(async (url, init) => {
    expect(init.headers.authorization).toBeUndefined();
    return entries.has(url) ? new Response(entries.get(url)) : new Response(null, { status: 404 });
  });
  return { entries, fetcher, downloadOptions: { attempts: 1, retryDelayMs: 0 } };
}

describe("installation input before Catalog", () => {
  it("uses exact installation resources, stable identities and four intended matrices without a success declaration", () => {
    expect(installationInputSchema.parse(input)).toEqual(input);
    expect(input).not.toHaveProperty("catalog");
    expect(input).not.toHaveProperty("passed");
    for (const change of [{ catalog: {} }, { source: { ...source, sourceClean: false } }, { cli: { ...cli, version: "latest" } },
      { cli: { ...cli, distIntegrity: "sha512-AA==" } }, { nextOnlyRejectionItem: "block:missing" },
      { matrices: [matrices[0], matrices[0], ...matrices.slice(2)] },
      { items: [input.items[0], input.items[0], ...input.items.slice(1)] },
      { matrices: matrices.map(row => ({ ...row, testedItems: ["block:next-panel"] })) },
      { skill: { ...input.skill, archive: { ...input.skill.archive, url: `${origin}/skills/releases/${"f".repeat(64)}/zeron-skills.zip` } } },
    ]) expect(installationInputSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });

  it("rejects descriptor provenance, stage, completion and source-identity substitutions", () => {
    const options = { source, siteBaseUrl: site, registryManifest, registryCompletion, skillManifest, skillCompletion,
      cli, items: input.items, matrices, nextOnlyRejectionItem: input.nextOnlyRejectionItem };
    expect(() => createInstallationInput({ ...options, source: { ...source, lockfileSha256: "d".repeat(64) } })).toThrow(/DESCRIPTOR_STAGE_BINDING/);
    expect(() => createInstallationInput({ ...options, registryCompletion: { ...registryCompletion, totalBytes: 1 } })).toThrow(/STAGE_COMPLETION_BINDING/);
    const identities = { items: input.items.map(item => ({ id: item.id, type: "registry", key: item.registryName, status: "active" })) };
    expect(() => assertInstallationIdentitySource(input, identities)).not.toThrow();
    expect(() => assertInstallationIdentitySource(input, { items: identities.items.slice(1) })).toThrow(/SOURCE_IDENTITY_MAP/);
  });

  it("reads every public payload and verifies npm SRI, but cannot be used as a published installation report", async () => {
    const store = publicStore();
    const result = await verifyPublishedInstallationInput(input, store);
    expect(result.report).toMatchObject({ status: "verified-inputs", scope: "public-resource-and-npm-integrity-not-consumer-installation",
      cli: { ...cli, tarballBytes: tarball.length, tarballUrl }, inputSha256: sha256(serialize(input)),
      registry: { staticCheckedItems: ["block:next-panel", "component:button", "support:utils"] } });
    expect(result.scope.matrices.filter(row => row.framework === "next").every(row => serialize(row.registryClosure) === serialize(["button", "next-panel", "utils"]))).toBe(true);
    expect(result.scope.matrices.filter(row => row.framework === "vite").every(row => serialize(row.registryClosure) === serialize(["button", "utils"]))).toBe(true);
    expect(publishedInstallationVerificationSchema.safeParse(result.report).success).toBe(false);
    const expected = [...registryManifest.files, ...skillManifest.files].map(file => file.url);
    for (const url of [...expected, input.registry.manifest.url, input.registry.completion.url, input.skill.artifacts.url, input.skill.completion.url, metadataUrl, tarballUrl]) {
      expect(store.fetcher.mock.calls.filter(([requested]) => requested === url)).toHaveLength(1);
    }
    expect(result.npm.tarball).toEqual(tarball);
    expect(result.report.consumedBytes).toBe(store.fetcher.mock.calls.reduce((sum, [url]) => sum + store.entries.get(url).length, 0));
  });

  it("rejects missing completion, wrong raw bytes and source mismatches before exposing any package to consumers", async () => {
    for (const change of ["missing", "bytes", "source"]) {
      const store = publicStore();
      let value = input;
      if (change === "missing") store.entries.delete(input.registry.completion.url);
      if (change === "bytes") store.entries.set(registryManifest.files[0].url, Buffer.from("tampered"));
      if (change === "source") value = { ...input, source: { ...source, sourceRevision: "d".repeat(40) } };
      await expect(verifyPublishedInstallationInput(value, store)).rejects.toBeDefined();
      expect(store.fetcher.mock.calls.some(([url]) => url === metadataUrl)).toBe(false);
    }
  });

  it("gives source reconstruction the verified inventories and outer Skill provenance, and cleans failed stages", async () => {
    const result = await verifyPublishedInstallationInput(input, publicStore());
    const directories = [];
    const verifySource = vi.fn(async (directory, manifest, provenanceFile) => {
      directories.push(directory);
      const stage = result[manifest.kind];
      for (const [name, bytes] of stage.files) expect(await readFile(path.join(directory, name))).toEqual(bytes);
      expect(await readFile(path.join(directory, manifest.kind === "skill" ? "artifacts.json" : "manifest.json"), "utf8")).toBe(serialize(manifest));
      if (manifest.kind === "skill") expect(JSON.parse(await readFile(provenanceFile, "utf8"))).toEqual(source);
      else expect(provenanceFile).toBeUndefined();
    });
    await verifyPublicSourceContent(result, { verifySource });
    expect(verifySource).toHaveBeenCalledTimes(2);
    for (const directory of directories) await expect(lstat(directory)).rejects.toMatchObject({ code: "ENOENT" });
    let failedDirectory;
    await expect(verifyPublicSourceContent(result, { verifySource: async directory => {
      failedDirectory = directory;
      throw new Error("source reconstruction rejected fixture");
    } })).rejects.toThrow(/reconstruction rejected/);
    await expect(lstat(failedDirectory)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects signed-but-inconsistent completion counts and incomplete identity inventory", async () => {
    const store = publicStore();
    const bad = Buffer.from(serialize({ ...registryCompletion, files: registryCompletion.files + 1 }));
    store.entries.set(input.registry.completion.url, bad);
    await expect(verifyPublishedInstallationInput({ ...input, registry: { ...input.registry,
      completion: { ...input.registry.completion, bytes: bad.length, sha256: sha256(bad) } } }, store)).rejects.toMatchObject({ code: "STAGE_COMPLETION_BINDING" });
    await expect(verifyPublishedInstallationInput({ ...input, items: input.items.filter(item => item.id !== "support:utils") }, publicStore())).rejects.toMatchObject({ code: "REGISTRY_IDENTITY_COVERAGE" });
  });

  it("rejects an incompatible Vite representative, a non-Next rejection target and missing ordinary UI coverage", async () => {
    const fake = { ...input, nextOnlyRejectionItem: "support:utils", matrices: matrices.map(row => ({ ...row,
      testedItems: row.framework === "next" ? ["component:button", "support:utils"] : ["component:button", "block:next-panel"] })) };
    await expect(verifyPublishedInstallationInput(fake, publicStore())).rejects.toMatchObject({ code: "NEXT_ONLY_REJECTION_SCOPE" });
    const incompatible = { ...input, matrices: matrices.map(row => row.framework === "vite" ? { ...row, testedItems: ["component:button", "block:next-panel"] } : row) };
    // The contract rejects the known rejection item before doing any network I/O.
    await expect(verifyPublishedInstallationInput(incompatible, publicStore())).rejects.toBeDefined();
    const supportOnly = { ...input, matrices: matrices.map(row => row.framework === "vite" ? { ...row, testedItems: ["support:utils"] } : row) };
    await expect(verifyPublishedInstallationInput(supportOnly, publicStore())).rejects.toMatchObject({ code: "MATRIX_COMPONENT_SCOPE" });
  });

  it("enforces actual streamed-byte budgets, response deadlines and same-origin reads", async () => {
    await expect(verifyPublishedInstallationInput(input, { ...publicStore(), maxTotalBytes: 10 })).rejects.toMatchObject({ code: "TOTAL_BODY_TOO_LARGE" });
    await expect(verifyPublishedInstallationInput(input, { fetcher: () => new Promise(() => {}), timeoutMs: 5,
      downloadOptions: { attempts: 1 } })).rejects.toMatchObject({ code: "TIMEOUT" });
    const store = publicStore();
    store.fetcher.mockImplementation(async () => new Response(null, { status: 302, headers: { location: "https://wrong.invalid/file" } }));
    await expect(verifyPublishedInstallationInput(input, store)).rejects.toMatchObject({ code: "INVALID_REDIRECT" });
  });

  it("rejects unknown, duplicate or ambiguous CLI arguments and source-tree evidence output", () => {
    expect(parseInstallationCheckArgs(["--input", "input.json", "--output", path.join(parent, "fresh")])).toMatchObject({ output: path.join(parent, "fresh") });
    for (const args of [[], ["--input", "input.json"], ["--input", "input.json", "--output", "docs/evidence"],
      ["--input", "input.json", "--output", "output/fresh", "--upload", "true"],
      ["--input", "input.json", "--output", "output/fresh", "--input", "other.json"],
    ]) expect(() => parseInstallationCheckArgs(args)).toThrow();
  });

  it("writes a safe failed gate report before network, and refuses to reuse previous output", async () => {
    const filename = path.join(parent, "installation-input.json");
    const output = path.join(parent, "source-gate");
    await writeFile(filename, serialize(input));
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(() => { throw new Error("Source gate must precede all network calls"); });
    try { await expect(checkPublishedInstallationInput(["--input", filename, "--output", output])).rejects.toThrow(/NODE_22_REQUIRED|DIRTY_SOURCE|SOURCE_BINDING_MISMATCH/); }
    finally { expect(fetcher).not.toHaveBeenCalled(); fetcher.mockRestore(); }
    const report = JSON.parse(await readFile(path.join(output, "failure.json"), "utf8"));
    expect(report).toMatchObject({ status: "failed", scope: "input-check-not-consumer-installation" });
    expect(JSON.stringify(report)).not.toContain(parent);
    await expect(lstat(path.join(output, "input-verification.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(checkPublishedInstallationInput(["--input", filename, "--output", output])).rejects.toMatchObject({ code: "EEXIST" });
    expect(JSON.parse(await readFile(path.join(output, "failure.json"), "utf8"))).toEqual(report);
  });

  it("resolves evidence-directory aliases before creating files inside the source tree", async () => {
    const link = path.resolve("output", `.published-input-${path.basename(parent)}`);
    await mkdir(path.dirname(link), { recursive: true });
    await symlink(path.resolve("docs"), link, "dir");
    try {
      await expect(checkPublishedInstallationInput(["--input", "unused.json", "--output", path.join(link, "unwanted-evidence")])).rejects.toThrow(/isolated output/);
      await expect(lstat("docs/unwanted-evidence")).rejects.toMatchObject({ code: "ENOENT" });
    } finally { await rm(link, { force: true }); }
  });
});

describe("official npm package verification", () => {
  it("rejects metadata substitutions before following tarball URLs", async () => {
    for (const change of [{ name: "other" }, { version: "1.2.4" }, { dist: { ...metadata().dist, tarball: "https://wrong.invalid/package.tgz" } },
      { dist: { ...metadata().dist, integrity: `sha512-${Buffer.alloc(64).toString("base64")}` } }, { dist: {} }]) {
      const fetcher = vi.fn(async () => new Response(serialize({ ...metadata(), ...change })));
      await expect(readPublishedCli(cli, { fetcher })).rejects.toMatchObject({ code: "NPM_METADATA_BINDING" });
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });

  it("checks tarball bytes independently of trusted metadata and rejects non-archive content", async () => {
    const store = publicStore();
    store.entries.set(tarballUrl, gzipSync(Buffer.from("different package")));
    await expect(readPublishedCli(cli, store)).rejects.toMatchObject({ code: "NPM_TARBALL_INTEGRITY" });
    const plain = Buffer.from("not a gzip tarball");
    const alternate = { ...cli, distIntegrity: `sha512-${createHash("sha512").update(plain).digest("base64")}` };
    store.entries.set(metadataUrl, Buffer.from(serialize({ ...metadata(), dist: { ...metadata().dist, integrity: alternate.distIntegrity } })));
    store.entries.set(tarballUrl, plain);
    await expect(readPublishedCli(alternate, store)).rejects.toMatchObject({ code: "NPM_TARBALL_FORMAT" });
  });

  it("bounds untrusted metadata before parsing and rejects HTML or foreign redirects", async () => {
    for (const [result, code] of [[new Response("broken"), "NPM_METADATA_JSON"],
      [new Response("<html>bad</html>", { headers: { "content-type": "text/html" } }), "HTML_RESPONSE"],
      [new Response("x", { headers: { "content-length": "2097153" } }), "BODY_TOO_LARGE"],
      [new Response(null, { status: 302, headers: { location: "https://wrong.invalid/metadata" } }), "INVALID_REDIRECT"],
    ]) await expect(readPublishedCli(cli, { fetcher: async () => result, downloadOptions: { attempts: 1 } })).rejects.toMatchObject({ code });
  });
});
