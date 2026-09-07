"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@zeron/ui/avatar";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
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
  PageBody,
  PageContent,
  PageContentHeader,
  PageLayout,
} from "@zeron/ui/page-layout";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  defaultMemberDepartmentMembers,
  defaultMemberDepartmentTree,
} from "./member-department-demo-data";
import type {
  MemberDepartmentLabels,
  MemberDepartmentMember,
  MemberDepartmentProps,
  MemberDepartmentStatus,
} from "./member-department-types";

const defaultLabels: MemberDepartmentLabels = {
  ariaLabel: "成员与部门",
  memberTab: "成员",
  departmentTab: "部门",
  departedTab: "已离职成员",
  departmentTree: "部门层级",
  openDepartmentTree: "打开部门层级",
  createDepartment: "新建部门",
  searchPlaceholder: "搜索成员姓名、邮箱或手机号",
  statusFilter: "账号状态",
  createMember: "新增成员",
  name: "姓名",
  functionGroup: "职能组",
  phone: "手机号",
  status: "账号状态",
  department: "部门",
  active: "正常",
  invited: "待激活",
  suspended: "已停用",
  departed: "已离职",
  empty: "没有找到匹配的成员",
};

const statusPresentation: Record<
  MemberDepartmentStatus,
  { status: BadgeStatus; label: keyof Pick<MemberDepartmentLabels, "active" | "invited" | "suspended" | "departed"> }
> = {
  active: { status: "success", label: "active" },
  invited: { status: "info", label: "invited" },
  suspended: { status: "warning", label: "suspended" },
  departed: { status: "neutral", label: "departed" },
};

function memberSearchFilter(
  row: { original: MemberDepartmentMember },
  _columnId: string,
  filterValue: unknown
) {
  const query = String(filterValue ?? "").trim().toLocaleLowerCase();
  if (!query) return true;

  return [
    row.original.name,
    row.original.email,
    row.original.phone,
    row.original.functionGroup,
    row.original.departmentPath.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase()
    .includes(query);
}

function statusFilter(
  row: { getValue: (columnId: string) => unknown },
  columnId: string,
  filterValue: unknown
) {
  return (
    !Array.isArray(filterValue) ||
    filterValue.length === 0 ||
    filterValue.includes(row.getValue(columnId))
  );
}

function findDepartmentByKey(
  nodes: readonly OrganizationNode[],
  key: string
): OrganizationNode | undefined {
  for (const node of nodes) {
    if (node.key === key) return node;
    if (node.type === "department" && node.children) {
      const found = findDepartmentByKey(node.children, key);
      if (found) return found;
    }
  }
}

function descendantDepartmentIds(node: OrganizationNode): readonly string[] {
  if (node.type !== "department") return [];
  return [
    node.departmentId,
    ...(node.children?.flatMap(descendantDepartmentIds) ?? []),
  ];
}

function countMembersInDepartment(
  node: OrganizationNode,
  members: readonly MemberDepartmentMember[]
) {
  const ids = new Set(descendantDepartmentIds(node));
  return members.filter((member) => ids.has(member.departmentId)).length;
}

function MemberIdentity({ member }: { member: MemberDepartmentMember }) {
  const initial = member.name.trim().slice(0, 1).toLocaleUpperCase();
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar shape="rounded" size="default">
        {member.avatarUrl ? <AvatarImage alt="" src={member.avatarUrl} /> : null}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <span className="min-w-0">
        <span className="block truncate text-body font-medium text-fg-default">
          {member.name}
        </span>
        <span className="block truncate text-label text-fg-muted">
          {member.email}
        </span>
      </span>
    </div>
  );
}

