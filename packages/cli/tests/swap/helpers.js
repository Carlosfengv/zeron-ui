import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { hash } from "../../src/swap/project.js";
import { scanProject } from "../../src/swap/scan.js";
import { scopeDigest } from "../../src/swap/state.js";

export async function fixture(t, files = {}) {
  const cwd = await mkdtemp(path.join(tmpdir(), "zeron-swap-test-"));
  t.after(() => rm(cwd, { recursive: true, force: true }));
  const defaults = {
    "package.json": JSON.stringify({ dependencies: { react: "^19.0.0", next: "15.5.9" }, devDependencies: { tailwindcss: "^4.0.0" } }),
    "node_modules/react/package.json": '{"name":"react","version":"19.2.0","main":"index.js"}',
    "node_modules/react/index.js": "export const useState = null;",
    "node_modules/tailwindcss/package.json": '{"name":"tailwindcss","version":"4.1.0"}',
    "tsconfig.json": JSON.stringify({ compilerOptions: { moduleResolution: "bundler", paths: { "@/*": ["./src/*"] }, jsx: "react-jsx" } }),
    "app/page.tsx": 'import { Button } from "../src/new-button"; export default function Page() { return <Button>Save</Button>; }',
    "src/new-button.tsx": 'export function Button() { return <button>Save</button>; }',
  };
  for (const [file, content] of Object.entries({ ...defaults, ...files })) {
    await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
    await writeFile(path.join(cwd, file), content);
  }
  return cwd;
}

export async function evidence(cwd, text = "Inspected baseline, behavior and current source.") {
  const file = ".zeron/evidence/review.md";
  await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
  await writeFile(path.join(cwd, file), text);
  return { path: file, sha256: hash(text) };
}

export async function validPlan(cwd) {
  const scan = await scanProject(cwd);
  const proof = await evidence(cwd);
  const scope = { roots: ["."], routes: ["app/page.tsx"] };
  scope.digest = scopeDigest(scope);
  return {
    schemaVersion: 1, id: "test", status: "complete", scope,
    baseline: { files: scan.files, evidence: proof },
    source: { cliVersion: "0.2.0-beta.16", registryBase: "https://example.test/r/releases/test", release: "test", manifestHash: hash("registry") },
    managedFiles: { "src/new-button.tsx": hash(await readFile(path.join(cwd, "src/new-button.tsx"))) },
    mappings: [{ id: "button", strategy: "direct", state: "verified", source: { modules: ["old-ui"], files: ["src/old-button.tsx"], text: ["--legacy-brand"] }, targets: ["button"] }],
    unknownResolutions: [],
    checks: ["typecheck", "build", "behavior", "visual", "contract", "provenance", "cleanup", "scope-review"].map((kind) => ({ kind, status: "passed", snapshot: scan.snapshot, evidence: proof })),
    exceptions: [], batches: [],
  };
}
