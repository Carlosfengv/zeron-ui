import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { docEntries } from "../docs/manifest";
import { componentCoverSrc } from "../docs/lib/component-covers";

const workspace = process.cwd();
const componentEntries = docEntries.filter((entry) => entry.collection === "components");

describe("component gallery covers", () => {
  it("includes a light and dark static cover for every documented component", () => {
    for (const entry of componentEntries) {
      for (const theme of ["light", "dark"] as const) {
        const coverPath = path.join(workspace, "public", componentCoverSrc(entry.slug, theme));
        expect(fs.existsSync(coverPath), `Missing ${theme} cover for ${entry.slug}`).toBe(true);
        expect(fs.statSync(coverPath).size).toBeGreaterThan(1_000);
      }
    }
  });

  it("keeps the generation source and gallery renderer connected", () => {
    const generator = fs.readFileSync(path.join(workspace, "scripts/generate-component-covers.mjs"), "utf8");
    const gallery = fs.readFileSync(path.join(workspace, "docs/components/components/ComponentsGallery.tsx"), "utf8");

    expect(generator).toContain("data-component-cover-source");
    expect(generator).toContain('data-slot="component-preview-content"');
    expect(generator).toContain("data-component-cover-subject");
    expect(gallery).toContain("componentCoverSrc(entry.slug, coverTheme)");
  });
});
