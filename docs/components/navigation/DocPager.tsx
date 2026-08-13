"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@zeron/ui/button";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/icons/context";
import { localePrefixFromPathname, localizePathname } from "@docs/components/shell/site/locale-path";
import type { DocCollection } from "@docs/manifest";

interface PageLink {
  slug: string;
  name: string;
  collection: DocCollection;
  pathname?: string;
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
            <Link href={localizePathname(prev.pathname ?? `/docs/${prev.collection}/${prev.slug}`, localePrefix)} aria-label={t("previous", { name: prev.name })}>
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
            <Link href={localizePathname(next.pathname ?? `/docs/${next.collection}/${next.slug}`, localePrefix)} aria-label={t("next", { name: next.name })}>
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
