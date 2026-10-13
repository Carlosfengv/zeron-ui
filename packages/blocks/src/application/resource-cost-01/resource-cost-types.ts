import type { ComponentPropsWithoutRef } from "react";
import type { ExpandedState } from "@tanstack/react-table";

export type ResourceCostAvailability = "available" | "reserved" | "provisioning" | "limited";
export type ResourceCostKind = "cluster" | "pool" | "gpu" | "compute" | "storage" | "network";

export interface ResourceCostItem {
  /** Stable and unique across the entire tree. */
  id: string;
  name: string;
  code: string;
  kind: ResourceCostKind;
  quantity: number;
  /** Monthly price per unit in the main currency unit. Required for leaves. */
  unitCost?: number;
  availability?: ResourceCostAvailability;
  readyInDays?: number;
  children?: readonly ResourceCostItem[];
}

export interface ResourceCostRow extends Omit<ResourceCostItem, "children" | "availability" | "readyInDays"> {
  availability: ResourceCostAvailability;
  readyInDays: number;
  totalCost: number;
  leafCount: number;
  riskCount: number;
  isGroup: boolean;
  children?: ResourceCostRow[];
}

export interface ResourceCostLabels {
  title: string;
  monthlyCost: string;
  readyIn: string;
  atRisk: string;
  export: string;
  search: string;
  clearSearch: string;
  depth: string;
  collapse: string;
  all: string;
  availability: string;
  allStatuses: string;
  display: string;
  reorderColumns: string;
  reorderColumn: (name: string) => string;
  resource: string;
  code: string;
  quantity: string;
  unitCost: string;
  totalCost: string;
  available: string;
  reserved: string;
  provisioning: string;
  limited: string;
  expand: string;
  collapseRow: string;
  actions: string;
  inspect: string;
  empty: string;
  noResults: string;
  reset: string;
  loading: string;
  error: string;
  invalid: string;
  retry: string;
  resources: (count: number) => string;
  days: (count: number) => string;
  share: (percent: string) => string;
  filtered: string;
}

export interface ResourceCostProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  items: readonly ResourceCostItem[];
  title?: string;
  description?: string;
  summaryLabel?: string;
  currency?: string;
  locale?: string;
  /** Default expansion opens ancestors above this zero-based row depth. */
  defaultDepth?: number | "all";
  /** Optional per-resource initial expansion, taking precedence over defaultDepth. */
  defaultExpanded?: ExpandedState;
  state?: "ready" | "loading" | "error";
  errorMessage?: string;
  labels?: Partial<ResourceCostLabels>;
  onRetry?: () => void;
  /** Receives the full calculated tree, regardless of search or expansion. */
  onExport?: (rows: readonly ResourceCostRow[]) => void;
  onInspect?: (row: ResourceCostRow) => void;
}
