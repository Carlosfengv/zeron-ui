"use client";

import * as React from "react";
import type { FilterClause, FilterField, FilterOption } from "#system/filter-core";
import { defaultFilterQueryCodec } from "./filter-query-parser";
import { mergeFilterQueryClauses } from "./filter-query-reconcile";
import type {
  FilterQueryCodecContext,
  FilterQueryCoreProps,
  FilterQueryExternalSuggestion,
  FilterQueryFieldConfig,
  FilterQueryInputState,
  FilterQueryProviderContext,
  FilterQuerySuggestion,
  FilterQuerySuggestionProvider,
  FilterQuerySuggestionResult,
} from "./filter-query-types";

const emptySuggestionProviders: readonly NonNullable<FilterQueryCoreProps["suggestionProviders"]>[number][] = [];
const emptyFilters: readonly FilterClause[] = [];

function createClauseId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `filter-${Math.random().toString(36).slice(2, 10)}`;
}

function useControllableState<T>(value: T | undefined, defaultValue: T, onChange?: (value: T) => void) {
  const [internal, setInternal] = React.useState(defaultValue);
  const resolved = value ?? internal;
  const set = React.useCallback((next: T) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  }, [onChange, value]);
  return [resolved, set] as const;
}

function normaliseQueryFields(fields: readonly FilterField[], input?: readonly FilterQueryFieldConfig[]) {
  const source: readonly FilterQueryFieldConfig[] = input ?? fields.map((field) => ({ fieldId: field.id }));
  const fieldIds = new Set(fields.map((field) => field.id));
  const keys = new Map<string, string>();
  return source.filter((config) => {
    if (config.enabled === false || !fieldIds.has(config.fieldId)) return false;
    const names = [config.key ?? config.fieldId, config.fieldId, ...(config.aliases ?? [])]
      .map((name) => name.trim().toLocaleLowerCase())
      .filter(Boolean);
    for (const name of names) {
      const existing = keys.get(name);
      if (existing && existing !== config.fieldId) {
        throw new Error(`Filter query key or alias "${name}" is used by both "${existing}" and "${config.fieldId}".`);
      }
      keys.set(name, config.fieldId);
    }
    return true;
  });
}

function activeTokenAt(tokens: readonly FilterQueryInputState["parseResult"]["tokens"][number][], caret: number) {
  return tokens.find((token) => caret >= token.start && caret <= token.end);
}

function optionText(option: FilterOption) {
  return option.textValue ?? String(option.value);
}

function quoteOption(value: unknown) {
  const text = String(value);
  return /[\s,:]/.test(text) ? `"${text.replace(/[\\"]/g, "\\$&")}"` : text;
}

function unquoteOptionValue(value: string) {
  const trimmed = value.trim();
  return /^(["']).*\1$/.test(trimmed) ? trimmed.slice(1, -1).replace(/\\([\\"'])/g, "$1") : trimmed;
}

function splitCommaValues(value: string) {
  const parts: string[] = [];
  let start = 0;
  let quote: "\"" | "'" | undefined;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (character === "\\") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (character === quote) quote = undefined;
      continue;
    }
    if (character === "\"" || character === "'") {
      quote = character;
      continue;
    }
    if (character === ",") {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts;
}

function historyDescription(committedAt: number, locale?: string) {
  const elapsedSeconds = Math.round((committedAt - Date.now()) / 1_000);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (Math.abs(elapsedSeconds) < 60) return formatter.format(elapsedSeconds, "second");
  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, "minute");
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) return formatter.format(elapsedHours, "hour");
  return formatter.format(Math.round(elapsedHours / 24), "day");
}

function filterSignature(filters: readonly FilterClause[]) {
  return JSON.stringify(filters.map(({ field, id, meta, operator, value }) => ({ field, id, meta: meta ?? null, operator, value: value ?? null })));
}

