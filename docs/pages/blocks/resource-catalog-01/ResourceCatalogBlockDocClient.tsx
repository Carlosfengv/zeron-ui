"use client";

import { useState } from "react";
import { ResourceCatalog, type ResourceCatalogKind } from "@zeron/blocks/resource-catalog-01";
import { Button } from "@zeron/ui/button";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ResourceCatalogBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("resourceCatalogBlock");
  const [kind, setKind] = useState<ResourceCatalogKind>("model");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      previewMinHeightClass="min-h-[44rem]"
      registryName="model-mcp-marketplace-01"
      slug="resource-catalog-01"
      title={t("title")}
      preview={<ResourceCatalog kind={kind} onKindChange={setKind} />}
    >
      <BlockDetailSection title={t("previewMode")}>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="tertiary" active={kind === "model"} onClick={() => setKind("model")}>{t("models")}</Button>
          <Button type="button" size="sm" variant="tertiary" active={kind === "mcp"} onClick={() => setKind("mcp")}>{t("mcp")}</Button>
        </div>
        <p className="text-body text-fg-muted">{t("previewModeBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("dataBoundary")}>
        <p className="text-body text-fg-muted">{t("dataBoundaryBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
