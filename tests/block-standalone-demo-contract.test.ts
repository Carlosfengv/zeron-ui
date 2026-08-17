import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("standalone block demos", () => {
  const route = source("app/[locale]/block-demo/[slug]/page.tsx");
  const demo = source("docs/components/blocks/StandaloneBlockDemo.tsx");
  const slugs = source("docs/components/blocks/standalone-blocks.ts");
  const shell = source("docs/components/shell/site/sidebar-layout.tsx");
  const middleware = source("middleware.ts");
  const preview = source("docs/components/content/ComponentPreview.tsx");

  it("gives every registered block a dedicated, static standalone route", () => {
    expect(route).toContain("export const dynamicParams = false;");
    expect(route).toContain("standaloneBlockSlugs.map");
    expect(route).toContain('className="h-svh w-screen overflow-hidden bg-surface-base"');
    expect(slugs).toContain('"resource-catalog-01"');
    expect(slugs).toContain('"zlrlist"');
    expect(demo).toContain('case "resource-catalog-01"');
    expect(demo).toContain('case "zlrlist"');
  });

  it("keeps standalone routes outside the documentation shell", () => {
    expect(shell).toContain('pagePathname.startsWith("/block-demo/")');
    expect(shell).toContain("const pagePathname = internalPathname(pathname);");
    expect(middleware).toContain('"/block-demo/:path*"');
    expect(middleware).toContain('"/(en|zh-cn)/block-demo/:path*"');
  });

  it("keeps the standalone-demo action available on both preview tabs", () => {
    expect(preview).toContain("{standaloneHref && (");
    expect(preview).not.toContain("{standaloneHref && tab === 0 && (");
  });
});
