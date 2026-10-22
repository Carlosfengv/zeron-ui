"use client";

import { useLocale, useTranslations } from "next-intl";
import { ContextWindowUsage } from "@zeron/ui/context-window";
import { createContextWindowCompactDemoData } from "@zeron/blocks/context-window-02";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { ContextWindowCompactDemo } from "@docs/components/blocks/ContextWindowCompactDemo";

export function ContextWindowCompactBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("contextWindowCompactBlock");
  const locale = useLocale();
  const data = createContextWindowCompactDemoData();
  return <BlockDetailPage code={code} slug="context-window-02" title={t("title")} description={t("description")} preview={<ContextWindowCompactDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("usageIndicator")}>
      <p className="text-body text-fg-muted">{t("usageIndicatorBody")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        {[0, 14000, 175600, 200000].map((used) => <ContextWindowUsage key={used}
          data={{ ...data, systemTokens: used, toolTokens: 0, docs: [], memory: [], history: [] }} locale={locale} />)}
      </div>
    </BlockDetailSection>
    <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
