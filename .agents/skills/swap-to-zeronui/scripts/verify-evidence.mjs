import { createHash } from "node:crypto";
import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function relativeFile(value) {
  return typeof value === "string" && value !== "." && value.length > 0
    && !value.includes("\\") && !path.posix.isAbsolute(value) && !/^[a-z]:/i.test(value)
    && value === path.posix.normalize(value) && !value.split("/").includes("..");
}

async function localFile(root, file) {
  if (!relativeFile(file)) throw new Error(`Expected normalized project-relative file: ${file}`);
  const target = await realpath(path.join(root, file));
  const relative = path.relative(root, target);
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`File escapes application root: ${file}`);
  }
  if (!(await stat(target)).isFile()) throw new Error(`Not a regular file: ${file}`);
  return target;
}

/** Verifies listed bytes only; omissions, freshness and semantic truth need separate review. */
export async function verifyEvidenceIndex(cwd, indexPath) {
  const diagnostics = [];
  let checked = 0;
  try {
    const root = await realpath(cwd);
    const indexFile = await localFile(root, indexPath);
    const index = JSON.parse(await readFile(indexFile, "utf8"));
    if (index?.formatVersion !== 1 || !Array.isArray(index.files) || !index.files.length) {
      throw new Error("Expected formatVersion: 1 and a nonempty files array");
    }
    const seen = new Set();
    for (const entry of index.files) {
      try {
        if (!entry || !relativeFile(entry.path) || typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
          throw new Error("Expected a project-relative path and lowercase SHA-256");
        }
        const target = await localFile(root, entry.path);
        if (target === indexFile) throw new Error("Index cannot include itself");
        if (seen.has(target)) throw new Error("Duplicate evidence file");
        seen.add(target);
        const actual = createHash("sha256").update(await readFile(target)).digest("hex");
        if (actual !== entry.sha256) throw new Error("Evidence hash mismatch");
        checked += 1;
      } catch (error) {
        diagnostics.push({ path: entry?.path ?? null, detail: error.message });
      }
    }
  } catch (error) {
    diagnostics.push({ path: indexPath, detail: error.message });
  }
  return { status: diagnostics.length ? "failed" : "passed", checked, diagnostics };
}

if (process.argv[1] && await realpath(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length !== 4 || args[0] !== "--cwd" || args[2] !== "--index") {
    process.stderr.write("Usage: node verify-evidence.mjs --cwd <app> --index <project-relative-index.json>\n");
    process.exitCode = 1;
  } else {
    const result = await verifyEvidenceIndex(args[1], args[3]);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    process.exitCode = result.status === "passed" ? 0 : 1;
  }
}
