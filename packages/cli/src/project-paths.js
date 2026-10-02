import { lstat, realpath } from "node:fs/promises";
import path from "node:path";

function isWithin(root, target) {
  const relative = path.relative(root, target);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

/** Validate existing ancestors too: a lexical child may resolve outside cwd. */
export async function assertProjectPath(cwd, target) {
  const root = path.resolve(cwd);
  const absolute = path.resolve(target);
  if (!isWithin(root, absolute)) throw new Error(`Installation path escapes the project directory: ${target}`);
  const realRoot = await realpath(root);
  let current = root;
  for (const part of path.relative(root, absolute).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    try {
      const info = await lstat(current);
      if (info.isSymbolicLink()) {
        const resolved = await realpath(current).catch(() => null);
        if (!resolved || !isWithin(realRoot, resolved)) {
          throw new Error(`Installation path escapes the project directory through a symbolic link: ${current}`);
        }
      }
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
  }
  return absolute;
}
