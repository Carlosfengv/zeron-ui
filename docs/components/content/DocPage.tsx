import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { docEntries, type DocCollection } from "@docs/manifest";
import { DocPager } from "@docs/components/navigation/DocPager";
import { InstallCommand } from "@docs/components/content/InstallCommand";

const BASE_UI_BACKED_SLUGS = new Set([
  "color-picker",
  "ask-user-questions",
  "input-group",
  "separator",
]);

interface DocPageProps {
  title: string;
  description: ReactNode;
  slug?: string;
  installSlug?: string;
  showInstall?: boolean;
  collection?: DocCollection;
  children: ReactNode;
}

export function DocPage({
  title,
  description,
  slug,
  installSlug,
  showInstall = true,
  collection = "components",
  children,
}: DocPageProps) {
  const t = useTranslations("common");
  const meta = useTranslations("docMeta");
  const collectionEntries = docEntries.filter((entry) => entry.collection === collection);
  const currentIndex = slug ? collectionEntries.findIndex((component) => component.slug === slug) : -1;
  const prev = currentIndex > 0
    ? collectionEntries[currentIndex - 1]
    : currentIndex === 0
      ? { slug: "", name: collection, collection, pathname: `/docs/${collection}` }
      : null;
  const next = currentIndex >= 0 && currentIndex < collectionEntries.length - 1
    ? collectionEntries[currentIndex + 1]
    : null;
  const registrySlug = installSlug ?? slug;

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-heading text-fg-default leading-none mb-2 font-bold">
            {title}
          </h1>
          <p className="text-body text-fg-muted">
            {slug && meta.has(`descriptions.${slug}`) ? meta(`descriptions.${slug}`) : description}
          </p>
        </div>
        {slug && <DocPager prev={prev} next={next} />}
      </div>

      {slug && registrySlug && showInstall && (
        <div className="flex flex-col gap-3">
          <h2 className="text-title text-fg-default leading-none font-semibold">
            {t("installation")}
          </h2>
          <InstallCommand value={`npx zeron-ui add ${registrySlug}`} />
          {BASE_UI_BACKED_SLUGS.has(registrySlug) && (
            <p className="text-label text-fg-muted">{t("builtOnBaseUi")}</p>
          )}
        </div>
      )}

      {children}
    </div>
  );
}

export function DocSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-title text-fg-default leading-none font-semibold">
        {title}
      </h2>
      {children}
    </div>
  );
}
