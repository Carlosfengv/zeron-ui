import { execFileSync } from "node:child_process";
import { lstat, mkdtemp, open, readFile, readlink, realpath, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { frozenReleaseSchema } from "./agent-release-record.mjs";
import { selectCatalogPredecessor } from "./agent-catalog-predecessor.mjs";
import { publicationDispatchSchema, publicationReviewFiles, readPublicationGitControls } from "./agent-publication-workflow.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const recordDirectory = "docs/agent-data/releases";
const limits = { files: 8192, fileBytes: 32 * 1024 * 1024, treeBytes: 256 * 1024 * 1024,
  metadataBytes: 2 * 1024 * 1024, recordBytes: 2 * 1024 * 1024, recordsBytes: 32 * 1024 * 1024 };
const reject = code => { throw Object.assign(new Error(`Deployment Git inputs rejected: ${code}`), { code }); };
const json = value => Buffer.from(serialize(value));
const same = (a, b) => serialize(a) === serialize(b);
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const revision = value => typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
const decode = bytes => { try { return new TextDecoder("utf8", { fatal: true }).decode(bytes); } catch { reject("DEPLOYMENT_UTF8"); } };
const environment = () => ({ ...Object.fromEntries(Object.entries(process.env).filter(([name]) =>
  !name.startsWith("GIT_") && !name.startsWith("NODE_") && !/(?:TOKEN|SECRET|PASSWORD)$/.test(name))),
GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0", LC_ALL: "C" });

function command(owner, args, env, { input, maxBuffer = limits.metadataBytes } = {}) {
  try {
    return execFileSync("git", ["-c", "core.autocrlf=false", "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args],
      { cwd: owner, env, input, maxBuffer, timeout: 30000, stdio: ["pipe", "pipe", "pipe"] });
  } catch { reject("DEPLOYMENT_GIT_READ"); }
}
function cleanCheckout(owner, expected, env) {
  if (decode(command(owner, ["rev-parse", "--verify", "HEAD"], env)).trim() !== expected) reject("DEPLOYMENT_CHECKOUT_REVISION");
  if (command(owner, ["status", "--porcelain=v1", "-z", "--untracked-files=all"], env).length) reject("DEPLOYMENT_CHECKOUT_DIRTY");
  if (decode(command(owner, ["ls-files", "-v", "-z"], env)).split("\0").filter(Boolean).some(row => !row.startsWith("H "))) reject("DEPLOYMENT_CHECKOUT_INDEX_FLAGS");
}
function tree(owner, commit, env) {
  const rows = decode(command(owner, ["ls-tree", "-r", "-t", "-l", "-z", "--full-tree", commit], env)).split("\0").filter(Boolean);
  if (rows.length > limits.files) reject("DEPLOYMENT_TREE_FILE_BUDGET");
  const files = new Map(), directories = new Map(); let total = 0;
  for (const row of rows) {
    const match = /^(\d{6}) (\w+) ([a-f0-9]{40}) +([0-9]+|-)\t(.+)$/.exec(row);
    if (!match) reject("DEPLOYMENT_TREE_CONTRACT");
    const [, mode, type, oid, rawSize, name] = match, size = Number(rawSize);
    if (/[\u0000-\u001f\u007f]/.test(name) || path.isAbsolute(name) || name.split("/").some(part => !part || part === "." || part === "..")
      || files.has(name) || directories.has(name)) reject("DEPLOYMENT_TREE_PATH");
    if (type === "tree" && mode === "040000" && rawSize === "-") { directories.set(name, { path: name, mode, oid }); continue; }
    if (type !== "blob" || !["100644", "100755", "120000"].includes(mode)) reject("DEPLOYMENT_TREE_FILE_TYPE");
    if (!Number.isSafeInteger(size) || size < 0 || size > limits.fileBytes || (total += size) > limits.treeBytes) reject("DEPLOYMENT_TREE_BYTE_BUDGET");
    files.set(name, { path: name, mode, type, oid, bytes: size });
  }
  return { files, directories };
}

/** Read every unique blob once, with framing and budgets bound to the Git tree metadata. */
function blobs(owner, trees, env) {
  const objects = new Map(); let total = 0;
  for (const files of trees) for (const file of files.values()) {
    if (objects.has(file.oid)) {
      if (objects.get(file.oid) !== file.bytes) reject("DEPLOYMENT_OBJECT_CONTRACT");
    } else {
      objects.set(file.oid, file.bytes); total += file.bytes;
      if (total > limits.treeBytes) reject("DEPLOYMENT_TREE_BYTE_BUDGET");
    }
  }
  const output = command(owner, ["cat-file", "--batch"], env, {
    input: [...objects.keys()].map(oid => `${oid}\n`).join(""), maxBuffer: total + objects.size * 128 + 1,
  });
  const result = new Map(); let offset = 0;
  for (const [oid, size] of objects) {
    const end = output.indexOf(10, offset);
    if (end < offset || decode(output.subarray(offset, end)) !== `${oid} blob ${size}` || end + size + 1 >= output.length
      || output[end + size + 1] !== 10) reject("DEPLOYMENT_OBJECT_CONTRACT");
    result.set(oid, output.subarray(end + 1, end + size + 1)); offset = end + size + 2;
  }
  if (offset !== output.length) reject("DEPLOYMENT_OBJECT_CONTRACT");
  return result;
}
function records(files, objects) {
  const result = new Map(); let selection, total = 0;
  for (const file of files.values()) if (file.path === recordDirectory || file.path.startsWith(`${recordDirectory}/`)) {
    const name = file.path.slice(recordDirectory.length + 1);
    if (file.mode !== "100644" || file.type !== "blob") reject("DEPLOYMENT_RECORD_FILE_TYPE");
    if (name !== "current.json" && !/^[a-f0-9]{64}\.json$/.test(name)) reject("DEPLOYMENT_RECORD_NAME");
    const bytes = objects.get(file.oid); total += bytes.length;
    if (bytes.length > limits.recordBytes || total > limits.recordsBytes || (name !== "current.json" && result.size >= 1024)) reject("DEPLOYMENT_RECORD_BUDGET");
    if (name === "current.json") selection = bytes; else result.set(name, bytes);
  }
  return { records: result, selection };
}
async function verifyCheckoutFiles(owner, snapshot, objects) {
  for (const [name, directory] of snapshot.directories) {
    const filename = path.join(owner, name);
    let stat;
    try { stat = await lstat(filename); }
    catch (error) {
      if (error.code === "ENOENT" && directory.oid === "4b825dc642cb6eb9a060e54bf8d69288fbee4904") continue;
      reject("DEPLOYMENT_CHECKOUT_FILE_TYPE");
    }
    // Git does not materialize empty trees. They have no children and were compared separately.
    if (!stat.isDirectory() || await realpath(filename) !== filename) reject("DEPLOYMENT_CHECKOUT_FILE_TYPE");
  }
  for (const file of snapshot.files.values()) {
    const filename = path.join(owner, file.path), bytes = objects.get(file.oid);
    let stat; try { stat = await lstat(filename); } catch { reject("DEPLOYMENT_CHECKOUT_FILE_TYPE"); }
    if (file.mode === "120000") {
      if (!stat.isSymbolicLink() || !(await readlink(filename, { encoding: "buffer" })).equals(bytes)) reject("DEPLOYMENT_CHECKOUT_FILE_BYTES");
      continue;
    }
    if (!stat.isFile() || await realpath(filename) !== filename
      || ((stat.mode & 0o100) ? "100755" : "100644") !== file.mode) reject("DEPLOYMENT_CHECKOUT_FILE_TYPE");
    let handle;
    try {
      handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
      const actual = await handle.stat();
      if (!actual.isFile() || actual.size !== file.bytes) reject("DEPLOYMENT_CHECKOUT_FILE_BYTES");
      const chunk = Buffer.alloc(64 * 1024); let offset = 0;
      while (true) {
        const { bytesRead } = await handle.read(chunk, 0, Math.min(chunk.length, bytes.length - offset + 1), offset);
        if (!bytesRead) break;
        if (offset + bytesRead > bytes.length || !chunk.subarray(0, bytesRead).equals(bytes.subarray(offset, offset + bytesRead))) reject("DEPLOYMENT_CHECKOUT_FILE_BYTES");
        offset += bytesRead;
      }
      if (offset !== bytes.length) reject("DEPLOYMENT_CHECKOUT_FILE_BYTES");
    } catch (error) { if (error.code?.startsWith("DEPLOYMENT_")) throw error; reject("DEPLOYMENT_CHECKOUT_FILE_READ"); }
    finally { await handle?.close(); }
  }
}
function draft(rawFiles) {
  if (!(rawFiles instanceof Map) || rawFiles.size !== 4 || [...rawFiles.values()].some(bytes =>
    !Buffer.isBuffer(bytes) || !bytes.length || bytes.length > limits.recordBytes)) reject("DEPLOYMENT_REVIEW_FILES");
  const files = new Map([...rawFiles].map(([name, bytes]) => [name, Buffer.from(bytes)]));
  let dispatch, record, verified;
  try {
    dispatch = publicationDispatchSchema.parse(JSON.parse(decode(files.get("publication-dispatch.json"))));
    const names = [...files.keys()].filter(name => /^releases\/[a-f0-9]{64}\.json$/.test(name));
    if (names.length !== 1) reject("DEPLOYMENT_REVIEW_FILES");
    record = frozenReleaseSchema.parse(JSON.parse(decode(files.get(names[0]))));
    verified = publicationReviewFiles(dispatch, files.get("freeze-review.json"), files.get(names[0]), files.get("releases/current.json"));
    if (verified.size !== files.size || [...verified].some(([name, bytes]) => !files.get(name)?.equals(bytes))) reject("DEPLOYMENT_REVIEW_CANONICAL");
  } catch (error) {
    if (error.code?.startsWith("DEPLOYMENT_")) throw error;
    reject("DEPLOYMENT_REVIEW_CONTRACT");
  }
  return { dispatch, record, files, review: JSON.parse(decode(files.get("freeze-review.json"))) };
}
async function sourceFromIsolatedCommit(owner, commit, env, files, objects) {
  const parent = await mkdtemp(path.join(tmpdir(), "zeron-deployment-source-")), checkout = path.join(parent, "source");
  try {
    // Local shared objects avoid copying repository history; no remote or source checkout is changed.
    command(owner, ["clone", "--quiet", "--shared", "--no-checkout", "--no-tags", "--", owner, checkout], env);
    command(checkout, ["checkout", "--quiet", "--detach", commit], env); cleanCheckout(checkout, commit, env);
    const resolvedCheckout = await realpath(checkout);
    // A clean source link must resolve to a tracked blob, never an external file or clone metadata.
    for (const file of files.values()) if (file.mode === "120000") {
      let target;
      try { target = await realpath(path.join(checkout, file.path)); } catch { reject("DEPLOYMENT_SOURCE_FILE_REFERENCE"); }
      const relative = path.relative(resolvedCheckout, target), destination = files.get(relative);
      if (relative.startsWith("..") || path.isAbsolute(relative) || !destination || destination.mode === "120000"
        || !(await readFile(target)).equals(objects.get(destination.oid))) reject("DEPLOYMENT_SOURCE_FILE_REFERENCE");
    }
    let source;
    try {
      const bytes = execFileSync(process.execPath, ["--input-type=module", "-e",
        `import { sourceProvenance } from ${JSON.stringify(new URL("./agent-utils.mjs", import.meta.url).href)}; process.stdout.write(JSON.stringify(await sourceProvenance(process.argv[1])));`, checkout],
      { env, maxBuffer: 4096, timeout: 30000, stdio: ["ignore", "pipe", "pipe"] });
      source = frozenReleaseSchema.shape.source.parse(JSON.parse(decode(bytes)));
    } catch { reject("DEPLOYMENT_SOURCE_PROVENANCE"); }
    cleanCheckout(checkout, commit, env); return source;
  } finally { await rm(parent, { recursive: true, force: true }); }
}

/**
 * Git and draft-byte foundation only: never returns approval, a deployment pass or an activation.
 * repositoryRoot is an explicit local-fixture library option, not a production CLI parameter.
 */
export async function checkDeploymentGitInputs(input, { repositoryRoot = root } = {}) {
  if (!input || typeof input !== "object" || Object.keys(input).sort().join(",") !== "deploymentRevision,reviewFiles,sourceRevision"
    || !revision(input.sourceRevision) || !revision(input.deploymentRevision)) reject("DEPLOYMENT_INPUT_CONTRACT");
  const { sourceRevision, deploymentRevision } = input, material = draft(input.reviewFiles), env = environment();
  if (material.record.source.sourceRevision !== sourceRevision || material.dispatch.contentRevision !== sourceRevision) reject("DEPLOYMENT_REVIEW_SOURCE");
  const owner = await realpath(repositoryRoot);
  if (decode(command(owner, ["rev-parse", "--show-toplevel"], env)).trim() !== owner) reject("DEPLOYMENT_REPOSITORY_ROOT");
  for (const commit of [sourceRevision, deploymentRevision]) if (decode(command(owner,
    ["rev-parse", "--verify", "--end-of-options", `${commit}^{commit}`], env)).trim() !== commit) reject("DEPLOYMENT_COMMIT_OBJECT");
  cleanCheckout(owner, deploymentRevision, env);
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", sourceRevision, deploymentRevision],
      { cwd: owner, env, timeout: 30000, maxBuffer: 4096, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) { reject(error.status === 1 ? "DEPLOYMENT_SOURCE_ANCESTRY" : "DEPLOYMENT_GIT_READ"); }
  const sourceTree = tree(owner, sourceRevision, env), deploymentTree = tree(owner, deploymentRevision, env);
  const before = sourceTree.files, after = deploymentTree.files, objects = blobs(owner, [before, after], env);
  if (!same(material.dispatch.controls, readPublicationGitControls(sourceRevision, sourceRevision, { repositoryRoot: owner, gitEnvironment: env }))) reject("DEPLOYMENT_SOURCE_CONTROLS");
  const old = records(before, objects), current = records(after, objects), name = `${material.record.catalog.version}.json`;
  let predecessor;
  try { predecessor = selectCatalogPredecessor(old.records, old.selection, material.dispatch.predecessor); }
  catch { reject("DEPLOYMENT_PREDECESSOR_BASELINE"); }
  if (old.records.has(name)) reject("DEPLOYMENT_NEW_RECORD_REQUIRED");
  if (!same(material.review.predecessor, predecessor ? { approved: predecessor.reference, applicationSelection: predecessor.applicationSelection } : null)) {
    reject("DEPLOYMENT_PREDECESSOR_HANDOFF");
  }
  if (!same(material.record.history, predecessor?.history ?? [])) reject("DEPLOYMENT_HISTORY_BINDING");
  for (const [oldName, bytes] of old.records) if (!current.records.get(oldName)?.equals(bytes)) reject("DEPLOYMENT_OLD_RECORD_IMMUTABLE");
  if (current.records.size !== old.records.size + 1 || !current.records.get(name)?.equals(material.files.get(`releases/${name}`))
    || !current.selection?.equals(material.files.get("releases/current.json"))) reject("DEPLOYMENT_RECORD_HANDOFF");
  const allowed = new Set([`${recordDirectory}/${name}`, `${recordDirectory}/current.json`]);
  for (const name of new Set([...before.keys(), ...after.keys()])) {
    const oldFile = before.get(name), newFile = after.get(name);
    if (allowed.has(name)) continue;
    if (!oldFile || !newFile || oldFile.type !== newFile.type || oldFile.mode !== newFile.mode
      || !objects.get(oldFile.oid).equals(objects.get(newFile.oid))) reject("DEPLOYMENT_NON_RECORD_CHANGE");
  }
  const newRecordParents = new Set(["docs", "docs/agent-data", recordDirectory]);
  for (const name of new Set([...sourceTree.directories.keys(), ...deploymentTree.directories.keys()])) {
    if (!deploymentTree.directories.has(name) || (!sourceTree.directories.has(name) && !newRecordParents.has(name))) reject("DEPLOYMENT_NON_RECORD_CHANGE");
    if (name.startsWith(`${recordDirectory}/`)) reject("DEPLOYMENT_RECORD_NAME");
  }
  await verifyCheckoutFiles(owner, deploymentTree, objects);
  const source = await sourceFromIsolatedCommit(owner, sourceRevision, env, before, objects);
  if (!same(source, material.record.source)) reject("DEPLOYMENT_SOURCE_BINDING");
  cleanCheckout(owner, deploymentRevision, env);
  await verifyCheckoutFiles(owner, deploymentTree, objects);
  const treeReference = ({ files, directories }) => ({ files: files.size, directories: directories.size,
    sha256: sha256(json({ files: [...files.values()].map(file => ({ path: file.path, mode: file.mode, bytes: file.bytes,
      sha256: sha256(objects.get(file.oid)) })).sort((a, b) => a.path < b.path ? -1 : 1),
    directories: [...directories.values()].sort((a, b) => a.path < b.path ? -1 : 1) })) });
  return { schemaVersion: 1, kind: "agent-deployment-git-inputs", status: "verified-inputs",
    scope: "git-source-record-and-draft-bytes-not-g0-approval-or-deployment", source, deploymentRevision,
    tool: descriptor("scripts/agent-deployment-git.mjs", await readFile(fileURLToPath(import.meta.url))),
    sourceTree: treeReference(sourceTree), deploymentTree: treeReference(deploymentTree),
    reviewFiles: [...material.files].map(([name, bytes]) => descriptor(name, bytes)).sort((a, b) => a.path < b.path ? -1 : 1),
    records: [...current.records].map(([name, bytes]) => descriptor(name, bytes)).sort((a, b) => a.path < b.path ? -1 : 1),
    selection: descriptor("current.json", current.selection), predecessor: predecessor?.reference ?? null };
}
