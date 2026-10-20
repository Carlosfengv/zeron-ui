import type { ColumnDef, ExpandedState, OnChangeFn, Row, Table } from "@tanstack/react-table";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BadgeColor } from "@zeron/ui/badge";

export interface GroupedDataTableGroup {
  /** Stable string value stored in the grouping column. Array order defines group order. */
  value: string;
  label: string;
  description?: ReactNode;
  color?: BadgeColor;
}

export interface GroupedDataTableLabels {
  title: string;
  search: string;
  searchPlaceholder: string;
  expandAll: string;
  collapseAll: string;
  expandGroup: (label: string) => string;
  collapseGroup: (label: string) => string;
  showMore: (count: number, label: string) => string;
  showLess: (label: string) => string;
  results: (matching: number, total: number) => string;
  clearFilters: string;
  empty: string;
  noResults: string;
  loading: string;
  error: string;
  retry: string;
  ungrouped: string;
  density: string;
  comfortable: string;
  compact: string;
  customizeColumns: string;
  dragToReorder: string;
  reorderAndToggle: string;
  showColumn: (label: string) => string;
  reorderColumn: (label: string) => string;
}

export type GroupedDataTableProps<TData> = Omit<ComponentPropsWithoutRef<"div">, "children"> & {
  /** Complete client-side dataset. Remote queries must return complete matching groups. */
  data: readonly TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Column ID whose values are stable strings. This block groups one level. */
  groupBy: string;
  getRowId: (item: TData) => string;
  groups?: readonly GroupedDataTableGroup[];
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Direct records initially shown per expanded group. Positive integer; default 3. */
  previewRowCount?: number;
  expanded?: ExpandedState;
  defaultExpanded?: ExpandedState;
  onExpandedChange?: OnChangeFn<ExpandedState>;
  state?: "ready" | "loading" | "error";
  errorMessage?: ReactNode;
  onRetry?: () => void;
  labels?: Partial<GroupedDataTableLabels>;
  /** Compose domain filters from public DataTable controls. */
  renderFilters?: (table: Table<TData>) => ReactNode;
  activeRowId?: string | null;
  onRowActivate?: (item: TData) => void;
  /** Custom domain summary; matching records remain available independently of previews. */
  renderSummary?: (context: { rows: Row<TData>[]; total: number }) => ReactNode;
};
