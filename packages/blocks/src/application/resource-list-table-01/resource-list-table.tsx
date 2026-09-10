"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  functionalUpdate,
  type SortingState,
} from "@tanstack/react-table";
import bytedance from "@thesvg/icons/bytedance";
import canva from "@thesvg/icons/canva";
import chrome from "@thesvg/icons/chrome";
import confluence from "@thesvg/icons/confluence";
import dropbox from "@thesvg/icons/dropbox";
import figma from "@thesvg/icons/figma";
import github from "@thesvg/icons/github";
import gitlab from "@thesvg/icons/gitlab";
import googleCloud from "@thesvg/icons/google-cloud";
import googleSlides from "@thesvg/icons/google-slides";
import hubspot from "@thesvg/icons/hubspot";
import jira from "@thesvg/icons/jira";
import linear from "@thesvg/icons/linear";
import microsoftDynamicsSales from "@thesvg/icons/microsoft-dynamics-365-sales";
import microsoftWord from "@thesvg/icons/microsoft-word";
import notion from "@thesvg/icons/notion";
import salesforce from "@thesvg/icons/salesforce";
import shopify from "@thesvg/icons/shopify";
import slack from "@thesvg/icons/slack";
import stripe from "@thesvg/icons/stripe";
import tencent from "@thesvg/icons/tencent";
import wechat from "@thesvg/icons/wechat";
import zoom from "@thesvg/icons/zoom";
import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
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
  InfoItemTrailing,
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
export type ResourceListTablePreset = "resource" | "mcp" | "category";
export type ResourceListBrandIcon =
  | "bytedance"
  | "canva"
  | "chrome"
  | "confluence"
  | "dropbox"
  | "figma"
  | "github"
  | "gitlab"
  | "google-cloud"
  | "google-slides"
  | "hubspot"
  | "jira"
  | "linear"
  | "microsoft-dynamics-sales"
  | "microsoft-word"
  | "notion"
  | "salesforce"
  | "shopify"
  | "slack"
  | "stripe"
  | "tencent"
  | "wechat"
  | "zoom";

