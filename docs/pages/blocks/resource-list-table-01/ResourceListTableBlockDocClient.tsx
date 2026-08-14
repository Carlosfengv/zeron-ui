"use client";

import {
  defaultResourceListItems,
  ResourceListTable,
  type ResourceListItem,
} from "@zeron/blocks/resource-list-table-01";
import { Button } from "@zeron/ui/button";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ResourceListTableBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("resourceListTableBlock");
  const [resources, setResources] = useState<ResourceListItem[]>(() => [
    ...defaultResourceListItems,
  ]);

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="resource-list-table-01"
      title={t("title")}
      preview={
        <div className="min-h-full bg-surface-raised p-3 sm:p-6">
          <ResourceListTable
            resources={resources}
            renderBulkActions={({ selectedResources, clearSelection }) => (
              <>
                <Button
                  onClick={() => {
                    const selectedIds = new Set(
                      selectedResources.map((resource) => resource.id)
                    );
                    setResources((current) =>
                      current.map((resource) =>
                        selectedIds.has(resource.id)
                          ? { ...resource, status: "draft" }
                          : resource
                      )
                    );
                    clearSelection();
                  }}
                  size="md"
                  variant="tertiary"
                >
                  {t("bulkDraft")}
                </Button>
                <Button
                  onClick={() => {
                    const selectedIds = new Set(
                      selectedResources.map((resource) => resource.id)
                    );
                    setResources((current) =>
                      current.filter(
                        (resource) => !selectedIds.has(resource.id)
                      )
                    );
                    clearSelection();
                  }}
                  size="md"
                  variant="destructive"
                >
                  {t("bulkDelete")}
                </Button>
              </>
            )}
          />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
