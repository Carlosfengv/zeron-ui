"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import {
  DetailList,
  DetailListItem,
  DetailListLabel,
  DetailListValue,
} from "@zeron/ui/detail-list";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { InputCopy } from "@zeron/ui/input-copy";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { Switch } from "@zeron/ui/switch";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { formatAgentMessageTraceDuration } from "./agent-message-trace-model";
import type {
  AgentMessageTraceInspectorLabels,
  AgentMessageTraceMessage,
  AgentMessageTraceSpan,
} from "./agent-message-trace-types";

const kindColors = {
  chat: "violet",
  agent: "red",
  tool: "lime",
} as const;

const statusColors = {
  running: "blue",
  success: "green",
  error: "red",
  cancelled: "amber",
} as const;

export const defaultAgentMessageTraceInspectorLabels: AgentMessageTraceInspectorLabels = {
  ariaLabel: "Selected span details",
  selectPrompt: "Select a trace row to inspect its details.",
  missingSelection: "The selected span is no longer available.",
  inputOutput: "Input / Output",
  attributes: "Attributes",
  events: "Events",
  input: "Input",
  output: "Output",
  pretty: "Pretty",
  json: "JSON",
  model: "Model",
  provider: "Provider",
  duration: "Duration",
  finish: "Finish",
  operation: "Operation",
  conversation: "Conversation",
  spanId: "Span ID",
  parentSpanId: "Parent span ID",
  status: "Status",
  truncated: "Truncated",
  unavailable: "Unavailable",
  pending: "Pending",
  copy: "Copy",
  copied: "Copied",
  noAttributes: "No attributes were recorded for this span.",
  noEvents: "No events were recorded for this span.",
};

function serialize(value: unknown): string {
  if (value === undefined) return "undefined";
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "string") return value;

  const seen = new WeakSet<object>();
  try {
    const result = JSON.stringify(value, (_key, item: unknown) => {
      if (typeof item === "bigint") return item.toString();
      if (typeof item === "object" && item !== null) {
        if (seen.has(item)) return "[Circular]";
        seen.add(item);
      }
      return item;
    }, 2);
    return result ?? String(value);
  } catch {
    return String(value);
  }
}

const traceRecordClassName = "rounded-xl border border-border bg-surface-floating p-3";
const messageRoleIcons: Record<string, IconName> = {
  system: "settings",
  user: "user",
  assistant: "brain",
};

function isMessage(value: unknown): value is AgentMessageTraceMessage {
  return (
    typeof value === "object"
    && value !== null
    && "role" in value
    && typeof value.role === "string"
    && "content" in value
  );
}

function isMessageArray(value: unknown): value is AgentMessageTraceMessage[] {
  return Array.isArray(value) && value.every((item) => (
    typeof item === "object"
    && item !== null
    && "role" in item
    && typeof item.role === "string"
    && "content" in item
  ));
}

function PayloadText({ mode, value }: { mode: "pretty" | "json"; value: unknown }) {
  return (
    <pre className={cn(
      "whitespace-pre-wrap break-words text-body text-fg-muted",
      mode === "json" || typeof value !== "string" ? "font-mono" : "font-sans"
    )}>
      {serialize(value)}
    </pre>
  );
}

function MessageRecord({ message }: { message: AgentMessageTraceMessage }) {
  const RoleIcon = useIcon(messageRoleIcons[message.role.toLowerCase()] ?? "message-circle");

  return (
    <div className={traceRecordClassName}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <RoleIcon aria-hidden className="shrink-0 text-fg-subtle" size={14} strokeWidth={1.75} />
          <span className="min-w-0 truncate text-body font-medium text-fg-default">{message.role}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-border-subtle pt-3">
        <PayloadText mode="pretty" value={message.content} />
      </div>
    </div>
  );
}

function PayloadValue({ mode, value }: { mode: "pretty" | "json"; value: unknown }) {
  if (mode === "pretty" && isMessageArray(value)) {
    return (
      <div className="flex flex-col gap-2">
        {value.map((message, index) => <MessageRecord key={`${message.role}-${index}`} message={message} />)}
      </div>
    );
  }

  if (mode === "pretty" && isMessage(value)) return <MessageRecord message={value} />;

  return (
    <div className={traceRecordClassName}>
      <PayloadText mode={mode} value={value} />
    </div>
  );
}

