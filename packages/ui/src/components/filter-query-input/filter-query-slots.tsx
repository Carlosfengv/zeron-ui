import type * as React from "react";
import type { FilterQueryInputState, FilterQuerySuggestion } from "../filter-query-core/filter-query-types";

export interface FilterQueryInputSlotProps {
  content?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
  input?: Omit<React.ComponentPropsWithoutRef<"input">, "onInput" | "onSelect" | "value">;
  item?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
  list?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
  root?: Omit<React.ComponentPropsWithoutRef<"div">, "children">;
  /** @deprecated The control now always renders a native input; use `input` instead. */
  trigger?: Omit<React.ComponentPropsWithoutRef<"button">, "children">;
  fieldItem?: Record<string, unknown>;
  optionItem?: Record<string, unknown>;
  historyItem?: Record<string, unknown>;
  empty?: Record<string, unknown>;
  error?: Record<string, unknown>;
  loading?: Record<string, unknown>;
  footer?: Record<string, unknown>;
}

/** Local visual replacement points; core parsing and keyboard behavior remain unchanged. */
export interface FilterQueryInputSlots {
  /** @deprecated The control now always renders a native input; use `input` instead. */
  trigger?: React.ElementType;
  input?: React.ElementType;
  fieldItem?: React.ElementType;
  optionItem?: React.ElementType;
  historyItem?: React.ElementType;
  error?: React.ElementType;
  loading?: React.ElementType;
  empty?: React.ElementType<{ error?: string; state: FilterQueryInputState }>;
  footer?: React.ElementType<{ state: FilterQueryInputState }>;
  suggestion?: (context: { selected: boolean; state: FilterQueryInputState; suggestion: FilterQuerySuggestion }) => React.ReactNode;
}
