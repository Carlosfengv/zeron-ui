import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { catalogCandidateReviewSchema, readCatalogPublicationCandidate, verifyCatalogPublicationSource } from "../scripts/agent-catalog-publication.mjs";
import { assembleVerifiedCatalogCandidate, writeCatalogCandidateFile } from "../scripts/create-agent-catalog-release.mjs";
import { planArtifactPublication, publishArtifactPublication, matchingArtifactUploadUrl } from "../scripts/publish-agent-artifacts.mjs";
import { artifactFileUrl, artifactFiles, artifactManifestSchema } from "../scripts/agent-artifacts.mjs";
import { verifyCiEvidence } from "../scripts/agent-ci-trust.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";

// All platform metadata, reports, success states and public storage are explicit fixtures.
// Injected gate callbacks test the controller only; they are not production CI/source approval.
let directory, fixture, ci, candidate;
const json = value => Buffer.from(serialize(value));
const reference = (name, bytes) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) });
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "zeron-catalog-publication-"));
  fixture = await ciEvidenceFixture(path.join(directory, "fixture"));
  ci = await verifyCiEvidence(fixture.context, { fetcher: fixture.fetcher, attempts: 1 });
  const object = suffix => JSON.parse([...fixture.publicObjects].find(([url]) => url.endsWith(suffix))[1]);
  const runtime = object("/runtime.json"); delete runtime.examples;
  for (const item of runtime.catalog.items) {
    const detail = runtime.details[item.id]; delete detail.examples;
    item.coverage = detail.guide !== null ? "guided" : "basic"; detail.item = structuredClone(item);
  }
  candidate = await assembleVerifiedCatalogCandidate({ runtime, identities: object("/item-identities.json"),
    prepared: { ...fixture.context.prepared, skillRelease: object(`/skills/releases/${fixture.context.prepared.input.skill.version}/manifest.json`) },
    sources: fixture.context.sources, ci, verificationBytes: ci.privateFiles.get(ci.receipt.consumer.report.path),
    exampleBytes: ci.privateFiles.get(ci.receipt.examples.report.path) });
}, 20000);
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });

async function localCandidate(name) {
  const root = path.join(directory, name), payload = path.join(root, "payload");
  for (const [name, bytes] of candidate.files) await writeCatalogCandidateFile(root, `payload/${name}`, bytes);
  const manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind: "catalog", releaseId: candidate.runtime.catalog.catalogVersion,
    baseUrl: candidate.baseUrl, provenance: fixture.context.prepared.input.source, files: await artifactFiles(payload, candidate.baseUrl, { kind: "catalog" }) });
  await writeCatalogCandidateFile(root, "payload/manifest.json", json(manifest));
  const inputs = new Map([["installation-input.json", json(fixture.context.prepared.input)],
    ["verification.json", ci.privateFiles.get(ci.receipt.consumer.report.path)], ["examples-verification.json", ci.privateFiles.get(ci.receipt.examples.report.path)],
    ["ci-locator.json", json(fixture.context.locator)], ["ci-verification.json", json(ci.receipt)]]);
  for (const [name, bytes] of inputs) await writeCatalogCandidateFile(root, `review/${name}`, bytes);
  const review = catalogCandidateReviewSchema.parse({ schemaVersion: 1, kind: "agent-catalog-candidate", status: "candidate-validated-not-published",
    scope: "fixed-source-ci-and-predecessor-checked-not-publication-or-deployment", source: manifest.provenance, catalogVersion: manifest.releaseId,
    manifest: reference("payload/manifest.json", json(manifest)), inputs: [...inputs].map(([name, bytes]) => reference(`review/${name}`, bytes)), predecessor: null });
  await writeCatalogCandidateFile(root, "candidate-review.json", json(review));
  return { root, payload, manifest, review, gate: { source: manifest.provenance, reviewSha256: sha256(json(review)), manifestSha256: sha256(json(manifest)) } };
}
const replace = async (root, name, bytes) => {
  await rm(path.join(root, name)); await writeCatalogCandidateFile(root, name, bytes);
};
function store() {
  const objects = new Map(), events = [];
  const fetcher = vi.fn(async (url, options) => {
    expect(options.headers.authorization).toBeUndefined(); events.push(["read", url]);
    return objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
  });
  const writer = vi.fn(async (name, body, options) => {
    const url = artifactFileUrl("https://artifacts.example.invalid", name);
    expect(options).toMatchObject({ access: "public", allowOverwrite: false, addRandomSuffix: false });
    events.push(["write", url]); objects.set(url, Buffer.from(body));
    // The SDK can return a literal colon while consumers retain the once-encoded canonical URL.
    return { url: url.replaceAll("%3A", ":") };
  });
  return { objects, events, fetcher, writer, downloadOptions: { attempts: 1, retryDelayMs: 0 } };
}

