"use client";

import { useSyncExternalStore } from "react";
import { Badge } from "@zeron/ui/badge";
import { Container, ContainerBody, ContainerFooter } from "@zeron/ui/container";
import { BlockPreview } from "@docs/components/blocks/BlockPreview";
import { IntentPrefetchLink } from "@docs/components/shell/site/intent-prefetch-link";
import type { AppLocale } from "@/app/_i18n/routing";
import type { CommitHistoryEntry } from "@docs/lib/commit-history.server";
import { updatesCopy as copy } from "./updates-copy";

const repositoryUrl = "https://github.com/Carlosfengv/zeron-ui";
const subscribe = () => () => {};
const browserTimeZone = () => new Intl.DateTimeFormat().resolvedOptions().timeZone;
// Keep server rendering and the first hydration render identical.
const serverTimeZone = () => "UTC";

function groupCommits(commits: CommitHistoryEntry[], locale: AppLocale, timeZone: string) {
  const dateKey = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
  });
  const dateLabel = new Intl.DateTimeFormat(locale, {
    timeZone, year: "numeric", month: locale === "zh-CN" ? "long" : "short", day: "numeric",
  });
  const groups = new Map<string, { date: string; label: string; commits: CommitHistoryEntry[] }>();
  for (const commit of commits) {
    const instant = new Date(commit.committedAt);
    const parts = dateKey.formatToParts(instant);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
    const date = `${part("year")}-${part("month")}-${part("day")}`;
    const group = groups.get(date);
    if (group) group.commits.push(commit);
    else groups.set(date, { date, label: dateLabel.format(instant), commits: [commit] });
  }
  return Array.from(groups.values());
}

export function UpdatesList({ commits, locale }: { commits: CommitHistoryEntry[]; locale: AppLocale }) {
  const timeZone = useSyncExternalStore(subscribe, browserTimeZone, serverTimeZone);
  const text = copy[locale === "en" ? "en" : "zh"];
  const groups = groupCommits(commits, locale, timeZone);
  const time = new Intl.DateTimeFormat(locale, {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });

  return (
    <>
      <p className="mt-5 border-b border-border pb-8 text-label text-fg-subtle">
        {text.count.replace("{count}", String(commits.length))}
        <span className="ml-3">{text.timeZone.replace("{timeZone}", timeZone)}</span>
      </p>
      <div className="pb-10 pt-4">
        {groups.map((group) => (
          <section aria-labelledby={`updates-${group.date}`} className="pt-5" key={group.date}>
            <h2 className="pb-2 text-title font-semibold text-fg-default" id={`updates-${group.date}`}>
              {group.label}
            </h2>
            <ol className="divide-y divide-border-subtle border-t border-border-subtle">
              {group.commits.map((commit) => (
                <li className="grid min-w-0 gap-2 py-5 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-5" key={commit.id}>
                  <time className="font-mono text-label tabular-nums text-fg-subtle" dateTime={commit.committedAt}>
                    {time.format(new Date(commit.committedAt))}
                  </time>
                  <article className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <h3 className="min-w-0 text-body font-medium text-fg-default">{commit.message}</h3>
                      {commit.id === commits[0]?.id && (
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
                    {!!commit.artifacts?.length && (
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {commit.artifacts.map((artifact) => (
                          <Container className="group relative min-w-0 overflow-hidden transition-colors duration-fast hover:bg-hover" key={artifact.slug}>
                            <IntentPrefetchLink
                              aria-label={artifact.title}
                              className="absolute inset-0 z-raised rounded-3xl outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring"
                              href={`${locale === "en" && artifact.href.startsWith("/docs/") ? "/en" : ""}${artifact.href}`}
                            />
                            <ContainerBody aria-hidden="true" className="overflow-hidden overscroll-auto p-1" inert>
                              <div className="pointer-events-none"><BlockPreview name={artifact.slug} /></div>
                            </ContainerBody>
                            <ContainerFooter className="flex-wrap justify-between gap-2 px-3 py-2">
                              <span className="text-label font-medium text-fg-muted transition-colors duration-fast group-hover:text-fg-brand group-focus-within:text-fg-brand">{artifact.title}</span>
                              <Badge color="blue" size="sm">{text[artifact.collection]}</Badge>
                            </ContainerFooter>
                          </Container>
                        ))}
                      </div>
                    )}
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
