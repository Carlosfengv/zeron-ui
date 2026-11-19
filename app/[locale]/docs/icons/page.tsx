import { setRequestLocale } from "next-intl/server";
import { docEntries, pathnameOf } from "@docs/manifest";
import { localizedPathname } from "@docs/seo/locale";
import { assertLocale } from "@/app/_i18n/locale";

export default async function IconsCollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const entries = docEntries.filter((entry) => entry.collection === "icons");
  const isEn = locale === "en";

  return (
    <section aria-labelledby="collection-title" className="mx-auto mt-12 w-full max-w-5xl px-6 py-20 sm:py-28 lg:mt-0">
      <p className="text-label text-fg-muted">{isEn ? "Design System · Icons" : "设计系统 · 语义图标库"}</p>
      <h1 id="collection-title" className="mt-2 text-heading font-semibold text-fg-default">
        {isEn ? "Multi-Style Semantic Icons" : "多风格语义图标系统"}
      </h1>
      <p className="mt-2 max-w-2xl text-body text-fg-muted">
        {isEn
          ? "Use semantic icon slots to keep product code independent of the icon pack. Stroke Rounded is included. Projects with a licensed Pro provider can also enable Bulk and Duotone."
          : "使用语义槽位引用图标，默认提供 Stroke Rounded 线条风格。接入已授权的 Pro Provider 后，项目还可启用填充与双色风格。"}
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <a className="block rounded-xl border border-border bg-surface-raised p-5 transition-colors hover:bg-hover" href={localizedPathname(pathnameOf(entry), locale)}>
              <span className="font-medium text-fg-default">{entry.name}</span>
              {entry.description && <span className="mt-1.5 block text-body text-fg-muted">{entry.description}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
