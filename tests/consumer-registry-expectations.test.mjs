import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { consumerRegistryClosureHash, consumerRegistryExpectations, snapshotConsumerRegistry } from "../scripts/lib/consumer-registry-expectations.mjs";

const registry = fileURLToPath(new URL("../public/r/", import.meta.url));
it("invalidates consumer evidence when its own transitive payload changes", () => {
  const snapshot = new Map([
    ["root.json", JSON.stringify({ name: "root", registryDependencies: ["child"] })],
    ["child.json", JSON.stringify({ name: "child", files: [{ content: "original" }] })],
    ["unrelated.json", JSON.stringify({ name: "unrelated" })],
  ]);
  const hash = consumerRegistryClosureHash(snapshot, "root");
  snapshot.set("unrelated.json", "changed unrelated payload");
  expect(consumerRegistryClosureHash(snapshot, "root")).toBe(hash);
  snapshot.set("child.json", JSON.stringify({ name: "child", files: [{ content: "changed" }] }));
  expect(consumerRegistryClosureHash(snapshot, "root")).not.toBe(hash);
  snapshot.delete("child.json");
  expect(() => consumerRegistryClosureHash(snapshot, "root")).toThrow("missing child");
});
describe("consumer assertions follow the Registry closure", () => {
  it.each(["control-size", "springs", "icon-context"])("does not require unrelated theme assets for %s", async (name) => {
    expect(await consumerRegistryExpectations(registry, name)).toEqual({ animation: false, tokens: [], mergeTokens: false });
  });
  it("checks surfaces theme without requiring the unrelated merge helper", async () => {
    expect(await consumerRegistryExpectations(registry, "surfaces")).toEqual({
      animation: true, tokens: ["border-width-hairline", "transition-duration-fast"], mergeTokens: false,
    });
  });
  it("checks a utility-only closure without requiring theme CSS", async () => {
    expect(await consumerRegistryExpectations(registry, "utils")).toEqual({ animation: false, tokens: [], mergeTokens: true });
  });
  it("retains the complete transitive checks for styled components", async () => {
    expect(await consumerRegistryExpectations(registry, "button")).toEqual({
      animation: true, tokens: ["border-width-hairline", "transition-duration-fast"], mergeTokens: true,
    });
  });
});


it("serves and checks immutable postprocessed bytes after a parallel rebuild", async () => {
  const directory = await mkdtemp(join(tmpdir(), "zeron-registry-snapshot-test-"));
  try {
    const processed = JSON.stringify({ name: "data-table", dependencies: ["@tanstack/react-table@^8.21.3"], files: [{ target: "lib/tailwind-merge-tokens.ts" }] });
    await writeFile(join(directory, "data-table.json"), processed);
    const snapshot = await snapshotConsumerRegistry(directory);
    await writeFile(join(directory, "data-table.json"), JSON.stringify({ name: "data-table", dependencies: ["@tanstack/react-table"] }));
    expect(snapshot.get("data-table.json")).toBe(processed);
    expect(await consumerRegistryExpectations(snapshot, "data-table")).toEqual({ animation: false, tokens: [], mergeTokens: true });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
