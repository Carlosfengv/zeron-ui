import { redirect } from "@/app/_i18n/navigation";
import { assertLocale } from "@/app/_i18n/locale";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);

  redirect({
    href: "/docs/blocks",
    locale,
  });
}
