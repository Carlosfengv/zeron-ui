"use client";

import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useTranslations } from "next-intl";
import {
  EmptyProjectsTable,
  PinnedProjectsTable,
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

const pinnedColumnsCode = `"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Badge, type BadgeColor } from "@zeron/ui/badge";
import { Checkbox } from "@zeron/ui/checkbox";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  useDataTable,
} from "@zeron/ui/data-table";
import { type IconComponent, useIcon } from "@zeron/ui/system/icon-context";

type Project = {
  id: string;
  name: string;
  owner: string;
  status: "Active" | "Paused" | "Draft";
  budget: number;
};

const projects: Project[] = [
  { id: "PRJ-101", name: "Atlas", owner: "Maya Chen", status: "Active", budget: 48000 },
  { id: "PRJ-102", name: "Beacon", owner: "Theo Grant", status: "Paused", budget: 27500 },
  { id: "PRJ-103", name: "Canvas", owner: "Iris Kim", status: "Draft", budget: 19000 },
  { id: "PRJ-104", name: "Drift", owner: "Maya Chen", status: "Active", budget: 63000 },
  { id: "PRJ-105", name: "Ember", owner: "Noah Bell", status: "Active", budget: 35500 },
  { id: "PRJ-106", name: "Folio", owner: "Iris Kim", status: "Draft", budget: 21000 },
  { id: "PRJ-107", name: "Glint", owner: "Theo Grant", status: "Paused", budget: 32500 },
  { id: "PRJ-108", name: "Harbor", owner: "Maya Chen", status: "Active", budget: 72000 },
  { id: "PRJ-109", name: "Index", owner: "Noah Bell", status: "Draft", budget: 18500 },
  { id: "PRJ-110", name: "Juniper", owner: "Iris Kim", status: "Active", budget: 44000 },
  { id: "PRJ-111", name: "Keystone", owner: "Theo Grant", status: "Paused", budget: 39000 },
  { id: "PRJ-112", name: "Lumen", owner: "Noah Bell", status: "Active", budget: 56000 },
];

const statusColors: Record<Project["status"], BadgeColor> = {
  Active: "green",
  Paused: "amber",
  Draft: "gray",
};

function getColumns(StatusIcon: IconComponent): ColumnDef<Project, unknown>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          aria-label="Select all rows on this page"
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          aria-label={"Select " + row.original.name}
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
        />
      ),
      enableHiding: false,
      enableSorting: false,
      size: 44,
    },
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
      accessorKey: "owner",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Owner" />
      ),
      meta: { label: "Owner" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Status" />
      ),
      cell: ({ row }) => (
        <Badge color={statusColors[row.original.status]} size="sm" variant="dot">
          {row.original.status}
        </Badge>
      ),
      filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      meta: {
        filterIcon: StatusIcon,
        label: "Status",
        options: [
          { label: "Active", value: "Active" },
          { label: "Paused", value: "Paused" },
          { label: "Draft", value: "Draft" },
        ],
        variant: "multiSelect",
      },
    },
    {
      accessorKey: "budget",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} label="Budget" />
      ),
      cell: ({ row }) => (
        <span className="tabular-nums">
          {new Intl.NumberFormat("en-US", {
            currency: "USD",
            maximumFractionDigits: 0,
            style: "currency",
          }).format(row.original.budget)}
        </span>
      ),
      meta: { label: "Budget" },
    },
  ];
}

export function PinnedProjectsTable() {
  const StatusIcon = useIcon("dot");
  const columns = useMemo(() => getColumns(StatusIcon), [StatusIcon]);
  const { table } = useDataTable({
    columns,
    data: projects,
    enableRowSelection: true,
    initialState: {
      columnPinning: {
        left: ["select", "name"],
        right: ["budget"],
      },
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  });

  return (
    <DataTable
      actionBar={
        <div className="border border-border-subtle bg-muted/40 px-3 py-2 text-body">
          {table.getFilteredSelectedRowModel().rows.length} projects selected
        </div>
      }
      className="[&_table]:min-w-[960px]"
      table={table}
    >
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
  { name: "filterIcon", type: "IconComponent", description: "Optional semantic icon for a faceted-filter button." },
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
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            { value: "directory", label: "Project directory", code: exampleCode, preview: <div className="w-full"><ProjectsTable /></div> },
            { value: "pinned", label: "Pinned columns", code: pinnedColumnsCode, preview: <div className="w-full"><PinnedProjectsTable /></div> },
            { value: "empty", label: "Empty state", code: '<DataTable emptyMessage="No projects found." table={table} />', preview: <div className="w-full"><EmptyProjectsTable /></div> },
          ]}
        />
      </DocSection>

      <DocSection title={t("projectDirectory")}>
        <ComponentPreview code={exampleCode}>
          <div className="w-full">
            <ProjectsTable />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("pinnedColumns")}>
        <p className="text-body text-fg-muted">
          {t("pinnedColumnsDescription")}
        </p>
        <ComponentPreview code={pinnedColumnsCode}>
          <div className="w-full">
            <PinnedProjectsTable />
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
            <h3 className="text-body text-fg-default">DataTable</h3>
            <PropsTable props={dataTableProps(t)} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">useDataTable</h3>
            <PropsTable props={hookProps(t)} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-fg-default">Column meta</h3>
            <PropsTable props={metaProps(t)} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