function PayloadCopyButton({
  label,
  labels,
  value,
}: {
  label: string;
  labels: AgentMessageTraceInspectorLabels;
  value: string;
}) {
  const CopyIcon = useIcon("copy");
  const CheckIcon = useIcon("check");
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const accessibleLabel = copied ? labels.copied : `${labels.copy} ${label}`;

  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopied(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopied(false), 2_000);
  };

  return (
    <Tooltip content={accessibleLabel}>
      <Button aria-label={accessibleLabel} iconOnly onClick={copy} size="xs" type="button" variant="ghost">
        {copied ? <CheckIcon aria-hidden size={14} /> : <CopyIcon aria-hidden size={14} />}
      </Button>
    </Tooltip>
  );
}

function PayloadSection({
  label,
  labels,
  mode,
  present,
  pending,
  truncated,
  value,
}: {
  label: string;
  labels: AgentMessageTraceInspectorLabels;
  mode: "pretty" | "json";
  present: boolean;
  pending?: boolean;
  truncated?: boolean;
  value: unknown;
}) {
  const copyValue = present ? serialize(value) : "";

  return (
    <section className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-control-md items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="text-label font-medium uppercase tracking-wide text-fg-subtle">{label}</h3>
          {truncated && <Badge color="amber" size="sm">{labels.truncated}</Badge>}
        </div>
        {present && <PayloadCopyButton label={label} labels={labels} value={copyValue} />}
      </div>
      <div className="min-h-24">
        {present ? <PayloadValue mode={mode} value={value} /> : (
          <div className={traceRecordClassName}>
            <p className="text-body text-fg-subtle">{pending ? labels.pending : labels.unavailable}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function valueLabel(value: unknown, labels: AgentMessageTraceInspectorLabels): ReactNode {
  return value === undefined || value === "" ? labels.unavailable : String(value);
}

function Metadata({
  labels,
  locale,
  nowOffsetMs,
  span,
}: {
  labels: AgentMessageTraceInspectorLabels;
  locale: string;
  nowOffsetMs?: number;
  span: AgentMessageTraceSpan;
}) {
  const duration = span.durationMs ?? (span.status === "running" && nowOffsetMs !== undefined
    ? Math.max(0, nowOffsetMs - span.startOffsetMs)
    : undefined);
  const fields = [
    [labels.model, span.model],
    [labels.provider, span.provider],
    [labels.duration, duration === undefined ? undefined : formatAgentMessageTraceDuration(duration, locale)],
    [labels.finish, span.finishReason],
    [labels.operation, span.operation],
    [labels.conversation, span.conversationId],
    [labels.status, span.status],
  ] as const;

  return (
    <div className="flex flex-col gap-3 p-3">
      <DetailList>
        {fields.map(([label, value]) => (
          <DetailListItem key={label}>
            <DetailListLabel>{label}</DetailListLabel>
            <DetailListValue title={value === undefined ? undefined : String(value)}>
              {valueLabel(value, labels)}
            </DetailListValue>
          </DetailListItem>
        ))}
      </DetailList>
      <InputCopy label={labels.spanId} value={span.id} />
      {span.parentId && <InputCopy label={labels.parentSpanId} value={span.parentId} />}
    </div>
  );
}

function AttributesPanel({ labels, span }: { labels: AgentMessageTraceInspectorLabels; span: AgentMessageTraceSpan }) {
  const entries = Object.entries(span.attributes ?? {}).sort(([left], [right]) => left.localeCompare(right));
  if (entries.length === 0) return <p className="p-3 text-body text-fg-subtle">{labels.noAttributes}</p>;

  return (
    <div className="p-3">
      <DetailList>
        {entries.map(([key, value]) => (
          <DetailListItem key={key}>
            <DetailListLabel>{key}</DetailListLabel>
            <DetailListValue>{serialize(value)}</DetailListValue>
          </DetailListItem>
        ))}
      </DetailList>
    </div>
  );
}

function EventsPanel({ labels, locale, span }: { labels: AgentMessageTraceInspectorLabels; locale: string; span: AgentMessageTraceSpan }) {
  const events = span.events ?? [];
  if (events.length === 0) return <p className="p-3 text-body text-fg-subtle">{labels.noEvents}</p>;

  return (
    <ol className="flex flex-col gap-2 p-3">
      {events.map((event) => (
        <li className={traceRecordClassName} key={event.id}>
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-body font-medium text-fg-default">{event.name}</span>
            <div className="flex shrink-0 items-center gap-2">
              {event.status && <Badge color={statusColors[event.status]} size="sm">{event.status}</Badge>}
              <span className="font-mono text-label tabular-nums text-fg-subtle">
                +{formatAgentMessageTraceDuration(event.startOffsetMs, locale)}
              </span>
            </div>
          </div>
          {event.payload !== undefined && <div className="mt-3 border-t border-border-subtle pt-3"><PayloadText mode="pretty" value={event.payload} /></div>}
          {event.attributes && Object.keys(event.attributes).length > 0 && (
            <pre className="mt-3 whitespace-pre-wrap break-words border-t border-border-subtle pt-3 font-mono text-label text-fg-muted">
              {serialize(event.attributes)}
            </pre>
          )}
        </li>
      ))}
    </ol>
  );
}

export interface AgentMessageTraceInspectorProps {
  span?: AgentMessageTraceSpan;
  selectedSpanId?: string | null;
  labels?: Partial<AgentMessageTraceInspectorLabels>;
  locale?: string;
  nowOffsetMs?: number;
  className?: string;
}

export function AgentMessageTraceInspector({
  span,
  selectedSpanId,
  labels: labelOverrides,
  locale = "en",
  nowOffsetMs,
  className,
}: AgentMessageTraceInspectorProps) {
  const labels = useMemo(
    () => ({ ...defaultAgentMessageTraceInspectorLabels, ...labelOverrides }),
    [labelOverrides]
  );
  const [payloadMode, setPayloadMode] = useState<"pretty" | "json">("pretty");
  const [activeInspectorTab, setActiveInspectorTab] = useState("payload");

  if (!span) {
    return (
      <aside aria-label={labels.ariaLabel} className={cn("flex size-full min-h-0 items-center", className)}>
        <Empty density="compact" reason="informational" scope="inline">
          <EmptyHeader>
            <EmptyTitle>{selectedSpanId ? labels.missingSelection : labels.selectPrompt}</EmptyTitle>
            <EmptyDescription>{selectedSpanId ? selectedSpanId : labels.ariaLabel}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </aside>
    );
  }

  const hasInput = Object.prototype.hasOwnProperty.call(span, "input");
  const hasOutput = Object.prototype.hasOwnProperty.call(span, "output");

  return (
    <aside aria-label={labels.ariaLabel} className={cn("flex size-full min-h-0 flex-col text-fg-default", className)}>
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <Badge color={kindColors[span.kind]} size="sm" variant="dot">{span.kind}</Badge>
        <h2 className="min-w-0 flex-1 truncate text-body font-semibold" title={span.name}>{span.name}</h2>
        <Badge color={statusColors[span.status]} size="sm">{span.status}</Badge>
      </header>

      <ScrollArea className="min-h-0 flex-1 [container-type:inline-size]">
        <Metadata labels={labels} locale={locale} nowOffsetMs={nowOffsetMs} span={span} />
        <Tabs
          className="w-[100cqw] min-w-0 overflow-hidden border-t border-border"
          color="neutral"
          onValueChange={setActiveInspectorTab}
          value={activeInspectorTab}
          variant="pill"
        >
          <div className="flex min-w-0 max-w-full items-center justify-between gap-1 p-3 pb-0">
            <TabsList className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
              <TabItem className="shrink-0" label={labels.inputOutput} value="payload" />
              <TabItem className="shrink-0" label={labels.attributes} value="attributes" badge={Object.keys(span.attributes ?? {}).length} />
              <TabItem className="shrink-0" label={labels.events} value="events" badge={span.events?.length ?? 0} />
            </TabsList>
            {activeInspectorTab === "payload" && (
              <Switch
                checked={payloadMode === "json"}
                className="shrink-0 gap-1.5 px-0"
                label={labels.json}
                onCheckedChange={(checked) => setPayloadMode(checked ? "json" : "pretty")}
              />
            )}
          </div>
          <TabPanel className="p-3" value="payload">
            <div className="flex flex-col gap-5">
              <PayloadSection
                label={labels.input}
                labels={labels}
                mode={payloadMode}
                present={hasInput}
                truncated={span.inputTruncated}
                value={span.input}
              />
              {span.error && (
                <InlineNotice role="alert" tone="danger" variant="emphasized">
                  <InlineNoticeContent>
                    {span.error.code ? `${span.error.code}: ` : ""}{span.error.message}
                  </InlineNoticeContent>
                </InlineNotice>
              )}
              <PayloadSection
                label={labels.output}
                labels={labels}
                mode={payloadMode}
                pending={span.status === "running"}
                present={hasOutput}
                truncated={span.outputTruncated}
                value={span.output}
              />
            </div>
          </TabPanel>
          <TabPanel value="attributes"><AttributesPanel labels={labels} span={span} /></TabPanel>
          <TabPanel value="events"><EventsPanel labels={labels} locale={locale} span={span} /></TabPanel>
        </Tabs>
      </ScrollArea>
    </aside>
  );
}
