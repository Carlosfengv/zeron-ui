import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSkillRelease, verifySkillRelease } from "./create-skill-release.mjs";
import { verifyArtifactDirectory } from "./agent-artifacts.mjs";
import { readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";
import { planArtifactPublication } from "./publish-agent-artifacts.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = path.join(root, "output/agent-access/skill-candidate.json");
const report = { schemaVersion: 1, scope: "local-candidate-no-upload", status: "running", node: process.version, checks: [] };
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, serialize(report));
async function legacySnapshot() {
  const files = [];
  async function visit(relative) {
    for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const name = `${relative}/${entry.name}`;
      if (entry.isDirectory()) await visit(name);
      else {
        if (!entry.isFile()) throw new Error(`Non-file legacy Skill artifact: ${name}`);
        files.push({ path: name, bytes: (await readOwnedFile(root, name)).length, sha256: sha256(await readOwnedFile(root, name)) });
      }
    }
  }
  await visit("public/skills");
  return sha256(serialize(files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)));
}
try {
  const before = await legacySnapshot();
  const options = { artifactBaseUrl: "https://artifacts.example.invalid", siteBaseUrl: "https://docs.example.invalid" };
  const first = await buildSkillRelease(options);
  report.skillVersion = first.release.skillVersion;
  report.archiveSha256 = first.release.archive.sha256;
  report.guideTemplateSha256 = first.release.guideTemplateSha256;
  report.artifactManifestSha256 = first.manifestSha256;
  report.source = first.provenance;
  report.sourceFiles = first.release.files.length;
  report.distributionFiles = first.manifest.files.length;
  report.artifactDirectory = first.directory;
  await verifySkillRelease(first.directory, first.release);
  report.checks.push("archive-and-all-source-reference-bytes");
  if (first.release.skillVersion === first.release.archive.sha256) throw new Error("Skill identity was reduced to the ZIP hash");
  const retry = await buildSkillRelease(options);
  if (retry.manifestSha256 !== first.manifestSha256) throw new Error("Identical Skill candidate retry changed bytes");
  report.checks.push("identical-retry-reuses-version-and-bytes");
  for (const change of [{ artifactBaseUrl: "https://other-artifacts.example.invalid" }, { siteBaseUrl: "https://other-docs.example.invalid" }]) {
    const changed = await buildSkillRelease({ ...options, ...change });
    if (changed.release.skillVersion === first.release.skillVersion || changed.release.archive.sha256 !== first.release.archive.sha256) {
      throw new Error("Configured source change did not create a distinct release identity with the same ZIP");
    }
  }
  report.checks.push("artifact-and-update-origin-changes-create-new-identities");
  execFileSync(process.execPath, [path.join(root, "scripts/build-skill-distribution.mjs"), "--mode", "release",
    "--artifact-base-url", options.artifactBaseUrl, "--site-base-url", options.siteBaseUrl], { cwd: root, stdio: "inherit" });
  const actualManifest = JSON.parse(await readFile(path.join(first.directory, "artifacts.json"), "utf8"));
  if ((await verifyArtifactDirectory(first.directory, actualManifest)).manifestSha256 !== first.manifestSha256) throw new Error("Skill CLI changed the candidate identity");
  report.checks.push("release-mode-cli-reuses-the-same-candidate");
  if (!first.provenance.sourceClean) {
    let rejected = false;
    try { await buildSkillRelease({ ...options, requireClean: true }); }
    catch (error) { if (!error.message.includes("clean committed")) throw error; rejected = true; }
    if (!rejected) throw new Error("Formal Skill candidate accepted dirty sources");
    report.checks.push("dirty-source-formal-candidate-rejected");
  }
  if (before !== await legacySnapshot()) throw new Error("Skill candidate changed legacy public/skills bytes");
  report.checks.push("legacy-distribution-byte-identical");
  const plan = await planArtifactPublication(first.directory, first.manifest);
  await writeFile(path.join(path.dirname(output), "skill-publication-plan.json"), serialize(plan));
  report.checks.push("publication-dry-run-completion-last-no-upload");
  await writeFile(path.join(path.dirname(output), "skill-candidate-artifacts.json"), await readOwnedFile(first.directory, "artifacts.json"));
  await writeFile(path.join(path.dirname(output), "skill-candidate-manifest.json"), await readOwnedFile(first.directory, "manifest.json"));
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await writeFile(output, serialize(report));
  console.log(`Skill candidate check ${report.status}; scope ${report.scope}; evidence ${output}`);
  if (report.failure) console.error(report.failure);
}
