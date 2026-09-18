import assert from "node:assert/strict";
import test from "node:test";
import { readFile, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { scanProject } from "../../src/swap/scan.js";
import { runCli } from "../../src/cli.js";
import { fixture } from "./helpers.js";

test("resolves renamed imports, barrels, aliases and literal dynamic imports without writing", async (t) => {
  const cwd = await fixture(t, {
    "src/bridge.ts": 'export { Button as Action } from "./new-button";',
    "app/page.tsx": 'import { Action as Save } from "@/bridge"; const load = () => import("@/new-button"); export default () => <Save />;',
  });
  const before = await readFile(path.join(cwd, "app/page.tsx"), "utf8");
  const result = await scanProject(cwd);
  assert.equal(result.status, "passed");
  assert.deepEqual(result.routes, ["app/page.tsx"]);
  assert.equal(result.imports.find((i) => i.specifier === "@/bridge").resolved, "src/bridge.ts");
  assert.ok(result.imports.some((i) => i.kind === "export" && i.resolved === "src/new-button.tsx"));
  assert.ok(result.imports.some((i) => i.kind === "dynamic"));
  assert.ok(result.jsx.some((item) => item.name === "Save"));
  assert.equal(before, await readFile(path.join(cwd, "app/page.tsx"), "utf8"));
  assert.deepEqual((await scanProject(cwd)).files, result.files);
  assert.equal(JSON.stringify(result).includes('"contents"'), false);
});

test("reports dynamic expressions, missing aliases, prop spreads and invalid syntax", async (t) => {
  const cwd = await fixture(t, { "app/page.tsx": 'import X from "@missing/button"; const load = (n) => import(n); export default () => <X {...props} />;', "src/broken.ts": "const =" });
  const result = await scanProject(cwd);
  for (const code of ["dynamic-reference", "unresolved-import", "prop-spread", "parse"]) assert.ok(result.unknowns.some((u) => u.code === code), code);
  assert.equal(result.status, "unchecked");
});

test("checks resolved versions rather than permissive declared ranges", async (t) => {
  const cwd = await fixture(t, { "node_modules/react/package.json": '{"version":"18.3.1"}' });
  assert.ok((await scanProject(cwd)).unknowns.some((u) => u.code === "compatibility" && u.detail.includes("18.3.1")));
});

test("Vite routing needs a route inventory; source symlinks are never silently traversed", async (t) => {
  const cwd = await fixture(t, { "package.json": '{"devDependencies":{"vite":"8","tailwindcss":"4"},"dependencies":{"react":"19"}}' });
  await symlink(path.join(cwd, "src/new-button.tsx"), path.join(cwd, "linked.tsx"));
  const scan = await scanProject(cwd);
  assert.ok(scan.unknowns.some((u) => u.code === "route-inventory"));
  assert.ok(scan.unknowns.some((u) => u.code === "source-symlink"));
});

test("CLI prints machine-readable scan facts and rejects write options", async (t) => {
  const cwd = await fixture(t);
  let output = "";
  assert.equal(await runCli(["swap", "scan", "--cwd", cwd, "--json"], { stdout: { write: (s) => { output += s; } } }), 0);
  assert.equal(JSON.parse(output).schemaVersion, 1);
  await assert.rejects(runCli(["swap", "scan", "--cwd", cwd, "--overwrite"]), /read-only/);
  await writeFile(path.join(cwd, "app/page.tsx"), "export default () => <div {...props}/>;");
  assert.equal(await runCli(["swap", "scan", "--cwd", cwd], { stdout: { write() {} } }), 2);
});
