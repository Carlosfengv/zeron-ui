"use client";

import { docOrder } from "@docs/lib/components";
import { useTranslations } from "next-intl";
import { InstallCommand } from "@docs/components/content/InstallCommand";
import { IntroPager } from "@docs/components/navigation/IntroPager";

export default function DocsIndex() {
  const t = useTranslations("introduction");
  const common = useTranslations("common");
  const firstComponent = docOrder[0];

  return (
    <div className="flex flex-col gap-8 px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-heading text-fg-default leading-none mb-2 font-bold"
          >
            {t("title")}
          </h1>
          <p className="text-body text-fg-muted">
            {t("description")}
          </p>
        </div>
        {firstComponent && <IntroPager nextSlug={firstComponent.slug} nextName={firstComponent.name} />}
      </div>

      <section className="flex flex-col gap-6 text-body text-fg-default/90 leading-relaxed">
        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-fg-default leading-none font-semibold"
          >
            {t("motionTitle")}
          </h3>
          <p>
            {t("motionBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-fg-default leading-none font-semibold"
          >
            {t("hoverTitle")}
          </h3>
          <p>
            {t("hoverBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-fg-default leading-none font-semibold"
          >
            {t("springTitle")}
          </h3>
          <p>
            {t("springBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-fg-default leading-none font-semibold"
          >
            {t("compatibilityTitle")}
          </h3>
          <p>
            {t("compatibilityBody")}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <h3
            className="text-title text-fg-default leading-none font-semibold"
          >
            {t("customizeTitle")}
          </h3>
          <p>
            {t("customizeBody")}
          </p>
        </div>
      </section>

      <hr className="border-border-subtle my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-title text-fg-default leading-none font-semibold"
        >
            {common("installation")}
        </h2>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-body text-fg-muted flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-fg-muted text-label shrink-0 font-medium">1</span>
            {t("initialize")}
          </p>
          <InstallCommand value="npx zeron-ui init" compact />
        </div>
        <div className="flex flex-col gap-2 mt-2">
          <p className="text-body text-fg-muted flex items-center gap-2 ml-1">
            <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-muted text-fg-muted text-label shrink-0 font-medium">2</span>
            {t("installAny")}
          </p>
          <InstallCommand value="npx zeron-ui add button" compact />
        </div>
        <hr className="border-border-subtle mt-4" />
        <p className="text-body text-fg-muted">
          {t("registry")}
        </p>
        <InstallCommand value="npx shadcn@latest add https://zeron-ui.vercel.app/r/button.json" compact />
        <p className="text-body text-fg-muted">
          {t("dependencies")}
        </p>
      </div>

      <hr className="border-border-subtle my-8" />
      <div className="flex flex-col gap-3 mb-4">
        <h2
          className="text-title text-fg-default leading-none font-semibold"
        >
          {t("iconsTitle")}
        </h2>
        <p className="text-body text-fg-muted">
          {t("iconsBody")}
        </p>
      </div>
    </div>
  );
}
