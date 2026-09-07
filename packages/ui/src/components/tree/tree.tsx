"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from "framer-motion";
import { Button } from "../button";
import { cn } from "#system/utils";
import { useIcon } from "#system/icon-context";
import { spring } from "#system/springs";
import { buildTreeModel, filteredKeys, matchedKeys, matchingAncestors, subtreeKeys, visibleRows } from "./tree-model";
import { checkStates, nextSelection, selectionDetails } from "./tree-selection";
import {
  defaultTreeMessages,
  type TreeChangeDetails,
  type TreeKey,
  type TreeProps,
  type TreeRenderContext,
  type TreeRow,
} from "./tree-types";

const densityClasses = {
  compact: "min-h-control-sm text-label",
  regular: "min-h-control-md text-body",
  comfortable: "min-h-control-xl text-body",
} as const;

function orderedUnique(keys: readonly TreeKey[]) {
  return [...new Set(keys)];
}

function configurationError(
  selectionMode: TreeProps<unknown>["selectionMode"],
  selectionIndicator: TreeProps<unknown>["selectionIndicator"],
  checkStrategy: TreeProps<unknown>["checkStrategy"],
  selectedKeys: readonly TreeKey[] | undefined,
  defaultSelectedKeys: readonly TreeKey[] | undefined,
  onSelectionChange: unknown,
  ariaLabel: string | undefined,
  ariaLabelledBy: string | undefined,
  indent: number,
) {
  if (!ariaLabel?.trim() && !ariaLabelledBy?.trim()) return "Tree requires a non-empty aria-label or aria-labelledby.";
  if (!Number.isFinite(indent) || indent < 0) return "Tree indent must be a finite, non-negative number.";
  if (selectionMode === "none" && (selectionIndicator !== undefined || checkStrategy !== undefined || selectedKeys !== undefined || defaultSelectedKeys !== undefined || onSelectionChange !== undefined)) {
    return "Tree selection props require selectionMode to be single or multiple.";
  }
  if (selectionMode === "single" && ((selectedKeys?.length ?? 0) > 1 || (defaultSelectedKeys?.length ?? 0) > 1)) {
    return "Tree single selection accepts at most one selected key.";
  }
  if (selectionIndicator === "checkbox" && selectionMode !== "multiple") return "Tree checkbox selection requires selectionMode=\"multiple\".";
  if (checkStrategy === "cascade" && !(selectionMode === "multiple" && selectionIndicator === "checkbox")) {
    return "Tree cascade selection requires multiple checkbox selection.";
  }
  return null;
}

function TreeBranch({ children, reduceMotion }: { children: ReactNode; reduceMotion: boolean }) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      role="group"
      aria-hidden={isPresent ? undefined : true}
      data-slot="tree-group"
      className="overflow-hidden"
      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={reduceMotion ? { height: 0, opacity: 0, transition: { duration: 0 } } : { height: 0, opacity: 0, transition: spring.moderate.exit }}
      transition={reduceMotion ? { duration: 0 } : spring.moderate}
    >
      {children}
    </motion.div>
  );
}

