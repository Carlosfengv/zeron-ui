import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectionDefinitions,
  detailDocEntries,
  legacyDocRedirects,
  pageDocEntries,
  pathnameOf,
} from "../docs/manifest";

const ROOT = new URL("..", import.meta.url).pathname;

describe("documentation manifest", () => {
  it("defines the complete public documentation surface exactly once", () => {
    expect(collectionDefinitions.map(({ id }) => id)).toEqual(["components", "blocks", "icons"]);
    expect(pageDocEntries).toHaveLength(51);
    expect(detailDocEntries).toHaveLength(51);
    expect(legacyDocRedirects).toHaveLength(45);
    expect(new Set(pageDocEntries.map(pathnameOf)).size).toBe(pageDocEntries.length);
  });

  it("uses one generic route and a generated page-loader map for every formal detail page", () => {
    expect(existsSync(join(ROOT, "app/[locale]/docs/[collection]/[slug]/page.tsx"))).toBe(true);
    const loaders = readFileSync(join(ROOT, "docs/generated/page-loaders.generated.ts"), "utf8");
    for (const entry of detailDocEntries) {
      expect(loaders).toContain(`\"${entry.collection}/${entry.slug}\"`);
      expect(existsSync(join(ROOT, "docs/pages", entry.collection, entry.slug, "page.tsx")), entry.slug).toBe(true);
    }
  });

  it("tracks and supplies both message files for every formal page", () => {
    const progress = JSON.parse(
      readFileSync(join(ROOT, "localdocs/i18n-translation-progress.json"), "utf8"),
    ) as { pages: Record<string, string> };

    expect(progress.pages.home).toBe("verified");
    expect(progress.pages.introduction).toBe("verified");
    expect(existsSync(join(ROOT, "docs/content/en/home.json"))).toBe(true);
    expect(existsSync(join(ROOT, "docs/content/zh-CN/home.json"))).toBe(true);
    for (const entry of pageDocEntries) {
      expect(progress.pages[`${entry.collection}/${entry.slug}`] ?? progress.pages[entry.slug], entry.slug).toBe("verified");
      const filename = `${entry.collection}/${entry.slug}.json`;
      expect(existsSync(join(ROOT, "docs/content/en", filename)), `en:${entry.slug}`).toBe(true);
      expect(existsSync(join(ROOT, "docs/content/zh-CN", filename)), `zh-CN:${entry.slug}`).toBe(true);
    }
  });
});
