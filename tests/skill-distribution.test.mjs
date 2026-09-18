import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, mkdir, writeFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unzipSync } from "fflate";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildSkillDistribution } from "../scripts/build-skill-distribution.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
let temporary;
let output;
let manifest;
beforeAll(async () => {
  temporary = await mkdtemp(path.join(tmpdir(), "zeron-distribution-test-"));
  output = path.join(temporary, "public", "skills");
  manifest = await buildSkillDistribution(output);
});
afterAll(async () => { await rm(temporary, { recursive: true, force: true }); });

describe("public skill distribution", () => {
  it("links a consistent pinned manifest and verified downloadable archive", async () => {
    const guide = await readFile(path.join(output, "install.md"), "utf8");
    const manifestPath = guide.match(/\[Pinned manifest\]\(([^)]+)\)/)[1];
    const pinned = JSON.parse(await readFile(path.join(temporary, "public", manifestPath), "utf8"));
    expect(pinned).toEqual(manifest);
    const archive = await readFile(path.join(temporary, "public", pinned.archive.url));
    expect(archive.length).toBe(pinned.archive.bytes);
    expect(hash(archive)).toBe(pinned.archive.sha256);
    expect(await readFile(path.join(output, "zeron-skills.zip"))).toEqual(archive);
    expect(JSON.parse(await readFile(path.join(output, "manifest.json"), "utf8"))).toEqual(pinned);
    expect(guide).not.toContain("{{");
  });

  it("installs every resource into a project without Zeron or application changes", async () => {
    const project = path.join(temporary, "consumer");
    const destination = path.join(project, ".agents/skills");
    await mkdir(destination, { recursive: true });
    const originalPackage = '{"name":"uninitialized-consumer","private":true}\n';
    await writeFile(path.join(project, "package.json"), originalPackage);
    const extracted = unzipSync(await readFile(path.join(output, "zeron-skills.zip")));
    expect(Object.keys(extracted).sort()).toEqual(manifest.files.map((file) => file.path).sort());
    for (const file of manifest.files) {
      expect(file.path.split("/")[0]).toMatch(/^(zeron-page-builder|swap-to-zeronui)$/);
      expect(file.path.split("/")).not.toContain("..");
      expect(path.isAbsolute(file.path)).toBe(false);
      expect(extracted[file.path].length).toBe(file.bytes);
      expect(hash(extracted[file.path])).toBe(file.sha256);
      expect(Buffer.from(extracted[file.path])).toEqual(await readFile(path.join(root, ".agents/skills", file.path)));
      const target = path.join(destination, file.path);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, extracted[file.path], { flag: "wx" });
    }
    expect((await readdir(destination)).sort()).toEqual([...manifest.skills].sort());
    for (const name of manifest.skills) await stat(path.join(destination, name, "SKILL.md"));
    for (const file of manifest.files.filter((file) => file.path.endsWith(".md"))) {
      const installedPath = path.join(destination, file.path);
      const content = await readFile(installedPath, "utf8");
      for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        const link = match[1].split("#")[0];
        if (!link || /^[a-z]+:/i.test(link)) continue;
        const target = path.resolve(path.dirname(installedPath), link);
        expect(path.relative(destination, target).startsWith("..")).toBe(false);
        await stat(target);
      }
    }
    expect(await readFile(path.join(project, "package.json"), "utf8")).toBe(originalPackage);
    expect((await readdir(project)).sort()).toEqual([".agents", "package.json"]);
  });

  it("rebuilds reproducibly without requiring an empty output directory", async () => {
    const first = await readFile(path.join(output, "zeron-skills.zip"));
    expect(await buildSkillDistribution(output)).toEqual(manifest);
    expect(await readFile(path.join(output, "zeron-skills.zip"))).toEqual(first);
  });
});
