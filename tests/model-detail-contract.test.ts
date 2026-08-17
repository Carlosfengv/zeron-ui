import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(join(ROOT, "packages/blocks/src/application/model-detail-01/model-detail.tsx"), "utf8");
const data = readFileSync(join(ROOT, "packages/blocks/src/application/model-detail-01/model-detail-data.ts"), "utf8");
const registry = readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8");

describe("Model detail block contract", () => {
  it("keeps the API-key flow product-owned and never supplies a key", () => {
    expect(source).toContain("onRequestApiKey?: () => void;");
    expect(source).toContain('disabled={!onRequestApiKey}');
    expect(source).not.toContain("sk-");
  });

  it("uses explicit code and benchmark data contracts", () => {
    expect(data).toContain("export interface ModelCodeSample");
    expect(data).toContain("export interface ModelBenchmarkColumn");
    expect(data).toContain("columns: readonly ModelBenchmarkColumn[];");
    expect(source).toContain("row.values[column.key] ?? \"—\"");
    expect(source).not.toContain("Object.keys(codeSamples)");
  });

  it("renders data-driven code tabs and registers the installable block", () => {
    expect(source).toContain("model.codeSamples.map");
    expect(source).toContain("onCopyCode?.(sample.language)");
    expect(registry).toContain('"name": "model-detail-01"');
  });

  it("falls back to the first available sample when its data changes", () => {
    expect(source).toContain("function resolveLanguage");
    expect(source).toContain("setLanguage(resolveLanguage(model, defaultLanguage));");
    expect(data).not.toContain("\\\\\\n+");
  });

  it("matches the Figma Agent icon rail and exposes names through tooltips", () => {
    expect(data).toContain("MoonshotMono");
    expect(data).toContain("ClaudeColor");
    expect(data).toContain("CodexColor");
    expect(data).toContain('import clineLogo from "./assets/cline.svg"');
    expect(data).toContain("ClaudeCodeColor");
    expect(data).toContain("OpenCodeMono");
    expect(source).toContain("agent.logo &&");
    expect(source).toContain('from "@zeron/ui/tooltip"');
    expect(source).toContain("content={agent.name}");
    expect(source).toContain("size=\"xl\" variant=\"ghost\" iconOnly");
    expect(source).toContain("gap-3 p-1");
    expect(source).toContain("size-10 !p-1 border border-border bg-transparent leading-none");
    expect(source).toContain("items-center justify-center align-middle leading-none");
    expect(registry).toContain('"tooltip"');
    expect(registry).toContain('"dependencies": ["tw-animate-css", "@lobehub/icons"]');
  });
});
