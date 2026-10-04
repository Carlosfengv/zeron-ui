import { z } from "zod";
import { Unzlib } from "fflate";
import { artifactFileUrl, artifactOrigin } from "./agent-artifacts.mjs";
import { installationInputSchema, publicByteReferenceSchema, publishedInstallationVerificationSchema } from "./agent-release-record.mjs";
import { adaptExampleImports, exampleHostEntry, exampleIds, exampleProfileSchema, exampleSourceManifestSchema,
  exampleSourcesSha256, exampleStateCases, createExampleSourceManifest } from "./agent-example-sources.mjs";
import { fixtureManagers } from "./published-consumer-runtime.mjs";
import { ArtifactDownloadError, downloadArtifact } from "./download-agent-artifact.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const reference = publicByteReferenceSchema.extend({ bytes: z.number().int().positive().max(8 * 1024 * 1024) });
const id = z.string().regex(/^[a-z][a-z-]*:[a-z0-9][a-z0-9-]*$/);
const names = z.array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/)).min(1).max(1024);
const identity = z.object({ path: z.string().max(256), bytes: z.number().int().nonnegative().max(2 * 1024 * 1024), sha256: hash }).strict();
const assertion = z.object({ name: z.string().trim().min(1).max(128), passed: z.literal(true) }).strict();
const assertions = z.array(assertion).min(1).max(64).refine(rows => new Set(rows.map(row => row.name)).size === rows.length);
const browser = z.object({ name: z.string().trim().min(1).max(64), version: z.string().trim().min(1).max(128) }).strict();
const matrix = publishedInstallationVerificationSchema.shape.matrices.element;
export const exampleEvidenceBindingSchema = z.object({
  source: installationInputSchema.shape.source, inputSha256: hash, exampleSourcesSha256: hash,
  cli: publishedInstallationVerificationSchema.shape.cli,
  registry: installationInputSchema.shape.registry, skill: installationInputSchema.shape.skill,
}).strict();
const viewport = z.object({ width: z.union([z.literal(390), z.literal(1440)]), evidence: reference, screenshot: reference }).strict();
export const exampleEvidenceRowSchema = exampleProfileSchema.extend({
  exampleId: z.enum(exampleIds), nodeVersion: matrix.shape.nodeVersion, frameworkVersion: matrix.shape.frameworkVersion,
  packageManagerVersion: matrix.shape.packageManagerVersion, templateSha256: hash, initialLockfileSha256: hash,
  finalLockfileSha256: hash, finalProjectSha256: hash, cliOwnFilesSha256: hash, installedStateSha256: hash,
  adoptedItems: z.array(id).min(1).max(64), registryClosure: names,
  materialized: z.object({ files: z.array(identity).min(1).max(64), entry: identity }).strict(),
  checks: z.object({ install: reference, types: reference, build: reference, states: reference, keyboard: reference,
    viewports: z.array(viewport).length(2) }).strict(),
}).strict();
export const exampleVerificationSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("published-example-verification"),
  binding: exampleEvidenceBindingSchema, sourceManifest: exampleSourceManifestSchema,
  rows: z.array(exampleEvidenceRowSchema).min(3).max(12),
}).strict();
const caseResult = z.discriminatedUnion("status", [
  z.object({ caseId: z.string(), status: z.literal("passed"), assertions }).strict(),
  z.object({ caseId: z.literal("empty"), status: z.literal("not-applicable"), reason: z.string().min(8).max(256) }).strict(),
]);
const commandResult = z.object({ command: z.array(z.string().min(1).max(256)).length(3), exitCode: z.literal(0) }).strict();
const installResult = z.object({ adoptedItems: z.array(id).min(1).max(64), registryClosure: names,
  cliOwnFilesSha256: hash, installedStateSha256: hash, finalLockfileSha256: hash,
  officialCliBytes: z.literal(true), managerAndLockfile: z.literal(true), themeInstalled: z.literal(true), compiledTheme: z.literal(true) }).strict();
const statesResult = z.object({ cases: z.array(caseResult).min(1).max(32) }).strict();
const keyboardResult = z.object({ browser, steps: z.array(z.object({ key: z.enum(["Tab", "Shift+Tab", "Enter", "Space", "ArrowDown", "ArrowUp", "Escape"]),
  target: z.string().trim().min(1).max(256) }).strict()).min(2).max(128), assertions }).strict();
