import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { link, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { checkAgentCiArchive, checkCiArchiveContent, parseCiArchiveArgs } from "../scripts/check-agent-ci-archive.mjs";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

let parent, fixture, inputFile, counter = 0;
const json = value => Buffer.from(serialize(value));
const diagnostic = text => new Map([["private-logs/next-npm/build.json", json({ stdout: text, stderr: "", exitCode: 1 })]]);
const options = (role = "consumer", outcome = "failure") => ({ role, outcome, input: fixture.context.prepared.input });
beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-ci-archive-check-")); fixture = await ciEvidenceFixture(path.join(parent, "fixture"));
  inputFile = path.join(parent, "installation-input.json"); await writeFile(inputFile, serialize(fixture.context.prepared.input));
});
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });
async function materialize(files) {
  const directory = path.join(parent, `evidence-${++counter}`); await mkdir(directory);
  for (const [name, bytes] of files) { const filename = path.join(directory, name); await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, bytes); }
  return directory;
}
const args = (directory, stage, role = "consumer", outcome = "failure") => ["--input", inputFile, "--directory", directory, "--stage", stage, "--role", role, "--outcome", outcome];

describe("fixed public CI material gate (synthetic producer data, not real CI)", () => {
  it.each(["consumer", "examples"])("checks a complete %s archive without rewriting any bytes", role => {
    const files = fixture.files[role], hashes = [...files].map(([name, bytes]) => [name, sha256(bytes)]);
    const result = checkCiArchiveContent(files, options(role, "success"));
    expect(result.status).toBe("checked-public-ci-material"); expect(result.scope).toBe("fixed-producer-content-check-not-a-ci-attestation");
    expect([...files].map(([name, bytes]) => [name, sha256(bytes)])).toEqual(hashes);
  });
  it.each(["failure", "cancelled", "skipped"])("preserves partial %s diagnostics without manufacturing an installation pass", outcome => {
    const files = diagnostic("actual bounded command failure");
    expect(checkCiArchiveContent(files, options("consumer", outcome)).outcome).toBe(outcome);
    expect([...files.keys()]).toEqual(["private-logs/next-npm/build.json"]);
    expect(() => checkCiArchiveContent(files, options("consumer", "success"))).toThrow("INDEX_MISSING_OR_BUDGET");
  });
  it.each(["raw", "uri", "base64", "base64url", "hex", "unicode-json"])("rejects known credential in %s form", form => {
    const secret = "fixture-only-credential+/=opaque";
    const encodings = { raw: secret, uri: encodeURIComponent(secret), base64: Buffer.from(secret).toString("base64"),
      base64url: Buffer.from(secret).toString("base64url"), hex: Buffer.from(secret).toString("hex"), "unicode-json": secret };
    const files = diagnostic(encodings[form]);
    if (form === "unicode-json") files.set("private-logs/next-npm/build.json", Buffer.from(serialize({ stdout: secret }).replace('fixture', '\\u0066ixture')));
    expect(() => checkCiArchiveContent(files, { ...options(), secrets: [secret] })).toThrow(/CI_ARCHIVE_(?:CREDENTIAL_CONTENT|JSON_CANONICAL)/);
  });
  it.each([
    "Authorization: Bearer opaque", "-----BEGIN OPENSSH PRIVATE KEY-----", "ghp_" + "x".repeat(30),
    "github_pat_" + "x".repeat(30), "vercel_blob_fixture_only", "BLOB_READ_WRITE_TOKEN=opaque",
    "https://host.example/archive.zip?sig=opaque", "https://host.example/a?%73ig=opaque", "https://host.example/a?X-Amz-Signature=opaque",
    "https://host.example/a?X-Goog-Credential=opaque", "https://host.example/a?sv=1&se=tomorrow", "https://user:password@host.example/a",
  ])("rejects credentials and leased URLs without printing their value (%#)", text => {
    let error; try { checkCiArchiveContent(diagnostic(text), options()); } catch (value) { error = value; }
    expect(error.code).toBe("CI_ARCHIVE_CREDENTIAL_CONTENT"); expect(error.message).not.toContain(text);
  });
  it.each(["authorization", "_authToken", "password", "GITHUB_TOKEN"])("rejects nested credential field %s", key => {
    const files = diagnostic("bounded log"); files.set("failure.json", json({ nested: { [key]: "opaque" } }));
    expect(() => checkCiArchiveContent(files, options())).toThrow("CI_ARCHIVE_CREDENTIAL_CONTENT");
  });
  it.each([".env", ".npmrc", "private-logs/.env.json", "user-data.json", "attachments/readme.json", "../escape.json", "private-logs/next-npm/build.txt"])("rejects extra or credential file %s", name => {
    const files = diagnostic("bounded log"); files.set(name, json({ harmless: true }));
    expect(() => checkCiArchiveContent(files, options())).toThrow("CI_ARCHIVE_PATH_OR_TYPE");
  });
  it("does not treat a complete inventory as sufficient for successful execution", () => {
    const files = new Map([...fixture.files.consumer].map(([name, bytes]) => [name, Buffer.from(bytes)])); files.set("failure.json", json({ status: "failed" }));
    expect(() => checkCiArchiveContent(files, options("consumer", "success"))).toThrow("CI_ARCHIVE_SUCCESS_WITH_FAILURE");
    files.delete("failure.json"); files.get("private-logs/next-npm/build.json")[0] = 32;
    expect(() => checkCiArchiveContent(files, options("consumer", "success"))).toThrow();
  });
  it("rejects malformed, noncanonical and invalid UTF-8 JSON", () => {
    for (const bytes of [Buffer.from("{}"), Buffer.from([0xff]), Buffer.from("not json")]) {
      const files = diagnostic("bounded log"); files.set("failure.json", bytes);
      expect(() => checkCiArchiveContent(files, options())).toThrow(/CI_ARCHIVE_JSON/);
    }
  });
  it("allows public fixed URLs and empty credential fields", () => {
    const files = diagnostic("https://registry.npmjs.org/zeron-ui/-/zeron-ui.tgz https://host.example/fixed.json?v=1");
    files.set("failure.json", json({ authorization: null, password: "" }));
    expect(checkCiArchiveContent(files, options()).files).toBe(2);
  });
  it("rejects missing diagnostics, excessive files and bytes before parsing", () => {
    expect(() => checkCiArchiveContent(new Map([["input-verification.json", json({})]]), options())).toThrow("CI_ARCHIVE_DIAGNOSTICS_MISSING");
    expect(() => checkCiArchiveContent(new Map(Array.from({ length: 1025 }, (_, i) => [`file-${i}`, Buffer.alloc(0)])), options())).toThrow("CI_ARCHIVE_CONTRACT");
    const large = Buffer.alloc(32 * 1024 * 1024);
    expect(() => checkCiArchiveContent(new Map(Array.from({ length: 9 }, (_, i) => [`file-${i}`, large])), options())).toThrow("CI_ARCHIVE_BYTE_BUDGET");
    expect(() => checkCiArchiveContent(new Map([["failure.json", Buffer.alloc(32 * 1024 * 1024 + 1)]]), options())).toThrow("CI_ARCHIVE_BYTE_BUDGET");
  });
  it("rejects PNG metadata and trailing hidden payloads without stripping them", () => {
    const png = [...fixture.files.examples].find(([name]) => name.endsWith(".png"))[1];
    const make = bytes => new Map([["failure.json", json({ status: "failed" })], ["attachments/" + "a".repeat(64) + ".png", bytes]]);
    expect(checkCiArchiveContent(make(png), options("examples")).files).toBe(2);
    const text = Buffer.from("credential=opaque"), chunk = Buffer.alloc(text.length + 12); chunk.writeUInt32BE(text.length); chunk.write("tEXt", 4); text.copy(chunk, 8);
    expect(() => checkCiArchiveContent(make(Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)])), options("examples"))).toThrow("CI_ARCHIVE_PNG_METADATA");
    expect(() => checkCiArchiveContent(make(Buffer.concat([png, Buffer.from("hidden")])), options("examples"))).toThrow("CI_ARCHIVE_PNG");
  });
});

