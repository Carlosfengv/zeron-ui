"use client";

import { getGroupedRowModel, type Table } from "@tanstack/react-table";
import { useId, useMemo, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { DataTable, DataTableViewOptions, useDataTable } from "@zeron/ui/data-table";
import { Empty, EmptyActions, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zeron/ui/input-group";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { sectionedDataTableZhLabels } from "./sectioned-data-table-labels";
import type { SectionedDataTableProps } from "./sectioned-data-table-types";

/** A table per section, with sorting and column presentation owned by the shared table. */
function SectionTable<TData>({ data, source, columns, getRowId, activeRowId, onRowActivate, columnId }: {
  data: TData[];
  source: Table<TData>;
  columnId: string;
} & Pick<SectionedDataTableProps<TData>, "columns" | "getRowId" | "activeRowId" | "onRowActivate">) {
  const shared = source.getState();
  const { table } = useDataTable({
    data, columns, getRowId, manualPagination: true, manualSorting: true, manualFiltering: true,
    enableRowSelection: false,
    state: { sorting: shared.sorting, columnOrder: shared.columnOrder, columnVisibility: { ...shared.columnVisibility, [columnId]: false } },
    onSortingChange: source.setSorting, onColumnOrderChange: source.setColumnOrder, onColumnVisibilityChange: source.setColumnVisibility,
  });
  return <DataTable table={table} showPagination={false} activeRowId={activeRowId} onRowActivate={onRowActivate ? (row) => onRowActivate(row.original) : undefined} />;
}

export function SectionedDataTable<TData>({
  data, columns, getRowId, dimensions, groupBy: controlledGroupBy, defaultGroupBy, onGroupByChange,
  title, description, actions, renderStats, renderSummary, renderFilters, onAddToGroup,
  previewRowCount = 3, activeRowId, onRowActivate, state = "ready", errorMessage, onRetry,
  labels: overrides, ...props
}: SectionedDataTableProps<TData>) {
  const labels = { ...sectionedDataTableZhLabels, ...overrides };
  const id = useId();
  const Search = useIcon("search");
  const Plus = useIcon("plus");
  const ChevronRight = useIcon("chevron-right");
  const ChevronDown = useIcon("chevron-down");
  const [internalGroupBy, setGroupBy] = useState(defaultGroupBy ?? dimensions[0].columnId);
  const dimension = dimensions.find((item) => item.columnId === (controlledGroupBy ?? internalGroupBy)) ?? dimensions[0];
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const rows = useMemo(() => [...data], [data]);
  const grouping = useMemo(() => [dimension.columnId], [dimension.columnId]);
  const { table } = useDataTable({
    data: rows, columns, getRowId, getGroupedRowModel: getGroupedRowModel(), groupedColumnMode: "remove",
    manualPagination: true, enableRowSelection: false,
    state: { grouping, globalFilter: search }, onGlobalFilterChange: setSearch,
  });
  const definitions = new Map(dimension.groups?.map((group, order) => [group.value, { ...group, order }]));
  const groups = [...table.getRowModel().rows].sort((a, b) =>
    (definitions.get(String(a.groupingValue))?.order ?? definitions.size) - (definitions.get(String(b.groupingValue))?.order ?? definitions.size));
  const matching = table.getFilteredRowModel().rows;
  const context = { rows: matching, total: data.length };
  const filtered = search.length > 0 || table.getState().columnFilters.length > 0;
  const clearFilters = () => { setSearch(""); table.resetColumnFilters(true); };
  const limit = Number.isFinite(previewRowCount) ? Math.max(1, Math.floor(previewRowCount)) : 3;
  const loading = state === "loading";
  const changeDimension = (value: string) => {
    if (controlledGroupBy === undefined) setGroupBy(value);
    onGroupByChange?.(value);
  };

  return <Container data-slot="sectioned-data-table" {...props}>
    <ContainerHeader>
      <div className="min-w-0 max-w-full space-y-1 py-2">
        <h3 className="break-words text-title font-medium text-fg-default">{title ?? labels.title}</h3>
        {description && <p className="break-words text-body text-fg-muted">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">{state === "ready" && renderStats?.(context)}{actions}</div>
    </ContainerHeader>
    <ContainerBody className="p-3">
      <Tabs value={dimension.columnId} onValueChange={changeDimension} color="neutral">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <TabsList aria-label={labels.groupBy}>{dimensions.map((item) => <TabItem key={item.columnId} value={item.columnId} label={item.label} />)}</TabsList>
          <div aria-label={labels.search} className="flex w-full flex-wrap items-center gap-2 sm:w-auto" role="toolbar">
            <InputGroup className="w-full sm:w-64"><InputGroupAddon><Search aria-hidden /></InputGroupAddon><InputGroupInput aria-label={labels.search} placeholder={labels.searchPlaceholder} value={search} onChange={(event) => setSearch(event.target.value)} /></InputGroup>
            {renderFilters?.(table)}
            <DataTableViewOptions table={table} labels={labels} />
            {filtered && <Button variant="ghost" onClick={clearFilters}>{labels.clearFilters}</Button>}
          </div>
        </div>
        <TabPanel key={dimension.columnId} value={dimension.columnId}>
          {state === "error" ? <div className="space-y-3">
            <InlineNotice role="alert" tone="danger" variant="emphasized"><InlineNoticeContent>{errorMessage ?? labels.error}</InlineNoticeContent></InlineNotice>
            {onRetry && <Button variant="secondary" onClick={onRetry}>{labels.retry}</Button>}
          </div> : loading ? <DataTable table={table} isLoading loadingMessage={labels.loading} loadingRowCount={6} showPagination={false} /> : groups.length === 0 ?
            <Empty reason={filtered ? "no-results" : "no-data"} scope="section" density="compact">
              <EmptyDescription>{filtered ? labels.noResults : labels.empty}</EmptyDescription>
              {filtered && <EmptyActions><Button variant="secondary" onClick={clearFilters}>{labels.clearFilters}</Button></EmptyActions>}
            </Empty> : <div className="space-y-3">{groups.map((group, index) => {
              const value = String(group.groupingValue ?? "");
              const definition = definitions.get(value);
              const label = definition?.label || value || labels.ungrouped;
              const key = JSON.stringify([dimension.columnId, value]);
              const open = !collapsed[key];
              const count = group.subRows.length;
              const headingId = `${id}-${index}-heading`;
              const bodyId = `${id}-${index}-body`;
              return <section key={key} aria-labelledby={headingId} data-slot="table-section" data-group-value={value}>
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-raised px-3 py-2">
                  <div className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-1">
                    <h4 id={headingId} className="flex min-w-0 max-w-full items-center gap-2">
                      <Button variant="ghost" size="sm" iconOnly aria-label={open ? labels.collapseGroup(label) : labels.expandGroup(label)} aria-expanded={open} aria-controls={bodyId} onClick={() => setCollapsed((current) => ({ ...current, [key]: !current[key] }))}>
                        {open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
                      </Button>
                      <Badge color={definition?.color ?? "gray"} variant="plain"><span className="break-all whitespace-normal">{label}</span></Badge>
                      <Badge className="shrink-0" size="sm">{count}</Badge>
                    </h4>
                    {definition?.description && <span className="min-w-0 break-words text-label text-fg-subtle">{definition.description}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {open && count > limit && <Button variant="ghost" size="sm" aria-expanded={Boolean(revealed[key])} onClick={() => setRevealed((current) => ({ ...current, [key]: !current[key] }))}>{revealed[key] ? labels.showLess(label) : labels.showMore(count - limit, label)}</Button>}
                    {onAddToGroup && <Button variant="secondary" size="sm" iconOnly aria-label={labels.addToGroup(label)} onClick={() => onAddToGroup({ columnId: dimension.columnId, value })}><Plus aria-hidden /></Button>}
                  </div>
                </div>
                <div id={bodyId} hidden={!open} className="pt-2">
                  {open && <SectionTable data={(revealed[key] ? group.subRows : group.subRows.slice(0, limit)).map((row) => row.original)} source={table} columnId={dimension.columnId} columns={columns} getRowId={getRowId} activeRowId={activeRowId} onRowActivate={onRowActivate} />}
                </div>
              </section>;
            })}</div>}
        </TabPanel>
      </Tabs>
    </ContainerBody>
    {state === "ready" && <ContainerFooter className="justify-between">
      <div className="flex flex-wrap items-center gap-3">{renderSummary?.(context)}</div>
      <span role="status" aria-atomic="true" className="text-label text-fg-subtle">{labels.results(matching.length, data.length)}</span>
    </ContainerFooter>}
  </Container>;
}
