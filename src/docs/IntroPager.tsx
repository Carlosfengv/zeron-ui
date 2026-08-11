"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { useIcon } from "@/lib/icon-context";
import { localePrefixFromPathname, localizePathname } from "@/docs/site/locale-path";

export function IntroPager({ nextSlug, nextName }: { nextSlug: string; nextName: string }) {
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const t = useTranslations("pager");
  const ArrowRight = useIcon("arrow-right");
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Tooltip content={<span>{t("previous", { name: "Showcase" })} &ensp;<kbd className="font-mono opacity-50">&larr;</kbd></span>}>
        <Button asChild variant="ghost" size="icon">
          <Link href={localizePathname("/", localePrefix)} aria-label={t("previous", { name: "Showcase" })}><ArrowRight className="rotate-180" /></Link>
        </Button>
      </Tooltip>
      <Tooltip content={<span>{t("next", { name: nextName })} &ensp;<kbd className="font-mono opacity-50">&rarr;</kbd></span>}>
        <Button asChild variant="ghost" size="icon">
          <Link href={localizePathname(`/docs/${nextSlug}`, localePrefix)} aria-label={t("next", { name: nextName })}><ArrowRight /></Link>
        </Button>
      </Tooltip>
    </div>
  );
}
