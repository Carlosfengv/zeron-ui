"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useIcon } from "@zeron/icons/context";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { InstallCommand } from "@docs/components/content/InstallCommand";
import type { NpmRelease } from "@docs/lib/npm-release.server";

type ReleaseProps = { release: NpmRelease | null };

export function HomeReleaseBadge({ release }: ReleaseProps) {
  const t = useTranslations("home");
  const ArrowRight = useIcon("arrow-right");
  return (
    <a href="https://www.npmjs.com/package/zeron-ui" target="_blank" rel="noreferrer" className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border-hairline border-border px-3 py-1.5 text-label text-fg-muted outline-none transition-colors duration-fast hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring">
      <Badge size="sm" color="blue">{release ? `v${release.version}` : "npm"}</Badge>
      <span>{release ? release.prerelease ? t("release.prerelease") : t("release.title") : t("release.unavailable")}</span>
      <ArrowRight size={14} aria-hidden="true" />
    </a>
  );
}

export function HomeReleaseDetails({ release }: ReleaseProps) {
  const t = useTranslations("home");
  const locale = useLocale();
  const prefix = locale === "en" ? "/en" : "";
  const ArrowRight = useIcon("arrow-right");
  const publishedAt = release?.publishedAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(release.publishedAt)) : null;
  return (
    <>
      <section aria-label={t("release.title")} className="flex flex-col gap-3 border-b-hairline border-border-subtle px-2 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-label text-fg-muted">
          <span className="font-medium text-fg-default">zeron-ui <span className="font-normal text-fg-muted">/ npm latest</span></span>
          {release && <span>{release.version}</span>}
          {publishedAt && <span>{t("release.published")} <time dateTime={release?.publishedAt ?? undefined}>{publishedAt}</time></span>}
          {release?.node && <span>Node.js {release.node}</span>}
        </div>
        <Button asChild variant="ghost" size="sm" trailingIcon={ArrowRight}><Link href={`${prefix}/updates`}>{t("release.updates")}</Link></Button>
      </section>
      <p className="px-2 pt-3 text-label text-fg-subtle">{release ? t("release.source") : t("release.fallback")}</p>
    </>
  );
}

export function HomeReleaseCommand({ release, command }: ReleaseProps & { command: "init" | "add button" }) {
  return <InstallCommand value={`npx zeron-ui@${release?.version ?? "latest"} ${command}`} />;
}
