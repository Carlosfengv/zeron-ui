/** Create an immutable Registry snapshot without leaving mutable output changed. */

import { cp, mkdir, mkdtemp, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const releaseFlag = process.argv.indexOf("--release-id");
const releaseId = releaseFlag === -1 ? null : process.argv[releaseFlag + 1];
if (!releaseId || !/^[a-z0-9][a-z0-9._-]*$/.test(releaseId)) {
  throw new Error("Usage: pnpm registry:release --release-id <lowercase-id>");
}

const outputRoot = join(ROOT, "public/r");
const releasesRoot = join(outputRoot, "releases");
const releaseDir = join(releasesRoot, releaseId);
const releaseBase = `https://zeron-ui.vercel.app/r/releases/${releaseId}`;
const lockDir = join(outputRoot, ".release-lock");

async function flatArtifacts(directory) {
  return (await readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name);
}

await mkdir(releasesRoot, { recursive: true });
// Reserve the immutable name before running a build. A duplicate release must
// never alter mutable artifacts or an existing snapshot.
await mkdir(releaseDir);
let locked = false;
let backup;
let staging;
let buildStarted = false;
let restored = false;
let published = false;
let hash;
try {
  await mkdir(lockDir);
  locked = true;
  backup = await mkdtemp(join(tmpdir(), "zeron-registry-backup-"));
  const previous = await flatArtifacts(outputRoot);
  for (const name of previous) await cp(join(outputRoot, name), join(backup, name));
  staging = await mkdtemp(join(releasesRoot, ".staging-"));
  try {
    buildStarted = true;
    execFileSync("pnpm", ["registry:build"], {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, ZERON_REGISTRY_BASE_URL: releaseBase },
    });
    for (const name of await flatArtifacts(outputRoot)) await cp(join(outputRoot, name), join(staging, name));
    const registry = await readFile(join(staging, "registry.json"));
    hash = createHash("sha256").update(registry).digest("hex");
    await writeFile(join(staging, "release.json"), `${JSON.stringify({ releaseId, registryBase: releaseBase, registrySha256: hash }, null, 2)}\n`);
  } finally {
    // Restore exact bytes, including files removed by a failed build. Running
    // another build here could fail again and strand release-scoped URLs.
    for (const name of await flatArtifacts(outputRoot)) await rm(join(outputRoot, name));
    for (const name of previous) await cp(join(backup, name), join(outputRoot, name));
    restored = true;
  }
  // The destination is our own empty reservation; no partial release is ever
  // published, and another invocation cannot claim the same release ID.
  await rename(staging, releaseDir);
  published = true;
} finally {
  if (!published) await rm(releaseDir, { recursive: true, force: true });
  if (staging) await rm(staging, { recursive: true, force: true });
  if (locked) await rm(lockDir, { recursive: true, force: true });
  if (backup && (!buildStarted || restored)) await rm(backup, { recursive: true, force: true });
  else if (backup) console.error(`Mutable Registry restoration failed. Original artifacts are preserved at ${backup}`);
}
console.log(`Created Registry release ${releaseId} (${hash})`);
