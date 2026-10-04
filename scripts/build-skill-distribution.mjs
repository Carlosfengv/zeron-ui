import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { skillNames } from "./package-migration-skills.mjs";
import { renderSkillGuide } from "./skill-release.mjs";
import { sha256 } from "./agent-utils.mjs";
import { buildSkillArchive } from "./skill-archive.mjs";
export { buildSkillArchive } from "./skill-archive.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

// Public assets are generated at build time, so no server function needs to
// trace the repository or expose arbitrary paths from it.
export async function buildSkillDistribution(output = path.join(root, "public/skills")) {
    const { archive, files } = await buildSkillArchive();
    const archiveHash = sha256(archive);
    const version = archiveHash;
    const release = `/skills/releases/${version}`;
    const manifest = {
      schemaVersion: 1,
      version,
      skills: skillNames,
      defaultProjectDirectory: ".agents/skills",
      archive: { url: `${release}/zeron-skills.zip`, bytes: archive.length, sha256: archiveHash },
      files,
    };
    const releaseDirectory = path.join(output, "releases", version);
    await mkdir(releaseDirectory, { recursive: true });
    const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;
    await writeFile(path.join(releaseDirectory, "zeron-skills.zip"), archive);
    await writeFile(path.join(releaseDirectory, "manifest.json"), manifestText);
    await writeFile(path.join(output, "zeron-skills.zip"), archive);
    await writeFile(path.join(output, "manifest.json"), manifestText);
    const guide = renderSkillGuide(await readFile(path.join(root, "docs/skills/install.md"), "utf8"), {
      manifestPath: `${release}/manifest.json`, version,
    });
    await writeFile(path.join(output, "install.md"), guide);
    return manifest;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (!args.length || (args.length === 2 && args[0] === "--mode" && args[1] === "development")) {
    const manifest = await buildSkillDistribution();
    console.log(`Built Zeron skill distribution: ${manifest.files.length} files, ${manifest.archive.bytes} bytes (${manifest.version.slice(0, 12)})`);
  } else {
    const options = {};
    let mode;
    for (let index = 0; index < args.length; index++) {
      const key = args[index];
      if (key === "--require-clean" && !options.requireClean) options.requireClean = true;
      else if (["--mode", "--artifact-base-url", "--site-base-url", "--output"].includes(key) && args[index + 1] && !args[index + 1].startsWith("--")) {
        const field = { "--mode": "mode", "--artifact-base-url": "artifactBaseUrl", "--site-base-url": "siteBaseUrl", "--output": "outputBase" }[key];
        if (field === "mode") { if (mode) throw new Error("Duplicate mode"); mode = args[++index]; }
        else { if (options[field]) throw new Error(`Duplicate option: ${key}`); options[field] = args[++index]; }
      } else throw new Error("Usage: skills:build --mode release --artifact-base-url <https-origin> --site-base-url <https-origin> [--output <isolated-dir>] [--require-clean]");
    }
    if (mode !== "release") throw new Error("Explicit Skill candidate mode must be release");
    options.artifactBaseUrl ??= process.env.ARTIFACT_BASE_URL;
    options.siteBaseUrl ??= process.env.SITE_BASE_URL;
    const { buildSkillRelease } = await import("./create-skill-release.mjs");
    const result = await buildSkillRelease(options);
    console.log(`Skill candidate ${result.release.skillVersion}: ${result.release.files.length} source files; artifacts ${result.manifestSha256}`);
    console.log(`Scope: ${result.scope}; sourceClean: ${result.provenance.sourceClean}; output: ${result.directory}`);
    console.log(`Source binding: ${result.provenanceFile}`);
  }
}
