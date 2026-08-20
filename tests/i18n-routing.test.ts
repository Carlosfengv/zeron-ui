import { describe, expect, it } from "vitest";
import { routing } from "../app/_i18n/routing";
import { localizedPathname } from "../docs/seo/locale";

describe("i18n routing", () => {
  it("keeps Chinese canonical paths unprefixed and prefixes English paths", () => {
    expect(routing.localeDetection).toBe(false);
    expect(routing.alternateLinks).toBe(false);
    expect(routing.defaultLocale).toBe("zh-CN");
    expect(localizedPathname("/docs/button", "zh-CN")).toBe("/docs/button");
    expect(localizedPathname("/docs/button", "en")).toBe("/en/docs/button");
    expect(localizedPathname("/", "en")).toBe("/en");
  });
});
