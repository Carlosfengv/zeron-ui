import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/app/_i18n/locale";
import type { AppLocale } from "@/app/_i18n/routing";
import HomeContent from "@docs/pages/home";
import { readNpmRelease } from "@docs/lib/npm-release.server";
import { localeAlternates } from "@docs/seo/locale";

export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
};

async function homeMessages(locale: AppLocale) {
  return (await (locale === "en" ? import("@docs/content/en/home.json") : import("@docs/content/zh-CN/home.json"))).default;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const { home } = await homeMessages(locale);
  return { title: "Zeron UI · Zeron Design", description: home.description, alternates: localeAlternates("/", locale) };
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const [messages, introduction, release] = await Promise.all([
    homeMessages(locale),
    locale === "en" ? import("@docs/content/en/components/introduction.json") : import("@docs/content/zh-CN/components/introduction.json"),
    readNpmRelease(),
  ]);
  return (
    <NextIntlClientProvider locale={locale} messages={{ ...messages, ...introduction.default }}>
      <HomeContent release={release} />
    </NextIntlClientProvider>
  );
}
