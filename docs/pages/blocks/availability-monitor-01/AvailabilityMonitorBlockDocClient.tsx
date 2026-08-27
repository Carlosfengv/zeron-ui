"use client";

import { AvailabilityMonitor } from "@zeron/blocks/availability-monitor-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function AvailabilityMonitorBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("availabilityMonitorBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="availability-monitor-01"
      title={t("title")}
      preview={
        <div className="min-h-full overflow-auto bg-surface-base p-4 sm:p-8">
          <AvailabilityMonitor className="mx-auto" />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
