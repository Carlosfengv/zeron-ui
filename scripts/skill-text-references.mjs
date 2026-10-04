import { TextDecoder } from "node:util";
import { isSkillTextReference, pairedSkillNames, parseSkillTextSelection, skillTextSelectionPath } from "../lib/agent-catalog/skill-references.mjs";
import { sha256 } from "./agent-utils.mjs";

const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
export function decodeSkillText(bytes) {
  const text = decoder.decode(bytes);
  if (text.includes("\0")) throw new Error("Skill text contains NUL");
  return text;
}

/** Absence supports legacy bundles; a present but missing/malformed selection never falls back. */
export function selectSkillTextFiles(files, selectionText) {
  const hasSelection = files.some(file => file.path === skillTextSelectionPath);
  if (!hasSelection && selectionText !== undefined) throw new Error("Unlisted Skill text selection");
  if (hasSelection && selectionText === undefined) throw new Error("Missing Skill text selection bytes");
  const paths = hasSelection ? parseSkillTextSelection(JSON.parse(selectionText), files.map(file => file.path))
    : files.filter(file => file.path.endsWith(".md")).map(file => file.path).sort();
  for (const reference of paths) {
    const [name, ...parts] = reference.split("/");
    if (!pairedSkillNames.includes(name) || !isSkillTextReference(parts.join("/"))) throw new Error("Invalid selected Skill reference");
  }
  if (!pairedSkillNames.every(name => paths.includes(`${name}/SKILL.md`))) throw new Error("Missing paired Skill entrypoints");
  return paths.map(reference => files.find(file => file.path === reference));
}

/** Read only registered files and verify their original bytes before decoding or interpreting policy. */
export async function readSkillTexts(files, readBytes) {
  if (!Array.isArray(files) || files.length > 256 || new Set(files.map(file => file.path)).size !== files.length
    || files.some(file => !Number.isSafeInteger(file.bytes) || file.bytes < 0 || file.bytes > 8 * 1024 * 1024 || !/^[a-f0-9]{64}$/.test(file.sha256))
    || files.reduce((sum, file) => sum + file.bytes, 0) > 32 * 1024 * 1024) throw new Error("Invalid Skill source inventory");
  const read = async file => {
    const bytes = await readBytes(file.path);
    if (!(bytes instanceof Uint8Array) || bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`Skill text hash/size mismatch: ${file.path}`);
    return decodeSkillText(bytes);
  };
  const policy = files.find(file => file.path === skillTextSelectionPath);
  const selectionText = policy ? await read(policy) : undefined;
  const selected = selectSkillTextFiles(files, selectionText);
  const texts = Object.fromEntries(pairedSkillNames.map(name => [name, {}]));
  for (const file of selected) {
    const [name, ...parts] = file.path.split("/");
    texts[name][parts.join("/")] = file === policy ? selectionText : await read(file);
  }
  return texts;
}
