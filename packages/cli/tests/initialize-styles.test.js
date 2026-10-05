import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { adaptNextStarterCss, adaptNextStarterStyles } from "../src/initialize-styles.js";

const starter = `@import "tailwindcss";
:root { --background: #ffffff; --foreground: #171717; }
@theme inline { --color-background: var(--background); --color-foreground: var(--foreground); }
@media (prefers-color-scheme: dark) { :root { --background: #0a0a0a; --foreground: #ededed; } }
body { background: var(--background); color: var(--foreground); font-family: Arial, Helvetica, sans-serif; }
`;

test("adapts only the recognizable Next starter body colors, preserving other styles", () => {
  const result = adaptNextStarterCss(starter);
  assert.equal(result, starter.replace("background: var(--background); color: var(--foreground);", "background: var(--surface-base); color: var(--fg-default);"));
  assert.equal(adaptNextStarterCss(result), result);
});

for (const [label, source] of [
  ["custom light color", starter.replace("#ffffff", "#fafafa")],
  ["custom dark color", starter.replace("#0a0a0a", "#111111")],
  ["custom body background", starter.replace("body { background: var(--background)", "body { background: white")],
  ["important body color", starter.replace("color: var(--foreground); font", "color: var(--foreground) !important; font")],
  ["another theme selector", `${starter}\n.brand { --background: red; }`],
  ["local brand import", `@import "./brand.css";\n${starter}`],
  ["package theme import", `@import "brand/theme.css";\n${starter}`],
  ["remote theme import", `@import url("https://example.com/theme.css");\n${starter}`],
  ["conditional theme import", `@IMPORT './brand.css' layer(brand) screen;\n${starter}`],
  ["no starter variables", '@import "tailwindcss"; body {color: black;}'],
]) {
  test(`leaves ${label} byte-for-byte unchanged`, () => assert.equal(adaptNextStarterCss(source), source));
}

test("recognizes the framework imports added by foundation installation", () => {
  const source = `@import 'tw-animate-css';\n${starter}`;
  assert.match(adaptNextStarterCss(source), /background: var\(--surface-base\); color: var\(--fg-default\)/);
});

test("updates the configured Next stylesheet and skips Vite", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "zeron-starter-css-"));
  await mkdir(path.join(cwd, "src"));
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ dependencies: { next: "15.5.24" } }));
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({ tailwind: { css: "src/global.css" } }));
  await writeFile(path.join(cwd, "src/global.css"), starter);
  await adaptNextStarterStyles(cwd);
  assert.equal(await readFile(path.join(cwd, "src/global.css"), "utf8"), adaptNextStarterCss(starter));
  await writeFile(path.join(cwd, "src/global.css"), starter);
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ devDependencies: { vite: "8.2.1" } }));
  await adaptNextStarterStyles(cwd);
  assert.equal(await readFile(path.join(cwd, "src/global.css"), "utf8"), starter);
});

test("refuses to update a stylesheet symlink outside the project", async () => {
  const cwd = await mkdtemp(path.join(tmpdir(), "zeron-starter-css-"));
  const outside = await mkdtemp(path.join(tmpdir(), "zeron-starter-outside-"));
  await writeFile(path.join(cwd, "package.json"), JSON.stringify({ dependencies: { next: "15.5.24" } }));
  await writeFile(path.join(cwd, "components.json"), JSON.stringify({ tailwind: { css: "global.css" } }));
  await writeFile(path.join(outside, "global.css"), starter);
  await symlink(path.join(outside, "global.css"), path.join(cwd, "global.css"));
  await assert.rejects(adaptNextStarterStyles(cwd), /symbolic link/);
  assert.equal(await readFile(path.join(outside, "global.css"), "utf8"), starter);
});
