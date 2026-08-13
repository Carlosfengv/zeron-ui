import type { MetadataRoute } from "next";
import { pageDocEntries, pathnameOf } from "@docs/manifest";
import { localizedUrl } from "@docs/seo/locale";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const paths = ["/", "/docs", ...pageDocEntries.map(pathnameOf)];

  return paths.flatMap((pathname) =>
    (["en", "zh-CN"] as const).map((locale) => ({
      url: localizedUrl(pathname, locale),
      lastModified,
      changeFrequency: pathname.startsWith("/docs") ? "weekly" : "monthly",
      priority: pathname === "/" ? 1 : pathname.startsWith("/docs") ? 0.8 : 0.5,
      alternates: {
        languages: {
          en: localizedUrl(pathname, "en"),
          "zh-CN": localizedUrl(pathname, "zh-CN"),
        },
      },
    })),
  );
}
