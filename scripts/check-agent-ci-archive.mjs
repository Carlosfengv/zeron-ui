import { constants } from "node:fs";
import { lstat, mkdir, open, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { executionPathSchema, executionRoles, verifyExecutionArchive } from "./agent-execution-index.mjs";
import { exampleIds, exampleStateCases } from "./agent-example-sources.mjs";
import { installationInputSchema } from "./agent-release-record.mjs";
import { createInstallationOutput } from "./check-published-installation-input.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const outcomes = ["success", "failure", "cancelled", "skipped"];
const profiles = ["next-npm", "next-pnpm", "vite-npm", "vite-pnpm"];
const maxFileBytes = 32 * 1024 * 1024, maxTotalBytes = 256 * 1024 * 1024;
const reject = code => { throw Object.assign(new Error(`CI archive content check failed: ${code}`), { code }); };

export function parseCiArchiveArgs(args) {
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    if (!["--input", "--directory", "--stage", "--role", "--outcome"].includes(args[index]) || flags.has(args[index])
      || !args[index + 1] || args[index + 1].startsWith("--") || /[\r\n]/.test(args[index + 1])) reject("CI_ARCHIVE_ARGUMENTS");
    flags.set(args[index], args[index + 1]);
  }
  if (flags.size !== 5 || !Object.hasOwn(executionRoles, flags.get("--role")) || !outcomes.includes(flags.get("--outcome"))) reject("CI_ARCHIVE_ARGUMENTS");
  return { input: path.resolve(flags.get("--input")), directory: path.resolve(flags.get("--directory")), stage: path.resolve(flags.get("--stage")),
    role: flags.get("--role"), outcome: flags.get("--outcome") };
}

function allowedPath(name, role) {
  if (["failure.json", "execution-index.json", "input-verification.json", executionRoles[role].report].includes(name)) return true;
  if (["private-logs/reference-manager-version.json", "private-logs/cli-reference.json"].includes(name)) return true;
  const parts = name.split("/");
  if (parts[0] === "private-logs" && parts.length === 3 && profiles.includes(parts[1])) {
    const steps = ["manager-version", "bootstrap", "cli-version", "dry-run", "install", "types", "build"];
    if (parts[1].startsWith("vite-")) steps.push("next-only-rejection");
    if (role === "examples") steps.push("browser-process", "preview");
    return steps.some(step => parts[2] === `${step}.json`);
  }
  if (role === "consumer") return profiles.some(profile => name === `${profile}.evidence.json`);
  if (name === "example-sources.json" || profiles.some(profile => name === `${profile}.execution.json`)) return true;
  if (parts.length === 2 && parts[0] === "attachments") return /^[a-f0-9]{64}\.(?:json|png)$/.test(parts[1]);
  if (parts.length === 2 && profiles.some(profile => parts[0] === `${profile}-browser`)) {
    const names = ["observations.json", "private-observations.json", "failure.json"];
    for (const id of exampleIds) names.push(`${id}.observations.json`, `${id}-390.png`, `${id}-1440.png`,
      ...[...exampleStateCases[id], "keyboard", "viewport-390", "viewport-1440"].map(check => `${id}-${check}-failure.png`));
    return names.includes(parts[1]);
  }
  return false;
}

async function readRegular(filename, maxBytes, deadline) {
  if (Date.now() >= deadline) reject("CI_ARCHIVE_CHECK_TIMEOUT");
  const handle = await open(filename, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1 || before.size > maxBytes) reject("CI_ARCHIVE_FILE_TYPE_OR_BUDGET");
    const chunks = []; let size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      size += chunk.length;
      if (size > maxBytes || size > before.size) reject("CI_ARCHIVE_FILE_CHANGED_OR_BUDGET");
      if (Date.now() >= deadline) reject("CI_ARCHIVE_CHECK_TIMEOUT");
      chunks.push(chunk);
    }
    const after = await handle.stat();
    if (size !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs
      || after.nlink !== 1) reject("CI_ARCHIVE_FILE_CHANGED_OR_BUDGET");
    return Buffer.concat(chunks);
  } finally { await handle.close(); }
}

