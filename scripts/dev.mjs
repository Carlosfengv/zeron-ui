import { execFileSync, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstatSync, readdirSync } from "node:fs";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const stamp = join(root, "node_modules/.cache/zeron-dev.json");
const outputDirs = ["public/skills", "public/ai", "public/docs-source", "docs/generated/agent-runtime"];
const outputFiles = new Set([
  "packages/blocks/src/catalog.ts",
  "docs/generated/agent-guide-loaders.generated.ts",
  "docs/lib/block-preview-sources.generated.ts",
  "docs/pages/components/artifact-preview-panel/preview-document.generated.json",
  "packages/ui/src/system/code-engine/styles/base-css.generated.ts",
  "packages/ui/src/system/code-engine/styles/editor-css.generated.ts",
  "packages/ui/src/system/code-engine/worker/worker.js",
  "public/llms.txt", "public/llms-small.txt", "public/llms-full.txt",
]);

function generatedFiles(directory) {
  try {
    return readdirSync(join(root, directory), { withFileTypes: true }).flatMap(entry => {
      const file = `${directory}/${entry.name}`;
      return entry.isDirectory() ? generatedFiles(file) : [file];
    });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function snapshot() {
  let sourceFiles;
  try {
    const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
      cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 8 * 1024 * 1024,
    });
    sourceFiles = files.split("\0").filter(Boolean);
  } catch {
    return null;
  }
  const files = new Set([...sourceFiles, ...outputFiles, ...outputDirs.flatMap(generatedFiles)]);
  const inputs = createHash("sha256").update(process.version);
  const outputs = createHash("sha256");
  for (const file of [...files].sort()) {
    const isOutput = outputFiles.has(file) || outputDirs.some(directory => file.startsWith(`${directory}/`)) ||
      /^app\/\[locale\]\/docs\/(?:components|blocks|pages)\/\(detail\)\/[^/]+\/page\.tsx$/.test(file);
    let metadata;
    try {
      const stat = lstatSync(join(root, file), { bigint: true });
      metadata = `${stat.size}:${stat.mtimeNs}`;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      metadata = "missing";
    }
    (isOutput ? outputs : inputs).update(`${file}\0${metadata}\n`);
  }
  return { inputs: inputs.digest("hex"), outputs: outputs.digest("hex") };
}

function run(args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn("pnpm", args, { cwd: root, env, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`pnpm ${args[0]} stopped with ${signal ?? `exit code ${code}`}`));
    });
  });
}

async function prepare() {
  const before = snapshot();
  const cached = await readFile(stamp, "utf8").catch(error => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (before && cached === JSON.stringify(before)) {
    console.log("Development assets are up to date.");
    return;
  }
  const steps = ["skills:build", "code-engine:build", "docs:routes:build", "docs:sources:build", "agents:guides:build", "catalog:build"];
  const results = await Promise.allSettled(steps.map(step => run([step])));
  const failed = results.filter(result => result.status === "rejected");
  if (failed.length) throw new Error(failed.map(result => result.reason.message).join("\n"));
  await run(["agents:build", "--mode", "development"]);
  const after = snapshot();
  if (before && after && before.inputs === after.inputs) {
    const temporary = `${stamp}.${process.pid}`;
    await mkdir(dirname(stamp), { recursive: true });
    try {
      await writeFile(temporary, JSON.stringify(after));
      await rename(temporary, stamp);
    } finally {
      await rm(temporary, { force: true });
    }
  }
}

async function previewEnvironment() {
  const distDir = process.env.NEXT_DEV_DIST_DIR;
  if (!distDir || distDir === ".next-dev") return process.env;
  // Next adds the current distDir's types to the active tsconfig. Keep the
  // generated include in a separate ignored config for each preview.
  const key = createHash("sha256").update(distDir).digest("hex").slice(0, 12);
  const config = `tsconfig.next-preview-${key}.local`;
  await writeFile(join(root, config), JSON.stringify({
    extends: "./tsconfig.json",
    compilerOptions: { plugins: [{ name: "next" }] },
    include: ["**/*.ts", "**/*.tsx", "next-env.d.ts", `${distDir}/types/**/*.ts`],
  }, null, 2) + "\n");
  return { ...process.env, ZERON_NEXT_DEV_TSCONFIG: config };
}

const args = process.argv.slice(2);
await prepare();
if (!args.includes("--prepare-only")) {
  await run(["exec", "next", "dev", "--turbopack", ...args], await previewEnvironment());
}
