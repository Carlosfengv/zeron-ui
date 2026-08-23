"use client";

import * as React from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from "#components/command";
import { InputGroup, InputGroupAddon, InputGroupInput } from "#components/input-group";
import { Kbd, KbdGroup } from "#components/kbd";
import { Popover, PopoverContent } from "#components/popover";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";
import type { ControlSize } from "#tokens/control-size";
import { useFilterQueryInput } from "../filter-query-core/use-filter-query-input";
import type {
  FilterQueryCommitContext,
  FilterQueryCoreProps,
  FilterQueryHistoryEntry,
  FilterQueryOptionContext,
  FilterQuerySuggestion,
} from "../filter-query-core/filter-query-types";
import type { FilterQueryInputSlotProps, FilterQueryInputSlots } from "./filter-query-slots";
export type { FilterQueryInputSlotProps, FilterQueryInputSlots } from "./filter-query-slots";

export interface FilterQueryInputMessages {
  placeholder: string;
  filters: string;
  values: string;
  history: string;
  noResults: string;
  invalidQuery: string;
  loadingOptions: string;
  singleConditionOnly: string;
  clearHistory: string;
  retryOptions: string;
  navigateHint: string;
  submitHint: string;
  closeHint: string;
}

const defaultMessages: FilterQueryInputMessages = {
  placeholder: "Search with filters…",
  filters: "Filters",
  values: "Values",
  history: "Recent searches",
  noResults: "No results found.",
  invalidQuery: "Finish or correct the current filter.",
  loadingOptions: "Loading options…",
  singleConditionOnly: "Only one filter can be applied here.",
  clearHistory: "Clear history",
  retryOptions: "Retry loading values",
  navigateHint: "Navigate",
  submitHint: "Apply",
  closeHint: "Close",
};

export interface FilterQueryInputClassNames {
  control?: string;
  content?: string;
  footer?: string;
  group?: string;
  input?: string;
  item?: string;
  list?: string;
  popover?: string;
  root?: string;
  trigger?: string;
}

export interface FilterQueryInputProps
  extends Omit<React.ComponentPropsWithoutRef<"div">, "onChange">,
    FilterQueryCoreProps {
  size?: ControlSize;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  getOptionCount?: (context: FilterQueryOptionContext) => number | undefined;
  hotkey?: false | readonly string[];
  hotkeyPriority?: number;
  loopNavigation?: boolean;
  messages?: Partial<FilterQueryInputMessages>;
  classNames?: FilterQueryInputClassNames;
  slotProps?: FilterQueryInputSlotProps;
  slots?: FilterQueryInputSlots;
  onHistoryChange?: (history: FilterQueryHistoryEntry[]) => void;
  onFiltersChange?: (filters: import("#system/filter-core").FilterClause[], context: FilterQueryCommitContext) => void;
}

function matchesHotkey(event: KeyboardEvent, hotkey: false | readonly string[] | undefined) {
  const configured: readonly string[] = hotkey === false ? [] : hotkey ?? ["Meta+K", "Control+K"];
  return configured.some((shortcut) => {
    const parts = shortcut.toLocaleLowerCase().split("+").map((part) => part.trim());
    const key = parts.at(-1);
    if (!key || key !== event.key.toLocaleLowerCase()) return false;
    const has = (name: string) => parts.includes(name);
    return event.metaKey === has("meta")
      && event.ctrlKey === (has("control") || has("ctrl"))
      && event.altKey === has("alt")
      && event.shiftKey === has("shift");
  });
}

type HotkeyInstance = { element: React.RefObject<HTMLDivElement | null>; priority: number; touchedAt: number };
const hotkeyInstances = new Map<string, HotkeyInstance>();

function hotkeyWinner() {
  const visible = [...hotkeyInstances.entries()].filter(([, instance]) => {
    const element = instance.element.current;
    return Boolean(element?.isConnected && !element.hidden && window.getComputedStyle(element).display !== "none");
  });
  return visible.sort(([, left], [, right]) => right.priority - left.priority || right.touchedAt - left.touchedAt)[0]?.[0];
}

function DefaultItemContent({ count, description, icon: Icon, label }: { count?: number; description?: React.ReactNode; icon?: import("#system/icon-context").IconComponent; label: React.ReactNode }) {
  return <>
    {Icon && <Icon aria-hidden className="size-4 shrink-0 text-fg-muted" />}
    <span className="min-w-0 flex-1 truncate">{label}</span>
    {description && <span className="truncate text-label text-fg-muted">{description}</span>}
    {typeof count === "number" && <span className="shrink-0 text-label text-fg-muted">{count}</span>}
  </>;
}

