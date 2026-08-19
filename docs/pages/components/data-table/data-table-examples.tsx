"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Badge, type BadgeColor } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
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
