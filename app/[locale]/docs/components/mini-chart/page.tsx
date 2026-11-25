import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/app/_i18n/locale";
import { MiniChartGallery } from "./chart-gallery";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "en" ? "Mini Charts | Zeron UI" : "迷你图表 | Zeron UI" };
}

export default async function MiniChartPage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return <MiniChartGallery locale={locale} />;
}
