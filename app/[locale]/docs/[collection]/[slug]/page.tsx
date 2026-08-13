import { setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/app/_i18n/locale";
import {
  generateDocMetadata,
  generateDocStaticParams,
  renderDocPage,
} from "@docs/server/render-page";

export const dynamicParams = false;
export const generateStaticParams = generateDocStaticParams;

type Props = {
  params: Promise<{ locale: string; collection: string; slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale, collection, slug } = await params;
  assertLocale(locale);
  return generateDocMetadata({ locale, collection, slug });
}

export default async function DocumentationPage({ params }: Props) {
  const { locale, collection, slug } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return renderDocPage({ locale, collection, slug });
}
