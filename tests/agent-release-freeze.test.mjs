import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { assembleFrozenReleaseDraft, freezeAgentRelease, parseReleaseFreezeArgs, verifyFrozenReleaseDraft } from "../scripts/freeze-agent-release.mjs";
import { assembleVerifiedCatalogCandidate, writeCatalogCandidateFile } from "../scripts/create-agent-catalog-release.mjs";
import { readCatalogPublicationCandidate } from "../scripts/agent-catalog-publication.mjs";
import { artifactFiles, artifactFileUrl, artifactManifestSchema } from "../scripts/agent-artifacts.mjs";
import { planArtifactPublication } from "../scripts/publish-agent-artifacts.mjs";
import { verifyCiEvidence } from "../scripts/agent-ci-trust.mjs";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

// All successful reports, platform metadata and public storage are synthetic fixtures.
// Actual production entry tests are rejection paths only; no Blob or CI success is claimed.
const json = value => Buffer.from(serialize(value));
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
let directory, fixture, ci, manifest, local, draft, publication;
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "zeron-release-freeze-"));
  fixture = await ciEvidenceFixture(path.join(directory, "fixture"));
  ci = await verifyCiEvidence(fixture.context, { fetcher: fixture.fetcher, attempts: 1 });
  const object = suffix => JSON.parse([...fixture.publicObjects].find(([url]) => url.endsWith(suffix))[1]);
  const runtime = object("/runtime.json"); delete runtime.examples;
  for (const item of runtime.catalog.items) {
    const detail = runtime.details[item.id]; delete detail.examples;
    item.coverage = detail.guide !== null ? "guided" : "basic"; detail.item = structuredClone(item);
  }
  const candidate = await assembleVerifiedCatalogCandidate({ runtime, identities: object("/item-identities.json"),
    prepared: { ...fixture.context.prepared, skillRelease: object(`/skills/releases/${fixture.context.prepared.input.skill.version}/manifest.json`) },
    sources: fixture.context.sources, ci, verificationBytes: ci.privateFiles.get(ci.receipt.consumer.report.path), exampleBytes: ci.privateFiles.get(ci.receipt.examples.report.path) });
  local = path.join(directory, "candidate");
  for (const [name, bytes] of candidate.files) await writeCatalogCandidateFile(local, `payload/${name}`, bytes);
  manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind: "catalog", releaseId: candidate.runtime.catalog.catalogVersion,
    baseUrl: candidate.baseUrl, provenance: fixture.context.prepared.input.source, files: await artifactFiles(path.join(local, "payload"), candidate.baseUrl, { kind: "catalog" }) });
  await writeCatalogCandidateFile(local, "payload/manifest.json", json(manifest));
  const inputs = new Map([["installation-input.json", json(fixture.context.prepared.input)], ["verification.json", ci.privateFiles.get(ci.receipt.consumer.report.path)],
    ["examples-verification.json", ci.privateFiles.get(ci.receipt.examples.report.path)], ["ci-locator.json", json(fixture.context.locator)], ["ci-verification.json", json(ci.receipt)]]);
  for (const [name, bytes] of inputs) await writeCatalogCandidateFile(local, `review/${name}`, bytes);
  for (const [name, bytes] of ci.privateFiles) await writeCatalogCandidateFile(local, `review/ci/${name}`, bytes);
  await writeCatalogCandidateFile(local, "candidate-review.json", json({ schemaVersion: 1, kind: "agent-catalog-candidate", status: "candidate-validated-not-published",
    scope: "fixed-source-ci-and-predecessor-checked-not-publication-or-deployment", source: manifest.provenance, catalogVersion: manifest.releaseId,
    manifest: descriptor("payload/manifest.json", json(manifest)), inputs: [...inputs].map(([name, bytes]) => descriptor(`review/${name}`, bytes)), predecessor: null }));
  publication = await planArtifactPublication(path.join(local, "payload"), manifest);
  for (const [name, bytes] of candidate.files) fixture.publicObjects.set(artifactFileUrl(manifest.baseUrl, name), bytes);
  fixture.publicObjects.set(artifactFileUrl(manifest.baseUrl, "manifest.json"), json(manifest));
  fixture.publicObjects.set(artifactFileUrl(manifest.baseUrl, "complete.json"), json(publication.completion));
  draft = assembleFrozenReleaseDraft({ input: fixture.context.prepared.input, manifest, verificationBytes: inputs.get("verification.json") });
}, 20000);
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });
const args = output => ["--input", path.join(local, "review/installation-input.json"), "--verification", path.join(local, "review/verification.json"),
  "--examples", path.join(local, "review/examples-verification.json"), "--ci-evidence", path.join(local, "review/ci-locator.json"),
  "--catalog-manifest", path.join(local, "payload/manifest.json"), "--predecessor", "none", "--output", output];
