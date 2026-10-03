import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { generatePreviewSources } from "../scripts/generate-preview-sources.mjs";
import { previewSourceFiles } from "../scripts/preview-source-allowlist.mjs";

const roots = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));
async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "zeron-preview-source-"));
  roots.push(root);
  for (const filename of Object.values(previewSourceFiles).flat()) {
    await mkdir(path.dirname(path.join(root, filename)), { recursive: true });
    await writeFile(path.join(root, filename), `// ${filename}\nexport const demo = true;\n`);
  }
  return root;
}

describe("generated preview source assets", () => {
  it("keeps the checked-in URL mapping and every source byte fresh", async () => {
    await expect(generatePreviewSources(process.cwd(), true)).resolves.toBe(Object.keys(previewSourceFiles).length);
  });

  it("passes only source references across every full-source Block/Page boundary", async () => {
    for (const slug of Object.keys(previewSourceFiles)) {
      const page = await readFile(path.join(process.cwd(), "docs/pages/blocks", slug, "page.tsx"), "utf8");
      expect(page, slug).toContain(`getBlockPreviewSource("${slug}")`);
      expect(page, slug).not.toMatch(/readFile|node:fs|packages\/blocks\/src/);
    }
  });

  it("publishes only allowlisted files, with content hashes and exact combined-source ordering", async () => {
    const root = await fixture();
    await writeFile(path.join(root, ".secret"), "must not publish");
    await generatePreviewSources(root);
    const files = previewSourceFiles["resource-detail-page-01"];
    const source = (await Promise.all(files.map((filename) => readFile(path.join(root, filename), "utf8")))).join("\n\n");
    const hash = createHash("sha256").update(source).digest("hex");
    expect(await readFile(path.join(root, "public/docs-source", `${hash}.txt`), "utf8")).toBe(source);
    const manifest = await readFile(path.join(root, "docs/lib/block-preview-sources.generated.ts"), "utf8");
    expect(manifest).toContain(`/docs-source/${hash}.txt`);
    expect(manifest).not.toContain("export const demo");
    expect(manifest).not.toContain("must not publish");
    expect((await readdir(path.join(root, "public/docs-source"))).every((file) => /^[a-f0-9]{64}\.txt$/.test(file))).toBe(true);
  });

  it("detects source changes, missing assets and tampering; regeneration removes obsolete hashes", async () => {
    const root = await fixture();
    await generatePreviewSources(root);
    const assetRoot = path.join(root, "public/docs-source");
    const firstAsset = (await readdir(assetRoot))[0];
    await writeFile(path.join(assetRoot, firstAsset), "corrupted");
    await expect(generatePreviewSources(root, true)).rejects.toThrow("stale");
    await generatePreviewSources(root);
    await rm(path.join(assetRoot, firstAsset));
    await expect(generatePreviewSources(root, true)).rejects.toThrow("stale");
    await generatePreviewSources(root);
    const before = await readdir(assetRoot);
    await writeFile(path.join(root, Object.values(previewSourceFiles)[0][0]), "new version");
    await expect(generatePreviewSources(root, true)).rejects.toThrow("Stale");
    await generatePreviewSources(root);
    const after = await readdir(assetRoot);
    expect(after).toHaveLength(before.length);
    expect(after).not.toEqual(before);
    await expect(generatePreviewSources(root, true)).resolves.toBe(Object.keys(previewSourceFiles).length);
  });
});
