import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { assembleVerifiedCatalogCandidate, createAgentCatalogRelease, parseCatalogReleaseArgs, writeCatalogCandidateFile } from "../scripts/create-agent-catalog-release.mjs";
import { selectCatalogPredecessor } from "../scripts/agent-catalog-predecessor.mjs";
import { verifyCiEvidence } from "../scripts/agent-ci-trust.mjs";
import { artifactFiles, artifactManifestSchema, verifyArtifactDirectory } from "../scripts/agent-artifacts.mjs";
import { verifyCatalogReleaseFiles } from "../scripts/agent-catalog-release.mjs";
import { loadAgentSchema } from "../scripts/load-agent-schema.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { releaseFixture } from "./helpers/agent-release-fixture.mjs";

// Platform, public resources, successful reports and screenshots are explicit fixtures.
// This suite does not establish real CI, published installations or production approval.
let directory, fixture, schemas, ci, baseline, identities, prepared, a, b, c;
const json = value => Buffer.from(serialize(value));
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "zeron-catalog-candidate-")); schemas = await loadAgentSchema();
  fixture = await ciEvidenceFixture(path.join(directory, "ci"));
  ci = await verifyCiEvidence(fixture.context, { fetcher: fixture.fetcher, attempts: 1 });
  const readObject = suffix => JSON.parse([...fixture.publicObjects].find(([url]) => url.endsWith(suffix))[1].toString("utf8"));
  baseline = readObject("/runtime.json"); identities = readObject("/item-identities.json");
  delete baseline.examples; baseline.installation = null;
  baseline.catalog = { ...baseline.catalog, mode: "development", catalogUrl: null, sourceRevision: null, registryReleaseId: null };
  for (const item of baseline.catalog.items) {
    const detail = baseline.details[item.id]; delete detail.examples;
    item.coverage = detail.guide !== null ? "guided" : "basic"; detail.item = structuredClone(item);
  }
  prepared = { ...fixture.context.prepared, skillRelease: readObject(`/skills/releases/${fixture.context.prepared.input.skill.version}/manifest.json`) };
  const objects = new Map();
  a = await releaseFixture({ directory: path.join(directory, "records"), label: "a", objects, schemas });
  b = await releaseFixture({ directory: path.join(directory, "records"), label: "b", objects, schemas, history: [a.localRef] });
  c = await releaseFixture({ directory: path.join(directory, "records"), label: "c", objects, schemas, history: [b.localRef, a.localRef] });
}, 20000);
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });
const assemble = (overrides = {}) => assembleVerifiedCatalogCandidate({ runtime: structuredClone(baseline), identities,
  prepared, sources: fixture.context.sources, ci, schemas,
  verificationBytes: ci.privateFiles.get(ci.receipt.consumer.report.path), exampleBytes: ci.privateFiles.get(ci.receipt.examples.report.path), ...overrides });
const selection = record => json({ schemaVersion: 1, current: record.localRef });
const records = (...releases) => new Map(releases.map(value => [value.localRef.path, value.recordBytes]));

