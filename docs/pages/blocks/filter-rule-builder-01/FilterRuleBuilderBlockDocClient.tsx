"use client";

import { useState } from "react";
import {
  FilterRuleBuilder,
  filterRuleBuilderDemoDraft,
  filterRuleBuilderDemoFields,
  filterRuleBuilderDemoPresets,
  filterRuleBuilderDemoValue,
  type FilterRuleClause,
} from "@zeron/blocks/filter-rule-builder-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function FilterRuleBuilderBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("filterRuleBuilderBlock");
  const [filters, setFilters] = useState<FilterRuleClause[]>(() =>
    filterRuleBuilderDemoValue.map((filter) => ({ ...filter }))
  );
  const [feedback, setFeedback] = useState(t("ready"));

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="filter-rule-builder-01"
      title={t("title")}
      preview={
        <div className="flex min-h-full items-center justify-center bg-surface-base p-4 sm:p-8">
          <div className="w-full max-w-3xl">
            <FilterRuleBuilder
              defaultDraft={filterRuleBuilderDemoDraft}
              fields={filterRuleBuilderDemoFields}
              onApply={(next) => setFeedback(t("applied", { count: next.length }))}
              onCancel={(next) => setFeedback(t("cancelled", { count: next.length }))}
              onValueChange={setFilters}
              presets={filterRuleBuilderDemoPresets}
              resultCount={128}
              value={filters}
            />
            <p aria-live="polite" className="mt-3 min-h-5 text-center text-label text-fg-muted">{feedback}</p>
          </div>
        </div>
      }
    >
      <BlockDetailSection title={t("dataContract")}>
        <p className="text-body text-fg-muted">{t("dataContractBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("behavior")}>
        <p className="text-body text-fg-muted">{t("behaviorBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("composition")}>
        <p className="text-body text-fg-muted">{t("compositionBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
