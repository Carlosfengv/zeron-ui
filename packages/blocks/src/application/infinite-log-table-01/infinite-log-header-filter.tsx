"use client";

import { Button } from "@zeron/ui/button";
import { Badge } from "@zeron/ui/badge";
import { CheckboxGroup, CheckboxItem } from "@zeron/ui/checkbox-group";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { useIcon } from "@zeron/ui/system/icon-context";
import { useEffect, useMemo, useState } from "react";

export interface InfiniteLogHeaderFilterOption {
  value: string;
  label: string;
  count?: number;
}

interface InfiniteLogHeaderFilterProps {
  label: string;
  options: readonly InfiniteLogHeaderFilterOption[];
  selectedValues: readonly string[];
  clearLabel: string;
  onSelectedValuesChange: (values: string[]) => void;
  sort?: {
    direction?: "asc" | "desc";
    onChange: (direction: "asc" | "desc") => void;
  };
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(value);
}

/** Compact, persistent multi-select filter for categorical table columns. */
export function InfiniteLogHeaderFilter({
  clearLabel,
  label,
  onSelectedValuesChange,
  options,
  selectedValues,
  sort,
}: InfiniteLogHeaderFilterProps) {
  const ChevronDown = useIcon("chevron-down");
  const ChevronUp = useIcon("chevron-up");
  const [open, setOpen] = useState(false);
  const [pendingSelectedValues, setPendingSelectedValues] = useState(selectedValues);
  const selected = useMemo(() => new Set(pendingSelectedValues), [pendingSelectedValues]);
  const checkedIndices = useMemo(
    () => new Set(options.flatMap((option, index) => selected.has(option.value) ? [index] : [])),
    [options, selected],
  );
  const hasSelection = selected.size > 0;
  const activeItemCount = selected.size + (sort?.direction ? 1 : 0);
  const hasSortOnly = !hasSelection && Boolean(sort?.direction);

  useEffect(() => {
    setPendingSelectedValues(selectedValues);
  }, [selectedValues]);

  const toggleOption = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    const nextValues = [...next];
    setPendingSelectedValues(nextValues);
    onSelectedValuesChange(nextValues);
  };

  return (
    <>
      {activeItemCount > 0 && (
        <Badge
          aria-label={hasSortOnly ? `${label} sorted ${sort?.direction === "asc" ? "ascending" : "descending"}` : `${label} active filters: ${activeItemCount}`}
          className="ml-1 shrink-0"
          color="violet"
          size="sm"
        >
          {hasSortOnly ? sort?.direction === "asc" ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden /> : activeItemCount}
        </Badge>
      )}
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              active={open || hasSelection}
              aria-label={sort ? `Filter and sort ${label}` : `Filter ${label}`}
              className="ml-1 shrink-0"
              iconOnly
              size="xs"
              type="button"
              variant="ghost"
            >
              <ChevronDown aria-hidden />
            </Button>
          }
        />
        <PopoverContent align="start" className="w-52 p-1" sideOffset={4}>
        {sort && (
          <>
            <div aria-label={`Sort ${label}`} className="grid gap-0.5 px-1 py-1" role="group">
              <Button active={sort.direction === "asc"} className="justify-start" leadingIcon={ChevronUp} onClick={() => { sort.onChange("asc"); setOpen(false); }} size="sm" type="button" variant="ghost">Sort ascending</Button>
              <Button active={sort.direction === "desc"} className="justify-start" leadingIcon={ChevronDown} onClick={() => { sort.onChange("desc"); setOpen(false); }} size="sm" type="button" variant="ghost">Sort descending</Button>
            </div>
            <div className="-mx-1 my-1 h-px bg-border-subtle" />
          </>
        )}
        <div className="px-2 py-1.5 text-label text-fg-muted">{label}</div>
        <div className="-mx-1 my-1 h-px bg-border-subtle" />
        <ScrollArea className="h-52 max-h-52" viewportClassName="min-w-0 overscroll-contain">
          <CheckboxGroup aria-label={`Filter ${label}`} checkedIndices={checkedIndices} className="w-full">
            {options.map((option, index) => (
              <CheckboxItem
                checked={selected.has(option.value)}
                index={index}
                key={option.value}
                label={option.label}
                onToggle={() => toggleOption(option.value)}
                trailing={option.count === undefined ? undefined : (
                  <span className="font-mono text-label tabular-nums text-fg-subtle">{formatCompactCount(option.count)}</span>
                )}
              />
            ))}
          </CheckboxGroup>
        </ScrollArea>
        {hasSelection && (
          <Button
            className="mt-0.5 w-full border-t border-border-subtle"
            onClick={() => {
              setPendingSelectedValues([]);
              onSelectedValuesChange([]);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            {clearLabel}
          </Button>
        )}
        </PopoverContent>
      </Popover>
    </>
  );
}
