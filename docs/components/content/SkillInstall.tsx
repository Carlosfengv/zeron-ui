"use client";

import { useTranslations } from "next-intl";
import { Button } from "@zeron/ui/button";
import { CopyPrompt } from "./CopyPrompt";

export function SkillInstall() {
  const t = useTranslations("introduction.skills");
  const prompt = t("prompt", { url: "https://zeron-ui.vercel.app/skills/install.md" });

  return (
    <section id="skills" aria-labelledby="skills-title" className="flex min-w-0 flex-col gap-4 scroll-mt-32 sm:scroll-mt-20">
      <div className="flex flex-col gap-2">
        <h2 id="skills-title" className="text-title font-semibold text-fg-default">{t("title")}</h2>
        <p className="text-body text-fg-muted">{t("description")}</p>
      </div>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <dt className="text-body font-medium text-fg-default">Zeron Page Builder</dt>
          <dd className="text-body text-fg-muted">{t("builder")}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-body font-medium text-fg-default">Swap to Zeron UI</dt>
          <dd className="text-body text-fg-muted">{t("migration")}</dd>
        </div>
      </dl>
      <CopyPrompt value={prompt} label={t("copy")}>
        <Button variant="secondary" asChild>
          <a href="/skills/zeron-skills.zip" download>{t("download")}</a>
        </Button>
        <Button variant="ghost" asChild>
          <a href="/skills/install.md">{t("guide")}</a>
        </Button>
      </CopyPrompt>
      <p className="text-body text-fg-muted">{t("hint")}</p>
      <p className="text-body text-fg-muted">{t("next")}</p>
    </section>
  );
}
