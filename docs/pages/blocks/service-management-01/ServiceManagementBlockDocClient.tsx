"use client";

import { ServiceManagement } from "@zeron/blocks/service-management-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ServiceManagementBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("serviceManagementBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="service-management-01" title={t("title")} preview={<ServiceManagement className="h-full min-h-0" />}><BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection></BlockDetailPage>;
}