const viewportResult = z.object({ browser, width: z.union([z.literal(390), z.literal(1440)]), height: z.number().int().min(320).max(2160),
  horizontalOverflow: z.literal(false), focusVisible: z.literal(true), screenshot: reference, assertions }).strict();
const proofHeader = z.object({ schemaVersion: z.literal(1), kind: z.literal("agent-example-check"), bindingSha256: hash,
  exampleId: z.enum(exampleIds), framework: exampleProfileSchema.shape.framework, packageManager: exampleProfileSchema.shape.packageManager,
  finalProjectSha256: hash });
export const exampleCheckProofSchema = z.discriminatedUnion("check", [
  ...[["install", installResult], ["types", commandResult], ["build", commandResult], ["states", statesResult], ["keyboard", keyboardResult],
    ["viewport", viewportResult]].map(([check, result]) => proofHeader.extend({ check: z.literal(check), result }).strict()),
]);
export class ExampleEvidenceError extends Error {
  constructor(code) { super(`Agent example evidence failed: ${code}`); this.code = code; }
}
const fail = code => { throw new ExampleEvidenceError(code); };
const same = (left, right) => serialize(left) === serialize(right);
const rowKey = row => `${row.exampleId}:${row.framework}:${row.packageManager}`;
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
export function exampleEvidenceReference(origin, bytes, extension = "json") {
  origin = artifactOrigin(origin);
  if (!["json", "png"].includes(extension)) fail("ATTACHMENT_FORMAT");
  if (!Buffer.isBuffer(bytes) || bytes.length > (extension === "json" ? 1024 * 1024 : 8 * 1024 * 1024)) fail("ATTACHMENT_SIZE");
  return reference.parse({ url: `${origin}/evidence/examples/${sha256(bytes)}.${extension}`, bytes: bytes.length, sha256: sha256(bytes) });
}

/** Construct only the fixed binding; it establishes neither execution nor publication. */
export function exampleEvidenceBinding(prepared, manifest) {
  const input = installationInputSchema.parse(prepared.input);
  const cli = publishedInstallationVerificationSchema.shape.cli.parse(prepared.npm.cli);
  if (!same(input.cli, { name: cli.name, version: cli.version, distIntegrity: cli.distIntegrity })
    || cli.tarballUrl !== `https://registry.npmjs.org/zeron-ui/-/zeron-ui-${cli.version}.tgz`) fail("CLI_BINDING");
  return exampleEvidenceBindingSchema.parse({ source: input.source, inputSha256: sha256(serialize(input)),
    exampleSourcesSha256: exampleSourcesSha256(manifest), cli, registry: input.registry, skill: input.skill });
}

function sourceInventory(manifest, sources) {
  if (!same(manifest, exampleSourceManifestSchema.parse(sources.manifest))) fail("SOURCE_MANIFEST");
  if (!(sources.files instanceof Map) || !same([...sources.files.keys()].sort(), manifest.files.map(file => file.path))
    || !Buffer.isBuffer(sources.declaration) || sources.declaration.length !== manifest.declaration.bytes
    || sha256(sources.declaration) !== manifest.declaration.sha256) fail("SOURCE_BYTES");
  let declaration;
  try { declaration = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(sources.declaration)); }
  catch { fail("SOURCE_DECLARATION"); }
  if (!same(declaration, manifest.declarations)) fail("SOURCE_DECLARATION");
  for (const file of manifest.files) {
    const bytes = sources.files.get(file.path);
    if (!Buffer.isBuffer(bytes) || bytes.length !== file.bytes || sha256(bytes) !== file.sha256) fail("SOURCE_BYTES");
  }
  if (!same(createExampleSourceManifest(sources.declaration, sources.files, manifest.hostRegistryItems), manifest)) fail("SOURCE_IMPORT_GRAPH");
}

