import { setRequestLocale } from "next-intl/server";
import { iconPageLoaders } from "@docs/generated/icon-page-loaders.generated";
import {
  generateDocMetadata,
  generateDocStaticParamsForCollection,
  renderDocPage,
} from "@docs/server/render-page";
import { assertLocale } from "@/app/_i18n/locale";

export const dynamicParams = false;
export const generateStaticParams = () => generateDocStaticParamsForCollection("icons", iconPageLoaders);

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  return generateDocMetadata({ locale, collection: "icons", slug });
}

export default async function IconDocumentationPage({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return renderDocPage({ locale, collection: "icons", slug, pageLoaders: iconPageLoaders });
}
