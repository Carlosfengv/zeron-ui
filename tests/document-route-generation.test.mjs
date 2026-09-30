import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";

const execute = promisify(execFile);
const script = fileURLToPath(new URL("../scripts/generate-document-routes.mjs", import.meta.url));
const temporary = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map((cwd) => rm(cwd, { recursive: true, force: true })));
});

async function fixture() {
  const cwd = await mkdtemp(path.join(tmpdir(), "zeron-document-routes-"));
  temporary.push(cwd);
  const put = async (file, content) => {
    await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
    await writeFile(path.join(cwd, file), content);
  };
  await put("docs/manifest.ts", '  entry({ slug: "button" }),\n  blockEntry({ slug: "login-01" }),\n');
  await put("docs/catalog/artifact-collections.ts", '  "login-01",\n');
  await put("docs/generated/component-page-loaders.generated.ts", '  "components/button": () => import("@docs/pages/components/button/page"),\n');
  await put("docs/generated/block-page-loaders.generated.ts", '  "blocks/login-01": () => import("@docs/pages/blocks/login-01/page"),\n');
  const run = (...args) => execute(process.execPath, [script, ...args], { cwd });
  return { cwd, put, run };
}

it("generates and checks routes with the artifact's public collection and original source", async () => {
  const { cwd, put, run } = await fixture();
  await expect(run("--check")).rejects.toMatchObject({ stderr: expect.stringContaining("stale") });
  await run();
  const page = "app/[locale]/docs/pages/(detail)/login-01/page.tsx";
  const generated = await readFile(path.join(cwd, page), "utf8");
  expect(generated).toContain('collection: "pages", slug: "login-01"');
  expect(generated).toContain('import("@docs/pages/blocks/login-01/page")');
  await run("--check");
  await put(page, generated + "// stale\n");
  await expect(run("--check")).rejects.toMatchObject({ stderr: expect.stringContaining("stale") });
  await run();
  expect(await readFile(path.join(cwd, page), "utf8")).toBe(generated);
});

it("refuses to overwrite a handwritten page before writing other generated routes", async () => {
  const { cwd, put, run } = await fixture();
  const page = "app/[locale]/docs/pages/(detail)/login-01/page.tsx";
  const source = "export default function CustomPage() { return null; }\n";
  await put(page, source);
  await expect(run()).rejects.toMatchObject({ stderr: expect.stringContaining("handwritten") });
  expect(await readFile(path.join(cwd, page), "utf8")).toBe(source);
  await expect(readFile(path.join(cwd, "app/[locale]/docs/components/(detail)/button/page.tsx"))).rejects.toMatchObject({ code: "ENOENT" });
});

it("rejects an unrecognized manifest instead of accepting an empty route set", async () => {
  const { put, run } = await fixture();
  await put("docs/manifest.ts", "export const docEntries = [];\n");
  await expect(run()).rejects.toMatchObject({ stderr: expect.stringContaining("No documentation entries") });
});

it("rejects duplicate manifest entries and missing loader coverage", async () => {
  const { put, run } = await fixture();
  await put("docs/manifest.ts", '  entry({ slug: "button" }),\n  entry({ slug: "button" }),\n');
  await expect(run()).rejects.toMatchObject({ stderr: expect.stringContaining("Duplicate manifest entry") });
  await put("docs/manifest.ts", '  entry({ slug: "button" }),\n  entry({ slug: "input" }),\n  blockEntry({ slug: "login-01" }),\n');
  await expect(run()).rejects.toMatchObject({ stderr: expect.stringContaining("no doc loaders: components/input") });
});
