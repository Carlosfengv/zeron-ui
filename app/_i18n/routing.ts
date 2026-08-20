import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["zh-CN", "en"],
  defaultLocale: "zh-CN",
  localePrefix: {
    mode: "as-needed",
    prefixes: {
      en: "/en",
    },
  },
  localeDetection: false,
  alternateLinks: false,
});

export type AppLocale = (typeof routing.locales)[number];
