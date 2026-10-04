import { mkdtemp, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { materializeExamples, parseExampleArgs, verifyMaterializedExamples } from "../scripts/agent-examples.mjs";
import { materializeConsumer } from "../scripts/published-consumer-runtime.mjs";

const directories = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))); });
it("rejects ambiguous or invalid consumer options", () => {
  expect(parseExampleArgs(["--output", "/tmp/example", "--framework", "next", "--package-manager", "npm", "--serve", "--port", "4188"])).toMatchObject({ framework: "next", packageManager: "npm", serve: true, port: 4188 });
  for (const args of [[], ["--output"], ["--output", "/tmp/example", "--framework", "unknown"], ["--output", "/tmp/example", "--port", "80"], ["--output", "/tmp/example", "--serve", "--serve"], ["--output", "/tmp/example", "--package-manager", "yarn"]]) expect(() => parseExampleArgs(args)).toThrow();
});
it("materializes public component imports against each consumer's aliases", async () => {
  const parent = await mkdtemp(path.join(tmpdir(), "zeron-examples-materialize-"));
  directories.push(parent);
  for (const framework of ["next", "vite"]) {
    const consumer = path.join(parent, framework);
    await materializeConsumer(framework, "pnpm", consumer);
    const sentinel = await readFile(path.join(consumer, "business.ts"));
    const mapped = await materializeExamples(consumer, framework);
    expect(mapped.files.map(file => file.sourcePath)).toContain("shared/contracts.ts");
    expect(mapped.files.map(file => file.sourcePath)).toContain("resource-list/page.tsx");
    expect(mapped.files.map(file => file.sourcePath)).toContain("README.md");
    await verifyMaterializedExamples(consumer, mapped);
    const page = await readFile(path.join(consumer, "examples/resource-list/page.tsx"), "utf8");
    expect(page).toContain(framework === "next" ? '"@/components/ui/data-table"' : '"@/src/components/ui/data-table"');
    expect(page).not.toContain("#components/");
    expect(await readFile(path.join(consumer, "business.ts"))).toEqual(sentinel);
    expect(await readFile(path.join(consumer, framework === "next" ? "app/page.tsx" : "src/main.tsx"), "utf8")).toContain("../examples/app");
    await expect(materializeExamples(consumer, framework)).rejects.toMatchObject({ code: "EEXIST" });
  }
  await expect(materializeExamples(path.join(parent, "invalid"), "other")).rejects.toThrow("Invalid example framework");
});
it("rejects copied source, instructions, entry changes and undeclared consumer files", async () => {
  const parent = await mkdtemp(path.join(tmpdir(), "zeron-examples-drift-"));
  directories.push(parent);
  const consumer = path.join(parent, "consumer");
  await materializeConsumer("vite", "pnpm", consumer);
  const mapped = await materializeExamples(consumer, "vite");
  for (const relative of ["examples/shared/contracts.ts", "examples/README.md", "src/main.tsx"]) {
    const filename = path.join(consumer, relative);
    const bytes = await readFile(filename);
    await writeFile(filename, Buffer.concat([bytes, Buffer.from("\n")]));
    await expect(verifyMaterializedExamples(consumer, mapped)).rejects.toMatchObject({ code: relative.startsWith("examples/") ? "MATERIALIZED_SOURCE_CHANGED" : "MATERIALIZED_ENTRY_CHANGED" });
    await writeFile(filename, bytes);
  }
  await writeFile(path.join(consumer, "examples/extra.ts"), "export const extra = true;\n");
  await expect(verifyMaterializedExamples(consumer, mapped)).rejects.toMatchObject({ code: "MATERIALIZED_SOURCE_CHANGED" });
  await rm(path.join(consumer, "examples/extra.ts"));
  await rm(path.join(consumer, "examples/resource-detail/page.tsx"));
  await expect(verifyMaterializedExamples(consumer, mapped)).rejects.toMatchObject({ code: "MATERIALIZED_SOURCE_CHANGED" });
});
it("rejects an example directory replaced by a link even when its bytes match", async () => {
  const parent = await mkdtemp(path.join(tmpdir(), "zeron-examples-directory-link-"));
  directories.push(parent);
  const consumer = path.join(parent, "consumer");
  await materializeConsumer("vite", "pnpm", consumer);
  const mapped = await materializeExamples(consumer, "vite");
  const original = path.join(consumer, "examples");
  const moved = path.join(parent, "moved");
  await rename(original, moved);
  await symlink(moved, original, "dir");
  await expect(verifyMaterializedExamples(consumer, mapped)).rejects.toMatchObject({ code: "MATERIALIZED_DIRECTORY_CHANGED" });
});
