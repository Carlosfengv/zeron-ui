import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInstallationOutput, parseInstallationCheckArgs, readCanonicalInstallationInput,
  verifyInstallationInputForExecution } from "./check-published-installation-input.mjs";
import { serialize, sourceProvenance } from "./agent-utils.mjs";
import { blobArtifactWriter, validatePublicationEnvironment, validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { prepareVerifiedCli, runPublishedConsumerMatrix } from "./published-consumer-matrix.mjs";
import { assembleConsumerVerification, publishConsumerEvidence, validateConsumerEvidenceBatch } from "./published-consumer-evidence.mjs";
import { consumerEntry } from "./published-consumer-runtime.mjs";
import { writeExecutionResult } from "./agent-execution-index.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export function parsePublishedConsumerArgs(args) {
  if (args.filter(arg => arg === "--publish-evidence").length > 1) throw new Error("Duplicate --publish-evidence");
  return { ...parseInstallationCheckArgs(args.filter(arg => arg !== "--publish-evidence")), publishEvidence: args.includes("--publish-evidence") };
}

/** No fixture mode, source bypass, cache sharing, URL rewrite or injected consumer success. */
export async function testPublishedConsumerInstalls(args) {
  const options = parsePublishedConsumerArgs(args);
  await createInstallationOutput(options.output);
  let temporary;
  let phase = "input";
  let matrix = null;
  const deadline = Date.now() + 60 * 60 * 1000;
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22 || process.platform !== "linux") {
      throw Object.assign(new Error("Node 22 on Linux is required"), { code: "CONSUMER_RUNTIME_REQUIRED" });
    }
    const input = await readCanonicalInstallationInput(options.input);
    const prepared = await verifyInstallationInputForExecution(input);
    for (const row of prepared.scope.matrices) consumerEntry(row.framework, row.testedItems.map(id => input.items.find(item => item.id === id).registryName));
    if (options.publishEvidence) validatePublicationEnvironment(prepared.registry.manifest);
    await writeFile(path.join(options.output, "input-verification.json"), serialize(prepared.report), { flag: "wx" });
    temporary = await mkdtemp(path.join(tmpdir(), "zeron-published-consumers-"));
    const logs = path.join(options.output, "private-logs");
    await mkdir(logs, { mode: 0o700 });
    phase = "cli-reference";
    const reference = await prepareVerifiedCli(prepared.npm, path.join(temporary, "reference"), { logs });
    const completed = [];
    for (const row of prepared.scope.matrices) {
      matrix = { framework: row.framework, packageManager: row.packageManager };
      phase = "consumer";
      const key = `${row.framework}-${row.packageManager}`;
      const entry = await runPublishedConsumerMatrix(prepared, row, reference, path.join(temporary, key), { logs: path.join(logs, key), deadline });
      completed.push(entry);
      await writeFile(path.join(options.output, `${key}.evidence.json`), serialize(entry.evidence), { flag: "wx", mode: 0o600 });
      console.log(`${key}: dry-run, install, types and build passed`);
    }
    matrix = null;
    phase = "final-source";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    const batch = validateConsumerEvidenceBatch(prepared, completed);
    let report;
    if (options.publishEvidence) {
      phase = "public-evidence";
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw Object.assign(new Error("Consumer job deadline"), { code: "CONSUMER_JOB_TIMEOUT" });
      const references = await publishConsumerEvidence(prepared, completed, { writer: blobArtifactWriter, maxDurationMs: Math.min(600000, remaining) });
      validatePublicationSourceBindings(await sourceProvenance(root), input.source);
      report = assembleConsumerVerification(prepared, completed, references);
    } else {
      report = { schemaVersion: 1, kind: "local-consumer-verification", status: "tested-local-evidence",
        scope: "actual-consumers-without-public-evidence-not-a-frozen-release-input", source: input.source,
        matrices: completed.map(entry => entry.result) };
    }
    phase = "execution-index";
    await writeExecutionResult({ output: options.output, input, role: "consumer", resultKind: options.publishEvidence ? "published" : "local", report,
      publicAttachments: batch.map(({ evidence, reference }) => ({ ...reference, path: `${evidence.matrix.framework}-${evidence.matrix.packageManager}.evidence.json` })) });
    return { status: options.publishEvidence ? "verified-published-consumers" : report.status, output: options.output };
  } catch (error) {
    const failure = { schemaVersion: 1, kind: "published-consumer-failure", status: "failed", phase, matrix,
      step: typeof error.step === "string" && /^[a-z0-9-]{1,64}$/.test(error.step) ? error.step : null,
      code: /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "PUBLISHED_CONSUMER_FAILED" };
    await writeFile(path.join(options.output, "failure.json"), serialize(failure), { flag: "wx", mode: 0o600 });
    throw Object.assign(new Error(`Published consumer verification failed: ${failure.code}`), { code: failure.code });
  } finally { if (temporary) await rm(temporary, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  testPublishedConsumerInstalls(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `Published consumer verification failed: ${error.code}` : "Published consumer verification failed: INVALID_ARGUMENTS_OR_OUTPUT");
    process.exitCode = 1;
  });
}
