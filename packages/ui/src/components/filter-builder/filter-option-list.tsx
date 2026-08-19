"use client";

import * as React from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Button } from "#components/button";
import { cn } from "#system/utils";
import type { FilterOption } from "./filter-types";

interface FilterOptionListProps {
  maxSelections?: number;
  multiple: boolean;
  onToggle: (option: FilterOption) => void;
  options: readonly FilterOption[];
  selectedValues: ReadonlySet<string | number | boolean>;
  virtualize?: boolean | "auto";
}

export function FilterOptionList({
  maxSelections,
  multiple,
  onToggle,
  options,
  selectedValues,
  virtualize = "auto",
}: FilterOptionListProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);
  const shouldVirtualize = virtualize === true || (virtualize === "auto" && options.length >= 100);
  const virtualizer = useVirtualizer({
    count: options.length,
    estimateSize: () => 36,
    getScrollElement: () => parentRef.current,
    overscan: 6,
  });

  const renderOption = (option: FilterOption) => {
    const selected = selectedValues.has(option.value);
    const atLimit = Boolean(maxSelections && selectedValues.size >= maxSelections && !selected);
    const Icon = option.icon;
    return (
      <Button
        aria-pressed={selected}
        className="w-full justify-start"
        disabled={option.disabled || atLimit}
        key={String(option.value)}
        onClick={() => onToggle(option)}
        size="md"
        variant={selected ? "secondary" : "ghost"}
      >
        {multiple && (
          <span
            aria-hidden
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center rounded border border-border",
              selected && "border-brand bg-brand text-fg-on-brand",
            )}
          >
            {selected && <span className="size-1.5 rounded-sm bg-current" />}
          </span>
        )}
        {Icon && <Icon aria-hidden size={16} />}
        <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
      </Button>
    );
  };

  if (!shouldVirtualize) {
    return <div className="flex max-h-56 flex-col overflow-y-auto" role="listbox">{options.map(renderOption)}</div>;
  }

  return (
    <div className="max-h-56 overflow-y-auto" ref={parentRef} role="listbox">
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const option = options[virtualItem.index];
          if (!option) return null;
          return (
            <div
              className="absolute left-0 top-0 w-full"
              key={virtualItem.key}
              style={{ transform: `translateY(${virtualItem.start}px)` }}
            >
              {renderOption(option)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
