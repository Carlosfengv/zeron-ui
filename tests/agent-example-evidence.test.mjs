import { beforeAll, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { exampleSourceDirectory, exampleDeclarationPath, readExampleSourceManifest } from "../scripts/agent-example-sources.mjs";
import { exampleCheckProofSchema, exampleEvidenceBinding, exampleEvidenceReference,
  publishExampleEvidence, readExampleVerification, validateExampleEvidenceBatch } from "../scripts/agent-example-evidence.mjs";
import { installationInputSchema } from "../scripts/agent-release-record.mjs";
import { serialize } from "../scripts/agent-utils.mjs";
import { assembleExampleExecutionEvidence } from "../scripts/test-published-examples.mjs";
import { fixtureExampleEvidence, fixtureExamplePng as png } from "./helpers/agent-example-evidence-fixture.mjs";

// Synthetic successful checks and blank PNGs exercise only contract validation.
// No fixture is executed by a production runner or claimed as published evidence.
const origin = "https://example-evidence.example.invalid";
const hash = "a".repeat(64);
const ref = url => ({ url, bytes: 20, sha256: hash });
const copy = value => structuredClone(value);
let prepared, sources, original, originalAttachments;
function attach(attachments, value, extension = "json") {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(serialize(value));
  const reference = exampleEvidenceReference(origin, bytes, extension); attachments.set(reference.url, bytes); return reference;
}
function rewrite(report, attachments, index, check, change, viewportIndex) {
  const row = report.rows[index];
  const previous = check === "viewport" ? row.checks.viewports[viewportIndex].evidence : row.checks[check];
  const proof = JSON.parse(attachments.get(previous.url)); change(proof);
  const next = attach(attachments, proof);
  if (check === "viewport") row.checks.viewports[viewportIndex].evidence = next;
  else row.checks[check] = next;
  if (!report.rows.some(row => JSON.stringify(row.checks).includes(previous.url))) attachments.delete(previous.url);
}
function fixture() { return { report: copy(original), attachments: new Map([...originalAttachments].map(([url, bytes]) => [url, Buffer.from(bytes)])) }; }
function assemblyFixture() {
  // Synthetic assembly inputs exercise no executable, browser or public service.
  return original.rows.slice(0, 4).map(profile => {
    const all = original.rows.filter(row => row.framework === profile.framework && row.packageManager === profile.packageManager);
    const screenshots = new Map();
    const browser = { results: all.map(row => ({ exampleId: row.exampleId,
      states: JSON.parse(originalAttachments.get(row.checks.states.url)).result,
      keyboard: JSON.parse(originalAttachments.get(row.checks.keyboard.url)).result,
      viewports: row.checks.viewports.map(view => {
        const result = JSON.parse(originalAttachments.get(view.evidence.url)).result;
        const filename = `${row.exampleId}-${view.width}.png`;
        screenshots.set(filename, originalAttachments.get(view.screenshot.url));
        return { ...result, screenshot: { path: filename, bytes: view.screenshot.bytes, sha256: view.screenshot.sha256 } };
      }) })) };
    return { result: { framework: profile.framework, packageManager: profile.packageManager, nodeVersion: profile.nodeVersion, frameworkVersion: profile.frameworkVersion,
      packageManagerVersion: profile.packageManagerVersion, testedItems: sources.manifest.hostAdoptedItems, registryClosure: profile.registryClosure,
      checks: { dryRun: true, install: true, types: true, build: true } },
    evidence: { source: prepared.input.source, inputSha256: original.binding.inputSha256, cli: prepared.npm.cli,
      registry: { releaseId: prepared.input.registry.releaseId, manifest: prepared.input.registry.manifest },
      ...Object.fromEntries(["templateSha256", "initialLockfileSha256", "finalLockfileSha256", "finalProjectSha256", "cliOwnFilesSha256"].map(key => [key, profile[key]])), themeInstalled: true, compiledTheme: true },
    installedStateSha256: profile.installedStateSha256,
    examples: { files: profile.materialized.files.map(file => ({ ...file, sourcePath: file.path.slice("examples/".length) })), entry: profile.materialized.entry }, browser, screenshots };
  });
}
function store() {
  const objects = new Map();
  const fetcher = vi.fn(async (url, options) => {
    expect(options.headers.authorization).toBeUndefined();
    return objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
  });
  const writer = vi.fn(async (pathname, bytes, options) => {
    expect(pathname).toMatch(/^evidence\/examples\/[a-f0-9]{64}\.(json|png)$/);
    expect(options).toMatchObject({ access: "public", allowOverwrite: false, addRandomSuffix: false });
    expect(options.contentType).toBe(pathname.endsWith(".png") ? "image/png" : "application/json");
    const url = `${origin}/${pathname}`; objects.set(url, Buffer.from(bytes)); return { url };
  });
  return { objects, writer, fetcher, downloadOptions: { attempts: 1 } };
}
beforeAll(async () => {
  const manifest = await readExampleSourceManifest();
  sources = { manifest, declaration: await readFile(exampleDeclarationPath),
    files: new Map(await Promise.all(manifest.files.map(async file => [file.path, await readFile(`${exampleSourceDirectory}/${file.path}`)]))) };
  const source = { sourceRevision: "b".repeat(40), sourceInputSha256: hash, lockfileSha256: hash, sourceClean: true };
  const cli = { name: "zeron-ui", version: "1.2.3", distIntegrity: `sha512-${Buffer.alloc(64).toString("base64")}` };
  const skillVersion = "c".repeat(64); const skillBase = `${origin}/skills/releases/${skillVersion}`;
  const identities = manifest.hostRegistryItems.map(item => ({ id: item.itemId, registryName: item.registryName }));
  identities.push({ id: "block:login-01", registryName: "login-01" }, { id: "support:tokens", registryName: "tokens" });
  const input = installationInputSchema.parse({ schemaVersion: 1, kind: "published-installation-input", source,
    artifactBaseUrl: origin, siteBaseUrl: "https://docs.example.invalid", cli,
    registry: { releaseId: "fixture", manifest: ref(`${origin}/r/releases/fixture/manifest.json`), completion: ref(`${origin}/r/releases/fixture/complete.json`) },
    skill: { version: skillVersion, artifacts: ref(`${skillBase}/artifacts.json`), completion: ref(`${skillBase}/complete.json`),
      manifest: ref(`${skillBase}/manifest.json`), archive: ref(`${skillBase}/zeron-skills.zip`), guide: ref(`${skillBase}/install.md`) },
    items: identities, matrices: ["next", "vite"].flatMap(framework => ["npm", "pnpm"].map(packageManager => ({ framework, packageManager,
      testedItems: framework === "next" ? ["component:button", "block:login-01"] : ["component:button"] }))), nextOnlyRejectionItem: "block:login-01" });
  prepared = { input, npm: { cli: { ...cli, tarballUrl: "https://registry.npmjs.org/zeron-ui/-/zeron-ui-1.2.3.tgz", tarballBytes: 42 } },
    scope: { items: identities.map(identity => ({ name: identity.registryName, meta: { zeron: { framework: identity.registryName === "login-01" ? "next" : "react" } },
      registryDependencies: identity.registryName === "button" ? [`${origin}/r/releases/fixture/tokens.json`] : [] })) } };
  ({ report: original, attachments: originalAttachments } = fixtureExampleEvidence(prepared, sources, hash));
});

describe("example execution evidence assembly without execution claims", () => {
  it("builds the same strict twelve-row contract with raw byte attachments", () => {
    const assembled = assembleExampleExecutionEvidence(prepared, sources, assemblyFixture());
    expect(assembled.report).toEqual(original);
    expect([...assembled.attachments.keys()].sort()).toEqual([...originalAttachments.keys()].sort());
    for (const [url, bytes] of assembled.attachments) expect(bytes).toEqual(originalAttachments.get(url));
  });
  it("rejects incomplete consumers, changed input bindings, adoption and actual screenshot bytes", () => {
    for (const change of [entries => entries.pop(), entries => entries.push(entries[0]),
      entries => { entries[0].evidence.inputSha256 = "0".repeat(64); },
      entries => { entries[0].evidence.cli = { ...entries[0].evidence.cli, version: "9.9.9" }; },
      entries => { entries[0].result.testedItems = ["component:button"]; },
      entries => { entries[0].result.checks.build = false; },
      entries => { entries[0].browser.results.pop(); },
      entries => { entries[0].browser.results[0].viewports[0].screenshot.bytes++; }]) {
      const entries = assemblyFixture(); change(entries);
      expect(() => assembleExampleExecutionEvidence(prepared, sources, entries)).toThrow();
    }
  });
});

describe("formal example evidence contract (explicit fixtures only)", () => {
  it("requires all 12 independent rows, exact bytes, full installed host closure and complete check artifacts", () => {
    const { report, attachments } = fixture();
    const result = validateExampleEvidenceBatch(prepared, sources, report, attachments);
    expect(result.scope).toBe("validated-example-evidence-not-publication-or-execution-proof");
    expect(result.report.rows).toHaveLength(12);
    expect(result.objects).toHaveLength(86); // 7 JSON per row, plus two deduplicated PNGs.
    expect(JSON.stringify(report)).not.toContain("catalogVersion");
  });

  it("does not accept a boolean, unknown fields, missing rows, duplicate rows or reordered profiles", () => {
    for (const change of [report => { report.passed = true; }, report => { report.rows.pop(); },
      report => { report.rows[1] = report.rows[0]; }, report => { report.rows.reverse(); }, report => { report.rows[0].checks.build = true; }]) {
      const { report, attachments } = fixture(); change(report);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
    }
  });

  it("rejects source, input, CLI, Skill, identity and raw source substitutions", () => {
    for (const change of [report => { report.binding.source.sourceClean = false; }, report => { report.binding.source.sourceInputSha256 = "f".repeat(64); },
      report => { report.binding.inputSha256 = "f".repeat(64); }, report => { report.binding.cli.version = "2.0.0"; },
      report => { report.binding.skill.version = "f".repeat(64); }, report => { report.sourceManifest.files[0].sha256 = "f".repeat(64); }]) {
      const { report, attachments } = fixture(); change(report);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
    }
    const bad = { ...sources, files: new Map(sources.files) }; bad.files.set("README.md", Buffer.from("changed"));
    expect(() => validateExampleEvidenceBatch(prepared, bad, original, originalAttachments)).toThrow(/SOURCE_BYTES/);
    expect(() => exampleEvidenceBinding({ ...prepared, npm: { cli: { ...prepared.npm.cli, tarballUrl: "https://other.invalid/cli.tgz" } } }, sources.manifest)).toThrow(/CLI_BINDING/);
  });

  it("rejects incomplete closure, unsupported framework, wrong manager or mismatched adapted source/host", () => {
    for (const change of [row => { row.registryClosure.pop(); }, row => { row.adoptedItems.pop(); }, row => { row.packageManagerVersion = "10.0.0"; },
      row => { row.nodeVersion = "23.0.0"; }, row => { row.materialized.files[0].sha256 = "f".repeat(64); }, row => { row.materialized.entry.bytes++; }]) {
      const { report, attachments } = fixture(); change(report.rows[0]);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
    }
    const wrong = copy(prepared); wrong.scope.items.find(item => item.name === "tokens").meta.zeron.framework = "next";
    expect(() => validateExampleEvidenceBatch(wrong, sources, original, originalAttachments)).toThrow(/REGISTRY_CLOSURE/);
    const viteOnly = copy(prepared); viteOnly.scope.items.find(item => item.name === "tokens").meta.zeron.framework = "vite";
    expect(() => validateExampleEvidenceBatch(viteOnly, sources, original, originalAttachments)).toThrow(/REGISTRY_CLOSURE/);
    const renamed = copy(prepared); renamed.input.items[0].registryName = "different";
    const sample = fixture(); sample.report.binding = exampleEvidenceBinding(renamed, sources.manifest);
    expect(() => validateExampleEvidenceBatch(renamed, sources, sample.report, sample.attachments)).toThrow(/REGISTRY_IDENTITY/);
  });

  it("rejects wrong check bindings, failed exits and installation hashes even when artifact hashes are correct", () => {
    for (const [check, change] of [["build", proof => { proof.result.exitCode = 1; }], ["types", proof => { proof.result.command[2] = "build"; }],
      ["build", proof => { proof.exampleId = "settings"; }], ["build", proof => { proof.bindingSha256 = "f".repeat(64); }],
      ["install", proof => { proof.result.cliOwnFilesSha256 = "f".repeat(64); }], ["install", proof => { proof.result.registryClosure.pop(); }]]) {
      const { report, attachments } = fixture(); rewrite(report, attachments, 0, check, change);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
    }
  });

  it("requires every state and exact declared inapplicability instead of silently counting it as passed", () => {
    for (const change of [proof => { proof.result.cases.pop(); }, proof => { proof.result.cases[1] = proof.result.cases[0]; },
      proof => { proof.result.cases.find(row => row.caseId === "empty").reason = "a different reason"; },
      proof => { proof.result.cases.find(row => row.caseId === "empty").status = "passed"; },
      proof => { proof.result.cases[0].assertions[0].passed = false; }]) {
      const { report, attachments } = fixture(); rewrite(report, attachments, 0, "states", change);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
    }
    const { report, attachments } = fixture(); rewrite(report, attachments, 4, "states", proof => {
      proof.result.cases.find(row => row.caseId === "empty").status = "not-applicable";
    });
    expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
  });

  it("requires keyboard actions and narrow/wide viewport evidence with the same browser and valid complete PNGs", () => {
    for (const change of [proof => { proof.result.steps = [{ key: "Escape", target: "body" }, { key: "Escape", target: "body" }]; },
      proof => { proof.result.assertions.pop(); }]) {
      const { report, attachments } = fixture(); rewrite(report, attachments, 0, "keyboard", change);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow(/KEYBOARD_COVERAGE/);
    }
    for (const change of [proof => { proof.result.width = 1440; }, proof => { proof.result.browser.version = "2.0.0"; },
      proof => { proof.result.horizontalOverflow = true; }]) {
      const { report, attachments } = fixture(); rewrite(report, attachments, 0, "viewport", change, 0);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
    }
    for (const bytes of [png(1440, 844), png(390, 844).subarray(0, 33), png(390, 844, 100), png(390, 844, (390 * 3 + 1) * 845)]) {
      const { report, attachments } = fixture(); const screenshot = attach(attachments, bytes, "png");
      report.rows[0].checks.viewports[0].screenshot = screenshot;
      rewrite(report, attachments, 0, "viewport", proof => { proof.result.screenshot = screenshot; }, 0);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow(/SCREENSHOT/);
    }
  });

  it("rejects changed raw bytes, arbitrary URLs, extra/missing attachments and noncanonical proofs", () => {
    for (const change of [(report, attachments) => { attachments.delete(report.rows[0].checks.build.url); },
      (report, attachments) => { attach(attachments, { extra: true }); },
      (report, attachments) => { attachments.set(report.rows[0].checks.build.url, Buffer.from("changed")); },
      report => { report.rows[0].checks.build.url = "https://other.invalid/evidence.json"; },
      (report, attachments) => {
        const prior = report.rows[0].checks.build;
        const bytes = Buffer.from(JSON.stringify(JSON.parse(attachments.get(prior.url))));
        attachments.delete(prior.url); report.rows[0].checks.build = attach(attachments, bytes);
      }]) {
      const { report, attachments } = fixture(); change(report, attachments);
      expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow();
    }
    expect(() => exampleEvidenceReference(origin, Buffer.alloc(1), "html")).toThrow(/ATTACHMENT_FORMAT/);
    expect(exampleCheckProofSchema.safeParse({ passed: true }).success).toBe(false);
  });

  it("rejects a hashed PNG with corrupt chunk integrity rather than trusting its signature and dimensions", () => {
    const bytes = png(390, 844); bytes[bytes.length - 5] ^= 1;
    const { report, attachments } = fixture(); const screenshot = attach(attachments, bytes, "png");
    report.rows[0].checks.viewports[0].screenshot = screenshot;
    rewrite(report, attachments, 0, "viewport", proof => { proof.result.screenshot = screenshot; }, 0);
    expect(() => validateExampleEvidenceBatch(prepared, sources, report, attachments)).toThrow(/SCREENSHOT_BYTES/);
  });

  it("reads fixed public attachments anonymously, verifies every byte and remains distinct from actual execution", async () => {
    const fetcher = vi.fn(async (url, options) => { expect(options.headers.authorization).toBeUndefined(); return new Response(originalAttachments.get(url)); });
    const result = await readExampleVerification(prepared, sources, original, { fetcher, downloadOptions: { attempts: 1 } });
    expect(result.scope).toBe("public-example-attachments-verified-not-execution-proof");
    expect(fetcher).toHaveBeenCalledTimes(86);
    expect(result.consumedBytes).toBe([...originalAttachments.values()].reduce((sum, bytes) => sum + bytes.length, 0));
  });

  it("rejects bad origins, budgets and source before network; rejects streamed substitutions and timeouts", async () => {
    const fetcher = vi.fn();
    const wrong = copy(original); wrong.rows[0].checks.install.url = "https://other.invalid/check.json";
    await expect(readExampleVerification(prepared, sources, wrong, { fetcher })).rejects.toThrow(/ATTACHMENT_ORIGIN/);
    await expect(readExampleVerification(prepared, sources, original, { fetcher, maxTotalBytes: 1 })).rejects.toThrow(/READ_BUDGET/);
    const incomplete = copy(original); incomplete.rows.pop();
    await expect(readExampleVerification(prepared, sources, incomplete, { fetcher })).rejects.toThrow(/EXAMPLE_PROFILE_COVERAGE/);
    const scope = copy(original); scope.rows[0].registryClosure.pop();
    await expect(readExampleVerification(prepared, sources, scope, { fetcher })).rejects.toThrow(/CONSUMER_SCOPE/);
    const location = copy(original); location.rows[0].checks.install.url = `${origin}/arbitrary.json`;
    await expect(readExampleVerification(prepared, sources, location, { fetcher })).rejects.toThrow(/ATTACHMENT_LOCATION/);
    expect(fetcher).not.toHaveBeenCalled();
    await expect(readExampleVerification(prepared, sources, original, { fetcher: async () => new Response("wrong"), downloadOptions: { attempts: 1 } })).rejects.toThrow();
    await expect(readExampleVerification(prepared, sources, original, { fetcher: () => new Promise(() => {}), timeoutMs: 5,
      downloadOptions: { attempts: 1 } })).rejects.toMatchObject({ code: "TIMEOUT" });
  });

  it("validates every row and attachment before exposing any object to a writer", async () => {
    for (const change of [(report) => { report.rows.pop(); }, (report, attachments) => { attachments.delete(report.rows[0].checks.build.url); },
      report => { report.rows[0].registryClosure.pop(); }]) {
      const { report, attachments } = fixture(); const io = store(); change(report, attachments);
      await expect(publishExampleEvidence(prepared, sources, report, attachments, io)).rejects.toThrow();
      expect(io.writer).not.toHaveBeenCalled(); expect(io.fetcher).not.toHaveBeenCalled();
    }
  });

  it("publishes immutable JSON/PNG objects, reads them back and reuses identical retries", async () => {
    const io = store();
    const result = await publishExampleEvidence(prepared, sources, original, originalAttachments, io);
    expect(result.scope).toBe("published-example-attachments-verified-not-execution-proof");
    expect(io.writer).toHaveBeenCalledTimes(86);
    await publishExampleEvidence(prepared, sources, original, originalAttachments, io);
    expect(io.writer).toHaveBeenCalledTimes(86);
  });

  it("stops on existing conflicting bytes instead of overwriting or accepting a new upload URL", async () => {
    const io = store(); const first = original.rows[0].checks.install;
    io.objects.set(first.url, Buffer.alloc(first.bytes));
    await expect(publishExampleEvidence(prepared, sources, original, originalAttachments, io)).rejects.toMatchObject({ code: "HASH_OR_SIZE_MISMATCH" });
    expect(io.writer).not.toHaveBeenCalled();
    const wrong = store(); wrong.writer.mockResolvedValueOnce({ url: "https://other.invalid/object.json" });
    await expect(publishExampleEvidence(prepared, sources, original, originalAttachments, wrong)).rejects.toThrow(/UPLOAD_URL/);
  });

  it("preserves partial publication, resumes the same bytes and recovers unknown write acknowledgements", async () => {
    const io = store(); const write = io.writer.getMockImplementation();
    io.writer.mockImplementationOnce(write).mockImplementationOnce(async () => { throw new Error("interrupted fixture"); });
    await expect(publishExampleEvidence(prepared, sources, original, originalAttachments, io)).rejects.toThrow(/WRITE_NOT_CONFIRMED/);
    expect(io.objects.size).toBe(1); io.writer.mockImplementation(write);
    await publishExampleEvidence(prepared, sources, original, originalAttachments, io); expect(io.objects.size).toBe(86);
    const lost = store(); const actual = lost.writer.getMockImplementation();
    lost.writer.mockImplementationOnce(async (...args) => { await actual(...args); throw new Error("lost acknowledgement"); });
    await expect(publishExampleEvidence(prepared, sources, original, originalAttachments, lost)).resolves.toMatchObject({
      scope: "published-example-attachments-verified-not-execution-proof" });
  });

  it("bounds stalled writes and rejects budgets before reading or uploading", async () => {
    const io = store(); io.writer.mockImplementation(() => new Promise(() => {}));
    await expect(publishExampleEvidence(prepared, sources, original, originalAttachments, { ...io, timeoutMs: 5 })).rejects.toThrow(/WRITE_NOT_CONFIRMED/);
    const bounded = store();
    for (const options of [{ maxTotalBytes: 1 }, { timeoutMs: 0 }, { maxDurationMs: 600001 }]) {
      await expect(publishExampleEvidence(prepared, sources, original, originalAttachments, { ...bounded, ...options })).rejects.toThrow(/WRITE_BUDGET/);
    }
    expect(bounded.fetcher).not.toHaveBeenCalled(); expect(bounded.writer).not.toHaveBeenCalled();
  });
});