describe("Catalog local publication checks", () => {
  it("plans only declared public files and completion last, with no network", async () => {
    const local = await localCandidate("plan");
    const fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("dry-run cannot fetch"));
    try {
      const plan = await planArtifactPublication(local.payload, local.manifest);
      expect(plan.catalogReviewSha256).toBe(local.gate.reviewSha256); expect(plan.kind).toBe("catalog");
      expect(plan.entries.slice(-2).map(entry => entry.path)).toEqual(["manifest.json", "complete.json"]);
      expect(plan.entries.some(entry => entry.path.startsWith("review/") || entry.path.endsWith(".zip"))).toBe(false);
      expect(fetcher).not.toHaveBeenCalled();
    } finally { fetcher.mockRestore(); }
  });
  it("rejects a standalone manifest or any missing review input", async () => {
    for (const name of ["candidate-review.json", "review/ci-verification.json"]) {
      const local = await localCandidate(`missing-${name.replaceAll("/", "-")}`); await rm(path.join(local.root, name));
      await expect(planArtifactPublication(local.payload, local.manifest)).rejects.toHaveProperty("code", "ENOENT");
    }
  });
  it("rejects extra review fields and replacement report bytes before upload planning", async () => {
    const extra = await localCandidate("extra-review");
    await replace(extra.root, "candidate-review.json", json({ ...extra.review, passed: true }));
    await expect(planArtifactPublication(extra.payload, extra.manifest)).rejects.toHaveProperty("code", "CATALOG_REVIEW_CONTRACT");
    const changed = await localCandidate("changed-input");
    await replace(changed.root, "review/verification.json", Buffer.from("{}\n"));
    await expect(planArtifactPublication(changed.payload, changed.manifest)).rejects.toHaveProperty("code", "CATALOG_REVIEW_INPUT_BYTES");
  });
  it("rejects rewritten descriptors when the review no longer matches its public payload", async () => {
    const local = await localCandidate("rewritten-input"), bytes = Buffer.from("{}\n");
    await replace(local.root, "review/verification.json", bytes);
    local.review.inputs.find(ref => ref.path === "review/verification.json").bytes = bytes.length;
    local.review.inputs.find(ref => ref.path === "review/verification.json").sha256 = sha256(bytes);
    await replace(local.root, "candidate-review.json", json(local.review));
    await expect(planArtifactPublication(local.payload, local.manifest)).rejects.toHaveProperty("code", "CATALOG_REVIEW_PAYLOAD_BINDING");
  });
  it("cross-checks local CI locator, receipt and report hashes without treating them as authentication", async () => {
    const local = await localCandidate("locator-drift"), locator = structuredClone(fixture.context.locator); locator.consumer.jobId += 1000;
    const bytes = json(locator); await replace(local.root, "review/ci-locator.json", bytes);
    Object.assign(local.review.inputs.find(ref => ref.path === "review/ci-locator.json"), reference("review/ci-locator.json", bytes));
    await replace(local.root, "candidate-review.json", json(local.review));
    await expect(readCatalogPublicationCandidate(local.payload, local.manifest)).rejects.toHaveProperty("code", "CATALOG_REVIEW_CI_BINDING");
  });
});