describe("Catalog candidate bindings and isolated files", () => {
  it("assembles full three-example content from fresh CI-checked raw reports", async () => {
    const candidate = await assemble();
    expect(candidate.runtime.examples.entries).toHaveLength(3);
    expect(JSON.parse(candidate.files.get("examples/verification.json")).rows).toHaveLength(12);
    expect(candidate.files.get("installation-verification.json")).toEqual(ci.privateFiles.get(ci.receipt.consumer.report.path));
    expect(candidate.executionTrust).toBe("not-verified-by-pure-assembly");
    const output = path.join(directory, "assembled");
    for (const [name, bytes] of candidate.files) await writeCatalogCandidateFile(output, `payload/${name}`, bytes);
    const payload = path.join(output, "payload");
    const manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind: "catalog", releaseId: candidate.runtime.catalog.catalogVersion,
      baseUrl: candidate.baseUrl, provenance: prepared.input.source, files: await artifactFiles(payload, candidate.baseUrl, { kind: "catalog" }) });
    await writeCatalogCandidateFile(output, "payload/manifest.json", json(manifest));
    expect(await verifyArtifactDirectory(payload, manifest)).toHaveProperty("manifestSha256", sha256(serialize(manifest)));
    expect((await verifyCatalogReleaseFiles(candidate.files, manifest, { schemas })).runtime).toEqual(candidate.runtime);
    const item = manifest.files.find(file => file.path === "items/component:button.json");
    expect(item.url).toContain("/items/component%3Abutton.json");
    expect(await readFile(path.join(payload, item.path))).toEqual(candidate.files.get(item.path));
    expect(manifest.files.some(file => file.path.startsWith("review/"))).toBe(false);
  });

  it("rejects standalone receipts, changed reports and mixed installation inputs", async () => {
    await expect(assemble({ ci: { receipt: ci.receipt, privateFiles: ci.privateFiles } })).rejects.toHaveProperty("code", "CATALOG_CI_REPORT_BYTES");
    for (const key of ["verificationBytes", "exampleBytes"]) {
      const raw = key === "verificationBytes" ? ci.privateFiles.get(ci.receipt.consumer.report.path) : ci.privateFiles.get(ci.receipt.examples.report.path);
      await expect(assemble({ [key]: Buffer.concat([raw, Buffer.from(" ")]) })).rejects.toHaveProperty("code", "CATALOG_CI_REPORT_BYTES");
    }
    await expect(assemble({ prepared: { ...prepared, input: { ...prepared.input, source: { ...prepared.input.source, sourceRevision: "f".repeat(40) } } } }))
      .rejects.toHaveProperty("code", "CATALOG_CI_INPUT_BINDING");
  });

  it("requires four profiles for every maintained example and all attachment bytes", async () => {
    const sources = { ...fixture.context.sources, manifest: structuredClone(fixture.context.sources.manifest) };
    sources.manifest.declarations.examples[0].profiles.pop();
    await expect(assemble({ sources })).rejects.toHaveProperty("code", "CATALOG_FULL_EXAMPLES_REQUIRED");
    const attachments = new Map(ci.archives.examples.attachments); attachments.delete(attachments.keys().next().value);
    await expect(assemble({ ci: { ...ci, archives: { ...ci.archives, examples: { ...ci.archives.examples, attachments } } } })).rejects.toThrow();
  });

  it("compares predecessor identities, aliases and fixed guide owners before assembly", async () => {
    const predecessor = { identities: structuredClone(identities), runtime: structuredClone(baseline) };
    await expect(assemble({ predecessor })).resolves.toHaveProperty("runtime.catalog.mode", "release");
    predecessor.identities.items[0].aliases.push("published-alias");
    await expect(assemble({ predecessor })).rejects.toThrow("Keep all previously published aliases");
    predecessor.identities = structuredClone(identities);
    predecessor.identities.items.push({ id: "component:old-control", type: "registry", key: "old-control", aliases: ["old-control"], status: "active", retirementReason: null });
    await expect(assemble({ predecessor })).rejects.toThrow("Keep the registered ID");
    predecessor.identities = structuredClone(identities);
    predecessor.runtime.guideRoutes.routes[0].itemId = "component:dialog";
    await expect(assemble({ predecessor })).rejects.toThrow("Keep the published guide path");
  });

  it("refuses traversal, pre-encoded paths and replacing any existing result", async () => {
    for (const relative of ["../secret.json", "/absolute.json", "payload/items/component%3Abutton.json", "payload//item.json", "payload/./item.json"]) {
      await expect(writeCatalogCandidateFile(path.join(directory, "unsafe"), relative, json({}))).rejects.toThrow();
    }
    await expect(writeCatalogCandidateFile(path.join(directory, "assembled"), "payload/manifest.json", json({}))).rejects.toHaveProperty("code", "EEXIST");
  });
});

