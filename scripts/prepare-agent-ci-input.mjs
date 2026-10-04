import { appendFile, lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRegistryRelease } from "./create-registry-release.mjs";
import { buildSkillRelease } from "./create-skill-release.mjs";
import { createInstallationOutput } from "./check-published-installation-input.mjs";
import { installationConfigurationSchema, preparePublishedInstallationInput } from "./prepare-published-installation-input.mjs";
import { ciTrustPath, ciTrustPolicySchema, rejectCi } from "./agent-ci-contract.mjs";
import { executionWorkflowLocator } from "./agent-execution-index.mjs";
import { validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { serialize, sha256, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export const ciInstallationConfigPath = "docs/agent-data/installation-config.json";
/** Shared source/public-completion construction. The calling CLI separately checks its workflow identity. */
export async function buildAgentCiInstallationInput({ releaseId, output, siteBaseUrl, artifactBaseUrl }) {
  const registry = await createRegistryRelease({ releaseId, artifactBaseUrl, requireClean: true, outputBase: path.join(output, "registry") });
  const skill = await buildSkillRelease({ artifactBaseUrl, siteBaseUrl, requireClean: true, outputBase: path.join(output, "skills") });
  const directory = path.join(output, "input");
  await preparePublishedInstallationInput(["--registry-manifest", path.join(registry.directory, "manifest.json"),
    "--skill-artifacts", path.join(skill.directory, "artifacts.json"), "--skill-provenance", skill.provenanceFile,
    "--config", path.join(root, ciInstallationConfigPath), "--output", directory]);
  return path.join(directory, "installation-input.json");
}
export function parseCiPreparationArgs(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    if (!["--release-id", "--output"].includes(args[index]) || flags.has(args[index]) || !args[index + 1] || args[index + 1].startsWith("--")) rejectCi("CI_PREPARE_ARGUMENTS");
    flags.set(args[index], args[index + 1]);
  }
  if (flags.size !== 2 || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(flags.get("--release-id")) || /[\r\n]/.test(flags.get("--output"))) rejectCi("CI_PREPARE_ARGUMENTS");
  return { releaseId: flags.get("--release-id"), output: path.resolve(flags.get("--output")) };
}

/** Builds descriptors from S and existing public completions; never writes Blob or creates an installation pass. */
export async function prepareAgentCiInput(args) {
  const options = parseCiPreparationArgs(args); await createInstallationOutput(options.output);
  let phase = "runtime";
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22 || process.platform !== "linux") rejectCi("CI_PREPARE_RUNTIME");
    phase = "source";
    const source = await sourceProvenance(root); validatePublicationSourceBindings(source, source);
    const policy = ciTrustPolicySchema.parse(JSON.parse(await readFile(path.join(root, ciTrustPath), "utf8")));
    const locator = executionWorkflowLocator();
    if (!locator || locator.headSha !== source.sourceRevision || locator.repository !== policy.repository
      || locator.workflowRef !== `${policy.repository}/${policy.workflowPath}@refs/heads/${policy.branch}`) rejectCi("CI_PREPARE_WORKFLOW");
    phase = "configuration";
    const configStat = await lstat(path.join(root, ciInstallationConfigPath));
    if (!configStat.isFile() || configStat.size > 2 * 1024 * 1024) rejectCi("CI_PREPARE_CONFIG");
    const raw = await readFile(path.join(root, ciInstallationConfigPath));
    const config = installationConfigurationSchema.parse(JSON.parse(raw.toString("utf8")));
    if (!raw.equals(Buffer.from(serialize(config))) || config.siteBaseUrl !== process.env.SITE_BASE_URL) rejectCi("CI_PREPARE_CONFIG");
    phase = "candidates";
    const filename = await buildAgentCiInstallationInput({ ...options, artifactBaseUrl: process.env.ARTIFACT_BASE_URL, siteBaseUrl: config.siteBaseUrl });
    validatePublicationSourceBindings(await sourceProvenance(root), source);
    const bytes = await readFile(filename);
    const descriptor = { schemaVersion: 1, kind: "agent-ci-installation-input-transport", scope: "descriptor-not-installation-pass",
      source, workflowLocator: locator, input: { path: filename, bytes: bytes.length, sha256: sha256(bytes) } };
    await writeFile(path.join(options.output, "input-transport.json"), serialize(descriptor), { flag: "wx", mode: 0o600 });
    if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,
      `input-file=${filename}\ninput-sha256=${descriptor.input.sha256}\ninput-bytes=${bytes.length}\n`);
    return { status: "assembled-ci-input", scope: descriptor.scope, output: options.output };
  } catch (error) {
    const failure = { schemaVersion: 1, kind: "agent-ci-input-preparation-failure", status: "failed", phase,
      code: /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "CI_PREPARATION_FAILED" };
    await writeFile(path.join(options.output, "failure.json"), serialize(failure), { flag: "wx", mode: 0o600 });
    throw Object.assign(new Error(`CI input preparation failed: ${failure.code}`), { code: failure.code });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  prepareAgentCiInput(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `CI input preparation failed: ${error.code}` : "CI input preparation failed: INVALID_ARGUMENTS_OR_OUTPUT"); process.exitCode = 1;
  });
}
