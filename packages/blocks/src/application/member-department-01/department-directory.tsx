"use client";

import { getExpandedRowModel, type ColumnDef } from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import {
  DataTable,
  DataTableFacetedFilter,
  useDataTable,
} from "@zeron/ui/data-table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zeron/ui/input-group";
import { MemberTree, type OrganizationNode } from "@zeron/ui/member-tree";
import { MobileDrawer } from "@zeron/ui/mobile-drawer";
import {
  PageAside,
  PageBody,
  PageColumns,
  PageContent,
  PageContentHeader,
  PageLayout,
  PagePrimary,
} from "@zeron/ui/page-layout";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { calculateDepartmentMemberCounts } from "./member-department-data";
import type {
  MemberDepartmentCountedDepartment,
  MemberDepartmentDepartment,
  MemberDepartmentLabels,
  MemberDepartmentMember,
} from "./member-department-types";

type DepartmentDirectoryProps = {
  className?: string;
  departments: readonly MemberDepartmentDepartment[];
  isLoading: boolean;
  labels: MemberDepartmentLabels;
  members: readonly MemberDepartmentMember[];
  navigation: ReactNode;
  onCreateMember?: () => void;
  onDepartmentExpand?: (
    department: MemberDepartmentCountedDepartment,
    expanded: boolean
  ) => void;
  onDepartmentOpen?: (department: MemberDepartmentCountedDepartment) => void;
};

function findDepartment(
  departments: readonly MemberDepartmentCountedDepartment[],
  departmentId: string | null
): MemberDepartmentCountedDepartment | undefined {
  for (const department of departments) {
    if (department.id === departmentId) return department;
    const found = department.children
      ? findDepartment(department.children, departmentId)
      : undefined;
    if (found) return found;
  }
}

function toDetailTree(
  department: MemberDepartmentCountedDepartment,
  members: readonly MemberDepartmentMember[]
): readonly OrganizationNode[] {
  const toNode = (item: MemberDepartmentCountedDepartment): OrganizationNode => {
    const childDepartments = item.children?.map(toNode) ?? [];
    const departmentMembers = members
      .filter((member) => member.departmentId === item.id && member.status !== "departed")
      .map(
        (member): OrganizationNode => ({
          key: `member:${member.id}`,
          label: member.name,
          type: "member",
          memberId: member.id,
          avatarUrl: member.avatarUrl,
          description: member.email,
          keywords: [member.email, member.functionGroup],
        })
      );

    return {
      key: `department:${item.id}`,
      label: item.name,
      type: "department",
      departmentId: item.id,
      keywords: item.owner ? [item.owner.name, item.owner.email] : undefined,
      children: [...childDepartments, ...departmentMembers],
    };
  };

  return [toNode(department)];
}

function DepartmentDetails({
  department,
  labels,
  members,
}: {
  department?: MemberDepartmentCountedDepartment;
  labels: MemberDepartmentLabels;
  members: readonly MemberDepartmentMember[];
}) {
  const SearchIcon = useIcon("search");
  const UserIcon = useIcon("user");
  const [query, setQuery] = useState("");
  const detailTree = useMemo(
    () => (department ? toDetailTree(department, members) : []),
    [department, members]
  );

  useEffect(() => setQuery(""), [department?.id]);

  if (!department) return null;

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label={labels.departmentDetails}>
      <div className="border-b border-border p-3">
        <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-muted text-fg-default">
          <UserIcon size={20} />
        </span>
        <div className="mt-3 min-w-0">
          <h2 className="truncate text-body font-medium text-fg-default">{department.name}</h2>
          <p className="truncate text-label text-fg-muted">
            {labels.departmentOwner}: {department.owner?.name ?? "—"} {department.owner?.email ?? ""}
          </p>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <InputGroup size="sm">
          <InputGroupAddon className="pr-2">
            <SearchIcon aria-hidden size={16} strokeWidth={1.5} />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={labels.departmentMemberSearchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.departmentMemberSearchPlaceholder}
            value={query}
          />
        </InputGroup>
        <MemberTree
          aria-label={labels.departmentMembers}
          className="min-w-0"
          defaultExpandedKeys={[
            `department:${department.id}`,
            ...(department.children?.length ? [`department:${department.children[0].id}`] : []),
          ]}
          density="regular"
          items={detailTree}
          key={department.id}
          query={query}
          renderTrailing={({ node }) => {
            const item = node.data;
            if (item?.type !== "department") return null;
            const treeDepartment = findDepartment([department], item.departmentId);
            return treeDepartment ? (
              <Badge color="gray" size="sm">{treeDepartment.memberCount}</Badge>
            ) : null;
          }}
          selectableTypes={[]}
          selectionMode="none"
        />
      </div>
    </section>
  );
}

