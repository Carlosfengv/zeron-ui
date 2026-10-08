import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";
import { UpdatesList } from "./updates-list";
import { UpdatesHistorySkeleton, UpdatesLayout } from "./updates-shell";
import { updatesCopy as copy } from "./updates-copy";
import { assertLocale } from "@/app/_i18n/locale";
import type { AppLocale } from "@/app/_i18n/routing";
import { readCommitActivityHistory } from "@docs/lib/commit-activity.server";
import { withCommitArtifacts } from "@docs/lib/commit-artifacts.server";
import { localeAlternates } from "@docs/seo/locale";

// Share one dated snapshot across visitors instead of paging GitHub on every view.
const readActivitySnapshot = unstable_cache(readCommitActivityHistory, [
  "updates-activity",
  process.env.VERCEL_GIT_REPO_OWNER ?? "",
  process.env.VERCEL_GIT_REPO_SLUG ?? "",
  process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || "main",
], { revalidate: 300 });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  assertLocale(locale);
  const language = locale === "en" ? "en" : "zh";

  return {
    title: `${copy[language].title} · Zeron Design`,
    description: copy[language].description,
    alternates: localeAlternates("/updates", locale),
  };
}

export default async function UpdatesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const language = locale === "en" ? "en" : "zh";
  const text = copy[language];
  return (
    <UpdatesLayout title={text.title} description={text.description}>
      <Suspense fallback={<UpdatesHistorySkeleton label={text.loading} />}>
        <UpdatesHistory locale={locale} />
      </Suspense>
    </UpdatesLayout>
  );
}

async function UpdatesHistory({ locale }: { locale: AppLocale }) {
  const history = await readActivitySnapshot();
  return <UpdatesList activityHistory={{ asOf: history.asOf, complete: history.complete }} commits={withCommitArtifacts(history.commits)} locale={locale} />;
}
