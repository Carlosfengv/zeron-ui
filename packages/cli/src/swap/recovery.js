import { lstat, mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash, readProjectFile, relativePath } from "./project.js";

async function readOptional(cwd, file) {
  try { return await readProjectFile(cwd, file); }
  catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

async function safeTarget(cwd, file) {
  if (!relativePath(file) || file === ".") throw new Error(`Invalid recovery path: ${file}`);
  const root = await realpath(cwd);
  const target = path.join(root, file);
  for (let candidate = target; candidate !== root; candidate = path.dirname(candidate)) {
    try { if ((await lstat(candidate)).isSymbolicLink()) throw new Error(`Recovery cannot write through symlinks: ${file}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  let ancestor = path.dirname(target);
  for (;;) {
    try {
      const resolved = await realpath(ancestor);
      const relative = path.relative(root, resolved);
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Recovery path escapes application: ${file}`);
      break;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      ancestor = path.dirname(ancestor);
    }
  }
  return target;
}

/** Explicit file snapshots for agent/harness use; no automatic apply CLI. */
export async function captureBatch(cwd, files, snapshotDirectory) {
  const root = await realpath(cwd);
  const directory = path.resolve(snapshotDirectory);
  await mkdir(path.dirname(directory), { recursive: true });
  const parent = await realpath(path.dirname(directory));
  const relative = path.relative(root, parent);
  if (relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))) throw new Error("Recovery snapshots must be outside the application");
  const entries = [];
  for (const file of [...new Set(files)]) {
    await safeTarget(cwd, file);
    const content = await readOptional(cwd, file);
    entries.push({ path: file, before: content === null ? null : hash(content), content: content?.toString("base64") ?? null, after: null });
  }
  await mkdir(directory); // Never replace an earlier snapshot.
  await writeFile(path.join(directory, "snapshot.json"), JSON.stringify({ version: 1, root, sealed: false, files: entries }, null, 2), { mode: 0o600 });
  return directory;
}

export async function sealBatch(cwd, directory) {
  const file = path.join(directory, "snapshot.json");
  const snapshot = JSON.parse(await readFile(file, "utf8"));
  if (snapshot.root !== await realpath(cwd) || snapshot.version !== 1 || snapshot.sealed) throw new Error("Cannot seal this recovery snapshot");
  for (const entry of snapshot.files) {
    const content = await readOptional(cwd, entry.path);
    entry.after = content === null ? null : hash(content);
  }
  snapshot.sealed = true;
  await writeFile(file, JSON.stringify(snapshot, null, 2), { mode: 0o600 });
  return snapshot.files.map(({ path, before, after }) => ({ path, before, after }));
}

export async function restoreBatch(cwd, directory) {
  const snapshot = JSON.parse(await readFile(path.join(directory, "snapshot.json"), "utf8"));
  if (snapshot.version !== 1 || !snapshot.sealed || snapshot.root !== await realpath(cwd)) throw new Error("Expected a sealed snapshot for this application");
  // Preflight the entire batch. Any concurrent user edit prevents restoration.
  for (const entry of snapshot.files) {
    await safeTarget(cwd, entry.path);
    const current = await readOptional(cwd, entry.path);
    if ((current === null ? null : hash(current)) !== entry.after) throw new Error(`Recovery conflict; preserve current edits: ${entry.path}`);
    if ((entry.content === null ? null : hash(Buffer.from(entry.content, "base64"))) !== entry.before) throw new Error(`Damaged recovery content: ${entry.path}`);
  }
  for (const entry of snapshot.files) {
    const target = await safeTarget(cwd, entry.path);
    // Recheck before each write; restoration is not a filesystem transaction.
    const current = await readOptional(cwd, entry.path);
    if ((current === null ? null : hash(current)) !== entry.after) throw new Error(`Recovery conflict: ${entry.path}`);
    if (entry.content === null) await rm(target, { force: true });
    else { await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, Buffer.from(entry.content, "base64")); }
  }
}
