import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";
import { bundleMigrationSkills, skillNames } from "./package-migration-skills.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Public assets are generated at build time, so no server function needs to
// trace the repository or expose arbitrary paths from it.
export async function buildSkillDistribution(output = path.join(root, "public/skills")) {
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-skills-"));
  try {
    const bundle = path.join(temporary, "bundle");
    await bundleMigrationSkills(bundle);
    const files = [];
    const archiveFiles = {};
    async function collect(directory, prefix = "") {
      for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : 1)) {
        const relative = prefix + entry.name;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) await collect(absolute, `${relative}/`);
        else {
          const content = await readFile(absolute);
          files.push({ path: relative, bytes: content.length, sha256: sha256(content) });
          // Fixed local date produces stable ZIP bytes across builds/timezones.
          archiveFiles[relative] = [content, { mtime: new Date(2020, 0, 1) }];
        }
      }
    }
    await collect(bundle);
    const archive = zipSync(archiveFiles, { level: 9 });
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
    const guide = (await readFile(path.join(root, "docs/skills/install.md"), "utf8"))
      .replaceAll("{{manifestPath}}", `${release}/manifest.json`)
      .replaceAll("{{version}}", version);
    await writeFile(path.join(output, "install.md"), guide);
    return manifest;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await buildSkillDistribution();
  console.log(`Built Zeron skill distribution: ${manifest.files.length} files, ${manifest.archive.bytes} bytes (${manifest.version.slice(0, 12)})`);
}
