import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "zh-CN"],
  defaultLocale: "en",
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      "zh-CN": "/zh-cn",
    },
  },
  localeDetection: false,
  alternateLinks: false,
});

export type AppLocale = (typeof routing.locales)[number];
