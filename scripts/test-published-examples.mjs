import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInstallationOutput, readCanonicalInstallationInput, verifyInstallationInputForExecution } from "./check-published-installation-input.mjs";
import { parsePublishedConsumerArgs } from "./test-published-consumer-installs.mjs";
import { prepareVerifiedCli, runPublishedExampleConsumer } from "./published-consumer-matrix.mjs";
import { assertConsumerManager, fileInventory, runConsumerCommand } from "./published-consumer-runtime.mjs";
import { assertExampleSourcesUnchanged, exampleDeclarationPath, exampleSourceDirectory, readExampleSourceManifest } from "./agent-example-sources.mjs";
import { verifyMaterializedExamples } from "./agent-examples.mjs";
import { exampleCheckProofSchema, exampleEvidenceBinding, exampleEvidenceReference, exampleVerificationSchema,
  publishExampleEvidence, validateExampleEvidenceBatch } from "./agent-example-evidence.mjs";
import { startExamplePreview } from "./agent-example-preview.mjs";
import { blobArtifactWriter, validatePublicationEnvironment, validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { readOwnedFile, serialize, sha256, sourceProvenance } from "./agent-utils.mjs";
import { writeExecutionResult } from "./agent-execution-index.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const worker = fileURLToPath(new URL("./agent-example-browser.mjs", import.meta.url));
export const parsePublishedExampleArgs = parsePublishedConsumerArgs;

/** Source bytes are read from the maintained tree, never from a report's claimed manifest. */
export async function readExampleEvidenceSources() {
  const manifest = await readExampleSourceManifest();
  const files = new Map();
  for (const file of manifest.files) files.set(file.path, await readOwnedFile(path.join(root, exampleSourceDirectory), file.path));
  const declaration = await readOwnedFile(root, exampleDeclarationPath);
  await assertExampleSourcesUnchanged(manifest);
  return { manifest, files, declaration };
}

/** Pure assembly is not an execution verifier; only the CLI below runs and supplies these inputs. */
export function assembleExampleExecutionEvidence(prepared, sources, consumers) {
  const binding = exampleEvidenceBinding(prepared, sources.manifest), attachments = new Map();
  const add = (bytes, extension = "json") => {
    const ref = exampleEvidenceReference(prepared.input.artifactBaseUrl, bytes, extension);
    const previous = attachments.get(ref.url);
    if (previous && !previous.equals(bytes)) throw new Error("Conflicting example attachment");
    attachments.set(ref.url, bytes); return ref;
  };
  const proof = (row, check, result) => add(Buffer.from(serialize(exampleCheckProofSchema.parse({ schemaVersion: 1, kind: "agent-example-check",
    bindingSha256: sha256(serialize(binding)), exampleId: row.exampleId, framework: row.framework, packageManager: row.packageManager,
    finalProjectSha256: row.finalProjectSha256, check, result }))));
  const rows = [];
  for (const declaration of sources.manifest.declarations.examples) for (const profile of declaration.profiles) {
    const matched = consumers.filter(value => value.result.framework === profile.framework && value.result.packageManager === profile.packageManager);
    if (matched.length !== 1) throw new Error("Missing or duplicate actual consumer profile");
    const entry = matched[0];
    if (serialize(entry.evidence.source) !== serialize(prepared.input.source) || entry.evidence.inputSha256 !== binding.inputSha256
      || serialize(entry.evidence.cli) !== serialize(prepared.npm.cli)
      || serialize(entry.evidence.registry) !== serialize({ releaseId: prepared.input.registry.releaseId, manifest: prepared.input.registry.manifest })
      || serialize(entry.result.testedItems) !== serialize(sources.manifest.hostAdoptedItems)) throw new Error("Consumer execution does not bind the verified example inputs");
    const observed = entry.browser.results.filter(value => value.exampleId === declaration.exampleId);
    if (observed.length !== 1) throw new Error("Missing or duplicate actual browser example");
    const row = { exampleId: declaration.exampleId, ...profile, nodeVersion: entry.result.nodeVersion, frameworkVersion: entry.result.frameworkVersion,
      packageManagerVersion: entry.result.packageManagerVersion,
      ...Object.fromEntries(["templateSha256", "initialLockfileSha256", "finalLockfileSha256", "finalProjectSha256", "cliOwnFilesSha256"].map(key => [key, entry.evidence[key]])),
      installedStateSha256: entry.installedStateSha256, adoptedItems: declaration.adoptedItems, registryClosure: entry.result.registryClosure,
      materialized: { files: entry.examples.files.map(({ path, bytes, sha256 }) => ({ path, bytes, sha256 })), entry: entry.examples.entry } };
    if (["dryRun", "install", "types", "build"].some(check => entry.result.checks[check] !== true) || !entry.evidence.themeInstalled || !entry.evidence.compiledTheme) {
      throw new Error("Incomplete actual consumer checks");
    }
    const data = observed[0];
    row.checks = { install: proof(row, "install", { adoptedItems: sources.manifest.hostAdoptedItems, registryClosure: row.registryClosure,
      cliOwnFilesSha256: row.cliOwnFilesSha256, installedStateSha256: row.installedStateSha256, finalLockfileSha256: row.finalLockfileSha256,
      officialCliBytes: true, managerAndLockfile: true, themeInstalled: true, compiledTheme: true }),
      types: proof(row, "types", { command: [row.packageManager, "run", "types"], exitCode: 0 }),
      build: proof(row, "build", { command: [row.packageManager, "run", "build"], exitCode: 0 }),
      states: proof(row, "states", data.states), keyboard: proof(row, "keyboard", data.keyboard), viewports: [] };
    for (const viewport of data.viewports) {
      const png = entry.screenshots.get(viewport.screenshot.path);
      if (!Buffer.isBuffer(png) || png.length !== viewport.screenshot.bytes || sha256(png) !== viewport.screenshot.sha256) throw new Error("Browser screenshot changed");
      const screenshot = add(png, "png");
      row.checks.viewports.push({ width: viewport.width, screenshot, evidence: proof(row, "viewport", { ...viewport, screenshot }) });
    }
    rows.push(row);
  }
  const report = exampleVerificationSchema.parse({ schemaVersion: 1, kind: "published-example-verification", binding, sourceManifest: sources.manifest, rows });
  validateExampleEvidenceBatch(prepared, sources, report, attachments);
  return { report, attachments };
}

function browserEnvironment() {
  return Object.fromEntries(["PATH", "TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL", "XDG_CACHE_HOME", "PLAYWRIGHT_BROWSERS_PATH"]
    .filter(key => process.env[key]).map(key => [key, process.env[key]]));
}
async function browserChecks(entry, profile, sources, output, logs, deadline) {
  let preview;
  try {
    const remaining = deadline - Date.now();
    if (remaining < 6000) throw Object.assign(new Error("Example job deadline"), { code: "EXAMPLE_JOB_TIMEOUT" });
    preview = await startExamplePreview(entry.consumer, profile, entry.env, path.join(logs, "preview.json"), { timeoutMs: Math.min(30000, remaining) });
    const timeoutMs = Math.min(300000, deadline - Date.now());
    if (timeoutMs < 6000) throw Object.assign(new Error("Example job deadline"), { code: "EXAMPLE_JOB_TIMEOUT" });
    let recorded;
    try {
      const result = await runConsumerCommand(process.execPath, [worker, preview.origin, path.join(root, exampleDeclarationPath), output, String(timeoutMs - 5000)],
        { cwd: root, env: browserEnvironment(), step: "browser", timeoutMs, log: record => { recorded = record; } });
      if (result.exitCode !== 0) throw Object.assign(new Error("Example browser worker failed"), { code: "BROWSER_CHECKS_FAILED", step: "browser" });
    } finally {
      if (recorded) await writeFile(path.join(logs, "browser-process.json"), serialize(recorded), { flag: "wx", mode: 0o600 });
    }
    preview.assertAlive();
    const bytes = await readOwnedFile(output, "observations.json");
    if (bytes.length > 1024 * 1024) throw new Error("Browser observation budget");
    const browser = JSON.parse(bytes.toString("utf8"));
    if (browser.kind !== "agent-example-browser-observations" || browser.results?.length !== sources.manifest.declarations.examples.length) throw new Error("Incomplete browser observations");
    const screenshots = new Map();
    for (const example of browser.results) for (const viewport of example.viewports) {
      const png = await readOwnedFile(output, viewport.screenshot.path);
      if (png.length > 8 * 1024 * 1024) throw new Error("Browser screenshot budget");
      screenshots.set(viewport.screenshot.path, png);
    }
    return { browser, screenshots };
  } finally { if (preview) await preview.stop(); }
}

/** No fixture mode, source bypass, browser/consumer injection, skip options, or user-supplied success. */
export async function testPublishedExamples(args) {
  const options = parsePublishedExampleArgs(args);
  await createInstallationOutput(options.output);
  let temporary, source, sources, current = null, phase = "input";
  const completed = [], deadline = Date.now() + 60 * 60 * 1000;
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22 || process.platform !== "linux") throw Object.assign(new Error("Node 22 on Linux is required"), { code: "EXAMPLE_RUNTIME_REQUIRED" });
    const input = await readCanonicalInstallationInput(options.input), prepared = await verifyInstallationInputForExecution(input);
    source = input.source; sources = await readExampleEvidenceSources();
    if (options.publishEvidence) validatePublicationEnvironment(prepared.registry.manifest);
    await writeFile(path.join(options.output, "input-verification.json"), serialize(prepared.report), { flag: "wx" });
    await writeFile(path.join(options.output, "example-sources.json"), serialize(sources.manifest), { flag: "wx" });
    temporary = await mkdtemp(path.join(tmpdir(), "zeron-published-examples-"));
    const logs = path.join(options.output, "private-logs"); await mkdir(logs, { mode: 0o700 });
    phase = "cli-reference";
    const reference = await prepareVerifiedCli(prepared.npm, path.join(temporary, "reference"), { logs });
    const profiles = sources.manifest.declarations.examples[0].profiles;
    for (const profile of profiles) {
      current = profile; phase = "consumer";
      const key = `${profile.framework}-${profile.packageManager}`, profileLogs = path.join(logs, key);
      const entry = await runPublishedExampleConsumer(prepared, profile, sources.manifest, reference, path.join(temporary, key), { logs: profileLogs, deadline });
      phase = "browser";
      const observed = await browserChecks(entry, profile, sources, path.join(options.output, `${key}-browser`), profileLogs, deadline);
      phase = "consumer-after-browser";
      await verifyMaterializedExamples(entry.consumer, entry.examples);
      const inventory = await fileInventory(entry.consumer);
      if (sha256(serialize(inventory)) !== entry.evidence.finalProjectSha256
        || sha256(await readFile(path.join(entry.consumer, ".zeron/install-state.json"))) !== entry.installedStateSha256
        || (await assertConsumerManager(entry.consumer, profile.packageManager, inventory)).sha256 !== entry.evidence.finalLockfileSha256) {
        throw Object.assign(new Error("Browser changed consumer source or installation"), { code: "CONSUMER_CHANGED_AFTER_BROWSER" });
      }
      await assertExampleSourcesUnchanged(sources.manifest);
      validatePublicationSourceBindings(await sourceProvenance(root), input.source);
      completed.push({ ...entry, ...observed });
      await writeFile(path.join(options.output, `${key}.execution.json`), serialize({ ...entry.evidence, installedStateSha256: entry.installedStateSha256,
        examples: entry.examples, browser: observed.browser }), { flag: "wx", mode: 0o600 });
      console.log(`${key}: actual installation, types, build and all three browser examples passed`);
    }
    current = null; phase = "evidence";
    const assembled = assembleExampleExecutionEvidence(prepared, sources, completed);
    const attachmentDirectory = path.join(options.output, "attachments"); await mkdir(attachmentDirectory);
    for (const [url, bytes] of assembled.attachments) await writeFile(path.join(attachmentDirectory, new URL(url).pathname.split("/").at(-1)), bytes, { flag: "wx", mode: 0o600 });
    if (options.publishEvidence) {
      phase = "publish-evidence";
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw Object.assign(new Error("Example job deadline"), { code: "EXAMPLE_JOB_TIMEOUT" });
      await publishExampleEvidence(prepared, sources, assembled.report, assembled.attachments, { writer: blobArtifactWriter, maxDurationMs: Math.min(600000, remaining) });
    }
    phase = "final-source";
    await assertExampleSourcesUnchanged(sources.manifest);
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    const report = options.publishEvidence ? assembled.report : { schemaVersion: 1, kind: "local-example-execution", status: "actual-checks-without-public-evidence",
      scope: "not-a-formal-release-or-trusted-ci-attestation", verification: assembled.report };
    phase = "execution-index";
    await writeExecutionResult({ output: options.output, input, role: "examples", resultKind: options.publishEvidence ? "published" : "local", report,
      publicAttachments: [...assembled.attachments].map(([url, bytes]) => ({ url, bytes: bytes.length, sha256: sha256(bytes),
        path: `attachments/${new URL(url).pathname.split("/").at(-1)}` })) });
    return { status: options.publishEvidence ? "actual-examples-and-public-attachments-verified" : report.status, scope: "catalog-and-trusted-ci-release-gates-still-required", output: options.output };
  } catch (error) {
    const code = /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "PUBLISHED_EXAMPLES_FAILED";
    await writeFile(path.join(options.output, "failure.json"), serialize({ schemaVersion: 1, kind: "published-examples-failure", status: "failed", phase, current, code,
      source: source ?? null, completedProfiles: completed.map(entry => ({ framework: entry.result.framework, packageManager: entry.result.packageManager })) }), { flag: "wx", mode: 0o600 });
    throw Object.assign(new Error(`Published examples failed: ${code}`), { code });
  } finally { if (temporary) await rm(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  testPublishedExamples(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `Published examples failed: ${error.code}` : "Published examples failed: INVALID_ARGUMENTS_OR_OUTPUT"); process.exitCode = 1;
  });
}
