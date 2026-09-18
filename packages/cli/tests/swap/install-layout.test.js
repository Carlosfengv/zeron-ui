import assert from "node:assert/strict";
import test from "node:test";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildInstallPlan } from "../../src/install-plan.js";
import { runCli } from "../../src/cli.js";
import { fixture } from "./helpers.js";

const item = { name: "button", files: [{ path: "button.tsx", target: "components/ui/button.tsx", content: "export const Button = null;", type: "registry:ui" }] };
const fetchImpl = async () => ({ ok: true, json: async () => item });
async function configure(cwd) {
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({ aliases: { ui: "@/components/ui", components: "@/components", lib: "@/lib", hooks: "@/hooks" } }));
}

test("plans src aliases using actual TypeScript path configuration", async (t) => {
  const cwd = await fixture(t);
  await configure(cwd);
  const plan = await buildInstallPlan({ cwd, names: ["button"], baseUrl: "https://example.test/r", fetchImpl });
  assert.equal(plan.files[0].targetPath, path.join(cwd, "src/components/ui/button.tsx"));
});

test("rejects installer/alias disagreement before invoking the installer", async (t) => {
  const cwd = await fixture(t, { "tsconfig.json": '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["./*"]}}}' });
  await configure(cwd);
  const before = await readFile(path.join(cwd, "package.json"), "utf8");
  let called = false;
  await assert.rejects(runCli(["add", "button", "--cwd", cwd, "--overwrite"], { fetchImpl, runShadcnImpl: () => { called = true; return 0; } }), /Unsupported installation layout/);
  assert.equal(called, false);
  assert.equal(await readFile(path.join(cwd, "package.json"), "utf8"), before);
});
