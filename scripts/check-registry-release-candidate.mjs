import { randomUUID } from "node:crypto";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRegistryRelease } from "./create-registry-release.mjs";
import { readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";
import { planArtifactPublication } from "./publish-agent-artifacts.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const releaseId = `local-${randomUUID()}`;
const report = { schemaVersion: 1, scope: "local-candidate-no-upload", status: "running", releaseId, checks: [], manifestSha256: null, source: null };
const output = path.join(root, "output/agent-access/registry-candidate.json");
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, serialize(report));
async function legacySnapshot() {
  const files = [];
  async function visit(relative) {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(name);
      else {
        if (!entry.isFile()) throw new Error(`Unexpected non-file legacy artifact: ${name}`);
        files.push({ path: name, sha256: sha256(await readOwnedFile(root, name)) });
      }
    }
  }
  await visit("public/r");
  const composed = "packages/registry/registry.composed.json";
  try { files.push({ path: composed, sha256: sha256(await readOwnedFile(root, composed)) }); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  return sha256(serialize(files.sort((a, b) => a.path.localeCompare(b.path))));
}
try {
  const before = await legacySnapshot();
  const options = { releaseId, artifactBaseUrl: "https://artifacts.example.invalid" };
  const first = await createRegistryRelease(options);
  report.manifestSha256 = first.manifestSha256;
  report.source = first.manifest.provenance;
  report.files = first.manifest.files.length;
  report.artifactDirectory = first.directory;
  report.checks.push("all-distribution-files-and-fixed-dependency-closure");
  const retry = await createRegistryRelease(options);
  if (retry.manifestSha256 !== first.manifestSha256) throw new Error("Identical candidate retry changed the manifest");
  report.checks.push("identical-retry-reuses-bytes");
  let rejected = false;
  try { await createRegistryRelease({ ...options, artifactBaseUrl: "https://different.example.invalid" }); }
  catch (error) { if (!error.message.includes("different bytes")) throw error; rejected = true; }
  if (!rejected) throw new Error("Changed artifact source overwrote the same release ID");
  if (sha256(await readFile(path.join(first.directory, "manifest.json"))) !== first.manifestSha256) throw new Error("Conflicting retry damaged the existing release");
  report.checks.push("changed-source-conflict-keeps-existing-bytes");
  if (!first.manifest.provenance.sourceClean) {
    rejected = false;
    try { await createRegistryRelease({ ...options, requireClean: true }); }
    catch (error) { if (!error.message.includes("clean committed")) throw error; rejected = true; }
    if (!rejected) throw new Error("Dirty sources were accepted as a formal candidate");
    report.checks.push("dirty-source-formal-candidate-rejected");
  }
  if (before !== await legacySnapshot()) throw new Error("Registry candidate changed the legacy Registry or composed input");
  report.checks.push("legacy-registry-and-composed-input-byte-identical");
  const plan = await planArtifactPublication(first.directory, first.manifest);
  await writeFile(path.join(path.dirname(output), "registry-publication-plan.json"), serialize(plan));
  report.checks.push("publication-dry-run-completion-last-no-upload");
  await writeFile(path.join(path.dirname(output), "registry-candidate-manifest.json"), await readOwnedFile(first.directory, "manifest.json"));
  await lstat(first.directory);
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await writeFile(output, serialize(report));
  console.log(`Registry candidate check ${report.status}; scope ${report.scope}; evidence ${output}`);
  if (report.failure) console.error(report.failure);
}
