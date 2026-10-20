"use client";

import { getExpandedRowModel, getGroupedRowModel, type Row } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { DataTable, DataTableViewOptions, useDataTable } from "@zeron/ui/data-table";
import { Empty, EmptyActions, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zeron/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { useIcon } from "@zeron/ui/system/icon-context";
import { groupedDataTableZhLabels } from "./grouped-data-table-labels";
import type { GroupedDataTableProps } from "./grouped-data-table-types";

export function GroupedDataTable<TData>({
  data,
  columns,
  groupBy,
  getRowId,
  groups = [],
  title,
  description,
  actions,
  previewRowCount = 3,
  expanded: controlledExpanded,
  defaultExpanded = true,
  onExpandedChange,
  state = "ready",
  errorMessage,
  onRetry,
  labels: labelOverrides,
  renderFilters,
  renderSummary,
  activeRowId,
  onRowActivate,
  ...props
}: GroupedDataTableProps<TData>) {
  const labels = { ...groupedDataTableZhLabels, ...labelOverrides };
  const Search = useIcon("search");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const rows = useMemo(() => [...data], [data]);
  const groupingState = useMemo(() => [groupBy], [groupBy]);
  const groupDefinitions = new Map(groups.map((group, index) => [group.value, { ...group, order: index }]));
  const limit = Number.isFinite(previewRowCount) ? Math.max(1, Math.floor(previewRowCount)) : 3;
  const groupKey = (row: Row<TData>) => String(row.groupingValue ?? "");
  const groupLabel = (row: Row<TData>) => groupDefinitions.get(groupKey(row))?.label || groupKey(row) || labels.ungrouped;
  const { table } = useDataTable({
    data: rows,
    columns,
    getRowId,
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    groupedColumnMode: "remove",
    manualPagination: true,
    autoResetExpanded: false,
    enableRowSelection: false,
    state: { grouping: groupingState, expanded: controlledExpanded ?? expanded, globalFilter: search },
    onGlobalFilterChange: setSearch,
    onExpandedChange: (updater) => {
      if (controlledExpanded === undefined) setExpanded(updater);
      onExpandedChange?.(updater);
    },
  });
  const matchingRows = table.getFilteredRowModel().flatRows;
  const groupRows = table.getPreExpandedRowModel().rows.filter((row) => row.getIsGrouped());
  const groupCounts = new Map(groupRows.map((row) => [groupKey(row), row.getLeafRows().length]));
  const allExpanded = groupRows.length > 0 && groupRows.every((row) => row.getIsExpanded());
  const filtered = search.length > 0 || table.getState().columnFilters.length > 0;
  const clearFilters = () => { setSearch(""); table.resetColumnFilters(true); };
  const loading = state === "loading";

  return (
    <Container data-slot="grouped-data-table" {...props}>
      <ContainerHeader>
        <div className="min-w-0 max-w-full space-y-1 py-2">
          <h3 className="break-words text-title font-medium text-fg-default">{title ?? labels.title}</h3>
          {description && <p className="break-words text-body text-fg-muted">{description}</p>}
        </div>
        {actions}
      </ContainerHeader>
      <ContainerBody className="p-3">
        {state === "error" ? (
          <div className="space-y-3">
            <InlineNotice role="alert" tone="danger" variant="emphasized"><InlineNoticeContent>{errorMessage ?? labels.error}</InlineNoticeContent></InlineNotice>
            {onRetry && <Button onClick={onRetry} variant="secondary">{labels.retry}</Button>}
          </div>
        ) : (
          <DataTable
            activeRowId={activeRowId}
            density={density}
            emptyState={
              <Empty reason={filtered ? "no-results" : "no-data"} scope="section" density="compact">
                <EmptyDescription>{filtered ? labels.noResults : labels.empty}</EmptyDescription>
                {filtered && <EmptyActions><Button onClick={clearFilters} size="sm" variant="secondary">{labels.clearFilters}</Button></EmptyActions>}
              </Empty>
            }
            grouping={{
              getLabel: groupLabel,
              getOrder: (row) => groupDefinitions.get(groupKey(row))?.order ?? groups.length,
              getRowLimit: (row) => revealed[row.id] ? undefined : limit,
              labels,
              renderHeader: ({ row, leafRowCount }) => {
                const definition = groupDefinitions.get(groupKey(row));
                return <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <Badge color={definition?.color ?? "gray"} variant="plain">{groupLabel(row)}</Badge>
                  <Badge size="sm">{leafRowCount}</Badge>
                  {definition?.description && <span className="min-w-0 text-label text-fg-subtle sm:ml-auto">{definition.description}</span>}
                </div>;
              },
              renderFooter: ({ row, leafRowCount, visibleRowCount }) => leafRowCount > limit ? (
                <Button
                  aria-expanded={Boolean(revealed[row.id])}
                  onClick={() => setRevealed((current) => ({ ...current, [row.id]: !current[row.id] }))}
                  size="sm"
                  variant="ghost"
                >
                  {revealed[row.id] ? labels.showLess(groupLabel(row)) : labels.showMore(leafRowCount - visibleRowCount, groupLabel(row))}
                </Button>
              ) : null,
            }}
            isLoading={loading}
            loadingMessage={labels.loading}
            loadingRowCount={6}
            onRowActivate={onRowActivate ? (row) => onRowActivate(row.original) : undefined}
            showPagination={false}
            table={table}
          >
            <div aria-label={labels.search} className="flex flex-wrap items-center justify-between gap-2 pb-2" role="toolbar">
              <InputGroup className="w-full sm:max-w-xs">
                <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
                <InputGroupInput aria-label={labels.search} onChange={(event) => setSearch(event.target.value)} placeholder={labels.searchPlaceholder} value={search} />
              </InputGroup>
              <div className="flex flex-wrap items-center gap-2">
                {renderFilters?.(table)}
                {filtered && <Button onClick={clearFilters} variant="ghost">{labels.clearFilters}</Button>}
                <Select onValueChange={(value) => setDensity(value === "compact" ? "compact" : "comfortable")} value={density}>
                  <SelectTrigger aria-label={labels.density} />
                  <SelectContent><SelectItem value="comfortable">{labels.comfortable}</SelectItem><SelectItem value="compact">{labels.compact}</SelectItem></SelectContent>
                </Select>
                <DataTableViewOptions labels={labels} table={table} />
                <Button disabled={loading || groupRows.length === 0} onClick={() => table.toggleAllRowsExpanded(!allExpanded)} variant="secondary">
                  {allExpanded ? labels.collapseAll : labels.expandAll}
                </Button>
              </div>
            </div>
          </DataTable>
        )}
      </ContainerBody>
      {state === "ready" && <ContainerFooter className="justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {groups.map((group) => {
            const count = groupCounts.get(group.value) ?? 0;
            return <Badge key={group.value} color={group.color ?? "gray"} variant="plain">{group.label} · {count}</Badge>;
          })}
        </div>
        <span aria-atomic="true" className="text-label text-fg-subtle" role="status">{labels.results(matchingRows.length, data.length)}</span>
        {renderSummary?.({ rows: matchingRows, total: data.length })}
      </ContainerFooter>}
    </Container>
  );
}
