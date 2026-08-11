import { redirect } from "@/i18n/navigation";
import { assertLocale } from "@/i18n/locale";

export default async function TabsSubtle({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  redirect({ href: "/docs/tabs", locale });
}
