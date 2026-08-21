import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { routing } from "../app/_i18n/routing";
import { localizedPathname } from "../docs/seo/locale";

const ROOT = new URL("..", import.meta.url).pathname;

describe("i18n routing", () => {
  it("keeps the localized site root from falling through to Next.js 404", () => {
    const rootPage = join(ROOT, "app/[locale]/page.tsx");

    expect(existsSync(rootPage)).toBe(true);
    expect(readFileSync(rootPage, "utf8")).toContain('href: "/docs/blocks"');
  });

  it("keeps Chinese canonical paths unprefixed and prefixes English paths", () => {
    expect(routing.localeDetection).toBe(false);
    expect(routing.alternateLinks).toBe(false);
    expect(routing.defaultLocale).toBe("zh-CN");
    expect(localizedPathname("/docs/button", "zh-CN")).toBe("/docs/button");
    expect(localizedPathname("/docs/button", "en")).toBe("/en/docs/button");
    expect(localizedPathname("/", "en")).toBe("/en");
  });
});
