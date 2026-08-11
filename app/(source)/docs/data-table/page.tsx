"use client";

import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
import { useTranslations } from "next-intl";
import {
  EmptyProjectsTable,
  ProjectsTable,
} from "./data-table-examples";

const exampleCode = `import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  useDataTable,
} from "./components/data-table";

const columns: ColumnDef<Project, unknown>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Project" />
    ),
    meta: {
      label: "Project",
      placeholder: "Filter projects…",
      variant: "text",
    },
  },
  {
    accessorKey: "status",
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    meta: {
      label: "Status",
      variant: "multiSelect",
      options: [
        { label: "Active", value: "Active" },
        { label: "Paused", value: "Paused" },
      ],
    },
  },
];

function ProjectsTable() {
  const { table } = useDataTable({
    columns,
    data: projects,
    enableRowSelection: true,
    initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}`;

const dataTableProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  { name: "table", type: "Table<TData>", description: t("table") },
  { name: "children", type: "ReactNode", description: t("children") },
  { name: "actionBar", type: "ReactNode", description: t("actionBar") },
  { name: "emptyMessage", type: "ReactNode", default: '"No results."', description: t("emptyMessage") },
];

const hookProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  { name: "data", type: "TData[]", description: t("data") },
  { name: "columns", type: "ColumnDef<TData, unknown>[]", description: t("columns") },
  { name: "initialState", type: "TableOptions<TData>[\"initialState\"]", description: t("initialState") },
  { name: "…options", type: "TableOptions<TData>", description: t("options") },
];

const metaProps = (t: ReturnType<typeof useTranslations>): PropDef[] => [
  { name: "label", type: "string", description: t("label") },
  { name: "variant", type: '"text" | "number" | "select" | "multiSelect"', description: t("variant") },
  { name: "options", type: "DataTableFilterOption[]", description: t("filterOptions") },
  { name: "placeholder", type: "string", description: t("placeholder") },
  { name: "unit", type: "string", description: t("unit") },
];

export default function DataTableDoc() {
  const t = useTranslations("dataTable");
  return (
    <DocPage
      title="DataTable"
      slug="data-table"
      description="Composable data table with sorting, filtering, pagination, selection, column visibility, and pinning."
    >
      <DocSection title={t("projectDirectory")}>
        <ComponentPreview code={exampleCode}>
          <div className="w-full">
            <ProjectsTable />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("emptyState")}>
        <ComponentPreview code={'<DataTable emptyMessage="No projects found." table={table} />'}>
          <div className="w-full">
            <EmptyProjectsTable />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">DataTable</h3>
            <PropsTable props={dataTableProps(t)} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">useDataTable</h3>
            <PropsTable props={hookProps(t)} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">Column meta</h3>
            <PropsTable props={metaProps(t)} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
