"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  functionalUpdate,
  type PaginationState,
} from "@tanstack/react-table";
import DeepSeekColor from "@lobehub/icons/es/DeepSeek/components/Color";
import { useMemo } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import {
  DataTable,
  DataTableFacetedFilter,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@zeron/ui/input-group";
import {
  InlineNotice,
  InlineNoticeAction,
  InlineNoticeContent,
} from "@zeron/ui/inline-notice";
import {
  PageBody,
  PageContent,
  PageHeader,
  PageHeaderContent,
  PageLayout,
} from "@zeron/ui/page-layout";
import { SidebarProvider, SidebarTrigger } from "@zeron/ui/sidebar";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  AiGatewayWorkspaceSidebar,
  resolveAiGatewaySidebarConfig,
} from "../ai-gateway-workspace-sidebar";
import type {
  AiGatewaySessionEntity,
  AiGatewaySessionDateTimeFormatter,
  AiGatewaySessionFilterOption,
  AiGatewaySessionItem,
  AiGatewaySessionListLabels,
  AiGatewaySessionListProps,
  AiGatewaySessionListQuery,
  AiGatewaySessionModel,
} from "./ai-gateway-session-list-types";

const defaultLabels: AiGatewaySessionListLabels = {
  title: "Sessions",
  description: "Browse session activity, usage, cost, and outcomes across the AI gateway.",
  ariaLabel: "AI gateway sessions",
  toolbarAriaLabel: "Session filters",
  searchPlaceholder: "Search session id or trace name...",
  allAgents: "All agents",
  allUsers: "All users",
  allModels: "All models",
  errorsOnly: "Errors only",
  session: "Session",
  agent: "Agent",
  model: "Model",
  customer: "Customer",
  turns: "Turns",
  tokens: "Tokens",
  cost: "Cost",
  createdAt: "Created at",
  noModelCall: "no-model-call",
  unavailable: "—",
  emptyTitle: "No sessions",
  emptyDescription: "Session activity will appear here when the gateway receives requests.",
  errorTitle: "Sessions could not be loaded.",
  retry: "Retry",
  succeeded: "Succeeded",
  failed: "Failed",
  filteredEmptyTitle: "No matching sessions",
  filteredEmptyDescription: "Try adjusting the search or clearing the active filters.",
  clearFilters: "Clear filters",
  loadingMessage: "Loading sessions.",
  sidebarTriggerLabel: "Open AI gateway navigation",
  currentLocationAriaLabel: "Current location",
  rowsPerPage: "Rows per page",
  pageSummary: (page, pageCount) => `Page ${page} of ${pageCount}`,
  firstPage: "Go to first page",
  previousPage: "Go to previous page",
  nextPage: "Go to next page",
  lastPage: "Go to last page",
};

function resolveReferenceTime(now: AiGatewaySessionListProps["now"]) {
  if (now instanceof Date) return now.getTime();
  if (typeof now === "number") return now;
  if (typeof now === "string") return Date.parse(now);
  return Date.now();
}

export function formatSessionLastActive(
  value: string,
  locale: string,
  now: AiGatewaySessionListProps["now"],
  timeZone: string,
  unavailable: string,
  dateTimeFormatter?: AiGatewaySessionDateTimeFormatter,
) {
  const timestamp = Date.parse(value);
  const reference = resolveReferenceTime(now);
  if (!Number.isFinite(timestamp) || !Number.isFinite(reference)) return unavailable;

  const seconds = (timestamp - reference) / 1000;
  const absoluteSeconds = Math.abs(seconds);
  const sevenDaysInSeconds = 7 * 24 * 60 * 60;

  if (seconds < -sevenDaysInSeconds) {
    return formatDateTime(
      value,
      locale,
      timeZone,
      unavailable,
      dateTimeFormatter,
    );
  }

  if (absoluteSeconds < 60) {
    try {
      return new Intl.RelativeTimeFormat(locale, {
        numeric: "auto",
        style: "short",
      }).format(0, "second");
    } catch {
      return unavailable;
    }
  }

  const selected =
    absoluteSeconds < 3_600
      ? { size: 60, unit: "minute" as const }
      : absoluteSeconds < 86_400
        ? { size: 3_600, unit: "hour" as const }
        : { size: 86_400, unit: "day" as const };
  const magnitude = Math.max(1, Math.floor(absoluteSeconds / selected.size));

  try {
    return new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
      style: "short",
    }).format(seconds < 0 ? -magnitude : magnitude, selected.unit);
  } catch {
    return unavailable;
  }
}