async function readInventory(directory, role, deadline) {
  if (!(await lstat(directory)).isDirectory()) reject("CI_ARCHIVE_DIRECTORY_TYPE");
  const owner = await realpath(directory), files = new Map(); let entries = 0, total = 0;
  async function visit(relative = "") {
    const target = path.join(owner, relative);
    if (Date.now() >= deadline) reject("CI_ARCHIVE_CHECK_TIMEOUT");
    if (await realpath(target) !== target) reject("CI_ARCHIVE_SYMLINK");
    for (const entry of await readdir(target, { withFileTypes: true })) {
      if (++entries > 1024) reject("CI_ARCHIVE_ENTRY_BUDGET");
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (!executionPathSchema.safeParse(name).success) reject("CI_ARCHIVE_PATH");
      if (entry.isDirectory()) {
        const directories = ["private-logs", ...profiles.map(profile => `private-logs/${profile}`),
          ...(role === "examples" ? ["attachments", ...profiles.map(profile => `${profile}-browser`)] : [])];
        if (!directories.includes(name)) reject("CI_ARCHIVE_PATH");
        await visit(name);
      } else {
        if (!entry.isFile() || !allowedPath(name, role)) reject("CI_ARCHIVE_PATH_OR_TYPE");
        const filename = path.join(owner, name);
        if (await realpath(filename) !== filename) reject("CI_ARCHIVE_SYMLINK");
        const bytes = await readRegular(filename, Math.min(maxFileBytes, maxTotalBytes - total), deadline);
        total += bytes.length; files.set(name, bytes);
      }
    }
  }
  await visit();
  if (!files.size) reject("CI_ARCHIVE_EMPTY");
  return files;
}

function canonicalJson(bytes) {
  let value;
  try { value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
  catch { reject("CI_ARCHIVE_JSON"); }
  if (!bytes.equals(Buffer.from(serialize(value)))) reject("CI_ARCHIVE_JSON_CANONICAL");
  return value;
}

function secretVariants(secrets) {
  if (!Array.isArray(secrets) || secrets.length > 8 || secrets.some(value => typeof value !== "string" || value.length > 8192)) reject("CI_ARCHIVE_SECRET_CONFIG");
  return [...new Set(secrets.filter(Boolean).flatMap(value => [value, encodeURIComponent(value), Buffer.from(value).toString("base64"),
    Buffer.from(value).toString("base64url"), Buffer.from(value).toString("hex"), JSON.stringify(value).slice(1, -1)]))];
}
const credentialText = /(?:-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----|\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|vercel_blob_[A-Za-z0-9_]+)|\b(?:authorization\s*[:=]\s*["']?\s*(?:bearer|basic)\s+\S+|(?:_authToken|BLOB_READ_WRITE_TOKEN|GITHUB_TOKEN|AGENT_CI_READ_TOKEN)\s*[:=]\s*["']?[^\s"']+))/i;
const credentialKey = /^(?:authorization|proxy-authorization|cookie|set-cookie|_authToken|password|secret|api[-_]?key|BLOB_READ_WRITE_TOKEN|GITHUB_TOKEN|AGENT_CI_READ_TOKEN)$/i;
function credentialUrl(text) {
  for (const match of text.matchAll(/https?:\/\/[^\s"'<>]+/g)) {
    let url; try { url = new URL(match[0]); } catch { continue; }
    if (url.username || url.password || [...url.searchParams.keys()].some(key => /^(?:sig|signature|token|access_token|x-amz-[a-z-]+|x-goog-[a-z-]+|se|sp|sv)$/i.test(key))) return true;
  }
  return false;
}

/** Reusable bounded JSON content check; callers still enforce their own fixed schemas/file sets. */
export function checkPublicCiJson(bytes, secrets = [], maxBytes = 2 * 1024 * 1024) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > maxFileBytes
    || !Buffer.isBuffer(bytes) || bytes.length > maxBytes) reject("CI_ARCHIVE_BYTE_BUDGET");
  const variants = secretVariants(secrets), value = canonicalJson(bytes), pending = [value];
  if (variants.some(value => bytes.includes(Buffer.from(value)))) reject("CI_ARCHIVE_CREDENTIAL_CONTENT");
  while (pending.length) {
    const item = pending.pop();
    if (typeof item === "string") {
      if (credentialText.test(item) || credentialUrl(item) || variants.some(value => item.includes(value))) reject("CI_ARCHIVE_CREDENTIAL_CONTENT");
    } else if (item && typeof item === "object") {
      for (const [key, child] of Object.entries(item)) {
        if (credentialKey.test(key) && child !== null && child !== "") reject("CI_ARCHIVE_CREDENTIAL_CONTENT");
        pending.push(key); pending.push(child);
      }
    }
  }
  return value;
}

