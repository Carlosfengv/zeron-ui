"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import Image from "next/image";
import {
  type ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import { useDataTable } from "@zeron/ui/data-table";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zeron/ui/input-group";
import {
  NavItem,
  NavItemContent,
  NavItemLabel,
  NavItemLeading,
  NavItemTrigger,
} from "@zeron/ui/nav-item";
import { NavMenu } from "@zeron/ui/nav-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@zeron/ui/sidebar";
import {
  SidebarIdentityAvatar,
  SidebarIdentityRow,
} from "@zeron/ui/sidebar-identity-row";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zeron/ui/table";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import zlrLogo from "./assets/zlr-logo.svg";

export interface ZlrSite {
  id: string;
  label: string;
}

export interface ZlrProtectionGroup {
  id: string;
  name: string;
  memberCount: number;
  alertCount: number;
  createdAt: string;
}

export type ZlrRowAction = "more";

export interface ZlrListProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  groups?: readonly ZlrProtectionGroup[];
  sites?: readonly ZlrSite[];
  siteId?: string;
  defaultSiteId?: string;
  onSiteChange?: (siteId: string) => void;
  onCreate?: () => void;
  onRowAction?: (group: ZlrProtectionGroup, action: ZlrRowAction) => void;
  onGroupOpen?: (group: ZlrProtectionGroup) => void;
  onNavigate?: (value: string) => void;
}

export const defaultZlrSites: readonly ZlrSite[] = [
  { id: "shanghai", label: "上海生产站点" },
  { id: "guizhou", label: "贵州灾备站点" },
];

export const defaultZlrProtectionGroups: readonly ZlrProtectionGroup[] = [
  { id: "shanghai-core-01", name: "上海核心应用", memberCount: 5, alertCount: 2, createdAt: "2026-07-31 14:03" },
  { id: "shanghai-core-02", name: "上海核心应用", memberCount: 5, alertCount: 2, createdAt: "2026-07-31 14:03" },
  { id: "shanghai-core-03", name: "上海核心应用", memberCount: 5, alertCount: 2, createdAt: "2026-07-31 14:03" },
  { id: "shanghai-core-04", name: "上海核心应用", memberCount: 5, alertCount: 2, createdAt: "2026-07-31 14:03" },
  { id: "shanghai-core-05", name: "上海核心应用", memberCount: 5, alertCount: 2, createdAt: "2026-07-31 14:03" },
  { id: "shanghai-core-06", name: "上海核心应用", memberCount: 5, alertCount: 2, createdAt: "2026-07-31 14:03" },
  { id: "shanghai-core-07", name: "上海核心应用", memberCount: 5, alertCount: 2, createdAt: "2026-07-31 14:03" },
];

type NavigationGroup = {
  label?: string;
  items: readonly { icon: "home" | "list" | "copy" | "shield" | "file" | "check-square" | "bell" | "settings" | "user" | "clock"; label: string; value: string }[];
};

const navigationGroups: readonly NavigationGroup[] = [
  { items: [{ icon: "home", label: "首页", value: "home" }] },
  {
    label: "站点管理",
    items: [
      { icon: "list", label: "站点配对", value: "site-pairing" },
      { icon: "shield", label: "资源映射", value: "resource-mapping" },
      { icon: "copy", label: "复制服务器", value: "replication-servers" },
    ],
  },
  {
    label: "保护",
    items: [
      { icon: "list", label: "保护组", value: "protection-groups" },
      { icon: "check-square", label: "复制任务", value: "replication-tasks" },
      { icon: "file", label: "数据副本", value: "data-copies" },
    ],
  },
  {
    label: "恢复演练",
    items: [
      { icon: "check-square", label: "恢复计划", value: "recovery-plans" },
      { icon: "shield", label: "演练中心", value: "drill-center" },
    ],
  },
  {
    label: "运维管理",
    items: [
      { icon: "bell", label: "告警中心", value: "alerts" },
      { icon: "shield", label: "PRO 健康", value: "pro-health" },
      { icon: "check-square", label: "复制健康", value: "replication-health" },
      { icon: "file", label: "报告", value: "reports" },
    ],
  },
  {
    label: "系统",
    items: [
      { icon: "user", label: "用户角色", value: "user-roles" },
      { icon: "file", label: "审计日志", value: "audit-log" },
      { icon: "shield", label: "许可管理", value: "licenses" },
      { icon: "clock", label: "时间同步", value: "time-sync" },
      { icon: "settings", label: "高级设置", value: "settings" },
    ],
  },
];

