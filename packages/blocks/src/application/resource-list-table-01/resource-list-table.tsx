"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useMemo,
} from "react";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import {
  DataTable,
  DataTableFacetedFilter,
  useDataTable,
} from "@zeron/ui/data-table";
import {
  InfoItem,
  InfoItemContent,
  InfoItemDescription,
  InfoItemLeading,
  InfoItemTitle,
} from "@zeron/ui/info-item";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zeron/ui/input-group";
import {
  type IconName,
  useIcon,
} from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";

export type ResourceListStatus = "enabled" | "draft";

export interface ResourceListItem {
  /** Stable identifier used for row selection and React rendering. */
  id: string;
  name: string;
  description: string;
  status: ResourceListStatus;
  version: string;
  type: string;
  failurePolicy: string;
  /** Uses an icon that is already provided by the Zeron icon system. */
  iconName?: IconName;
}

export interface ResourceListTableLabels {
  ariaLabel: string;
  toolbarAriaLabel: string;
  bulkToolbarAriaLabel: string;
  selectAll: string;
  selectResource: string;
  selectedCount: (count: number) => string;
  clearSelection: string;
  searchPlaceholder: string;
  statusFilter: string;
  refresh: string;
  create: string;
  name: string;
  identifier: string;
  status: string;
  version: string;
  type: string;
  failurePolicy: string;
  actions: string;
  edit: string;
  enabled: string;
  draft: string;
  empty: string;
}

export interface ResourceListTableBulkActionContext {
  selectedResources: readonly ResourceListItem[];
  selectedCount: number;
  clearSelection: () => void;
}

export interface ResourceListTableProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  /** Replaces the complete inventory without changing the table composition. */
  resources?: readonly ResourceListItem[];
  /** Overrides the block-specific copy for localization or domain wording. */
  labels?: Partial<ResourceListTableLabels>;
  /** Optional content rendered after the standard toolbar actions. */
  toolbarTrailing?: ReactNode;
  /** Replaces the standard toolbar while one or more rows are selected. */
  renderBulkActions?: (
    context: ResourceListTableBulkActionContext
  ) => ReactNode;
  onCreate?: () => void;
  onEdit?: (resource: ResourceListItem) => void;
  onRefresh?: () => void;
}

const defaultLabels: ResourceListTableLabels = {
  ariaLabel: "资源列表",
  toolbarAriaLabel: "资源列表操作",
  bulkToolbarAriaLabel: "资源批量操作",
  selectAll: "选择本页全部资源",
  selectResource: "选择",
  selectedCount: (count) => `已选择 ${count} 项`,
  clearSelection: "取消选择",
  searchPlaceholder: "搜索",
  statusFilter: "服务状态",
  refresh: "刷新",
  create: "新增脚本",
  name: "名称",
  identifier: "标识ID",
  status: "状态",
  version: "版本",
  type: "类型",
  failurePolicy: "失败策略",
  actions: "操作",
  edit: "编辑",
  enabled: "已启用",
  draft: "草稿",
  empty: "暂无资源",
};

