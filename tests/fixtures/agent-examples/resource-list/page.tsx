"use client";

import { useCallback, useEffect, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "#components/badge";
import { Button } from "#components/button";
import { DataTable, DataTableColumnHeader, useDataTable } from "#components/data-table";
import { Input } from "#components/input";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemTitle } from "#components/info-item";
import { PageBody, PageContent, PageDescription, PageHeader, PageHeaderContent, PageLayout, PageTitle } from "#components/page-layout";
import { Select, SelectContent, SelectItem, SelectTrigger } from "#components/select";
import { ExampleApiError, type ExampleApi, type Resource, type ResourceQuery } from "../shared/contracts";
import { EmptyResources, ExampleError } from "../shared/notices";
import { useLatestRequest } from "../shared/use-latest-request";

export interface ResourceListPageProps {
  api: ExampleApi;
  query: ResourceQuery;
  onQueryChange: (query: ResourceQuery) => void;
  onOpenResource: (id: string, returnQuery: ResourceQuery) => void;
}

export function ResourceListPage({ api, query, onQueryChange, onOpenResource }: ResourceListPageProps) {
  const load = useCallback((signal: AbortSignal) => api.list(query, signal), [api, query]);
  const request = useLatestRequest(JSON.stringify(query), load);
  const forbidden = request.error instanceof ExampleApiError && request.error.code === "forbidden";
  const rows = forbidden ? [] : request.data?.items ?? [];
  const total = forbidden ? 0 : request.data?.total ?? 0;
  const columns = useMemo<ColumnDef<Resource, unknown>[]>(() => [
    { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />, cell: ({ row }) => <InfoItem><InfoItemContent><InfoItemTitle><Button variant="link" size="sm" onClick={() => onOpenResource(row.original.id, query)}>{row.original.name}</Button></InfoItemTitle><InfoItemDescription>{row.original.id}</InfoItemDescription></InfoItemContent></InfoItem> },
    { accessorKey: "status", header: "Status", enableSorting: false, cell: ({ row }) => <Badge status={row.original.status === "active" ? "success" : "warning"}>{row.original.status === "active" ? "Active" : "Paused"}</Badge> },
    { accessorKey: "updatedAt", header: ({ column }) => <DataTableColumnHeader column={column} label="Updated" />, cell: ({ row }) => <time dateTime={row.original.updatedAt}>{row.original.updatedAt.slice(0, 10)}</time> },
  ], [onOpenResource, query]);
  const { table } = useDataTable({ data: rows, columns, getRowId: row => row.id, rowCount: total,
    manualFiltering: true, manualSorting: true, manualPagination: true, enableRowSelection: false, enableHiding: false,
    state: { pagination: { pageIndex: query.pageIndex, pageSize: query.pageSize }, sorting: [{ id: query.sort, desc: query.direction === "desc" }] },
    onPaginationChange: updater => {
      const next = typeof updater === "function" ? updater({ pageIndex: query.pageIndex, pageSize: query.pageSize }) : updater;
      onQueryChange({ ...query, ...next, pageIndex: next.pageSize !== query.pageSize ? 0 : next.pageIndex });
    },
    onSortingChange: updater => {
      const next = typeof updater === "function" ? updater([{ id: query.sort, desc: query.direction === "desc" }]) : updater;
      const sort = next[0];
      onQueryChange({ ...query, sort: sort?.id === "updatedAt" ? "updatedAt" : "name", direction: sort?.desc ? "desc" : "asc", pageIndex: 0 });
    },
  });
  useEffect(() => {
    if (!request.loading && !request.error && request.data && query.pageIndex > Math.max(0, Math.ceil(total / query.pageSize) - 1)) onQueryChange({ ...query, pageIndex: Math.max(0, Math.ceil(total / query.pageSize) - 1) });
  }, [request.loading, request.error, request.data, query, total, onQueryChange]);
  return <PageLayout><PageHeader><PageHeaderContent><div className="min-w-0"><PageTitle>Resources</PageTitle><PageDescription>Search your inventory and open a resource to review its configuration.</PageDescription></div></PageHeaderContent></PageHeader><PageContent><PageBody>
    {Boolean(request.error) && <ExampleError error={request.error} onRetry={request.reload} />}
    {!forbidden && <DataTable table={table} isLoading={request.loading} loadingMessage="Loading resources" emptyState={request.error ? <span>No data available.</span> : <EmptyResources filtered={Boolean(query.search || query.status !== "all")} />} onRowActivate={row => onOpenResource(row.original.id, query)}>
      <div className="flex min-w-0 flex-wrap items-end justify-between gap-3" role="group" aria-label="Resource controls">
        <div className="flex min-w-0 flex-1 flex-wrap items-end gap-3"><label className="flex min-w-0 flex-1 flex-col gap-1.5"><span className="text-label text-fg-muted">Search resources</span><Input value={query.search} onChange={event => onQueryChange({ ...query, search: event.target.value, pageIndex: 0 })} placeholder="Search by name" /></label>
          <div className="flex flex-col gap-1.5"><span className="text-label text-fg-muted" id="resource-status-label">Status</span><Select value={query.status} onValueChange={value => onQueryChange({ ...query, status: value === "active" || value === "paused" ? value : "all", pageIndex: 0 })}><SelectTrigger aria-labelledby="resource-status-label" /><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem></SelectContent></Select></div></div>
        <Button variant="secondary" onClick={request.reload} disabled={request.loading}>Refresh</Button>
      </div>
    </DataTable>}
  </PageBody></PageContent></PageLayout>;
}
