import { setRequestLocale } from "next-intl/server";
import { blockPageLoaders } from "@docs/generated/block-page-loaders.generated";
import {
  generateDocMetadata,
  generateDocStaticParamsForCollection,
  renderDocPage,
} from "@docs/server/render-page";
import { assertLocale } from "@/app/_i18n/locale";

export const dynamicParams = false;
export const generateStaticParams = () => generateDocStaticParamsForCollection("blocks", blockPageLoaders);

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  return generateDocMetadata({ locale, collection: "blocks", slug });
}

export default async function BlockDocumentationPage({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return renderDocPage({ locale, collection: "blocks", slug, pageLoaders: blockPageLoaders });
}
