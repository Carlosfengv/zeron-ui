"use client";

import { type ReactNode, useState } from "react";
import {
  PageHeader,
  PageHeaderContent,
  PageLayout,
} from "@zeron/ui/page-layout";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import {
  defaultMcpCategoryItems,
  defaultMcpResourceListItems,
  ResourceListTable,
  type ResourceListItem,
  type ResourceListTableBulkActionContext,
  type ResourceListTableProps,
} from "../resource-list-table-01";
import {
  CategoryManagement,
  type ResourceCategoryApplicationMap,
  type ResourceCategoryDataMode,
  type ResourceCategoryDetailsState,
  type ResourceCategoryManagementLabels,
} from "./category-management";
import {
  ResourceWorkspaceShell,
  type ResourceWorkspace,
  type ResourceWorkspaceAccountAction,
  type ResourceWorkspaceNavigationItem,
  type ResourceWorkspaceShellProps,
} from "../resource-workspace-shell-01";

export type ResourceListPageSection = "mcp" | "categories";
export type ResourceListPageDataMode = "controlled" | "demo";
export type ResourceListPageAccountAction = ResourceWorkspaceAccountAction;
export type ResourceListPageNavigationItem = ResourceWorkspaceNavigationItem;
export type ResourceListPageWorkspace = ResourceWorkspace;

export interface ResourceListPageLabels {
  categoriesTab: string;
  mcpTab: string;
  pageTitle: string;
}

const defaultPageLabels: ResourceListPageLabels = {
  categoriesTab: "分类管理",
  mcpTab: "MCP 列表",
  pageTitle: "MCP 管理",
};

export interface ResourceListPageProps
  extends Omit<ResourceWorkspaceShellProps, "children"> {
  resources?: readonly ResourceListItem[];
  /** Demo enables bundled mock data and local mutations; controlled never does. */
  dataMode?: ResourceListPageDataMode;
  labels?: Partial<ResourceListPageLabels>;
  breadcrumb?: ReactNode;
  activeSection?: ResourceListPageSection;
  defaultSection?: ResourceListPageSection;
  onSectionChange?: (value: ResourceListPageSection) => void;
  onCreate?: () => void;
  onCreateCategory?: () => void;
  canCreateMcp?: boolean;
  canCreateCategory?: boolean;
  canRemoveCategoryApplication?: boolean;
  onCategoryOpen?: (category: ResourceListItem) => void;
  onRemoveCategoryApplication?: (
    category: ResourceListItem,
    application: ResourceListItem
  ) => void | Promise<void>;
  onRetryCategoryApplications?: (category: ResourceListItem) => void;
  onEdit?: (resource: ResourceListItem) => void;
  onRefresh?: () => void;
  renderBulkActions?: (
    context: ResourceListTableBulkActionContext
  ) => ReactNode;
  /** Passes loading, query, localization, permission, and toolbar options through. */
  tableProps?: Omit<
    ResourceListTableProps,
    | "resources"
    | "surface"
    | "onCreate"
    | "onEdit"
    | "onRefresh"
    | "preset"
    | "renderBulkActions"
    | "showCreateAction"
    | "showRefreshAction"
  >;
  sectionContent?: Partial<Record<ResourceListPageSection, ReactNode>>;
  categoryResources?: readonly ResourceListItem[];
  categoryApplications?: ResourceCategoryApplicationMap;
  categoryDataMode?: ResourceCategoryDataMode;
  categoryDetailsState?: ResourceCategoryDetailsState;
  categoryLabels?: Partial<ResourceCategoryManagementLabels>;
  categoryTableProps?: Omit<
    ResourceListTableProps,
    | "activeRowId"
    | "onCreate"
    | "onRowActivate"
    | "preset"
    | "resources"
    | "showCreateAction"
    | "surface"
    | "toolbarTrailing"
  >;
  selectedCategoryId?: string | null;
  defaultSelectedCategoryId?: string | null;
}

