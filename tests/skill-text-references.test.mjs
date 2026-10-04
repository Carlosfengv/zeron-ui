import { describe, expect, it } from "vitest";
import { decodeSkillText, readSkillTexts, selectSkillTextFiles } from "../scripts/skill-text-references.mjs";
import { isSkillTextReference, skillTextSelectionPath } from "../lib/agent-catalog/skill-references.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

function fixture({ selection = true, policy, extra = new Map() } = {}) {
  const bytes = new Map([["zeron-page-builder/SKILL.md", Buffer.from("# Builder\n")], ["swap-to-zeronui/SKILL.md", Buffer.from("# Migration\n")],
    ["zeron-page-builder/agents/openai.yaml", Buffer.from("---\r\n# exact text\r\n名字: 🙂")],
    ["swap-to-zeronui/scripts/example.mjs", Buffer.from("throw new Error('must not execute');")],
    ["zeron-page-builder/assets/unselected.txt", Buffer.from("Not exposed")], ...extra]);
  if (selection) bytes.set(skillTextSelectionPath, Buffer.from(serialize(policy ?? { schemaVersion: 1,
    references: [...bytes.keys()].filter(key => !key.endsWith("unselected.txt")).concat(skillTextSelectionPath).sort() })));
  const files = [...bytes].map(([path, raw]) => ({ path, bytes: raw.length, sha256: sha256(raw) })).sort((a, b) => a.path < b.path ? -1 : 1);
  return { bytes, files, read: key => bytes.get(key) };
}

describe("manifest-bound Skill text selection", () => {
  it("reads only explicitly selected original bytes, including YAML and scripts as inert text", async () => {
    const input = fixture();
    const actual = await readSkillTexts(input.files, input.read);
    expect(actual["zeron-page-builder"]["agents/openai.yaml"]).toBe("---\r\n# exact text\r\n名字: 🙂");
    expect(actual["swap-to-zeronui"]["scripts/example.mjs"]).toBe("throw new Error('must not execute');");
    expect(actual["zeron-page-builder"]["assets/unselected.txt"]).toBeUndefined();
    for (const [name, references] of Object.entries(actual)) for (const [relative, text] of Object.entries(references)) {
      expect(Buffer.from(text)).toEqual(input.bytes.get(`${name}/${relative}`));
    }
  });
  it("preserves a UTF-8 BOM, CRLF and missing final newline", () => {
    const raw = Buffer.from("\uFEFFfirst\r\n中文🙂");
    expect(Buffer.from(decodeSkillText(raw))).toEqual(raw);
  });
  it("keeps legacy selection restricted to that manifest's Markdown even when newer paths exist", async () => {
    const input = fixture({ selection: false });
    const read = key => { expect(key.endsWith(".md")).toBe(true); return input.read(key); };
    expect(await readSkillTexts(input.files, read)).toEqual({ "zeron-page-builder": { "SKILL.md": "# Builder\n" }, "swap-to-zeronui": { "SKILL.md": "# Migration\n" } });
    expect(() => selectSkillTextFiles(input.files, "{}")).toThrow("Unlisted");
  });
  it("rejects missing or changed selection bytes instead of falling back to Markdown", async () => {
    const input = fixture();
    expect(() => selectSkillTextFiles(input.files)).toThrow("Missing");
    await expect(readSkillTexts(input.files, key => key === skillTextSelectionPath ? Buffer.from("{}") : input.read(key))).rejects.toThrow("hash/size");
    await expect(readSkillTexts(input.files, key => key === skillTextSelectionPath ? undefined : input.read(key))).rejects.toThrow("hash/size");
  });
  it("rejects malformed JSON, unknown policy fields, unsorted, duplicate, omitted or foreign paths", async () => {
    const valid = fixture();
    const original = JSON.parse(valid.bytes.get(skillTextSelectionPath));
    const variants = [
      { ...original, schemaVersion: 2 }, { ...original, extra: true }, { ...original, references: [...original.references].reverse() },
      { ...original, references: [...original.references, original.references[0]].sort() },
      { ...original, references: original.references.filter(key => key !== skillTextSelectionPath) },
      { ...original, references: original.references.filter(key => key !== "swap-to-zeronui/SKILL.md") },
      { ...original, references: [...original.references, "zeron-page-builder/../private.json"].sort() },
      { ...original, references: [...original.references, "other/SKILL.md"].sort() },
      { ...original, references: [...original.references, "zeron-page-builder/assets/missing.json"].sort() },
    ];
    for (const policy of variants) {
      const input = fixture({ policy });
      await expect(readSkillTexts(input.files, input.read)).rejects.toThrow();
    }
    const malformed = fixture();
    malformed.bytes.set(skillTextSelectionPath, Buffer.from("not JSON"));
    const files = malformed.files.map(file => file.path === skillTextSelectionPath ? { ...file, bytes: 8, sha256: sha256("not JSON") } : file);
    await expect(readSkillTexts(files, malformed.read)).rejects.toThrow();
  });
  it("rejects binary or invalid UTF-8 even when explicitly selected", async () => {
    for (const raw of [Buffer.from([0xc3, 0x28]), Buffer.from("valid\0text")]) {
      const input = fixture({ extra: new Map([["zeron-page-builder/assets/binary.txt", raw]]) });
      await expect(readSkillTexts(input.files, input.read)).rejects.toThrow();
    }
    expect(isSkillTextReference("assets/image.png")).toBe(false);
    expect(isSkillTextReference("references//guide.md")).toBe(false);
    expect(isSkillTextReference("/outside.json")).toBe(false);
  });
  it("rejects tampered selected file bytes and duplicate or excessive inventories", async () => {
    const input = fixture();
    await expect(readSkillTexts(input.files, key => key.endsWith("openai.yaml") ? Buffer.from("changed") : input.read(key))).rejects.toThrow("hash/size");
    await expect(readSkillTexts([...input.files, input.files[0]], input.read)).rejects.toThrow("inventory");
    await expect(readSkillTexts(input.files.map(file => ({ ...file, bytes: 9 * 1024 * 1024 })), input.read)).rejects.toThrow("inventory");
  });
});
