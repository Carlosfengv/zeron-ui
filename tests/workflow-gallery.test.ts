import { describe, expect, it } from "vitest";
import { galleryArtifacts, standalonePages } from "../docs/catalog/standalone-pages";
import { artifactCatalog } from "../docs/catalog/artifacts";

describe("standalone workflow gallery entry", () => {
  it("is searchable in Pages and links directly to the existing standalone route", () => {
    const page = galleryArtifacts.find((entry) => entry.slug === "workflow");
    expect(page).toMatchObject({ collection: "pages", kind: "page", href: "/workflow", readiness: "demo-only" });
    expect(page?.searchTerms).toContain("工作流");
    expect(page?.searchTerms).toContain("workflow");
  });
  it("preserves the Registry catalog and keeps local pages out of Blocks", () => {
    expect(galleryArtifacts).toHaveLength(artifactCatalog.length + standalonePages.length);
    expect(artifactCatalog.some((entry) => entry.slug === "workflow")).toBe(false);
    expect(galleryArtifacts.filter((entry) => entry.collection === "blocks").some((entry) => entry.slug === "workflow")).toBe(false);
    expect(standalonePages[0].installation).toBeUndefined();
  });
});
