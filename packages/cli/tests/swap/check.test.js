import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkMigration } from "../../src/swap/check.js";
import { runCli } from "../../src/cli.js";
import { scanProject } from "../../src/swap/scan.js";
import { hash } from "../../src/swap/project.js";
import { scopeDigest, validatePlan, verifyEvidence } from "../../src/swap/state.js";
import { fixture, validPlan } from "./helpers.js";

test("requires real current evidence instead of the complete label", async (t) => {
  const cwd = await fixture(t);
  const plan = await validPlan(cwd);
  assert.equal((await checkMigration(cwd, plan)).completionStatus, "complete");
  plan.checks = [];
  const result = await checkMigration(cwd, plan);
  assert.equal(result.exitCode, 2);
  assert.equal(result.completionStatus, "partial");
  assert.ok(result.diagnostics.some((d) => d.code === "plan-status-conflict"));
});

for (const status of ["pending", "migrating", "partial"]) {
  test(`does not upgrade a ${status} plan when all recorded checks pass`, async (t) => {
    const cwd = await fixture(t);
    const plan = await validPlan(cwd);
    plan.status = status;
    const before = structuredClone(plan);
    const result = await checkMigration(cwd, plan);
    assert.equal(result.staticStatus, "unchecked");
    assert.equal(result.completionStatus, "partial");
    assert.equal(result.exitCode, 2);
    assert.ok(result.diagnostics.some((d) => d.code === "plan-incomplete" && d.detail.includes(status)));
    assert.deepEqual(plan, before);
  });
}

test("a complete label cannot hide pending mappings or capability gaps", async (t) => {
  const cwd = await fixture(t);
  for (const change of [{ state: "pending" }, { state: "migrated" }, { state: "blocked" }, { strategy: "gap" }, { targets: [] }]) {
    const plan = await validPlan(cwd);
    Object.assign(plan.mappings[0], change);
    const result = await checkMigration(cwd, plan);
    assert.equal(result.exitCode, 2);
    assert.equal(result.completionStatus, "partial");
    assert.ok(result.diagnostics.some((d) => d.code === "mapping-pending"));
    assert.ok(result.diagnostics.some((d) => d.code === "plan-status-conflict"));
  }
});

test("removing Vite router false positives does not complete a declared partial migration", async (t) => {
  const cwd = await fixture(t, {
    "package.json": '{"devDependencies":{"vite":"8","tailwindcss":"4"},"dependencies":{"react":"19"}}',
    "src/pages/Models.tsx": "export default () => <div/>;",
  });
  const plan = await validPlan(cwd);
  plan.status = "partial";
  plan.scope.routes = ["src/pages/Models.tsx"];
  plan.scope.digest = scopeDigest(plan.scope);
  const scan = await scanProject(cwd);
  plan.unknownResolutions = scan.unknowns.filter((u) => u.code === "route-inventory").map((u) => ({ id: u.id, reason: "Reviewed router and model route", evidence: plan.baseline.evidence }));
  const planPath = ".zeron/plan.json";
  const input = JSON.stringify(plan);
  await writeFile(path.join(cwd, planPath), input);
  let output = "";
  const exitCode = await runCli(["swap", "check", "--cwd", cwd, "--plan", planPath, "--json"], { stdout: { write: (s) => { output += s; } } });
  const result = JSON.parse(output);
  assert.equal(exitCode, 2);
  assert.equal(result.completionStatus, "partial");
  assert.deepEqual(result.diagnostics.map((d) => d.code), ["plan-incomplete"]);
  assert.equal(await readFile(path.join(cwd, planPath), "utf8"), input);

  plan.status = "complete";
  const completed = await checkMigration(cwd, plan);
  assert.equal(completed.exitCode, 0);
  assert.equal(completed.completionStatus, "complete");
  plan.unknownResolutions = [];
  const unreviewed = await checkMigration(cwd, plan);
  assert.equal(unreviewed.completionStatus, "partial");
  assert.ok(unreviewed.diagnostics.some((d) => d.code === "route-inventory"));
});

test("finds remaining old imports via re-export and old CSS even with verified state", async (t) => {
  const cwd = await fixture(t, { "src/bridge.ts": 'export { Button } from "old-ui/button";', "src/theme.css": ":root { --legacy-brand: red; }" });
  const result = await checkMigration(cwd, await validPlan(cwd));
  assert.equal(result.exitCode, 1);
  assert.ok(result.diagnostics.some((d) => d.code === "residual" && d.detail.includes("old-ui/button") && d.detail.includes("--legacy-brand")));
  assert.ok(result.diagnostics.some((d) => d.code === "plan-status-conflict"));
});

test("tracks retained legacy adapters after old package imports are removed", async (t) => {
  const cwd = await fixture(t, {
    "src/project-ui.tsx": "export { Button } from './new-button';",
    "app/page.tsx": "import { Button } from '../src/project-ui'; export default () => <Button/>;",
  });
  const plan = await validPlan(cwd);
  plan.mappings[0].source.files.push("src/project-ui.tsx");
  const result = await checkMigration(cwd, plan);
  assert.equal(result.completionStatus, "partial");
  assert.equal(result.exitCode, 1);
  assert.ok(result.diagnostics.some((d) => d.code === "residual" && d.detail.includes("src/project-ui.tsx")));
});

test("detects package CSS imports including url syntax", async (t) => {
  const cwd = await fixture(t, { "src/theme.css": '@import url("old-ui/theme.css");' });
  const result = await checkMigration(cwd, await validPlan(cwd));
  assert.equal(result.exitCode, 1);
  assert.ok(result.diagnostics.some((d) => d.code === "residual" && d.detail.includes("old stylesheet")));
});

