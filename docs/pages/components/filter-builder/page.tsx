"use client";

import * as React from "react";
import {
  FilterBuilder,
  type FilterClause,
  type FilterField,
} from "@zeron/ui/filter-builder";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const fields: FilterField[] = [
  { id: "name", label: "Name", type: "text", placeholder: "Search names" },
  { id: "amount", label: "Amount", type: "number", min: 0 },
  {
    id: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
      { value: "archived", label: "Archived" },
    ],
  },
  {
    id: "tags",
    label: "Tags",
    type: "multiSelect",
    options: [
      { value: "enterprise", label: "Enterprise" },
      { value: "trial", label: "Trial" },
      { value: "priority", label: "Priority" },
    ],
  },
  { id: "verified", label: "Verified", type: "boolean" },
  { id: "createdAt", label: "Created", type: "dateRange" },
];

const basicCode = `import { FilterBuilder, type FilterField } from "@zeron/ui/filter-builder";

const fields: FilterField[] = [
  { id: "name", label: "Name", type: "text" },
  { id: "amount", label: "Amount", type: "number", min: 0 },
  {
    id: "status", label: "Status", type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "pending", label: "Pending" },
    ],
  },
  { id: "createdAt", label: "Created", type: "dateRange" },
];

function Example() {
  const [filters, setFilters] = useState([]);
  return <FilterBuilder fields={fields} filters={filters} onFiltersChange={setFilters} />;
}`;

const controlledCode = `const [filters, setFilters] = useState<FilterClause[]>([]);
const [logic, setLogic] = useState<FilterLogic>("and");

<FilterBuilder
  fields={fields}
  filters={filters}
  logic={logic}
  onFiltersChange={setFilters}
  onLogicChange={setLogic}
/>`;

const asyncCode = `{
  id: "assignee",
  label: "Assignee",
  type: "multiSelect",
  searchable: true,
  virtualize: "auto",
  loadOptions: async (query, { signal }) => {
    const response = await fetch(\`/api/users?q=\${query}\`, { signal });
    return response.json();
  },
}`;

function InteractiveExample() {
  const [filters, setFilters] = React.useState<FilterClause[]>([]);
  const [logic, setLogic] = React.useState<"and" | "or">("and");

  return (
    <div className="w-full space-y-4">
      <FilterBuilder
        fields={fields}
        filters={filters}
        logic={logic}
        maxFilters={6}
        onFiltersChange={setFilters}
        onLogicChange={setLogic}
      />
      <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-surface-raised p-3 text-label text-fg-muted">
        {JSON.stringify({ logic, filters }, null, 2)}
      </pre>
    </div>
  );
}

export default function FilterBuilderDoc() {
  const t = useTranslations("filterBuilder");
  const props: PropDef[] = [
    { name: "fields", type: "FilterField[]", description: t("fieldsProp") },
    { name: "filters", type: "FilterClause[]", description: t("filtersProp") },
    { name: "defaultFilters", type: "FilterClause[]", default: "[]", description: t("defaultFiltersProp") },
    { name: "logic", type: '"and" | "or"', description: t("logicProp") },
    { name: "onFiltersChange", type: "(filters) => void", description: t("onFiltersChangeProp") },
    { name: "allowDuplicateFields", type: "boolean", default: "true", description: t("allowDuplicateFieldsProp") },
    { name: "maxFilters", type: "number", description: t("maxFiltersProp") },
    { name: "readOnly", type: "boolean", default: "false", description: t("readOnlyProp") },
  ];

  return (
    <DocPage
      description="Composable, typed filters for complex data views, with text, number, option, boolean, date, async, and custom editors."
      slug="filter-builder"
      title="FilterBuilder"
    >
      <DocSection title={t("playground")}>
        <ComponentPreview code={basicCode} padding="compact">
          <InteractiveExample />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("controlled")}>
        <p className="max-w-2xl text-body leading-6 text-fg-muted">{t("controlledBody")}</p>
        <ComponentPreview className="mt-3" code={controlledCode}>
          <FilterBuilder defaultFilters={[{ id: "status-filter", field: "status", operator: "is", value: "active" }]} fields={fields} />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("asyncOptions")}>
        <p className="max-w-2xl text-body leading-6 text-fg-muted">{t("asyncOptionsBody")}</p>
        <ComponentPreview className="mt-3" code={asyncCode}>
          <FilterBuilder fields={fields.filter((field) => field.type === "multiSelect")} />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("serverFiltering")}>
        <p className="max-w-2xl text-body leading-6 text-fg-muted">{t("serverFilteringBody")}</p>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={props} />
      </DocSection>
    </DocPage>
  );
}
