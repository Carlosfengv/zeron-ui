import { sha256, serialize } from "./agent-utils.mjs";

export const contextBudgets = { instructions: 8192, small: 16384, index: 65536, full: 524288 };
export function assertContextBudget(name, text, budget) {
  if (Buffer.byteLength(text) > budget) throw new Error(`${name} exceeds ${budget} byte context budget`);
}

/** Keep exact source ranges; only continuation fences are added to the view. */
export function splitMarkdownSource(text, sourceBudget) {
  if (!Number.isInteger(sourceBudget) || sourceBudget < 8192) throw new Error("Markdown source budget must be at least 8192 bytes");
  const parts = [];
  let source = "";
  let bytes = 0;
  let offset = 0;
  let start = 0;
  let opening = null;
  let marker = null;
  let prefix = "";
  function flush() {
    if (!source) return;
    const suffix = opening ? `${source.endsWith("\n") ? "" : "\n"}${marker}\n` : "";
    parts.push({ source, prefix, suffix, startByte: start, endByte: offset });
    source = "";
    bytes = 0;
    start = offset;
    prefix = opening ? `${opening}\n` : "";
  }
  for (const line of text.match(/[^\n]*\n|[^\n]+$/g) ?? []) {
    const fence = line.match(/^ {0,3}(`{3,}|~{3,})([^\r\n]*)\r?\n?$/);
    const lineBytes = Buffer.byteLength(line);
    if (fence && lineBytes > 4096) throw new Error("Fence delimiter exceeds 4096 bytes; shorten the delimiter or info string");
    if (source && bytes + lineBytes > sourceBudget) flush();
    // Ordinary long lines are segmented at Unicode boundaries, never byte slices.
    for (const point of line) {
      const size = Buffer.byteLength(point);
      if (bytes + size > sourceBudget) flush();
      source += point;
      bytes += size;
      offset += size;
    }
    if (fence) {
      if (!opening && !(fence[1][0] === "`" && fence[2].includes("`"))) {
        opening = line.replace(/\r?\n$/, "");
        marker = fence[1];
      } else if (opening && fence[1][0] === marker[0] && fence[1].length >= marker.length && !fence[2].trim()) {
        opening = null;
        marker = null;
      }
    }
  }
  flush();
  return parts;
}

export function buildFullContext({ intro, guides, site, budget = contextBudgets.full }) {
  if (budget < 16384) throw new Error("Full context budget must be at least 16384 bytes");
  const coverage = "This file contains all maintained agent guides, not all component source or complete API declarations. Items without guides have basic metadata in the catalog.";
  const complete = `${intro}\n## Coverage\n\n${coverage}\n\n${guides.map((guide) => guide.text).join("\n\n---\n\n")}`;
  const files = new Map();
  if (Buffer.byteLength(complete) <= budget) {
    files.set("llms-full.txt", complete);
    return files;
  }
  const groups = new Map();
  const manifest = { schemaVersion: 1, guides: [] };
  for (const guide of guides) {
    const match = guide.key.match(/^(components|blocks)\/([a-z0-9-]+)\.md$/);
    if (!match) throw new Error(`Invalid context guide key: ${guide.key}`);
    const [, collection, slug] = match;
    const parts = splitMarkdownSource(guide.text, budget - 8192);
    const record = { key: guide.key, bytes: Buffer.byteLength(guide.text), sha256: sha256(guide.text), parts: [] };
    const links = groups.get(collection) ?? [];
    parts.forEach((part, index) => {
      const filename = `ai/context/${collection}/${slug}/part-${String(index + 1).padStart(4, "0")}.md`;
      const url = `${site}/${filename}`;
      const body = `# ${slug} — part ${index + 1}/${parts.length}\n\n[Complete source](${site}/agent-guides/${guide.key}).\n\nThis continuation covers UTF-8 source bytes ${part.startByte}–${part.endByte}. Added fences make each part readable; the manifest records exact source ranges.\n\n${part.prefix}${part.source}${part.suffix}`;
      assertContextBudget(filename, body, budget);
      files.set(filename, body);
      links.push(`- [${slug}, part ${index + 1}/${parts.length}](${url})`);
      record.parts.push({ path: filename, url, bytes: Buffer.byteLength(body), sha256: sha256(body),
        sourceStartByte: part.startByte, sourceEndByte: part.endByte, sourceSha256: sha256(part.source),
        sourceOffsetByte: Buffer.byteLength(body) - Buffer.byteLength(part.source + part.suffix), sourceLengthBytes: Buffer.byteLength(part.source) });
    });
    groups.set(collection, links);
    manifest.guides.push(record);
  }
  const collectionLinks = [];
  for (const [collection, links] of [...groups].sort(([a], [b]) => a.localeCompare(b, "en"))) {
    const pages = [];
    let rows = [];
    let bytes = 0;
    for (const link of links) {
      const size = Buffer.byteLength(`${link}\n`);
      if (bytes + size > budget - 4096 && rows.length) { pages.push(rows); rows = []; bytes = 0; }
      rows.push(link); bytes += size;
    }
    if (rows.length) pages.push(rows);
    pages.forEach((page, index) => {
      const filename = `ai/context/${collection}/index-${index + 1}.md`;
      const body = `# Zeron ${collection} guides — index ${index + 1}/${pages.length}\n\n${page.join("\n")}\n`;
      assertContextBudget(filename, body, budget);
      files.set(filename, body);
      collectionLinks.push(`- [${collection}, index ${index + 1}/${pages.length}](${site}/${filename})`);
    });
  }
  const index = `${intro}\n## Coverage\n\n${coverage}\n\nThe complete guide collection exceeds the context budget. Read every linked classification index and its ordered parts; no source text has been discarded.\n\n${collectionLinks.join("\n")}\n\n[Source ranges and content hashes](${site}/ai/context/manifest.json)\n`;
  assertContextBudget("llms-full.txt", index, budget);
  files.set("llms-full.txt", index);
  files.set("ai/context/manifest.json", serialize(manifest));
  return files;
}
