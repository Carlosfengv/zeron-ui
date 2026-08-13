import { permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/app/_i18n/locale";
import { getLegacyDocRedirect, pathnameOf } from "@docs/manifest";
import { localizedPathname } from "@docs/seo/locale";
import { generateCollectionStaticParams, renderCollectionPage } from "@docs/server/render-page";

export const dynamicParams = false;
export const generateStaticParams = generateCollectionStaticParams;

type Props = { params: Promise<{ locale: string; collection: string }> };

export default async function DocumentationCollectionPage({ params }: Props) {
  const { locale, collection } = await params;
  assertLocale(locale);
  setRequestLocale(locale);

  const legacy = getLegacyDocRedirect(collection);
  if (legacy) permanentRedirect(localizedPathname(pathnameOf(legacy.destination), locale));

  return renderCollectionPage({ collection, locale });
}
