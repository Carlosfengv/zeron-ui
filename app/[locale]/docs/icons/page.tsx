import { setRequestLocale } from "next-intl/server";
import { docEntries, pathnameOf } from "@docs/manifest";
import { localizedPathname } from "@docs/seo/locale";
import { assertLocale } from "@/app/_i18n/locale";

export default async function IconsCollectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const entries = docEntries.filter((entry) => entry.collection === "icons");

  return (
    <section aria-labelledby="collection-title" className="mx-auto mt-12 w-full max-w-5xl px-6 py-20 sm:py-28 lg:mt-0">
      <p className="text-label text-fg-muted">Documentation</p>
      <h1 id="collection-title" className="mt-2 text-display font-semibold text-fg-default">icons</h1>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.slug}>
            <a className="block rounded-lg border border-border p-4 transition-colors hover:bg-hover" href={localizedPathname(pathnameOf(entry), locale)}>
              <span className="font-medium text-fg-default">{entry.name}</span>
              {entry.description && <span className="mt-1 block text-body text-fg-muted">{entry.description}</span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