function DepartmentTreePanel({
  departments,
  labels,
  members,
  selectedKeys,
  onCreateDepartment,
  onSelectionChange,
}: {
  departments: readonly OrganizationNode[];
  labels: MemberDepartmentLabels;
  members: readonly MemberDepartmentMember[];
  selectedKeys: readonly string[];
  onCreateDepartment?: () => void;
  onSelectionChange: (keys: readonly string[]) => void;
}) {
  const PlusIcon = useIcon("plus");
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-body font-medium text-fg-default">{labels.departmentTree}</h2>
        <Button
          leadingIcon={PlusIcon}
          onClick={onCreateDepartment}
          size="sm"
          type="button"
          variant="tertiary"
        >
          {labels.createDepartment}
        </Button>
      </div>
      <MemberTree
        aria-label={labels.departmentTree}
        className="min-w-0"
        defaultExpandedKeys={["zentrix", "research-and-development"]}
        density="regular"
        items={departments}
        onSelectionChange={(keys) => onSelectionChange(keys)}
        renderTrailing={({ node }) => (
          <span className="text-label tabular-nums text-fg-muted">
            {node.data ? countMembersInDepartment(node.data, members) : 0}
          </span>
        )}
        selectableTypes={["department"]}
        selectedKeys={selectedKeys}
        selectionMode="single"
      />
    </div>
  );
}

