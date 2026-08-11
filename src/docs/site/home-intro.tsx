"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcon } from "@/lib/icon-context";
import { localePrefixFromPathname, localizePathname } from "@/docs/site/locale-path";

export function HomeIntro() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const ArrowRight = useIcon("arrow-right");
  return (
    <div className="w-full max-w-[960px] mx-auto py-20 sm:py-28 px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] sm:text-[28px] text-fg-default leading-none font-bold">Zeron Design</h1>
          <p className="text-[14px] text-fg-muted">{t("tagline")}</p>
          <div className="flex items-center gap-2 mt-2">
            <Button asChild variant="primary" size="sm">
              <Link href={localizePathname("/docs", localePrefix)}>{t("learnMore")}</Link>
            </Button>
            <Button asChild variant="tertiary" size="sm">
              <Link href="/demo">{t("seeDemo")}</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" disabled aria-label="No previous page"><ArrowRight className="rotate-180" /></Button>
          <Tooltip content={<span>{t("nextIntroduction")} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
            <Button asChild variant="ghost" size="icon">
              <Link href={localizePathname("/docs", localePrefix)} aria-label={t("nextIntroduction")}><ArrowRight /></Link>
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