describe("Catalog upload controller with explicit fixture gates", () => {
  it("requires a gate callback and matching immutable bindings before any network I/O", async () => {
    const local = await localCandidate("gate-required"), publicStore = store();
    await expect(publishArtifactPublication(local.payload, local.manifest, publicStore)).rejects.toHaveProperty("code", "CATALOG_REBUILD_GATE_REQUIRED");
    await expect(publishArtifactPublication(local.payload, local.manifest, { ...publicStore,
      verifyCatalogGate: async () => ({ ...local.gate, reviewSha256: "f".repeat(64) }) })).rejects.toHaveProperty("code", "CATALOG_GATE_CHANGED");
    expect(publicStore.fetcher).not.toHaveBeenCalled(); expect(publicStore.writer).not.toHaveBeenCalled();
  });
  it("reads every object before completion and supports literal-colon SDK results and identical retry", async () => {
    const local = await localCandidate("upload"), publicStore = store(), gate = vi.fn(async () => local.gate);
    const options = { ...publicStore, verifyCatalogGate: gate };
    const plan = await planArtifactPublication(local.payload, local.manifest);
    const report = await publishArtifactPublication(local.payload, local.manifest, options);
    expect(report.status).toBe("completed"); expect(report.catalogReviewSha256).toBe(local.gate.reviewSha256);
    expect(gate).toHaveBeenCalledTimes(1);
    const completion = publicStore.events.findIndex(([action, url]) => action === "write" && url.endsWith("/complete.json"));
    for (const entry of plan.entries.slice(0, -1)) expect(publicStore.events.slice(0, completion).filter(([action, url]) => action === "read" && url === entry.url)).toHaveLength(2);
    expect(publicStore.events.at(-1)).toEqual(["read", `${local.manifest.baseUrl}/complete.json`]);
    expect(publicStore.writer.mock.calls.some(([name]) => name.includes("/items/component:button.json"))).toBe(true);
    expect([...publicStore.objects].some(([url]) => url.includes("review/"))).toBe(false);
    publicStore.writer.mockClear(); const reused = await publishArtifactPublication(local.payload, local.manifest, options);
    expect(reused.completed.every(file => file.action === "reused")).toBe(true); expect(publicStore.writer).not.toHaveBeenCalled();
  });
  it("stops on conflicting public bytes and cannot emit completion", async () => {
    const local = await localCandidate("conflict"), publicStore = store();
    const plan = await planArtifactPublication(local.payload, local.manifest); publicStore.objects.set(plan.entries[0].url, Buffer.from("wrong"));
    await expect(publishArtifactPublication(local.payload, local.manifest, { ...publicStore, verifyCatalogGate: async () => local.gate }))
      .rejects.toMatchObject({ code: "HASH_OR_SIZE_MISMATCH", report: { status: "failed", completed: [] } });
    expect(publicStore.writer).not.toHaveBeenCalled(); expect(publicStore.objects.has(`${local.manifest.baseUrl}/complete.json`)).toBe(false);
  });
  it("resumes identical partial writes, while a failed gate keeps all objects unwritten", async () => {
    const local = await localCandidate("interruption"), publicStore = store(), write = publicStore.writer.getMockImplementation();
    const plan = await planArtifactPublication(local.payload, local.manifest);
    publicStore.writer.mockImplementation(async (...args) => {
      if (args[0] === decodeURIComponent(new URL(plan.entries[1].url).pathname.slice(1))) throw new Error("fixture transport failure");
      return write(...args);
    });
    await expect(publishArtifactPublication(local.payload, local.manifest, { ...publicStore, verifyCatalogGate: async () => local.gate })).rejects.toHaveProperty("code", "WRITE_NOT_CONFIRMED");
    expect(publicStore.objects.has(`${local.manifest.baseUrl}/complete.json`)).toBe(false);
    publicStore.writer.mockImplementation(write);
    const resumed = await publishArtifactPublication(local.payload, local.manifest, { ...publicStore, verifyCatalogGate: async () => local.gate });
    expect(resumed.completed[0].action).toBe("reused"); expect(resumed.status).toBe("completed");
    const failed = store();
    await expect(publishArtifactPublication(local.payload, local.manifest, { ...failed, verifyCatalogGate: async () => { throw new Error("untrusted-secret"); } }))
      .rejects.toMatchObject({ report: { status: "failed", completed: [], error: { code: "PUBLICATION_VALIDATION_OR_IO_FAILED" } } });
    expect(failed.fetcher).not.toHaveBeenCalled(); expect(failed.writer).not.toHaveBeenCalled();
  });
});

describe("production Catalog upload gates and SDK URL normalization", () => {
  it("accepts equivalent single encodings only, with no URL credentials, query, fragment or foreign path", () => {
    const expected = "https://store.public.blob.vercel-storage.com/ai/releases/version/items/component%3Abutton.json";
    for (const actual of [expected, expected.replace("%3A", ":"), expected.replace("%3A", "%3a")]) expect(matchingArtifactUploadUrl(actual, expected)).toBe(true);
    for (const actual of [expected.replace("%3A", "%253A"), expected.replace("%3A", "%2F"), expected.replace("button", "dialog"),
      `${expected}?token=secret`, `${expected}#part`, expected.replace("https://", "https://secret@"), expected.replace("store.public", "foreign.public"), undefined]) {
      expect(matchingArtifactUploadUrl(actual, expected)).toBe(false);
    }
  });
  it("uses the real CLI for dry-run but cannot promote a fixture review into source or CI approval", async () => {
    const local = await localCandidate("actual-cli"), manifest = path.join(local.payload, "manifest.json"), output = path.join(directory, "cli-plan.json");
    const args = ["scripts/publish-agent-artifacts.mjs", "--manifest", manifest];
    const text = execFileSync(process.execPath, [...args, "--dry-run", "--output", output], { encoding: "utf8", timeout: 15000 });
    expect(text).toContain("no network or upload"); expect(JSON.parse(await readFile(output)).kind).toBe("catalog");
    const fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("must not fetch"));
    try {
      await expect(verifyCatalogPublicationSource(local.payload, local.manifest)).rejects.toMatchObject({ code: expect.stringMatching(/DIRTY_SOURCE|SOURCE_BINDING_MISMATCH/) });
      expect(fetcher).not.toHaveBeenCalled();
    } finally { fetcher.mockRestore(); }
    let failure;
    try {
      execFileSync(process.execPath, [...args, "--upload", "--output", path.join(directory, "cli-upload.json")], { encoding: "utf8", stdio: "pipe", timeout: 15000,
        env: { ...process.env, ARTIFACT_BASE_URL: "https://artifacts.example.invalid", BLOB_READ_WRITE_TOKEN: "fixture-token-secret" } });
    } catch (error) { failure = error; }
    expect(failure.status).toBe(1); expect(String(failure.stderr)).toMatch(/DIRTY_SOURCE|SOURCE_BINDING_MISMATCH/);
    const rejected = await readFile(path.join(directory, "cli-upload.json"), "utf8"); expect(rejected).not.toContain("fixture-token-secret");
    expect(JSON.parse(rejected)).toMatchObject({ status: "failed", completed: [], scope: "publication-gate-rejected-no-network-write" });
  }, 20000);
});
