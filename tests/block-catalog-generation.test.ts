import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { blockCatalog, getBlockCatalogCopy, type BlockCapability } from "@zeron/blocks/catalog";
import { expect, it } from "vitest";
import { getDocEntry } from "../docs/manifest";
import aliases from "../docs/catalog/block-registry-slugs.json";
import capabilities from "../packages/blocks/block-capabilities.json";
import registry from "../packages/blocks/registry.json";
import { generateBlockCatalog } from "../scripts/generate-block-catalog.mjs";

it("derives every Block's install metadata from the Registry and capabilities", () => {
  const items = registry.items.filter(item => item.type === "registry:block");
  expect(blockCatalog.map(block => block.name)).toEqual(items.map(item => item.name));
  blockCatalog.forEach((block, index) => {
    const source = items[index];
    expect(block.installation).toEqual((capabilities as Record<string, BlockCapability>)[block.name]);
    expect(block.categories).toEqual(source.categories);
    expect(block.dependencies).toEqual([...new Set([...(source.registryDependencies ?? []), ...(source.dependencies ?? [])])]);
  });
  const fileUpload = blockCatalog.find(block => block.name === "file-upload-01");
  expect(fileUpload?.dependencies.filter(dependency => dependency === "badge")).toEqual(["badge"]);
});

it("keeps the marketplace install name and reads both copies by its docs slug", () => {
  const name = "model-mcp-marketplace-01";
  const slug = aliases[name];
  expect(blockCatalog.find(block => block.name === name)).toMatchObject({ name, slug: "resource-catalog-01", title: "模型和 MCP 广场" });
  expect(getDocEntry("pages", slug)?.registryItem?.name).toBe(name);
  expect(getBlockCatalogCopy(name, "en")?.title).toBe("Model & MCP Marketplace");
  expect(getBlockCatalogCopy(name, "zh-CN")?.title).toBe("模型和 MCP 广场");
});

it("reports drift and regenerates identical bytes on consecutive builds", async () => {
  const root = await mkdtemp(join(tmpdir(), "zeron-block-catalog-"));
  const output = join(root, "packages/blocks/src/catalog.ts");
  try {
    for (const file of [
      "packages/blocks/registry.json", "packages/blocks/block-capabilities.json", "docs/catalog/block-registry-slugs.json",
      "docs/content/en/blocks", "docs/content/zh-CN/blocks", "packages/blocks/src/catalog.ts",
    ]) {
      const destination = join(root, file);
      await mkdir(dirname(destination), { recursive: true });
      await cp(file, destination, { recursive: true });
    }
    await generateBlockCatalog({ root, check: true });
    const file = join(root, "docs/content/en/blocks/file-upload-01.json");
    const original = await readFile(file, "utf8");
    expect(original).toContain("File upload");
    await writeFile(file, original.replace("File upload", "Upload files"));
    await expect(generateBlockCatalog({ root, check: true })).rejects.toThrow("catalog.ts is stale");
    await generateBlockCatalog({ root });
    const generated = await readFile(output, "utf8");
    expect(generated).toContain("Upload files");
    await generateBlockCatalog({ root, check: true });
    await generateBlockCatalog({ root });
    expect(await readFile(output, "utf8")).toBe(generated);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
