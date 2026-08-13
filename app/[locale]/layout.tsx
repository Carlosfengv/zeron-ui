import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import "../globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppProviders } from "@/app/app-providers";
import { assertLocale } from "@/app/_i18n/locale";
import { routing } from "@/app/_i18n/routing";

type Props = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "site" });

  return {
    metadataBase: new URL("https://zeron-ui.vercel.app"),
    title: t("title"),
    description: t("description"),
    icons: {
      icon: [
        { url: "/metadata/favicon.svg", type: "image/svg+xml" },
        { url: "/metadata/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/metadata/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/metadata/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      ],
      shortcut: "/metadata/favicon.ico",
      apple: "/metadata/apple-touch-icon.png",
    },
    manifest: "/metadata/site.webmanifest",
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const messages = (await (
    locale === "en"
      ? import("@docs/content/en/common-slim.json")
      : import("@docs/content/zh-CN/common-slim.json")
  )).default;

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AppProviders>{children}</AppProviders>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
