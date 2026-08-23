import type { ReactNode } from "react";
import type {
  FilterClause,
  FilterClauseValue,
  FilterField,
  FilterOperator,
  FilterOption,
  FilterScalar,
  JSONValue,
} from "#system/filter-core";

export type FilterQueryCommitMode = "immediate" | "debounced" | "submit";
export type FilterQueryMergeMode = "replace-all" | "replace-representable";

export interface FilterQueryValueParseContext {
  field: FilterField;
  queryField: FilterQueryFieldConfig;
  locale?: string;
}

export type FilterQueryValueParseResult =
  | { valid: true; operator: FilterOperator; value?: FilterClauseValue; meta?: Record<string, JSONValue> }
  | { valid: false; message: string };

export type FilterQueryValueParser = (rawValue: string, context: FilterQueryValueParseContext) => FilterQueryValueParseResult;
export type FilterQueryValueSerializer = (clause: Readonly<FilterClause>, context: FilterQueryValueParseContext) => string | undefined;

export interface FilterQueryFieldConfig {
  fieldId: string;
  key?: string;
  aliases?: readonly string[];
  enabled?: boolean;
  /** Keep the field available to the codec while omitting it from field suggestions. */
  suggest?: boolean;
  example?: string;
  parseValue?: FilterQueryValueParser;
  serializeValue?: FilterQueryValueSerializer;
  /** Replaces the field's static or generic async options for query suggestions. */
  loadSuggestions?: FilterQuerySuggestionLoader;
}

export interface FilterQuerySuggestionContext {
  field: FilterField;
  queryField: FilterQueryFieldConfig;
  query: string;
  filters: readonly FilterClause[];
  signal: AbortSignal;
  locale?: string;
}

export interface FilterQuerySuggestionResult {
  options: readonly FilterOption[];
  counts?: ReadonlyMap<FilterScalar, number>;
  hasMore?: boolean;
}

export interface FilterQueryOptionContext {
  field: FilterField;
  queryField: FilterQueryFieldConfig;
  option: FilterOption;
  filters: readonly FilterClause[];
}

export type FilterQuerySuggestionLoader = (
  context: FilterQuerySuggestionContext,
) => Promise<FilterQuerySuggestionResult>;

export interface FilterQueryFreeTextConfig {
  fieldId: string;
  joinWith?: string;
  parse?: (tokens: readonly string[]) => FilterClauseValue;
  serialize?: (value: FilterClauseValue) => string;
}

export interface FilterQueryError {
  message: string;
  start: number;
  end: number;
}

export interface FilterQueryToken {
  kind: "filter" | "text" | "incomplete" | "invalid";
  field?: string;
  queryKey?: string;
  rawValue?: string;
  start: number;
  end: number;
  valueStart?: number;
  valueEnd?: number;
}

export interface FilterQueryParseResult {
  clauses: FilterClause[];
  tokens: FilterQueryToken[];
  errors: readonly FilterQueryError[];
  representedClauseIds: readonly string[];
  complete: boolean;
}

export interface FilterQuerySerializeResult {
  query: string;
  representedClauseIds: readonly string[];
  unsupportedClauses: readonly FilterClause[];
}

export interface FilterQueryCodecContext {
  fields: readonly FilterField[];
  queryFields: readonly FilterQueryFieldConfig[];
  freeText?: false | FilterQueryFreeTextConfig;
  previousFilters: readonly FilterClause[];
  createClauseId: () => string;
  locale?: string;
}

export interface FilterQueryCodec {
  parse(input: string, context: FilterQueryCodecContext): FilterQueryParseResult;
  serialize(filters: readonly FilterClause[], context: FilterQueryCodecContext): FilterQuerySerializeResult;
  replaceToken(input: string, token: FilterQueryToken | undefined, replacement: string): { text: string; caret: number };
}

export interface FilterQuerySuggestion {
  id: string;
  kind: "field" | "option" | "action" | "history" | "custom";
  label: ReactNode;
  textValue: string;
  description?: string;
  field?: FilterField;
  option?: FilterOption;
  disabled?: boolean;
  onSelect?: () => void;
  group?: string;
}

export interface FilterQueryProviderContext {
  stage: "field" | "value" | "complete" | "invalid";
  activeToken?: FilterQueryToken;
  draftText: string;
  field?: FilterField;
  queryField?: FilterQueryFieldConfig;
  filters: readonly FilterClause[];
  signal: AbortSignal;
  locale?: string;
}