test("scoped migration reports retained outside consumers without requiring replacement", async (t) => {
  const cwd = await fixture(t, { "outside/old.ts": 'export { Button } from "old-ui";', "node_modules/old-ui/package.json": '{"name":"old-ui","main":"index.js"}', "node_modules/old-ui/index.js": 'exports.Button = null;' });
  const plan = await validPlan(cwd);
  plan.scope.roots = ["app"];
  plan.scope.digest = scopeDigest(plan.scope);
  const result = await checkMigration(cwd, plan);
  assert.equal(result.exitCode, 0);
  assert.ok(result.diagnostics.some((d) => d.code === "shared-consumer"));
});

test("source edits, lockfile changes and evidence changes invalidate successful checks", async (t) => {
  const cwd = await fixture(t);
  const plan = await validPlan(cwd);
  await writeFile(path.join(cwd, "package-lock.json"), "{}");
  assert.ok((await checkMigration(cwd, plan)).diagnostics.some((d) => d.code === "check-stale"));
  const fresh = await validPlan(cwd);
  await writeFile(path.join(cwd, fresh.checks[0].evidence.path), "changed evidence");
  assert.equal((await checkMigration(cwd, fresh)).exitCode, 2);
});

test("same path replacement requires changed baseline and trusted managed content", async (t) => {
  const cwd = await fixture(t);
  const plan = await validPlan(cwd);
  plan.mappings[0].source.files = ["src/new-button.tsx"];
  assert.equal((await checkMigration(cwd, plan)).exitCode, 1);
  plan.baseline.files["src/new-button.tsx"] = hash("old implementation");
  assert.equal((await checkMigration(cwd, plan)).exitCode, 0);
  await writeFile(path.join(cwd, "src/new-button.tsx"), "export const Button = null;");
  assert.ok((await checkMigration(cwd, plan)).diagnostics.some((d) => d.code === "managed-drift"));
});

test("new routes cannot hide behind an old plan", async (t) => {
  const cwd = await fixture(t);
  const plan = await validPlan(cwd);
  await mkdir(path.join(cwd, "app/new"));
  await writeFile(path.join(cwd, "app/new/page.tsx"), "export default () => <div/>;");
  assert.ok((await checkMigration(cwd, plan)).diagnostics.some((d) => d.code === "untracked-route"));
  plan.scope.roots = ["nonexistent"];
  plan.scope.digest = scopeDigest(plan.scope);
  assert.equal((await checkMigration(cwd, plan)).exitCode, 1);
});

test("unknowns need evidence, unsupported stacks cannot be waived", async (t) => {
  const cwd = await fixture(t, { "app/page.tsx": "export default () => <div {...props}/>;" });
  const plan = await validPlan(cwd);
  const { scanProject } = await import("../../src/swap/scan.js");
  const scan = await scanProject(cwd);
  assert.equal((await checkMigration(cwd, plan)).exitCode, 2);
  plan.unknownResolutions = scan.unknowns.map((u) => ({ id: u.id, reason: "Inspected spread", evidence: plan.baseline.evidence }));
  assert.equal((await checkMigration(cwd, plan)).exitCode, 0);
  await writeFile(path.join(cwd, "node_modules/react/package.json"), '{"version":"18.3.1"}');
  const next = await scanProject(cwd);
  plan.unknownResolutions.push(...next.unknowns.filter((u) => !plan.unknownResolutions.some((r) => r.id === u.id)).map((u) => ({ id: u.id, reason: "cannot waive this", evidence: plan.baseline.evidence })));
  assert.equal((await checkMigration(cwd, plan)).exitCode, 2);
});

test("accepted exceptions never produce a complete result or waive failed checks", async (t) => {
  const cwd = await fixture(t, { "src/old-button.tsx": "export const Legacy = null;" });
  const plan = await validPlan(cwd);
  plan.mappings[0].strategy = "gap";
  plan.exceptions = [{ mappingId: "button", reason: "Retained by user", acceptance: plan.baseline.evidence }];
  assert.equal((await checkMigration(cwd, plan)).completionStatus, "with-exceptions");
  plan.status = "partial";
  assert.equal((await checkMigration(cwd, plan)).completionStatus, "partial");
  plan.status = "complete";
  plan.checks[0].status = "failed";
  const result = await checkMigration(cwd, plan);
  assert.equal(result.exitCode, 1);
  assert.equal(result.completionStatus, "partial");
  assert.ok(result.diagnostics.some((d) => d.code === "plan-status-conflict"));
});

test("validates schema, IDs, scope digest and path boundaries", async (t) => {
  const cwd = await fixture(t);
  const plan = await validPlan(cwd);
  assert.deepEqual(validatePlan(plan), []);
  assert.ok(validatePlan({ ...plan, schemaVersion: 2 }).length);
  assert.ok(validatePlan({ ...plan, source: {} }).length);
  assert.ok(validatePlan({ ...plan, mappings: [...plan.mappings, ...plan.mappings] }).length);
  assert.ok(validatePlan({ ...plan, scope: { ...plan.scope, roots: ["../outside"] } }).length);
  assert.equal(await verifyEvidence(cwd, { path: "../outside", sha256: hash("") }), false);
  await symlink("/etc/hosts", path.join(cwd, "outside"));
  assert.equal(await verifyEvidence(cwd, { path: "outside", sha256: hash(await readFile("/etc/hosts")) }), false);
});

test("skill and CLI distribute exactly the same schema", async () => {
  const source = await readFile(new URL("../../src/swap/migration-plan.schema.json", import.meta.url), "utf8");
  const asset = await readFile(new URL("../../../../.agents/skills/swap-to-zeronui/assets/migration-plan.schema.json", import.meta.url), "utf8");
  assert.equal(source, asset);
});