describe("approved predecessor is independent from rolled-back application selection", () => {
  it("accepts an explicit first release only with no committed records or selection", () => {
    expect(selectCatalogPredecessor(new Map(), undefined, "none")).toBeNull();
    expect(() => selectCatalogPredecessor(new Map(), selection(a), "none")).toThrow("PREDECESSOR_FIRST_RELEASE");
    expect(() => selectCatalogPredecessor(new Map(), undefined, a.localRef.path)).toThrow("PREDECESSOR_FIRST_RELEASE");
  });
  it("selects B after production rolls back to A, and retains explicit history", () => {
    const chosen = selectCatalogPredecessor(records(a, b), selection(a), b.localRef.path);
    expect(chosen.reference).toEqual(b.localRef); expect(chosen.applicationSelection).toEqual(a.localRef);
    expect(chosen.history).toEqual([b.localRef, a.localRef]);
    expect(() => selectCatalogPredecessor(records(a, b), selection(a), a.localRef.path)).toThrow("PREDECESSOR_NOT_APPROVED_TIP");
    expect(() => selectCatalogPredecessor(records(a, b), selection(a), "none")).toThrow("PREDECESSOR_BASELINE_REQUIRED");
  });
  it("validates every historical record and raw hash before selecting the unique tip", () => {
    expect(selectCatalogPredecessor(records(a, b, c), selection(a), c.localRef.path).reference).toEqual(c.localRef);
    const missing = records(b); expect(() => selectCatalogPredecessor(missing, selection(b), b.localRef.path)).toThrow("PREDECESSOR_HISTORY_BYTES");
    const corrupt = records(a, b); corrupt.set(a.localRef.path, Buffer.concat([a.recordBytes, Buffer.from(" ")]));
    expect(() => selectCatalogPredecessor(corrupt, selection(b), b.localRef.path)).toThrow();
    expect(() => selectCatalogPredecessor(records(a, b), undefined, b.localRef.path)).toThrow("PREDECESSOR_BASELINE_REQUIRED");
    expect(() => selectCatalogPredecessor(records(a), json({ schemaVersion: 1, current: { ...a.localRef, sha256: "f".repeat(64) } }), a.localRef.path)).toThrow("PREDECESSOR_SELECTION_BYTES");
  });
  it("rejects competing chains and reordered history instead of guessing the latest", () => {
    const fork = { ...c.record, history: [] }, forkBytes = json(fork);
    const branches = records(a, b); branches.set(c.localRef.path, forkBytes);
    expect(() => selectCatalogPredecessor(branches, selection(b), b.localRef.path)).toThrow("PREDECESSOR_AMBIGUOUS_BASELINE");
    const reordered = records(a, b, c); reordered.set(c.localRef.path, json({ ...c.record, history: [a.localRef, b.localRef] }));
    expect(() => selectCatalogPredecessor(reordered, selection(a), c.localRef.path)).toThrow("PREDECESSOR_DISCONNECTED_HISTORY");
  });
});

describe("closed production candidate CLI", () => {
  const cliArgs = output => ["--input", path.join(directory, "input.json"), "--verification", path.join(directory, "consumer.json"),
    "--examples", path.join(directory, "examples.json"), "--ci-evidence", path.join(directory, "locator.json"), "--predecessor", "none", "--output", output];
  it("requires all declared flags, isolated output, and rejects trust overrides", () => {
    expect(parseCatalogReleaseArgs(cliArgs(path.join(directory, "candidate")))).toHaveProperty("predecessor", "none");
    for (const extra of [["--skip", "yes"], ["--mock", "yes"], ["--policy", "other"], ["--import-pass", "report"], ["--output", "duplicate"]]) {
      expect(() => parseCatalogReleaseArgs([...cliArgs(path.join(directory, "candidate")), ...extra])).toThrow("CATALOG_ARGUMENTS");
    }
    expect(() => parseCatalogReleaseArgs(cliArgs(path.resolve("docs/agent-data/candidate")))).toThrow("isolated output");
    expect(() => parseCatalogReleaseArgs(cliArgs(path.join(directory, "candidate")).slice(0, -2))).toThrow("CATALOG_ARGUMENTS");
  });
  it("cannot publish a fixture pass: actual dirty/source gates reject before any network", async () => {
    await writeFile(path.join(directory, "input.json"), serialize(prepared.input));
    await writeFile(path.join(directory, "consumer.json"), ci.privateFiles.get(ci.receipt.consumer.report.path));
    await writeFile(path.join(directory, "examples.json"), ci.privateFiles.get(ci.receipt.examples.report.path));
    await writeFile(path.join(directory, "locator.json"), serialize(fixture.context.locator));
    const output = path.join(directory, "source-failure"), fetcher = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("must not fetch"));
    try {
      await expect(createAgentCatalogRelease(cliArgs(output))).rejects.toMatchObject({ code: expect.stringMatching(/DIRTY_SOURCE|SOURCE_BINDING_MISMATCH/) });
      expect(fetcher).not.toHaveBeenCalled(); expect(await readdir(output)).toEqual(["failure.json"]);
      const failure = JSON.parse(await readFile(path.join(output, "failure.json"), "utf8")); expect(failure.phase).toBe("source");
      await expect(createAgentCatalogRelease(cliArgs(output))).rejects.toHaveProperty("code", "EEXIST");
    } finally { fetcher.mockRestore(); }
  });
});