export function exampleRegistryClosure(prepared, manifest, framework) {
  const input = prepared.input;
  const byName = new Map(prepared.scope.items.map(item => [item.name, item]));
  const registryBase = `${input.artifactBaseUrl}/r/releases/${input.registry.releaseId}`;
  const dependencies = new Map([...byName.keys()].map(name => [artifactFileUrl(registryBase, `${name}.json`), name]));
  const visited = new Set();
  const visit = name => {
    if (visited.has(name)) return;
    const item = byName.get(name);
    if (!item || !["react", framework].includes(item.meta?.zeron?.framework)) fail("REGISTRY_CLOSURE");
    visited.add(name);
    for (const dependency of item.registryDependencies ?? []) {
      const target = dependencies.get(dependency);
      if (!target) fail("REGISTRY_CLOSURE");
      visit(target);
    }
  };
  for (const item of manifest.hostRegistryItems) {
    if (!input.items.some(identity => identity.id === item.itemId && identity.registryName === item.registryName)) fail("REGISTRY_IDENTITY");
    visit(item.registryName);
  }
  return [...visited].sort();
}

function readProof(referenceValue, attachments, binding, row, check) {
  const bytes = attachments.get(referenceValue.url);
  if (!Buffer.isBuffer(bytes) || bytes.length > 1024 * 1024
    || !same(referenceValue, exampleEvidenceReference(new URL(referenceValue.url).origin, bytes))) fail("ATTACHMENT_BYTES");
  let proof;
  try { proof = exampleCheckProofSchema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))); }
  catch { fail("CHECK_PROOF"); }
  if (!bytes.equals(Buffer.from(serialize(proof)))) fail("CHECK_CANONICAL_BYTES");
  if (proof.bindingSha256 !== sha256(serialize(binding)) || proof.exampleId !== row.exampleId || proof.framework !== row.framework
    || proof.packageManager !== row.packageManager || proof.finalProjectSha256 !== row.finalProjectSha256 || proof.check !== check) fail("CHECK_BINDING");
  return proof.result;
}

function checkCases(row, declaration, result) {
  if (!same(result.cases.map(value => value.caseId).sort(), [...exampleStateCases[row.exampleId]].sort())) fail("STATE_COVERAGE");
  for (const item of result.cases) {
    const reason = declaration.notApplicable[item.caseId];
    if (reason ? item.status !== "not-applicable" || item.reason !== reason : item.status !== "passed") fail("STATE_APPLICABILITY");
  }
}
const keyboardAssertions = {
  "resource-list": ["filter", "open-detail", "return-context"],
  "resource-detail": ["edit", "save", "back"], settings: ["edit", "save", "reset"],
};
const crcTable = Uint32Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = (value >>> 1) ^ ((value & 1) ? 0xedb88320 : 0);
  return value;
});
function screenshotBytes(value, attachments, origin, width, height) {
  const bytes = attachments.get(value.url);
  if (!Buffer.isBuffer(bytes) || !same(value, exampleEvidenceReference(origin, bytes, "png")) || bytes.length < 33
    || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    || bytes.readUInt32BE(8) !== 13 || bytes.toString("ascii", 12, 16) !== "IHDR"
    || bytes.readUInt32BE(16) !== width || bytes.readUInt32BE(20) !== height) fail("SCREENSHOT_BYTES");
  // Browser screenshots are non-interlaced, 8-bit RGB/RGBA. Verify complete chunks
  // and bounded decoded rows so a PNG signature alone cannot stand in for an image.
  if (bytes[24] !== 8 || ![2, 6].includes(bytes[25]) || bytes[26] || bytes[27] || bytes[28]) fail("SCREENSHOT_FORMAT");
  const compressed = [];
  let ended = false;
  let closedData = false;
  for (let offset = 8; offset < bytes.length;) {
    if (offset + 12 > bytes.length) fail("SCREENSHOT_BYTES");
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) fail("SCREENSHOT_BYTES");
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    let crc = 0xffffffff;
    for (const byte of bytes.subarray(offset + 4, end - 4)) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
    if ((crc ^ 0xffffffff) >>> 0 !== bytes.readUInt32BE(end - 4) || !/^[A-Za-z]{4}$/.test(type)) fail("SCREENSHOT_BYTES");
    if (type === "IHDR" && offset !== 8) fail("SCREENSHOT_BYTES");
    if (type === "IDAT") {
      if (closedData) fail("SCREENSHOT_BYTES");
      compressed.push(bytes.subarray(offset + 8, end - 4));
    }
    else if (type === "IEND") {
      if (length || end !== bytes.length || !compressed.length) fail("SCREENSHOT_BYTES");
      ended = true;
    } else if (type !== "IHDR" && type[0] === type[0].toUpperCase()) fail("SCREENSHOT_FORMAT");
    if (compressed.length && type !== "IDAT") closedData = true;
    offset = end;
  }
  if (!ended) fail("SCREENSHOT_BYTES");
  const stride = width * (bytes[25] === 6 ? 4 : 3) + 1;
  let decoded = 0;
  let finished = false;
  let adlerA = 1;
  let adlerB = 0;
  const data = Buffer.concat(compressed);
  if (data.length < 6 || (data[0] & 15) !== 8 || (data[0] >>> 4) > 7 || (data[1] & 32)
    || ((data[0] << 8) + data[1]) % 31) fail("SCREENSHOT_BYTES");
  try {
    const inflate = new Unzlib((chunk, final) => {
      if (decoded + chunk.length > stride * height) fail("SCREENSHOT_DECODE_BUDGET");
      for (let offset = (stride - decoded % stride) % stride; offset < chunk.length; offset += stride) {
        if (chunk[offset] > 4) fail("SCREENSHOT_FORMAT");
      }
      for (let start = 0; start < chunk.length; start += 5552) {
        for (let offset = start; offset < Math.min(start + 5552, chunk.length); offset++) { adlerA += chunk[offset]; adlerB += adlerA; }
        adlerA %= 65521; adlerB %= 65521;
      }
      decoded += chunk.length; finished = final;
    });
    for (let offset = 0; offset < data.length; offset += 1024) inflate.push(data.subarray(offset, offset + 1024), offset + 1024 >= data.length);
  } catch { fail("SCREENSHOT_BYTES"); }
  if (!finished || decoded !== stride * height || ((adlerB << 16) | adlerA) >>> 0 !== data.readUInt32BE(data.length - 4)) fail("SCREENSHOT_BYTES");
}
function rowReferences(row) {
  return [row.checks.install, row.checks.types, row.checks.build, row.checks.states, row.checks.keyboard,
    ...row.checks.viewports.flatMap(view => [view.evidence, view.screenshot])];
}

