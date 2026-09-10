"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@zeron/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zeron/ui/input-group";
import { InfoItemLeading } from "@zeron/ui/info-item";
import {
  InlineNotice,
  InlineNoticeAction,
  InlineNoticeContent,
} from "@zeron/ui/inline-notice";
import { MobileDrawer } from "@zeron/ui/mobile-drawer";
import {
  PageAside,
  PageBody,
  PageColumns,
  PageContent,
  PageContentHeader,
  PagePrimary,
} from "@zeron/ui/page-layout";
import { Separator } from "@zeron/ui/separator";
import { useIcon } from "@zeron/ui/system/icon-context";
import {
  ResourceListItemIdentity,
  ResourceListTable,
  type ResourceListItem,
  type ResourceListTableProps,
} from "../resource-list-table-01";

export type ResourceCategoryApplicationMap = Readonly<
  Record<string, readonly ResourceListItem[]>
>;

export type ResourceCategoryDataMode = "client" | "remote";

export interface ResourceCategoryDetailsState {
  /** Identifies the category this async state belongs to, preventing stale UI. */
  categoryId?: string;
  isLoading?: boolean;
  loadingMessage?: ReactNode;
  error?: ReactNode;
  emptyState?: ReactNode;
}

export interface ResourceCategoryManagementLabels {
  ariaLabel: string;
  create: string;
  detailsAriaLabel: (categoryName: string) => string;
  detailsSearchLabel: string;
  detailsSearchPlaceholder: string;
  empty: string;
  emptyApplications: string;
  itemCount: string;
  loadingApplications: string;
  noMatchingApplications: string;
  openDetails: string;
  remove: string;
  removeError: (applicationName: string) => string;
  retry: string;
  searchPlaceholder: string;
}

const defaultLabels: ResourceCategoryManagementLabels = {
  ariaLabel: "MCP 分类列表",
  create: "添加分类",
  detailsAriaLabel: (categoryName) => `${categoryName}分类详情`,
  detailsSearchLabel: "搜索分类应用",
  detailsSearchPlaceholder: "搜索",
  empty: "暂无分类",
  emptyApplications: "该分类下暂无 MCP",
  itemCount: "应用数量",
  loadingApplications: "正在加载分类应用",
  noMatchingApplications: "暂无匹配的应用",
  openDetails: "打开分类详情",
  remove: "移除",
  removeError: (applicationName) => `未能移除 ${applicationName}，请重试。`,
  retry: "重试",
  searchPlaceholder: "搜索",
};

export interface CategoryManagementProps {
  applicationsByCategory?: ResourceCategoryApplicationMap;
  canCreateCategory?: boolean;
  canRemoveApplication?: boolean;
  categories: readonly ResourceListItem[];
  dataMode?: ResourceCategoryDataMode;
  defaultSelectedCategoryId?: string | null;
  detailsState?: ResourceCategoryDetailsState;
  labels?: Partial<ResourceCategoryManagementLabels>;
  navigation: ReactNode;
  onCategoryOpen?: (category: ResourceListItem) => void;
  onCreateCategory?: () => void;
  onRemoveApplication?: (
    category: ResourceListItem,
    application: ResourceListItem
  ) => void | Promise<void>;
  onRetryApplications?: (category: ResourceListItem) => void;
  resources: readonly ResourceListItem[];
  selectedCategoryId?: string | null;
  tableProps?: Omit<
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
  workspaceId: string;
}

