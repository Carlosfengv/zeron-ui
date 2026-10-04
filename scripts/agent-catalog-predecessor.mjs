import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { frozenReleaseSchema, releaseSelectionSchema } from "./agent-release-record.mjs";
import { committedCiSourceFile } from "./check-agent-ci-evidence.mjs";
import { restoreAgentRelease } from "./restore-agent-release.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const recordDirectory = "docs/agent-data/releases";
const reject = code => { throw Object.assign(new Error(`Catalog predecessor rejected: ${code}`), { code }); };
const descriptor = (name, bytes) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) });
function parseCanonical(schema, bytes) {
  try {
    if (!Buffer.isBuffer(bytes) || bytes.length > 2 * 1024 * 1024) reject("PREDECESSOR_RECORD_BYTES");
    const result = schema.parse(JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(bytes)));
    if (!bytes.equals(Buffer.from(serialize(result)))) reject("PREDECESSOR_RECORD_CANONICAL");
    return result;
  } catch (error) { if (error.code) throw error; reject("PREDECESSOR_RECORD_CONTRACT"); }
}

/** Committed records are the approval baseline; current.json is only the application selection. */
export function selectCatalogPredecessor(records, selectionBytes, requested) {
  if (!(records instanceof Map) || records.size > 1024) reject("PREDECESSOR_RECORD_BUDGET");
  if (!records.size) {
    if (selectionBytes || requested !== "none") reject("PREDECESSOR_FIRST_RELEASE");
    return null;
  }
  if (!selectionBytes || requested === "none") reject("PREDECESSOR_BASELINE_REQUIRED");
  const parsed = new Map(), references = new Set(); let total = selectionBytes.length;
  for (const [name, bytes] of records) {
    if (!/^[a-f0-9]{64}\.json$/.test(name)) reject("PREDECESSOR_RECORD_NAME");
    total += bytes.length; if (total > 32 * 1024 * 1024) reject("PREDECESSOR_RECORD_BUDGET");
    const record = parseCanonical(frozenReleaseSchema, bytes);
    if (name !== `${record.catalog.version}.json`) reject("PREDECESSOR_RECORD_NAME");
    parsed.set(name, record);
    for (const ref of record.history) {
      const old = records.get(ref.path);
      if (!Buffer.isBuffer(old) || old.length !== ref.bytes || sha256(old) !== ref.sha256) reject("PREDECESSOR_HISTORY_BYTES");
      references.add(ref.path);
    }
  }
  const selection = parseCanonical(releaseSelectionSchema, selectionBytes).current;
  const chosen = records.get(selection.path);
  if (!chosen || chosen.length !== selection.bytes || sha256(chosen) !== selection.sha256) reject("PREDECESSOR_SELECTION_BYTES");
  const tips = [...parsed.keys()].filter(name => !references.has(name));
  if (tips.length !== 1) reject("PREDECESSOR_AMBIGUOUS_BASELINE");
  const chain = [], visited = new Set(); let name = tips[0];
  while (name) {
    if (visited.has(name)) reject("PREDECESSOR_HISTORY_CYCLE");
    visited.add(name); chain.push(name); name = parsed.get(name).history[0]?.path;
  }
  if (visited.size !== records.size) reject("PREDECESSOR_DISCONNECTED_HISTORY");
  for (const [index, name] of chain.entries()) {
    if (parsed.get(name).history.some((ref, offset) => ref.path !== chain[index + offset + 1])) reject("PREDECESSOR_HISTORY_ORDER");
  }
  if (requested !== tips[0]) reject("PREDECESSOR_NOT_APPROVED_TIP");
  const bytes = records.get(tips[0]);
  return { record: parsed.get(tips[0]), bytes, reference: descriptor(tips[0], bytes),
    applicationSelection: selection, history: chain.slice(0, 2).map(name => descriptor(name, records.get(name))) };
}

export async function readCommittedCatalogPredecessor(source, requested) {
  let names;
  try {
    names = execFileSync("git", ["ls-tree", "-r", "--name-only", "-z", source.sourceRevision, "--", recordDirectory],
      { cwd: root, maxBuffer: 256 * 1024, stdio: ["ignore", "pipe", "pipe"] }).toString("utf8").split("\0").filter(Boolean);
  } catch { reject("PREDECESSOR_COMMITTED_BASELINE"); }
  if (names.length > 1025) reject("PREDECESSOR_RECORD_BUDGET");
  const records = new Map(); let selectionBytes, total = 0;
  for (const name of names) {
    const basename = name.slice(recordDirectory.length + 1);
    if (basename !== "current.json" && !/^[a-f0-9]{64}\.json$/.test(basename)) reject("PREDECESSOR_RECORD_NAME");
    const bytes = await committedCiSourceFile(source.sourceRevision, name);
    total += bytes.length; if (bytes.length > 2 * 1024 * 1024 || total > 32 * 1024 * 1024) reject("PREDECESSOR_RECORD_BUDGET");
    if (basename === "current.json") selectionBytes = bytes; else records.set(basename, bytes);
  }
  let requestedName = requested;
  if (requested !== "none") {
    const filename = path.resolve(requested);
    if (path.dirname(filename) !== path.join(root, recordDirectory)) reject("PREDECESSOR_RECORD_LOCATION");
    requestedName = path.basename(filename);
  }
  return selectCatalogPredecessor(records, selectionBytes, requestedName);
}

/** Reuse full frozen-stage verification in a disposable directory, never the application output. */
export async function readPublishedCatalogPredecessor(predecessor) {
  if (!predecessor) return null;
  const output = await mkdtemp(path.join(tmpdir(), "zeron-catalog-predecessor-"));
  try {
    await restoreAgentRelease({ release: path.join(root, recordDirectory, predecessor.reference.path), output, requireCommitted: true });
    const base = path.join(output, "public/ai/releases", predecessor.record.catalog.version);
    return { ...predecessor,
      identities: JSON.parse(await readFile(path.join(base, "item-identities.json"), "utf8")),
      runtime: JSON.parse(await readFile(path.join(base, "runtime.json"), "utf8")) };
  } finally { await rm(output, { recursive: true, force: true }); }
}
