import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BuiltInFilterOperator, FilterClause, FilterField } from "#system/filter-core";
import type { ControlSize } from "../../tokens/control-size";

export type * from "#system/filter-core";

export type FilterLogic = "and" | "or";

export interface FilterBuilderMessages {
  addFilter: string;
  clearFilters: string;
  searchFields: string;
  searchOptions: string;
  noFields: string;
  noOptions: string;
  loadingOptions: string;
  loadOptionsError: string;
  retry: string;
  removeFilter: (fieldLabel: string) => string;
  selectedCount: (count: number) => string;
  matchAll: string;
  matchAny: string;
  operators: Record<BuiltInFilterOperator, string>;
}

export type FilterBuilderMessagesInput = Omit<Partial<FilterBuilderMessages>, "operators"> & {
  operators?: Partial<Record<BuiltInFilterOperator, string>>;
};

export interface FilterBuilderProps extends Omit<ComponentPropsWithoutRef<"div">, "defaultValue" | "onChange"> {
  fields: readonly FilterField[];
  filters?: readonly FilterClause[];
  defaultFilters?: readonly FilterClause[];
  onFiltersChange?: (filters: FilterClause[]) => void;
  logic?: FilterLogic;
  defaultLogic?: FilterLogic;
  onLogicChange?: (logic: FilterLogic) => void;
  supportedLogic?: readonly FilterLogic[];
  showLogic?: boolean;
  size?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  allowDuplicateFields?: boolean;
  maxFilters?: number;
  trigger?: ReactNode;
  messages?: FilterBuilderMessagesInput;
  locale?: string;
}

export interface FilterState {
  filters: FilterClause[];
  logic: FilterLogic;
}

export interface FilterStateParseResult {
  state: FilterState;
  error?: string;
}