describe("closed archive check and immutable staging entry", () => {
  it("rejects skip switches, extra arguments and forged outcomes", () => {
    const directory = path.join(parent, "source"), stage = path.join(parent, "stage");
    expect(parseCiArchiveArgs(args(directory, stage))).toEqual({ input: inputFile, directory, stage, role: "consumer", outcome: "failure" });
    for (const flags of [["--skip", "yes"], ["--mock", "yes"], ["--secret", "opaque"], ["--stage", stage]]) expect(() => parseCiArchiveArgs([...args(directory, stage), ...flags])).toThrow("CI_ARCHIVE_ARGUMENTS");
    expect(() => parseCiArchiveArgs(args(directory, stage, "consumer", "passed"))).toThrow("CI_ARCHIVE_ARGUMENTS");
    expect(() => parseCiArchiveArgs(args(directory, "line\noutput=forged"))).toThrow("CI_ARCHIVE_ARGUMENTS");
  });
  it.each(["consumer", "examples"])("stages exactly checked %s bytes without network or source-output changes", async role => {
    const directory = await materialize(fixture.files[role]), stage = path.join(parent, `stage-${++counter}`);
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => { throw new Error("must not fetch"); });
    try {
      const result = await checkAgentCiArchive(args(directory, stage, role, "success"));
      expect(result.files).toBe(fixture.files[role].size);
      for (const [name, bytes] of fixture.files[role]) { expect(await readFile(path.join(stage, name))).toEqual(bytes); expect(await readFile(path.join(directory, name))).toEqual(bytes); }
      expect(fetcher).not.toHaveBeenCalled();
      await expect(checkAgentCiArchive(args(directory, stage, role, "success"))).rejects.toHaveProperty("code", "EEXIST");
    } finally { fetcher.mockRestore(); }
  });
  it("fails before staging a known secret and exposes only a safe code in the actual CLI", async () => {
    const secret = "fixture-secret-not-a-real-token", directory = await materialize(diagnostic(secret)), stage = path.join(parent, `stage-${++counter}`);
    const result = spawnSync(process.execPath, ["scripts/check-agent-ci-archive.mjs", ...args(directory, stage)], { encoding: "utf8", env: { ...process.env, BLOB_READ_WRITE_TOKEN: secret }, timeout: 30000 });
    expect(result.status).toBe(1); expect(result.stderr).toContain("CI_ARCHIVE_CREDENTIAL_CONTENT"); expect(result.stdout + result.stderr).not.toContain(secret);
    expect(await readdir(directory)).toEqual(["private-logs"]); await expect(readdir(stage)).rejects.toHaveProperty("code", "ENOENT");
  });
  it.each(["file-symlink", "directory-symlink", "hardlink"])("refuses %s without following or staging external data", async kind => {
    const directory = await materialize(diagnostic("bounded log")), stage = path.join(parent, `stage-${++counter}`), target = path.join(directory, "private-logs/next-npm/build.json");
    if (kind === "file-symlink") { await rm(target); await symlink(inputFile, target); }
    if (kind === "directory-symlink") { await rm(path.join(directory, "private-logs"), { recursive: true }); await symlink(parent, path.join(directory, "private-logs")); }
    if (kind === "hardlink") {
      const external = path.join(parent, `external-${++counter}.json`); await writeFile(external, json({ stdout: "external diagnostic" }));
      await rm(target); await link(external, target);
    }
    await expect(checkAgentCiArchive(args(directory, stage))).rejects.toHaveProperty("code", kind === "hardlink" ? "CI_ARCHIVE_FILE_TYPE_OR_BUDGET" : "CI_ARCHIVE_PATH_OR_TYPE");
    await expect(readdir(stage)).rejects.toHaveProperty("code", "ENOENT");
  });
  it("rejects a stage inside producer output and a source directory alias", async () => {
    const directory = await materialize(diagnostic("bounded log")), stage = path.join(directory, "nested-stage");
    await expect(checkAgentCiArchive(args(directory, stage))).rejects.toThrow("outside artifact candidates");
    const alias = path.join(parent, `alias-${++counter}`); await symlink(directory, alias);
    await expect(checkAgentCiArchive(args(alias, path.join(parent, `stage-${++counter}`)))).rejects.toHaveProperty("code", "CI_ARCHIVE_DIRECTORY_TYPE");
  });
});
