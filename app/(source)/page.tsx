"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { allComponentList } from "@/docs/components";
import { BentoGrid } from "@/docs/site/bento-grid";
import { HomeIntro } from "@/docs/site/home-intro";
import { localePrefixFromPathname, localizePathname } from "@/docs/site/locale-path";
const featuredSlugs = new Set(["badge", "button", "checkbox", "input", "kbd", "switch", "tabs", "thinking-indicator"]);

export default function Page() {
  const t = useTranslations("home");
  const pathname = usePathname();
  const localePrefix = localePrefixFromPathname(pathname);
  const remaining = allComponentList.filter((component) => !featuredSlugs.has(component.slug));
  return (
    <div className="mt-12 lg:mt-0">
      <HomeIntro />
      <div className="w-full max-w-[1200px] mx-auto px-6 pb-16">
        <BentoGrid components={allComponentList} />
        <section className="mt-14">
          <h2 className="text-[18px] text-foreground font-semibold">{t("allComponents")}</h2>
          <p className="mt-1 text-body-sm text-muted-foreground">{t("allComponentsDescription")}</p>
          <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
            {remaining.map((component) => <Link key={component.slug} href={localizePathname(`/docs/${component.slug}`, localePrefix)} className="text-body-sm text-muted-foreground transition-colors hover:text-foreground">{component.name}</Link>)}
          </div>
        </section>
      </div>
    </div>
  );
}
