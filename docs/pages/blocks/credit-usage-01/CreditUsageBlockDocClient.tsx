"use client";

import { useState } from "react";
import {
  CreditUsage,
  creditUsageDemoData,
  type CreditUsageCycle,
} from "@zeron/blocks/credit-usage-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function CreditUsageBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("creditUsageBlock");
  const [cycle, setCycle] = useState<CreditUsageCycle>("current");
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="credit-usage-01"
      title={t("title")}
      preview={
        <div className="flex min-h-[48rem] items-center justify-center bg-surface-base p-4 sm:p-8">
          <div className="w-full max-w-[520px]">
            <CreditUsage
              actions={{
                onAutoSwitchChange: setAutoSwitchEnabled,
                onCycleChange: setCycle,
                onSetLimit: () => setFeedback(t("limitFeedback")),
                onUpgrade: () => setFeedback(t("upgradeFeedback")),
              }}
              autoSwitchEnabled={autoSwitchEnabled}
              cycle={cycle}
              data={creditUsageDemoData}
            />
            <p aria-live="polite" className="mt-3 min-h-5 text-center text-caption text-fg-muted">
              {feedback}
            </p>
          </div>
        </div>
      }
    >
      <BlockDetailSection title={t("composition")}>
        <p className="text-body text-fg-muted">{t("compositionBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("dataContract")}>
        <p className="text-body text-fg-muted">{t("dataContractBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("behavior")}>
        <p className="text-body text-fg-muted">{t("behaviorBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
