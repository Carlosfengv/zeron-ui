import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";

export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
export const serialize = (value) => `${JSON.stringify(canonical(value), null, 2)}\n`;
export async function readOwnedFile(root, relative) {
  const owner = await realpath(root);
  const target = await realpath(path.resolve(root, relative));
  const resolved = path.relative(owner, target);
  if (resolved.startsWith("..") || path.isAbsolute(resolved)) throw new Error(`File escapes allowed root: ${relative}`);
  return readFile(target);
}

/** Revision identifies the commit; the separate input hash identifies dirty sources. */
export async function sourceProvenance(root) {
  const git = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const inputs = [];
  for (const relative of [...new Set(git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean))].sort()) {
    const basename = path.basename(relative);
    if (basename === ".npmrc" || (basename.startsWith(".env") && !basename.endsWith(".example"))) continue;
    try {
      const bytes = await readOwnedFile(root, relative);
      inputs.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes) });
    } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return {
    sourceRevision: git(["rev-parse", "HEAD"]).trim(),
    sourceInputSha256: sha256(serialize(inputs)),
    lockfileSha256: sha256(await readOwnedFile(root, "pnpm-lock.yaml")),
    sourceClean: !git(["status", "--porcelain", "--untracked-files=all"]).trim(),
  };
}
