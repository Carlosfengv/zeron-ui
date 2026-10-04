import { constants } from "node:fs";
import { execFileSync } from "node:child_process";
import { mkdir, open, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ciLocatorSchema, ciTrustPath, ciTrustPolicySchema, rejectCi } from "./agent-ci-contract.mjs";
import { verifyCiEvidence } from "./agent-ci-trust.mjs";
import { ciReadToken } from "./agent-ci-github.mjs";
import { executionPathSchema, executionRoles } from "./agent-execution-index.mjs";
import { createInstallationOutput, parseInstallationCheckArgs, readCanonicalInstallationInput, verifyInstallationInputForExecution } from "./check-published-installation-input.mjs";
import { readExampleEvidenceSources } from "./test-published-examples.mjs";
import { validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { serialize, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export function parseCiCheckArgs(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index], value = args[index + 1];
    if (!["--input", "--locator", "--output"].includes(name) || flags.has(name) || !value || value.startsWith("--")) rejectCi("CI_ARGUMENTS");
    flags.set(name, value);
  }
  if (flags.size !== 3) rejectCi("CI_ARGUMENTS");
  return { ...parseInstallationCheckArgs(["--input", flags.get("--input"), "--output", flags.get("--output")]), locator: path.resolve(flags.get("--locator")) };
}

/** Read a bounded regular file with no symlink, replacement or growth accepted. */
export async function readRegularCiInput(filename, maxBytes = 2 * 1024 * 1024) {
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1 || before.size > maxBytes) rejectCi("CI_INPUT_FILE");
    const chunks = []; let size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      size += chunk.length; if (size > maxBytes || size > before.size) rejectCi("CI_INPUT_FILE"); chunks.push(chunk);
    }
    const after = await handle.stat();
    if (size !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs
      || after.ctimeMs !== before.ctimeMs || after.nlink !== 1) rejectCi("CI_INPUT_FILE");
    return Buffer.concat(chunks);
  } finally { await handle.close(); }
}

export async function readCanonicalCiLocator(filename) {
  const raw = await readRegularCiInput(filename); let locator;
  try { locator = ciLocatorSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw))); } catch { rejectCi("CI_LOCATOR_CONTRACT"); }
  if (!raw.equals(Buffer.from(serialize(locator)))) rejectCi("CI_LOCATOR_CANONICAL");
  return locator;
}

export async function committedCiSourceFile(revision, filename) {
  let committed;
  try { committed = execFileSync("git", ["show", `${revision}:${filename}`], { cwd: root, maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }); }
  catch { rejectCi("CI_COMMITTED_SOURCE_FILE"); }
  if (!committed.equals(await readRegularCiInput(path.join(root, filename), 32 * 1024 * 1024))) rejectCi("CI_COMMITTED_SOURCE_BYTES");
  return committed;
}

export async function readCommittedCiPolicy(source) {
  const sourceFiles = new Map([[ciTrustPath, await committedCiSourceFile(source.sourceRevision, ciTrustPath)]]);
  let policy;
  try { policy = ciTrustPolicySchema.parse(JSON.parse(sourceFiles.get(ciTrustPath).toString("utf8"))); } catch { rejectCi("CI_POLICY_CONTRACT"); }
  if (!sourceFiles.get(ciTrustPath).equals(Buffer.from(serialize(policy)))) rejectCi("CI_POLICY_CANONICAL");
  for (const filename of [policy.workflowPath, ...new Set(Object.values(executionRoles).flatMap(value => [value.producer, value.worker]).filter(Boolean))]) {
    sourceFiles.set(filename, await committedCiSourceFile(source.sourceRevision, filename));
  }
  return { policy, sourceFiles };
}

/** Closed production CLI: no policy override, injected fetcher, imported pass or skip switch. */
export async function checkAgentCiEvidence(args) {
  const options = parseCiCheckArgs(args);
  await createInstallationOutput(options.output);
  let phase = "runtime";
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22) rejectCi("NODE_22_REQUIRED");
    phase = "input";
    const input = await readCanonicalInstallationInput(options.input), locator = await readCanonicalCiLocator(options.locator);
    phase = "source";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    const { policy, sourceFiles } = await readCommittedCiPolicy(input.source);
    phase = "installation-input";
    const prepared = await verifyInstallationInputForExecution(input), sources = await readExampleEvidenceSources();
    phase = "platform-archives-and-public-bytes";
    const result = await verifyCiEvidence({ prepared, sources, locator, policy, sourceFiles },
      { token: ciReadToken() });
    phase = "archive-output";
    for (const [name, bytes] of result.privateFiles) {
      executionPathSchema.parse(name);
      const filename = path.join(options.output, name); await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
      await writeFile(filename, bytes, { flag: "wx", mode: 0o600 });
    }
    phase = "source-final";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    phase = "receipt";
    await writeFile(path.join(options.output, "ci-verification.json"), serialize(result.receipt), { flag: "wx", mode: 0o600 });
    return { status: result.receipt.status, scope: result.receipt.scope, output: options.output };
  } catch (error) {
    const failure = { schemaVersion: 1, kind: "agent-ci-verification-failure", status: "failed", scope: "ci-evidence-gate-not-publication", phase,
      code: /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "CI_VERIFICATION_FAILED" };
    await writeFile(path.join(options.output, "failure.json"), serialize(failure), { flag: "wx", mode: 0o600 });
    throw Object.assign(new Error(`CI verification failed: ${failure.code}`), { code: failure.code });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkAgentCiEvidence(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `CI verification failed: ${error.code}` : "CI verification failed: INVALID_ARGUMENTS_OR_OUTPUT");
    process.exitCode = 1;
  });
}
