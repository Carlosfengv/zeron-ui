"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { Login01 } from "@zeron/blocks/login-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function Login01BlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("login01Block");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="login-01"
      title={t("title")}
      preview={<Login01 className="h-full min-h-0" landmark={false} />}
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
