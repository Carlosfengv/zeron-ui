import type { MetadataRoute } from "next";
import { pageDocEntries } from "@/docs/manifest";
import { localizedUrl } from "@/i18n/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return pageDocEntries.flatMap((entry) =>
    (["en", "zh-CN"] as const).map((locale) => ({
      url: localizedUrl(entry.pathname, locale),
      lastModified,
      changeFrequency: entry.pathname.startsWith("/docs") ? "weekly" : "monthly",
      priority: entry.pathname === "/" ? 1 : entry.pathname.startsWith("/docs") ? 0.8 : 0.5,
      alternates: {
        languages: {
          en: localizedUrl(entry.pathname, "en"),
          "zh-CN": localizedUrl(entry.pathname, "zh-CN"),
        },
      },
    })),
  );
}
