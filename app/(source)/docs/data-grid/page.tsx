"use client";

import { useTranslations } from "next-intl";
import { DeferredDataGridDemo } from "@/docs/site/deferred-data-grid-demo";
import { ComponentPreview } from "@/docs/ComponentPreview";
import { DocPage, DocSection } from "@/docs/DocPage";
import { PropsTable, type PropDef } from "@/docs/PropsTable";

const exampleCode = `import type { ColumnDef } from "@tanstack/react-table";
import { DataGrid, useDataGrid } from "@/components/ui/data-grid";

const columns: ColumnDef<Release>[] = [
  {
    accessorKey: "title",
    header: "Title",
    meta: { cell: { variant: "short-text" } },
  },
  {
    accessorKey: "status",
    header: "Status",
    meta: {
      cell: {
        variant: "select",
        options: [
          { label: "Planned", value: "planned", color: "gray" },
          { label: "Active", value: "active", color: "blue" },
        ],
      },
    },
  },
];

function ReleaseGrid() {
  const [data, setData] = useState(initialReleases);
  const { table, ...grid } = useDataGrid({
    columns,
    data,
    enablePaste: true,
    enableSearch: true,
    getRowId: (row) => row.id,
    onDataChange: setData,
  });

  return <DataGrid {...grid} table={table} height={360} />;
}`;

function getGridProps(t: ReturnType<typeof useTranslations>): PropDef[] {
  return [
    { name: "table", type: "Table<TData>", description: t("tableDescription") },
    { name: "height", type: "number", default: "600", description: t("heightDescription") },
    { name: "dir", type: '"ltr" | "rtl"', default: '"ltr"', description: t("directionDescription") },
    { name: "stretchColumns", type: "boolean", default: "false", description: t("stretchColumnsDescription") },
  ];
}

function getHookProps(t: ReturnType<typeof useTranslations>): PropDef[] {
  return [
    { name: "data", type: "TData[]", description: t("dataDescription") },
    { name: "columns", type: "ColumnDef<TData>[]", description: t("columnsDescription") },
    { name: "onDataChange", type: "(data: TData[]) => void", description: t("dataChangeDescription") },
    { name: "onRowAdd", type: "() => CellPosition | void", description: t("rowAddDescription") },
    { name: "enablePaste", type: "boolean", default: "false", description: t("pasteDescription") },
    { name: "readOnly", type: "boolean", default: "false", description: t("readOnlyDescription") },
    { name: "rowHeight", type: '"short" | "medium" | "tall" | "extra-tall"', default: '"short"', description: t("rowHeightDescription") },
    { name: "initialState", type: "InitialTableState", description: t("initialStateDescription") },
  ];
}

function getCellMetaProps(t: ReturnType<typeof useTranslations>): PropDef[] {
  return [
    { name: "variant", type: '"short-text" | "long-text" | "number" | "select" | "multi-select" | "checkbox" | "date" | "url" | "file"', description: t("cellVariantDescription") },
    { name: "options", type: "CellSelectOption[]", description: t("optionsDescription") },
    { name: "min / max", type: "number", description: t("boundsDescription") },
    { name: "readOnly", type: "boolean", default: "false", description: t("columnReadOnlyDescription") },
  ];
}

export default function DataGridDoc() {
  const t = useTranslations("dataGrid");
  return (
    <DocPage
      title="DataGrid"
      slug="data-grid"
      description={t("description")}
    >
      <DocSection title={t("releasePlanner")}>
        <ComponentPreview
          code={exampleCode}
          inspectable={false}
          minHeightClass="min-h-[420px]"
          padding="responsive"
        >
          <DeferredDataGridDemo height={360} shortcuts />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("interactionModel")}>
        <div className="grid gap-3 text-body text-fg-muted sm:grid-cols-2">
          <div className="border border-border-subtle bg-surface-raised p-4 rounded-[var(--container-radius)]">
            {t("moveAndEdit")}
          </div>
          <div className="border border-border-subtle bg-surface-raised p-4 rounded-[var(--container-radius)]">
            {t("rangeControls")}
          </div>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">DataGrid</h3>
            <PropsTable props={getGridProps(t)} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">useDataGrid</h3>
            <PropsTable props={getHookProps(t)} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">{t("cellMetadata")}</h3>
            <PropsTable props={getCellMetaProps(t)} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
