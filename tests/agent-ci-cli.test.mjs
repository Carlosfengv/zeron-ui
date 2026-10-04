import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { checkAgentCiEvidence, parseCiCheckArgs, readCanonicalCiLocator } from "../scripts/check-agent-ci-evidence.mjs";
import { serialize } from "../scripts/agent-utils.mjs";

let parent, fixture, input, locator;
beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-ci-cli-contract-")); fixture = await ciEvidenceFixture(path.join(parent, "fixture"));
  input = path.join(parent, "input.json"); locator = path.join(parent, "locator.json");
  await writeFile(input, serialize(fixture.context.prepared.input)); await writeFile(locator, serialize(fixture.context.locator));
});
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });
const args = output => ["--input", input, "--locator", locator, "--output", output];

describe("closed production CI checker entry", () => {
  it("accepts only required input, locator and isolated output paths", () => {
    const output = path.join(parent, "new-output");
    expect(parseCiCheckArgs(args(output))).toEqual({ input, locator, output });
    expect(() => parseCiCheckArgs(args(path.resolve("docs/agent-data/new-output")))).toThrow(/isolated output/);
    for (const flags of [["--mock", "yes"], ["--skip", "yes"], ["--policy", input], ["--import-pass", input], ["--output", output], ["--input", input]]) {
      expect(() => parseCiCheckArgs([...args(output), ...flags])).toThrow("CI_ARGUMENTS");
    }
    expect(() => parseCiCheckArgs(args(output).slice(0, 4))).toThrow("CI_ARGUMENTS");
    expect(() => parseCiCheckArgs(["--input", "--output"])).toThrow("CI_ARGUMENTS");
  });
  it("reads canonical locators and rejects equivalently formatted or unsafe contracts", async () => {
    expect(await readCanonicalCiLocator(locator)).toEqual(fixture.context.locator);
    const other = path.join(parent, "noncanonical.json"); await writeFile(other, JSON.stringify(fixture.context.locator));
    await expect(readCanonicalCiLocator(other)).rejects.toHaveProperty("code", "CI_LOCATOR_CANONICAL");
    await writeFile(other, serialize({ ...fixture.context.locator, passed: true }));
    await expect(readCanonicalCiLocator(other)).rejects.toHaveProperty("code", "CI_LOCATOR_CONTRACT");
    await writeFile(other, Buffer.from([0xff]));
    await expect(readCanonicalCiLocator(other)).rejects.toHaveProperty("code", "CI_LOCATOR_CONTRACT");
  });
  it("refuses symlink and oversized locator inputs", async () => {
    const link = path.join(parent, "link.json"); await symlink(locator, link);
    await expect(readCanonicalCiLocator(link)).rejects.toHaveProperty("code", "ELOOP");
    const large = path.join(parent, "large.json"); await writeFile(large, Buffer.alloc(2 * 1024 * 1024 + 1));
    await expect(readCanonicalCiLocator(large)).rejects.toHaveProperty("code", "CI_INPUT_FILE");
  });
  it("rejects fixture source before GitHub, npm or public resources can be fetched", async () => {
    const output = path.join(parent, "source-rejected"), fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => { throw new Error("must never fetch"); });
    try {
      let code;
      try { await checkAgentCiEvidence(args(output)); } catch (error) { code = error.code; }
      expect(["DIRTY_SOURCE", "SOURCE_BINDING_MISMATCH"]).toContain(code);
      expect(fetcher).not.toHaveBeenCalled();
      const failure = JSON.parse(await readFile(path.join(output, "failure.json"), "utf8"));
      expect(failure).toEqual({ schemaVersion: 1, kind: "agent-ci-verification-failure", status: "failed", scope: "ci-evidence-gate-not-publication", phase: "source", code });
      expect(await readdir(output)).toEqual(["failure.json"]);
      await expect(checkAgentCiEvidence(args(output))).rejects.toHaveProperty("code", "EEXIST");
      expect(JSON.parse(await readFile(path.join(output, "failure.json"), "utf8"))).toEqual(failure);
    } finally { fetcher.mockRestore(); }
  });
  it("keeps invalid input failures safe and cannot leave a usable receipt", async () => {
    const invalid = path.join(parent, "invalid-input.json"); await writeFile(invalid, '{"opaque-secret":"fixture-value"}');
    const output = path.join(parent, "invalid-rejected");
    await expect(checkAgentCiEvidence(["--input", invalid, "--locator", locator, "--output", output])).rejects.toThrow("CI verification failed:");
    const bytes = await readFile(path.join(output, "failure.json"), "utf8"); expect(bytes).not.toContain("opaque-secret"); expect(bytes).not.toContain("fixture-value");
    expect(JSON.parse(bytes).phase).toBe("input"); expect(await readdir(output)).toEqual(["failure.json"]);
  });
});
