/** Create an immutable local Registry snapshot from the current sources. */

import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const releaseFlag = process.argv.indexOf("--release-id");
const releaseId = releaseFlag === -1 ? null : process.argv[releaseFlag + 1];
if (!releaseId || !/^[a-z0-9][a-z0-9._-]*$/.test(releaseId)) {
  throw new Error("Usage: pnpm registry:release --release-id <lowercase-id>");
}

const outputRoot = join(ROOT, "public/r");
const releaseDir = join(outputRoot, "releases", releaseId);
const releaseBase = `https://zeron-ui.vercel.app/r/releases/${releaseId}`;
execFileSync("pnpm", ["registry:build"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, ZERON_REGISTRY_BASE_URL: releaseBase },
});

await mkdir(join(outputRoot, "releases"), { recursive: true });
await mkdir(releaseDir);
for (const entry of await readdir(outputRoot, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith(".json")) await cp(join(outputRoot, entry.name), join(releaseDir, entry.name));
}
const registry = await readFile(join(releaseDir, "registry.json"));
const hash = createHash("sha256").update(registry).digest("hex");
await writeFile(join(releaseDir, "release.json"), `${JSON.stringify({ releaseId, registryBase: releaseBase, registrySha256: hash }, null, 2)}\n`);
// Restore the mutable legacy endpoint after the snapshot has been copied. The
// snapshot itself keeps release-scoped dependency URLs and is never rewritten.
execFileSync("pnpm", ["registry:build"], { cwd: ROOT, stdio: "inherit", env: process.env });
console.log(`Created Registry release ${releaseId} (${hash})`);
