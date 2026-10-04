import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { assertLocale } from "@/app/_i18n/locale";
import AiContent from "@docs/pages/ai";
import { PageMessages } from "@docs/i18n/page-provider";
import { localeAlternates } from "@docs/seo/locale";
import { snapshots } from "@/lib/agent-catalog/runtime";

async function messages(locale: string) {
  return (await (locale === "en" ? import("@docs/content/en/docs/ai.json") : import("@docs/content/zh-CN/docs/ai.json"))).default;
}
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const text = await messages(locale);
  return { title: text.title, description: text.description, alternates: localeAlternates("/docs/ai", locale) };
}
export default async function AiPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const text = await messages(locale);
  const mode = snapshots.versions.find((entry) => entry.catalog.catalogVersion === snapshots.currentVersion)!.catalog.mode;
  // CopyPrompt reuses the established, localized clipboard status messages.
  return <PageMessages locale={locale} namespace="docs/introduction"><AiContent text={text} mode={mode} /></PageMessages>;
}
