/** Local installation/runtime matrix for active migration entries. */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createWriteStream } from "node:fs";
import { unificationConsumerItems } from "./lib/unification-consumer-examples.mjs";
import { consumerRegistryClosureHash, snapshotConsumerRegistry } from "./lib/consumer-registry-expectations.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = process.env.ZERON_UNIFICATION_EVIDENCE_DIR ?? join(root, ".zeron/reports/stage-six");
const directory = join(output, "installed");
const selected = process.env.ZERON_UNIFICATION_ITEMS?.split(",").filter(Boolean) ?? unificationConsumerItems;
if (selected.some(item => !unificationConsumerItems.includes(item))) throw Error("Unknown unification item");
const concurrency = Number(process.env.ZERON_CONSUMER_CONCURRENCY ?? 3);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 3) throw Error("Consumer concurrency must be 1–3");
const snapshot = await snapshotConsumerRegistry(join(root, "public/r"));
const snapshotHash = data => createHash("sha256").update([...data].sort(([a], [b]) => a.localeCompare(b)).map(([name, source]) => `${name}\0${source}`).join("\0")).digest("hex");
const hash = snapshotHash(snapshot);
let previousSnapshot;
try { previousSnapshot = await snapshotConsumerRegistry(join(output, "registry-before-binary-fix")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const previousHash = previousSnapshot && snapshotHash(previousSnapshot);
const metadata = new Map(selected.map(name => [name, JSON.parse(snapshot.get(`${name}.json`)).meta.zeron]));
const targets = selected.flatMap(component => ["next", ...(metadata.get(component).framework === "react" ? ["vite"] : [])].flatMap(framework => ["npm", "pnpm"].map(packageManager => ({ component, framework, packageManager }))));
await mkdir(directory, { recursive: true });
await writeFile(join(output, "consumer-matrix.json"), JSON.stringify({ scope: "local-not-published", registrySha256: hash, targets }, null, 2) + "\n");

async function evidenceFor(target) {
  const file = `${target.framework}-${target.packageManager}-${target.component}.json`;
  try {
    const evidence = JSON.parse(await readFile(join(directory, file), "utf8"));
    const currentClosure = consumerRegistryClosureHash(snapshot, target.component);
    const evidenceClosure = evidence.registryClosureSha256 ?? (evidence.registrySha256 === hash
      ? currentClosure : evidence.registrySha256 === previousHash ? consumerRegistryClosureHash(previousSnapshot, target.component) : null);
    const matches = evidence.component === target.component && evidence.framework === target.framework
      && evidence.packageManager === target.packageManager && currentClosure === evidenceClosure;
    return { ...target, status: matches ? evidence.status : "stale", registryClosureSha256: currentClosure,
      sourceRegistrySha256: evidence.registrySha256, verifiedEvidenceClosureSha256: evidenceClosure,
      evidence: `installed/${file}`, error: evidence.error };
  } catch (error) { return { ...target, status: "unchecked", error: error.code ?? error.message }; }
}
const before = await Promise.all(targets.map(evidenceFor));
// Resuming is an explicit decision for a fixed CLI/fixture/checker run. A fresh
// default invocation cannot reuse old results after those inputs have changed.
const resume = process.argv.includes("--resume") || process.argv.includes("--collect");
const pending = resume ? targets.filter((_, index) => before[index].status !== "passed") : targets;
console.log(`${targets.length - pending.length}/${targets.length} targets reused for this fixed run; ${pending.length} pending.`);
const jobs = [];
for (const framework of ["next", "vite"]) for (const packageManager of ["npm", "pnpm"]) {
  const items = pending.filter(target => target.framework === framework && target.packageManager === packageManager).map(target => target.component);
  for (let shard = 0; shard < Math.min(3, items.length); shard++) {
    jobs.push({ framework, packageManager, items: items.filter((_, index) => index % 3 === shard), name: `${framework}-${packageManager}-${shard + 1}` });
  }
}
const runs = [];
async function worker() {
  while (jobs.length) {
    const job = jobs.shift();
    const log = createWriteStream(join(output, `consumers-final-${job.name}.log`));
    const child = spawn(process.execPath, [join(root, "scripts/test-consumer-installs.mjs"), "--all"], { cwd: root,
      env: { ...process.env, ZERON_CONSUMER_COMPONENTS: job.framework === "next" ? job.items.join(",") : "", ZERON_CONSUMER_PACKAGE_MANAGERS: job.framework === "next" ? job.packageManager : "", ZERON_VITE_CONSUMER_COMPONENTS: job.framework === "vite" ? job.items.join(",") : "", ZERON_VITE_CONSUMER_PACKAGE_MANAGERS: job.framework === "vite" ? job.packageManager : "", ZERON_CONSUMER_UNIFICATION: "1", ZERON_CONSUMER_EVIDENCE_DIR: directory },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.pipe(log); child.stderr.pipe(log);
    const result = await new Promise(resolve => {
      child.on("error", error => { log.end(); resolve({ job: job.name, code: 1, error: error.message }); });
      child.on("close", code => { log.end(); resolve({ job: job.name, code }); });
    });
    runs.push(result);
    console.log(`${job.name}: ${result.code === 0 ? "passed" : "failed"}`);
  }
}
if (!process.argv.includes("--collect")) await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
const results = await Promise.all(targets.map(evidenceFor));
const passed = results.filter(result => result.status === "passed").length;
const result = { scope: "local-not-published", registrySha256: hash, items: selected.length, targets: targets.length, passed, runs, results,
  reusedProofPolicy: "Default runs are fresh. Explicit resume/collection preserves original evidence and requires byte-identical recursive install payloads plus review of CLI/fixture/checker compatibility for the fixed run.",
  status: runs.every(run => run.code === 0) && passed === targets.length ? "passed" : "failed" };
await writeFile(join(output, "consumer-results.json"), JSON.stringify(result, null, 2) + "\n");
console.log(`${passed}/${targets.length} independent consumers passed. Details: ${output}/consumer-results.json`);
if (result.status !== "passed") process.exitCode = 1;
