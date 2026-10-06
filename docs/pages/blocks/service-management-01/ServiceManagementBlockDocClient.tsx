"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { ServiceManagementDemo as ServiceManagement } from "@docs/components/blocks/OperationsWorkspaceDemos";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ServiceManagementBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("serviceManagementBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="service-management-01" title={t("title")} preview={<ServiceManagement className="h-full min-h-0" />}><BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection></BlockDetailPage>;
}