export const defaultResourceListItems = [
  {
    id: "platform.mn.basic",
    name: "平台基础信息",
    description: "描述信息.获取平台的基本信息",
    status: "enabled",
    version: "0.2.3",
    type: "计算",
    failurePolicy: "失败后继续并记录异常",
    iconName: "brain",
  },
  {
    id: "platform.mn.config",
    name: "平台配置巡检",
    description: "platform.mn.config",
    status: "enabled",
    version: "0.2.3",
    type: "计算",
    failurePolicy: "失败后继续并记录异常",
    iconName: "brain",
  },
  {
    id: "platform.mn.load",
    name: "平台负载巡检",
    description: "platform.mn.load",
    status: "draft",
    version: "0.2.3",
    type: "计算",
    failurePolicy: "失败后继续并记录异常",
    iconName: "brain",
  },
  {
    id: "platform.mn.resource",
    name: "平台资源巡检",
    description: "描述信息.获取平台的基本信息",
    status: "enabled",
    version: "0.2.3",
    type: "计算",
    failurePolicy: "失败后继续并记录异常",
    iconName: "brain",
  },
  {
    id: "platform.mn.database",
    name: "数据库连接检查",
    description: "验证生产环境数据库的连接与权限状态",
    status: "enabled",
    version: "0.3.1",
    type: "检查",
    failurePolicy: "失败后重试并记录异常",
    iconName: "shield",
  },
  {
    id: "platform.mn.cache",
    name: "缓存命中率统计",
    description: "采集核心缓存的命中率与容量数据",
    status: "draft",
    version: "0.3.0",
    type: "计算",
    failurePolicy: "失败后继续并记录异常",
    iconName: "star",
  },
  {
    id: "platform.mn.audit",
    name: "访问审计汇总",
    description: "按日汇总管理后台的访问审计记录",
    status: "enabled",
    version: "1.1.0",
    type: "同步",
    failurePolicy: "失败后中止任务",
    iconName: "file-text",
  },
  {
    id: "platform.mn.backup",
    name: "备份完整性验证",
    description: "检查最近一次备份是否可用且数据完整",
    status: "draft",
    version: "0.4.2",
    type: "检查",
    failurePolicy: "失败后通知负责人",
    iconName: "check-square",
  },
  {
    id: "platform.mn.queue",
    name: "异步队列积压监控",
    description: "监控任务队列深度与最长等待时间",
    status: "enabled",
    version: "1.0.4",
    type: "监控",
    failurePolicy: "失败后继续并记录异常",
    iconName: "list-checks",
  },
  {
    id: "platform.mn.schedule",
    name: "定时任务巡检",
    description: "核验关键定时任务的执行结果与延迟",
    status: "enabled",
    version: "0.8.6",
    type: "检查",
    failurePolicy: "失败后重试并记录异常",
    iconName: "calendar",
  },
  {
    id: "platform.mn.notification",
    name: "通知通道健康度",
    description: "确认邮件与站内通知通道可正常投递",
    status: "draft",
    version: "0.6.0",
    type: "监控",
    failurePolicy: "失败后通知负责人",
    iconName: "bell",
  },
  {
    id: "platform.mn.members",
    name: "成员目录同步",
    description: "同步组织成员、角色与目录归属信息",
    status: "enabled",
    version: "1.2.0",
    type: "同步",
    failurePolicy: "失败后中止任务",
    iconName: "users",
  },
] as const satisfies readonly ResourceListItem[];

const statusPresentation: Record<
  ResourceListStatus,
  { badgeStatus: BadgeStatus; className: string }
> = {
  enabled: { badgeStatus: "info", className: "bg-info-surface" },
  draft: {
    badgeStatus: "neutral",
    className: "bg-neutral-status-surface",
  },
};

function ResourceLeading({ iconName }: { iconName: IconName }) {
  const Icon = useIcon(iconName);

  return (
    <InfoItemLeading className="bg-info-surface text-fg-brand">
      <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
    </InfoItemLeading>
  );
}

function ResourceIdentity({ resource }: { resource: ResourceListItem }) {
  return (
    <InfoItem className="gap-2.5 p-0">
      <ResourceLeading iconName={resource.iconName ?? "brain"} />
      <InfoItemContent>
        <InfoItemTitle className="truncate">{resource.name}</InfoItemTitle>
        <InfoItemDescription className="truncate">
          {resource.description}
        </InfoItemDescription>
      </InfoItemContent>
    </InfoItem>
  );
}

