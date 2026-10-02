import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { onTestFinished, test } from "vitest";

async function fixture(mode = "success") {
  const root = await mkdtemp(path.join(tmpdir(), "zeron-release-test-"));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  for (const directory of ["scripts", "bin", "public/r/releases"]) await mkdir(path.join(root, directory), { recursive: true });
  await copyFile(new URL("../scripts/create-registry-release.mjs", import.meta.url), path.join(root, "scripts/create-registry-release.mjs"));
  const mutable = '{"dependency":"https://zeron-ui.vercel.app/r/dep.json"}\n';
  await writeFile(path.join(root, "public/r/registry.json"), mutable);
  await writeFile(path.join(root, "public/r/previous.json"), "previous artifact\n");
  await writeFile(path.join(root, "bin/pnpm"), `#!/usr/bin/env node
const fs = require("node:fs");
const base = process.env.ZERON_REGISTRY_BASE_URL;
fs.appendFileSync("build-calls.txt", base + "\\n");
fs.rmSync("public/r/previous.json");
fs.writeFileSync("public/r/new.json", "new artifact\\n");
fs.writeFileSync("public/r/registry.json", JSON.stringify({ dependency: base + "/dep.json" }));
if (${JSON.stringify(mode)} === "build-failure") process.exit(1);
if (${JSON.stringify(mode)} === "copy-failure") fs.rmSync("public/r/registry.json");
`);
  await chmod(path.join(root, "bin/pnpm"), 0o755);
  const run = (releaseId) => spawnSync(process.execPath, [path.join(root, "scripts/create-registry-release.mjs"), "--release-id", releaseId], {
    env: { ...process.env, PATH: `${path.join(root, "bin")}${path.delimiter}${process.env.PATH}` }, encoding: "utf8", timeout: 10000,
  });
  return { root, mutable, run };
}

async function assertRestored({ root, mutable }) {
  assert.equal(await readFile(path.join(root, "public/r/registry.json"), "utf8"), mutable);
  assert.equal(await readFile(path.join(root, "public/r/previous.json"), "utf8"), "previous artifact\n");
  await assert.rejects(access(path.join(root, "public/r/new.json")), { code: "ENOENT" });
  await assert.rejects(access(path.join(root, "public/r/.release-lock")), { code: "ENOENT" });
  assert.equal((await readdir(path.join(root, "public/r/releases"))).some((name) => name.startsWith(".staging-")), false);
}

test("duplicate release IDs fail before build and preserve both mutable and immutable output", async () => {
  const data = await fixture();
  const directory = path.join(data.root, "public/r/releases/existing");
  await mkdir(directory);
  await writeFile(path.join(directory, "registry.json"), "existing snapshot\n");
  const result = data.run("existing");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /EEXIST/);
  await assertRestored(data);
  await assert.rejects(access(path.join(data.root, "build-calls.txt")), { code: "ENOENT" });
  assert.equal(await readFile(path.join(directory, "registry.json"), "utf8"), "existing snapshot\n");
});

for (const mode of ["build-failure", "copy-failure"]) {
  test(`release ${mode} restores exact mutable bytes and removes incomplete output`, async () => {
    const data = await fixture(mode);
    const result = data.run("candidate");
    assert.notEqual(result.status, 0);
    await assertRestored(data);
    await assert.rejects(access(path.join(data.root, "public/r/releases/candidate")), { code: "ENOENT" });
    assert.equal((await readFile(path.join(data.root, "build-calls.txt"), "utf8")).trim().split("\n").length, 1, "recovery must not depend on a second build succeeding");
  });
}

test("successful release publishes release-scoped content and restores mutable output", async () => {
  const data = await fixture();
  const result = data.run("candidate");
  assert.equal(result.status, 0, result.stderr);
  await assertRestored(data);
  const directory = path.join(data.root, "public/r/releases/candidate");
  assert.equal(JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")).dependency, "https://zeron-ui.vercel.app/r/releases/candidate/dep.json");
  const release = JSON.parse(await readFile(path.join(directory, "release.json"), "utf8"));
  assert.equal(release.releaseId, "candidate");
  assert.match(release.registrySha256, /^[a-f0-9]{64}$/);
});

test("an existing release lock stops a competing release before build", async () => {
  const data = await fixture();
  await mkdir(path.join(data.root, "public/r/.release-lock"));
  const result = data.run("candidate");
  assert.notEqual(result.status, 0);
  await access(path.join(data.root, "public/r/.release-lock"));
  await assert.rejects(access(path.join(data.root, "build-calls.txt")), { code: "ENOENT" });
  await assert.rejects(access(path.join(data.root, "public/r/releases/candidate")), { code: "ENOENT" });
  assert.equal(await readFile(path.join(data.root, "public/r/registry.json"), "utf8"), data.mutable);
});
