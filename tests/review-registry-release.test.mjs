import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, chmod, copyFile, mkdir, mkdtemp, readFile, readdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { onTestFinished, test } from "vitest";

// Real candidate orchestration and atomic byte verification; explicit build adapters, no uploads.
async function fixture(mode = "success") {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), "zeron-release-test-")));
  onTestFinished(() => rm(root, { recursive: true, force: true }));
  for (const directory of ["scripts", "bin", "public/r/releases", "packages/registry/scripts", "output"]) {
    await mkdir(path.join(root, directory), { recursive: true });
  }
  for (const name of ["create-registry-release.mjs", "agent-artifacts.mjs", "agent-utils.mjs"]) {
    await copyFile(new URL(`../scripts/${name}`, import.meta.url), path.join(root, "scripts", name));
  }
  await symlink(fileURLToPath(new URL("../node_modules", import.meta.url)), path.join(root, "node_modules"));
  await writeFile(path.join(root, ".gitignore"), "node_modules\noutput/\n");
  await writeFile(path.join(root, "pnpm-lock.yaml"), "fixture lockfile\n");
  await writeFile(path.join(root, "packages/registry/registry.composed.json"), "legacy composed input\n");
  const mutable = '{"dependency":"https://zeron-ui.vercel.app/r/dep.json"}\n';
  await writeFile(path.join(root, "public/r/registry.json"), mutable);
  await writeFile(path.join(root, "public/r/previous.json"), "previous artifact\n");
  await writeFile(path.join(root, "packages/registry/scripts/compose-registry.mjs"), `
import {writeFile} from 'node:fs/promises';
export async function composeRegistry(output) {
  const source = {items: [{name:'dep'}, {name:'button'}]};
  await writeFile(output, JSON.stringify(source)); return source;
}
`);
  await writeFile(path.join(root, "packages/registry/scripts/postbuild.mjs"), `
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
export async function processRegistry(directory, baseUrl) {
  for (const name of ['registry','dep','button']) {
    const filename=path.join(directory,name+'.json');
    const item=JSON.parse(await readFile(filename,'utf8'));
    const items=name==='registry'?item.items:[item];
    for(const value of items) if(value.name==='button') value.registryDependencies=[baseUrl+'/dep.json'];
    await writeFile(filename,JSON.stringify(item)+'\\n');
  }
}
`);
  await writeFile(path.join(root, "packages/registry/scripts/registry-check.mjs"), "export const checkRegistry = () => [];\n");
  await writeFile(path.join(root, "bin/pnpm"), `#!/usr/bin/env node
const fs = require('node:fs'); const path = require('node:path');
const args = process.argv.slice(2);
if (!args.includes('build')) process.exit(0);
fs.appendFileSync('output/build-calls.txt', 'build\\n');
const directory=args[args.indexOf('-o')+1];
fs.mkdirSync(directory,{recursive:true});
fs.writeFileSync(path.join(directory,'registry.json'),JSON.stringify({items:[{name:'dep'},{name:'button'}]}));
for (const name of ['dep','button']) fs.writeFileSync(path.join(directory,name+'.json'),JSON.stringify({name}));
if (${JSON.stringify(mode)} === 'build-failure') process.exit(1);
if (${JSON.stringify(mode)} === 'copy-failure') fs.rmSync(path.join(directory,'registry.json'));
`);
  await chmod(path.join(root, "bin/pnpm"), 0o755);
  const git = (args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  };
  git(["init", "--quiet"]); git(["add", "."]);
  git(["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "commit", "--quiet", "-m", "fixture"]);
  const run = (releaseId, origin = "https://artifacts.example.invalid") => spawnSync(process.execPath,
    [path.join(root, "scripts/create-registry-release.mjs"), "--release-id", releaseId, "--artifact-base-url", origin], {
      env: { ...process.env, PATH: `${path.join(root, "bin")}${path.delimiter}${process.env.PATH}` }, encoding: "utf8", timeout: 10000,
    });
  return { root, mutable, run };
}

async function assertUnchanged({ root, mutable }) {
  assert.equal(await readFile(path.join(root, "public/r/registry.json"), "utf8"), mutable);
  assert.equal(await readFile(path.join(root, "public/r/previous.json"), "utf8"), "previous artifact\n");
  assert.equal(await readFile(path.join(root, "packages/registry/registry.composed.json"), "utf8"), "legacy composed input\n");
  assert.deepEqual(await readdir(path.join(root, "public/r/releases")), []);
  const output = path.join(root, "output/agent-releases/registry");
  assert.equal((await readdir(output)).some((name) => name.startsWith(".candidate-")), false);
}

test("conflicting release IDs preserve mutable output and the existing candidate", async () => {
  const data = await fixture();
  const initial = data.run("existing");
  assert.equal(initial.status, 0, initial.stderr);
  const directory = path.join(data.root, "output/agent-releases/registry/existing");
  const before = await readFile(path.join(directory, "manifest.json"));
  const result = data.run("existing", "https://different.example.invalid");
  assert.notEqual(result.status, 0); assert.match(result.stderr, /different bytes/);
  assert.deepEqual(await readFile(path.join(directory, "manifest.json")), before);
  await assertUnchanged(data);
});

for (const mode of ["build-failure", "copy-failure"]) {
  test(`release ${mode} preserves mutable bytes and removes incomplete output`, async () => {
    const data = await fixture(mode);
    assert.notEqual(data.run("candidate").status, 0);
    await assertUnchanged(data);
    await assert.rejects(access(path.join(data.root, "output/agent-releases/registry/candidate")), { code: "ENOENT" });
    assert.equal((await readFile(path.join(data.root, "output/build-calls.txt"), "utf8")).trim().split("\n").length, 1);
  });
}

test("successful release creates an isolated candidate and identical retries preserve its bytes", async () => {
  const data = await fixture();
  const result = data.run("candidate");
  assert.equal(result.status, 0, result.stderr);
  await assertUnchanged(data);
  const directory = path.join(data.root, "output/agent-releases/registry/candidate");
  const item = JSON.parse(await readFile(path.join(directory, "button.json"), "utf8"));
  assert.deepEqual(item.registryDependencies, ["https://artifacts.example.invalid/r/releases/candidate/dep.json"]);
  const before = await readFile(path.join(directory, "manifest.json"));
  const manifest = JSON.parse(before);
  assert.equal(manifest.releaseId, "candidate"); assert.equal(manifest.files.length, 3);
  for (const file of manifest.files) assert.match(file.sha256, /^[a-f0-9]{64}$/);
  assert.equal(data.run("candidate").status, 0);
  assert.deepEqual(await readFile(path.join(directory, "manifest.json")), before);
  await assertUnchanged(data);
});

test("an existing candidate lock prevents publication without altering the competing lock", async () => {
  const data = await fixture();
  const output = path.join(data.root, "output/agent-releases/registry");
  await mkdir(path.join(output, "candidate.lock"), { recursive: true });
  const result = data.run("candidate");
  assert.notEqual(result.status, 0); assert.match(result.stderr, /EEXIST/);
  await access(path.join(output, "candidate.lock"));
  await assert.rejects(access(path.join(output, "candidate")), { code: "ENOENT" });
  await assertUnchanged(data);
});
