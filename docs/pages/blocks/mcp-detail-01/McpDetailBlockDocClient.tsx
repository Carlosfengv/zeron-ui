"use client";

import { useState } from "react";
import { McpDetail } from "@zeron/blocks/mcp-detail-01";
import { InlineNotice } from "@zeron/ui/inline-notice";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";
import { DetailBlockPreviewShell } from "../_components/DetailBlockPreviewShell";

export function McpDetailBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("mcpDetailBlock");
  const [notice, setNotice] = useState<string | null>(null);
  const props: PropDef[] = [
    { name: "service", type: "McpDetailData", description: "Complete resource data. No request is made by the block." },
    { name: "defaultSection", type: '"overview" | "tools"', default: '"overview"', description: "Initial local tab." },
    { name: "onRequestConnection", type: "(options) => McpConnectionResult | Promise<McpConnectionResult>", description: "Product-owned connection generation." },
    { name: "onRunTool", type: "(toolName, input) => unknown | Promise<unknown>", description: "Product-owned tool execution." },
    { name: "onAgentSelect", type: "(agentId) => void", description: "Handles an Agent handoff." },
  ];

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      registryName="mcp-detail-01"
      slug="mcp-detail-01"
      title={t("title")}
      preview={<DetailBlockPreviewShell active="mcp"><McpDetail onAgentSelect={(agent) => setNotice(t("agentSelected", { agent }))} /></DetailBlockPreviewShell>}
    >
      <BlockDetailSection title={t("props")}><PropsTable props={props} /></BlockDetailSection>
      <BlockDetailSection title={t("dataBoundary")}><p className="text-body text-fg-muted">{t("dataBoundaryBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("mockBehavior")}><p className="text-body text-fg-muted">{t("mockBehaviorBody")}</p>{notice && <InlineNotice variant="emphasized" tone="success">{notice}</InlineNotice>}</BlockDetailSection>
      <BlockDetailSection title={t("interaction")}><p className="text-body text-fg-muted">{t("interactionBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("responsive")}><p className="text-body text-fg-muted">{t("responsiveBody")}</p></BlockDetailSection>
    </BlockDetailPage>
  );
}
