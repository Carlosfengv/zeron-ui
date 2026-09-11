import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Badge } from "@zeron/ui/badge";
import { PageBody, PageContent, PageLayout } from "@zeron/ui/page-layout";
import { assertLocale } from "@/app/_i18n/locale";
import type { AppLocale } from "@/app/_i18n/routing";
import { readCommitHistory, type CommitHistoryEntry } from "@docs/lib/commit-history.server";
import { localeAlternates } from "@docs/seo/locale";

const repositoryUrl = "https://github.com/Carlosfengv/zeron-ui";

const copy = {
  en: {
    author: "by",
    count: "Recent {count} commits",
    description: "A commit-by-commit record of changes to Zeron Design.",
    latest: "Latest",
    title: "Updates",
  },
  zh: {
    author: "提交者",
    count: "最近 {count} 条提交",
    description: "按照 Git commit 记录 Zeron Design 的每次更新。",
    latest: "最新",
    title: "更新日志",
  },
} as const;

function calendarDate(timestamp: string) {
  return timestamp.slice(0, 10);
}

function formatDate(timestamp: string, locale: AppLocale) {
  const [year, month, day] = calendarDate(timestamp).split("-").map(Number);
  if (!year || !month || !day) return calendarDate(timestamp);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: locale === "zh-CN" ? "long" : "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatTime(timestamp: string) {
  const match = timestamp.match(/T(\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

function groupCommits(commits: CommitHistoryEntry[]) {
  return commits.reduce<Array<{ date: string; commits: CommitHistoryEntry[] }>>((groups, commit) => {
    const date = calendarDate(commit.committedAt);
    const current = groups.at(-1);
    if (current?.date === date) current.commits.push(commit);
    else groups.push({ date, commits: [commit] });
    return groups;
  }, []);
}

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
  const commits = await readCommitHistory();
  const groups = groupCommits(commits);

  return (
    <section aria-labelledby="updates-title" className="flex h-full min-h-0 w-full bg-surface-base">
      <PageLayout className="h-full min-h-0 w-full" gutter="default" size="full">
        <PageContent className="overflow-y-auto overscroll-contain">
          <PageBody className="h-auto max-w-[960px] flex-none overflow-visible overscroll-auto px-5 py-10 sm:px-8 sm:py-14">
            <header className="border-b border-border pb-8">
              <h1 className="text-heading font-semibold leading-tight text-fg-default" id="updates-title">
                {text.title}
              </h1>
              <p className="mt-2 max-w-prose text-body text-fg-muted">{text.description}</p>
              <p className="mt-5 text-label text-fg-subtle">
                {text.count.replace("{count}", String(commits.length))}
              </p>
            </header>

            <div className="pb-10 pt-4">
              {groups.map((group) => (
                <section aria-labelledby={`updates-${group.date}`} className="pt-5" key={group.date}>
                  <h2 className="pb-2 text-title font-semibold text-fg-default" id={`updates-${group.date}`}>
                    {formatDate(group.date, locale)}
                  </h2>
                  <ol className="divide-y divide-border-subtle border-t border-border-subtle">
                    {group.commits.map((commit, index) => (
                      <li className="grid min-w-0 gap-2 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-5" key={commit.id}>
                        <time className="font-mono text-label tabular-nums text-fg-subtle" dateTime={commit.committedAt}>
                          {formatTime(commit.committedAt)}
                        </time>
                        <article className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <h3 className="min-w-0 text-body font-medium text-fg-default">{commit.message}</h3>
                            {group === groups[0] && index === 0 && (
                              <Badge color="blue" size="sm" variant="dot">{text.latest}</Badge>
                            )}
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-label text-fg-subtle">
                            <a
                              className="rounded-sm font-mono tabular-nums text-fg-muted outline-none hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring"
                              href={`${repositoryUrl}/commit/${commit.id}`}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {commit.shortId}
                            </a>
                            {commit.author && <span>{text.author} {commit.author}</span>}
                          </div>
                        </article>
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );
}
