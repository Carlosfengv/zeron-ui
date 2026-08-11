import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { detailDocEntries, docManifest, pageDocEntries } from "../src/docs/manifest";

const ROOT = new URL("..", import.meta.url).pathname;

describe("documentation manifest", () => {
  it("defines the complete public documentation surface exactly once", () => {
    expect(pageDocEntries).toHaveLength(37);
    expect(detailDocEntries).toHaveLength(35);
    expect(docManifest.filter((entry) => entry.kind === "redirect")).toHaveLength(1);
    expect(new Set(docManifest.map((entry) => entry.pathname)).size).toBe(docManifest.length);
  });

  it("has a localized route wrapper for every formal detail page", () => {
    for (const entry of detailDocEntries.filter((entry) => entry.id !== "introduction")) {
      expect(
        existsSync(join(ROOT, "app/[locale]/docs", entry.id, "page.tsx")),
        entry.id,
      ).toBe(true);
    }
  });

  it("tracks and supplies both message files for every formal page", () => {
    const progress = JSON.parse(
      readFileSync(join(ROOT, "localdocs/i18n-translation-progress.json"), "utf8"),
    ) as { pages: Record<string, string> };

    for (const entry of pageDocEntries) {
      expect(progress.pages[entry.id], entry.id).toBe("verified");
      const filename = entry.id === "home" ? "home.json" : `docs/${entry.id}.json`;
      expect(existsSync(join(ROOT, "messages/en", filename)), `en:${entry.id}`).toBe(true);
      expect(existsSync(join(ROOT, "messages/zh-CN", filename)), `zh-CN:${entry.id}`).toBe(true);
    }
  });
});
