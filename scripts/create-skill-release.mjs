/** Produce schema 2 Skill resources; public upload and release selection are separate. */
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSkillArchive } from "./skill-archive.mjs";
import { artifactFiles, artifactManifestSchema, artifactOrigin, commitArtifactCandidate } from "./agent-artifacts.mjs";
import { readOwnedFile, serialize, sha256, sourceProvenance } from "./agent-utils.mjs";
import { renderSkillGuide, skillGuideTemplate, skillIdentitySchema, skillReferenceMap, skillReleaseSchema, skillVersion } from "./skill-release.mjs";
import { skillNames } from "./package-migration-skills.mjs";
import { unzipSkillArchive } from "./safe-skill-zip.mjs";
import { readSkillTexts } from "./skill-text-references.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

export function assembleSkillRelease({ archive, files, template, artifactBaseUrl, siteBaseUrl }) {
  const identity = skillIdentitySchema.parse({ schemaVersion: 2, skills: [...skillNames], defaultProjectDirectory: ".agents/skills",
    artifactBaseUrl: artifactOrigin(artifactBaseUrl), siteBaseUrl: artifactOrigin(siteBaseUrl), guideTemplateSha256: sha256(skillGuideTemplate(template, "release")),
    archive: { bytes: archive.length, sha256: sha256(archive) }, files });
  const version = skillVersion(identity);
  const baseUrl = `${identity.artifactBaseUrl}/skills/releases/${version}`;
  const release = skillReleaseSchema.parse({ ...identity, skillVersion: version,
    archive: { ...identity.archive, url: `${baseUrl}/zeron-skills.zip` }, installationGuideUrl: `${baseUrl}/install.md`,
    latestManifestUrl: `${identity.siteBaseUrl}/skills/manifest.json`, references: skillReferenceMap(identity, version) });
  const guide = renderSkillGuide(template, { version, manifestPath: `${baseUrl}/manifest.json`,
    artifactBaseUrl: identity.artifactBaseUrl, siteBaseUrl: identity.siteBaseUrl });
  if (Buffer.byteLength(guide) > 16384) throw new Error("Skill installation guide exceeds 16 KiB");
  return { release, guide, baseUrl };
}

/** Check the ZIP and published reference bytes against the same source list. */
export async function verifySkillRelease(directory, input) {
  const release = skillReleaseSchema.parse(input);
  const zip = await readOwnedFile(directory, "zeron-skills.zip");
  if (zip.length !== release.archive.bytes || sha256(zip) !== release.archive.sha256) throw new Error("Skill ZIP hash/size mismatch");
  const extracted = unzipSkillArchive(zip, release.files);
  if (serialize(Object.keys(extracted).sort()) !== serialize(release.files.map((file) => file.path))) throw new Error("Skill ZIP file list differs from manifest");
  for (const file of release.files) {
    if (extracted[file.path].length !== file.bytes || sha256(extracted[file.path]) !== file.sha256) throw new Error(`Skill ZIP file mismatch: ${file.path}`);
    const source = await readOwnedFile(directory, `sources/${file.path}`);
    if (source.length !== file.bytes || sha256(source) !== file.sha256) throw new Error(`Skill reference mismatch: ${file.path}`);
  }
  await readSkillTexts(release.files, relative => extracted[relative]);
  const bytes = await readOwnedFile(directory, "manifest.json");
  if (bytes.toString("utf8") !== serialize(release)) throw new Error("Skill manifest is not its canonical frozen bytes");
  return release;
}

export async function buildSkillRelease({ artifactBaseUrl, siteBaseUrl, requireClean = false, outputBase = path.join(root, "output/agent-releases/skills") }) {
  artifactOrigin(artifactBaseUrl);
  artifactOrigin(siteBaseUrl);
  const output = path.resolve(outputBase);
  const relative = path.relative(root, output);
  if (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)
    && relative !== "output" && !relative.startsWith(`output${path.sep}`)) throw new Error("In-repository Skill candidates must use an isolated output/ directory");
  const before = await sourceProvenance(root);
  if (requireClean && !before.sourceClean) throw new Error("Formal Skill candidates require a clean committed source checkout");
  const template = await readFile(path.join(root, "docs/skills/install.md"), "utf8");
  const bundle = await buildSkillArchive();
  const { release, guide, baseUrl } = assembleSkillRelease({ ...bundle, template, artifactBaseUrl, siteBaseUrl });
  await mkdir(output, { recursive: true });
  const stage = await mkdtemp(path.join(output, ".candidate-"));
  try {
    await writeFile(path.join(stage, "zeron-skills.zip"), bundle.archive);
    await writeFile(path.join(stage, "manifest.json"), serialize(release));
    await writeFile(path.join(stage, "install.md"), guide);
    for (const [relative, bytes] of bundle.sourceFiles) {
      const target = path.join(stage, "sources", relative);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, bytes);
    }
    await verifySkillRelease(stage, release);
    if (serialize(before) !== serialize(await sourceProvenance(root))) throw new Error("Source inputs changed while building the Skill candidate; retry from frozen inputs");
    const manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind: "skill", releaseId: release.skillVersion, baseUrl,
      files: await artifactFiles(stage, baseUrl, { kind: "skill" }) });
    await writeFile(path.join(stage, "artifacts.json"), serialize(manifest));
    const destination = path.join(output, release.skillVersion);
    const verified = await commitArtifactCandidate(stage, destination, manifest);
    // Keep Git bindings outside the content-addressed public inventory.
    const provenanceName = `${release.skillVersion}.${before.sourceRevision}.${before.sourceInputSha256}.${before.sourceClean ? "clean" : "development"}.source.json`;
    const provenanceFile = path.join(output, provenanceName);
    const evidence = serialize({ schemaVersion: 1, scope: "local-candidate-not-uploaded", kind: "skill", releaseId: release.skillVersion,
      manifestSha256: verified.manifestSha256, provenance: before });
    try { await writeFile(provenanceFile, evidence, { flag: "wx" }); }
    catch (error) {
      if (error.code !== "EEXIST" || (await readOwnedFile(output, provenanceName)).toString("utf8") !== evidence) throw error;
    }
    return { scope: "local-candidate-not-uploaded", directory: destination, provenance: before, provenanceFile, release, ...verified };
  } finally { await rm(stage, { recursive: true, force: true }); }
}