function DepartmentDirectory({
  className,
  departments,
  isLoading,
  labels,
  members,
  navigation,
  onCreateMember,
  onDepartmentExpand,
  onDepartmentOpen,
}: DepartmentDirectoryProps) {
  const SearchIcon = useIcon("search");
  const PlusIcon = useIcon("plus");
  const ChevronDown = useIcon("chevron-down");
  const ChevronRight = useIcon("chevron-right");
  const UsersIcon = useIcon("users");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(
    () => departments[0]?.id ?? null
  );
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const tableData = useMemo(
    () => calculateDepartmentMemberCounts(departments, members),
    [departments, members]
  );
  const selectedDepartment = useMemo(
    () => findDepartment(tableData, selectedDepartmentId),
    [selectedDepartmentId, tableData]
  );
  const getSubRows = useCallback(
    (department: MemberDepartmentCountedDepartment) =>
      department.children
        ? [...department.children]
        : undefined,
    []
  );

  useEffect(() => {
    if (!selectedDepartment) setSelectedDepartmentId(departments[0]?.id ?? null);
  }, [departments, selectedDepartment]);

  const openDepartment = useCallback(
    (department: MemberDepartmentCountedDepartment) => {
      setSelectedDepartmentId(department.id);
      onDepartmentOpen?.(department);
    },
    [onDepartmentOpen]
  );

  const columns = useMemo<ColumnDef<MemberDepartmentCountedDepartment, unknown>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all departments"
            checked={table.getIsSomePageRowsSelected() ? "indeterminate" : table.getIsAllPageRowsSelected()}
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select ${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
        enableHiding: false,
        enableSorting: false,
        size: 48,
      },
      {
        accessorKey: "name",
        header: labels.departmentName,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-1">
            {Array.from({ length: row.depth }).map((_, index) => (
              <span aria-hidden className="w-4 shrink-0" key={index} />
            ))}
            {row.getCanExpand() ? (
              <Button
                aria-label={`${row.getIsExpanded() ? "Collapse" : "Expand"} ${row.original.name}`}
                iconOnly
                onClick={() => {
                  const expanded = !row.getIsExpanded();
                  row.toggleExpanded(expanded);
                  onDepartmentExpand?.(row.original, expanded);
                }}
                size="xs"
                type="button"
                variant="ghost"
              >
                {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
              </Button>
            ) : <span aria-hidden className="w-control-xs shrink-0" />}
            <button
              aria-label={`${labels.openDepartmentDetails}: ${row.original.name}`}
              className="min-w-0 truncate rounded-lg text-left text-body font-medium text-fg-default outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
              onClick={() => openDepartment(row.original)}
              type="button"
            >
              {row.original.name}
            </button>
          </div>
        ),
        filterFn: (row, _columnId, value) =>
          row.original.name.toLocaleLowerCase().includes(String(value ?? "").trim().toLocaleLowerCase()),
        meta: { label: labels.departmentName },
        minSize: 260,
      },
      {
        accessorKey: "memberCount",
        header: labels.departmentMemberCount,
        cell: ({ row }) => <span className="tabular-nums text-fg-muted">{row.original.memberCount}</span>,
        meta: { label: labels.departmentMemberCount },
        size: 136,
      },
      {
        id: "owner",
        header: labels.departmentOwner,
        cell: ({ row }) => <span className="text-fg-muted">{row.original.owner?.email ?? "—"}</span>,
        meta: { label: labels.departmentOwner },
        minSize: 220,
      },
      {
        accessorKey: "status",
        header: labels.status,
        cell: ({ row }) => (
          <Badge color={row.original.status === "active" ? "blue" : "gray"} size="sm">
            {row.original.status === "active" ? labels.active : labels.suspended}
          </Badge>
        ),
        filterFn: (row, columnId, value) =>
          !Array.isArray(value) || value.length === 0 || value.includes(row.getValue(columnId)),
        meta: {
          filterIcon: UsersIcon,
          label: labels.statusFilter,
          options: [
            { label: labels.active, value: "active" },
            { label: labels.suspended, value: "disabled" },
          ],
          variant: "multiSelect",
        },
        size: 132,
      },
    ],
    [ChevronDown, ChevronRight, UsersIcon, labels, onDepartmentExpand, openDepartment]
  );
  const { table } = useDataTable({
    columns,
    data: tableData,
    filterFromLeafRows: true,
    getExpandedRowModel: getExpandedRowModel(),
    getRowId: (department) => department.id,
    getSubRows,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
    paginateExpandedRows: false,
  });
  const nameColumn = table.getColumn("name");
  const statusColumn = table.getColumn("status");
  const details = <DepartmentDetails department={selectedDepartment} labels={labels} members={members} />;

  return (
    <div className={cn("h-full min-h-0", className)}>
      <PageLayout gutter="none" size="full">
        <PageColumns asideWidth="25rem" columnsAt="xl" className="h-full min-h-0 grid-rows-[minmax(0,1fr)] items-stretch gap-2">
          <PagePrimary className="flex h-full min-h-0">
            <PageContent>
              <PageContentHeader>{navigation}</PageContentHeader>
              <PageContentHeader>
                <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <InputGroup className="w-[450px] max-w-full" size="md">
                      <InputGroupAddon className="pr-2">
                        <SearchIcon aria-hidden size={16} strokeWidth={1.5} />
                      </InputGroupAddon>
                      <InputGroupInput
                        aria-label={labels.departmentSearchPlaceholder}
                        onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
                        placeholder={labels.departmentSearchPlaceholder}
                        value={(nameColumn?.getFilterValue() as string) ?? ""}
                      />
                    </InputGroup>
                    {statusColumn ? (
                      <DataTableFacetedFilter
                        column={statusColumn}
                        icon={statusColumn.columnDef.meta?.filterIcon}
                        multiple
                        options={statusColumn.columnDef.meta?.options ?? []}
                        title={labels.statusFilter}
                      />
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      aria-label={labels.openDepartmentDetails}
                      className="xl:hidden"
                      iconOnly
                      onClick={() => setIsDetailsDrawerOpen(true)}
                      size="md"
                      type="button"
                      variant="tertiary"
                    >
                      <UsersIcon />
                    </Button>
                    <Button leadingIcon={PlusIcon} onClick={onCreateMember} size="md" type="button" variant="primary">
                      {labels.addMember}
                    </Button>
                  </div>
                </div>
              </PageContentHeader>
              <PageBody className="max-w-none p-3">
                <DataTable
                  activeRowId={selectedDepartmentId}
                  className="h-full gap-3 [&_[data-slot=data-table-pagination]]:px-2"
                  emptyMessage={labels.empty}
                  isLoading={isLoading}
                  onRowActivate={(row) => openDepartment(row.original)}
                  table={table}
                />
              </PageBody>
            </PageContent>
          </PagePrimary>
          <PageAside className="hidden h-full min-h-0 xl:flex">
            <PageContent>{details}</PageContent>
          </PageAside>
        </PageColumns>
      </PageLayout>
      <MobileDrawer
        ariaLabel={labels.departmentDetails}
        onClose={() => setIsDetailsDrawerOpen(false)}
        open={isDetailsDrawerOpen}
      >
        {details}
      </MobileDrawer>
    </div>
  );
}

export { DepartmentDirectory };
