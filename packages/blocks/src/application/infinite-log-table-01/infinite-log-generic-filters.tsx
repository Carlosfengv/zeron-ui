"use client";

import { AccordionContent, AccordionGroup, AccordionItem, AccordionTrigger } from "@zeron/ui/accordion";
import { Button } from "@zeron/ui/button";
import { CheckboxGroup, CheckboxItem } from "@zeron/ui/checkbox-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@zeron/ui/input-group";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { useIcon } from "@zeron/ui/system/icon-context";
import { memo, type ReactNode } from "react";
import { RangeEditor, TimeRangeFilter } from "./infinite-log-filters";
import { defaultInfiniteLogFilters } from "./infinite-log-types";
import type {
  InfiniteLogBaseRecord,
  InfiniteLogField,
  InfiniteLogFilters,
  InfiniteLogMetadata,
  InfiniteLogTableLabels,
} from "./infinite-log-types";

interface GenericInfiniteLogFiltersProps<TRecord extends InfiniteLogBaseRecord> {
  fields: readonly InfiniteLogField<TRecord>[];
  filters: InfiniteLogFilters;
  metadata?: InfiniteLogMetadata;
  labels: InfiniteLogTableLabels;
  locale: string;
  onChange: (filters: InfiniteLogFilters) => void;
  timeZone: string;
}

function FilterGroup({ children, index, title, value }: { children: ReactNode; index: number; title: string; value: string }) {
  return (
    <AccordionItem index={index} value={value}>
      <AccordionTrigger>{title}</AccordionTrigger>
      <AccordionContent>{children}</AccordionContent>
    </AccordionItem>
  );
}

function formatCompactCount(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1, notation: "compact" }).format(value);
}

export const GenericInfiniteLogFilters = memo(function GenericInfiniteLogFilters<
  TRecord extends InfiniteLogBaseRecord,
>({ fields, filters, labels, locale, metadata, onChange, timeZone }: GenericInfiniteLogFiltersProps<TRecord>) {
  const Filter = useIcon("settings");
  const Search = useIcon("search");
  const filterableFields = fields.filter((field) => field.filter && field.filter !== "none" && field.id !== "timestamp");
  const patchFields = (fieldId: string, value: NonNullable<InfiniteLogFilters["fields"]>[string] | undefined) => {
    const nextFields = { ...(filters.fields ?? {}) };
    if (value) nextFields[fieldId] = value;
    else delete nextFields[fieldId];
    onChange({ ...filters, fields: nextFields });
  };

  return (
    <aside aria-label={labels.filters} className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-surface-base">
      <div className="flex min-h-control-lg items-center justify-between border-b border-border-subtle px-3 py-2.5">
        <span className="flex items-center gap-2 text-body font-medium text-fg-default"><Filter aria-hidden className="size-4" />{labels.filters}</span>
        <Button onClick={() => onChange(defaultInfiniteLogFilters)} size="sm" type="button" variant="ghost">{labels.clearAll}</Button>
      </div>
      <ScrollArea className="min-h-0 flex-1" viewportClassName="overscroll-contain p-2">
        <AccordionGroup className="min-w-0 w-full" defaultValue={["time-range", filterableFields[0]?.id].filter(Boolean) as string[]} type="multiple">
          <FilterGroup index={0} title={labels.timeRange} value="time-range">
            <TimeRangeFilter labels={labels} locale={locale} onChange={(timeRange) => onChange({ ...filters, timeRange })} timeRange={filters.timeRange} timeZone={timeZone} />
          </FilterGroup>
          {filterableFields.map((field, fieldIndex) => {
            const filter = filters.fields?.[field.id];
            const facet = metadata?.fieldFacets?.[field.id];
            return (
              <FilterGroup index={fieldIndex + 1} key={field.id} title={field.label ?? field.id} value={field.id}>
                {field.filter === "text" ? (
                  <InputGroup size="sm">
                    <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
                    <InputGroupInput
                      aria-label={field.label ?? field.id}
                      onChange={(event) => patchFields(field.id, event.target.value ? { operator: "contains", value: event.target.value } : undefined)}
                      placeholder={labels.searchPlaceholder}
                      value={filter?.operator === "contains" ? filter.value : ""}
                    />
                  </InputGroup>
                ) : field.filter === "numberRange" ? (
                  <RangeEditor
                    label={field.label ?? field.id}
                    onApply={(value) => patchFields(field.id, value ? { operator: "isBetween", value } : undefined)}
                    value={filter?.operator === "isBetween" ? filter.value : undefined}
                  />
                ) : (
                  <ScrollArea className="max-h-52 min-w-0 w-full rounded-lg border border-border-subtle bg-surface-floating" viewportClassName="min-w-0 w-full">
                    <CheckboxGroup
                      aria-label={field.label ?? field.id}
                      checkedIndices={new Set((facet?.values ?? []).flatMap((entry, index) => filter?.operator === "isAnyOf" && filter.value.some((value) => String(value) === String(entry.value)) ? [index] : []))}
                      className="min-w-0 w-full p-1"
                    >
                      {(facet?.values ?? []).map((entry, index) => {
                        const selected = filter?.operator === "isAnyOf" && filter.value.some((value) => String(value) === String(entry.value));
                        return (
                          <CheckboxItem
                            checked={selected}
                            index={index}
                            key={String(entry.value)}
                            label={String(entry.value)}
                            onToggle={() => {
                              const current = filter?.operator === "isAnyOf" ? [...filter.value] : [];
                              const next = selected
                                ? current.filter((value) => String(value) !== String(entry.value))
                                : [...current, entry.value];
                              patchFields(field.id, next.length > 0 ? { operator: "isAnyOf", value: next } : undefined);
                            }}
                            trailing={<span className="font-mono text-label tabular-nums text-fg-subtle">{formatCompactCount(entry.count)}</span>}
                          />
                        );
                      })}
                    </CheckboxGroup>
                  </ScrollArea>
                )}
              </FilterGroup>
            );
          })}
        </AccordionGroup>
      </ScrollArea>
    </aside>
  );
}) as <TRecord extends InfiniteLogBaseRecord>(props: GenericInfiniteLogFiltersProps<TRecord>) => ReactNode;
