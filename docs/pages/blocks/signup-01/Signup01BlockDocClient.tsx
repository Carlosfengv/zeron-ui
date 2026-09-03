"use client";

import { Signup01 } from "@zeron/blocks/signup-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function Signup01BlockDocClient({ code }: { code: string }) {
  const t = useTranslations("signup01Block");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="signup-01"
      title={t("title")}
      preview={<Signup01 className="h-full min-h-0" landmark={false} />}
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
