import type { ColumnDef, Row, Table } from "@tanstack/react-table";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BadgeColor } from "@zeron/ui/badge";

export interface SectionedDataTableGroup {
  value: string;
  label: string;
  description?: ReactNode;
  color?: BadgeColor;
}

export interface SectionedDataTableDimension {
  /** Existing column ID. Its accessor must return a stable string. */
  columnId: string;
  label: string;
  /** Presentation order; unknown values are still shown after these groups. */
  groups?: readonly SectionedDataTableGroup[];
}

export interface SectionedDataTableLabels {
  title: string;
  groupBy: string;
  search: string;
  searchPlaceholder: string;
  expandGroup: (label: string) => string;
  collapseGroup: (label: string) => string;
  showMore: (count: number, label: string) => string;
  showLess: (label: string) => string;
  addToGroup: (label: string) => string;
  results: (matching: number, total: number) => string;
  clearFilters: string;
  empty: string;
  noResults: string;
  loading: string;
  error: string;
  retry: string;
  ungrouped: string;
  customizeColumns: string;
  dragToReorder: string;
  reorderAndToggle: string;
  showColumn: (label: string) => string;
  reorderColumn: (label: string) => string;
}

export type SectionedDataTableProps<TData> = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Complete client-side records, before search, sorting and preview limits. */
  data: readonly TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId: (item: TData) => string;
  dimensions: readonly [SectionedDataTableDimension, ...SectionedDataTableDimension[]];
  groupBy?: string;
  defaultGroupBy?: string;
  onGroupByChange?: (columnId: string) => void;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  renderStats?: (context: { rows: Row<TData>[]; total: number }) => ReactNode;
  renderSummary?: (context: { rows: Row<TData>[]; total: number }) => ReactNode;
  renderFilters?: (table: Table<TData>) => ReactNode;
  /** Host owns creation. Omit to hide the per-group add button. */
  onAddToGroup?: (group: { columnId: string; value: string }) => void;
  previewRowCount?: number;
  activeRowId?: string | null;
  onRowActivate?: (item: TData) => void;
  state?: "ready" | "loading" | "error";
  errorMessage?: ReactNode;
  onRetry?: () => void;
  labels?: Partial<SectionedDataTableLabels>;
};
