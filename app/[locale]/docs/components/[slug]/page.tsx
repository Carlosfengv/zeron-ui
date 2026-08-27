import { setRequestLocale } from "next-intl/server";
import { componentPageLoaders } from "@docs/generated/component-page-loaders.generated";
import {
  generateDocMetadata,
  generateDocStaticParamsForCollection,
  renderDocPage,
} from "@docs/server/render-page";
import { assertLocale } from "@/app/_i18n/locale";

export const dynamicParams = false;
export const generateStaticParams = () => generateDocStaticParamsForCollection("components", componentPageLoaders);

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  return generateDocMetadata({ locale, collection: "components", slug });
}

export default async function ComponentDocumentationPage({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return renderDocPage({ locale, collection: "components", slug, pageLoaders: componentPageLoaders });
}
