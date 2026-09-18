import { cp, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
export const skillNames = ["zeron-page-builder", "swap-to-zeronui"];

export async function bundleMigrationSkills(output) {
  try { await stat(output); throw new Error(`Output already exists: ${output}`); }
  catch (error) { if (error.code !== "ENOENT") throw error; }

  const sources = path.join(root, ".agents/skills");
  const canonical = await readFile(path.join(root, "packages/cli/src/swap/migration-plan.schema.json"), "utf8");
  if (canonical !== await readFile(path.join(sources, "swap-to-zeronui/assets/migration-plan.schema.json"), "utf8")) throw new Error("Skill schema differs from CLI schema; synchronize the asset first.");
  async function validateLinks(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Skill bundles cannot contain symlinks: ${file}`);
      if (entry.isDirectory()) await validateLinks(file);
      else if (entry.name.endsWith(".md")) {
        const content = await readFile(file, "utf8");
        for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
          const link = match[1].split("#")[0];
          if (!link || /^[a-z]+:/i.test(link)) continue;
          const target = path.resolve(path.dirname(file), link);
          if (path.relative(output, target).startsWith("..")) throw new Error(`Link escapes bundle: ${file}: ${link}`);
          await stat(target);
        }
      }
    }
  }
  await mkdir(output, { recursive: true });
  for (const name of skillNames) await cp(path.join(sources, name), path.join(output, name), { recursive: true, errorOnExist: true, force: false });
  await validateLinks(output);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = process.argv.indexOf("--output");
  if (flag >= 0 && !process.argv[flag + 1]) throw new Error("--output needs a new directory");
  const output = path.resolve(flag < 0 ? path.join(root, "output/skills/zeron-migration") : process.argv[flag + 1]);
  await bundleMigrationSkills(output);
  console.log(`Bundled and validated both skills: ${output}`);
}
