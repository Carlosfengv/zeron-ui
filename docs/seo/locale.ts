import type { Metadata } from "next";
import type { AppLocale } from "@/app/_i18n/routing";

export const SITE_URL = "https://zeron-ui.vercel.app";

export function localizedPathname(pathname: string, locale: AppLocale) {
  return locale === "en" ? `/en${pathname === "/" ? "" : pathname}` : pathname;
}

export function localizedUrl(pathname: string, locale: AppLocale) {
  return `${SITE_URL}${localizedPathname(pathname, locale)}`;
}

export function localeAlternates(
  pathname: string,
  locale: AppLocale,
): Metadata["alternates"] {
  return {
    canonical: localizedPathname(pathname, locale),
    languages: {
      en: localizedPathname(pathname, "en"),
      "zh-CN": localizedPathname(pathname, "zh-CN"),
    },
  };
}
