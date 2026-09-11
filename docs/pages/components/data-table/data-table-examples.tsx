"use client";

import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Badge, type BadgeColor } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Skeleton } from "@zeron/ui/skeleton";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  useDataTable,
} from "@zeron/ui/data-table";
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyHeader,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
} from "@zeron/ui/empty";
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

const emptyProjects: Project[] = [];

const statusColors: Record<Project["status"], BadgeColor> = {
  Active: "green",
  Paused: "amber",
  Draft: "gray",
};

const projectStatuses = ["Active", "Paused", "Draft"] as const;

const initialProjectSelection = {
  "PRJ-101": true,
  "PRJ-102": true,
  "PRJ-103": true,
};

function getColumns(StatusIcon: IconComponent): ColumnDef<Project, unknown>[] {
  return [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        aria-label="Select all rows on this page"
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(checked) =>
          table.toggleAllPageRowsSelected(checked === true)
        }
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
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
    header: ({ column }) => <DataTableColumnHeader column={column} label="Project" />,
    meta: { label: "Project", placeholder: "Filter projects…", variant: "text" },
  },
  {
    accessorKey: "owner",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Owner" />,
    meta: { label: "Owner" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} label="Budget" />,
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

function BulkSelectionToolbar({
  onArchive,
  onExport,
  onStatusChange,
  table,
}: {
  onArchive: () => void;
  onExport: () => void;
  onStatusChange: (status: Project["status"]) => void;
  table: TanstackTable<Project>;
}) {
  const ArchiveIcon = useIcon("file-archive");
  const ChevronDownIcon = useIcon("chevron-down");
  const UploadIcon = useIcon("upload");
  const XIcon = useIcon("x");
  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const selectedStatuses = new Set(
    selectedRows.map((row) => row.original.status)
  );
  const commonStatus =
    selectedStatuses.size === 1 ? selectedRows[0]?.original.status : undefined;
  const checkedStatusIndex = commonStatus
    ? projectStatuses.indexOf(commonStatus)
    : undefined;

  return (
    <div
      aria-label="Bulk actions for selected projects"
      className="flex w-full flex-wrap items-center justify-between gap-2 p-1"
      role="toolbar"
    >
      <div className="flex min-w-0 items-center gap-1">
        <span
          aria-live="polite"
          className="px-2 text-body font-medium text-fg-default"
        >
          {selectedCount} {selectedCount === 1 ? "project" : "projects"} selected
        </span>
        <Button
          aria-label="Clear project selection"
          iconOnly
          onClick={() => table.resetRowSelection(true)}
          size="md"
          variant="ghost"
        >
          <XIcon />
        </Button>
      </div>

      <div
        aria-label="Selected project actions"
        className="flex flex-row items-center gap-1.5"
        role="group"
      >
        <DropdownMenu>
          <DropdownTrigger
            render={
              <Button
                size="md"
                trailingIcon={ChevronDownIcon}
                variant="tertiary"
              >
                Change status
              </Button>
            }
          />
          <DropdownContent align="end" checkedIndex={checkedStatusIndex}>
            {projectStatuses.map((status, index) => (
              <MenuItem
                checked={commonStatus === status}
                index={index}
                key={status}
                label={status}
                onSelect={() => onStatusChange(status)}
              />
            ))}
          </DropdownContent>
        </DropdownMenu>
        <Button
          leadingIcon={UploadIcon}
          onClick={onExport}
          size="md"
          variant="tertiary"
        >
          Export
        </Button>
        <Button
          leadingIcon={ArchiveIcon}
          onClick={onArchive}
          size="md"
          variant="destructive"
        >
          Archive
        </Button>
      </div>
    </div>
  );
}

function downloadProjects(rows: Project[]) {
  const csv = [
    "ID,Project,Owner,Status,Budget",
    ...rows.map((row) =>
      [row.id, row.name, row.owner, row.status, row.budget].join(",")
    ),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );
  const link = document.createElement("a");

  link.href = url;
  link.download = "selected-projects.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function ProjectsTableDemo({
  forceHorizontalScroll = false,
}: {
  forceHorizontalScroll?: boolean;
}) {
  const StatusIcon = useIcon("dot");
  const columns = useMemo(() => getColumns(StatusIcon), [StatusIcon]);
  const { table } = useDataTable({
    columns,
    data: projects,
    enableRowSelection: true,
    initialState: {
      columnPinning: { left: ["select", "name"], right: ["budget"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });

  return (
    <DataTable
      actionBar={
        <div className="border border-border-subtle bg-muted/40 px-3 py-2 text-body">
          {table.getFilteredSelectedRowModel().rows.length} projects selected
        </div>
      }
      className={forceHorizontalScroll ? "[&_table]:min-w-[960px]" : undefined}
      table={table}
    >
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function ProjectsTable() {
  return <ProjectsTableDemo />;
}

export function PinnedProjectsTable() {
  return <ProjectsTableDemo forceHorizontalScroll />;
}

export function SelectedProjectsTable() {
  const [rows, setRows] = useState(projects);
  const StatusIcon = useIcon("dot");
  const columns = useMemo(() => getColumns(StatusIcon), [StatusIcon]);
  const { table } = useDataTable({
    columns,
    data: rows,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 10 },
      rowSelection: initialProjectSelection,
    },
  });
  const selectedCount = table.getSelectedRowModel().rows.length;

  const updateSelectedStatus = (status: Project["status"]) => {
    const selectedIds = new Set(
      table.getSelectedRowModel().rows.map((row) => row.original.id)
    );

    setRows((currentRows) =>
      currentRows.map((row) =>
        selectedIds.has(row.id) ? { ...row, status } : row
      )
    );
    table.resetRowSelection(true);
  };

  const archiveSelectedProjects = () => {
    const selectedIds = new Set(
      table.getSelectedRowModel().rows.map((row) => row.original.id)
    );

    setRows((currentRows) =>
      currentRows.filter((row) => !selectedIds.has(row.id))
    );
    table.resetRowSelection(true);
  };

  return (
    <DataTable
      paginationProps={{ labels: { selectedRows: () => null } }}
      table={table}
    >
      {selectedCount > 0 ? (
        <BulkSelectionToolbar
          onArchive={archiveSelectedProjects}
          onExport={() =>
            downloadProjects(
              table.getSelectedRowModel().rows.map((row) => row.original)
            )
          }
          onStatusChange={updateSelectedStatus}
          table={table}
        />
      ) : (
        <DataTableToolbar table={table} />
      )}
    </DataTable>
  );
}

export function LoadingProjectsTable() {
  const StatusIcon = useIcon("dot");
  const columns = useMemo(() => getColumns(StatusIcon), [StatusIcon]);
  const { table } = useDataTable({
    columns,
    data: emptyProjects,
    initialState: {
      columnPinning: { left: ["select", "name"], right: ["budget"] },
    },
  });

  return (
    <DataTable
      isLoading
      loadingMessage="Loading projects"
      renderLoadingCell={({ column }) => {
        if (column.id === "select") {
          return <Skeleton className="size-4 rounded-sm" />;
        }

        if (column.id === "status") {
          return <Skeleton className="h-5 w-20 rounded-full" />;
        }

        return undefined;
      }}
      table={table}
    />
  );
}

export function EmptyProjectsTable() {
  const StatusIcon = useIcon("dot");
  const columns = useMemo(() => getColumns(StatusIcon), [StatusIcon]);
  const { table } = useDataTable({ columns, data: emptyProjects });

  return (
    <DataTable
      emptyState={
        <Empty density="compact" reason="first-use" scope="section">
          <EmptyMedia>
            <EmptyIllustration variant="resources" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No projects found.</EmptyTitle>
            <EmptyDescription>
              Create a project to start tracking work, ownership, and budget.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyActions>
            <Button size="sm">Create project</Button>
          </EmptyActions>
        </Empty>
      }
      table={table}
    />
  );
}
