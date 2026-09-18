import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { captureBatch, sealBatch, restoreBatch } from "../../src/swap/recovery.js";
import { fixture } from "./helpers.js";

async function recoveryDir(t) {
  const dir = await mkdtemp(path.join(tmpdir(), "zeron-recovery-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return path.join(dir, "batch");
}

test("restores only recorded files after partial installation, including absent files", async (t) => {
  const cwd = await fixture(t);
  const dir = await recoveryDir(t);
  const before = await readFile(path.join(cwd, "package.json"), "utf8");
  await captureBatch(cwd, ["package.json", "created.ts"], dir);
  await writeFile(path.join(cwd, "package.json"), "{}");
  await writeFile(path.join(cwd, "created.ts"), "export const created = true;");
  await writeFile(path.join(cwd, "user-notes.md"), "keep this");
  await sealBatch(cwd, dir);
  await restoreBatch(cwd, dir);
  assert.equal(await readFile(path.join(cwd, "package.json"), "utf8"), before);
  await assert.rejects(readFile(path.join(cwd, "created.ts")), { code: "ENOENT" });
  assert.equal(await readFile(path.join(cwd, "user-notes.md"), "utf8"), "keep this");
});

test("user edits after the batch prevent all restoration", async (t) => {
  const cwd = await fixture(t);
  const dir = await recoveryDir(t);
  await captureBatch(cwd, ["package.json", "app/page.tsx"], dir);
  await writeFile(path.join(cwd, "package.json"), "{}");
  await sealBatch(cwd, dir);
  await writeFile(path.join(cwd, "app/page.tsx"), "user changes");
  await assert.rejects(restoreBatch(cwd, dir), /Recovery conflict/);
  assert.equal(await readFile(path.join(cwd, "package.json"), "utf8"), "{}");
  await assert.rejects(sealBatch(cwd, dir), /Cannot seal/);
});

test("rejects in-project snapshots and unsealed restores", async (t) => {
  const cwd = await fixture(t);
  await assert.rejects(captureBatch(cwd, ["package.json"], path.join(cwd, "snapshot")), /outside/);
  const dir = await recoveryDir(t);
  await captureBatch(cwd, ["package.json"], dir);
  await assert.rejects(restoreBatch(cwd, dir), /sealed/);
});
