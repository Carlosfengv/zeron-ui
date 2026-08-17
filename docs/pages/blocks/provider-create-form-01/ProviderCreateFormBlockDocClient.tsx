"use client";

import { ProviderCreateForm } from "@zeron/blocks/provider-create-form-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ProviderCreateFormBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("providerCreateFormBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="provider-create-form-01"
      title={t("title")}
      preview={
        <div className="min-h-full bg-surface-base">
          <ProviderCreateForm />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("tokenStrategy")}>
        <p className="text-body text-fg-muted">{t("tokenStrategyBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