function assetSource(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

export function ZlrNavigation({ onNavigate }: { onNavigate?: (value: string) => void }) {
  const Settings = useIcon("settings");
  const { state } = useSidebar();
  const [showExpandButton, setShowExpandButton] = useState(false);
  const isCollapsed = state === "collapsed";
  const iconByName = {
    home: useIcon("home"),
    list: useIcon("list"),
    copy: useIcon("copy"),
    shield: useIcon("shield"),
    file: useIcon("file"),
    "check-square": useIcon("check-square"),
    bell: useIcon("bell"),
    settings: useIcon("settings"),
    user: useIcon("user"),
    clock: useIcon("clock"),
  };

  useEffect(() => {
    if (!isCollapsed) setShowExpandButton(false);
  }, [isCollapsed]);

  return (
    <>
      <SidebarHeader className="px-2 py-2">
        <div className="flex h-8 min-w-0 items-center justify-between gap-2 group-data-[state=collapsed]/sidebar:justify-center">
          {isCollapsed ? (
            <div
              className="size-8 shrink-0"
              onMouseEnter={() => setShowExpandButton(true)}
              onMouseLeave={() => setShowExpandButton(false)}
            >
              {showExpandButton ? (
                <SidebarTrigger
                  aria-label="展开导航"
                  className="size-8 rounded-lg [&_[data-slot=button-background]]:!bg-brand"
                  size="md"
                  variant="primary"
                />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand">
                  <Image alt="ZS Live Recovery" className="size-4" height={16} src={assetSource(zlrLogo)} width={16} />
                </span>
              )}
            </div>
          ) : (
            <>
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand">
                  <Image alt="ZS Live Recovery" className="size-4" height={16} src={assetSource(zlrLogo)} width={16} />
                </span>
                <span className="truncate text-body font-medium text-fg-default">ZS Live Recovery</span>
              </div>
              <SidebarTrigger aria-label="收起导航" className="size-6 shrink-0" size="xs" />
            </>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent contentClassName="gap-3 px-2 py-1">
        {navigationGroups.map((group) => (
          <SidebarGroup key={group.label ?? "home"}>
            {group.label && <SidebarGroupLabel className="px-2 pb-1 text-label">{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <NavMenu activeValue="protection-groups" aria-label={group.label ?? "首页"} keyboardNavigation="roving">
                {group.items.map((item) => {
                  const Icon = iconByName[item.icon];
                  return (
                    <NavItem key={item.value} value={item.value}>
                      <NavItemTrigger
                        render={<button type="button" />}
                        className="h-8 rounded-md px-2 text-body data-[active=true]:bg-active"
                        onClick={() => onNavigate?.(item.value)}
                        tooltip={item.label}
                      >
                        <NavItemLeading><Icon aria-hidden="true" size={16} strokeWidth={1.5} /></NavItemLeading>
                        <NavItemContent><NavItemLabel>{item.label}</NavItemLabel></NavItemContent>
                      </NavItemTrigger>
                    </NavItem>
                  );
                })}
              </NavMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="px-2 py-2">
        <SidebarIdentityRow
          className="group-data-[state=collapsed]/sidebar:justify-center group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-content-row]]:justify-center group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-leading]]:flex-none group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-content]]:hidden group-data-[state=collapsed]/sidebar:[&_[data-slot=sidebar-identity-trailing]]:hidden"
          primary="admin"
          leading={<SidebarIdentityAvatar className="bg-lime-600 text-fg-on-brand">a</SidebarIdentityAvatar>}
          trailing={<Settings aria-hidden="true" size={16} strokeWidth={1.5} />}
          trailingPlacement="edge"
        />
      </SidebarFooter>
    </>
  );
}

/** Protection-group list workspace translated from the ZS Live Recovery Figma view. */
export function ZlrList({
  className,
  groups = defaultZlrProtectionGroups,
  sites = defaultZlrSites,
  siteId,
  defaultSiteId,
  onCreate,
  onGroupOpen,
  onNavigate,
  onRowAction,
  onSiteChange,
  ...props
}: ZlrListProps) {
  const Search = useIcon("search");
  const Site = useIcon("pin");
  const Layers = useIcon("list");
  const More = useIcon("ellipsis");
  const ChevronLeft = useIcon("chevron-left");
  const ChevronRight = useIcon("chevron-right");
  const ChevronsLeft = useIcon("chevrons-left");
  const ChevronsRight = useIcon("chevrons-right");
  const firstSiteId = sites[0]?.id ?? "";
  const [uncontrolledSiteId, setUncontrolledSiteId] = useState(defaultSiteId ?? firstSiteId);
  const resolvedSiteId = siteId ?? uncontrolledSiteId;
  const [tableReady, setTableReady] = useState(false);

  useEffect(() => setTableReady(true), []);

  const columns = useMemo<ColumnDef<ZlrProtectionGroup, unknown>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label="选择本页全部保护组"
            checked={table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false}
            className="size-4 rounded-md"
            onCheckedChange={(checked) => table.toggleAllPageRowsSelected(Boolean(checked))}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`选择${row.original.name}`}
            checked={row.getIsSelected()}
            className="size-4 rounded-md"
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
        enableHiding: false,
        enableSorting: false,
        size: 36,
      },
      {
        accessorKey: "name",
        header: "保护组名称",
        cell: ({ row }) => (
          <div className="flex min-w-[220px] items-center gap-2 text-fg-default">
            <span className="flex size-5 items-center justify-center rounded bg-brand text-fg-on-brand"><Layers aria-hidden="true" size={12} strokeWidth={2} /></span>
            {onGroupOpen ? (
              <button
                className="min-w-0 truncate rounded-sm text-left outline-none transition-colors hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring"
                onClick={() => onGroupOpen(row.original)}
                type="button"
              >
                {row.original.name}
              </button>
            ) : <span>{row.original.name}</span>}
          </div>
        ),
        size: 360,
      },
      { accessorKey: "memberCount", header: "成员数", size: 180 },
      { accessorKey: "alertCount", header: "告警", size: 200 },
      { accessorKey: "createdAt", header: "创建时间", size: 240 },
      {
        id: "actions",
        header: () => <span className="block text-right">操作</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button aria-label={`更多操作：${row.original.name}`} iconOnly onClick={() => onRowAction?.(row.original, "more")} size="sm" variant="tertiary">
              <More aria-hidden="true" size={16} strokeWidth={1.5} />
            </Button>
          </div>
        ),
        enableHiding: false,
        enableSorting: false,
        size: 96,
      },
    ],
    [Layers, More, onGroupOpen, onRowAction]
  );

  const { table } = useDataTable({
    autoResetPageIndex: tableReady,
    columns,
    data: useMemo(() => [...groups], [groups]),
    enableRowSelection: true,
    getRowId: (group) => group.id,
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });
  const nameColumn = table.getColumn("name");
  const currentSite = sites.find((site) => site.id === resolvedSiteId) ?? sites[0];
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);

  const setSite = (nextSiteId: string) => {
    if (siteId === undefined) setUncontrolledSiteId(nextSiteId);
    onSiteChange?.(nextSiteId);
  };

  return (
    <section className={cn("h-full min-h-0 w-full self-start overflow-hidden bg-surface-base", className)} {...props}>
      <SidebarProvider breakpointBehavior="collapse">
        <div className="flex h-full min-h-0 min-w-0 overflow-hidden">
          <Sidebar ariaLabel="ZS Live Recovery 导航" className="relative h-full" collapsible="icon" collapsedWidth="3.5rem" mobileWidth="min(240px, calc(100vw - 24px))" width="240px">
            <ZlrNavigation onNavigate={onNavigate} />
          </Sidebar>
          <main className="min-h-0 min-w-0 flex-1 overflow-hidden py-2 pr-2">
            <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-floating">
              <header className="flex h-12 shrink-0 items-center justify-between border-b border-border-subtle px-3">
                <div className="flex items-center gap-2 text-body font-medium text-fg-default">
                  <Layers aria-hidden="true" size={16} strokeWidth={1.5} />
                  <h1>保护组</h1>
                </div>
                {currentSite && <div className="flex items-center gap-1.5 text-body text-fg-muted"><Site aria-hidden="true" size={16} strokeWidth={1.5} />当前站点：{currentSite.label}</div>}
              </header>
              <Tabs className="contents" onValueChange={setSite} value={resolvedSiteId} variant="pill">
                <div className="shrink-0 border-b border-border-subtle px-3 py-3">
                  <TabsList className="max-w-full gap-2 overflow-x-auto rounded-none bg-transparent p-0">
                    {sites.map((site) => <TabItem className="h-8 rounded-lg px-3 text-body" key={site.id} label={site.label} value={site.id}>{site.label}</TabItem>)}
                  </TabsList>
                </div>
              </Tabs>
              <div className="flex min-h-0 flex-1 flex-col p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <InputGroup className="h-8 max-w-[450px] rounded-lg" size="sm">
                    <InputGroupAddon><Search aria-hidden="true" size={16} strokeWidth={1.5} /></InputGroupAddon>
                    <InputGroupInput aria-label="搜索保护组" onChange={(event) => nameColumn?.setFilterValue(event.target.value)} placeholder="搜索" value={(nameColumn?.getFilterValue() as string) ?? ""} />
                  </InputGroup>
                  <Button className="shrink-0 whitespace-nowrap" onClick={onCreate} size="sm" variant="primary">新建保护组</Button>
                </div>
                <div className="min-w-0 overflow-x-auto rounded-lg border border-border-subtle">
                  <Table className="min-w-[900px]">
                    <TableHeader>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead className="h-9 whitespace-nowrap text-body font-medium text-fg-default" key={header.id} style={{ width: header.getSize() }}>
                              {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows.length ? table.getRowModel().rows.map((row, index) => (
                        <TableRow className="h-[52px] data-[state=selected]:bg-selection" data-state={row.getIsSelected() ? "selected" : undefined} index={index} key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell className="whitespace-nowrap" key={cell.id} style={{ width: cell.column.getSize() }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      )) : (
                        <TableRow><TableCell className="h-32 text-center text-fg-muted" colSpan={columns.length}>暂无保护组</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                <footer className="mt-1 flex min-h-9 items-center justify-end gap-3 px-3 py-1 text-label text-fg-muted">
                  <span>每页行数</span>
                  <Select itemDensity="compact" onValueChange={(value) => table.setPageSize(Number(value))} size="sm" value={`${table.getState().pagination.pageSize}`}>
                    <SelectTrigger aria-label="每页行数" className="h-7 w-[70px] min-w-[70px] rounded-lg px-2 text-body" />
                    <SelectContent>{[10, 20, 30, 40].map((size, index) => <SelectItem index={index} key={size} value={`${size}`}>{size}</SelectItem>)}</SelectContent>
                  </Select>
                  <span>第 {pageIndex + 1} 页，共 {pageCount} 页</span>
                  <div className="flex items-center gap-2">
                    <Button aria-label="首页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.setPageIndex(0)} size="sm" variant="tertiary"><ChevronsLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button>
                    <Button aria-label="上一页" disabled={!table.getCanPreviousPage()} iconOnly onClick={() => table.previousPage()} size="sm" variant="tertiary"><ChevronLeft aria-hidden="true" size={16} strokeWidth={1.5} /></Button>
                    <Button aria-label="下一页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.nextPage()} size="sm" variant="tertiary"><ChevronRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button>
                    <Button aria-label="末页" disabled={!table.getCanNextPage()} iconOnly onClick={() => table.setPageIndex(pageCount - 1)} size="sm" variant="tertiary"><ChevronsRight aria-hidden="true" size={16} strokeWidth={1.5} /></Button>
                  </div>
                </footer>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </section>
  );
}
