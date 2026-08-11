"use client";

import { docOrder } from "@/docs/components";
import { useTranslations } from "next-intl";
import { InstallCommand } from "@/docs/InstallCommand";
import { IntroPager } from "@/docs/IntroPager";

export default function DocsIndex() {
  const t = useTranslations("introduction");
  const common = useTranslations("common");
  const firstComponent = docOrder[0];

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-[22px] sm:text-[28px] text-foreground leading-none mb-2 font-bold"
          >
            {t("title")}
          </h1>
          <p className="text-[13px] text-muted-foreground">
            {t("description")}
          </p>
        </div>
        {firstComponent && <IntroPager nextSlug={firstComponent.slug} nextName={firstComponent.name} />}
      </div>

      <section className="flex flex-col gap-6 text-[14px] text-foreground/90 leading-relaxed">
        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            {t("motionTitle")}
          </h3>
          <p>
            {t("motionBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            {t("hoverTitle")}
          </h3>
          <p>
            {t("hoverBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            {t("springTitle")}
          </h3>
          <p>
            {t("springBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            {t("compatibilityTitle")}
          </h3>
          <p>
            {t("compatibilityBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-[16px] text-foreground leading-none font-semibold"
          >
            {t("customizeTitle")}
          </h3>
          <p>
            {t("customizeBody")}
          </p>
        </div>
      </section>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-[16px] text-foreground leading-none font-semibold"
        >
            {common("installation")}
        </h2>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0 font-medium">1</span>
            {t("initialize")}
          </p>
          <InstallCommand value="npx zeron-ui init" compact />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-[13px] text-muted-foreground flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-muted-foreground text-[11px] shrink-0 font-medium">2</span>
            {t("installAny")}
          </p>
          <InstallCommand value="npx zeron-ui add button" compact />
        </div>
        <hr className="border-border/60 mt-4" />
        <p className="text-[13px] text-muted-foreground">
          {t("registry")}
        </p>
        <InstallCommand value="npx shadcn@latest add https://www.zerondesign.com/r/button.json" compact />
        <p className="text-[13px] text-muted-foreground">
          {t("dependencies")}
        </p>
      </div>

      <hr className="border-border/60 my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-[16px] text-foreground leading-none font-semibold"
        >
          {t("iconsTitle")}
        </h2>
        <p className="text-[13px] text-muted-foreground">
          {t("iconsBody")}
        </p>
      </div>
    </div>
  );
}
