"use client";

import { Button } from "@zeron/ui/button";
import { DetailList, DetailListItem, DetailListLabel, DetailListValue } from "@zeron/ui/detail-list";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { useIcon } from "@zeron/ui/system/icon-context";
import { useState, type ReactNode } from "react";
import { getInfiniteLogFieldValue } from "./infinite-log-fields";
import type { InfiniteLogBaseRecord, InfiniteLogField, InfiniteLogTableLabels } from "./infinite-log-types";

interface GenericInfiniteLogDetailProps<TRecord extends InfiniteLogBaseRecord> {
  record?: TRecord;
  fields: readonly InfiniteLogField<TRecord>[];
  labels: InfiniteLogTableLabels;
  locale: string;
  timeZone: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  nextDisabled: boolean;
  previousDisabled: boolean;
  renderDetail?: (record: TRecord) => ReactNode;
}

function defaultFormat(value: unknown, locale: string, timeZone: string, type?: InfiniteLogField["type"]) {
  if (value === null || value === undefined || value === "") return "—";
  if (type === "datetime") {
    const date = new Date(value instanceof Date ? value : String(value));
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium", timeZone }).format(date);
    }
  }
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function GenericInfiniteLogDetail<TRecord extends InfiniteLogBaseRecord>({
  fields,
  labels,
  locale,
  nextDisabled,
  onClose,
  onNext,
  onPrevious,
  previousDisabled,
  record,
  renderDetail,
  timeZone,
}: GenericInfiniteLogDetailProps<TRecord>) {
  const ArrowDown = useIcon("arrow-down");
  const ArrowUp = useIcon("arrow-up");
  const Copy = useIcon("copy");
  const Close = useIcon("x");
  const [copied, setCopied] = useState(false);
  if (!record) return null;

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(JSON.stringify(record, null, 2));
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside
      aria-label={`${record.id} details`}
      className="flex h-full w-full min-h-0 min-w-0 flex-col bg-surface-base"
      data-slot="infinite-log-detail-panel"
    >
      <header className="flex shrink-0 items-start gap-3 border-b border-border-subtle px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-body font-medium text-fg-default">{record.id}</h2>
          <p className="mt-1 text-label text-fg-muted">{labels.timeRange}: {defaultFormat(record.timestamp, locale, timeZone, "datetime")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button aria-label={labels.previousRecord} disabled={previousDisabled} iconOnly onClick={onPrevious} size="sm" type="button" variant="tertiary"><ArrowUp aria-hidden /></Button>
          <Button aria-label={labels.nextRecord} disabled={nextDisabled} iconOnly onClick={onNext} size="sm" type="button" variant="tertiary"><ArrowDown aria-hidden /></Button>
          <Button aria-label={`Close ${record.id} details`} iconOnly onClick={onClose} size="sm" type="button" variant="ghost"><Close aria-hidden /></Button>
        </div>
      </header>
      <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4">
        {renderDetail ? renderDetail(record) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button aria-label={copied ? labels.copied : labels.copyJson} leadingIcon={Copy} onClick={() => void copy()} size="sm" type="button" variant="tertiary">{copied ? labels.copied : labels.copyJson}</Button>
            </div>
            <DetailList className="gap-0">
              {fields.map((field) => {
                const value = getInfiniteLogFieldValue(record, field);
                const formatted = field.formatValue?.(value, record) ?? defaultFormat(value, locale, timeZone, field.type);
                return (
                  <DetailListItem key={field.id}>
                    <DetailListLabel>{field.label ?? field.id}</DetailListLabel>
                    <DetailListValue className={field.type === "json" ? "whitespace-pre-wrap break-all font-mono text-label" : "break-all"}>{formatted}</DetailListValue>
                  </DetailListItem>
                );
              })}
            </DetailList>
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
