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

const gridProps: PropDef[] = [
  { name: "table", type: "Table<TData>", description: "TanStack table instance returned by useDataGrid." },
  { name: "height", type: "number", default: "600", description: "Maximum scroll viewport height in pixels." },
  { name: "dir", type: '"ltr" | "rtl"', default: '"ltr"', description: "Reading direction used for keyboard movement and pinned columns." },
  { name: "stretchColumns", type: "boolean", default: "false", description: "Lets non-selection columns grow to fill available width." },
];

const hookProps: PropDef[] = [
  { name: "data", type: "TData[]", description: "Editable row data." },
  { name: "columns", type: "ColumnDef<TData>[]", description: "Column definitions and cell editor metadata." },
  { name: "onDataChange", type: "(data: TData[]) => void", description: "Receives edits, clears, pastes, and row updates." },
  { name: "onRowAdd", type: "() => CellPosition | void", description: "Adds a row and may return the cell that should receive focus." },
  { name: "enablePaste", type: "boolean", default: "false", description: "Enables spreadsheet-style multi-cell paste." },
  { name: "readOnly", type: "boolean", default: "false", description: "Keeps navigation, sorting, and selection while disabling edits." },
  { name: "rowHeight", type: '"short" | "medium" | "tall" | "extra-tall"', default: '"short"', description: "Controls virtual row height and line clamping." },
  { name: "initialState", type: "InitialTableState", description: "Initial sorting, sizing, visibility, and pinning state." },
];

const cellMetaProps: PropDef[] = [
  { name: "variant", type: '"short-text" | "long-text" | "number" | "select" | "multi-select" | "checkbox" | "date" | "url" | "file"', description: "Chooses the display and editor behavior for a column." },
  { name: "options", type: "CellSelectOption[]", description: "Options used by select and multi-select cells. Each option accepts the Badge color palette through color." },
  { name: "min / max", type: "number", description: "Optional bounds for number cells." },
  { name: "readOnly", type: "boolean", default: "false", description: "Disables editing for this column only." },
];

export default function DataGridDoc() {
  return (
    <DocPage
      title="DataGrid"
      slug="data-grid"
      description="Virtualized spreadsheet-style data grid with inline editing, range selection, search, copy and paste, resizing, sorting, and pinned columns."
    >
      <DocSection title="Release planner">
        <ComponentPreview
          code={exampleCode}
          inspectable={false}
          minHeightClass="min-h-[420px]"
          padding="responsive"
        >
          <DeferredDataGridDemo height={360} shortcuts />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Interaction model">
        <div className="grid gap-3 text-body-sm text-muted-foreground sm:grid-cols-2">
          <div className="border border-border/60 bg-surface-raised p-4 rounded-[var(--container-radius)]">
            Click or use arrow keys to move. Press Enter, F2, or start typing to edit the focused cell.
          </div>
          <div className="border border-border/60 bg-surface-raised p-4 rounded-[var(--container-radius)]">
            Hold Shift to extend a range. Copy, paste, delete, search, pin, sort, and resize with familiar spreadsheet controls.
          </div>
        </div>
      </DocSection>

      <DocSection title="API Reference">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">DataGrid</h3>
            <PropsTable props={gridProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">useDataGrid</h3>
            <PropsTable props={hookProps} />
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="text-body text-foreground">Column cell metadata</h3>
            <PropsTable props={cellMetaProps} />
          </div>
        </div>
      </DocSection>
    </DocPage>
  );
}
