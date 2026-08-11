import { ComponentPreview } from "@/docs/ComponentPreview";
import { PropsTable, type PropDef } from "@/docs/PropsTable";
import { DocPage, DocSection } from "@/docs/DocPage";
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

const dataTableProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "TanStack table instance returned by useDataTable." },
  { name: "children", type: "ReactNode", description: "Optional toolbar or custom content rendered above the table." },
  { name: "actionBar", type: "ReactNode", description: "Selection actions shown when one or more filtered rows are selected." },
  { name: "emptyMessage", type: "ReactNode", default: '"No results."', description: "Content shown when no rows match." },
];

const hookProps: PropDef[] = [
  { name: "data", type: "TData[]", description: "Rows supplied to TanStack Table." },
  { name: "columns", type: "ColumnDef<TData, unknown>[]", description: "Column definitions, headers, cells, and filter metadata." },
  { name: "initialState", type: "TableOptions<TData>[\"initialState\"]", description: "Initial sorting, pagination, visibility, and pinning state." },
  { name: "…options", type: "TableOptions<TData>", description: "Other TanStack Table options, including row selection and custom filter functions." },
];

const metaProps: PropDef[] = [
  { name: "label", type: "string", description: "Readable column label used by filters and view options." },
  { name: "variant", type: '"text" | "number" | "select" | "multiSelect"', description: "Toolbar filter generated for this column." },
  { name: "options", type: "DataTableFilterOption[]", description: "Options for select and multi-select filters." },
  { name: "placeholder", type: "string", description: "Placeholder for text and number filters." },
  { name: "unit", type: "string", description: "Optional suffix displayed inside a number filter." },
];

export default function DataTableDoc() {
  return (
    <DocPage
      title="DataTable"
      slug="data-table"
      description="Composable data table with sorting, filtering, pagination, selection, column visibility, and pinning."
    >
      <DocSection title="Project Directory">
        <ComponentPreview code={exampleCode}>
          <div className="w-full">
            <ProjectsTable />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Empty State">
        <ComponentPreview code={'<DataTable emptyMessage="No projects found." table={table} />'}>
          <div className="w-full">
            <EmptyProjectsTable />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">DataTable</h3>
            <PropsTable props={dataTableProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">useDataTable</h3>
            <PropsTable props={hookProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">Column meta</h3>
            <PropsTable props={metaProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
