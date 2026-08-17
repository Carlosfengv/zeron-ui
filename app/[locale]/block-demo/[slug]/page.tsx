import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { assertLocale } from "@/app/_i18n/locale";
import { StandaloneBlockDemo } from "@docs/components/blocks/StandaloneBlockDemo";
import {
  isStandaloneBlockSlug,
  standaloneBlockSlugs,
} from "@docs/components/blocks/standalone-blocks";

export const dynamicParams = false;

export function generateStaticParams() {
  return standaloneBlockSlugs.map((slug) => ({ slug }));
}

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function BlockDemoPage({ params }: Props) {
  const { locale, slug } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  if (!isStandaloneBlockSlug(slug)) notFound();

  return (
    <main className="h-svh w-screen overflow-hidden bg-surface-base">
      <StandaloneBlockDemo slug={slug} />
    </main>
  );
}
