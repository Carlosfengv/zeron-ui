import { permanentRedirect } from "next/navigation";
import { getPathname } from "@/app/_i18n/navigation";
import { assertLocale } from "@/app/_i18n/locale";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LegacyBaseComboboxPage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);

  permanentRedirect(
    getPathname({
      href: "/docs/components/combobox",
      locale,
    })
  );
}