/** A reusable, data-driven members workspace composed entirely from Zeron primitives. */
export function MemberDepartment({
  "aria-label": ariaLabel,
  className,
  departments = defaultMemberDepartmentTree,
  isLoading = false,
  labels: providedLabels,
  members = defaultMemberDepartmentMembers,
  onCreateDepartment,
  onCreateMember,
  onDepartmentSelect,
  onMemberOpen,
  ...props
}: MemberDepartmentProps) {
  const SearchIcon = useIcon("search");
  const PlusIcon = useIcon("plus");
  const UsersIcon = useIcon("users");
  const MenuIcon = useIcon("menu");
  const labels = useMemo(
    () => ({ ...defaultLabels, ...providedLabels }),
    [providedLabels]
  );
  const [selectedDepartmentKey, setSelectedDepartmentKey] = useState<string | null>(null);
  const [isDepartmentDrawerOpen, setIsDepartmentDrawerOpen] = useState(false);
  const selectedDepartment = useMemo(
    () => selectedDepartmentKey
      ? findDepartmentByKey(departments, selectedDepartmentKey)
      : undefined,
    [departments, selectedDepartmentKey]
  );
  const scopedDepartmentIds = useMemo(
    () => selectedDepartment ? new Set(descendantDepartmentIds(selectedDepartment)) : null,
    [selectedDepartment]
  );
  const currentMembers = useMemo(
    () => members.filter((member) => member.status !== "departed" && (
      !scopedDepartmentIds || scopedDepartmentIds.has(member.departmentId)
    )),
    [members, scopedDepartmentIds]
  );

  const columns = useMemo<ColumnDef<MemberDepartmentMember, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: labels.name,
        cell: ({ row }) => onMemberOpen ? (
          <button
            aria-label={`${labels.name}: ${row.original.name}`}
            className="block w-full min-w-0 rounded-lg text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"
            onClick={() => onMemberOpen(row.original)}
            type="button"
          >
            <MemberIdentity member={row.original} />
          </button>
        ) : <MemberIdentity member={row.original} />,
        filterFn: memberSearchFilter,
        meta: { label: labels.name },
        size: 300,
      },
      {
        accessorKey: "functionGroup",
        header: labels.functionGroup,
        meta: { label: labels.functionGroup },
        size: 150,
      },
      {
        accessorKey: "phone",
        header: labels.phone,
        cell: ({ row }) => <span className="text-fg-muted">{row.original.phone ?? "—"}</span>,
        meta: { label: labels.phone },
        size: 148,
      },
      {
        accessorKey: "status",
        header: labels.status,
        cell: ({ row }) => {
          const presentation = statusPresentation[row.original.status];
          return <Badge size="sm" status={presentation.status} variant="dot">{labels[presentation.label]}</Badge>;
        },
        filterFn: statusFilter,
        meta: {
          filterIcon: UsersIcon,
          label: labels.statusFilter,
          options: [
            { label: labels.active, value: "active" },
            { label: labels.invited, value: "invited" },
            { label: labels.suspended, value: "suspended" },
          ],
          variant: "multiSelect",
        },
        size: 132,
      },
      {
        id: "department",
        header: labels.department,
        accessorFn: (member) => member.departmentPath.join(" / "),
        cell: ({ row }) => <span className="text-fg-muted">{row.original.departmentPath.join(" / ")}</span>,
        meta: { label: labels.department },
        minSize: 190,
      },
    ],
    [UsersIcon, labels, onMemberOpen]
  );
  const { table } = useDataTable({
    columns,
    data: currentMembers,
    getRowId: (member) => member.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  const nameColumn = table.getColumn("name");
  const statusColumn = table.getColumn("status");

  useEffect(() => {
    table.setPageIndex(0);
  }, [selectedDepartmentKey, table]);

  const handleDepartmentSelection = (keys: readonly string[]) => {
    const key = keys[0] ?? null;
    setSelectedDepartmentKey(key);
    const department = key ? findDepartmentByKey(departments, key) : undefined;
    onDepartmentSelect?.(department?.type === "department" ? department.departmentId : null);
    setIsDepartmentDrawerOpen(false);
  };

  const tree = (
    <DepartmentTreePanel
      departments={departments}
      labels={labels}
      members={members}
      onCreateDepartment={onCreateDepartment}
      onSelectionChange={handleDepartmentSelection}
      selectedKeys={selectedDepartmentKey ? [selectedDepartmentKey] : []}
    />
  );

  return (
    <section
      aria-label={ariaLabel ?? labels.ariaLabel}
      className={cn("h-full min-h-0 w-full", className)}
      {...props}
    >
      <PageLayout gutter="none" size="full">
        <PageContent>
          <PageContentHeader>
            <Tabs color="neutral" defaultValue="members" variant="pill">
              <TabsList>
                <TabItem icon={UsersIcon} label={labels.memberTab} value="members" />
                <TabItem disabled label={labels.departmentTab} value="departments" />
                <TabItem disabled label={labels.departedTab} value="departed" />
              </TabsList>
            </Tabs>
          </PageContentHeader>
          <PageBody className="max-w-none p-3">
            <div className="grid min-h-full min-w-0 grid-cols-1 gap-3 lg:grid-cols-[20rem_minmax(0,1fr)]">
              <aside className="hidden min-w-0 border-r border-border pr-3 lg:block">
                {tree}
              </aside>
              <div className="min-w-0">
                <DataTable
                  className="gap-3 [&_[data-slot=data-table-pagination]]:px-2"
                  emptyMessage={labels.empty}
                  isLoading={isLoading}
                  table={table}
                >
                  <div
                    aria-label={labels.ariaLabel}
                    className="flex min-w-0 flex-wrap items-center justify-between gap-3"
                    role="toolbar"
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                      <Button
                        aria-label={labels.openDepartmentTree}
                        className="lg:hidden"
                        iconOnly
                        onClick={() => setIsDepartmentDrawerOpen(true)}
                        size="md"
                        type="button"
                        variant="tertiary"
                      >
                        <MenuIcon />
                      </Button>
                      <InputGroup className="w-full max-w-[450px]" size="md">
                        <InputGroupAddon className="pr-2">
                          <SearchIcon aria-hidden="true" size={16} strokeWidth={1.5} />
                        </InputGroupAddon>
                        <InputGroupInput
                          aria-label={labels.searchPlaceholder}
                          className="h-full min-h-0"
                          onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
                          placeholder={labels.searchPlaceholder}
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
                    <Button
                      leadingIcon={PlusIcon}
                      onClick={onCreateMember}
                      size="md"
                      type="button"
                      variant="primary"
                    >
                      {labels.createMember}
                    </Button>
                  </div>
                </DataTable>
              </div>
            </div>
          </PageBody>
        </PageContent>
      </PageLayout>
      <MobileDrawer
        ariaLabel={labels.departmentTree}
        onClose={() => setIsDepartmentDrawerOpen(false)}
        open={isDepartmentDrawerOpen}
      >
        {tree}
      </MobileDrawer>
    </section>
  );
}
