import { readFile, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const check = process.argv.includes("--check");
const manifest = await readFile(join(root, "docs/manifest.ts"), "utf8");
const keys = [...manifest.matchAll(/^  (entry|blockEntry|iconEntry)\(\{ slug: "([\w-]+)"/gm)]
  .map(([, type, slug]) => `${type === "blockEntry" ? "blocks" : type === "iconEntry" ? "icons" : "components"}/${slug}`);
if (!keys.length || new Set(keys).size !== keys.length) throw new Error("Invalid document manifest");

// Retain established order and surrounding declarations, including the home
// loader and message-loading functions, when registering new documents.
function syncMap(source, start, entries, indent) {
  const offset = source.indexOf(start);
  if (offset < 0) throw new Error(`Missing loader map: ${start}`);
  const end = source.indexOf(`\n${indent.slice(2)}}`, offset + start.length);
  if (end < 0) throw new Error(`Missing loader map end: ${start}`);
  const currentBody = source.slice(offset + start.length, end);
  const keys = new Set(entries.map(([key]) => key));
  const body = currentBody.replace(/^\s*"([\w-]+\/[\w-]+)": \(\) => import\("[^"\n]+"\),\n?/gm,
    (line, key) => keys.has(key) ? line : "");
  const additions = [];
  for (const [key, target] of entries) {
    const expected = `"${key}": () => import("${target}"),`;
    if (body.includes(`"${key}":`) && !body.includes(expected)) throw new Error(`Unexpected loader target: ${key}`);
    if (!body.includes(expected)) additions.push(`${indent}${expected}`);
  }
  if (!additions.length && body === currentBody) return source;
  return source.slice(0, offset + start.length) + (additions.length ? "\n" + additions.join("\n") : "") + body + source.slice(end);
}

const outputs = [];
for (const [file, collection, name] of [
  ["docs/generated/block-page-loaders.generated.ts", "blocks", "blockPageLoaders"],
  ["docs/generated/component-page-loaders.generated.ts", "components", "componentPageLoaders"],
  ["docs/generated/page-loaders.generated.ts", null, "pageLoaders"],
]) {
  const entries = keys.filter((key) => !collection || key.startsWith(`${collection}/`))
    .map((key) => [key, `@docs/pages/${key}/page`]);
  outputs.push([file, syncMap(await readFile(join(root, file), "utf8"), `export const ${name}: Record<string, DocPageLoader> = {`, entries, "  ")]);
}

const messagesFile = "docs/i18n/content-loaders.generated.ts";
let messages = await readFile(join(root, messagesFile), "utf8");
for (const locale of ["en", "zh-CN"]) {
  const entries = keys.map((key) => [key, `@docs/content/${locale}/${key}.json`]);
  for (const [key] of entries) await access(join(root, `docs/content/${locale}/${key}.json`));
  messages = syncMap(messages, locale === "en" ? "  en: {" : '  "zh-CN": {', entries, "    ");
}
outputs.push([messagesFile, messages]);

for (const [file, contents] of outputs) {
  const target = join(root, file);
  if (await readFile(target, "utf8") === contents) continue;
  if (check) throw new Error(`Document loader is stale: ${file}`);
  await writeFile(target, contents);
}
console.log(`${check ? "Checked" : "Generated"} loaders for ${keys.length} documents.`);
