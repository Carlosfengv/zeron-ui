import { describe, expect, it } from "vitest";
import { buildFullContext, assertContextBudget, splitMarkdownSource } from "../scripts/agent-context.mjs";
import { sha256 } from "../scripts/agent-utils.mjs";

describe("bounded static agent context", () => {
  it("keeps small complete collections in the existing single-file shape", () => {
    const files = buildFullContext({ intro: "# Rules\n", guides: [{ key: "components/button.md", text: "# Button\nBody\n" }], site: "https://docs.example" });
    expect([...files.keys()]).toEqual(["llms-full.txt"]);
    expect(files.get("llms-full.txt")).toContain("# Button\nBody\n");
  });
  it("splits by classification and exposes every original byte through verified ranges", () => {
    const guides = [
      { key: "components/input.md", text: `# Input\n\n\`\`\`\`tsx\n${"const name = '中文🙂';\n".repeat(5000)}\`\`\`\nnot the outer fence\n\`\`\`\`\n` },
      { key: "blocks/list-01.md", text: `# List\n${"连续中文🙂".repeat(8000)}\n## States\nEnd\n` },
    ];
    const budget = 32768;
    const files = buildFullContext({ intro: "# Rules\n", guides, site: "https://docs.example", budget });
    const manifest = JSON.parse(files.get("ai/context/manifest.json"));
    expect(files.get("llms-full.txt")).toContain("/ai/context/components/index-1.md");
    expect(files.get("llms-full.txt")).toContain("/ai/context/blocks/index-1.md");
    for (const [name, text] of files) if (name.endsWith(".md") || name.endsWith(".txt")) expect(Buffer.byteLength(text)).toBeLessThanOrEqual(budget);
    for (const guide of manifest.guides) {
      let offset = 0;
      const source = guide.parts.map((part) => {
        const body = files.get(part.path);
        expect(sha256(body)).toBe(part.sha256);
        expect(part.sourceStartByte).toBe(offset);
        offset = part.sourceEndByte;
        const exact = Buffer.from(body).subarray(part.sourceOffsetByte, part.sourceOffsetByte + part.sourceLengthBytes);
        expect(sha256(exact)).toBe(part.sourceSha256);
        expect(exact.toString("utf8")).not.toContain("\uFFFD");
        return exact;
      });
      const complete = Buffer.concat(source);
      expect(complete.length).toBe(guide.bytes);
      expect(sha256(complete)).toBe(guide.sha256);
      expect(complete.toString("utf8")).toBe(guides.find((item) => item.key === guide.key).text);
    }
  });
  it("closes and reopens fenced continuations without treating an inner shorter fence as the end", () => {
    const source = `\`\`\`\`tsx\n${"x\n".repeat(6000)}\`\`\`\n${"y\n".repeat(6000)}\`\`\`\`\n`;
    const parts = splitMarkdownSource(source, 8192);
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.map((part) => part.source).join("")).toBe(source);
    for (const part of parts) {
      const text = part.prefix + part.source + part.suffix;
      expect((text.match(/^````.*$/gm) ?? []).length % 2).toBe(0);
    }
  });
  it("enforces instructions budget in actual UTF-8 bytes", () => {
    expect(() => assertContextBudget("ai/instructions.md", "文".repeat(3000), 8192)).toThrow("8192 byte");
  });
});
