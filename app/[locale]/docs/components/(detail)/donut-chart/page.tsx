import { permanentRedirect } from "next/navigation";
import { assertLocale } from "@/app/_i18n/locale";

type Props = { params: Promise<{ locale: string }> };

export default async function DocumentationPage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  permanentRedirect(`${locale === "en" ? "/en" : ""}/docs/components/pie-chart`);
}
