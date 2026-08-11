"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcon } from "@/lib/icon-context";
import { localePrefixFromPathname, localizePathname } from "@/docs/site/locale-path";

interface PageLink {
  slug: string;
  name: string;
}

export function DocPager({ prev, next }: { prev: PageLink | null; next: PageLink | null }) {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const t = useTranslations("pager");
  const ArrowRight = useIcon("arrow-right");

  return (
    <div className="flex items-center gap-1 shrink-0">
      {prev ? (
          <Tooltip content={<span>{t("previous", { name: prev.name })} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
          <Button asChild variant="ghost" size="icon">
            <Link href={localizePathname(`/docs/${prev.slug}`, localePrefix)} aria-label={t("previous", { name: prev.name })}>
              <ArrowRight className="rotate-180" />
            </Link>
          </Button>
        </Tooltip>
      ) : (
        <Button variant="ghost" size="icon" disabled aria-label={t("nonePrevious")}>
          <ArrowRight className="rotate-180" />
        </Button>
      )}
      {next ? (
          <Tooltip content={<span>{t("next", { name: next.name })} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
          <Button asChild variant="ghost" size="icon">
            <Link href={localizePathname(`/docs/${next.slug}`, localePrefix)} aria-label={t("next", { name: next.name })}>
              <ArrowRight />
            </Link>
          </Button>
        </Tooltip>
      ) : (
        <Button variant="ghost" size="icon" disabled aria-label={t("noneNext")}><ArrowRight /></Button>
      )}
    </div>
  );
}
