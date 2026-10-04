import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { zipSync } from "fflate";
import { bundleMigrationSkills } from "./package-migration-skills.mjs";
import { sha256 } from "./agent-utils.mjs";
import { readSkillTexts } from "./skill-text-references.mjs";

export async function buildSkillArchive() {
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-skills-"));
  try {
    const bundle = path.join(temporary, "bundle");
    await bundleMigrationSkills(bundle);
    const files = [];
    const archiveFiles = {};
    const sourceFiles = new Map();
    async function collect(directory, prefix = "") {
      for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name < b.name ? -1 : 1)) {
        const relative = prefix + entry.name;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) await collect(absolute, `${relative}/`);
        else {
          if (!entry.isFile()) throw new Error(`Skill archives require regular files: ${relative}`);
          const content = await readFile(absolute);
          sourceFiles.set(relative, content);
          files.push({ path: relative, bytes: content.length, sha256: sha256(content) });
          // ZIP stores a local calendar time; keep it constant across timezones.
          archiveFiles[relative] = [content, { mtime: new Date(2020, 0, 1) }];
        }
      }
    }
    await collect(bundle);
    await readSkillTexts(files, relative => sourceFiles.get(relative));
    return { archive: zipSync(archiveFiles, { level: 9 }), files, sourceFiles };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}