const absent = async file => { await expect(access(file)).rejects.toHaveProperty("code", "ENOENT"); };

describe("frozen release draft contract", () => {
  it("registers a closed seven-input CLI with no receipt import, storage URL or skip switches", async () => {
    const pkg = JSON.parse(await readFile("package.json", "utf8"));
    expect(pkg.scripts["agents:release:freeze"]).toBe("node scripts/freeze-agent-release.mjs");
    const parsed = parseReleaseFreezeArgs(args(path.join(directory, "parse"))); expect(parsed.predecessor).toBe("none");
    for (const bad of [[...args(path.join(directory, "bad")), "--skip-ci", "true"], [...args(path.join(directory, "bad")), "--catalog-manifest", "duplicate"], args(path.join(directory, "bad")).slice(0, -2)]) {
      expect(() => parseReleaseFreezeArgs(bad)).toThrow();
    }
  });
  it("computes deterministic record/selection bytes and exact public completion hash", () => {
    const again = assembleFrozenReleaseDraft({ input: fixture.context.prepared.input, manifest, verificationBytes: ci.privateFiles.get(ci.receipt.consumer.report.path) });
    expect(again.recordBytes).toEqual(draft.recordBytes); expect(again.selection.current.sha256).toBe(sha256(draft.recordBytes));
    expect(draft.record.catalog.completion.sha256).toBe(sha256(json(publication.completion)));
    expect(draft.record.history).toEqual([]); expect(draft.record.source.sourceRevision).toBe(fixture.context.prepared.input.source.sourceRevision);
  });
  it("rejects other sources, wrong report bytes, malformed predecessor references and self history", () => {
    const changed = structuredClone(manifest); changed.provenance.sourceInputSha256 = "0".repeat(64);
    expect(() => assembleFrozenReleaseDraft({ input: fixture.context.prepared.input, manifest: changed, verificationBytes: ci.privateFiles.get(ci.receipt.consumer.report.path) })).toThrow(/FREEZE_CATALOG_BINDING/);
    expect(() => assembleFrozenReleaseDraft({ input: fixture.context.prepared.input, manifest, verificationBytes: Buffer.from("{}\n") })).toThrow(/FREEZE_REPORT_BYTES/);
    const baseline = { record: draft.record, bytes: draft.recordBytes, reference: draft.recordReference, history: [draft.recordReference] };
    expect(() => assembleFrozenReleaseDraft({ input: fixture.context.prepared.input, manifest, verificationBytes: ci.privateFiles.get(ci.receipt.consumer.report.path), baseline })).toThrow(/self-referencing/);
  });
  it("restores all three published stages and complete example evidence in a disposable directory", async () => {
    const before = await readFile("public/llms.txt");
    const proof = await verifyFrozenReleaseDraft(draft, new Map(), { fetcher: fixture.fetcher, downloadOptions: { attempts: 1 } });
    expect(proof.status).toBe("passed"); expect(proof.catalogVersion).toBe(manifest.releaseId); expect(proof.versions).toEqual([manifest.releaseId]);
    expect(await readFile("public/llms.txt")).toEqual(before);
  }, 20000);
  it("binds the approved predecessor raw bytes and restores it alongside the new draft", async () => {
    const name = (await readdir(path.join(directory, "fixture"))).find(name => /^[a-f0-9]{64}\.json$/.test(name));
    const bytes = await readFile(path.join(directory, "fixture", name)), record = JSON.parse(bytes.toString("utf8")), ref = descriptor(name, bytes);
    const baseline = { record, bytes, reference: ref, history: [ref], applicationSelection: ref };
    const next = assembleFrozenReleaseDraft({ input: fixture.context.prepared.input, manifest, verificationBytes: ci.privateFiles.get(ci.receipt.consumer.report.path), baseline });
    expect(next.record.history).toEqual([ref]);
    const proof = await verifyFrozenReleaseDraft(next, new Map([[name, bytes]]), { fetcher: fixture.fetcher, downloadOptions: { attempts: 1 } });
    expect(proof.versions).toEqual([manifest.releaseId, record.catalog.version]);
    await expect(verifyFrozenReleaseDraft(next, new Map([[name, json({})]]))).rejects.toHaveProperty("code", "FREEZE_HISTORY_BYTES");
  }, 20000);
  it("rejects missing or altered public completions and supplied history outside the fixed draft", async () => {
    const url = draft.record.catalog.completion.url, original = fixture.publicObjects.get(url);
    fixture.publicObjects.delete(url);
    try { await expect(verifyFrozenReleaseDraft(draft, new Map(), { fetcher: fixture.fetcher, downloadOptions: { attempts: 1 } })).rejects.toHaveProperty("code", "NOT_FOUND"); }
    finally { fixture.publicObjects.set(url, original); }
    fixture.publicObjects.set(url, json({ ...publication.completion, files: 1 }));
    try { await expect(verifyFrozenReleaseDraft(draft, new Map(), { fetcher: fixture.fetcher, downloadOptions: { attempts: 1 } })).rejects.toThrow(); }
    finally { fixture.publicObjects.set(url, original); }
    await expect(verifyFrozenReleaseDraft(draft, new Map([["unlisted.json", json({})]]))).rejects.toHaveProperty("code", "FREEZE_HISTORY_FILE_SET");
  });
  it("actually refuses dirty/incorrect source before CI or storage I/O and produces no usable record", async () => {
    const output = path.join(directory, "production-refusal"), fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("must not fetch"));
    try {
      await expect(freezeAgentRelease(args(output))).rejects.toHaveProperty("code", expect.stringMatching(/DIRTY_SOURCE|SOURCE_BINDING_MISMATCH/));
      expect(fetcher).not.toHaveBeenCalled();
    } finally { fetcher.mockRestore(); }
    const failure = JSON.parse(await readFile(path.join(output, "failure.json"), "utf8")); expect(failure.phase).toBe("source");
    await absent(path.join(output, "releases")); await absent(path.join(output, "freeze-review.json"));
    await expect(freezeAgentRelease(args(output))).rejects.toHaveProperty("code", "EEXIST");
  });
  it("runs the actual CLI rejection path without hanging or leaking configuration", async () => {
    const output = path.join(directory, "cli-refusal"); let failure;
    try { execFileSync(process.execPath, ["scripts/freeze-agent-release.mjs", ...args(output)], { encoding: "utf8", timeout: 15000, stdio: ["ignore", "pipe", "pipe"] }); }
    catch (error) { failure = error; }
    expect(failure?.status).toBe(1); expect(String(failure.stderr)).toMatch(/Release freeze failed: (?:DIRTY_SOURCE|SOURCE_BINDING_MISMATCH)/);
    expect(String(failure.stderr)).not.toMatch(/https:|token|secret/);
    await absent(path.join(output, "releases")); await absent(path.join(output, "freeze-review.json"));
  });
  it("continues requiring the complete candidate review rather than accepting an isolated manifest", async () => {
    await expect(readCatalogPublicationCandidate(path.join(local, "payload"), manifest)).resolves.toHaveProperty("manifestSha256", sha256(json(manifest)));
    const isolated = path.join(directory, "isolated"); await writeCatalogCandidateFile(isolated, "payload/manifest.json", json(manifest));
    await expect(freezeAgentRelease([...args(path.join(directory, "isolated-refusal"))].map(value => value === path.join(local, "payload/manifest.json") ? path.join(isolated, "payload/manifest.json") : value))).rejects.toThrow();
    await absent(path.join(directory, "isolated-refusal/releases"));
  });
});
