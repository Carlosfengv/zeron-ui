import { zlibSync } from "fflate";
import { adaptExampleImports, exampleHostEntry, exampleStateCases } from "../../scripts/agent-example-sources.mjs";
import { exampleEvidenceBinding, exampleEvidenceReference, exampleRegistryClosure, exampleVerificationSchema } from "../../scripts/agent-example-evidence.mjs";
import { serialize, sha256 } from "../../scripts/agent-utils.mjs";

// Synthetic success and blank PNGs exercise contracts only, never browser or service execution.
export function fixtureExamplePng(width, height, decodedLength = (width * 3 + 1) * height) {
  const chunk = (name, data) => {
    const body = Buffer.concat([Buffer.from(name), data]);
    let crc = 0xffffffff;
    for (const byte of body) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
    const result = Buffer.alloc(12 + data.length);
    result.writeUInt32BE(data.length); body.copy(result, 4); result.writeUInt32BE((crc ^ 0xffffffff) >>> 0, result.length - 4);
    return result;
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(width); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header),
    chunk("IDAT", Buffer.from(zlibSync(new Uint8Array(decodedLength)))), chunk("IEND", Buffer.alloc(0))]);
}

export function fixtureExampleEvidence(prepared, sources, hash = "a".repeat(64)) {
  const manifest = sources.manifest, binding = exampleEvidenceBinding(prepared, manifest), attachments = new Map();
  const attach = (value, extension = "json") => {
    const bytes = Buffer.isBuffer(value) ? value : Buffer.from(serialize(value));
    const ref = exampleEvidenceReference(prepared.input.artifactBaseUrl, bytes, extension); attachments.set(ref.url, bytes); return ref;
  };
  const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
  const screenshots = new Map([390, 1440].map(width => [width, attach(fixtureExamplePng(width, 844), "png")]));
  const rows = manifest.declarations.examples.flatMap(example => example.profiles.map(profile => {
    const host = exampleHostEntry(manifest, profile.framework), closure = exampleRegistryClosure(prepared, manifest, profile.framework);
    const row = { ...profile, exampleId: example.exampleId, nodeVersion: "22.17.0", frameworkVersion: profile.framework === "next" ? "15.5.9" : "8.2.1",
      packageManagerVersion: profile.packageManager === "npm" ? "10.9.2" : "10.12.4", templateSha256: hash, initialLockfileSha256: hash,
      finalLockfileSha256: hash, finalProjectSha256: hash, cliOwnFilesSha256: hash, installedStateSha256: hash,
      adoptedItems: example.adoptedItems, registryClosure: closure,
      materialized: { files: manifest.files.map(file => descriptor(`examples/${file.path}`, /\.(ts|tsx)$/.test(file.path)
        ? adaptExampleImports(sources.files.get(file.path), file.path, profile.framework) : sources.files.get(file.path))), entry: descriptor(host.path, host.content) }, checks: {} };
    const check = (name, result) => attach({ schemaVersion: 1, kind: "agent-example-check", bindingSha256: sha256(serialize(binding)),
      exampleId: example.exampleId, ...profile, finalProjectSha256: hash, check: name, result });
    row.checks.install = check("install", { adoptedItems: manifest.hostAdoptedItems, registryClosure: closure, cliOwnFilesSha256: hash,
      installedStateSha256: hash, finalLockfileSha256: hash, officialCliBytes: true, managerAndLockfile: true, themeInstalled: true, compiledTheme: true });
    for (const name of ["types", "build"]) row.checks[name] = check(name, { command: [profile.packageManager, "run", name], exitCode: 0 });
    row.checks.states = check("states", { cases: exampleStateCases[example.exampleId].map(caseId => example.notApplicable[caseId]
      ? { caseId, status: "not-applicable", reason: example.notApplicable[caseId] }
      : { caseId, status: "passed", assertions: [{ name: `interface:${caseId}`, passed: true }] }) });
    const browser = { name: "fixture-browser", version: "1.0.0" };
    const keyboard = example.exampleId === "resource-list" ? ["filter", "open-detail", "return-context"] : example.exampleId === "resource-detail" ? ["edit", "save", "back"] : ["edit", "save", "reset"];
    row.checks.keyboard = check("keyboard", { browser, steps: [{ key: "Tab", target: "primary action" }, { key: "Enter", target: "primary action" }],
      assertions: keyboard.map(name => ({ name, passed: true })) });
    row.checks.viewports = [390, 1440].map(width => ({ width, screenshot: screenshots.get(width), evidence: check("viewport", { browser, width, height: 844,
      horizontalOverflow: false, focusVisible: true, screenshot: screenshots.get(width), assertions: [{ name: "main content", passed: true }] }) }));
    return row;
  }));
  return { report: exampleVerificationSchema.parse({ schemaVersion: 1, kind: "published-example-verification", binding, sourceManifest: manifest, rows }), attachments };
}