function checkPng(bytes) {
  if (bytes.length > 8 * 1024 * 1024 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) reject("CI_ARCHIVE_PNG");
  let offset = 8, ended = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) reject("CI_ARCHIVE_PNG");
    const length = bytes.readUInt32BE(offset), type = bytes.toString("ascii", offset + 4, offset + 8);
    if (offset + length + 12 > bytes.length || !["IHDR", "IDAT", "IEND", "sRGB", "gAMA", "cHRM", "pHYs"].includes(type)) reject("CI_ARCHIVE_PNG_METADATA");
    offset += length + 12;
    if (type === "IEND") { if (length || offset !== bytes.length) reject("CI_ARCHIVE_PNG"); ended = true; }
  }
  if (!ended) reject("CI_ARCHIVE_PNG");
}

/** Fixed producer content checks, not general DLP, human review, installation pass, or a CI attestation. Never rewrites evidence. */
export function checkCiArchiveContent(files, { role, outcome, input, secrets = [] }) {
  if (!Object.hasOwn(executionRoles, role) || !outcomes.includes(outcome) || !(files instanceof Map) || !files.size || files.size > 1024) reject("CI_ARCHIVE_CONTRACT");
  if ([...files.values()].some(bytes => !Buffer.isBuffer(bytes) || bytes.length > maxFileBytes)
    || [...files.values()].reduce((sum, bytes) => sum + bytes.length, 0) > maxTotalBytes) reject("CI_ARCHIVE_BYTE_BUDGET");
  const variants = secretVariants(secrets); let total = 0;
  for (const [name, bytes] of files) {
    if (!executionPathSchema.safeParse(name).success || !allowedPath(name, role) || !Buffer.isBuffer(bytes)) reject("CI_ARCHIVE_PATH_OR_TYPE");
    total += bytes.length;
    if (bytes.length > maxFileBytes || total > maxTotalBytes) reject("CI_ARCHIVE_BYTE_BUDGET");
    if (variants.some(value => bytes.includes(Buffer.from(value)))) reject("CI_ARCHIVE_CREDENTIAL_CONTENT");
    if (name.endsWith(".png")) checkPng(bytes);
    else {
      checkPublicCiJson(bytes, secrets, maxFileBytes);
    }
  }
  if (outcome === "success") {
    if (files.has("failure.json")) reject("CI_ARCHIVE_SUCCESS_WITH_FAILURE");
    verifyExecutionArchive(files, { role, input, requirePublished: true });
  } else if (![...files.keys()].some(name => name.endsWith("/failure.json") || name === "failure.json" || name.startsWith("private-logs/"))) {
    reject("CI_ARCHIVE_DIAGNOSTICS_MISSING");
  }
  return { status: "checked-public-ci-material", scope: "fixed-producer-content-check-not-a-ci-attestation", role, outcome,
    files: files.size, bytes: total, inventorySha256: sha256(serialize([...files].sort(([a], [b]) => a.localeCompare(b, "en"))
      .map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) })))) };
}

export async function checkAgentCiArchive(args) {
  const options = parseCiArchiveArgs(args), deadline = Date.now() + 120000;
  if (Number(process.versions.node.split(".")[0]) !== 22) reject("NODE_22_REQUIRED");
  const input = installationInputSchema.parse(canonicalJson(await readRegular(options.input, 2 * 1024 * 1024, deadline)));
  const files = await readInventory(options.directory, options.role, deadline);
  const result = checkCiArchiveContent(files, { ...options, input, secrets: [process.env.BLOB_READ_WRITE_TOKEN, process.env.GITHUB_TOKEN, process.env.AGENT_CI_READ_TOKEN].filter(Boolean) });
  // Stage the checked original bytes at an exclusive path. Upload cannot follow later changes to producer output.
  await createInstallationOutput(options.stage, { excludeDirectories: [options.directory] });
  for (const [name, bytes] of files) {
    if (Date.now() >= deadline) reject("CI_ARCHIVE_CHECK_TIMEOUT");
    const filename = path.join(options.stage, name); await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
    await writeFile(filename, bytes, { flag: "wx", mode: 0o400 });
  }
  const staged = await readInventory(options.stage, options.role, deadline);
  if (staged.size !== files.size || [...files].some(([name, bytes]) => !staged.get(name)?.equals(bytes))) reject("CI_ARCHIVE_STAGE_BYTES");
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkAgentCiArchive(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(/^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? `CI archive content check failed: ${error.code}` : "CI archive content check failed: INVALID_INPUT_OR_FILES");
    process.exitCode = 1;
  });
}
