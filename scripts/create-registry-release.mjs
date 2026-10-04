/** Build an unuploaded Registry candidate without rewriting the legacy endpoint. */
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { composeRegistry } from "../packages/registry/scripts/compose-registry.mjs";
import { processRegistry } from "../packages/registry/scripts/postbuild.mjs";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";
import { artifactFiles, artifactManifestSchema, commitArtifactCandidate, registryReleaseBase } from "./agent-artifacts.mjs";
import { serialize, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

export function validateReleaseDependencies(items, baseUrl) {
  const names = new Set(items.map((item) => item.name));
  if (items.some((item) => !/^[a-z0-9][a-z0-9-]*$/.test(item.name)) || names.size !== items.length) {
    throw new Error("Registry release contains invalid or duplicate names");
  }
  const urls = new Set([...names].map((name) => `${baseUrl}/${name}.json`));
  for (const item of items) {
    for (const dependency of item.registryDependencies ?? []) {
      // This repository currently has no external Registry dependency. Never
      // silently fall back to mutable shadcn names or a different release.
      if (!urls.has(dependency)) throw new Error(`${item.name}: dependency is outside the fixed release closure: ${dependency}`);
    }
  }
}

export async function createRegistryRelease({ releaseId, artifactBaseUrl, requireClean = false,
  outputBase = path.join(root, "output/agent-releases/registry") }) {
  const baseUrl = registryReleaseBase(artifactBaseUrl, releaseId);
  const output = path.resolve(outputBase);
  const relative = path.relative(root, output);
  if (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)
    && relative !== "output" && !relative.startsWith(`output${path.sep}`)) throw new Error("In-repository Registry candidates must use an isolated output/ directory");
  const before = await sourceProvenance(root);
  if (requireClean && !before.sourceClean) throw new Error("Formal Registry candidates require a clean committed source checkout");
  for (const command of ["tokens:check", "code-engine:check"]) {
    execFileSync("pnpm", [command], { cwd: root, stdio: "inherit" });
  }
  await mkdir(output, { recursive: true });
  const stage = await mkdtemp(path.join(output, ".candidate-"));
  const artifacts = path.join(stage, "artifacts");
  const destination = path.join(output, releaseId);
  try {
    await mkdir(artifacts);
    const composed = path.join(stage, "registry.composed.json");
    const source = await composeRegistry(composed);
    // Use the workspace's pinned shadcn executable, with isolated input/output.
    execFileSync("pnpm", ["--filter", "@zeron/registry", "exec", "shadcn", "build", composed, "-o", artifacts, "-c", root], { cwd: root, stdio: "inherit" });
    const expectedNames = source.items.map((item) => item.name).sort();
    await processRegistry(artifacts, baseUrl);
    const catalog = JSON.parse(await readFile(path.join(artifacts, "registry.json"), "utf8"));
    if (serialize(catalog.items.map((item) => item.name).sort()) !== serialize(expectedNames)) throw new Error("Built Registry index does not match sources");
    const items = await Promise.all(expectedNames.map(async (name) => {
      const item = JSON.parse(await readFile(path.join(artifacts, `${name}.json`), "utf8"));
      if (item.name !== name) throw new Error(`Registry item identity mismatch: ${name}`);
      return item;
    }));
    validateReleaseDependencies(catalog.items, baseUrl);
    validateReleaseDependencies(items, baseUrl);
    const errors = checkRegistry(items);
    if (errors.length) throw new Error(`Registry candidate closure failed:\n${errors.join("\n")}`);
    const files = await artifactFiles(artifacts, baseUrl);
    if (serialize(files.map((file) => file.path).sort()) !== serialize(["registry.json", ...expectedNames.map((name) => `${name}.json`)].sort())) {
      throw new Error("Registry candidate has missing or unexpected distribution files");
    }
    if (serialize(before) !== serialize(await sourceProvenance(root))) throw new Error("Source inputs changed while building the Registry candidate; retry from frozen inputs");
    const manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind: "registry", releaseId, baseUrl, files, provenance: before });
    await writeFile(path.join(artifacts, "manifest.json"), serialize(manifest));
    const verified = await commitArtifactCandidate(artifacts, destination, manifest);
    return { scope: "local-candidate-not-uploaded", directory: destination, ...verified };
  } finally { await rm(stage, { recursive: true, force: true }); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (key === "--require-clean" && !options.requireClean) options.requireClean = true;
    else if ((key === "--release-id" || key === "--artifact-base-url") && args[index + 1] && !args[index + 1].startsWith("--")) {
      const option = key === "--release-id" ? "releaseId" : "artifactBaseUrl";
      if (options[option]) throw new Error(`Duplicate option: ${key}`);
      options[option] = args[++index];
    } else throw new Error("Usage: registry:release --release-id <id> --artifact-base-url <https-origin> [--require-clean]");
  }
  options.artifactBaseUrl ??= process.env.ARTIFACT_BASE_URL;
  const result = await createRegistryRelease(options);
  console.log(`Registry candidate ${result.manifest.releaseId}: ${result.manifest.files.length} files; manifest ${result.manifestSha256}`);
  console.log(`Scope: ${result.scope}; sourceClean: ${result.manifest.provenance.sourceClean}; output: ${result.directory}`);
}
