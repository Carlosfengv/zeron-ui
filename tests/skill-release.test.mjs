import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { zipSync, unzipSync } from "fflate";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { buildSkillArchive, buildSkillDistribution } from "../scripts/build-skill-distribution.mjs";
import { assembleSkillRelease, buildSkillRelease, verifySkillRelease } from "../scripts/create-skill-release.mjs";
import { skillGuideTemplate, skillIdentity, skillReleaseSchema, skillVersion } from "../scripts/skill-release.mjs";
import { verifyArtifactDirectory } from "../scripts/agent-artifacts.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const origins = { artifactBaseUrl: "https://artifacts.example.invalid", siteBaseUrl: "https://docs.example.invalid" };
let parent;
let bundle;
let template;
let first;
beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-skill-release-test-"));
  bundle = await buildSkillArchive();
  template = await readFile(path.join(root, "docs/skills/install.md"), "utf8");
  first = assembleSkillRelease({ ...bundle, template, ...origins });
});
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

describe("schema 2 Skill identity", () => {
  it("keeps the ZIP hash distinct from the full release identity", () => {
    expect(first.release.archive.sha256).toBe(sha256(bundle.archive));
    expect(first.release.skillVersion).not.toBe(first.release.archive.sha256);
    expect(skillVersion(skillIdentity(first.release))).toBe(first.release.skillVersion);
    expect(first.release.guideTemplateSha256).toBe(sha256(skillGuideTemplate(template, "release")));
    expect(assembleSkillRelease({ ...bundle, template, ...origins })).toEqual(first);
  });

  it("changes identity for template, resource origin or update-site changes without changing ZIP bytes", () => {
    for (const overrides of [{ template: `${template}\nAdditional installation guidance.\n` },
      { artifactBaseUrl: "https://other.example.invalid" }, { siteBaseUrl: "https://other-docs.example.invalid" }]) {
      const changed = assembleSkillRelease({ ...bundle, template, ...origins, ...overrides }).release;
      expect(changed.skillVersion).not.toBe(first.release.skillVersion);
      expect(changed.archive.sha256).toBe(first.release.archive.sha256);
    }
  });

  it("keeps ZIP bytes identical across different process timezones", async () => {
    const execute = promisify(execFile);
    const script = 'import {buildSkillArchive} from "./scripts/skill-archive.mjs"; import {sha256} from "./scripts/agent-utils.mjs"; console.log(sha256((await buildSkillArchive()).archive));';
    for (const TZ of ["UTC", "Asia/Shanghai", "America/Los_Angeles"]) {
      const result = await execute(process.execPath, ["--input-type=module", "-e", script], { cwd: root, env: { ...process.env, TZ } });
      expect(result.stdout.trim()).toBe(first.release.archive.sha256);
    }
  }, 10000);

  it("rejects identity changes, crossed versions, foreign URLs and incomplete reference maps", () => {
    const release = first.release;
    for (const change of [{ skillVersion: "0".repeat(64) }, { guideTemplateSha256: "0".repeat(64) },
      { archive: { ...release.archive, url: "https://foreign.invalid/archive.zip" } },
      { installationGuideUrl: `${origins.artifactBaseUrl}/skills/releases/${"0".repeat(64)}/install.md` },
      { latestManifestUrl: `${origins.artifactBaseUrl}/skills/manifest.json` },
      { references: release.references.slice(1) },
      { references: [{ ...release.references[0], url: "https://foreign.invalid/SKILL.md" }, ...release.references.slice(1)] },
    ]) expect(skillReleaseSchema.safeParse({ ...release, ...change }).success).toBe(false);
  });

  it("rejects duplicate or escaping files, unsorted sets and missing paired entrypoints", () => {
    const release = first.release;
    for (const files of [[...release.files, release.files[0]], [...release.files].reverse(),
      release.files.filter((file) => file.path !== "zeron-page-builder/SKILL.md"),
      [{ ...release.files[0], path: "swap-to-zeronui/../outside.md" }, ...release.files.slice(1)],
      [{ ...release.files[0], path: "another-skill/SKILL.md" }, ...release.files.slice(1)],
    ]) expect(skillReleaseSchema.safeParse({ ...release, files }).success).toBe(false);
  });

  it("renders fixed-origin instructions and absolute update links with no unresolved placeholders", () => {
    expect(first.guide).toContain(`Configured artifact origin: \`${origins.artifactBaseUrl}\``);
    expect(first.guide).toContain(`(${origins.siteBaseUrl}/skills/manifest.json)`);
    expect(first.guide).toContain(`(${origins.artifactBaseUrl}/skills/releases/${first.release.skillVersion}/manifest.json)`);
    expect(first.guide).toContain("Accept downloads and redirects only on this configured origin");
    expect(first.guide).toContain("against archive.sha256, not skillVersion");
    expect(first.guide).not.toContain("Resolve these root-relative URLs");
    expect(first.guide).not.toContain("{{");
    expect(() => assembleSkillRelease({ ...bundle, template: `${template}\n{{missingField}}`, ...origins })).toThrow(/Unresolved/);
  });
});