function resourceSearchFilter(
  row: { original: ResourceListItem },
  _columnId: string,
  filterValue: unknown
) {
  const query = String(filterValue ?? "").trim().toLocaleLowerCase();
  if (!query) return true;

  return [row.original.name, row.original.description, row.original.id]
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

/** A searchable, selectable resource inventory composed from existing Zeron UI primitives. */
export function ResourceListTable({
  "aria-label": ariaLabel,
  className,
  labels: providedLabels,
  onCreate,
  onEdit,
  onRefresh,
  renderBulkActions,
  resources = defaultResourceListItems,
  toolbarTrailing,
  ...props
}: ResourceListTableProps) {
  const SearchIcon = useIcon("search");
  const RefreshIcon = useIcon("rotate-ccw");
  const PlusIcon = useIcon("plus");
  const StatusIcon = useIcon("dot");
  const XIcon = useIcon("x");
  const labels = useMemo(
    () => ({ ...defaultLabels, ...providedLabels }),
    [providedLabels]
  );

  const columns = useMemo<ColumnDef<ResourceListItem, unknown>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label={labels.selectAll}
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(checked) =>
              table.toggleAllPageRowsSelected(Boolean(checked))
            }
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            aria-label={`${labels.selectResource}${row.original.name}`}
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
        enableHiding: false,
        enableSorting: false,
        size: 52,
      },
      {
        accessorKey: "name",
        header: labels.name,
        cell: ({ row }) => <ResourceIdentity resource={row.original} />,
        filterFn: resourceSearchFilter,
        meta: { label: labels.name },
        size: 287,
      },
      {
        accessorKey: "id",
        header: labels.identifier,
        cell: ({ row }) => (
          <code className="font-mono text-body text-fg-muted">
            {row.original.id}
          </code>
        ),
        meta: { label: labels.identifier },
        size: 240,
      },
      {
        accessorKey: "status",
        header: labels.status,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge
              className={statusPresentation[status].className}
              size="sm"
              status={statusPresentation[status].badgeStatus}
              variant="dot"
            >
              {labels[status]}
            </Badge>
          );
        },
        filterFn: statusFilter,
        meta: {
          filterIcon: StatusIcon,
          label: labels.statusFilter,
          options: [
            { label: labels.enabled, value: "enabled" },
            { label: labels.draft, value: "draft" },
          ],
          variant: "multiSelect",
        },
        size: 120,
      },
      {
        accessorKey: "version",
        header: labels.version,
        meta: { label: labels.version },
        size: 120,
      },
      {
        accessorKey: "type",
        header: labels.type,
        meta: { label: labels.type },
        size: 120,
      },
      {
        accessorKey: "failurePolicy",
        header: labels.failurePolicy,
        meta: { label: labels.failurePolicy },
        minSize: 220,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">{labels.actions}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              aria-label={`${labels.edit}${row.original.name}`}
              className="px-2 text-fg-brand underline underline-offset-2"
              onClick={() => onEdit?.(row.original)}
              size="sm"
              variant="ghost"
            >
              {labels.edit}
            </Button>
          </div>
        ),
        enableHiding: false,
        enableSorting: false,
        size: 120,
      },
    ],
    [StatusIcon, labels, onEdit]
  );
  const data = useMemo(() => [...resources], [resources]);

  const { table } = useDataTable({
    columns,
    data,
    enableRowSelection: true,
    getRowId: (resource) => resource.id,
    initialState: {
      columnPinning: { left: ["select", "name"], right: ["actions"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });
  const nameColumn = table.getColumn("name");
  const statusColumn = table.getColumn("status");
  const selectedResources = table
    .getSelectedRowModel()
    .flatRows.map((row) => row.original);
  const selectedCount = selectedResources.length;
  const showBulkToolbar = selectedCount > 0 && Boolean(renderBulkActions);
  const clearSelection = () => table.resetRowSelection();

  return (
    <section
      aria-label={ariaLabel ?? labels.ariaLabel}
      className={cn(
        "mx-auto w-full max-w-[1620px] rounded-xl border-[0.5px] border-border bg-surface-floating p-3",
        className
      )}
      {...props}
    >
      <DataTable
        className="gap-2.5 [&_[data-slot=data-table-pagination]]:px-2"
        emptyMessage={labels.empty}
        table={table}
      >
        <div
          aria-label={
            showBulkToolbar
              ? labels.bulkToolbarAriaLabel
              : labels.toolbarAriaLabel
          }
          className="flex min-h-control-md min-w-0 flex-wrap items-center justify-between gap-2"
          role="toolbar"
        >
          {showBulkToolbar ? (
            <>
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <span
                  aria-live="polite"
                  className="whitespace-nowrap text-body font-medium text-fg-default"
                >
                  {labels.selectedCount(selectedCount)}
                </span>
                <Button
                  leadingIcon={XIcon}
                  onClick={clearSelection}
                  size="md"
                  variant="ghost"
                >
                  {labels.clearSelection}
                </Button>
              </div>
              <div
                className="flex shrink-0 flex-wrap items-center justify-end gap-2"
                data-slot="resource-list-bulk-actions"
              >
                {renderBulkActions?.({
                  clearSelection,
                  selectedCount,
                  selectedResources,
                })}
              </div>
            </>
          ) : (
            <>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                <InputGroup size="sm" className="w-full max-w-[450px] border-border hover:border-border">
                  <InputGroupAddon className="pr-2">
                    <SearchIcon aria-hidden="true" size={16} strokeWidth={1.5} />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label={labels.searchPlaceholder}
                    className="h-full min-h-0"
                    onChange={(event) =>
                      nameColumn?.setFilterValue(event.target.value)
                    }
                    placeholder={labels.searchPlaceholder}
                    value={(nameColumn?.getFilterValue() as string) ?? ""}
                  />
                </InputGroup>
                {statusColumn && (
                  <DataTableFacetedFilter
                    column={statusColumn}
                    icon={statusColumn.columnDef.meta?.filterIcon}
                    multiple
                    options={statusColumn.columnDef.meta?.options ?? []}
                    title={labels.statusFilter}
                  />
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  aria-label={labels.refresh}
                  onClick={onRefresh}
                  iconOnly
                  size="sm"
                  variant="tertiary"
                >
                  <RefreshIcon />
                </Button>
                <Button
                  leadingIcon={PlusIcon}
                  onClick={onCreate}
                  size="md"
                  variant="primary"
                >
                  {labels.create}
                </Button>
                {toolbarTrailing}
              </div>
            </>
          )}
        </div>
      </DataTable>
    </section>
  );
}
