"use client";

import { useMemo, useState } from "react";
import { getExpandedRowModel, type ColumnDef, type ExpandedState } from "@tanstack/react-table";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { ButtonGroup } from "@zeron/ui/button-group";
import { DonutSummary } from "@zeron/ui/chart";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { DataTable, DataTableViewOptions, useDataTable } from "@zeron/ui/data-table";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Empty, EmptyActions, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@zeron/ui/input-group";
import { MenuItem } from "@zeron/ui/menu-item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { calculateResourceCosts, filterResourceCosts, getResourceCostTotal, resourceCostExpansion } from "./resource-cost-data";
import { resourceCostZhLabels } from "./resource-cost-labels";
import type { ResourceCostAvailability, ResourceCostProps, ResourceCostRow } from "./resource-cost-types";

const statuses: ResourceCostAvailability[] = ["available", "reserved", "provisioning", "limited"];
const tones = { available: "neutral", reserved: "info", provisioning: "warning", limited: "danger" } as const;

export function ResourceCost({ items, title, description, summaryLabel, currency = "CNY", locale = "zh-CN", defaultDepth = 2, defaultExpanded: configuredExpansion,
  state = "ready", errorMessage, labels: overrides, onRetry, onExport, onInspect, className, ...props }: ResourceCostProps) {
  const labels = useMemo(() => ({ ...resourceCostZhLabels, ...overrides }), [overrides]);
  const Search = useIcon("search"); const Close = useIcon("x"); const Download = useIcon("arrow-down");
  const ChevronRight = useIcon("chevron-right"); const ChevronDown = useIcon("chevron-down");
  const Clock = useIcon("clock"); const More = useIcon("ellipsis");
  const Cluster = useIcon("doc-surfaces"); const Pool = useIcon("doc-data-grid"); const Gpu = useIcon("brain");
  const Compute = useIcon("monitor"); const Storage = useIcon("file-archive"); const Network = useIcon("globe");
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState<ResourceCostAvailability | "all">("all");
  const [expansion, setExpansion] = useState<{ depth: number | "all" | null; expanded?: ExpandedState }>({ depth: configuredExpansion === undefined ? defaultDepth : null });
  const formatting = useMemo(() => {
    try {
      const money = new Intl.NumberFormat(locale, { style: "currency", currency });
      const unitPrice = new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 20 });
      const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
      return { money, unitPrice, percent, fractionDigits: money.resolvedOptions().maximumFractionDigits };
    } catch { return null; }
  }, [locale, currency]);
  const money = formatting?.money; const percent = formatting?.percent;
  const rows = useMemo(() => {
    if (state !== "ready") return [];
    if (!formatting) return null;
    try { return calculateResourceCosts(items, formatting.fractionDigits); }
    catch { return null; }
  }, [items, formatting, state]);
  const summary = useMemo(() => ({
    total: getResourceCostTotal(rows ?? [], formatting?.fractionDigits),
    count: rows?.reduce((sum, row) => sum + row.leafCount, 0) ?? 0,
    risks: rows?.reduce((sum, row) => sum + row.riskCount, 0) ?? 0,
    days: rows?.reduce((max, row) => Math.max(max, row.readyInDays), 0) ?? 0,
  }), [rows, formatting]);
  const filtered = Boolean(search.trim()) || availability !== "all";
  const data = useMemo(() => filterResourceCosts(rows ?? [], search, availability), [rows, search, availability]);
  const defaultExpanded = useMemo(() => configuredExpansion ?? resourceCostExpansion(rows ?? [], defaultDepth), [rows, defaultDepth, configuredExpansion]);
  const expanded = useMemo(() => expansion.depth === null ? expansion.expanded ?? defaultExpanded : resourceCostExpansion(data, expansion.depth), [expansion, defaultExpanded, data]);
  const ready = state === "ready" && rows !== null;

  const columns = useMemo<ColumnDef<ResourceCostRow, unknown>[]>(() => {
    const icons = { cluster: Cluster, pool: Pool, gpu: Gpu, compute: Compute, storage: Storage, network: Network };
    return [
      { accessorKey: "name", header: labels.resource, enableHiding: false, meta: { label: labels.resource }, cell: ({ row }) => {
        const item = row.original; const Icon = icons[item.kind]; const Chevron = row.getIsExpanded() ? ChevronDown : ChevronRight;
        return <div className="flex min-w-64 items-center gap-2 py-1 text-fg-default" style={{ paddingInlineStart: row.depth * 24 }}>
          {row.getCanExpand() ? <Button iconOnly size="xs" variant="ghost" aria-label={`${row.getIsExpanded() ? labels.collapseRow : labels.expand} ${item.name}`} aria-expanded={row.getIsExpanded()} onClick={row.getToggleExpandedHandler()}><Chevron aria-hidden /></Button> : <span aria-hidden className="size-6 shrink-0" />}
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border-hairline border-border bg-surface-raised text-fg-muted"><Icon aria-hidden className="size-4" /></span>
          <span className={cn("whitespace-nowrap", item.isGroup && "font-medium")}>{item.name}</span>
        </div>;
      } },
      { accessorKey: "code", header: labels.code, meta: { label: labels.code }, cell: ({ row }) => <span className="font-mono text-label text-fg-subtle">{row.original.code}</span> },
      { accessorKey: "quantity", header: () => <div className="text-right">{labels.quantity}</div>, meta: { label: labels.quantity }, cell: ({ row }) => <div className="text-right tabular-nums text-fg-default">{row.original.quantity}</div> },
      { accessorKey: "unitCost", header: () => <div className="text-right">{labels.unitCost}</div>, meta: { label: labels.unitCost }, cell: ({ row }) => <div className="text-right tabular-nums">{row.original.isGroup ? "—" : formatting?.unitPrice.format(row.original.unitCost!)}</div> },
      { accessorKey: "totalCost", header: () => <div className="text-right">{labels.totalCost}</div>, enableHiding: false, meta: { label: labels.totalCost }, cell: ({ row }) => {
        const item = row.original; const share = summary.total > 0 ? item.totalCost / summary.total : 0;
        return <div className="flex items-center justify-end gap-3 tabular-nums">
          {item.isGroup && <span className="flex items-center gap-2 text-label text-fg-subtle"><DonutSummary className="size-5 shrink-0" total={summary.total} segments={[{ id: item.id, label: item.name, value: item.totalCost, color: "var(--fg-default)" }]} aria-label={labels.share(percent?.format(share) ?? "—")} /><span className="w-12 text-right">{percent?.format(share)}</span></span>}
          <span className="min-w-24 text-right font-medium text-fg-default">{money?.format(item.totalCost)}</span>
        </div>;
      } },
      { accessorKey: "readyInDays", header: labels.readyIn, meta: { label: labels.readyIn }, cell: ({ row }) => <Badge size="sm" variant="dot" status={row.original.readyInDays >= 5 ? "warning" : "neutral"} leadingIcon={<Clock aria-hidden className="size-3.5" />}>{labels.days(row.original.readyInDays)}</Badge> },
      { accessorKey: "availability", header: labels.availability, meta: { label: labels.availability }, cell: ({ row }) => <Badge size="sm" status={tones[row.original.availability]}>{labels[row.original.availability]}</Badge> },
      ...(onInspect ? [{ id: "actions", header: () => <span className="sr-only">{labels.actions}</span>, enableHiding: false, cell: ({ row }: { row: { original: ResourceCostRow } }) => <DropdownMenu>
        <DropdownTrigger render={<Button iconOnly size="sm" variant="ghost" aria-label={`${labels.actions} · ${row.original.name}`}><More aria-hidden /></Button>} />
        <DropdownContent align="end"><MenuItem index={0} label={labels.inspect} onSelect={() => {
          const find = (items: readonly ResourceCostRow[]): ResourceCostRow | undefined => {
            for (const item of items) { if (item.id === row.original.id) return item; const child = item.children && find(item.children); if (child) return child; }
          };
          onInspect(find(rows ?? []) ?? row.original);
        }} /></DropdownContent>
      </DropdownMenu> }] : []),
    ];
  }, [labels, formatting, money, percent, summary.total, onInspect, rows, Cluster, Pool, Gpu, Compute, Storage, Network, ChevronDown, ChevronRight, Clock, More]);
  const { table } = useDataTable({ columns, data, getRowId: (row) => row.id, getSubRows: (row) => row.children,
    getExpandedRowModel: getExpandedRowModel(), manualPagination: true, autoResetExpanded: false, enableSorting: false,
    state: { expanded }, onExpandedChange: (updater) => {
      setExpansion((current) => {
        const previous = current.depth === null ? current.expanded ?? defaultExpanded : resourceCostExpansion(data, current.depth);
        return { depth: null, expanded: typeof updater === "function" ? updater(previous) : updater };
      });
    },
  });

  function selectDepth(depth: number | "all") { setExpansion({ depth }); }
  function revealMatches() { setExpansion({ depth: "all" }); }
  function resetFilters() { setSearch(""); setAvailability("all"); setExpansion({ depth: configuredExpansion === undefined ? defaultDepth : null }); }

  return <Container {...props} data-block="resource-cost" data-state={state} className={cn("w-full", className)}>
    <ContainerHeader className="gap-4 py-3">
      <div className="min-w-0"><h2 className="text-body font-medium text-fg-default">{title ?? labels.title}</h2>{description && <p className="mt-1 break-words text-body text-fg-subtle">{description}</p>}</div>
      <div className="flex flex-wrap items-center gap-4 text-label text-fg-muted">
        <span className="flex items-center gap-2">{labels.monthlyCost}<Badge size="sm" color="gray">{ready ? money?.format(summary.total) : "—"}</Badge></span>
        <span className="flex items-center gap-2">{labels.readyIn}<Badge size="sm" color="gray">{ready ? labels.days(summary.days) : "—"}</Badge></span>
        <span className="flex items-center gap-2">{labels.atRisk}<Badge size="sm" status={ready && summary.risks > 0 ? "warning" : "neutral"}>{ready ? summary.risks : "—"}</Badge></span>
        {onExport && <Button variant="secondary" size="sm" leadingIcon={Download} disabled={!ready || !rows?.length} onClick={() => onExport(rows!)}>{labels.export}</Button>}
      </div>
    </ContainerHeader>
    <ContainerBody className="p-3">
      {state === "error" || rows === null ? <div className="space-y-3 p-4"><InlineNotice tone="danger" variant="emphasized" role="alert"><InlineNoticeContent>{errorMessage ?? (rows === null ? labels.invalid : labels.error)}</InlineNoticeContent></InlineNotice>{onRetry && <Button size="sm" variant="secondary" onClick={onRetry}>{labels.retry}</Button>}</div> : <DataTable table={table} showPagination={false} isLoading={state === "loading"} loadingMessage={labels.loading} loadingRowCount={8} emptyState={<Empty reason={filtered ? "no-results" : "no-data"} scope="inline"><EmptyDescription>{filtered ? labels.noResults : labels.empty}</EmptyDescription>{filtered && <EmptyActions><Button size="sm" variant="secondary" onClick={resetFilters}>{labels.reset}</Button></EmptyActions>}</Empty>}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="w-full min-w-0 sm:w-72"><InputGroup><InputGroupAddon><Search aria-hidden /></InputGroupAddon><InputGroupInput type="search" aria-label={labels.search} placeholder={labels.search} value={search} disabled={state === "loading"} onChange={(event) => { setSearch(event.target.value); revealMatches(); }} />{search && <InputGroupAddon align="inline-end"><InputGroupButton iconOnly aria-label={labels.clearSearch} onClick={() => { setSearch(""); revealMatches(); }}><Close aria-hidden /></InputGroupButton></InputGroupAddon>}</InputGroup></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2"><span className="mr-1 text-label text-fg-subtle">{labels.depth}</span><ButtonGroup aria-label={labels.depth}>{([0, 1, 2, "all"] as const).map((value) => <Button key={value} variant="secondary" active={expansion.depth === value} aria-pressed={expansion.depth === value} disabled={state === "loading" || !rows.length} onClick={() => selectDepth(value)}>{value === 0 ? labels.collapse : value === "all" ? labels.all : value}</Button>)}</ButtonGroup></div>
            <div className="flex items-center gap-2"><Select value={availability} disabled={state === "loading"} onValueChange={(value) => { setAvailability(value as ResourceCostAvailability | "all"); revealMatches(); }}><SelectTrigger aria-label={labels.availability} className="min-w-28" /><SelectContent><SelectItem value="all">{labels.allStatuses}</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{labels[status]}</SelectItem>)}</SelectContent></Select>
            <DataTableViewOptions table={table} labels={{ customizeColumns: labels.display, dragToReorder: labels.reorderColumns, reorderColumn: labels.reorderColumn, reorderAndToggle: labels.display, showColumn: (name) => `${labels.display} ${name}` }} /></div>
          </div>
        </div>
      </DataTable>}
    </ContainerBody>
    <ContainerFooter className="justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="text-body font-medium text-fg-default">{summaryLabel ?? title ?? labels.title}</span><Badge size="sm" variant="dot">{ready ? labels.resources(summary.count) : "—"}</Badge></div>
      <div className="flex items-center gap-6 tabular-nums"><span className="text-body font-medium text-fg-default">{ready ? money?.format(summary.total) : "—"}</span><span className="text-label text-fg-muted">{ready ? labels.days(summary.days) : "—"}</span></div>
      {filtered && <p className="w-full text-label text-fg-subtle">{labels.filtered}</p>}
    </ContainerFooter>
  </Container>;
}