export function useFilterQueryInput(props: FilterQueryCoreProps): FilterQueryInputState {
  const {
    allowDuplicateFields = false,
    codec = defaultFilterQueryCodec,
    commitDelay = 300,
    commitMode = "submit",
    defaultFilters = emptyFilters,
    defaultOpen = false,
    fields,
    filters: filtersProp,
    freeText = false,
    history: historyProp,
    historyLimit = 5,
    mergeMode = "replace-representable",
    multiple = true,
    optionLoadDelay = 200,
    queryFields: queryFieldsProp,
    suggestionLimit = 100,
    suggestionProviders = emptySuggestionProviders,
  } = props;
  const queryFields = React.useMemo(() => normaliseQueryFields(fields, queryFieldsProp), [fields, queryFieldsProp]);
  const initialContext = React.useMemo<FilterQueryCodecContext>(() => ({ fields, queryFields, freeText, previousFilters: defaultFilters, createClauseId, locale: props.locale }), [defaultFilters, fields, freeText, props.locale, queryFields]);
  const initialDraft = props.defaultDraftText ?? codec.serialize(defaultFilters, initialContext).query;
  const controlledFilters = React.useMemo(() => filtersProp ? [...filtersProp] : undefined, [filtersProp]);
  const controlledHistory = React.useMemo(() => historyProp !== undefined ? [...historyProp] : undefined, [historyProp]);
  const [filters, setFilters] = useControllableState<FilterClause[]>(controlledFilters, [...defaultFilters], undefined);
  const [open, setOpenState] = useControllableState(props.open, defaultOpen, props.onOpenChange);
  const [draftText, setDraftTextState] = useControllableState(props.draftText, initialDraft, props.onDraftTextChange);
  const historyEnabled = historyProp !== undefined || props.onHistoryChange !== undefined;
  const [rawHistory, setHistory] = useControllableState(controlledHistory, [], props.onHistoryChange);
  const [caret, setCaret] = React.useState(initialDraft.length);
  const [highlightedSuggestionId, setHighlightedSuggestionId] = React.useState("");
  const [asyncOptions, setAsyncOptions] = React.useState<readonly FilterOption[]>([]);
  const [asyncCounts, setAsyncCounts] = React.useState<ReadonlyMap<unknown, number>>();
  const [hasMoreOptions, setHasMoreOptions] = React.useState(false);
  const [optionLoading, setOptionLoading] = React.useState(false);
  const [optionError, setOptionError] = React.useState<string>();
  const [optionsRetry, setOptionsRetry] = React.useState(0);
  const [externalSuggestions, setExternalSuggestions] = React.useState<readonly FilterQueryExternalSuggestion[]>([]);
  const [isComposing, setComposing] = React.useState(false);
  const [hasExternalConflict, setHasExternalConflict] = React.useState(false);
  const [isAddingCondition, setIsAddingCondition] = React.useState(false);
  const optionRequestId = React.useRef(0);
  const optionRequestScope = React.useRef<string | undefined>(undefined);
  const lastCommittedDraft = React.useRef(initialDraft);
  const lastKnownFilterSignature = React.useRef(filterSignature(filtersProp ?? defaultFilters));
  const listboxId = React.useId();

  const codecContext = React.useMemo<FilterQueryCodecContext>(() => ({ fields, queryFields, freeText, previousFilters: filters, createClauseId, locale: props.locale }), [fields, filters, freeText, props.locale, queryFields]);
  const incomingFilterSignature = filterSignature(filtersProp ?? filters);

  React.useEffect(() => {
    if (!open) {
      lastKnownFilterSignature.current = incomingFilterSignature;
      setHasExternalConflict(false);
      return;
    }
    if (incomingFilterSignature !== lastKnownFilterSignature.current) {
      lastKnownFilterSignature.current = incomingFilterSignature;
      setHasExternalConflict(true);
    }
  }, [incomingFilterSignature, open]);
  const parseResult = React.useMemo(() => codec.parse(draftText, codecContext), [codec, codecContext, draftText]);
  const activeToken = React.useMemo(() => activeTokenAt(parseResult.tokens, caret), [caret, parseResult.tokens]);
  const fieldMap = React.useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);
  const configByField = React.useMemo(() => new Map(queryFields.map((config) => [config.fieldId, config])), [queryFields]);

  const optionRequest = React.useMemo(() => {
    if (!open || !activeToken?.field || activeToken.valueStart === undefined) return;
    const field = fieldMap.get(activeToken.field);
    if (!field) return;
    const queryField = configByField.get(field.id);
    const fieldLoader = field.type === "select" || field.type === "multiSelect" ? field.loadOptions : undefined;
    const loader = queryField?.loadSuggestions ?? fieldLoader;
    if (!loader || !queryField) return;
    return { field, loader, queryField, search: activeToken.rawValue ?? "", usesQueryLoader: Boolean(queryField.loadSuggestions) };
  }, [activeToken, configByField, fieldMap, open]);

  React.useEffect(() => {
    if (!optionRequest) {
      optionRequestScope.current = undefined;
      setOptionLoading(false);
      setOptionError(undefined);
      setAsyncCounts(undefined);
      setHasMoreOptions(false);
      return;
    }
    const controller = new AbortController();
    const requestId = ++optionRequestId.current;
    const requestScope = JSON.stringify([optionRequest.field.id, optionRequest.search]);
    const isBackgroundRefresh = optionRequestScope.current === requestScope;
    optionRequestScope.current = requestScope;
    setOptionLoading(true);
    setOptionError(undefined);
    if (!isBackgroundRefresh) {
      setAsyncOptions([]);
      setAsyncCounts(undefined);
      setHasMoreOptions(false);
    }
    const timer = window.setTimeout(() => {
      const load: Promise<FilterQuerySuggestionResult> = optionRequest.usesQueryLoader
        ? (optionRequest.loader as NonNullable<FilterQueryFieldConfig["loadSuggestions"]>)({
          field: optionRequest.field,
          queryField: optionRequest.queryField,
          query: optionRequest.search,
          filters,
          signal: controller.signal,
          locale: props.locale,
        })
        : (optionRequest.loader as NonNullable<Extract<FilterField, { type: "select" | "multiSelect" }>["loadOptions"]>)(optionRequest.search, { field: optionRequest.field as Extract<FilterField, { type: "select" | "multiSelect" }>, signal: controller.signal })
          .then((options) => ({ options } satisfies FilterQuerySuggestionResult));
      load
        .then((result) => {
          if (controller.signal.aborted || requestId !== optionRequestId.current) return;
          setAsyncOptions(result.options);
          setAsyncCounts(result.counts);
          setHasMoreOptions(Boolean(result.hasMore));
          setOptionLoading(false);
        })
        .catch((reason: unknown) => {
          if (controller.signal.aborted || requestId !== optionRequestId.current) return;
          setOptionError(reason instanceof Error ? reason.message : "Unable to load filter values.");
          setOptionLoading(false);
        });
    }, optionLoadDelay);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [filters, optionLoadDelay, optionRequest, optionsRetry, props.locale]);

  const providerContext = React.useMemo<FilterQueryProviderContext>(() => {
    const field = activeToken?.field ? fieldMap.get(activeToken.field) : undefined;
    const queryField = field ? configByField.get(field.id) : undefined;
    return {
      stage: parseResult.errors.length ? "invalid" : activeToken?.field && activeToken.valueStart !== undefined ? "value" : parseResult.complete && draftText.trim() ? "complete" : "field",
      activeToken,
      draftText,
      field,
      queryField,
      filters,
      signal: new AbortController().signal,
      locale: props.locale,
    };
  }, [activeToken, configByField, draftText, fieldMap, filters, parseResult.complete, parseResult.errors.length, props.locale]);

  React.useEffect(() => {
    const providers = suggestionProviders.filter((provider): provider is FilterQuerySuggestionProvider => typeof provider !== "function");
    if (!open || !providers.length || isComposing) {
      setExternalSuggestions((current) => current.length ? [] : current);
      return;
    }
    const controller = new AbortController();
    Promise.all(providers.map(async (provider) => provider.getSuggestions({ ...providerContext, signal: controller.signal })))
      .then((results) => {
        if (!controller.signal.aborted) setExternalSuggestions(results.flat());
      })
      .catch(() => {
        if (!controller.signal.aborted) setExternalSuggestions([]);
      });
    return () => controller.abort();
  }, [isComposing, open, providerContext, suggestionProviders]);

  React.useEffect(() => {
    if (open) return;
    const next = codec.serialize(filters, codecContext).query;
    setDraftTextState(next);
    setCaret(next.length);
  }, [codec, codecContext, filters, open, setDraftTextState]);

  const setDraftText = React.useCallback((text: string, nextCaret = text.length) => {
    if (text !== draftText) lastCommittedDraft.current = "";
    setIsAddingCondition(false);
    setDraftTextState(text);
    setCaret(nextCaret);
  }, [draftText, setDraftTextState]);
  const setOpen = React.useCallback((nextOpen: boolean) => {
    if (nextOpen && filters.length && parseResult.complete) {
      setIsAddingCondition(multiple);
    } else if (!nextOpen) {
      setIsAddingCondition(false);
    }
    setOpenState(nextOpen);
  }, [filters.length, multiple, parseResult.complete, setOpenState]);
  const history = React.useMemo(() => {
    if (!historyEnabled) return [];
    return [...rawHistory]
      .sort((left, right) => right.committedAt - left.committedAt)
      .filter((entry) => codec.parse(entry.query, { ...codecContext, previousFilters: [] }).complete);
  }, [codec, codecContext, historyEnabled, rawHistory]);
  const clearHistory = React.useCallback(() => {
    if (historyEnabled) setHistory([]);
  }, [historyEnabled, setHistory]);
  const retryOptions = React.useCallback(() => setOptionsRetry((count) => count + 1), []);
  const clear = React.useCallback(() => {
    lastCommittedDraft.current = "";
    lastKnownFilterSignature.current = filterSignature([]);
    setDraftText("");
    setFilters([]);
    props.onFiltersChange?.([], { reason: "clear", query: "", representedClauseIds: [], preservedClauses: [] });
  }, [props, setDraftText, setFilters]);

  const suggestions = React.useMemo<FilterQuerySuggestion[]>(() => {
    const result: FilterQuerySuggestion[] = [];
    if (isComposing) return result;
    const used = new Set(parseResult.clauses.map((clause) => clause.field));
    const tokenHasValue = Boolean(activeToken?.field && activeToken.valueStart !== undefined);
    const isAtNewToken = !activeToken && (caret === 0 || /\s$/.test(draftText.slice(0, caret)));

    const addFieldSuggestions = (search: string) => {
      for (const config of queryFields) {
        const field = fieldMap.get(config.fieldId);
        if (
          !field
          || config.suggest === false
          || field.disabled
          || (tokenHasValue && field.id === activeToken?.field)
          || (!allowDuplicateFields && used.has(field.id))
        ) continue;
        const names = [field.label, field.id, config.key ?? field.id, ...(config.aliases ?? []), field.description ?? ""].join(" ").toLocaleLowerCase();
        if (search && !names.includes(search)) continue;
        result.push({ id: `field:${field.id}`, kind: "field", label: field.label, textValue: field.label, description: field.description, field });
      }
    };

    if (tokenHasValue && activeToken?.field && !isAddingCondition) {
      const field = fieldMap.get(activeToken.field);
      const config = configByField.get(activeToken.field);
      const valueParts = splitCommaValues(activeToken.rawValue ?? "");
      const search = unquoteOptionValue(valueParts.at(-1) ?? "").toLocaleLowerCase();
      if (field && config && (field.type === "select" || field.type === "multiSelect" || Boolean(config.loadSuggestions))) {
        const hasFieldLoader = (field.type === "select" || field.type === "multiSelect") && Boolean(field.loadOptions);
        const selectedValues = new Set(
          field.type === "multiSelect"
            ? valueParts.slice(0, -1).map(unquoteOptionValue).filter(Boolean)
            : [],
        );
        const options = config.loadSuggestions || hasFieldLoader ? asyncOptions : (field.type === "select" || field.type === "multiSelect") ? field.options ?? [] : [];
        for (const option of options.slice(0, suggestionLimit)) {
          const text = optionText(option);
          if (selectedValues.has(String(option.value))) continue;
          if (!config.loadSuggestions && !hasFieldLoader && !text.toLocaleLowerCase().includes(search)) continue;
          const count = asyncCounts?.get(option.value);
          result.push({ id: `option:${field.id}:${encodeURIComponent(String(option.value))}`, kind: "option", label: option.label, textValue: text, option: count === undefined ? option : { ...option, metadata: { ...option.metadata, count } }, field, disabled: option.disabled });
        }
      }
    } else {
      const search = (isAddingCondition ? "" : activeToken?.rawValue ?? (isAtNewToken ? "" : draftText.slice(0, caret).trim())).toLocaleLowerCase();
      addFieldSuggestions(search);
    }

    if (history.length) {
      const historySearch = draftText.trim().toLocaleLowerCase();
      const matchingHistory = history
        .filter((entry) => !historySearch || entry.query.toLocaleLowerCase().includes(historySearch))
        .slice(0, historyLimit);
      for (const entry of matchingHistory) {
        result.push({
          id: `history:${entry.id}`,
          kind: "history",
          label: entry.query,
          textValue: entry.query,
          description: historyDescription(entry.committedAt, props.locale),
        });
      }
      if (matchingHistory.length) {
        result.push({ id: "action:clear-history", kind: "action", label: "Clear history", textValue: "Clear history", onSelect: clearHistory });
      }
    }
    if (!isAddingCondition && commitMode === "submit" && draftText.trim() && parseResult.complete && (multiple || parseResult.clauses.length <= 1)) {
      result.unshift({ id: "action:submit", kind: "action", label: "Apply filters", textValue: "Apply filters" });
    }
    if (filters.length) {
      result.push({ id: "action:clear", kind: "action", label: "Clear filters", textValue: "Clear filters", onSelect: clear });
    }
    if (optionError) {
      result.unshift({ id: "action:retry-options", kind: "action", label: "Retry loading values", textValue: "Retry loading values", description: optionError, onSelect: retryOptions });
    }
    const legacyContext = { activeToken, draftText, fields, parseResult, queryFields };
    for (const provider of suggestionProviders) {
      if (typeof provider !== "function") continue;
      for (const suggestion of provider(legacyContext)) {
        if (!result.some((candidate) => candidate.id === suggestion.id)) result.push(suggestion);
      }
    }
    for (const suggestion of externalSuggestions) {
      if (!result.some((candidate) => candidate.id === `external:${suggestion.id}`)) {
        result.push({ id: `external:${suggestion.id}`, kind: "custom", label: suggestion.label, textValue: suggestion.textValue, description: suggestion.description, disabled: suggestion.disabled, group: suggestion.group });
      }
    }
    if (hasMoreOptions) result.push({ id: "action:more-options", kind: "action", label: "Refine your search to see more values", textValue: "Refine your search", disabled: true });
    return result;
  }, [activeToken, allowDuplicateFields, asyncCounts, asyncOptions, caret, clear, clearHistory, commitMode, configByField, draftText, externalSuggestions, fieldMap, fields, filters.length, hasMoreOptions, history, historyLimit, isAddingCondition, isComposing, multiple, optionError, parseResult, props.locale, queryFields, retryOptions, suggestionLimit, suggestionProviders]);

  React.useEffect(() => {
    if (suggestions.some((suggestion) => suggestion.id === highlightedSuggestionId)) return;
    setHighlightedSuggestionId(suggestions.find((suggestion) => !suggestion.disabled)?.id ?? "");
  }, [highlightedSuggestionId, suggestions]);

  const commit = React.useCallback((reason: "enter" | "selection" | "clear" | "outside-press" | "debounce" = "enter") => {
    if (isComposing || !parseResult.complete || (!multiple && parseResult.clauses.length > 1)) return false;
    if ((reason === "outside-press" || reason === "debounce") && lastCommittedDraft.current === draftText) return true;
    const serialized = codec.serialize(filters, codecContext);
    const next = mergeFilterQueryClauses(filters, parseResult.clauses, serialized, mergeMode);
    setFilters(next);
    lastKnownFilterSignature.current = filterSignature(next);
    lastCommittedDraft.current = draftText;
    if (historyEnabled && draftText.trim()) {
      const nextHistory = [{ id: createClauseId(), query: draftText, committedAt: Date.now(), schemaVersion: props.historySchemaVersion }, ...history.filter((entry) => entry.query !== draftText)]
        .slice(0, historyLimit);
      setHistory(nextHistory);
    }
    props.onFiltersChange?.(next, { reason, query: draftText, representedClauseIds: parseResult.representedClauseIds, preservedClauses: serialized.unsupportedClauses });
    return true;
  }, [codec, codecContext, draftText, filters, history, historyEnabled, historyLimit, isComposing, mergeMode, multiple, parseResult.clauses, parseResult.complete, parseResult.representedClauseIds, props, setFilters, setHistory]);

  React.useEffect(() => {
    if (!open || isComposing || commitMode !== "debounced" || !draftText.trim() || !parseResult.complete || lastCommittedDraft.current === draftText) return;
    const timer = window.setTimeout(() => commit("debounce"), commitDelay);
    return () => window.clearTimeout(timer);
  }, [commit, commitDelay, commitMode, draftText, isComposing, open, parseResult.complete]);

  React.useEffect(() => {
    if (!open || isComposing || commitMode !== "immediate") return;
    if (!draftText.trim()) {
      if (filters.length) clear();
      return;
    }
    if (parseResult.complete && lastCommittedDraft.current !== draftText) commit("selection");
  }, [clear, commit, commitMode, draftText, filters.length, isComposing, open, parseResult.complete]);

  const selectSuggestion = React.useCallback((id: string) => {
    const suggestion = suggestions.find((item) => item.id === id);
    if (!suggestion || suggestion.disabled) return;
    if (suggestion.onSelect) {
      suggestion.onSelect();
      return;
    }
    if (suggestion.kind === "action") {
      commit("selection");
      return;
    }
    if (suggestion.kind === "history") {
      const query = String(suggestion.textValue);
      const historyParseResult = codec.parse(query, codecContext);
      if (!historyParseResult.complete || (!multiple && historyParseResult.clauses.length > 1)) return;
      const serialized = codec.serialize(filters, codecContext);
      const next = mergeFilterQueryClauses(filters, historyParseResult.clauses, serialized, mergeMode);
      setDraftText(query);
      setFilters(next);
      lastKnownFilterSignature.current = filterSignature(next);
      lastCommittedDraft.current = query;
      if (historyEnabled) {
        const entry = history.find((item) => `history:${item.id}` === suggestion.id);
        const nextHistory = entry
          ? [{ ...entry, committedAt: Date.now() }, ...history.filter((item) => item.id !== entry.id)].slice(0, historyLimit)
          : history;
        setHistory(nextHistory);
      }
      props.onFiltersChange?.(next, { reason: "selection", query, representedClauseIds: historyParseResult.representedClauseIds, preservedClauses: serialized.unsupportedClauses });
      return;
    }
    if (suggestion.kind === "custom") {
      const external = externalSuggestions.find((item) => `external:${item.id}` === suggestion.id);
      if (!external) return;
      const applied = external.apply(providerContext);
      if ("replacement" in applied) {
        const next = codec.replaceToken(draftText, activeToken, applied.replacement);
        setDraftText(next.text, next.caret);
      } else {
        const next = [...applied.filters];
        setFilters(next);
        lastKnownFilterSignature.current = filterSignature(next);
        props.onFiltersChange?.(next, { reason: "selection", query: draftText, representedClauseIds: next.map((clause) => clause.id), preservedClauses: [] });
      }
      return;
    }
    if (suggestion.kind === "field" && suggestion.field) {
      const config = configByField.get(suggestion.field.id)!;
      const replacement = `${config.key ?? suggestion.field.id}:`;
      if (!multiple && parseResult.clauses.length) {
        setDraftText(replacement, replacement.length);
        return;
      }
      const next = codec.replaceToken(draftText, isAddingCondition ? undefined : activeToken, replacement);
      setDraftText(next.text, next.caret);
      return;
    }
    if (suggestion.kind === "option" && suggestion.field && suggestion.option) {
      const config = configByField.get(suggestion.field.id)!;
      const selectedValue = quoteOption(suggestion.option.value);
      const replacementValue = suggestion.field.type === "multiSelect"
        ? [...splitCommaValues(activeToken?.rawValue ?? "").slice(0, -1).map((value) => value.trim()).filter(Boolean), selectedValue].join(",")
        : selectedValue;
      const replacement = `${config.key ?? suggestion.field.id}:${replacementValue}`;
      const next = codec.replaceToken(draftText, activeToken, replacement);
      setDraftText(next.text, next.caret);
      if (commitMode === "immediate") window.queueMicrotask(() => commit("selection"));
    }
  }, [activeToken, codec, codecContext, commit, commitMode, configByField, draftText, externalSuggestions, filters, history, historyEnabled, historyLimit, isAddingCondition, mergeMode, multiple, parseResult.clauses.length, props, providerContext, setDraftText, setFilters, setHistory, suggestions]);

  const revert = React.useCallback(() => {
    const next = codec.serialize(filters, codecContext).query;
    setDraftText(next);
  }, [codec, codecContext, filters, setDraftText]);

  return {
    open,
    filters,
    hasExternalConflict,
    isAddingCondition,
    draftText,
    parseResult,
    activeToken,
    suggestions,
    optionLoading,
    optionError,
    highlightedSuggestionId,
    setHighlightedSuggestionId,
    setDraftText,
    setOpen,
    selectSuggestion,
    commit,
    clear,
    clearHistory,
    isComposing,
    setComposing,
    revert,
    retryOptions,
    getInputProps: () => ({
      "aria-activedescendant": highlightedSuggestionId ? `${listboxId}-${highlightedSuggestionId}` : undefined,
      "aria-autocomplete": "list",
      "aria-controls": listboxId,
      "aria-expanded": open,
      role: "combobox",
    }),
    getListProps: () => ({ id: listboxId, role: "listbox" }),
    getSuggestionProps: (id) => ({
      "aria-selected": highlightedSuggestionId === id,
      id: `${listboxId}-${id}`,
      role: "option",
    }),
    getListboxProps: () => ({ id: listboxId, role: "listbox" }),
    getOptionProps: (id) => ({
      "aria-selected": highlightedSuggestionId === id,
      id: `${listboxId}-${id}`,
      role: "option",
    }),
    caret,
    setCaret,
  };
}