/** @deprecated Prefer FilterQueryProviderContext and the async provider contract. */
export interface FilterQuerySuggestionProviderContext {
  activeToken?: FilterQueryToken;
  draftText: string;
  fields: readonly FilterField[];
  parseResult: FilterQueryParseResult;
  queryFields: readonly FilterQueryFieldConfig[];
}

export interface FilterQueryExternalSuggestion {
  id: string;
  group: string;
  label: ReactNode;
  textValue: string;
  description?: string;
  disabled?: boolean;
  apply: (context: FilterQueryProviderContext) =>
    | { replacement: string }
    | { filters: readonly FilterClause[] };
}

export interface FilterQuerySuggestionProvider {
  id: string;
  getSuggestions: (context: FilterQueryProviderContext) => Promise<readonly FilterQueryExternalSuggestion[]>;
}

/** @deprecated Compatibility shape for the first implementation preview. */
export type FilterQueryLegacySuggestionProvider = (
  context: FilterQuerySuggestionProviderContext,
) => readonly FilterQuerySuggestion[];

export interface FilterQueryCommitContext {
  reason: "enter" | "selection" | "clear" | "outside-press" | "debounce";
  query: string;
  representedClauseIds: readonly string[];
  preservedClauses: readonly FilterClause[];
}

export interface FilterQueryHistoryEntry {
  id: string;
  query: string;
  committedAt: number;
  schemaVersion?: string;
}

export interface FilterQueryCoreProps {
  fields: readonly FilterField[];
  queryFields?: readonly FilterQueryFieldConfig[];
  codec?: FilterQueryCodec;
  freeText?: false | FilterQueryFreeTextConfig;
  filters?: readonly FilterClause[];
  defaultFilters?: readonly FilterClause[];
  onFiltersChange?: (filters: FilterClause[], context: FilterQueryCommitContext) => void;
  draftText?: string;
  defaultDraftText?: string;
  onDraftTextChange?: (draftText: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Allow several field clauses in one committed query. Defaults to true. */
  multiple?: boolean;
  allowDuplicateFields?: boolean;
  mergeMode?: FilterQueryMergeMode;
  commitMode?: FilterQueryCommitMode;
  commitDelay?: number;
  optionLoadDelay?: number;
  suggestionLimit?: number;
  suggestionProviders?: readonly (FilterQuerySuggestionProvider | FilterQueryLegacySuggestionProvider)[];
  history?: readonly FilterQueryHistoryEntry[];
  onHistoryChange?: (history: FilterQueryHistoryEntry[]) => void;
  historyLimit?: number;
  historySchemaVersion?: string;
  locale?: string;
}

export interface FilterQueryInputState {
  open: boolean;
  filters: readonly FilterClause[];
  hasExternalConflict: boolean;
  /** True while an existing multi-condition query is waiting for another field. */
  isAddingCondition: boolean;
  draftText: string;
  parseResult: FilterQueryParseResult;
  activeToken?: FilterQueryToken;
  suggestions: readonly FilterQuerySuggestion[];
  optionLoading: boolean;
  optionError?: string;
  highlightedSuggestionId: string;
  setHighlightedSuggestionId: (id: string) => void;
  setDraftText: (text: string, caret?: number) => void;
  setOpen: (open: boolean) => void;
  selectSuggestion: (id: string) => void;
  commit: (reason?: FilterQueryCommitContext["reason"]) => boolean;
  clear: () => void;
  clearHistory: () => void;
  isComposing: boolean;
  setComposing: (composing: boolean) => void;
  revert: () => void;
  retryOptions: () => void;
  getInputProps: () => {
    "aria-activedescendant"?: string;
    "aria-autocomplete": "list";
    "aria-controls": string;
    "aria-expanded": boolean;
    role: "combobox";
  };
  getListProps: () => { id: string; role: "listbox" };
  getSuggestionProps: (id: string) => { "aria-selected": boolean; id: string; role: "option" };
  getListboxProps: () => { id: string; role: "listbox" };
  getOptionProps: (id: string) => { "aria-selected": boolean; id: string; role: "option" };
  caret: number;
  setCaret: (caret: number) => void;
}
