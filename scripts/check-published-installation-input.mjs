import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { installationInputSchema } from "./agent-release-record.mjs";
import { serialize, sourceProvenance } from "./agent-utils.mjs";
import { validatePublicationSourceBindings, verifyPublicationSource } from "./publish-agent-artifacts.mjs";
import { loadAgentSchema } from "./load-agent-schema.mjs";
import { assertInstallationIdentitySource, verifyPublishedInstallationInput } from "./published-installation-input.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
function isolatedOutput(output) {
  const relative = path.relative(root, output);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)
    && !relative.startsWith(`output${path.sep}`))) throw new Error("Installation evidence must use an isolated output directory");
}
export function parseInstallationCheckArgs(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!["--input", "--output"].includes(name) || flags.has(name) || !value || value.startsWith("--")) {
      throw new Error("Use --input <installation-input.json> --output <new-isolated-directory>");
    }
    flags.set(name, value);
  }
  if (flags.size !== 2) throw new Error("Use --input <installation-input.json> --output <new-isolated-directory>");
  const output = path.resolve(flags.get("--output"));
  isolatedOutput(output);
  return { input: path.resolve(flags.get("--input")), output };
}

export async function createInstallationOutput(output, { excludeDirectories = [] } = {}) {
  const excluded = await Promise.all(excludeDirectories.map(directory => realpath(directory)));
  const check = value => {
    isolatedOutput(value);
    for (const directory of excluded) {
      const relative = path.relative(directory, value);
      if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) {
        throw new Error("Installation output must be outside artifact candidates");
      }
    }
  };
  check(output);
  let ancestor = path.dirname(output);
  const suffix = [path.basename(output)];
  while (true) {
    try { check(path.join(await realpath(ancestor), ...suffix)); break; }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      suffix.unshift(path.basename(ancestor));
      ancestor = path.dirname(ancestor);
    }
  }
  await mkdir(path.dirname(output), { recursive: true });
  await mkdir(output, { mode: 0o700 });
}

export async function readCanonicalInstallationInput(filename) {
  const stat = await lstat(filename);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw Object.assign(new Error("Invalid input file"), { code: "INVALID_INPUT_FILE" });
  const raw = await readFile(filename);
  const parsed = installationInputSchema.safeParse(JSON.parse(raw.toString("utf8")));
  if (!parsed.success || raw.toString("utf8") !== serialize(parsed.data)) throw Object.assign(new Error("Invalid input contract"), { code: "INVALID_INPUT_CONTRACT" });
  return parsed.data;
}

export async function verifyInstallationInputForExecution(input) {
  validatePublicationSourceBindings(await sourceProvenance(root), input.source);
  const schemas = await loadAgentSchema();
  const identities = schemas.itemIdentitiesSchema.parse(JSON.parse(await readFile(path.join(root, "docs/agent-data/item-identities.json"), "utf8")));
  assertInstallationIdentitySource(input, identities);
  const result = await verifyPublishedInstallationInput(input);
  await verifyPublicSourceContent(result);
  validatePublicationSourceBindings(await sourceProvenance(root), input.source);
  return result;
}

export async function verifyPublicSourceContent(result, { verifySource = verifyPublicationSource } = {}) {
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-installation-source-check-"));
  try {
    for (const kind of ["registry", "skill"]) {
      const stage = result[kind];
      const directory = path.join(temporary, kind);
      for (const [name, bytes] of [...stage.files, [kind === "skill" ? "artifacts.json" : "manifest.json", Buffer.from(serialize(stage.manifest))]]) {
        const filename = path.join(directory, name);
        await mkdir(path.dirname(filename), { recursive: true });
        await writeFile(filename, bytes);
      }
      const provenanceFile = path.join(temporary, "skill.source.json");
      if (kind === "skill") await writeFile(provenanceFile, serialize(result.input.source));
      await verifySource(directory, stage.manifest, kind === "skill" ? provenanceFile : undefined);
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

/** Production entry enforces real source; fixture injection exists only in the separate pure checker. */
export async function checkPublishedInstallationInput(args) {
  const options = parseInstallationCheckArgs(args);
  // Resolve existing parents before creating directories: output aliases may not point into source.
  await createInstallationOutput(options.output); // Existing results cannot survive a new failed run under the same name.
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22) throw Object.assign(new Error("Node 22 is required"), { code: "NODE_22_REQUIRED" });
    const input = await readCanonicalInstallationInput(options.input);
    const result = await verifyInstallationInputForExecution(input);
    await writeFile(path.join(options.output, "zeron-ui.tgz"), result.npm.tarball, { flag: "wx" });
    await writeFile(path.join(options.output, "input-verification.json"), serialize(result.report), { flag: "wx" });
    return { status: result.report.status, scope: result.report.scope, output: options.output };
  } catch (error) {
    const report = { schemaVersion: 1, kind: "published-input-failure", status: "failed",
      scope: "input-check-not-consumer-installation", code: /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "INPUT_CHECK_FAILED" };
    await writeFile(path.join(options.output, "failure.json"), serialize(report), { flag: "wx" });
    throw Object.assign(new Error(`Published input check failed: ${report.code}`), { code: report.code });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkPublishedInstallationInput(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
