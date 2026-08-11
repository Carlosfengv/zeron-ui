import { getRequestConfig } from "next-intl/server";
import { assertLocale } from "./locale";

const commonMessages = {
  en: () => import("../../messages/en/common-slim.json"),
  "zh-CN": () => import("../../messages/zh-CN/common-slim.json"),
} as const;

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale ?? "en";
  assertLocale(resolvedLocale);

  return {
    locale: resolvedLocale,
    messages: (await commonMessages[resolvedLocale]()).default,
  };
});
