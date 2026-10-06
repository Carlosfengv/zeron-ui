import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildAgentCatalog } from "../scripts/build-agent-catalog.mjs";
import { createRegistryRelease } from "../scripts/create-registry-release.mjs";
import { assembleSkillRelease } from "../scripts/create-skill-release.mjs";
import { buildSkillArchive } from "../scripts/skill-archive.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

let output, publishedInputs;
beforeAll(async () => {
  output = await mkdtemp(path.join(tmpdir(), "zeron-catalog-fixed-inputs-"));
  const registry = await createRegistryRelease({ releaseId: "catalog-source-check", artifactBaseUrl: "https://artifacts.example.invalid", outputBase: output });
  const files = new Map(await Promise.all(registry.manifest.files.map(async file => [file.path, await readFile(path.join(registry.directory, file.path))])));
  const bundle = await buildSkillArchive();
  const { release } = assembleSkillRelease({ ...bundle, template: await readFile("docs/skills/install.md", "utf8"),
    artifactBaseUrl: "https://artifacts.example.invalid", siteBaseUrl: "https://docs.example.invalid" });
  publishedInputs = { registry: { manifest: registry.manifest, files }, skillRelease: release,
    skill: { files: new Map([["manifest.json", Buffer.from(serialize(release))], ...[...bundle.sourceFiles].map(([name, bytes]) => [`sources/${name}`, bytes])]) } };
}, 60000);
afterAll(async () => { await rm(output, { recursive: true, force: true }); });

describe("Catalog source rebuild from actual isolated Registry and Skill bytes", () => {
  it("reads maintained docs/types and fixed artifacts, leaving existing generated runtime untouched", async () => {
    const names = ["public/llms.txt", "public/r/registry.json", "public/skills/manifest.json", "docs/generated/agent-runtime/current.json"];
    const before = await Promise.all(names.map(async name => sha256(await readFile(name))));
    const first = await buildAgentCatalog({ publishedInputs, writeOutputs: false });
    const second = await buildAgentCatalog({ publishedInputs, writeOutputs: false });
    expect(first.runtime).toEqual(second.runtime);
    const maintained = await buildAgentCatalog({ writeOutputs: false });
    expect(first.runtime.catalog.items.map(item => item.id).sort()).toEqual(maintained.runtime.catalog.items.map(item => item.id).sort());
    expect(first.runtime.catalog.skillVersion).toBe(publishedInputs.skillRelease.skillVersion);
    expect(first.runtime.details["component:button"].exports).toContain("Button");
    expect(first.runtime.details["component:button"].registryDependencies.every(url => url.startsWith(publishedInputs.registry.manifest.baseUrl))).toBe(true);
    expect(await Promise.all(names.map(async name => sha256(await readFile(name))))).toEqual(before);
  }, 20000);
  it("does not fall back to development generated resources when a fixed source byte is absent", async () => {
    const registry = { ...publishedInputs.registry, files: new Map(publishedInputs.registry.files) }; registry.files.delete("button.json");
    await expect(buildAgentCatalog({ publishedInputs: { ...publishedInputs, registry }, writeOutputs: false })).rejects.toThrow("Verified Registry source file is missing");
    const skill = { files: new Map(publishedInputs.skill.files) }; skill.files.delete("sources/zeron-page-builder/SKILL.md");
    await expect(buildAgentCatalog({ publishedInputs: { ...publishedInputs, skill }, writeOutputs: false })).rejects.toThrow("Skill source inventory differs");
  });
});