function CategoryDetails({
  applications,
  canRemoveApplication,
  category,
  detailsState,
  labels,
  mutationError,
  onRemoveApplication,
  onRetryApplications,
  pendingApplicationIds,
}: {
  applications: readonly ResourceListItem[];
  canRemoveApplication: boolean;
  category?: ResourceListItem;
  detailsState?: ResourceCategoryDetailsState;
  labels: ResourceCategoryManagementLabels;
  mutationError?: ReactNode;
  onRemoveApplication: (application: ResourceListItem) => void;
  onRetryApplications?: () => void;
  pendingApplicationIds: ReadonlySet<string>;
}) {
  const SearchIcon = useIcon("search");
  const CategoryIcon = useIcon(category?.iconName ?? "folder");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredApplications = useMemo(
    () =>
      applications.filter((application) =>
        [application.name, application.description]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery)
      ),
    [applications, normalizedQuery]
  );

  useEffect(() => setQuery(""), [category?.id]);

  if (!category) return null;

  return (
    <section
      aria-label={labels.detailsAriaLabel(category.name)}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="p-3">
        <InfoItemLeading className="border-[0.5px] border-border bg-surface-overlay text-fg-brand">
          <CategoryIcon aria-hidden size={20} strokeWidth={1.5} />
        </InfoItemLeading>
        <h2 className="mt-3 truncate text-body font-medium text-fg-default">
          {category.name}
        </h2>
      </div>
      <Separator />
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        <InputGroup size="sm">
          <InputGroupAddon className="pr-2">
            <SearchIcon aria-hidden size={16} strokeWidth={1.5} />
          </InputGroupAddon>
          <InputGroupInput
            aria-label={labels.detailsSearchLabel}
            disabled={detailsState?.isLoading}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.detailsSearchPlaceholder}
            value={query}
          />
        </InputGroup>
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain py-1">
          {detailsState?.error && (
            <InlineNotice role="alert" tone="danger" variant="emphasized">
              <InlineNoticeContent>{detailsState.error}</InlineNoticeContent>
              {onRetryApplications && (
                <InlineNoticeAction>
                  <Button
                    onClick={onRetryApplications}
                    size="xs"
                    type="button"
                    variant="ghost"
                  >
                    {labels.retry}
                  </Button>
                </InlineNoticeAction>
              )}
            </InlineNotice>
          )}
          {mutationError && (
            <InlineNotice role="alert" tone="danger" variant="emphasized">
              <InlineNoticeContent>{mutationError}</InlineNoticeContent>
            </InlineNotice>
          )}
          {detailsState?.isLoading && applications.length === 0 ? (
            <p aria-live="polite" className="py-3 text-center text-label text-fg-muted">
              {detailsState.loadingMessage ?? labels.loadingApplications}
            </p>
          ) : filteredApplications.length > 0 ? (
            filteredApplications.map((application) => (
              <ResourceListItemIdentity
                key={application.id}
                resource={application}
                trailing={
                  canRemoveApplication ? (
                    <Button
                      disabled={pendingApplicationIds.has(
                        `${category.id}:${application.id}`
                      )}
                      loading={pendingApplicationIds.has(
                        `${category.id}:${application.id}`
                      )}
                      onClick={() => onRemoveApplication(application)}
                      size="sm"
                      type="button"
                      variant="tertiary"
                    >
                      {labels.remove}
                    </Button>
                  ) : undefined
                }
              />
            ))
          ) : detailsState?.emptyState ? (
            detailsState.emptyState
          ) : (
            <p className="py-3 text-center text-label text-fg-muted">
              {normalizedQuery
                ? labels.noMatchingApplications
                : labels.emptyApplications}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function CategoryManagement({
  applicationsByCategory,
  canCreateCategory = true,
  canRemoveApplication = true,
  categories,
  dataMode = "client",
  defaultSelectedCategoryId,
  detailsState,
  labels: providedLabels,
  navigation,
  onCategoryOpen,
  onCreateCategory,
  onRemoveApplication,
  onRetryApplications,
  resources,
  selectedCategoryId: controlledSelectedCategoryId,
  tableProps,
  workspaceId,
}: CategoryManagementProps) {
  const DetailsIcon = useIcon("square-library");
  const detailsTriggerRef = useRef<HTMLButtonElement>(null);
  const labels = useMemo(
    () => ({ ...defaultLabels, ...providedLabels }),
    [providedLabels]
  );
  const [uncontrolledSelectedCategoryId, setUncontrolledSelectedCategoryId] =
    useState<string | null>(
      () => defaultSelectedCategoryId ?? categories[0]?.id ?? null
    );
  const selectedCategoryId =
    controlledSelectedCategoryId !== undefined
      ? controlledSelectedCategoryId
      : uncontrolledSelectedCategoryId;
  const [pendingApplicationIds, setPendingApplicationIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [mutationError, setMutationError] = useState<{
    categoryId: string;
    message: ReactNode;
  }>();
  const lastNotifiedCategoryId = useRef<string | null>(null);
  const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
  const visibleApplicationsByCategory = useMemo(
    () =>
      new Map(
        categories.map((category) => {
          const applications =
            dataMode === "remote"
              ? applicationsByCategory?.[category.id] ?? []
              : resources.filter(
                  (resource) =>
                    resource.categoryId === category.id ||
                    (!resource.categoryId && resource.category === category.name)
                );
          return [category.id, applications] as const;
        })
      ),
    [applicationsByCategory, categories, dataMode, resources]
  );
  const categoryRows = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        itemCount:
          dataMode === "client"
            ? visibleApplicationsByCategory.get(category.id)?.length ?? 0
            : category.itemCount ??
              visibleApplicationsByCategory.get(category.id)?.length ??
              0,
      })),
    [categories, dataMode, visibleApplicationsByCategory]
  );
  const selectedCategory = categoryRows.find(
    (category) => category.id === selectedCategoryId
  );
  const selectedApplications = selectedCategory
    ? visibleApplicationsByCategory.get(selectedCategory.id) ?? []
    : [];
  const selectedDetailsState =
    detailsState?.categoryId &&
    detailsState.categoryId !== selectedCategory?.id
      ? { categoryId: selectedCategory?.id, isLoading: true }
      : detailsState;

  useEffect(() => {
    if (
      selectedCategory ||
      controlledSelectedCategoryId !== undefined
    ) {
      return;
    }
    setUncontrolledSelectedCategoryId(categoryRows[0]?.id ?? null);
  }, [categoryRows, controlledSelectedCategoryId, selectedCategory]);

  useEffect(() => {
    if (
      !selectedCategory ||
      lastNotifiedCategoryId.current === selectedCategory.id
    ) {
      return;
    }
    lastNotifiedCategoryId.current = selectedCategory.id;
    onCategoryOpen?.(selectedCategory);
  }, [onCategoryOpen, selectedCategory]);

  useEffect(() => setMutationError(undefined), [selectedCategoryId]);

  const openCategory = (category: ResourceListItem) => {
    if (controlledSelectedCategoryId === undefined) {
      setUncontrolledSelectedCategoryId(category.id);
    }
    lastNotifiedCategoryId.current = category.id;
    onCategoryOpen?.(category);
  };
  const removeApplication = useCallback(
    async (application: ResourceListItem) => {
      if (!selectedCategory || !onRemoveApplication) return;
      const pendingId = `${selectedCategory.id}:${application.id}`;
      setMutationError(undefined);
      setPendingApplicationIds((current) =>
        new Set(current).add(pendingId)
      );
      try {
        await onRemoveApplication(selectedCategory, application);
      } catch {
        setMutationError({
          categoryId: selectedCategory.id,
          message: labels.removeError(application.name),
        });
      } finally {
        setPendingApplicationIds((current) => {
          const next = new Set(current);
          next.delete(pendingId);
          return next;
        });
      }
    }, [labels, onRemoveApplication, selectedCategory]
  );
  const details = (
    <CategoryDetails
      applications={selectedApplications}
      canRemoveApplication={
        canRemoveApplication && Boolean(onRemoveApplication)
      }
      category={selectedCategory}
      detailsState={selectedDetailsState}
      labels={labels}
      mutationError={
        mutationError && mutationError.categoryId === selectedCategory?.id
          ? mutationError.message
          : undefined
      }
      onRemoveApplication={removeApplication}
      onRetryApplications={
        selectedCategory && onRetryApplications
          ? () => onRetryApplications(selectedCategory)
          : undefined
      }
      pendingApplicationIds={pendingApplicationIds}
    />
  );

  return (
    <>
      <PageColumns
        asideWidth="25rem"
        className="min-h-0 flex-1 grid-rows-[minmax(0,1fr)] items-stretch gap-2"
        columnsAt="xl"
      >
        <PagePrimary className="flex h-full min-h-0">
          <PageContent>
            <PageContentHeader>{navigation}</PageContentHeader>
            <PageBody className="max-w-none p-3">
              <ResourceListTable
                {...tableProps}
                activeRowId={selectedCategoryId}
                key={`${workspaceId}-categories`}
                labels={{
                  ariaLabel: labels.ariaLabel,
                  create: labels.create,
                  empty: labels.empty,
                  itemCount: labels.itemCount,
                  searchPlaceholder: labels.searchPlaceholder,
                  ...tableProps?.labels,
                }}
                onCreate={canCreateCategory ? onCreateCategory : undefined}
                onRowActivate={openCategory}
                preset="category"
                resources={categoryRows}
                showCreateAction={canCreateCategory}
                showRefreshAction={tableProps?.showRefreshAction ?? false}
                surface="plain"
                toolbarTrailing={
                  <Button
                    aria-label={labels.openDetails}
                    className="xl:hidden"
                    disabled={!selectedCategory}
                    iconOnly
                    onClick={() => setIsDetailsDrawerOpen(true)}
                    ref={detailsTriggerRef}
                    size="md"
                    type="button"
                    variant="tertiary"
                  >
                    <DetailsIcon />
                  </Button>
                }
              />
            </PageBody>
          </PageContent>
        </PagePrimary>
        <PageAside className="hidden h-full min-h-0 xl:flex">
          <PageContent>{details}</PageContent>
        </PageAside>
      </PageColumns>
      <MobileDrawer
        ariaLabel="分类详情"
        onClose={() => setIsDetailsDrawerOpen(false)}
        open={isDetailsDrawerOpen}
        side="end"
        triggerRef={detailsTriggerRef}
      >
        {details}
      </MobileDrawer>
    </>
  );
}
