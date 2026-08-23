"use client";

import { Button } from "@zeron/ui/button";
import { DetailList, DetailListItem, DetailListLabel, DetailListValue } from "@zeron/ui/detail-list";
import { MobileDrawer } from "@zeron/ui/mobile-drawer";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { useIcon } from "@zeron/ui/system/icon-context";
import { useState, type ReactNode, type RefObject } from "react";
import { getInfiniteLogFieldValue } from "./infinite-log-fields";
import type { InfiniteLogBaseRecord, InfiniteLogField, InfiniteLogTableLabels } from "./infinite-log-types";

interface GenericInfiniteLogDetailProps<TRecord extends InfiniteLogBaseRecord> {
  open: boolean;
  record?: TRecord;
  fields: readonly InfiniteLogField<TRecord>[];
  labels: InfiniteLogTableLabels;
  locale: string;
  timeZone: string;
  onOpenChange: (open: boolean) => void;
  triggerRef?: RefObject<HTMLElement | null>;
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
  onOpenChange,
  open,
  record,
  renderDetail,
  timeZone,
  triggerRef,
}: GenericInfiniteLogDetailProps<TRecord>) {
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
    <MobileDrawer
      ariaLabel={`${record.id} details`}
      onClose={() => onOpenChange(false)}
      open={open}
      panelClassName="w-[min(32rem,calc(100vw-1.5rem))] overflow-hidden p-0"
      side="end"
      triggerRef={triggerRef}
    >
      <div className="flex h-full min-h-0 w-full flex-col bg-surface-base">
        <header className="flex shrink-0 items-start gap-3 border-b border-border-subtle px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-body font-medium text-fg-default">{record.id}</h2>
            <p className="mt-1 text-label text-fg-muted">{labels.timeRange}: {defaultFormat(record.timestamp, locale, timeZone, "datetime")}</p>
          </div>
          <Button aria-label={`Close ${record.id} details`} className="shrink-0" iconOnly onClick={() => onOpenChange(false)} size="sm" type="button" variant="ghost"><Close aria-hidden /></Button>
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
      </div>
    </MobileDrawer>
  );
}
