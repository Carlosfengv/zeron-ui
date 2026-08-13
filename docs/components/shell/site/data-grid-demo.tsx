"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";
import {
  type CellSelectOption,
  DataGrid,
  DataGridKeyboardShortcuts,
  useDataGrid,
} from "@zeron/ui/data-grid";

export type Release = {
  id: string;
  title?: string;
  owner?: string;
  status?: "planned" | "active" | "blocked" | "shipped";
  priority?: "low" | "medium" | "high";
  reviewed?: boolean;
  effort?: number;
  due?: string;
};

const initialReleases: Release[] = [
  {
    id: "rel-1",
    title: "Command palette polish",
    owner: "Maya Chen",
    status: "active",
    priority: "high",
    reviewed: true,
    effort: 8,
    due: "2026-05-18",
  },
  {
    id: "rel-2",
    title: "Billing export",
    owner: "Jon Bell",
    status: "planned",
    priority: "medium",
    reviewed: false,
    effort: 5,
    due: "2026-05-24",
  },
  {
    id: "rel-3",
    title: "Workspace audit trail",
    owner: "Nina Patel",
    status: "blocked",
    priority: "high",
    reviewed: false,
    effort: 13,
    due: "2026-06-02",
  },
  {
    id: "rel-4",
    title: "Inline filters",
    owner: "Ada Park",
    status: "shipped",
    priority: "low",
    reviewed: true,
    effort: 3,
    due: "2026-04-28",
  },
];

const statusOptions = [
  { color: "gray", label: "Planned", value: "planned" },
  { color: "blue", label: "Active", value: "active" },
  { color: "red", label: "Blocked", value: "blocked" },
  { color: "green", label: "Shipped", value: "shipped" },
] satisfies CellSelectOption[];

const priorityOptions = [
  { color: "gray", label: "Low", value: "low" },
  { color: "amber", label: "Medium", value: "medium" },
  { color: "red", label: "High", value: "high" },
] satisfies CellSelectOption[];

interface DataGridDemoProps {
  compact?: boolean;
  height?: number;
  shortcuts?: boolean;
}

export function DataGridDemo({
  compact = false,
  height = 360,
  shortcuts = false,
}: DataGridDemoProps) {
  const [data, setData] = React.useState<Release[]>(initialReleases);

  const columns = React.useMemo<ColumnDef<Release>[]>(() => {
    const baseColumns: ColumnDef<Release>[] = [
      {
        accessorKey: "title",
        header: "Title",
        id: "title",
        meta: { cell: { variant: "short-text" } },
        minSize: 190,
      },
      {
        accessorKey: "owner",
        header: "Owner",
        id: "owner",
        meta: { cell: { variant: "short-text" } },
        minSize: 145,
      },
      {
        accessorKey: "status",
        header: "Status",
        id: "status",
        meta: {
          cell: { options: statusOptions, variant: "select" },
        },
        minSize: 125,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        id: "priority",
        meta: {
          cell: { options: priorityOptions, variant: "select" },
        },
        minSize: 115,
      },
    ];

    if (compact) return baseColumns;

    return [
      ...baseColumns,
      {
        accessorKey: "reviewed",
        header: "Reviewed",
        id: "reviewed",
        meta: { cell: { variant: "checkbox" } },
        minSize: 110,
      },
      {
        accessorKey: "effort",
        header: "Effort",
        id: "effort",
        meta: { cell: { max: 21, min: 1, variant: "number" } },
        minSize: 100,
      },
      {
        accessorKey: "due",
        header: "Due",
        id: "due",
        meta: { cell: { variant: "date" } },
        minSize: 130,
      },
    ];
  }, [compact]);

  const onRowAdd = React.useCallback(() => {
    const rowIndex = data.length;
    setData((rows) => [...rows, { id: `rel-${rows.length + 1}` }]);
    return { columnId: "title", rowIndex };
  }, [data.length]);

  const { table, ...dataGridProps } = useDataGrid({
    columns,
    data,
    enablePaste: true,
    enableSearch: true,
    getRowId: (row) => row.id,
    initialState: { columnPinning: { left: ["title"] } },
    onDataChange: setData,
    onRowAdd,
  });

  return (
    <div className="w-full">
      {shortcuts && (
        <DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
      )}
      <DataGrid {...dataGridProps} height={height} table={table} />
    </div>
  );
}
