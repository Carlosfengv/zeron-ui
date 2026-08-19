"use client";

import * as React from "react";
import { Button } from "#components/button";
import { Input } from "#components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/popover";
import { useIcon } from "#system/icon-context";
import type { ControlSize } from "../../tokens/control-size";
import { cn } from "#system/utils";
import type { FilterField } from "./filter-types";

interface FilterFieldMenuProps {
  allowDuplicateFields: boolean;
  disabled?: boolean;
  fields: readonly FilterField[];
  filterCount: number;
  maxFilters?: number;
  messages: {
    addFilter: string;
    noFields: string;
    searchFields: string;
  };
  onSelect: (field: FilterField) => void;
  readOnly?: boolean;
  size: ControlSize;
  selectedFieldIds: ReadonlySet<string>;
  trigger?: React.ReactNode;
}

export function FilterFieldMenu({
  allowDuplicateFields,
  disabled,
  fields,
  filterCount,
  maxFilters,
  messages,
  onSelect,
  readOnly,
  selectedFieldIds,
  size,
  trigger,
}: FilterFieldMenuProps) {
  const Plus = useIcon("plus");
  const Search = useIcon("search");
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const grouped = React.useMemo(() => {
    const normalisedQuery = query.trim().toLocaleLowerCase();
    const matching = fields.filter((field) => {
      if (!normalisedQuery) return true;
      return [field.id, field.label, field.description]
        .filter(Boolean)
        .some((part) => String(part).toLocaleLowerCase().includes(normalisedQuery));
    });
    return matching.reduce<Map<string, FilterField[]>>((groups, field) => {
      const group = field.group ?? "";
      const items = groups.get(group) ?? [];
      items.push(field);
      groups.set(group, items);
      return groups;
    }, new Map());
  }, [fields, query]);

  const triggerElement = React.isValidElement(trigger) ? trigger : (
    <Button dashed leadingIcon={Plus} size={size} variant="tertiary">
      {messages.addFilter}
    </Button>
  );

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={React.cloneElement(triggerElement, {
          "aria-label": triggerElement.props["aria-label"] ?? messages.addFilter,
          disabled: disabled || readOnly || triggerElement.props.disabled,
        })}
      />
      <PopoverContent align="start" className="w-[min(92vw,20rem)] p-2" sideOffset={6}>
        <div className="relative mb-2">
          <Input
            aria-label={messages.searchFields}
            className="pr-8"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={messages.searchFields}
            ref={inputRef}
            size={size}
            value={query}
          />
          <Search aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
        </div>
        <div className="max-h-72 overflow-y-auto pr-0.5" role="listbox">
          {grouped.size === 0 ? (
            <p className="px-2.5 py-5 text-center text-body text-fg-muted">{messages.noFields}</p>
          ) : (
            Array.from(grouped).map(([group, groupFields]) => (
              <div className="mb-2 last:mb-0" key={group || "ungrouped"}>
                {group && <p className="px-2.5 py-1 text-label text-fg-muted">{group}</p>}
                <div className="flex flex-col gap-0.5">
                  {groupFields.map((field) => {
                    const duplicate = !allowDuplicateFields && selectedFieldIds.has(field.id);
                    const atCapacity = maxFilters !== undefined && filterCount >= maxFilters;
                    const isDisabled = Boolean(field.disabled || duplicate || atCapacity);
                    const Icon = field.icon;
                    return (
                      <Button
                        aria-label={field.description ? `${field.label}. ${field.description}` : field.label}
                        className={cn("justify-start", isDisabled && "opacity-50")}
                        disabled={isDisabled}
                        key={field.id}
                        onClick={() => {
                          onSelect(field);
                          setOpen(false);
                        }}
                        role="option"
                        size={size}
                        variant="ghost"
                      >
                        {Icon && <Icon aria-hidden size={16} />}
                        <span className="min-w-0 truncate">{field.label}</span>
                        {duplicate && <span className="ml-auto text-label text-fg-muted">Added</span>}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