export function FilterQueryInput({
  className,
  classNames,
  disabled = false,
  getOptionCount,
  loading = false,
  messages: messagesInput,
  readOnly = false,
  size = "md",
  slotProps,
  slots,
  hotkey,
  hotkeyPriority = 0,
  loopNavigation = false,
  ...props
}: FilterQueryInputProps) {
  const {
    allowDuplicateFields,
    codec,
    commitDelay,
    commitMode,
    defaultDraftText,
    defaultFilters,
    defaultOpen,
    draftText,
    fields,
    filters,
    freeText,
    history,
    historyLimit,
    historySchemaVersion,
    locale,
    mergeMode,
    multiple = true,
    onDraftTextChange,
    onFiltersChange,
    onHistoryChange,
    onOpenChange,
    open,
    optionLoadDelay,
    queryFields,
    suggestionLimit,
    suggestionProviders,
    ...rootProps
  } = props;
  const coreProps: FilterQueryCoreProps = {
    allowDuplicateFields,
    codec,
    commitDelay,
    commitMode,
    defaultDraftText,
    defaultFilters,
    defaultOpen,
    draftText,
    fields,
    filters,
    freeText,
    history,
    historyLimit,
    historySchemaVersion,
    locale,
    mergeMode,
    multiple,
    onDraftTextChange,
    onFiltersChange,
    onHistoryChange,
    onOpenChange,
    open,
    optionLoadDelay,
    queryFields,
    suggestionLimit,
    suggestionProviders,
  };
  const messages = React.useMemo(() => ({ ...defaultMessages, ...messagesInput }), [messagesInput]);
  const query = useFilterQueryInput(coreProps);
  const Search = useIcon("search");
  const RotateCcw = useIcon("rotate-ccw");
  const controlRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectingTextRef = React.useRef(false);
  const interactive = !disabled && !readOnly;
  const instanceId = React.useId();
  const InputSlot = slots?.input ?? InputGroupInput;
  const EmptySlot = slots?.empty;
  const FooterSlot = slots?.footer;

  const close = React.useCallback((commit: boolean) => {
    if (commit) query.commit("outside-press");
    else query.revert();
    query.setOpen(false);
  }, [query]);

  React.useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.setAttribute("aria-expanded", String(query.open));
    if (query.open && document.activeElement !== input) input.focus();
  }, [query.open]);

  React.useEffect(() => {
    hotkeyInstances.set(instanceId, { element: controlRef, priority: hotkeyPriority, touchedAt: Date.now() });
    return () => { hotkeyInstances.delete(instanceId); };
  }, [hotkeyPriority, instanceId]);

  React.useEffect(() => {
    if (!interactive || hotkey === false) return;
    const listener = (event: KeyboardEvent) => {
      if (!matchesHotkey(event, hotkey)) return;
      if (hotkeyWinner() !== instanceId) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')) return;
      event.preventDefault();
      query.setOpen(true);
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [hotkey, instanceId, interactive, query]);

  React.useEffect(() => {
    const finishSelection = () => {
      selectingTextRef.current = false;
    };
    window.addEventListener("pointerup", finishSelection);
    window.addEventListener("pointercancel", finishSelection);
    return () => {
      window.removeEventListener("pointerup", finishSelection);
      window.removeEventListener("pointercancel", finishSelection);
    };
  }, []);

  const selectSuggestion = React.useCallback((id: string) => {
    if (id === "action:submit") {
      if (query.commit("selection")) query.setOpen(false);
      return;
    }
    if (id === "action:clear") {
      query.clear();
      query.setOpen(false);
      return;
    }
    query.selectSuggestion(id);
    if (id.startsWith("history:")) query.setOpen(false);
  }, [query]);

  const groupHeading = !query.isAddingCondition && query.activeToken?.field
    ? messages.values
    : query.draftText.trim() || !query.suggestions.some((suggestion) => suggestion.kind === "history")
      ? messages.filters
      : messages.history;
  const queryError = !multiple && query.parseResult.clauses.length > 1
    ? messages.singleConditionOnly
    : query.parseResult.errors[0]?.message;
  const hasVisibleOptions = query.suggestions.some((suggestion) => suggestion.kind === "option");
  const suggestionGroups = React.useMemo(() => {
    const groups = new Map<string, FilterQuerySuggestion[]>();
    for (const suggestion of query.suggestions) {
      const heading = suggestion.group
        ?? (suggestion.kind === "field"
          ? messages.filters
          : suggestion.kind === "option" || ["action:more-options", "action:retry-options"].includes(suggestion.id)
            ? messages.values
            : suggestion.kind === "history" || suggestion.id === "action:clear-history"
              ? messages.history
              : groupHeading);
      const group = groups.get(heading) ?? [];
      group.push(suggestion);
      groups.set(heading, group);
    }
    return [...groups.entries()];
  }, [groupHeading, messages.filters, messages.history, messages.values, query.suggestions]);

  return (
    <Popover
      onOpenChange={(nextOpen, eventDetails) => {
        const target = eventDetails.event.target;
        if (!nextOpen && target instanceof Node && controlRef.current?.contains(target)) {
          eventDetails.cancel();
          return;
        }
        if (!nextOpen && query.open) close(true);
        else query.setOpen(nextOpen);
      }}
      open={query.open}
    >
      <Command
        className="h-auto overflow-visible bg-transparent"
        label={messages.filters}
        loop={loopNavigation}
        onKeyDown={(event) => {
          if (query.isComposing || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) {
            event.preventDefault();
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            close(false);
            return;
          }
          if (event.key === "Enter" && !multiple && query.parseResult.clauses.length > 1) {
            event.preventDefault();
            return;
          }
          if (event.key === "Enter" && !query.highlightedSuggestionId && query.parseResult.complete) {
            event.preventDefault();
            if (query.commit("enter")) query.setOpen(false);
          }
        }}
        onValueChange={query.setHighlightedSuggestionId}
        shouldFilter={false}
        value={query.highlightedSuggestionId}
        vimBindings={false}
      >
        <InputGroup {...rootProps} {...slotProps?.root} className={cn("min-w-[13rem]", className, classNames?.root, classNames?.control, slotProps?.root?.className)} onFocusCapture={(event) => {
          rootProps.onFocusCapture?.(event);
          slotProps?.root?.onFocusCapture?.(event);
          const instance = hotkeyInstances.get(instanceId);
          if (instance) instance.touchedAt = Date.now();
        }} ref={controlRef} size={size}>
          <InputGroupAddon>
            {loading ? <RotateCcw aria-hidden className="animate-spin text-fg-muted" /> : <Search aria-hidden className="text-fg-muted" />}
          </InputGroupAddon>
          <CommandInput aria-expanded={query.open} asChild onValueChange={(value) => query.setDraftText(value, inputRef.current?.selectionStart ?? value.length)} value={query.draftText}>
            <InputSlot
              aria-keyshortcuts={hotkey === false ? undefined : (hotkey ?? ["Meta+K", "Control+K"]).join(" ")}
              aria-label={messages.placeholder}
              {...slotProps?.input}
              className={cn("selection:bg-brand selection:text-fg-on-brand", classNames?.input, classNames?.trigger, slotProps?.input?.className)}
              disabled={disabled}
              onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
                slotProps?.input?.onBlur?.(event);
                selectingTextRef.current = false;
              }}
              onCompositionEnd={(_event: React.CompositionEvent<HTMLInputElement>) => query.setComposing(false)}
              onCompositionStart={(_event: React.CompositionEvent<HTMLInputElement>) => query.setComposing(true)}
              onFocus={(event: React.FocusEvent<HTMLInputElement>) => {
                slotProps?.input?.onFocus?.(event);
                if (!event.defaultPrevented && interactive) query.setOpen(true);
              }}
              onInput={(event: React.FormEvent<HTMLInputElement>) => query.setCaret(event.currentTarget.selectionStart ?? event.currentTarget.value.length)}
              onPointerDown={(event: React.PointerEvent<HTMLInputElement>) => {
                slotProps?.input?.onPointerDown?.(event);
                if (!event.defaultPrevented && event.button === 0 && event.pointerType !== "touch") {
                  selectingTextRef.current = true;
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                }
                if (!event.defaultPrevented && interactive && !query.open) query.setOpen(true);
              }}
              onPointerUp={(event: React.PointerEvent<HTMLInputElement>) => {
                slotProps?.input?.onPointerUp?.(event);
                const input = event.currentTarget;
                const start = input.selectionStart ?? input.value.length;
                const end = input.selectionEnd ?? start;

                // Leave a dragged range entirely under the browser's control.
                if (start === end) query.setCaret(start);
              }}
              placeholder={messages.placeholder}
              readOnly={readOnly}
              ref={inputRef}
            />
          </CommandInput>
          {!query.open && hotkey !== false && (
            <InputGroupAddon align="inline-end" className="hidden sm:flex">
              <Kbd>{typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘ K" : "Ctrl K"}</Kbd>
            </InputGroupAddon>
          )}
        </InputGroup>

        {query.open && (
          <PopoverContent {...slotProps?.content} anchor={controlRef} align="start" className={cn("w-[min(var(--anchor-width),calc(100vw-1.5rem))] min-w-0 max-w-[min(var(--anchor-width),calc(100vw-1.5rem))] p-1", classNames?.content, classNames?.popover, slotProps?.content?.className)} finalFocus={false} initialFocus={false} onPointerMoveCapture={(event) => {
            slotProps?.content?.onPointerMoveCapture?.(event);
            if (selectingTextRef.current) event.stopPropagation();
          }} sideOffset={6}>
            <CommandList {...slotProps?.list} className={cn(classNames?.list, slotProps?.list?.className)} label={messages.filters}>
              {(loading || (query.optionLoading && !hasVisibleOptions)) && (slots?.loading ? <slots.loading {...slotProps?.loading} state={query} /> : <CommandLoading>{messages.loadingOptions}</CommandLoading>)}
              {queryError && <div className="px-2 py-1.5 text-label text-danger-fg" role="alert">{queryError}</div>}
              {query.suggestions.length > 0 ? (
                suggestionGroups.map(([heading, suggestions]) => (
                  <CommandGroup className={classNames?.group} heading={heading} key={heading}>
                  {suggestions.map((suggestion) => (
                    <CommandItem {...slotProps?.item} aria-description={typeof suggestion.option?.metadata?.count === "number" ? `${suggestion.option.metadata.count} matching records` : undefined} className={cn(classNames?.item, slotProps?.item?.className)} disabled={suggestion.disabled} key={suggestion.id} onSelect={selectSuggestion} value={suggestion.id}>
                      {(() => {
                        const count = suggestion.option && getOptionCount ? getOptionCount({ field: suggestion.field!, queryField: coreProps.queryFields?.find((item) => item.fieldId === suggestion.field?.id) ?? { fieldId: suggestion.field!.id }, option: suggestion.option, filters: query.filters }) : suggestion.option?.metadata?.count as number | undefined;
                        const label = suggestion.id === "action:clear-history" ? messages.clearHistory : suggestion.id === "action:retry-options" ? messages.retryOptions : suggestion.label;
                        const Slot = suggestion.kind === "field" ? slots?.fieldItem : suggestion.kind === "option" ? slots?.optionItem : suggestion.kind === "history" ? slots?.historyItem : undefined;
                        const icon = suggestion.kind === "field" ? suggestion.field?.icon : suggestion.kind === "option" ? suggestion.option?.icon : undefined;
                        return slots?.suggestion?.({ selected: query.highlightedSuggestionId === suggestion.id, state: query, suggestion }) ?? (Slot ? <Slot {...(suggestion.kind === "field" ? slotProps?.fieldItem : suggestion.kind === "option" ? slotProps?.optionItem : slotProps?.historyItem)} count={count} state={query} suggestion={suggestion} /> : <DefaultItemContent count={count} description={suggestion.description} icon={icon} label={label} />);
                      })()}
                    </CommandItem>
                  ))}
                  </CommandGroup>
                ))
              ) : !(loading || query.optionLoading) ? (
                <CommandEmpty>{queryError && slots?.error ? <slots.error {...slotProps?.error} error={queryError} state={query} /> : EmptySlot ? <EmptySlot error={queryError ?? query.optionError} state={query} /> : queryError ?? query.optionError ?? messages.noResults}</CommandEmpty>
              ) : null}
              <div aria-live="polite" className="sr-only">{queryError ?? query.optionError ?? ""}</div>
            </CommandList>
            <div className={cn("hidden items-center justify-between gap-3 border-t border-border-subtle px-2 py-1.5 text-label text-fg-muted sm:flex", classNames?.footer)}>
              {FooterSlot ? <FooterSlot {...slotProps?.footer} state={query} /> : <>
                <span className="flex items-center gap-1.5"><KbdGroup><Kbd>↑</Kbd><Kbd>↓</Kbd></KbdGroup>{messages.navigateHint}</span>
                <span className="flex items-center gap-1.5"><Kbd>↵</Kbd>{messages.submitHint}</span>
                <span className="flex items-center gap-1.5"><Kbd>Esc</Kbd>{messages.closeHint}</span>
              </>}
            </div>
          </PopoverContent>
        )}
      </Command>
    </Popover>
  );
}
