import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";
import { serialize } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
if (process.argv.slice(2).length) throw new Error("Usage: pnpm agents:evaluate");
const temporary = await mkdtemp(path.join(tmpdir(), "zeron-search-evaluation-"));
try {
  const evaluationModule = path.join(temporary, "evaluation.mjs");
  await build({ stdin: { contents: 'export { createCatalogQuery } from "./lib/agent-catalog/query"; export { loadSnapshots } from "./lib/agent-catalog/runtime";', resolveDir: root, loader: "ts" }, outfile: evaluationModule, bundle: true, platform: "node", format: "esm", logLevel: "silent" });
  const { createCatalogQuery, loadSnapshots } = await import(pathToFileURL(evaluationModule).href);
  const snapshots = loadSnapshots(JSON.parse(await readFile(path.join(root, "docs/generated/agent-runtime/bundle.json"), "utf8")));
  const current = snapshots.versions.find((version) => version.catalog.catalogVersion === snapshots.currentVersion);
  const ids = new Set(current.catalog.items.map((item) => item.id));
  const evaluation = JSON.parse(await readFile(path.join(root, "docs/agent-data/search-evaluation.json"), "utf8"));
  if (!Array.isArray(evaluation) || evaluation.length < 30 || ["en", "zh-CN"].some((locale) => evaluation.filter((row) => row.locale === locale).length < 15)) throw new Error("At least 15 English and 15 Chinese positive tasks are required");
  const query = createCatalogQuery(snapshots);
  const results = evaluation.map((row) => {
    if (!Array.isArray(row.expected) || !row.expected.length || row.expected.some((id) => !ids.has(id))) throw new Error(`Invalid expected catalog IDs: ${row.query}`);
    const result = query.call("search_components", { query: row.query, locale: row.locale, limit: 3 });
    if (result.error) throw new Error(`Evaluation request failed: ${result.error.code}`);
    const returned = result.data.items.map((item) => item.id);
    return { ...row, returned, hit: returned.some((id) => row.expected.includes(id)) };
  });
  const hits = results.filter((row) => row.hit).length;
  const report = { schemaVersion: 1, catalogVersion: snapshots.currentVersion, mode: current.catalog.mode, topK: 3,
    cases: results.length, hits, threshold: 0.9, status: hits / results.length >= 0.9 ? "passed" : "failed", results };
  const output = path.join(root, "output/agent-access/search-evaluation.json");
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, serialize(report));
  console.log(`Search evaluation: ${hits}/${results.length} Top-3 hits; ${report.status}; ${snapshots.currentVersion}\nEvidence: ${output}`);
  if (report.status !== "passed") process.exitCode = 1;
} finally { await rm(temporary, { recursive: true, force: true }); }
