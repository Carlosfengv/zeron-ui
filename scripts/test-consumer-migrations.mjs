/** Independent consumers: old UI -> actual Registry install -> adapted calls.
 * APIs are intercepted test contracts, never presented as a live backend.
 * Keeps temporary consumers/evidence for inspection and failure recovery.
 */
import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { createServer } from "node:http";
import { createServer as createTcpServer } from "node:net";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";
import { hash } from "../packages/cli/src/swap/project.js";
import { scanProject } from "../packages/cli/src/swap/scan.js";
import { scopeDigest } from "../packages/cli/src/swap/state.js";
import { captureBatch, sealBatch } from "../packages/cli/src/swap/recovery.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const fixtures = path.join(root, "tests/fixtures/swap");
const work = await mkdtemp(path.join(tmpdir(), "zeron-migrations-"));
const output = path.join(root, "output/swap-validation");
await mkdir(output, { recursive: true });
await writeFile(path.join(output, "workspace.txt"), work);
const exec = promisify(execFile);
const selected = process.env.ZERON_MIGRATION_FRAMEWORKS?.split(",") ?? ["next", "vite"];
if (selected.some((item) => !["next", "vite"].includes(item))) throw new Error("Supported framework selection: next,vite");
const items = ["button", "input", "switch", "select", "dialog", "app-shell", "page-layout", "top-nav", "table", "inline-notice"];
const log = [];
async function command(command, args, cwd) {
  try {
    const result = await exec(command, args, { cwd, maxBuffer: 8 * 1024 * 1024, env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" } });
    log.push({ command: [command, ...args], cwd, status: "passed", output: `${result.stdout}\n${result.stderr}` });
    return result.stdout;
  } catch (error) {
    log.push({ command: [command, ...args], cwd, status: "failed", output: `${error.stdout}\n${error.stderr}` });
    throw new Error(`${command} ${args.join(" ")} failed:\n${error.stdout}\n${error.stderr}`);
  }
}
async function write(cwd, file, content) {
  await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
  await writeFile(path.join(cwd, file), content);
}
const template = (name) => readFile(path.join(fixtures, name), "utf8");
const registry = new Map();
for (const file of await readdir(path.join(root, "public/r"))) if (file.endsWith(".json")) registry.set(file, await readFile(path.join(root, "public/r", file), "utf8"));
const manifestHash = hash(JSON.stringify([...registry.entries()].sort()));
await mkdir(path.join(work, "registry"));
for (const [file, content] of registry) await writeFile(path.join(work, "registry", file), content);
await writeFile(path.join(work, "registry", "snapshot.json"), JSON.stringify({ manifestHash }));
let registryBase;
const server = createServer((request, response) => {
  const name = new URL(request.url, "http://localhost").pathname.split("/").at(-1);
  const text = registry.get(name);
  if (!text) { response.writeHead(404).end(); return; }
  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(text.replaceAll("https://zeron-ui.vercel.app/r", registryBase));
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
registryBase = `http://127.0.0.1:${server.address().port}/r`;

async function setup(framework) {
  const cwd = path.join(work, framework);
  const isNext = framework === "next";
  const pkg = {
    name: `swap-${framework}-consumer`, private: true, type: "module",
    scripts: { build: isNext ? "next build" : "vite build", start: isNext ? "next start" : "vite preview" },
    dependencies: { react: "19.2.0", "react-dom": "19.2.0", ...(isNext ? { next: "15.5.9" } : {}) },
    devDependencies: { typescript: "5.9.3", "@types/react": "19.2.14", "@types/react-dom": "19.2.3", "@types/node": "20.19.9", tailwindcss: "4.3.3", ...(isNext ? { "@tailwindcss/postcss": "4.3.3" } : { vite: "8.2.1", "@tailwindcss/vite": "4.3.3" }) },
  };
  await write(cwd, "package.json", JSON.stringify(pkg, null, 2));
  await write(cwd, "tsconfig.json", JSON.stringify({ compilerOptions: { target: "ES2020", lib: ["dom", "esnext"], module: "esnext", moduleResolution: "bundler", jsx: isNext ? "preserve" : "react-jsx", strict: true, noEmit: true, skipLibCheck: true, esModuleInterop: true, resolveJsonModule: true, baseUrl: ".", paths: { "@/*": ["./src/*"] }, ...(isNext ? { plugins: [{ name: "next" }] } : {}) }, include: ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] }, null, 2));
  await write(cwd, "components.json", JSON.stringify({ style: "new-york", rsc: isNext, tsx: true, tailwind: { config: "", css: "src/globals.css", baseColor: "neutral", cssVariables: true, prefix: "" }, aliases: { components: "@/components", ui: "@/components/ui", lib: "@/lib", hooks: "@/hooks", utils: "@/lib/utils" }, iconLibrary: "lucide" }, null, 2));
  await write(cwd, "src/globals.css", '@import "tailwindcss";\n@custom-variant dark (&:where(.dark, .dark *));\n@theme { --color-background: #fff; --color-foreground: #111; --color-border: #ddd; --color-ring: #6088e8; }\n@import "./legacy.css";\n');
  await write(cwd, "src/legacy.css", ':root { --legacy-brand: #405cf5; } body { font-family: system-ui; } .legacy-shell { max-width: 880px; margin: auto; padding: 24px; } .legacy-shell nav { display: flex; gap: 16px; } .legacy-button { background: var(--legacy-brand); color: white; padding: 8px 16px; margin: 4px; border-radius: 6px; } .legacy-outline { background: white; color: black; border: 1px solid #ccc; padding: 8px; } .legacy-modal { border: 1px solid #ccc; padding: 20px; } .legacy-modal label, .legacy-modal input, .legacy-modal select { display: block; margin: 8px 0; } table { width: 100%; text-align: left; } .dark { color-scheme: dark; }');
  await write(cwd, "src/domain.ts", await template("domain.ts.txt"));
  await write(cwd, "src/workspace.tsx", await template(`${isNext ? "next-shadcn" : "vite-custom"}/before.tsx.txt`));
  await write(cwd, "src/components/ui/button.tsx", await template(isNext ? "legacy-button.tsx.txt" : "vite-custom/button.tsx.txt"));
  // Registry optional Pro type declarations follow the existing consumer harness.
  for (const name of ["core-stroke-standard", "core-bulk-rounded", "core-duotone-rounded"]) await write(cwd, `types/${name}.d.ts`, `declare module "@hugeicons-pro/${name}" { const icons: Record<string, unknown>; export = icons; }`);
  if (isNext) {
    await write(cwd, "postcss.config.mjs", 'export default { plugins: { "@tailwindcss/postcss": {} } };');
    await write(cwd, "app/page.tsx", 'export { default } from "../src/workspace";');
    await write(cwd, "app/layout.tsx", 'import "../src/globals.css"; export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="en"><body>{children}</body></html>; }');
  } else {
    await write(cwd, "vite.config.ts", 'import { defineConfig } from "vite"; import tailwindcss from "@tailwindcss/vite"; import { fileURLToPath } from "node:url"; export default defineConfig({ plugins: [tailwindcss()], resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } } });');
    await write(cwd, "index.html", '<html lang="en"><head><title>Workspace</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>');
    await write(cwd, "src/main.tsx", 'import { createRoot } from "react-dom/client"; import Workspace from "./workspace"; import "./globals.css"; createRoot(document.getElementById("root")!).render(<Workspace/>);');
  }
  console.log(`[${framework}] installing independent consumer at ${cwd}`);
  await command("npm", ["install", "--no-audit", "--no-fund"], cwd);
  return cwd;
}

async function freePort() {
  const tcp = createTcpServer();
  await new Promise((resolve) => tcp.listen(0, "127.0.0.1", resolve));
  const port = tcp.address().port;
  await new Promise((resolve) => tcp.close(resolve));
  return port;
}

async function exercise(cwd, framework, phase, browser) {
  const port = await freePort();
  const executable = path.join(cwd, "node_modules/.bin", framework === "next" ? "next" : "vite");
  const app = spawn(executable, framework === "next" ? ["start", "-p", String(port)] : ["preview", "--host", "127.0.0.1", "--port", String(port)], { cwd, stdio: "ignore" });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  const requests = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    requests.push({ url: new URL(request.url()).pathname + new URL(request.url()).search, method: request.method(), body: request.postDataJSON() });
    if (request.method() === "POST") {
      const body = request.postDataJSON();
      await route.fulfill({ status: body.name === "Fail" ? 500 : 200, json: { saved: body.name !== "Fail" } });
    } else {
      const second = new URL(request.url()).searchParams.get("page") === "2";
      await route.fulfill({ json: { items: [{ id: second ? "member-2" : "member-1", name: second ? "Grace" : "Ada", role: "viewer" }] } });
    }
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (app.exitCode !== null) throw new Error("Consumer server exited");
      try { if ((await fetch(`http://127.0.0.1:${port}`)).ok) { ready = true; break; } } catch { /* starting */ }
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    assert.ok(ready, "consumer server ready");
    await page.goto(`http://127.0.0.1:${port}`);
    await page.getByRole("cell", { name: "Ada", exact: true }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Delete workspace" }).isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Previous" }).isDisabled(), true);
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await page.getByRole("cell", { name: "Grace", exact: true }).waitFor();
    await page.getByRole("link", { name: "Members", exact: true }).click();
    assert.ok(page.url().endsWith("#members"));
    await page.screenshot({ path: path.join(output, `${framework}-${phase}-wide.png`), fullPage: true });
    await page.getByRole("button", { name: "Edit settings" }).click();
    await page.getByLabel("Name", { exact: true }).fill("");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("alert").filter({ hasText: "Name is required" }).waitFor();
    await page.getByLabel("Name", { exact: true }).fill("Fail");
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("alert").filter({ hasText: "Could not save settings" }).waitFor();
    await page.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
    if (phase === "before") await page.getByLabel("Role", { exact: true }).selectOption("admin");
    else {
      await page.getByRole("combobox", { name: "Role" }).click();
      await page.getByRole("option", { name: "Admin", exact: true }).click();
    }
    await page.getByRole(phase === "before" ? "checkbox" : "switch", { name: "Notifications" }).click();
    await page.getByRole("button", { name: "Save changes" }).click();
    await page.getByRole("status").filter({ hasText: "Settings saved" }).waitFor();
    await page.getByRole("button", { name: "Toggle theme" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    if (phase === "after") {
      const navigation = await page.getByRole("navigation", { name: "Workspace" }).boundingBox();
      const themeAction = await page.getByRole("button", { name: "Toggle theme" }).boundingBox();
      assert.ok(navigation.x + navigation.width + 4 <= themeAction.x, "navigation and theme action must not overlap");
    }
    await page.screenshot({ path: path.join(output, `${framework}-${phase}-narrow-dark.png`), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, "no page overflow");
    await page.getByRole("button", { name: "Edit settings" }).click();
    await page.getByRole("dialog", { name: "Workspace settings" }).waitFor();
    if (phase === "after") await page.waitForFunction(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog && Number(getComputedStyle(dialog).opacity) >= 0.99;
    });
    await page.screenshot({ path: path.join(output, `${framework}-${phase}-dialog.png`), fullPage: true });
    if (phase === "after") {
      await page.keyboard.press("Escape");
      await page.getByRole("dialog").waitFor({ state: "hidden" });
      assert.equal(await page.getByRole("button", { name: "Edit settings" }).evaluate((element) => element === document.activeElement), true);
    } else await page.getByRole("button", { name: "Cancel" }).click();
    assert.deepEqual(consoleErrors, []);
    assert.deepEqual(requests.filter((r) => r.method === "POST").at(-1).body, { name: "Ada Lovelace", role: "admin", notifications: false });
    assert.ok(requests.some((r) => r.url === "/api/members?page=2&limit=2"));
    return requests;
  } finally { await page.close(); app.kill(); }
}

const results = [];
let browser;
try {
  const packed = JSON.parse(await command("npm", ["pack", "--json", "--pack-destination", work], path.join(root, "packages/cli")));
  const tool = path.join(work, "tool");
  await write(tool, "package.json", '{"private":true}');
  await command("npm", ["install", path.join(work, packed[0].filename), "--no-audit", "--no-fund"], tool);
  const cli = path.join(tool, "node_modules/zeron-ui/src/index.js");
  browser = await chromium.launch({ headless: true });
  for (const framework of selected) {
    const cwd = await setup(framework);
    const cliRun = (args) => command(process.execPath, [cli, ...args, "--cwd", cwd], cwd);
    console.log(`[${framework}] checking and exercising original UI`);
    await command("npm", ["run", "build"], cwd);
    await command("npx", ["tsc", "--noEmit"], cwd);
    const before = await scanProject(cwd);
    const beforeRequests = await exercise(cwd, framework, "before", browser);
    await write(cwd, ".zeron/evidence/baseline.md", JSON.stringify({ routes: before.routes, snapshot: before.snapshot, requests: beforeRequests }, null, 2));
    const domainBefore = await readFile(path.join(cwd, "src/domain.ts"), "utf8");
    const oldButton = await readFile(path.join(cwd, "src/components/ui/button.tsx"), "utf8");
    console.log(`[${framework}] previewing conflicts, installing and adapting callers`);
    const preview = JSON.parse(await cliRun(["add", ...items, "--registry", registryBase, "--dry-run", "--overwrite"]));
    assert.equal(await readFile(path.join(cwd, "src/components/ui/button.tsx"), "utf8"), oldButton);
    const recovery = path.join(work, `recovery-${framework}`);
    await captureBatch(cwd, [...preview.files.map((file) => path.relative(cwd, file.targetPath).split(path.sep).join("/")), "src/workspace.tsx", "src/globals.css", "src/legacy.css", "package.json", "package-lock.json", ".zeron/install-state.json"], recovery);
    await cliRun(["add", ...items, "--registry", registryBase, "--yes", "--overwrite"]);
    await write(cwd, "src/workspace.tsx", await template("after.tsx.txt"));
    const css = (await readFile(path.join(cwd, "src/globals.css"), "utf8")).replace('@import "./legacy.css";', "")
      + "\nbody { color: var(--fg-default); background: var(--surface-base); font-family: var(--font-family-sans); }\n";
    await write(cwd, "src/globals.css", css);
    await rm(path.join(cwd, "src/legacy.css"));
    assert.equal(await readFile(path.join(cwd, "src/domain.ts"), "utf8"), domainBefore);
    await command("npx", ["tsc", "--noEmit"], cwd);
    await command("npm", ["run", "build"], cwd);
    const afterRequests = await exercise(cwd, framework, "after", browser);
    assert.deepEqual(afterRequests, beforeRequests, "business HTTP contracts preserved");
    // Repeated authorized installation must not duplicate imports or rewrite domain code.
    await cliRun(["add", ...items, "--registry", registryBase, "--yes", "--overwrite"]);
    assert.equal(await readFile(path.join(cwd, "src/domain.ts"), "utf8"), domainBefore);
    assert.equal(((await readFile(path.join(cwd, "src/globals.css"), "utf8")).match(/@import ["']tw-animate-css["']/g) ?? []).length, 1);
    const batchFiles = await sealBatch(cwd, recovery);
    const scan = await scanProject(cwd);
    const routes = framework === "next" ? scan.routes : ["src/main.tsx"];
    const scope = { roots: ["."], routes }; scope.digest = scopeDigest(scope);
    const managedFiles = {};
    for (const file of preview.files) {
      const relative = path.relative(cwd, file.targetPath).split(path.sep).join("/");
      managedFiles[relative] = hash(await readFile(file.targetPath));
    }
    const proofText = JSON.stringify({ framework, beforeRequests, afterRequests, snapshot: scan.snapshot, manifestHash, note: "Automated fixture verification. Visual review and independent provenance review remain unchecked." }, null, 2);
    await write(cwd, ".zeron/evidence/automated.json", proofText);
    const proof = { path: ".zeron/evidence/automated.json", sha256: hash(proofText) };
    const baselineFile = ".zeron/evidence/baseline.md";
    const plan = { schemaVersion: 1, id: `fixture-${framework}`, status: "partial", scope, baseline: { files: before.files, evidence: { path: baselineFile, sha256: hash(await readFile(path.join(cwd, baselineFile))) } }, source: { cliVersion: "0.2.0-beta.16", registryBase, release: `local-snapshot-${manifestHash.slice(0, 12)}`, manifestHash }, managedFiles,
      mappings: [{ id: "button", strategy: "adapt", state: "verified", source: { modules: [], files: ["src/components/ui/button.tsx", "src/legacy.css"], text: ["legacy-", "--legacy-brand"] }, targets: items }], unknownResolutions: [], exceptions: [], batches: [{ id: "ui-migration", status: "verified", recovery, files: batchFiles }],
      checks: ["typecheck", "build", "behavior", "visual", "contract", "provenance", "cleanup", "scope-review"].map((kind) => ({ kind, status: ["typecheck", "build", "behavior", "cleanup"].includes(kind) ? "passed" : "unchecked", snapshot: scan.snapshot, evidence: proof })) };
    await write(cwd, ".zeron/migrations/fixture/plan.json", JSON.stringify(plan, null, 2));
    let check;
    try { await cliRun(["swap", "check", "--plan", ".zeron/migrations/fixture/plan.json", "--json"]); throw new Error("Unchecked fixture must not claim complete"); }
    catch (error) {
      check = log.at(-1);
      const result = JSON.parse(check.output.trim());
      assert.equal(result.completionStatus, "partial", error.message);
      assert.equal(result.staticStatus, "unchecked", JSON.stringify(result.diagnostics));
      assert.equal(result.exitCode, 2);
      assert.equal(result.counts.residuals, 0);
    }
    results.push({ framework, cwd, automated: "passed", completion: "awaiting-review", snapshot: scan.snapshot, unknowns: scan.unknowns.length });
    console.log(`[${framework}] migration behavior/build passed; manual review remains explicit`);
  }
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
  await writeFile(path.join(output, "commands.json"), JSON.stringify(log, null, 2));
  await writeFile(path.join(output, "results.json"), JSON.stringify({ work, results }, null, 2));
}
console.log(`Migration evidence: ${output}`);
