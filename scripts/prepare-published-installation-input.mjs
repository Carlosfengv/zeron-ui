import { lstat, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { installationInputSchema } from "./agent-release-record.mjs";
import { artifactManifestSchema } from "./agent-artifacts.mjs";
import { createInstallationOutput } from "./check-published-installation-input.mjs";
import { createInstallationInput } from "./published-installation-input.mjs";
import { artifactCompletionSchema, planArtifactPublication, validatePublicationSourceBindings, verifyPublicationSource } from "./publish-agent-artifacts.mjs";
import { downloadArtifact } from "./download-agent-artifact.mjs";
import { loadAgentSchema } from "./load-agent-schema.mjs";
import { serialize, sha256, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export const installationConfigurationSchema = z.object({ schemaVersion: z.literal(1),
  siteBaseUrl: installationInputSchema.shape.siteBaseUrl, cli: installationInputSchema.shape.cli,
  matrices: installationInputSchema.shape.matrices, nextOnlyRejectionItem: installationInputSchema.shape.nextOnlyRejectionItem,
}).strict().superRefine((configuration, context) => {
  if (new Set(configuration.matrices.map(row => `${row.framework}:${row.packageManager}`)).size !== 4) {
    context.addIssue({ code: "custom", path: ["matrices"], message: "All four consumer combinations are required" });
  }
  configuration.matrices.forEach((row, index) => {
    const consumesNextOnly = row.testedItems.includes(configuration.nextOnlyRejectionItem);
    if ((row.framework === "next" && !consumesNextOnly) || (row.framework === "vite" && consumesNextOnly)) {
      context.addIssue({ code: "custom", path: ["matrices", index, "testedItems"],
        message: row.framework === "next" ? "Next matrices must consume the rejection representative" : "Vite cannot consume the rejection representative" });
    }
  });
});

export function parseInstallationPrepareArgs(args) {
  const names = ["--registry-manifest", "--skill-artifacts", "--skill-provenance", "--config", "--output"];
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    if (!names.includes(args[index]) || flags.has(args[index]) || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error("Invalid installation preparation arguments");
    flags.set(args[index], path.resolve(args[index + 1]));
  }
  if (flags.size !== names.length) throw new Error("All installation preparation inputs are required");
  return { registryManifest: flags.get("--registry-manifest"), skillArtifacts: flags.get("--skill-artifacts"),
    skillProvenance: flags.get("--skill-provenance"), config: flags.get("--config"), output: flags.get("--output") };
}

async function readCanonicalJson(filename, schema) {
  const stat = await lstat(filename);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw Object.assign(new Error("Invalid preparation input"), { code: "PREPARE_INPUT_FILE" });
  const raw = await readFile(filename);
  const value = schema.parse(JSON.parse(raw.toString("utf8")));
  if (raw.toString("utf8") !== serialize(value)) throw Object.assign(new Error("Noncanonical preparation input"), { code: "PREPARE_INPUT_CANONICAL" });
  return value;
}

/** Completion bytes are derived from the validated local stage, then matched against the actual public object. */
export async function readPreparedCompletion(plan, { fetcher = fetch, downloadOptions = {} } = {}) {
  const completion = artifactCompletionSchema.parse(plan.completion);
  const bytes = Buffer.from(serialize(completion));
  const reference = plan.entries.find(entry => entry.role === "completion");
  if (!reference || completion.baseUrl !== plan.baseUrl || reference.url !== `${plan.baseUrl}/complete.json`
    || reference.bytes !== bytes.length || reference.sha256 !== sha256(bytes)) throw Object.assign(new Error("Bad completion plan"), { code: "PREPARE_COMPLETION_PLAN" });
  const actual = await downloadArtifact(reference.url, { ...downloadOptions, fetcher, origin: new URL(plan.baseUrl).origin,
    bytes: bytes.length, hash: sha256(bytes), maxBytes: 64 * 1024, allowMissing: false });
  return JSON.parse(actual.toString("utf8"));
}

/** Assembles a descriptor, never an installation or publication success declaration. */
export async function preparePublishedInstallationInput(args) {
  const options = parseInstallationPrepareArgs(args);
  await createInstallationOutput(options.output, { excludeDirectories: [path.dirname(options.registryManifest), path.dirname(options.skillArtifacts)] });
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22) throw Object.assign(new Error("Node 22 is required"), { code: "NODE_22_REQUIRED" });
    const source = await sourceProvenance(root);
    validatePublicationSourceBindings(source, source);
    const configuration = await readCanonicalJson(options.config, installationConfigurationSchema);
    const registryManifest = await readCanonicalJson(options.registryManifest, artifactManifestSchema);
    const skillManifest = await readCanonicalJson(options.skillArtifacts, artifactManifestSchema);
    const provenanceStat = await lstat(options.skillProvenance);
    if (!provenanceStat.isFile() || provenanceStat.size > 2 * 1024 * 1024) throw Object.assign(new Error("Invalid Skill provenance input"), { code: "PREPARE_INPUT_FILE" });
    if (registryManifest.kind !== "registry" || skillManifest.kind !== "skill"
      || new URL(registryManifest.baseUrl).origin !== new URL(skillManifest.baseUrl).origin) {
      throw Object.assign(new Error("Wrong preparation stages"), { code: "PREPARE_STAGE_BINDING" });
    }
    const schemas = await loadAgentSchema();
    const identities = schemas.itemIdentitiesSchema.parse(JSON.parse(await readFile(path.join(root, "docs/agent-data/item-identities.json"), "utf8")));
    const items = identities.items.filter(item => item.type === "registry" && item.status === "active")
      .map(item => ({ id: item.id, registryName: item.key })).sort((a, b) => a.id.localeCompare(b.id, "en"));
    const registryPlan = await planArtifactPublication(path.dirname(options.registryManifest), registryManifest);
    const skillPlan = await planArtifactPublication(path.dirname(options.skillArtifacts), skillManifest);
    await verifyPublicationSource(path.dirname(options.registryManifest), registryManifest);
    await verifyPublicationSource(path.dirname(options.skillArtifacts), skillManifest, options.skillProvenance);
    const registryCompletion = await readPreparedCompletion(registryPlan);
    const skillCompletion = await readPreparedCompletion(skillPlan);
    const input = createInstallationInput({ source, ...configuration, registryManifest, registryCompletion, skillManifest, skillCompletion, items });
    validatePublicationSourceBindings(await sourceProvenance(root), source);
    await writeFile(path.join(options.output, "installation-input.json"), serialize(input), { flag: "wx", mode: 0o600 });
    return { status: "assembled-input", scope: "descriptor-with-public-completions-not-consumer-verification", output: options.output };
  } catch (error) {
    const failure = { schemaVersion: 1, kind: "installation-preparation-failure", status: "failed",
      code: /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "INSTALLATION_PREPARATION_FAILED" };
    await writeFile(path.join(options.output, "failure.json"), serialize(failure), { flag: "wx", mode: 0o600 });
    throw Object.assign(new Error(`Installation preparation failed: ${failure.code}`), { code: failure.code });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  preparePublishedInstallationInput(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `Installation preparation failed: ${error.code}` : "Installation preparation failed: INVALID_ARGUMENTS_OR_OUTPUT");
    process.exitCode = 1;
  });
}
