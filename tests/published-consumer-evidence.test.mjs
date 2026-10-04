import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { assembleConsumerVerification, publishConsumerEvidence, validateConsumerEvidenceBatch } from "../scripts/published-consumer-evidence.mjs";
import { parsePublishedConsumerArgs, testPublishedConsumerInstalls } from "../scripts/test-published-consumer-installs.mjs";
import { installationConfigurationSchema, parseInstallationPrepareArgs, preparePublishedInstallationInput, readPreparedCompletion } from "../scripts/prepare-published-installation-input.mjs";
import { installationInputSchema, publishedInstallationVerificationSchema } from "../scripts/agent-release-record.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

// All success-shaped data in this suite is an explicit pure-function fixture.
// Production CLI paths do not accept it or injected consumer results.
const origin = "https://consumer-fixtures.example.invalid";
const source = { sourceRevision: "a".repeat(40), sourceInputSha256: "b".repeat(64), lockfileSha256: "c".repeat(64), sourceClean: true };
const reference = url => ({ url, bytes: 20, sha256: "d".repeat(64) });
const skillVersion = "e".repeat(64);
const matrices = ["next", "vite"].flatMap(framework => ["npm", "pnpm"].map(packageManager => ({ framework, packageManager,
  testedItems: framework === "next" ? ["component:button", "block:login-01"] : ["component:button", "component:card"] })));
const input = installationInputSchema.parse({ schemaVersion: 1, kind: "published-installation-input", source,
  artifactBaseUrl: origin, siteBaseUrl: "https://docs.example.invalid",
  registry: { releaseId: "fixture", manifest: reference(`${origin}/r/releases/fixture/manifest.json`), completion: reference(`${origin}/r/releases/fixture/complete.json`) },
  skill: { version: skillVersion, artifacts: reference(`${origin}/skills/releases/${skillVersion}/artifacts.json`),
    completion: reference(`${origin}/skills/releases/${skillVersion}/complete.json`), manifest: reference(`${origin}/skills/releases/${skillVersion}/manifest.json`),
    archive: reference(`${origin}/skills/releases/${skillVersion}/zeron-skills.zip`), guide: reference(`${origin}/skills/releases/${skillVersion}/install.md`) },
  cli: { name: "zeron-ui", version: "1.2.3", distIntegrity: `sha512-${createHash("sha512").update("explicit fixture").digest("base64")}` },
  items: [{ id: "component:button", registryName: "button" }, { id: "component:card", registryName: "card" }, { id: "block:login-01", registryName: "login-01" }],
  matrices, nextOnlyRejectionItem: "block:login-01" });
const prepared = { input, npm: { cli: { ...input.cli, tarballUrl: "https://registry.npmjs.org/zeron-ui/-/zeron-ui-1.2.3.tgz", tarballBytes: 42 } },
  registry: { manifest: { baseUrl: `${origin}/r/releases/fixture` } }, scope: { staticCheckedItems: input.items.map(item => item.id),
    matrices: matrices.map(row => ({ ...row, registryClosure: row.framework === "next" ? ["button", "login-01"] : ["button", "card"] })) } };
const completed = prepared.scope.matrices.map(row => {
  const result = { ...row, nodeVersion: "22.17.0", frameworkVersion: row.framework === "next" ? "15.5.9" : "8.2.1",
    packageManagerVersion: row.packageManager === "npm" ? "10.9.2" : "10.12.4", passed: true,
    checks: { dryRun: true, install: true, types: true, build: true } };
  return { result, evidence: { schemaVersion: 1, kind: "published-consumer-evidence", scope: "actual-official-cli-and-final-registry-installation",
    source, inputSha256: sha256(serialize(input)), cli: prepared.npm.cli, registry: { releaseId: input.registry.releaseId, manifest: input.registry.manifest },
    matrix: result, templateSha256: "1".repeat(64), initialLockfileSha256: "2".repeat(64), finalLockfileSha256: "3".repeat(64),
    cliOwnFilesSha256: "4".repeat(64), finalProjectSha256: "5".repeat(64), businessSourcePreserved: true, themeInstalled: true, compiledTheme: true,
    nextOnlyRejection: row.framework === "vite" ? { item: input.nextOnlyRejectionItem, reason: "requires-next", unchanged: true } : null } };
});
const copy = value => JSON.parse(JSON.stringify(value));
function store() {
  const objects = new Map();
  const fetcher = vi.fn(async (url, options) => {
    expect(options.headers.authorization).toBeUndefined();
    return objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
  });
  const writer = vi.fn(async (pathname, bytes, options) => {
    expect(options).toMatchObject({ access: "public", addRandomSuffix: false, allowOverwrite: false });
    expect(pathname).toMatch(/^evidence\/consumer\/[a-f0-9]{64}\.json$/);
    const url = `${origin}/${pathname}`;
    objects.set(url, Buffer.from(bytes));
    return { url };
  });
  return { objects, writer, fetcher, downloadOptions: { attempts: 1, retryDelayMs: 0 } };
}

let parent;
beforeAll(async () => { parent = await mkdtemp(path.join(tmpdir(), "zeron-consumer-evidence-test-")); });
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

