import { z } from "zod";
import { artifactFileUrl, artifactOrigin } from "./agent-artifacts.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";
import { skillNames } from "./package-migration-skills.mjs";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const origin = z.string().refine((value) => {
  try { return artifactOrigin(value) === value; } catch { return false; }
}, "Expected a normalized HTTPS origin");
const relative = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/).refine((value) => (
  value.split("/").every((part) => part && part !== "." && part !== "..")
), "Invalid Skill file path");
const skillName = z.enum(["zeron-page-builder", "swap-to-zeronui"]);
const fileSchema = z.object({ path: relative, bytes: z.number().int().nonnegative().max(8 * 1024 * 1024), sha256: hash }).strict();
const identityShape = {
  schemaVersion: z.literal(2),
  skills: z.array(skillName).length(2),
  defaultProjectDirectory: z.literal(".agents/skills"),
  artifactBaseUrl: origin,
  siteBaseUrl: origin,
  guideTemplateSha256: hash,
  archive: z.object({ bytes: z.number().int().positive().max(16 * 1024 * 1024), sha256: hash }).strict(),
  files: z.array(fileSchema).min(2).max(256),
};

function checkIdentity(identity, context) {
  if (serialize([...identity.skills].sort()) !== serialize([...skillNames].sort())) {
    context.addIssue({ code: "custom", path: ["skills"], message: "Both paired Skills are required" });
  }
  const paths = identity.files.map((file) => file.path);
  if (new Set(paths).size !== paths.length || serialize(paths) !== serialize([...paths].sort())) {
    context.addIssue({ code: "custom", path: ["files"], message: "Skill file paths must be unique and sorted" });
  }
  for (const name of skillNames) {
    if (!paths.includes(`${name}/SKILL.md`)) context.addIssue({ code: "custom", path: ["files"], message: `Missing ${name}/SKILL.md` });
  }
  if (paths.some((value) => !skillNames.includes(value.split("/")[0]))) {
    context.addIssue({ code: "custom", path: ["files"], message: "Skill files must stay inside the paired directories" });
  }
  if (identity.files.reduce((total, file) => total + file.bytes, 0) > 32 * 1024 * 1024) {
    context.addIssue({ code: "custom", path: ["files"], message: "Skill files exceed the 32 MiB extraction budget" });
  }
}
export const skillIdentitySchema = z.object(identityShape).strict().superRefine(checkIdentity);

export function skillIdentity(manifest) {
  return skillIdentitySchema.parse({
    schemaVersion: manifest.schemaVersion, skills: manifest.skills,
    defaultProjectDirectory: manifest.defaultProjectDirectory, artifactBaseUrl: manifest.artifactBaseUrl,
    siteBaseUrl: manifest.siteBaseUrl, guideTemplateSha256: manifest.guideTemplateSha256,
    archive: { bytes: manifest.archive.bytes, sha256: manifest.archive.sha256 }, files: manifest.files,
  });
}
export const skillVersion = (identity) => sha256(serialize(skillIdentitySchema.parse(identity)));

export function skillReferenceMap(identity, version) {
  const base = `${identity.artifactBaseUrl}/skills/releases/${version}`;
  return identity.files.map((file) => {
    const [name, ...parts] = file.path.split("/");
    return { name, reference: parts.join("/"), bytes: file.bytes, sha256: file.sha256,
      url: artifactFileUrl(base, `sources/${file.path}`) };
  });
}

