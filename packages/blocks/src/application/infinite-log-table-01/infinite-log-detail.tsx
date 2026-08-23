"use client";

import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListSection,
  DetailListSectionLabel,
  DetailListSeparator,
  DetailListValue,
} from "@zeron/ui/detail-list";
import { MobileDrawer } from "@zeron/ui/mobile-drawer";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { useIcon } from "@zeron/ui/system/icon-context";
import { useState, type RefObject } from "react";
import { infiniteLogOutcomeVisuals } from "./infinite-log-outcome";
import { formatMilliseconds, InfiniteLogTimingBar } from "./infinite-log-timing";
import type { InfiniteLogRecord, InfiniteLogTableLabels } from "./infinite-log-types";

interface InfiniteLogDetailProps {
  open: boolean;
  record?: InfiniteLogRecord;
  labels: InfiniteLogTableLabels;
  locale: string;
  timeZone: string;
  onOpenChange: (open: boolean) => void;
  triggerRef?: RefObject<HTMLElement | null>;
  renderDetail?: (record: InfiniteLogRecord) => React.ReactNode;
}

export function InfiniteLogDetail({ open, record, labels, locale, timeZone, onOpenChange, triggerRef, renderDetail }: InfiniteLogDetailProps) {
  const Copy = useIcon("copy");
  const Close = useIcon("x");
  const [copied, setCopied] = useState(false);
  if (!record) return null;
  const timestamp = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    second: "2-digit",
    year: "numeric",
    timeZone,
  }).format(new Date(record.timestamp));

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
      ariaLabel={`${record.pathname} request details`}
      onClose={() => onOpenChange(false)}
      open={open}
      panelClassName="w-[min(32rem,calc(100vw-1.5rem))] overflow-hidden p-0"
      side="end"
      triggerRef={triggerRef}
    >
      <div className="flex h-full min-h-0 w-full flex-col bg-surface-base">
        <header className="flex shrink-0 items-start gap-3 border-b border-border-subtle px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-body font-medium text-fg-default" title={record.pathname}>{record.pathname}</h2>
            <p className="mt-1 break-all font-mono text-label text-fg-muted">{record.id}</p>
          </div>
          <Button aria-label="Close request details" className="shrink-0" iconOnly onClick={() => onOpenChange(false)} size="sm" type="button" variant="ghost"><Close aria-hidden /></Button>
        </header>
        <ScrollArea className="min-h-0 flex-1" viewportClassName="p-4">
          {renderDetail ? renderDetail(record) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge color={infiniteLogOutcomeVisuals[record.outcome].badgeColor} data-outcome={record.outcome} size="sm">{record.outcome}</Badge>
                <span className="font-mono text-label text-fg-muted">{record.method} {record.status}</span>
                <span className="text-label text-fg-muted">{formatMilliseconds(record.latency)}</span>
                <Button aria-label={copied ? labels.copied : labels.copyJson} iconOnly onClick={() => void copy()} size="sm" type="button" variant="ghost"><Copy aria-hidden /></Button>
                {copied && <span aria-live="polite" className="text-label text-fg-success">{labels.copied}</span>}
              </div>
              <DetailList className="gap-0">
                <DetailListItem><DetailListLabel>Request ID</DetailListLabel><DetailListValue className="font-mono text-label break-all">{record.id}</DetailListValue></DetailListItem>
                {record.traceId && <DetailListItem><DetailListLabel>Trace ID</DetailListLabel><DetailListValue className="font-mono text-label break-all">{record.traceId}</DetailListValue></DetailListItem>}
                {record.spanId && <DetailListItem><DetailListLabel>Span ID</DetailListLabel><DetailListValue className="font-mono text-label break-all">{record.spanId}</DetailListValue></DetailListItem>}
                <DetailListItem><DetailListLabel>Timestamp</DetailListLabel><DetailListValue><time dateTime={record.timestamp} title={record.timestamp}>{timestamp}</time></DetailListValue></DetailListItem>
                <DetailListItem><DetailListLabel>Request</DetailListLabel><DetailListValue className="break-all">{record.host}{record.pathname}</DetailListValue></DetailListItem>
                <DetailListItem><DetailListLabel>{labels.region}</DetailListLabel><DetailListValue>{record.region}</DetailListValue></DetailListItem>
                <DetailListItem><DetailListLabel>{labels.timingPhases}</DetailListLabel><DetailListValue className="w-full max-w-none"><InfiniteLogTimingBar latency={record.latency} timing={record.timing} /></DetailListValue></DetailListItem>
                {record.message && <DetailListItem><DetailListLabel>Message</DetailListLabel><DetailListValue className="whitespace-pre-wrap break-words">{record.message}</DetailListValue></DetailListItem>}
                {Object.keys(record.headers).length > 0 && (
                  <>
                    <DetailListSeparator />
                    <DetailListSection aria-labelledby="infinite-log-headers-label">
                      <DetailListSectionLabel id="infinite-log-headers-label">Headers</DetailListSectionLabel>
                      {Object.entries(record.headers).map(([key, value]) => (
                        <DetailListItem key={key}><DetailListLabel>{key}</DetailListLabel><DetailListValue className="font-mono text-label break-all">{value}</DetailListValue></DetailListItem>
                      ))}
                    </DetailListSection>
                  </>
                )}
              </DetailList>
            </div>
          )}
        </ScrollArea>
      </div>
    </MobileDrawer>
  );
}
