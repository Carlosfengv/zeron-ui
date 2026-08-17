import { setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/app/_i18n/locale";
import GuidesPage from "@docs/pages/guides";

export default async function GuidesRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  return <GuidesPage />;
}