function reportContext(prepared, sources, value) {
  const report = exampleVerificationSchema.parse(value);
  const manifest = report.sourceManifest;
  const binding = exampleEvidenceBinding(prepared, manifest);
  if (!same(report.binding, binding)) fail("INPUT_BINDING");
  sourceInventory(manifest, sources);
  const expected = manifest.declarations.examples.flatMap(example => example.profiles.map(profile => rowKey({ ...profile, exampleId: example.exampleId })));
  if (!same(report.rows.map(rowKey), expected)) fail("EXAMPLE_PROFILE_COVERAGE");
  for (const row of report.rows) {
    const declaration = manifest.declarations.examples.find(example => example.exampleId === row.exampleId);
    if (!row.nodeVersion.startsWith("22.") || row.packageManagerVersion !== fixtureManagers[row.packageManager]
      || !same(row.adoptedItems, declaration.adoptedItems) || !same(row.registryClosure, exampleRegistryClosure(prepared, manifest, row.framework))) fail("CONSUMER_SCOPE");
    const mapped = manifest.files.map(file => descriptor(`examples/${file.path}`, /\.(ts|tsx)$/.test(file.path)
      ? adaptExampleImports(sources.files.get(file.path), file.path, row.framework) : sources.files.get(file.path)));
    const host = exampleHostEntry(manifest, row.framework);
    if (!same(row.materialized, { files: mapped, entry: descriptor(host.path, host.content) })) fail("MATERIALIZED_BYTES");
    if (!same(row.checks.viewports.map(view => view.width), [390, 1440])) fail("VIEWPORT_COVERAGE");
    const json = [row.checks.install, row.checks.types, row.checks.build, row.checks.states, row.checks.keyboard,
      ...row.checks.viewports.map(view => view.evidence)];
    if (json.some(ref => !ref.url.endsWith(".json") || ref.bytes > 1024 * 1024)
      || row.checks.viewports.some(view => !view.screenshot.url.endsWith(".png"))) fail("ATTACHMENT_FORMAT");
  }
  return { report, binding };
}