describe("isolated Skill candidate", () => {
  it("builds and retries all resources without changing the legacy distribution", async () => {
    const legacyOutput = path.join(parent, "legacy");
    const legacy = await buildSkillDistribution(legacyOutput);
    const before = await Promise.all(["manifest.json", "zeron-skills.zip", "install.md"].map((name) => readFile(path.join(legacyOutput, name))));
    const options = { ...origins, outputBase: path.join(parent, "candidates") };
    const built = await buildSkillRelease(options);
    expect(built.scope).toBe("local-candidate-not-uploaded");
    expect(built.release).toEqual(first.release);
    expect(built.release.archive.sha256).toBe(legacy.version);
    expect(built.manifest.provenance).toBeUndefined();
    const sourceRecord = JSON.parse(await readFile(built.provenanceFile, "utf8"));
    expect(sourceRecord).toMatchObject({ kind: "skill", releaseId: built.release.skillVersion,
      manifestSha256: built.manifestSha256, provenance: built.provenance });
    expect(path.dirname(built.provenanceFile)).not.toBe(built.directory);
    const verified = await verifyArtifactDirectory(built.directory, built.manifest);
    expect(verified.manifestSha256).toBe(built.manifestSha256);
    expect(await verifySkillRelease(built.directory, built.release)).toEqual(built.release);
    expect((await buildSkillRelease(options)).manifestSha256).toBe(built.manifestSha256);
    const after = await Promise.all(["manifest.json", "zeron-skills.zip", "install.md"].map((name) => readFile(path.join(legacyOutput, name))));
    expect(after).toEqual(before);
    expect(built.manifest.files.map((file) => file.path)).toEqual(["install.md", "manifest.json",
      ...built.release.files.map((file) => `sources/${file.path}`), "zeron-skills.zip"]);
  }, 20000);

  it("detects modified source references and archives before accepting a candidate", async () => {
    const built = await buildSkillRelease({ ...origins, outputBase: path.join(parent, "tamper") });
    const file = built.release.files[0];
    const filename = path.join(built.directory, "sources", file.path);
    const original = await readFile(filename);
    await writeFile(filename, "changed");
    await expect(verifySkillRelease(built.directory, built.release)).rejects.toThrow(/reference mismatch/);
    await writeFile(filename, original);
    await writeFile(path.join(built.directory, "zeron-skills.zip"), "not a ZIP");
    await expect(verifySkillRelease(built.directory, built.release)).rejects.toThrow(/ZIP hash\/size/);
  }, 20000);

  it("rejects a ZIP with extra files even when its archive hash is internally consistent", async () => {
    const dir = path.join(parent, "extra-zip");
    await mkdir(dir);
    const entries = unzipSync(bundle.archive);
    entries["swap-to-zeronui/extra.md"] = new TextEncoder().encode("extra");
    const archive = zipSync(entries);
    const forged = assembleSkillRelease({ ...bundle, archive, template, ...origins }).release;
    await writeFile(path.join(dir, "zeron-skills.zip"), archive);
    await writeFile(path.join(dir, "manifest.json"), serialize(forged));
    await expect(verifySkillRelease(dir, forged)).rejects.toThrow(/file list/);
  });

  it("rejects in-repository public/source output paths", async () => {
    for (const outputBase of [root, path.join(root, "public/skills"), path.join(root, ".agents/skills")]) {
      await expect(buildSkillRelease({ ...origins, outputBase })).rejects.toThrow(/isolated/);
    }
  });
});
