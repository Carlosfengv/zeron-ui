import { mkdtemp, readFile, writeFile, rm, access, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BASE_URL, depUrl, processRegistry } from "../packages/registry/scripts/postbuild.mjs";

describe("depUrl", () => {
  it("leaves default shadcn dependencies untouched", () => {
    expect(depUrl("utils", new Set(["button"]))).toBe("utils");
  });

  it("rewrites custom registry dependencies to their flat URL", () => {
    const items = new Set(["button", "badge"]);
    expect(depUrl("button", items)).toBe(`${BASE_URL}/button.json`);
    expect(depUrl("badge", items)).toBe(`${BASE_URL}/badge.json`);
  });
});

describe("processRegistry pipeline", () => {
  let dir;

  const write = (name, data) => writeFile(join(dir, name), JSON.stringify(data, null, 2));
  const read = async (name) => JSON.parse(await readFile(join(dir, name), "utf-8"));
  const exists = (name) => access(join(dir, name)).then(() => true, () => false);

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "registry-test-"));
    await mkdir(join(dir, "obsolete-artifacts"));
    await write("registry.json", {
      items: [
        { name: "dialog", registryDependencies: ["button", "badge", "utils"] },
        { name: "button" },
        { name: "badge" },
      ],
    });
    await write("dialog.json", {
      name: "dialog",
      registryDependencies: ["button", "badge", "utils"],
    });
    vi.spyOn(console, "log").mockImplementation(() => {});
    await processRegistry(dir);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await rm(dir, { recursive: true, force: true });
  });

  it("rewrites both item and index dependencies to flat URLs", async () => {
    const expected = [`${BASE_URL}/button.json`, `${BASE_URL}/badge.json`, "utils"];
    expect((await read("dialog.json")).registryDependencies).toEqual(expected);
    expect((await read("registry.json")).items[0].registryDependencies).toEqual(expected);
  });

  it("removes stale nested artifact directories", async () => {
    expect(await exists("obsolete-artifacts")).toBe(false);
  });

  it("is idempotent", async () => {
    const before = await read("dialog.json");
    await processRegistry(dir);
    expect(await read("dialog.json")).toEqual(before);
  });
});