/** Raw source, mapped bytes, complete rows and all raw attachments must agree before any writer runs. */
export function validateExampleEvidenceBatch(prepared, sources, value, attachments) {
  const { report, binding } = reportContext(prepared, sources, value);
  const manifest = report.sourceManifest;
  if (!(attachments instanceof Map)) fail("ATTACHMENT_INVENTORY");
  const references = new Map();
  const verifiedScreenshots = new Set();
  for (const row of report.rows) for (const item of rowReferences(row)) {
    if (new URL(item.url).origin !== prepared.input.artifactBaseUrl) fail("ATTACHMENT_ORIGIN");
    if (references.has(item.url) && !same(references.get(item.url), item)) fail("ATTACHMENT_REFERENCE_CONFLICT");
    references.set(item.url, item);
  }
  if (references.size > 128 || !same([...references.keys()].sort(), [...attachments.keys()].sort())
    || [...references.values()].reduce((sum, item) => sum + item.bytes, 0) > 128 * 1024 * 1024) fail("ATTACHMENT_INVENTORY");
  for (const row of report.rows) {
    const declaration = manifest.declarations.examples.find(example => example.exampleId === row.exampleId);
    const installed = readProof(row.checks.install, attachments, binding, row, "install");
    for (const [key, expected] of Object.entries({ adoptedItems: manifest.hostAdoptedItems, registryClosure: row.registryClosure,
      cliOwnFilesSha256: row.cliOwnFilesSha256, installedStateSha256: row.installedStateSha256, finalLockfileSha256: row.finalLockfileSha256 })) {
      if (!same(installed[key], expected)) fail("INSTALLATION_BINDING");
    }
    for (const check of ["types", "build"]) {
      if (!same(readProof(row.checks[check], attachments, binding, row, check).command, [row.packageManager, "run", check])) fail("COMMAND_SCOPE");
    }
    checkCases(row, declaration, readProof(row.checks.states, attachments, binding, row, "states"));
    const keyboard = readProof(row.checks.keyboard, attachments, binding, row, "keyboard");
    if (!same(keyboard.assertions.map(item => item.name).sort(), [...keyboardAssertions[row.exampleId]].sort())
      || !keyboard.steps.some(step => step.key.includes("Tab")) || !keyboard.steps.some(step => ["Enter", "Space"].includes(step.key))) fail("KEYBOARD_COVERAGE");
    for (const view of row.checks.viewports) {
      const result = readProof(view.evidence, attachments, binding, row, "viewport");
      if (result.width !== view.width || !same(result.screenshot, view.screenshot) || !same(result.browser, keyboard.browser)) fail("VIEWPORT_BINDING");
      const key = `${view.screenshot.url}:${result.width}:${result.height}`;
      if (!verifiedScreenshots.has(key)) {
        screenshotBytes(view.screenshot, attachments, prepared.input.artifactBaseUrl, result.width, result.height);
        verifiedScreenshots.add(key);
      }
    }
  }
  return { scope: "validated-example-evidence-not-publication-or-execution-proof", report,
    objects: [...references.values()].map(reference => ({ reference, bytes: attachments.get(reference.url) })) };
}