export function ResourceListPage({
  accountAvatar,
  accountEmail,
  accountName,
  accountSections,
  activeNavigation,
  activeSection,
  breadcrumb,
  canCreateCategory = true,
  canCreateMcp = true,
  canRemoveCategoryApplication = true,
  categoryApplications,
  categoryDataMode = "client",
  categoryDetailsState,
  categoryLabels,
  categoryResources,
  categoryTableProps,
  className,
  dataMode = "demo",
  defaultSelectedCategoryId,
  defaultSection = "mcp",
  defaultWorkspaceId,
  defaultWorkspaceName,
  labels: providedPageLabels,
  navigation,
  navigationLabel,
  onAccountAction,
  onCreate,
  onCreateCategory,
  onCategoryOpen,
  onEdit,
  onNavigationSelect,
  onRefresh,
  onRemoveCategoryApplication,
  onRetryCategoryApplications,
  onSectionChange,
  onWorkspaceChange,
  renderBulkActions,
  resources,
  selectedCategoryId,
  sectionContent,
  tableProps,
  workspaceAvatar,
  workspaceId,
  workspaceName,
  workspaces,
  ...props
}: ResourceListPageProps) {
  const [uncontrolledSection, setUncontrolledSection] =
    useState<ResourceListPageSection>(defaultSection);
  const [mockResources, setMockResources] = useState<readonly ResourceListItem[]>(
    defaultMcpResourceListItems
  );
  const [mockCategories, setMockCategories] = useState<readonly ResourceListItem[]>(
    defaultMcpCategoryItems
  );
  const section = activeSection ?? uncontrolledSection;
  const visibleResources =
    resources ?? (dataMode === "demo" ? mockResources : []);
  const visibleCategories =
    categoryResources ?? (dataMode === "demo" ? mockCategories : []);
  const pageLabels = { ...defaultPageLabels, ...providedPageLabels };
  const sectionLabels: Record<ResourceListPageSection, string> = {
    mcp: pageLabels.mcpTab,
    categories: pageLabels.categoriesTab,
  };
  const ChevronRightIcon = useIcon("chevron-right");
  const McpIcon = useIcon("square-library");
  const CategoryIcon = useIcon("folder");

  const handleSectionChange = (value: ResourceListPageSection) => {
    if (activeSection === undefined) setUncontrolledSection(value);
    onSectionChange?.(value);
  };
  const handleCreateMcp =
    onCreate ??
    (dataMode === "demo" && resources === undefined
      ? () =>
          setMockResources((current) => [
            ...current,
            {
              category: "代码开发",
              categoryId: "developer-tools",
              description: "用于演示本地新增流程的 MCP 应用",
              iconName: "square-library",
              id: `mcp-${current.length + 1}`,
              name: `新 MCP 应用 ${current.length + 1}`,
              status: "draft",
              visibility: "管理员",
            },
          ])
      : undefined);
  const handleCreateCategory =
    onCreateCategory ??
    (dataMode === "demo" && categoryResources === undefined
      ? () =>
          setMockCategories((current) => [
            ...current,
            {
              description: "用于演示本地新增流程的 MCP 分类",
              iconName: "folder",
              id: `category-${current.length + 1}`,
              itemCount: 0,
              name: `新分类 ${current.length + 1}`,
              status: "draft",
              visibility: "管理员",
            },
          ])
      : undefined);
  const handleRemoveCategoryApplication =
    onRemoveCategoryApplication || dataMode === "demo"
      ? async (category: ResourceListItem, application: ResourceListItem) => {
          await onRemoveCategoryApplication?.(category, application);
          if (
            dataMode === "demo" &&
            resources === undefined &&
            categoryApplications === undefined
          ) {
            setMockResources((current) =>
              current.map((resource) =>
                resource.id === application.id
                  ? {
                      ...resource,
                      category: undefined,
                      categoryId: undefined,
                    }
                  : resource
              )
            );
          }
        }
      : undefined;
  const sectionTabs = (
    <Tabs
      aria-label="MCP 资源管理"
      color="neutral"
      onValueChange={(value) =>
        handleSectionChange(value as ResourceListPageSection)
      }
      value={section}
      variant="pill"
    >
      <TabsList>
        {(Object.keys(sectionLabels) as ResourceListPageSection[]).map(
          (item) => (
            <TabItem
              icon={item === "mcp" ? McpIcon : CategoryIcon}
              key={item}
              label={sectionLabels[item]}
              value={item}
            />
          )
        )}
      </TabsList>
    </Tabs>
  );

  return (
    <ResourceWorkspaceShell
      accountAvatar={accountAvatar}
      accountEmail={accountEmail}
      accountName={accountName}
      accountSections={accountSections}
      activeNavigation={activeNavigation}
      className={className}
      defaultWorkspaceId={defaultWorkspaceId}
      defaultWorkspaceName={defaultWorkspaceName}
      navigation={navigation}
      navigationLabel={navigationLabel}
      onAccountAction={onAccountAction}
      onNavigationSelect={onNavigationSelect}
      onWorkspaceChange={onWorkspaceChange}
      workspaceAvatar={workspaceAvatar}
      workspaceId={workspaceId}
      workspaceName={workspaceName}
      workspaces={workspaces}
      {...props}
    >
      {({ workspace }) => (
        <PageLayout className="h-full min-w-0 flex-1">
          <PageHeader>
            <PageHeaderContent className="min-w-0 gap-1.5 text-label text-fg-muted">
              {breadcrumb ?? (
                <>
                  <span>{workspace.name}</span>
                  <ChevronRightIcon aria-hidden size={14} strokeWidth={1.5} />
                  <span className="text-fg-default">{pageLabels.pageTitle}</span>
                </>
              )}
            </PageHeaderContent>
          </PageHeader>

          <CategoryManagement
            active={section === "categories" && !sectionContent?.categories}
            applicationsByCategory={categoryApplications}
            canCreateCategory={canCreateCategory}
            canRemoveApplication={canRemoveCategoryApplication}
            categories={visibleCategories}
            dataMode={categoryDataMode}
            defaultSelectedCategoryId={defaultSelectedCategoryId}
            detailsState={categoryDetailsState}
            key={workspace.id}
            labels={categoryLabels}
            navigation={sectionTabs}
            onCategoryOpen={onCategoryOpen}
            onCreateCategory={handleCreateCategory}
            onRemoveApplication={handleRemoveCategoryApplication}
            onRetryApplications={onRetryCategoryApplications}
            resources={visibleResources}
            selectedCategoryId={selectedCategoryId}
            tableProps={categoryTableProps}
            workspaceId={workspace.id}
          >
            {section === "mcp" ? (
              sectionContent?.mcp ?? (
                <ResourceListTable
                  {...tableProps}
                  key={workspace.id}
                  labels={{
                    ariaLabel: "MCP 列表",
                    create: "添加应用",
                    draft: "草稿",
                    enabled: "已发布",
                    empty: "暂无 MCP 应用",
                    searchPlaceholder: "搜索",
                    statusFilter: "状态",
                    ...tableProps?.labels,
                  }}
                  onCreate={canCreateMcp ? handleCreateMcp : undefined}
                  onEdit={onEdit}
                  onRefresh={onRefresh}
                  preset="mcp"
                  renderBulkActions={renderBulkActions}
                  resources={visibleResources}
                  showCreateAction={canCreateMcp}
                  showRefreshAction={false}
                  surface="plain"
                />
              )
            ) : (
              sectionContent?.categories
            )}
          </CategoryManagement>
        </PageLayout>
      )}
    </ResourceWorkspaceShell>
  );
}
