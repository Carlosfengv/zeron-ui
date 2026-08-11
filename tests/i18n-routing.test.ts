import { describe, expect, it } from "vitest";
import { routing } from "../src/i18n/routing";
import { localizedPathname } from "../src/i18n/seo";

describe("i18n routing", () => {
  it("keeps English canonical paths unprefixed and uses the agreed Chinese prefix", () => {
    expect(routing.localeDetection).toBe(false);
    expect(routing.alternateLinks).toBe(false);
    expect(localizedPathname("/docs/button", "en")).toBe("/docs/button");
    expect(localizedPathname("/docs/button", "zh-CN")).toBe("/zh-cn/docs/button");
    expect(localizedPathname("/", "zh-CN")).toBe("/zh-cn");
  });
});
