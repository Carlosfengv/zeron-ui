"use client";

import type { ComponentPropsWithoutRef } from "react";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./select";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";

export interface ListPaginationLabels {
  total: (total: number) => string;
  rowsPerPage: string;
  pageSize: string;
  pageSummary: (page: number, pageCount: number) => string;
  firstPage: string;
  previousPage: string;
  nextPage: string;
  lastPage: string;
}
export interface ListPaginationProps extends Omit<ComponentPropsWithoutRef<"footer">, "onChange"> {
  /** Zero-based page index; data slicing stays with the consumer. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: readonly number[];
  labels?: Partial<ListPaginationLabels>;
  disabled?: boolean;
}
const defaultLabels: ListPaginationLabels = {
  total: total => `共 ${total} 条`, rowsPerPage: "每页显示", pageSize: "每页显示条数",
  pageSummary: (page, count) => `第 ${page} 页，共 ${count} 页`,
  firstPage: "首页", previousPage: "上一页", nextPage: "下一页", lastPage: "末页",
};

/** A controlled pager for non-table lists; never owns queries or records. */
export function ListPagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizeOptions = [5, 10, 20, 50], labels, disabled = false, className, ...props }: ListPaginationProps) {
  const First = useIcon("chevrons-left"); const Previous = useIcon("chevron-left"); const Next = useIcon("chevron-right"); const Last = useIcon("chevrons-right");
  const copy = { ...defaultLabels, ...labels };
  const safeTotal = Number.isFinite(total) ? Math.max(0, Math.floor(total)) : 0;
  const safeSize = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 5;
  const pageCount = Math.max(1, Math.ceil(safeTotal / safeSize));
  const currentPage = Math.max(0, Math.min(Number.isFinite(page) ? Math.floor(page) : 0, pageCount - 1));
  const options = Array.from(new Set([...pageSizeOptions, safeSize].filter(size => Number.isInteger(size) && size > 0))).sort((a, b) => a - b);
  return <footer {...props} data-slot="list-pagination" className={cn("flex min-h-control-xl flex-wrap items-center justify-end gap-3 border-t-hairline border-border px-3 py-1.5 text-label text-fg-muted", className)}>
    <span>{copy.total(safeTotal)}</span><span>{copy.rowsPerPage}</span>
    <Select disabled={disabled} itemDensity="compact" onValueChange={value => onPageSizeChange(Number(value))} size="sm" value={`${safeSize}`}><SelectTrigger aria-label={copy.pageSize} className="w-18 min-w-18" /><SelectContent>{options.map(size => <SelectItem key={size} value={`${size}`}>{size}</SelectItem>)}</SelectContent></Select>
    <span className="tabular-nums">{copy.pageSummary(currentPage + 1, pageCount)}</span><div className="flex items-center gap-2">
      <Button aria-label={copy.firstPage} disabled={disabled || currentPage === 0} iconOnly onClick={() => onPageChange(0)} size="sm" type="button" variant="tertiary"><First aria-hidden /></Button>
      <Button aria-label={copy.previousPage} disabled={disabled || currentPage === 0} iconOnly onClick={() => onPageChange(currentPage - 1)} size="sm" type="button" variant="tertiary"><Previous aria-hidden /></Button>
      <Button aria-label={copy.nextPage} disabled={disabled || currentPage === pageCount - 1} iconOnly onClick={() => onPageChange(currentPage + 1)} size="sm" type="button" variant="tertiary"><Next aria-hidden /></Button>
      <Button aria-label={copy.lastPage} disabled={disabled || currentPage === pageCount - 1} iconOnly onClick={() => onPageChange(pageCount - 1)} size="sm" type="button" variant="tertiary"><Last aria-hidden /></Button>
    </div>
  </footer>;
}