export interface ResourceListItem {
  /** Stable identifier used for row selection and React rendering. */
  id: string;
  name: string;
  description: string;
  status: ResourceListStatus;
  version?: string;
  type?: string;
  failurePolicy?: string;
  /** Stable category relation. Prefer this over matching the localized label. */
  categoryId?: string;
  /** Localized category label shown in the MCP table. */
  category?: string;
  visibility?: string;
  itemCount?: number;
  /** Uses a brand mark supplied by the existing @thesvg/icons dependency. */
  brandIcon?: ResourceListBrandIcon;
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
  category: string;
  categoryFilter: string;
  visibility: string;
  itemCount: string;
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

export interface ResourceListTableQueryState {
  search: string;
  statuses: readonly ResourceListStatus[];
  categoryIds?: readonly string[];
  sorting?: SortingState;
  pageIndex: number;
  pageSize: number;
}

export interface ResourceListTableProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  /** Replaces the complete inventory without changing the table composition. */
  resources?: readonly ResourceListItem[];
  /** Shows the DataTable skeleton while data is being requested. */
  isLoading?: boolean;
  /** Message announced to assistive technology while data is loading. */
  loadingMessage?: ReactNode;
  /** Replaces the standard empty state. It can also represent a load error. */
  emptyState?: ReactNode;
  /** Overrides the block-specific copy for localization or domain wording. */
  labels?: Partial<ResourceListTableLabels>;
  /** Optional content rendered after the standard toolbar actions. */
  toolbarTrailing?: ReactNode;
  /** Controls whether the block owns a framed surface or inherits its page surface. */
  surface?: "framed" | "plain";
  /** Selects the existing table composition for resources, MCP apps, or categories. */
  preset?: ResourceListTablePreset;
  /** Keeps the create action in the block unless the surrounding page owns it. */
  showCreateAction?: boolean;
  /** Controls the standard refresh action independently from its handler. */
  showRefreshAction?: boolean;
  /** Enables controlled server-side search, filtering, and pagination. */
  queryState?: ResourceListTableQueryState;
  /** Total number of server-side matches when queryState is controlled. */
  totalRowCount?: number;
  onQueryStateChange?: (queryState: ResourceListTableQueryState) => void;
  /** Highlights the active row for master-detail compositions. */
  activeRowId?: string | null;
  /** Activates a resource row without taking over nested controls. */
  onRowActivate?: (resource: ResourceListItem) => void;
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
  category: "分类",
  categoryFilter: "分类",
  visibility: "可见范围",
  itemCount: "MCP 数量",
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

const defaultMcpCategoryIdByName = {
  办公协同: "collaboration",
  代码开发: "developer-tools",
  创意设计: "content",
  销售: "sales",
} as const;

export const defaultMcpResourceListItems = ([
  {
    id: "feishu-suite",
    name: "飞书套件",
    description: "飞书/Lark 全能套件，覆盖消息、文档、表格、日历、任务与 Wiki",
    status: "enabled",
    category: "办公协同",
    visibility: "所有用户",
    brandIcon: "bytedance",
    iconName: "message-circle",
  },
  {
    id: "tencent-docs",
    name: "腾讯文档",
    description: "在线创建、编辑和管理文档、表格与演示内容",
    status: "enabled",
    category: "办公协同",
    visibility: "所有用户",
    brandIcon: "tencent",
    iconName: "file-text",
  },
  {
    id: "wechat-work",
    name: "企业微信套件",
    description: "连接客户、群聊、日程、会议与通讯录等企业协作能力",
    status: "enabled",
    category: "办公协同",
    visibility: "所有用户",
    brandIcon: "wechat",
    iconName: "users",
  },
  {
    id: "slack",
    name: "Slack",
    description: "连接频道、消息和工作流，协助团队同步项目进展",
    status: "enabled",
    category: "办公协同",
    visibility: "组织成员",
    brandIcon: "slack",
    iconName: "message-circle",
  },
  {
    id: "notion",
    name: "Notion",
    description: "检索团队知识库并创建、更新页面和数据库内容",
    status: "enabled",
    category: "办公协同",
    visibility: "组织成员",
    brandIcon: "notion",
    iconName: "file-text",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "创建视频会议、查询日程并整理会议记录",
    status: "draft",
    category: "办公协同",
    visibility: "组织成员",
    brandIcon: "zoom",
    iconName: "calendar",
  },
  {
    id: "confluence",
    name: "Confluence",
    description: "检索公司的项目文档、规范与团队知识库",
    status: "enabled",
    category: "办公协同",
    visibility: "所有用户",
    brandIcon: "confluence",
    iconName: "file-text",
  },
  {
    id: "web-access",
    name: "Web Access（浏览器自动化）",
    description: "连接浏览器并执行网页检索、登录态操作与批量任务",
    status: "enabled",
    category: "代码开发",
    visibility: "所有用户",
    brandIcon: "chrome",
    iconName: "globe",
  },
  {
    id: "gitlab",
    name: "GitLab",
    description: "查询代码仓库、合并请求、流水线和发布状态",
    status: "enabled",
    category: "代码开发",
    visibility: "所有用户",
    brandIcon: "gitlab",
    iconName: "square-library",
  },
  {
    id: "github",
    name: "GitHub",
    description: "管理仓库、Issue、Pull Request 与代码评审流程",
    status: "enabled",
    category: "代码开发",
    visibility: "组织成员",
    brandIcon: "github",
    iconName: "square-library",
  },
  {
    id: "jira",
    name: "Jira",
    description: "查询和更新研发任务、迭代计划与缺陷状态",
    status: "enabled",
    category: "代码开发",
    visibility: "所有用户",
    brandIcon: "jira",
    iconName: "list-checks",
  },
  {
    id: "linear",
    name: "Linear",
    description: "管理产品需求、开发任务和团队项目进度",
    status: "draft",
    category: "代码开发",
    visibility: "组织成员",
    brandIcon: "linear",
    iconName: "list-checks",
  },
  {
    id: "google-cloud",
    name: "Google Cloud",
    description: "查询云资源、日志、告警和服务运行状态",
    status: "enabled",
    category: "代码开发",
    visibility: "管理员",
    brandIcon: "google-cloud",
    iconName: "globe",
  },
  {
    id: "figma",
    name: "Figma",
    description: "读取设计稿、组件变量和页面结构并辅助设计交付",
    status: "enabled",
    category: "创意设计",
    visibility: "所有用户",
    brandIcon: "figma",
    iconName: "pencil",
  },
  {
    id: "canva",
    name: "Canva",
    description: "创建并管理社交媒体、演示和营销视觉内容",
    status: "enabled",
    category: "创意设计",
    visibility: "组织成员",
    brandIcon: "canva",
    iconName: "pencil",
  },
  {
    id: "word-generator",
    name: "Word 文档生成",
    description: "生成、排版并导出规范化 Word 文档",
    status: "enabled",
    category: "创意设计",
    visibility: "组织成员",
    brandIcon: "microsoft-word",
    iconName: "file-text",
  },
  {
    id: "google-slides",
    name: "Google Slides",
    description: "生成和编辑在线演示文稿、版式与演讲备注",
    status: "draft",
    category: "创意设计",
    visibility: "组织成员",
    brandIcon: "google-slides",
    iconName: "file-text",
  },
  {
    id: "dropbox",
    name: "Dropbox",
    description: "检索、整理和共享团队创意资产与交付文件",
    status: "enabled",
    category: "创意设计",
    visibility: "所有用户",
    brandIcon: "dropbox",
    iconName: "folder",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "查询客户、联系人、商机和销售活动记录",
    status: "enabled",
    category: "销售",
    visibility: "所有用户",
    brandIcon: "salesforce",
    iconName: "users",
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "管理线索、营销活动、客户跟进和销售管道",
    status: "enabled",
    category: "销售",
    visibility: "组织成员",
    brandIcon: "hubspot",
    iconName: "users",
  },
  {
    id: "shopify",
    name: "Shopify",
    description: "查询商品、客户、订单和在线商店经营数据",
    status: "enabled",
    category: "销售",
    visibility: "组织成员",
    brandIcon: "shopify",
    iconName: "square-library",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "查询支付、订阅、发票和客户交易状态",
    status: "draft",
    category: "销售",
    visibility: "管理员",
    brandIcon: "stripe",
    iconName: "shield",
  },
  {
    id: "dynamics-sales",
    name: "Dynamics 365 Sales",
    description: "管理企业客户关系、销售预测和商机协作流程",
    status: "enabled",
    category: "销售",
    visibility: "组织成员",
    brandIcon: "microsoft-dynamics-sales",
    iconName: "users",
  },
] as const).map((resource) => ({
  ...resource,
  categoryId: defaultMcpCategoryIdByName[resource.category],
})) satisfies readonly ResourceListItem[];

export const defaultMcpCategoryItems = [
  {
    id: "collaboration",
    name: "办公协同",
    description: "消息、文档、日历与企业协作工具",
    status: "enabled",
    visibility: "所有用户",
    itemCount: 7,
    iconName: "users",
  },
  {
    id: "developer-tools",
    name: "代码开发",
    description: "代码、浏览器自动化与研发流程能力",
    status: "enabled",
    visibility: "所有用户",
    itemCount: 6,
    iconName: "square-library",
  },
  {
    id: "content",
    name: "创意设计",
    description: "文档生成、编辑和多媒体内容处理",
    status: "enabled",
    visibility: "组织成员",
    itemCount: 5,
    iconName: "pencil",
  },
  {
    id: "sales",
    name: "销售",
    description: "客户沟通、销售协作与商机管理工具",
    status: "enabled",
    visibility: "组织成员",
    itemCount: 5,
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

const resourceBrandIcons = {
  bytedance,
  canva,
  chrome,
  confluence,
  dropbox,
  figma,
  github,
  gitlab,
  "google-cloud": googleCloud,
  "google-slides": googleSlides,
  hubspot,
  jira,
  linear,
  "microsoft-dynamics-sales": microsoftDynamicsSales,
  "microsoft-word": microsoftWord,
  notion,
  salesforce,
  shopify,
  slack,
  stripe,
  tencent,
  wechat,
  zoom,
} satisfies Record<ResourceListBrandIcon, { svg: string }>;

function ResourceLeading({ resource }: { resource: ResourceListItem }) {
  const Icon = useIcon(resource.iconName ?? "brain");
  const brandIcon = resource.brandIcon
    ? resourceBrandIcons[resource.brandIcon]
    : undefined;

  return (
    <InfoItemLeading className="border-[0.5px] border-border bg-surface-overlay text-fg-brand">
      {brandIcon ? (
        <span
          aria-hidden
          className="[&>svg]:block [&>svg]:size-5"
          dangerouslySetInnerHTML={{ __html: brandIcon.svg }}
        />
      ) : (
        <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
      )}
    </InfoItemLeading>
  );
}

export function ResourceListItemIdentity({
  resource,
  showDescription = true,
  trailing,
}: {
  resource: ResourceListItem;
  showDescription?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <InfoItem className="gap-2.5 p-0">
      <ResourceLeading resource={resource} />
      <InfoItemContent>
        <InfoItemTitle className="truncate">{resource.name}</InfoItemTitle>
        {showDescription ? (
          <InfoItemDescription className="truncate">
            {resource.description}
          </InfoItemDescription>
        ) : null}
      </InfoItemContent>
      {trailing ? <InfoItemTrailing>{trailing}</InfoItemTrailing> : null}
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
  activeRowId,
  className,
  emptyState,
  isLoading = false,
  labels: providedLabels,
  loadingMessage,
  onCreate,
  onEdit,
  onQueryStateChange,
  onRefresh,
  onRowActivate,
  queryState,
  renderBulkActions,
  resources = [],
  preset = "resource",
  showCreateAction = true,
  showRefreshAction = true,
  surface = "framed",
  totalRowCount,
  toolbarTrailing,
  ...props
}: ResourceListTableProps) {
  const SearchIcon = useIcon("search");
  const RefreshIcon = useIcon("rotate-ccw");
  const PlusIcon = useIcon("plus");
  const StatusIcon = useIcon("dot");
  const CategoryIcon = useIcon("folder");
  const XIcon = useIcon("x");
  const labels = useMemo(
    () => ({ ...defaultLabels, ...providedLabels }),
    [providedLabels]
  );

  const columns = useMemo<ColumnDef<ResourceListItem, unknown>[]>(() => {
    const nameColumn: ColumnDef<ResourceListItem, unknown> = {
      accessorKey: "name",
      header: labels.name,
      cell: ({ row }) => (
        <ResourceListItemIdentity
          resource={row.original}
          showDescription={preset !== "category"}
        />
      ),
      filterFn: resourceSearchFilter,
      meta: { label: labels.name },
    };
    const statusColumn: ColumnDef<ResourceListItem, unknown> = {
      accessorKey: "status",
      header: labels.status,
      cell: ({ row }) => {
        const status = row.original.status;
        return preset === "resource" ? (
          <Badge
            className={statusPresentation[status].className}
            size="sm"
            status={statusPresentation[status].badgeStatus}
            variant="dot"
          >
            {labels[status]}
          </Badge>
        ) : (
          <Badge
            color={status === "enabled" ? "blue" : "gray"}
            size="sm"
            variant="strong"
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
    };

    if (preset === "mcp") {
      const categoryOptions = Array.from(
        new Map(
          resources.flatMap((resource) => {
            const value = resource.categoryId ?? resource.category;
            if (!value) return [];
            return [
              [
                value,
                { label: resource.category ?? value, value },
              ] as const,
            ];
          })
        ).values()
      );

      return [
        nameColumn,
        {
          accessorFn: (resource) => resource.categoryId ?? resource.category,
          id: "category",
          header: labels.category,
          cell: ({ row }) =>
            row.original.category ?? row.original.categoryId ?? "—",
          filterFn: statusFilter,
          meta: {
            filterIcon: CategoryIcon,
            label: labels.categoryFilter,
            options: categoryOptions,
            variant: "multiSelect",
          },
        },
        statusColumn,
        {
          accessorKey: "visibility",
          header: labels.visibility,
          meta: { label: labels.visibility },
        },
      ];
    }

    if (preset === "category") {
      return [
        nameColumn,
        {
          accessorKey: "itemCount",
          header: labels.itemCount,
          meta: { label: labels.itemCount },
        },
      ];
    }

    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            aria-label={labels.selectAll}
            className="mx-auto"
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
            className="mx-auto"
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(Boolean(checked))}
          />
        ),
        enableHiding: false,
        enableSorting: false,
        maxSize: 44,
        minSize: 44,
        size: 44,
      },
      nameColumn,
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
      statusColumn,
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
              disabled={!onEdit}
              onClick={() => onEdit?.(row.original)}
              size="sm"
              variant="tertiary"
            >
              {labels.edit}
            </Button>
          </div>
        ),
        enableHiding: false,
        enableSorting: false,
        size: 120,
      },
    ];
  }, [CategoryIcon, StatusIcon, labels, onEdit, preset, resources]);
  const data = useMemo(() => [...resources], [resources]);
  const controlledColumnFilters = useMemo<ColumnFiltersState | undefined>(() => {
    if (!queryState) return undefined;

    const filters: ColumnFiltersState = [];
    if (queryState.search) filters.push({ id: "name", value: queryState.search });
    if (queryState.categoryIds?.length) {
      filters.push({ id: "category", value: [...queryState.categoryIds] });
    }
    if (queryState.statuses.length > 0) {
      filters.push({ id: "status", value: [...queryState.statuses] });
    }
    return filters;
  }, [queryState]);
  const controlledSorting = useMemo<SortingState | undefined>(
    () => (queryState ? [...(queryState.sorting ?? [])] : undefined),
    [queryState]
  );
  const [isTableMounted, setIsTableMounted] = useState(false);

  useEffect(() => {
    setIsTableMounted(true);
  }, []);

  const { table } = useDataTable({
    autoResetPageIndex: queryState ? false : isTableMounted,
    columns,
    data,
    enableRowSelection: preset === "resource",
    getRowId: (resource) => resource.id,
    initialState: {
      columnPinning:
        preset === "resource"
          ? { left: ["select", "name"], right: ["actions"] }
          : { left: ["name"] },
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    manualFiltering: Boolean(queryState),
    manualPagination: Boolean(queryState),
    manualSorting: Boolean(queryState),
    onColumnFiltersChange:
      queryState && onQueryStateChange
        ? (updater) => {
            const nextFilters = functionalUpdate(
              updater,
              controlledColumnFilters ?? []
            );
            const search =
              (nextFilters.find((filter) => filter.id === "name")
                ?.value as string | undefined) ?? "";
            const statuses =
              (nextFilters.find((filter) => filter.id === "status")
                ?.value as ResourceListStatus[] | undefined) ?? [];
            const categoryIds =
              (nextFilters.find((filter) => filter.id === "category")
                ?.value as string[] | undefined) ?? [];

            onQueryStateChange({
              ...queryState,
              categoryIds,
              pageIndex: 0,
              search,
              statuses,
            });
          }
        : undefined,
    onPaginationChange:
      queryState && onQueryStateChange
        ? (updater) => {
            const nextPagination = functionalUpdate(updater, {
              pageIndex: queryState.pageIndex,
              pageSize: queryState.pageSize,
            });
            onQueryStateChange({ ...queryState, ...nextPagination });
          }
        : undefined,
    onSortingChange:
      queryState && onQueryStateChange
        ? (updater) => {
            const sorting = functionalUpdate(
              updater,
              controlledSorting ?? []
            );
            onQueryStateChange({
              ...queryState,
              pageIndex: 0,
              sorting,
            });
          }
        : undefined,
    rowCount: queryState ? (totalRowCount ?? resources.length) : undefined,
    state: queryState
      ? {
          columnFilters: controlledColumnFilters,
          pagination: {
            pageIndex: queryState.pageIndex,
            pageSize: queryState.pageSize,
          },
          sorting: controlledSorting,
        }
      : undefined,
  });
  const nameColumn = table.getColumn("name");
  const categoryColumn = table
    .getAllLeafColumns()
    .find((column) => column.id === "category");
  const statusColumn = table
    .getAllLeafColumns()
    .find((column) => column.id === "status");
  const selectedResources = table
    .getSelectedRowModel()
    .flatRows.map((row) => row.original);
  const selectedCount = selectedResources.length;
  const showBulkToolbar =
    preset === "resource" && selectedCount > 0 && Boolean(renderBulkActions);
  const clearSelection = () => table.resetRowSelection();

  return (
    <section
      aria-label={ariaLabel ?? labels.ariaLabel}
      className={cn(
        surface === "framed"
          ? "mx-auto w-full max-w-screen-2xl rounded-xl border border-border bg-surface-floating p-3"
          : "min-w-0 w-full",
        className
      )}
      {...props}
    >
      <DataTable
        activeRowId={activeRowId}
        className="gap-2.5"
        emptyMessage={labels.empty}
        emptyState={emptyState}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        onRowActivate={
          onRowActivate ? (row) => onRowActivate(row.original) : undefined
        }
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
                <InputGroup
                  className="w-full max-w-md border-border hover:border-border"
                  size="md"
                >
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
                {preset === "mcp" && categoryColumn && (
                  <DataTableFacetedFilter
                    column={categoryColumn}
                    icon={categoryColumn.columnDef.meta?.filterIcon}
                    multiple
                    options={categoryColumn.columnDef.meta?.options ?? []}
                    title={labels.categoryFilter}
                  />
                )}
                {preset !== "category" && statusColumn && (
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
                {showRefreshAction && (
                  <Button
                    aria-label={labels.refresh}
                    disabled={!onRefresh}
                    onClick={onRefresh}
                    iconOnly
                    size="md"
                    variant="tertiary"
                  >
                    <RefreshIcon />
                  </Button>
                )}
                {showCreateAction && (
                  <Button
                    disabled={!onCreate}
                    leadingIcon={PlusIcon}
                    onClick={onCreate}
                    size="md"
                    variant="primary"
                  >
                    {labels.create}
                  </Button>
                )}
                {toolbarTrailing}
              </div>
            </>
          )}
        </div>
      </DataTable>
    </section>
  );
}