export const skillReleaseSchema = z.object({
  ...identityShape,
  skillVersion: hash,
  archive: z.object({ bytes: z.number().int().positive().max(16 * 1024 * 1024), sha256: hash, url: z.string().url() }).strict(),
  installationGuideUrl: z.string().url(),
  latestManifestUrl: z.string().url(),
  references: z.array(z.object({ name: skillName, reference: relative,
    bytes: z.number().int().nonnegative(), sha256: hash, url: z.string().url() }).strict()),
}).strict().superRefine((manifest, context) => {
  // A field refinement failure must remain a validation result, not an exception.
  const parsed = skillIdentitySchema.safeParse({ ...Object.fromEntries(Object.keys(identityShape).map((key) => [key, manifest[key]])),
    archive: { bytes: manifest.archive.bytes, sha256: manifest.archive.sha256 } });
  if (!parsed.success) {
    for (const issue of parsed.error.issues) context.addIssue(issue);
    return;
  }
  const identity = parsed.data;
  const version = skillVersion(identity);
  const base = `${identity.artifactBaseUrl}/skills/releases/${version}`;
  if (manifest.skillVersion !== version) context.addIssue({ code: "custom", path: ["skillVersion"], message: "Skill version differs from its canonical identity" });
  if (manifest.archive.url !== `${base}/zeron-skills.zip` || manifest.installationGuideUrl !== `${base}/install.md`
    || manifest.latestManifestUrl !== `${identity.siteBaseUrl}/skills/manifest.json`) {
    context.addIssue({ code: "custom", message: "Skill release URLs must match the fixed identity and configured origins" });
  }
  if (serialize(manifest.references) !== serialize(skillReferenceMap(identity, version))) {
    context.addIssue({ code: "custom", path: ["references"], message: "Skill references must exactly cover the verified archive file list" });
  }
});

/** Includes every static release instruction, before filling version-derived URLs. */
export function skillGuideTemplate(template, mode) {
  if (!["release", "development"].includes(mode)) throw new Error("Unknown Skill guide mode");
  const release = mode === "release";
  const fields = {
    versionLabel: release ? "Skill release identity (SHA-256)" : "Bundle version (SHA-256)",
    latestManifestUrl: release ? "{{siteBaseUrl}}/skills/manifest.json" : "/skills/manifest.json",
    resourceInstructions: release ? `Configured artifact origin: \`{{artifactBaseUrl}}\`.
The pinned manifest and its archive URL are absolute HTTPS URLs on this origin.
Accept downloads and redirects only on this configured origin; the guide may be
displayed on the documentation site or served directly by the artifact store.
Reject credentials, query strings, fragments or a different origin in resource
URLs. Require manifest schemaVersion 2 and this guide's exact skillVersion.
The skillVersion identifies the release; it is not the ZIP hash. Verify the ZIP
against archive.sha256, not skillVersion.

To recompute skillVersion, select schemaVersion, skills, defaultProjectDirectory,
artifactBaseUrl, siteBaseUrl, guideTemplateSha256, files and archive from the
manifest; within archive retain only bytes and sha256. Recursively sort object
keys, preserve array order, serialize as JSON with two-space indentation and one
trailing LF, then hash its UTF-8 bytes with SHA-256. The files array must be
unique and sorted by raw path. Exclude derived URLs, references and skillVersion.
Fetch the exact pinned manifest before downloading its archive.`
      : "Resolve these root-relative URLs against the origin of this guide. Fetch the\npinned manifest first, then download its `archive.url` from that same origin.",
    versionRetentionInstructions: release ? "Use schema 2's skillVersion for the release identity and archive.sha256 for ZIP verification.\nA site rollback does not replace fixed artifact URLs. If a pinned resource cannot\nbe verified, stop and report it; never mix files from another version. The update\nlink intentionally targets the configured documentation site, not the artifact origin."
      : "If a pinned release\nis no longer available after a site deployment, refetch this guide and restart\nverification from its new pinned manifest; never mix files from two versions.",
  };
  let result = template;
  for (const [key, value] of Object.entries(fields)) result = result.replaceAll(`{{${key}}}`, () => value);
  return result;
}

export function renderSkillGuide(template, { version, manifestPath, artifactBaseUrl, siteBaseUrl }) {
  const release = artifactBaseUrl !== undefined;
  hash.parse(version);
  const expected = release ? `${artifactOrigin(artifactBaseUrl)}/skills/releases/${version}/manifest.json` : `/skills/releases/${version}/manifest.json`;
  if (manifestPath !== expected) throw new Error("Installation guide must pin its exact release manifest");
  const fields = { version, manifestPath, ...(release ? { artifactBaseUrl: artifactOrigin(artifactBaseUrl), siteBaseUrl: artifactOrigin(siteBaseUrl) } : {}) };
  let result = skillGuideTemplate(template, release ? "release" : "development");
  for (const [key, value] of Object.entries(fields)) result = result.replaceAll(`{{${key}}}`, () => value);
  if (/\{\{[^}]+\}\}/.test(result)) throw new Error("Unresolved Skill installation guide template field");
  return result;
}