function TreeInner<T>(props: TreeProps<T>, forwardedRef: ForwardedRef<HTMLDivElement>) {
  const {
    items,
    expandedKeys,
    defaultExpandedKeys = [],
    onExpandedChange,
    variant = "plain",
    density = "regular",
    showLines = false,
    indent = 20,
    selectionScope = "all",
    disabled = false,
    readOnly = false,
    query = "",
    filterNode,
    loading = false,
    error,
    onRetry,
    messages: messageOverrides,
    renderIcon,
    renderLabel,
    renderTrailing,
    renderActions,
    onNodeAction,
    className,
    selectionMode: selectionModeProp,
    selectionIndicator: selectionIndicatorProp,
    checkStrategy: checkStrategyProp,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    onClick,
    onDoubleClick,
    onKeyDown,
    ...rest
  } = props;
  const selectionMode = selectionModeProp ?? "none";
  const selectionIndicator = selectionMode === "multiple" ? (selectionIndicatorProp ?? "highlight") : "highlight";
  const checkStrategy = selectionMode === "multiple" && selectionIndicator === "checkbox"
    ? (checkStrategyProp ?? "independent")
    : "independent";
  const messages = { ...defaultTreeMessages, ...messageOverrides };
  const reduceMotion = useReducedMotion() ?? false;
  const descriptionId = useId();
  const [internalExpanded, setInternalExpanded] = useState<readonly TreeKey[]>(orderedUnique(defaultExpandedKeys));
  const [internalSelected, setInternalSelected] = useState<readonly TreeKey[]>(
    selectionMode === "none" ? [] : orderedUnique(defaultSelectedKeys ?? []),
  );
  const [focusedKey, setFocusedKey] = useState<TreeKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef(new Map<TreeKey, HTMLDivElement>());
  const typeahead = useRef({ value: "", timeout: 0 });
  const wasFocusedInside = useRef(false);
  const isExpandedControlled = expandedKeys !== undefined;
  const isSelectedControlled = selectionMode !== "none" && selectedKeys !== undefined;
  const currentExpanded = isExpandedControlled ? orderedUnique(expandedKeys ?? []) : internalExpanded;
  const currentSelected = selectionMode === "none"
    ? []
    : isSelectedControlled ? orderedUnique(selectedKeys ?? []) : internalSelected;

  const modelResult = useMemo(() => {
    try {
      return { model: buildTreeModel<T>(items), error: null as Error | null };
    } catch (caught) {
      return {
        model: buildTreeModel<T>([]),
        error: caught instanceof Error ? caught : new Error("Unable to render this tree."),
      };
    }
  }, [items]);
  const model = modelResult.model;
  const modelError = modelResult.error;
  const propError = configurationError(
    selectionModeProp,
    selectionIndicatorProp,
    checkStrategyProp,
    selectedKeys,
    defaultSelectedKeys,
    onSelectionChange,
    ariaLabel,
    ariaLabelledBy,
    indent,
  );
  const directMatches = useMemo(() => matchedKeys(model, query, filterNode), [filterNode, model, query]);
  const includedKeys = useMemo(
    () => query.trim() ? filteredKeys(model, directMatches) : new Set<TreeKey>(model.nodes.keys()),
    [directMatches, model, query],
  );
  const forcedExpanded = useMemo(
    () => query.trim() ? matchingAncestors(model, directMatches) : new Set<TreeKey>(),
    [directMatches, model, query],
  );
  const expanded = useMemo(() => new Set(currentExpanded), [currentExpanded]);
  const visible = useMemo(
    () => visibleRows(model, expanded, includedKeys, forcedExpanded),
    [expanded, forcedExpanded, includedKeys, model],
  );
  const visibleKeys = useMemo(() => new Set(visible.map((row) => row.key)), [visible]);
  const selected = useMemo(() => new Set(currentSelected), [currentSelected]);
  const derivedCheckStates = useMemo(
    () => checkStates(model, selected, selectionScope, checkStrategy),
    [checkStrategy, model, selected, selectionScope],
  );
  const childrenByParent = useMemo(() => {
    const byParent = new Map<TreeKey | null, TreeRow<T>[]>();
    for (const row of model.rows) {
      const children = byParent.get(row.parentKey) ?? [];
      children.push(row);
      byParent.set(row.parentKey, children);
    }
    return byParent;
  }, [model.rows]);
  const initialFocus = visible.find((row) => selected.has(row.key))?.key ?? visible[0]?.key ?? null;
  const focusKey = focusedKey && visibleKeys.has(focusedKey) ? focusedKey : initialFocus;

  const focusRow = useCallback((key: TreeKey) => {
    setFocusedKey(key);
    const row = rowRefs.current.get(key);
    const focus = (target: HTMLDivElement | undefined) => {
      if (!target) return;
      target.focus();
      const container = rootRef.current;
      if (!container) return;
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      if (targetRect.top < containerRect.top || targetRect.bottom > containerRect.bottom) target.scrollIntoView({ block: "nearest" });
    };
    if (row) focus(row);
    else requestAnimationFrame(() => focus(rowRefs.current.get(key)));
  }, []);

  useEffect(() => {
    if (!wasFocusedInside.current || !focusKey) return;
    if (document.activeElement !== rowRefs.current.get(focusKey)) focusRow(focusKey);
  }, [focusKey, focusRow, visible]);

  const changeExpanded = useCallback((key: TreeKey, reason: "pointer" | "keyboard") => {
    if (disabled || forcedExpanded.has(key) || model.rowsByKey.get(key)?.disabled) return;
    const next = new Set(currentExpanded);
    const isNowExpanded = !next.has(key);
    if (isNowExpanded) next.add(key);
    else next.delete(key);
    const keys = model.rows.filter((row) => next.has(row.key)).map((row) => row.key)
      .concat([...next].filter((candidate) => !model.nodes.has(candidate)));
    if (!isExpandedControlled) setInternalExpanded(keys);
    onExpandedChange?.(keys, { key, expanded: isNowExpanded, reason });
    if (!isNowExpanded && focusKey && subtreeKeys(model, key).includes(focusKey)) focusRow(key);
  }, [currentExpanded, disabled, focusKey, focusRow, forcedExpanded, isExpandedControlled, model, onExpandedChange]);

  const changeSelection = useCallback((key: TreeKey, reason: "pointer" | "keyboard") => {
    if (selectionMode === "none" || disabled || loading || error || readOnly || propError) return;
    const row = model.rowsByKey.get(key);
    if (!row || row.disabled) return;
    const next = nextSelection(model, currentSelected, key, selectionMode, checkStrategy, selectionScope);
    if (next === currentSelected || (next.length === currentSelected.length && next.every((value, index) => value === currentSelected[index]))) return;
    if (!isSelectedControlled) setInternalSelected(next);
    const details: TreeChangeDetails<T> = selectionDetails(model, currentSelected, next, key, reason);
    onSelectionChange?.(next, details);
  }, [checkStrategy, currentSelected, disabled, error, isSelectedControlled, loading, model, onSelectionChange, propError, readOnly, selectionMode, selectionScope]);

  const activate = useCallback((key: TreeKey, reason: "pointer" | "keyboard") => {
    const row = model.rowsByKey.get(key);
    if (!row || row.disabled || disabled || propError) return;
    if (selectionMode === "none") {
      if (row.node.children?.length) changeExpanded(key, reason);
      return;
    }
    changeSelection(key, reason);
  }, [changeExpanded, changeSelection, disabled, model.rowsByKey, propError, selectionMode]);

  const handleKey = useCallback((event: KeyboardEvent<HTMLDivElement>, row: TreeRow<T>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const index = visible.findIndex((candidate) => candidate.key === row.key);
    const next = visible[index + 1];
    const previous = visible[index - 1];
    const isBranch = Boolean(row.node.children?.length);
    const isOpen = expanded.has(row.key) || forcedExpanded.has(row.key);
    const isRTL = event.currentTarget.closest('[dir="rtl"]') !== null
      || (typeof window !== "undefined" && window.getComputedStyle(event.currentTarget).direction === "rtl");
    const expandKey = isRTL ? "ArrowLeft" : "ArrowRight";
    const collapseKey = isRTL ? "ArrowRight" : "ArrowLeft";
    const move = (candidate?: TreeRow<T>) => {
      if (!candidate) return;
      event.preventDefault();
      focusRow(candidate.key);
    };
    if (event.key === "ArrowDown") return move(next);
    if (event.key === "ArrowUp") return move(previous);
    if (event.key === "Home") return move(visible[0]);
    if (event.key === "End") return move(visible.at(-1));
    if (event.key === expandKey) {
      event.preventDefault();
      if (isBranch && !isOpen) changeExpanded(row.key, "keyboard");
      else if (isBranch && next?.parentKey === row.key) focusRow(next.key);
      return;
    }
    if (event.key === collapseKey) {
      event.preventDefault();
      if (isBranch && isOpen && !forcedExpanded.has(row.key)) changeExpanded(row.key, "keyboard");
      else if (row.parentKey) focusRow(row.parentKey);
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!disabled && !loading && !error && !readOnly && !propError && !row.disabled) onNodeAction?.(row.node);
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      activate(row.key, "keyboard");
      return;
    }
    if (event.nativeEvent.isComposing || event.key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    window.clearTimeout(typeahead.current.timeout);
    typeahead.current.value += event.key.toLocaleLowerCase();
    typeahead.current.timeout = window.setTimeout(() => { typeahead.current.value = ""; }, 500);
    const search = typeahead.current.value;
    const candidates = [...visible.slice(index + 1), ...visible.slice(0, index + 1)];
    const match = candidates.find((candidate) => candidate.node.label.toLocaleLowerCase().startsWith(search));
    if (match) focusRow(match.key);
  }, [activate, changeExpanded, disabled, error, expanded, focusRow, forcedExpanded, loading, onKeyDown, onNodeAction, propError, readOnly, visible]);

  const ChevronRight = useIcon("chevron-right");
  const Check = useIcon("check");
  const Folder = useIcon("folder");
  const selectedState = selectionMode === "multiple" && selectionIndicator === "checkbox" ? "checked" : "selected";
  const searchDescriptionId = `${descriptionId}-search`;
  const readOnlyDescriptionId = `${descriptionId}-readonly`;
  const hasTreeData = visible.length > 0;
  const statusMessage = propError ?? modelError?.message ?? error;

  const renderRows = (parentKey: TreeKey | null): ReactNode => {
    const rows = (childrenByParent.get(parentKey) ?? []).filter((row) => visibleKeys.has(row.key));
    if (!rows.length) return null;
    return rows.map((row, rowIndex) => {
      const isBranch = Boolean(row.node.children?.length);
      const isOpen = isBranch && (expanded.has(row.key) || forcedExpanded.has(row.key));
      const isSelected = selected.has(row.key);
      const state = derivedCheckStates.get(row.key) ?? false;
      const selectable = row.node.selectable !== false && (selectionScope === "all" || !isBranch);
      const checkable = selectionMode === "multiple" && selectionIndicator === "checkbox"
        && (checkStrategy === "cascade" ? state !== false || (model.children.get(row.key)?.length ?? 0) > 0 || selectable : selectable);
      const actionsDisabled = row.disabled || disabled || readOnly || loading || Boolean(error) || Boolean(propError);
      const nodeId = `${descriptionId}-node-${encodeURIComponent(row.key)}`;
      const nodeLabelId = `${nodeId}-label`;
      const nodeDescriptionId = `${nodeId}-description`;
      const nodeReasonId = `${nodeId}-reason`;
      const context: TreeRenderContext<T> = {
        node: row.node,
        level: row.level,
        expanded: isOpen,
        selected: isSelected,
        checkState: state,
        focused: focusKey === row.key,
        disabled: row.disabled,
        matched: directMatches.has(row.key),
      };
      const actions = renderActions?.(context);
      const Icon = row.node.icon ?? (isBranch ? Folder : null);
      const onRowClick = (event: MouseEvent<HTMLDivElement>) => {
        onClick?.(event);
        if (event.defaultPrevented || event.currentTarget !== (event.target as HTMLElement).closest('[role="treeitem"]')) return;
        if ((event.target as HTMLElement).closest("[data-tree-toggle]")) changeExpanded(row.key, "pointer");
        else if (event.detail <= 1) activate(row.key, "pointer");
      };
      return (
        <div key={row.key} role="none" data-slot="tree-item-wrapper">
          <div
            ref={(element) => {
              if (element) rowRefs.current.set(row.key, element);
              else rowRefs.current.delete(row.key);
            }}
            role="treeitem"
            tabIndex={!disabled && focusKey === row.key ? 0 : -1}
            aria-level={row.level}
            aria-posinset={rowIndex + 1}
            aria-setsize={rows.length}
            aria-expanded={isBranch ? isOpen : undefined}
            aria-labelledby={nodeLabelId}
            aria-disabled={row.disabled || disabled || undefined}
            aria-selected={selectedState === "selected" && selectable ? isSelected : undefined}
            aria-checked={selectedState === "checked" && checkable ? state : undefined}
            aria-describedby={[
              row.node.description ? nodeDescriptionId : undefined,
              row.node.disabledReason ? nodeReasonId : undefined,
              readOnly ? readOnlyDescriptionId : undefined,
              query.trim() && forcedExpanded.has(row.key) ? searchDescriptionId : undefined,
            ].filter(Boolean).join(" ") || undefined}
            data-slot="tree-item"
            data-selected={isSelected || undefined}
            data-check-state={selectedState === "checked" ? state : undefined}
            data-disabled={row.disabled || disabled || undefined}
            onFocus={() => { wasFocusedInside.current = true; setFocusedKey(row.key); }}
            onBlur={(event) => { if (!rootRef.current?.contains(event.relatedTarget as Node)) wasFocusedInside.current = false; }}
            onClick={onRowClick}
            onDoubleClick={(event) => {
              onDoubleClick?.(event);
              if ((event.target as HTMLElement).closest("[data-tree-toggle]")) return;
              if (!event.defaultPrevented && event.currentTarget === (event.target as HTMLElement).closest('[role="treeitem"]') && !row.disabled && !disabled && !loading && !error && !readOnly && !propError) onNodeAction?.(row.node);
            }}
            onKeyDown={(event) => handleKey(event, row)}
            className={cn(
              "group/tree-item relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg pe-2 ps-1.5 text-left outline-none transition-colors",
              densityClasses[density],
              "hover:bg-hover focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-inset",
              "data-[selected=true]:bg-selection data-[selected=true]:text-fg-default",
              "data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
            )}
            style={{ paddingInlineStart: `calc(0.375rem + ${(row.level - 1) * Math.max(0, indent)}px)` }}
          >
            {showLines && row.level > 1 ? <span aria-hidden className="absolute inset-y-0 border-s border-border-subtle" style={{ insetInlineStart: `calc(0.75rem + ${(row.level - 2) * Math.max(0, indent)}px)` }} /> : null}
            {isBranch ? (
              <Button
                data-tree-toggle
                type="button"
                iconOnly
                size="xs"
                variant="ghost"
                tabIndex={-1}
                aria-label={isOpen ? messages.collapseNode(row.node.label) : messages.expandNode(row.node.label)}
                aria-expanded={isOpen}
                disabled={row.disabled || disabled || forcedExpanded.has(row.key)}
                onKeyDown={(event) => event.stopPropagation()}
                className="text-fg-muted group-hover/tree-item:text-fg-default"
              >
                <motion.span aria-hidden className="grid place-items-center" animate={{ rotate: isOpen ? 90 : 0 }} transition={reduceMotion ? { duration: 0 } : spring.fast}>
                  <ChevronRight size={14} />
                </motion.span>
              </Button>
            ) : <span aria-hidden className="size-6 shrink-0" />}
            {selectionMode === "multiple" && selectionIndicator === "checkbox" ? (
              <span aria-hidden data-slot="tree-check" className={cn("grid size-4 shrink-0 place-items-center rounded border border-input text-fg-on-brand", state && "border-brand bg-brand", !checkable && "opacity-0")}>
                {state === "mixed" ? <span className="h-0.5 w-2 rounded bg-current" /> : state ? <Check size={11} strokeWidth={3} /> : null}
              </span>
            ) : null}
            {renderIcon ? renderIcon(context) : Icon ? <span aria-hidden data-slot="tree-icon" className="grid size-4 shrink-0 place-items-center text-fg-muted"><Icon size={16} /></span> : null}
            <span className="flex min-w-0 flex-1 items-center gap-1.5" data-slot="tree-content">
              <span id={nodeLabelId} data-slot="tree-label" data-label={row.node.label} className="inline-grid min-w-0 max-w-full after:invisible after:col-start-1 after:row-start-1 after:font-semibold after:content-[attr(data-label)]">
                <span className="col-start-1 row-start-1 truncate transition-[color,font-weight] duration-fast group-data-[selected=true]/tree-item:font-semibold">{renderLabel ? renderLabel(context) : row.node.label}</span>
              </span>
              {row.node.description ? <span id={nodeDescriptionId} data-slot="tree-description" className="min-w-0 truncate text-label text-fg-muted">{row.node.description}</span> : null}
            </span>
            {renderTrailing ? <span data-slot="tree-trailing" className="shrink-0">{renderTrailing(context)}</span> : null}
            {actions ? (
              <div
                data-slot="tree-actions"
                aria-disabled={actionsDisabled || undefined}
                inert={actionsDisabled ? true : undefined}
                className="relative z-action flex shrink-0 items-center gap-1"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                onDoubleClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                {actions}
              </div>
            ) : null}
            {row.node.disabledReason ? <span id={nodeReasonId} className="sr-only">{row.node.disabledReason}</span> : null}
          </div>
          <AnimatePresence initial={false}>
            {isBranch && isOpen ? (
              <TreeBranch reduceMotion={reduceMotion}>
                {renderRows(row.key)}
              </TreeBranch>
            ) : null}
          </AnimatePresence>
        </div>
      );
    });
  };

  const emptyMessage = query.trim() ? messages.noResults : messages.empty;
  return (
    <div
      {...rest}
      ref={(element) => {
        rootRef.current = element;
        if (typeof forwardedRef === "function") forwardedRef(element);
        else if (forwardedRef) forwardedRef.current = element;
      }}
      data-slot="tree"
      data-variant={variant}
      aria-busy={loading || undefined}
      className={cn("min-w-0 text-fg-default", variant === "bordered" && "rounded-xl border border-border bg-surface-floating p-1.5", className)}
    >
      {statusMessage ? <div role="status" aria-live="polite" className={cn("flex flex-col items-center justify-center gap-2 px-4 text-center text-body text-fg-muted", hasTreeData ? "mb-2" : "min-h-24")}><span>{statusMessage}</span>{onRetry ? <button type="button" className="text-fg-brand underline underline-offset-4" onClick={onRetry} disabled={loading}>{messages.retry}</button> : null}</div> : null}
      {loading && !hasTreeData && !statusMessage ? <div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center px-4 text-body text-fg-muted">{messages.loading}</div> : null}
      {!hasTreeData && !loading && !statusMessage ? <div role="status" aria-live="polite" className="flex min-h-24 items-center justify-center px-4 text-body text-fg-muted">{emptyMessage}</div> : null}
      {!modelError && !propError ? <div role="tree" tabIndex={hasTreeData || disabled ? undefined : 0} aria-label={ariaLabel} aria-labelledby={ariaLabelledBy} aria-busy={loading || undefined} aria-multiselectable={selectionMode === "multiple" || undefined}>{hasTreeData ? renderRows(null) : null}</div> : null}
      {readOnly ? <p id={readOnlyDescriptionId} className="sr-only">{messages.readOnly}</p> : null}
      {query.trim() && hasTreeData ? <p id={searchDescriptionId} className="sr-only" aria-live="polite">{messages.resultsCount(directMatches.size)}. {messages.searchExpansionHint}</p> : null}
      {query.trim() && checkStrategy === "cascade" && hasTreeData ? <p className="mt-2 px-1.5 text-label text-fg-muted">{messages.cascadeSearchHint}</p> : null}
    </div>
  );
}

export const Tree = forwardRef(TreeInner) as <T>(props: TreeProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }) => React.ReactElement;
(Tree as { displayName?: string }).displayName = "Tree";