function formatDateTime(
  value: string,
  locale: string,
  timeZone: string,
  unavailable: string,
  dateTimeFormatter?: AiGatewaySessionDateTimeFormatter,
) {
  if (dateTimeFormatter) {
    try {
      return dateTimeFormatter(value, { locale, timeZone, unavailable }) || unavailable;
    } catch {
      return unavailable;
    }
  }

  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return unavailable;

  try {
    const parts = new Intl.DateTimeFormat("en-US-u-nu-latn", {
      day: "numeric",
      hour: "2-digit",
      hourCycle: "h23",
      minute: "2-digit",
      month: "numeric",
      second: "2-digit",
      timeZone,
      year: "numeric",
    }).formatToParts(timestamp);
    const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value;
    const year = valueFor("year");
    const month = valueFor("month");
    const day = valueFor("day");
    const hour = valueFor("hour");
    const minute = valueFor("minute");
    const second = valueFor("second");

    if (!year || !month || !day || !hour || !minute || !second) return unavailable;

    return `${year}年 ${Number(month)}月${Number(day)}日 ${hour}:${minute}:${second}`;
  } catch {
    return unavailable;
  }
}

function formatTokens(item: AiGatewaySessionItem, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(item.inputTokens + item.outputTokens);
}

function formatCost(costMicros: number, currency: string, locale: string) {
  const amount = costMicros / 1_000_000;
  const fractionDigits = amount > 0 && amount < 0.01 ? 4 : amount === 0 ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      currency,
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
      style: "currency",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(fractionDigits)}`;
  }
}

function EntityCell({ entity, unavailable }: { entity: AiGatewaySessionEntity | null; unavailable: string }) {
  return (
    <span className="block min-w-28 max-w-44 truncate" title={entity?.label}>
      {entity?.label ?? unavailable}
    </span>
  );
}

function ModelBadge({
  model,
  noModelCall,
  renderModelLogo,
}: {
  model: AiGatewaySessionModel | null;
  noModelCall: string;
  renderModelLogo?: AiGatewaySessionListProps["renderModelLogo"];
}) {
  const GenericModelIcon = useIcon("brain");
  const label = model?.label ?? noModelCall;
  const isDeepSeek = `${model?.provider ?? ""} ${model?.id ?? ""} ${model?.label ?? ""}`
    .toLocaleLowerCase()
    .includes("deepseek");
  const customLogo = model && renderModelLogo ? renderModelLogo(model) : null;

  return (
    <Badge color="gray" size="sm">
      <span className="flex min-w-0 items-center gap-1">
        {model ? (
          customLogo ? (
            customLogo
          ) : isDeepSeek ? (
            <DeepSeekColor aria-hidden size={14} />
          ) : (
            <GenericModelIcon aria-hidden size={14} strokeWidth={1.5} />
          )
        ) : null}
        <span className="block max-w-36 truncate" title={label}>
          {label}
        </span>
      </span>
    </Badge>
  );
}

function HeaderLabel({ children, align = "start" }: { children: string; align?: "start" | "end" }) {
  return (
    <span
      className={cn(
        "block",
        align === "end" && "text-right",
      )}
    >
      {children}
    </span>
  );
}

function toFilterOptions(options: readonly AiGatewaySessionFilterOption[]) {
  return options.map((option) => ({
    count: option.count,
    label: option.label,
    value: option.id,
  }));
}

function SessionEmptyState({ filtered, labels, onClear }: { filtered: boolean; labels: AiGatewaySessionListLabels; onClear?: () => void }) {
  return (
    <Empty density="compact" reason={filtered ? "no-filter-results" : "no-data"} scope="section">
      <EmptyMedia>
        <EmptyIllustration variant={filtered ? "filter" : "analytics"} />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{filtered ? labels.filteredEmptyTitle : labels.emptyTitle}</EmptyTitle>
        <EmptyDescription>
          {filtered ? labels.filteredEmptyDescription : labels.emptyDescription}
        </EmptyDescription>
      </EmptyHeader>
      {filtered && onClear ? (
        <EmptyActions>
          <Button onClick={onClear} size="sm" type="button" variant="secondary">
            {labels.clearFilters}
          </Button>
        </EmptyActions>
      ) : null}
    </Empty>
  );
}

function hasActiveFilters(query: AiGatewaySessionListQuery) {
  return Boolean(
    query.search.trim() ||
      query.agentId ||
      query.userId ||
      query.modelId ||
      query.errorsOnly,
  );
}

export function AiGatewaySessionList({
  actions,
  className,
  data,
  dateTimeFormatter,
  error,
  labels: labelOverrides,
  locale = "en-US",
  now,
  query,
  renderModelLogo,
  sidebar: sidebarProp,
  status = "ready",
  timeZone = "UTC",
  ...props
}: AiGatewaySessionListProps) {
  const Search = useIcon("search");
  const AgentFilterIcon = useIcon("users");
  const UserFilterIcon = useIcon("user");
  const ModelFilterIcon = useIcon("brain");
  const SessionsIcon = useIcon("message-circle");
  const labels = useMemo(
    () => ({ ...defaultLabels, ...labelOverrides }),
    [labelOverrides],
  );
  const sidebarConfig = resolveAiGatewaySidebarConfig(sidebarProp, "sessions");
  const canChangeQuery = Boolean(actions?.onQueryChange);
  const items = data ? [...data.items] : [];
  const total = data?.total ?? 0;
  const currency = data?.currency ?? "USD";
  const referenceTime = now ?? data?.generatedAt;
  const isInitialLoading = status === "loading" && !data;
  const isUpdating = status === "refreshing";
  const hasBlockingError = status === "error" && !data;
  const canInteract = canChangeQuery && !isUpdating;

  const updateQuery = (patch: Partial<AiGatewaySessionListQuery>, resetPage = false) => {
    actions?.onQueryChange?.({
      ...query,
      ...patch,
      ...(resetPage ? { pageIndex: 0 } : {}),
    });
  };
  const clearFilters = () => {
    actions?.onQueryChange?.({
      ...query,
      search: "",
      agentId: null,
      userId: null,
      modelId: null,
      errorsOnly: false,
      pageIndex: 0,
    });
  };

  const columns = useMemo<ColumnDef<AiGatewaySessionItem, unknown>[]>(
    () => [
      {
        accessorFn: (item) => item.traceName ?? item.id,
        id: "traceName",
        header: () => <HeaderLabel>{labels.session}</HeaderLabel>,
        cell: ({ row }) => {
          const item = row.original;
          const title = item.traceName ?? item.id;
          const absoluteLastActive = formatDateTime(
            item.lastActiveAt,
            locale,
            timeZone,
            labels.unavailable,
            dateTimeFormatter,
          );
          return (
            <div className="flex min-w-0 flex-col items-start gap-1">
              <div className="flex min-w-0 max-w-[min(44rem,48vw)] items-center gap-1.5">
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    item.outcome === "failed" ? "bg-fg-danger" : "bg-fg-success",
                  )}
                />
                <span className="sr-only">
                  {item.outcome === "failed" ? labels.failed : labels.succeeded}:{" "}
                </span>
                <span className="min-w-0 truncate font-medium" title={title}>
                  {title}
                </span>
              </div>
              <span
                className="block max-w-[min(44rem,48vw)] truncate text-label text-fg-muted"
                title={absoluteLastActive}
              >
                {formatSessionLastActive(
                  item.lastActiveAt,
                  locale,
                  referenceTime,
                  timeZone,
                  labels.unavailable,
                  dateTimeFormatter,
                )}
              </span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorFn: (item) => item.agent?.id ?? "",
        id: "agent",
        header: () => <HeaderLabel>{labels.agent}</HeaderLabel>,
        cell: ({ row }) => <EntityCell entity={row.original.agent} unavailable={labels.unavailable} />,
        enableSorting: false,
      },
      {
        accessorFn: (item) => item.model?.id ?? "",
        id: "model",
        header: () => <HeaderLabel>{labels.model}</HeaderLabel>,
        cell: ({ row }) => (
          <ModelBadge
            model={row.original.model}
            noModelCall={labels.noModelCall}
            renderModelLogo={renderModelLogo}
          />
        ),
        enableSorting: false,
      },
      {
        accessorFn: (item) => item.customer?.id ?? "",
        id: "customer",
        header: () => <HeaderLabel>{labels.customer}</HeaderLabel>,
        cell: ({ row }) => <EntityCell entity={row.original.customer} unavailable={labels.unavailable} />,
        enableSorting: false,
      },
      {
        accessorFn: (item) => item.user?.id ?? "",
        id: "userFilter",
        header: labels.allUsers,
        enableSorting: false,
      },
      {
        accessorKey: "turnCount",
        header: () => <HeaderLabel align="end">{labels.turns}</HeaderLabel>,
        cell: ({ row }) => <span className="block min-w-12 text-right tabular-nums">{row.original.turnCount}</span>,
        enableSorting: false,
      },
      {
        id: "tokens",
        header: () => <HeaderLabel align="end">{labels.tokens}</HeaderLabel>,
        cell: ({ row }) => (
          <span
            className="block min-w-20 text-right tabular-nums"
            title={new Intl.NumberFormat(locale).format(row.original.inputTokens + row.original.outputTokens)}
          >
            {formatTokens(row.original, locale)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "costMicros",
        header: () => <HeaderLabel align="end">{labels.cost}</HeaderLabel>,
        cell: ({ row }) => (
          <span className="block min-w-20 text-right tabular-nums">
            {formatCost(row.original.costMicros, currency, locale)}
          </span>
        ),
        enableSorting: false,
      },
      {
        accessorKey: "createdAt",
        header: () => <HeaderLabel align="end">{labels.createdAt}</HeaderLabel>,
        cell: ({ row }) => (
          <span className="block min-w-36 text-right tabular-nums">
            {formatDateTime(
              row.original.createdAt,
              locale,
              timeZone,
              labels.unavailable,
              dateTimeFormatter,
            )}
          </span>
        ),
        enableSorting: false,
      },
    ],
    [currency, dateTimeFormatter, labels, locale, referenceTime, renderModelLogo, timeZone],
  );

  const paginationState: PaginationState = {
    pageIndex: query.pageIndex,
    pageSize: query.pageSize,
  };
  const columnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    if (query.search) filters.push({ id: "traceName", value: query.search });
    if (query.agentId) filters.push({ id: "agent", value: [query.agentId] });
    if (query.userId) filters.push({ id: "userFilter", value: [query.userId] });
    if (query.modelId) filters.push({ id: "model", value: [query.modelId] });
    return filters;
  }, [query.agentId, query.modelId, query.search, query.userId]);
  const { table } = useDataTable<AiGatewaySessionItem>({
    columns,
    data: items,
    getRowId: (item) => item.id,
    manualFiltering: true,
    manualPagination: true,
    onColumnFiltersChange: canInteract
      ? (updater) => {
          const nextFilters = functionalUpdate(updater, columnFilters);
          const valueFor = (columnId: string) =>
            nextFilters.find((filter) => filter.id === columnId)?.value;
          const firstValueFor = (columnId: string) => {
            const value = valueFor(columnId);
            return Array.isArray(value) && typeof value[0] === "string"
              ? value[0]
              : null;
          };

          actions?.onQueryChange?.({
            ...query,
            agentId: firstValueFor("agent"),
            modelId: firstValueFor("model"),
            pageIndex: 0,
            search: String(valueFor("traceName") ?? ""),
            userId: firstValueFor("userFilter"),
          });
        }
      : undefined,
    onPaginationChange: canInteract
      ? (updater) => {
          const next = functionalUpdate(updater, paginationState);
          actions?.onQueryChange?.({ ...query, ...next });
        }
      : undefined,
    rowCount: total,
    state: {
      columnFilters,
      columnVisibility: { userFilter: false },
      pagination: paginationState,
    },
  });
  const searchColumn = table.getColumn("traceName");
  const agentColumn = table.getColumn("agent");
  const userColumn = table.getColumn("userFilter");
  const modelColumn = table.getColumn("model");

  const filtered = hasActiveFilters(query);

  const content = (
    <section
      aria-busy={isInitialLoading || isUpdating || undefined}
      className={cn(
        "flex h-full min-h-[42rem] min-w-0 overflow-hidden bg-surface-base",
        className,
      )}
      {...props}
    >
      {sidebarConfig ? (
        <AiGatewayWorkspaceSidebar actions={actions} config={sidebarConfig} />
      ) : null}

      <PageLayout size="full">
        <PageHeader>
          <div className="flex h-full min-w-0 items-center gap-2">
            {sidebarConfig ? (
              <div className="xl:hidden">
                <SidebarTrigger label={labels.sidebarTriggerLabel} size="xs" />
              </div>
            ) : null}
            <PageHeaderContent icon={SessionsIcon}>
              <h1 className="sr-only">{labels.title}</h1>
              <p className="sr-only">{labels.description}</p>
              <nav aria-label={labels.currentLocationAriaLabel}>{labels.title}</nav>
            </PageHeaderContent>
          </div>
        </PageHeader>
        <PageContent>
          <PageBody className="max-w-none p-3">
            <section aria-label={labels.ariaLabel} className="min-w-0 w-full">
              <DataTable<AiGatewaySessionItem>
                className="gap-2.5"
                emptyState={
                  hasBlockingError ? (
                    <div className="p-3">
                      <InlineNotice tone="danger" variant="emphasized">
                        <InlineNoticeContent>{error || labels.errorTitle}</InlineNoticeContent>
                        {actions?.onRetry ? (
                          <InlineNoticeAction>
                            <Button onClick={actions.onRetry} size="sm" type="button" variant="secondary">
                              {labels.retry}
                            </Button>
                          </InlineNoticeAction>
                        ) : null}
                      </InlineNotice>
                    </div>
                  ) : (
                    <SessionEmptyState
                      filtered={filtered}
                      labels={labels}
                      onClear={canChangeQuery && filtered ? clearFilters : undefined}
                    />
                  )
                }
                isLoading={isInitialLoading}
                loadingMessage={labels.loadingMessage}
                loadingRowCount={7}
                onRowActivate={actions?.onSessionOpen ? (row) => actions.onSessionOpen?.(row.original) : undefined}
                paginationProps={{
                  disabled: !canInteract,
                  labels: {
                    firstPage: labels.firstPage,
                    lastPage: labels.lastPage,
                    nextPage: labels.nextPage,
                    pageSummary: labels.pageSummary,
                    previousPage: labels.previousPage,
                    rowsPerPage: labels.rowsPerPage,
                  },
                }}
                table={table}
              >
                <div
                  aria-label={labels.toolbarAriaLabel}
                  className="flex min-h-control-md min-w-0 flex-wrap items-center justify-between gap-2"
                  role="toolbar"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <InputGroup
                      className="w-full max-w-md border-border hover:border-border"
                      size="md"
                    >
                      <InputGroupAddon className="pr-2">
                        <Search aria-hidden size={16} strokeWidth={1.5} />
                      </InputGroupAddon>
                      <InputGroupInput
                        aria-label={labels.searchPlaceholder}
                        className="h-full min-h-0"
                        disabled={!canInteract}
                        onChange={(event) => searchColumn?.setFilterValue(event.target.value)}
                        placeholder={labels.searchPlaceholder}
                        value={query.search}
                      />
                    </InputGroup>
                    {agentColumn ? (
                      <DataTableFacetedFilter
                        column={agentColumn}
                        disabled={!canInteract}
                        icon={AgentFilterIcon}
                        options={toFilterOptions(data?.facets.agents ?? [])}
                        title={labels.allAgents}
                      />
                    ) : null}
                    {userColumn ? (
                      <DataTableFacetedFilter
                        column={userColumn}
                        disabled={!canInteract}
                        icon={UserFilterIcon}
                        options={toFilterOptions(data?.facets.users ?? [])}
                        title={labels.allUsers}
                      />
                    ) : null}
                    {modelColumn ? (
                      <DataTableFacetedFilter
                        column={modelColumn}
                        disabled={!canInteract}
                        icon={ModelFilterIcon}
                        options={toFilterOptions(data?.facets.models ?? [])}
                        title={labels.allModels}
                      />
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <label className="flex shrink-0 cursor-pointer items-center gap-2">
                      <Checkbox
                        checked={query.errorsOnly}
                        disabled={!canInteract}
                        onCheckedChange={(checked) => updateQuery({ errorsOnly: checked === true }, true)}
                      />
                      <span>{labels.errorsOnly}</span>
                    </label>
                  </div>
                </div>

                {status === "error" && data ? (
                  <InlineNotice tone="danger" variant="emphasized">
                    <InlineNoticeContent>{error || labels.errorTitle}</InlineNoticeContent>
                    {actions?.onRetry ? (
                      <InlineNoticeAction>
                        <Button onClick={actions.onRetry} size="sm" type="button" variant="secondary">
                          {labels.retry}
                        </Button>
                      </InlineNoticeAction>
                    ) : null}
                  </InlineNotice>
                ) : null}
              </DataTable>
            </section>
          </PageBody>
        </PageContent>
      </PageLayout>
    </section>
  );

  return sidebarConfig ? (
    <SidebarProvider breakpointBehavior="drawer">{content}</SidebarProvider>
  ) : (
    content
  );
}
