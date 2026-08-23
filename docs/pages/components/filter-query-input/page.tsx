"use client";

import * as React from "react";
import {
  FilterQueryInput,
  type FilterQueryFieldConfig,
} from "@zeron/ui/filter-query-input";
import type { FilterClause, FilterField } from "@zeron/ui/system/filter-core";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const fields: readonly FilterField[] = [
  { id: "query", type: "text", label: "Search orders" },
  { id: "orderStatus", type: "multiSelect", label: "Order status", options: [{ value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }, { value: "refunded", label: "Refunded" }] },
  { id: "customerName", type: "text", label: "Customer" },
  { id: "totalAmount", type: "number", label: "Total" },
];

const queryFields: readonly FilterQueryFieldConfig[] = [
  { fieldId: "query", suggest: false },
  { fieldId: "orderStatus", key: "status", aliases: ["state"] },
  { fieldId: "customerName", key: "customer", aliases: ["buyer"] },
  { fieldId: "totalAmount", key: "total" },
];

const multiConditionExample = 'status:paid customer:"Alice Chen" total:50-250';

const basicCode = `import { useState } from "react";
import { FilterQueryInput } from "@zeron/ui/filter-query-input";
import type { FilterClause, FilterField } from "@zeron/ui/system/filter-core";

const fields: FilterField[] = [
  { id: "query", type: "text", label: "Search orders" },
  { id: "orderStatus", type: "multiSelect", label: "Order status", options: [...] },
  { id: "customerName", type: "text", label: "Customer" },
  { id: "totalAmount", type: "number", label: "Total" },
];

const queryFields = [
  { fieldId: "query", suggest: false },
  { fieldId: "orderStatus", key: "status", aliases: ["state"] },
  { fieldId: "customerName", key: "customer", aliases: ["buyer"] },
  { fieldId: "totalAmount", key: "total" },
];

function Example() {
  const [filters, setFilters] = useState<FilterClause[]>([]);
  return (
    <FilterQueryInput
      fields={fields}
      queryFields={queryFields}
      filters={filters}
      freeText={{ fieldId: "query" }}
      onFiltersChange={setFilters}
    />
  );
}`;

const headlessCode = `import { useFilterQueryInput } from "@zeron/ui/filter-query-core";

function CustomQueryControl(props) {
  const query = useFilterQueryInput(props);

  return (
    <YourDesignSystemInput
      value={query.draftText}
      onChange={(value) => query.setDraftText(value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") query.commit("enter");
        if (event.key === "Escape") query.revert();
      }}
    />
  );
}`;

const asyncAndHistoryCode = `import { useFilterQueryHistory } from "@zeron/ui/filter-query-input";

const history = useFilterQueryHistory({
  storageKey: "orders:query-history",
  limit: 5,
});

<FilterQueryInput
  fields={fields}
  queryFields={[
    {
      fieldId: "status",
      loadSuggestions: async ({ query, signal }) => ({
        options: await loadStatusOptions(query, signal),
      }),
    },
  ]}
  {...history}
/>;`;

function InteractiveExample({
  appliedFiltersLabel,
  loadExampleLabel,
  manualInputHint,
}: {
  appliedFiltersLabel: string;
  loadExampleLabel: string;
  manualInputHint: string;
}) {
  const [filters, setFilters] = React.useState<FilterClause[]>([]);
  const [exampleRun, setExampleRun] = React.useState(0);

  return (
    <div className="w-full max-w-2xl space-y-3">
      <FilterQueryInput
        defaultDraftText={exampleRun ? multiConditionExample : undefined}
        defaultOpen={exampleRun > 0}
        fields={fields}
        filters={filters}
        freeText={{ fieldId: "query" }}
        key={exampleRun}
        messages={{ placeholder: "Search orders or add status:paid" }}
        onFiltersChange={setFilters}
        queryFields={queryFields}
      />
      <div className="flex flex-wrap items-center gap-2 text-label text-fg-muted">
        <span>{manualInputHint}</span>
        <code className="rounded bg-surface-raised px-1 py-0.5">{multiConditionExample}</code>
        <button className="rounded-md border border-border-subtle bg-surface-raised px-2 py-1 font-medium text-fg-default hover:bg-hover focus-visible:outline-2 focus-visible:outline-focus-ring" onClick={() => setExampleRun((current) => current + 1)} type="button">
          {loadExampleLabel}
        </button>
      </div>
      <div className="text-label font-medium text-fg-default">{appliedFiltersLabel}</div>
      <pre aria-live="polite" className="max-h-44 overflow-auto rounded-xl border border-border-subtle bg-surface-base p-3 text-label text-fg-muted">
        {JSON.stringify(filters, null, 2)}
      </pre>
    </div>
  );
}

export default function FilterQueryInputDoc() {
  const t = useTranslations("filterQueryInput");
  const props: PropDef[] = [
    { name: "fields", type: "FilterField[]", description: t("p0") },
    { name: "queryFields", type: "FilterQueryFieldConfig[]", description: t("p1") },
    { name: "filters", type: "FilterClause[]", description: t("p2") },
    { name: "onFiltersChange", type: "(filters, context) => void", description: t("p3") },
    { name: "codec", type: "FilterQueryCodec", description: t("p4") },
    { name: "freeText", type: "FilterQueryFreeTextConfig | false", description: t("p5") },
    { name: "commitMode", type: '"submit" | "immediate" | "debounced"', default: '"submit"', description: t("p6") },
    { name: "multiple", type: "boolean", default: "true", description: t("p12") },
    { name: "mergeMode", type: '"replace-representable" | "replace-all"', default: '"replace-representable"', description: t("p7") },
    { name: "history", type: "FilterQueryHistoryEntry[]", description: t("p8") },
    { name: "hotkey", type: "false | string[]", description: t("p9") },
    { name: "suggestionProviders", type: "FilterQuerySuggestionProvider[]", description: t("p10") },
    { name: "slots / slotProps / classNames", type: "Customization API", description: t("p11") },
  ];

  return (
    <DocPage description={t("description")} slug="filter-query-input" title="FilterQueryInput">
      <DocSection title={t("playground")}>
        <ComponentPreview code={basicCode} minHeightClass="min-h-[280px]" padding="compact">
          <InteractiveExample
            appliedFiltersLabel={t("appliedFilters")}
            loadExampleLabel={t("loadExample")}
            manualInputHint={t("manualInputHint")}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("suggestionBehavior")}>
        <p className="max-w-3xl text-body leading-6 text-fg-muted">{t("suggestionBehaviorBody")}</p>
      </DocSection>

      <DocSection title={t("reuse")}>
        <div className="max-w-3xl space-y-2 text-body leading-6 text-fg-muted">
          <p>{t("reuseBody")}</p>
          <p>{t("codecBody")}</p>
        </div>
      </DocSection>

      <DocSection title={t("headless")}>
        <p className="max-w-3xl text-body leading-6 text-fg-muted">{t("headlessBody")}</p>
        <ComponentPreview className="mt-3" code={headlessCode} padding="compact">
          <div className="w-full border-s border-brand px-4 py-2 text-body text-fg-muted">{t("headlessPreview")}</div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("asyncHistory")}>
        <p className="max-w-3xl text-body leading-6 text-fg-muted">{t("asyncHistoryBody")}</p>
        <ComponentPreview className="mt-3" code={asyncAndHistoryCode} padding="compact">
          <div className="w-full border-s border-brand px-4 py-2 text-body text-fg-muted">{t("asyncHistoryPreview")}</div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={props} />
      </DocSection>
    </DocPage>
  );
}