/** Anonymous bounded public readback, followed by the same full validation. No runtime coverage is promoted here. */
export async function readExampleVerification(prepared, sources, value, { fetcher = fetch, timeoutMs = 12000,
  maxDurationMs = 600000, maxTotalBytes = 128 * 1024 * 1024, downloadOptions = {} } = {}) {
  const { report } = reportContext(prepared, sources, value);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12000 || !Number.isInteger(maxDurationMs)
    || maxDurationMs < 1 || maxDurationMs > 600000 || !Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 1
    || maxTotalBytes > 128 * 1024 * 1024) fail("READ_BUDGET");
  const refs = new Map();
  for (const row of report.rows) for (const item of rowReferences(row)) {
    if (new URL(item.url).origin !== prepared.input.artifactBaseUrl) fail("ATTACHMENT_ORIGIN");
    const extension = item.url.endsWith(".png") ? "png" : "json";
    if (item.url !== `${prepared.input.artifactBaseUrl}/evidence/examples/${item.sha256}.${extension}`) fail("ATTACHMENT_LOCATION");
    if (refs.has(item.url) && !same(refs.get(item.url), item)) fail("ATTACHMENT_REFERENCE_CONFLICT");
    refs.set(item.url, item);
  }
  if (refs.size > 128 || [...refs.values()].reduce((sum, item) => sum + item.bytes, 0) > maxTotalBytes) fail("READ_BUDGET");
  const deadline = Date.now() + maxDurationMs;
  let consumed = 0;
  const attachments = new Map();
  for (const item of refs.values()) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) fail("READ_TIMEOUT");
    attachments.set(item.url, await downloadArtifact(item.url, { ...downloadOptions, fetcher, origin: prepared.input.artifactBaseUrl,
      bytes: item.bytes, hash: item.sha256, maxBytes: item.url.endsWith(".png") ? 8 * 1024 * 1024 : 1024 * 1024,
      timeoutMs: Math.min(timeoutMs, remaining), maxDurationMs: Math.min(90000, remaining), allowMissing: false,
      onBytes: size => { consumed += size; if (consumed > maxTotalBytes) fail("READ_BUDGET"); } }));
  }
  return { ...validateExampleEvidenceBatch(prepared, sources, report, attachments), scope: "public-example-attachments-verified-not-execution-proof", consumedBytes: consumed };
}

/** Validate the complete batch first; reuse only identical public bytes, never overwrite. */
export async function publishExampleEvidence(prepared, sources, value, attachments, { writer, fetcher = fetch,
  timeoutMs = 12000, maxDurationMs = 600000, maxTotalBytes = 128 * 1024 * 1024, downloadOptions = {} } = {}) {
  if (typeof writer !== "function" || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12000
    || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 600000
    || !Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 1 || maxTotalBytes > 128 * 1024 * 1024) fail("WRITE_BUDGET");
  const batch = validateExampleEvidenceBatch(prepared, sources, value, attachments);
  if (batch.objects.reduce((sum, item) => sum + item.reference.bytes, 0) > maxTotalBytes) fail("WRITE_BUDGET");
  const deadline = Date.now() + maxDurationMs;
  const readback = new Map();
  let consumed = 0;
  const remaining = () => { const ms = deadline - Date.now(); if (ms <= 0) fail("WRITE_TIMEOUT"); return ms; };
  for (const item of batch.objects) {
    const ref = item.reference;
    const read = allowMissing => downloadArtifact(ref.url, { ...downloadOptions, fetcher, origin: prepared.input.artifactBaseUrl,
      bytes: ref.bytes, hash: ref.sha256, maxBytes: ref.url.endsWith(".png") ? 8 * 1024 * 1024 : 1024 * 1024,
      timeoutMs: Math.min(timeoutMs, remaining()), maxDurationMs: Math.min(90000, remaining()), allowMissing,
      onBytes: size => { consumed += size; if (consumed > maxTotalBytes) fail("WRITE_BUDGET"); } });
    let publicBytes = await read(true);
    if (!publicBytes) {
      const controller = new AbortController();
      let timer;
      let writeFailed = false;
      try {
        const expiry = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new ExampleEvidenceError("WRITE_TIMEOUT")); }, Math.min(timeoutMs, remaining())); });
        const result = await Promise.race([writer(new URL(ref.url).pathname.slice(1), item.bytes, {
          access: "public", addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 31536000,
          contentType: ref.url.endsWith(".png") ? "image/png" : "application/json", abortSignal: controller.signal,
        }), expiry]);
        if (result?.url !== ref.url) fail("UPLOAD_URL");
      } catch (error) {
        if (error.code === "UPLOAD_URL") throw error;
        writeFailed = true;
      } finally { clearTimeout(timer); controller.abort(); }
      try { publicBytes = await read(false); }
      catch (error) {
        if (writeFailed && error instanceof ArtifactDownloadError && error.code === "NOT_FOUND") fail("WRITE_NOT_CONFIRMED");
        throw error;
      }
    }
    readback.set(ref.url, publicBytes);
  }
  return { ...validateExampleEvidenceBatch(prepared, sources, batch.report, readback),
    scope: "published-example-attachments-verified-not-execution-proof", consumedBytes: consumed };
}