describe("consumer evidence publication gates", () => {
  it("binds canonical evidence bytes to input, complete four-grid scope and source", () => {
    const batch = validateConsumerEvidenceBatch(prepared, completed);
    expect(batch).toHaveLength(4);
    for (const item of batch) {
      expect(item.reference.sha256).toBe(sha256(item.bytes));
      expect(item.reference.bytes).toBe(item.bytes.length);
      expect(item.reference.url).toBe(`${origin}/evidence/consumer/${item.reference.sha256}.json`);
    }
  });

  it("rejects any failure, missing row or stale source before writing the first object", async () => {
    const cases = [completed.slice(1), [completed[0], completed[0], ...completed.slice(2)]];
    for (const mutate of [
      rows => { rows[0].result.checks.build = false; },
      rows => { rows[0].evidence.source.sourceRevision = "f".repeat(40); },
      rows => { rows[0].evidence.inputSha256 = "0".repeat(64); },
      rows => { rows[0].evidence.matrix.registryClosure.push("unverified"); },
      rows => { rows[2].evidence.nextOnlyRejection = null; },
      rows => { rows[2].evidence.nextOnlyRejection.unchanged = false; },
    ]) { const rows = copy(completed); mutate(rows); cases.push(rows); }
    for (const rows of cases) {
      const io = store();
      await expect(publishConsumerEvidence(prepared, rows, io)).rejects.toBeDefined();
      expect(io.writer).not.toHaveBeenCalled();
      expect(io.fetcher).not.toHaveBeenCalled();
    }
  });

  it("uploads four immutable objects, anonymously reads them back and reuses exact retries", async () => {
    const io = store();
    const refs = await publishConsumerEvidence(prepared, completed, io);
    expect(io.writer).toHaveBeenCalledTimes(4);
    expect(await publishConsumerEvidence(prepared, completed, io)).toEqual(refs);
    expect(io.writer).toHaveBeenCalledTimes(4);
    const report = assembleConsumerVerification(prepared, completed, refs);
    expect(publishedInstallationVerificationSchema.parse(report)).toEqual(report);
    expect(report.matrices.map(row => row.evidence)).toEqual(refs);
  });

  it("rejects existing wrong bytes instead of overwriting an immutable path", async () => {
    const io = store();
    const first = validateConsumerEvidenceBatch(prepared, completed)[0];
    io.objects.set(first.reference.url, Buffer.alloc(first.bytes.length, 32));
    await expect(publishConsumerEvidence(prepared, completed, io)).rejects.toMatchObject({ code: "HASH_OR_SIZE_MISMATCH" });
    expect(io.writer).not.toHaveBeenCalled();
  });

  it("preserves partial objects after an interruption and resumes only identical evidence", async () => {
    const io = store();
    const actualWriter = io.writer.getMockImplementation();
    io.writer.mockImplementationOnce(actualWriter).mockImplementationOnce(async () => { throw new Error("interrupted fixture write"); });
    await expect(publishConsumerEvidence(prepared, completed, io)).rejects.toMatchObject({ code: "EVIDENCE_WRITE_NOT_CONFIRMED" });
    expect(io.objects.size).toBe(1);
    io.writer.mockImplementation(actualWriter);
    expect(await publishConsumerEvidence(prepared, completed, io)).toHaveLength(4);
    expect(io.objects.size).toBe(4);
  });

  it("recovers unknown write outcomes only through exact public readback", async () => {
    const io = store();
    const actualWriter = io.writer.getMockImplementation();
    io.writer.mockImplementationOnce(async (...args) => { await actualWriter(...args); throw new Error("write succeeded, acknowledgement lost"); });
    expect(await publishConsumerEvidence(prepared, completed, io)).toHaveLength(4);
    const bad = store();
    bad.writer.mockImplementationOnce(async (pathname, bytes) => {
      bad.objects.set(`${origin}/${pathname}`, bytes);
      return { url: `https://other.invalid/${pathname}` };
    });
    await expect(publishConsumerEvidence(prepared, completed, bad)).rejects.toMatchObject({ code: "EVIDENCE_UPLOAD_URL" });
  });

  it("times out an unconfirmed write and disallows mismatched formal report references", async () => {
    const io = store();
    io.writer.mockImplementation(() => new Promise(() => {}));
    await expect(publishConsumerEvidence(prepared, completed, { ...io, timeoutMs: 10 })).rejects.toMatchObject({ code: "EVIDENCE_WRITE_NOT_CONFIRMED" });
    const refs = validateConsumerEvidenceBatch(prepared, completed).map(item => item.reference);
    expect(() => assembleConsumerVerification(prepared, completed, refs.slice(1))).toThrow(/EVIDENCE_REFERENCE_BINDING/);
    expect(() => assembleConsumerVerification(prepared, completed, refs.map(ref => ({ ...ref, sha256: "0".repeat(64) })))).toThrow(/EVIDENCE_REFERENCE_BINDING/);
  });
});

