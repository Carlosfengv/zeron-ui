"use client";

import { MonitoringAlertList } from "@zeron/blocks/monitoring-alert-list-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function MonitoringAlertListBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("monitoringAlertListBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="monitoring-alert-list-01" title={t("title")} preview={<MonitoringAlertList className="h-full min-h-0" />}><BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection></BlockDetailPage>;
}
