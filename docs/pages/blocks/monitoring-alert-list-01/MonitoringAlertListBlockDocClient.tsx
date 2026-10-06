"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { MonitoringAlertListDemo } from "@docs/components/blocks/OperationsListDemos";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function MonitoringAlertListBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("monitoringAlertListBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="monitoring-alert-list-01" title={t("title")} preview={<MonitoringAlertListDemo />}><BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection></BlockDetailPage>;
}
