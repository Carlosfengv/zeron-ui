import { mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildAgentCatalog } from "../scripts/build-agent-catalog.mjs";
import { readOwnedFile } from "../scripts/agent-utils.mjs";

describe("catalog generation from actual maintained inputs", () => {
  it("reproduces identical versions and validates committed context without writing outputs", async () => {
    const textBefore = await readFile("public/llms.txt", "utf8");
    const first = await buildAgentCatalog({ check: true });
    const second = await buildAgentCatalog({ check: true });
    expect(first.runtime.catalog.catalogVersion).toBe(second.runtime.catalog.catalogVersion);
    const expectedGuides = (await Promise.all(["components", "blocks"].map((collection) => readdir(`docs/agent-guides/${collection}`)))).flat().filter((file) => file.endsWith(".md")).length;
    expect(expectedGuides).toBeGreaterThanOrEqual(17);
    expect(first.guideCount).toBe(expectedGuides);
    expect(first.runtime.catalog.items.length).toBeGreaterThan(130);
    expect(first.runtime.installation).toBeNull();
    const mapping = JSON.parse(await readFile("docs/agent-data/guide-routes.json", "utf8"));
    expect(first.runtime.guideRoutes).toEqual(mapping);
    expect(mapping.routes).toHaveLength(expectedGuides);
    for (const route of mapping.routes) expect(first.runtime.details[route.itemId].guide).not.toBeNull();
    for (const [name, relative] of [["zeron-page-builder", "agents/openai.yaml"], ["swap-to-zeronui", "assets/migration-plan.schema.json"], ["swap-to-zeronui", "scripts/verify-evidence.mjs"]]) {
      expect(first.runtime.skills[name][relative]).toBe(await readFile(`.agents/skills/${name}/${relative}`, "utf8"));
    }
    expect(await readFile("public/llms.txt", "utf8")).toBe(textBefore);
  }, 20000);
  it("rejects reads escaping the owned source tree, including symlinks", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "zeron-allowlist-test-"));
    try {
      const root = path.join(directory, "root");
      const { mkdir } = await import("node:fs/promises");
      await mkdir(root);
      await writeFile(path.join(directory, "private.md"), "private");
      await symlink(path.join(directory, "private.md"), path.join(root, "link.md"));
      await expect(readOwnedFile(root, "../private.md")).rejects.toThrow("escapes allowed root");
      await expect(readOwnedFile(root, "link.md")).rejects.toThrow("escapes allowed root");
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
});
