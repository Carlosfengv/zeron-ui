import { describe, expect, it } from "vitest";
import { consumerImportExample } from "../scripts/lib/consumer-import-example.mjs";

describe("installed consumer module fallback", () => {
  it("bundles a block's installed entry rather than skipping its production build", () => {
    const snapshot = new Map([["new-block.json", JSON.stringify({ files: [
      { target: "components/blocks/new-block/data.ts" }, { target: "components/blocks/new-block/index.ts" },
    ] })]]);
    expect(consumerImportExample(snapshot, "new-block", "next")).toContain('import * as installed from "@/components/blocks/new-block/index"');
    expect(consumerImportExample(snapshot, "new-block", "vite")).toContain('from "@/src/components/blocks/new-block/index"');
    expect(consumerImportExample(snapshot, "new-block", "next")).toContain("Object.keys(installed)");
  });
  it("rejects missing entries and unsafe installation paths", () => {
    for (const target of [undefined, "../private.ts", "components/../../private.ts", "components/evil\".tsx"]) {
      const snapshot = new Map([["broken.json", JSON.stringify({ files: [{ target }] })]]);
      expect(() => consumerImportExample(snapshot, "broken", "next")).toThrow("entry");
    }
    expect(() => consumerImportExample(new Map(), "missing", "next")).toThrow("Missing");
  });
});
