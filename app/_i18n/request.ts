import { getRequestConfig } from "next-intl/server";
import { assertLocale } from "./locale";

const commonMessages = {
  en: () => import("@docs/content/en/common-slim.json"),
  "zh-CN": () => import("@docs/content/zh-CN/common-slim.json"),
} as const;

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? "zh-CN";
  assertLocale(resolvedLocale);

  return {
    locale: resolvedLocale,
    messages: (await commonMessages[resolvedLocale]()).default,
  };
});