describe("production execution and preparation entry points", () => {
  it("accepts only explicit input/output and a single evidence publishing flag", () => {
    expect(parsePublishedConsumerArgs(["--input", "input.json", "--output", path.join(parent, "fresh"), "--publish-evidence"]).publishEvidence).toBe(true);
    for (const args of [[], ["--input", "input.json", "--output", "docs/unsafe"],
      ["--input", "input.json", "--output", "output/fresh", "--fixture", "pass"],
      ["--input", "input.json", "--output", "output/fresh", "--publish-evidence", "--publish-evidence"]]) {
      expect(() => parsePublishedConsumerArgs(args)).toThrow();
    }
  });

  it("enforces the real runtime/source gate and cannot leave a success report", async () => {
    const filename = path.join(parent, "missing-input.json");
    const directory = path.join(parent, "rejected-consumer");
    await expect(testPublishedConsumerInstalls(["--input", filename, "--output", directory])).rejects.toBeDefined();
    const failure = JSON.parse(await readFile(path.join(directory, "failure.json"), "utf8"));
    expect(failure).toMatchObject({ status: "failed", phase: "input", matrix: null });
    await expect(readFile(path.join(directory, "verification.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(testPublishedConsumerInstalls(["--input", filename, "--output", directory])).rejects.toMatchObject({ code: "EEXIST" });
  });

  it("validates descriptor preparation flags and strict configuration independently of Catalog", () => {
    const args = ["--registry-manifest", "registry.json", "--skill-artifacts", "skill.json", "--skill-provenance", "skill.source.json", "--config", "config.json", "--output", path.join(parent, "prepare")];
    expect(parseInstallationPrepareArgs(args)).toMatchObject({ output: path.join(parent, "prepare") });
    expect(() => parseInstallationPrepareArgs(args.slice(2))).toThrow();
    expect(() => parseInstallationPrepareArgs([...args, "--pass", "true"])).toThrow();
    const config = { schemaVersion: 1, siteBaseUrl: input.siteBaseUrl, cli: input.cli, matrices, nextOnlyRejectionItem: input.nextOnlyRejectionItem };
    expect(installationConfigurationSchema.safeParse(config).success).toBe(true);
    expect(installationConfigurationSchema.safeParse({ ...config, catalogVersion: "0".repeat(64) }).success).toBe(false);
  });

  it.each([
    ["duplicate pair", rows => { rows[1] = structuredClone(rows[0]); }],
    ["Next omits the rejection representative", rows => { rows[0].testedItems = ["component:button"]; }],
    ["Vite consumes the Next-only representative", rows => { rows[2].testedItems.push("block:login-01"); }],
  ])("rejects invalid matrix configuration before resource preparation: %s", (_, mutate) => {
    const rows = structuredClone(matrices); mutate(rows);
    const config = { schemaVersion: 1, siteBaseUrl: input.siteBaseUrl, cli: input.cli, matrices: rows,
      nextOnlyRejectionItem: input.nextOnlyRejectionItem };
    expect(installationConfigurationSchema.safeParse(config).success).toBe(false);
    expect(installationInputSchema.safeParse({ ...input, matrices: rows }).success).toBe(false);
  });

  it("accepts all four distinct combinations in any order without adding a success declaration", () => {
    const config = { schemaVersion: 1, siteBaseUrl: input.siteBaseUrl, cli: input.cli, matrices: [...matrices].reverse(),
      nextOnlyRejectionItem: input.nextOnlyRejectionItem };
    expect(installationConfigurationSchema.parse(config)).toEqual(config);
    expect(config).not.toHaveProperty("passed");
  });

  it("matches actual completion bytes and rejects an invented completion or drift", async () => {
    const completion = { schemaVersion: 1, kind: "registry", releaseId: "fixture", baseUrl: `${origin}/r/releases/fixture`,
      manifestUrl: `${origin}/r/releases/fixture/manifest.json`, manifestSha256: "6".repeat(64), files: 2, totalBytes: 42 };
    const bytes = Buffer.from(serialize(completion));
    const plan = { baseUrl: `${origin}/r/releases/fixture`, completion,
      entries: [{ role: "completion", url: `${origin}/r/releases/fixture/complete.json`, bytes: bytes.length, sha256: sha256(bytes) }] };
    expect(await readPreparedCompletion(plan, { fetcher: async () => new Response(bytes) })).toEqual(completion);
    await expect(readPreparedCompletion({ ...plan, entries: [] })).rejects.toMatchObject({ code: "PREPARE_COMPLETION_PLAN" });
    await expect(readPreparedCompletion(plan, { fetcher: async () => new Response(Buffer.alloc(bytes.length)) })).rejects.toMatchObject({ code: "HASH_OR_SIZE_MISMATCH" });
  });

  it("preparation cannot turn dirty source into a formal descriptor", async () => {
    const output = path.join(parent, "prepare-source-gate");
    await expect(preparePublishedInstallationInput(["--registry-manifest", "missing.json", "--skill-artifacts", "missing.json", "--skill-provenance", "missing.json", "--config", "missing.json", "--output", output])).rejects.toBeDefined();
    expect(JSON.parse(await readFile(path.join(output, "failure.json"), "utf8"))).toMatchObject({ status: "failed" });
    await expect(readFile(path.join(output, "installation-input.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
