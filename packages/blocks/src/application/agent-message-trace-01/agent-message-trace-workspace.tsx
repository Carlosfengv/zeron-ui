"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@zeron/ui/resizable";
import { cn } from "@zeron/ui/system/utils";
import { AgentMessageTraceInspector } from "./agent-message-trace-inspector";
import { AgentMessageTraceTimeline } from "./agent-message-trace";
import type { AgentMessageTraceWorkspaceProps } from "./agent-message-trace-types";

const HORIZONTAL_BREAKPOINT = 900;

function firstSelectableSpanId(data: AgentMessageTraceWorkspaceProps["data"]): string | null {
  return data.spans.find((span) => span.parentId === null)?.id ?? data.spans[0]?.id ?? null;
}

export function AgentMessageTrace({
  data,
  state,
  errorMessage,
  labels,
  defaultExpandedDepth,
  expandedSpanIds,
  onExpandedSpanIdsChange,
  selectedSpanId,
  defaultSelectedSpanId,
  onSelectedSpanIdChange,
  onSpanSelect,
  visibleKinds,
  onVisibleKindsChange,
  nowOffsetMs,
  maxHeight,
  locale,
  showToolbar,
  inspectorLabels,
  inspectorDefaultSize = "400px",
  inspectorMinSize = "320px",
  inspectorMaxSize = "50%",
  className,
  ...props
}: AgentMessageTraceWorkspaceProps) {
  const firstSpanId = useMemo(() => firstSelectableSpanId(data), [data]);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(() => (
    defaultSelectedSpanId === undefined ? firstSpanId : defaultSelectedSpanId
  ));
  const resolvedSelectedId = selectedSpanId === undefined ? internalSelectedId : selectedSpanId;
  const selectedSpan = useMemo(
    () => data.spans.find((span) => span.id === resolvedSelectedId),
    [data.spans, resolvedSelectedId]
  );
  const containerRef = useRef<HTMLElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const horizontal = containerWidth === 0 || containerWidth >= HORIZONTAL_BREAKPOINT;

  useEffect(() => {
    if (selectedSpanId !== undefined) return;
    setInternalSelectedId((current) => {
      if (current !== null && data.spans.some((span) => span.id === current)) return current;
      if (current === null && defaultSelectedSpanId === null) return null;
      return firstSpanId;
    });
  }, [data.spans, defaultSelectedSpanId, firstSpanId, selectedSpanId]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateWidth = () => setContainerWidth(container.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const handleSelectionChange = (spanId: string | null) => {
    if (selectedSpanId === undefined) setInternalSelectedId(spanId);
    onSelectedSpanIdChange?.(spanId);
  };

  return (
    <section
      {...props}
      ref={containerRef}
      className={cn("size-full min-h-0 min-w-0 overflow-hidden bg-surface-raised", className)}
      data-block="agent-message-trace-01"
      data-layout={horizontal ? "horizontal" : "vertical"}
    >
      <ResizablePanelGroup
        key={horizontal ? "horizontal" : "vertical"}
        aria-label="Agent message trace workspace"
        className="gap-2"
        orientation={horizontal ? "horizontal" : "vertical"}
      >
        <ResizablePanel
          className="overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating"
          defaultSize={horizontal ? undefined : "60%"}
          id={`agent-message-trace-timeline-${horizontal ? "horizontal" : "vertical"}`}
          minSize={horizontal ? "30rem" : "10rem"}
        >
          <div className="size-full min-h-0 min-w-0 p-3">
            <AgentMessageTraceTimeline
              data={data}
              defaultExpandedDepth={defaultExpandedDepth}
              errorMessage={errorMessage}
              expandedSpanIds={expandedSpanIds}
              labels={labels}
              locale={locale}
              maxHeight={maxHeight}
              nowOffsetMs={nowOffsetMs}
              onExpandedSpanIdsChange={onExpandedSpanIdsChange}
              onSelectedSpanIdChange={handleSelectionChange}
              onSpanSelect={onSpanSelect}
              onVisibleKindsChange={onVisibleKindsChange}
              selectedSpanId={resolvedSelectedId}
              showToolbar={showToolbar}
              state={state}
              visibleKinds={visibleKinds}
            />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel
          className="overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating"
          defaultSize={horizontal ? inspectorDefaultSize : "40%"}
          groupResizeBehavior={horizontal ? "preserve-pixel-size" : "preserve-relative-size"}
          id={`agent-message-trace-inspector-${horizontal ? "horizontal" : "vertical"}`}
          maxSize={horizontal ? inspectorMaxSize : "65%"}
          minSize={horizontal ? inspectorMinSize : "10rem"}
        >
          <AgentMessageTraceInspector
            labels={inspectorLabels}
            locale={locale}
            nowOffsetMs={nowOffsetMs}
            selectedSpanId={resolvedSelectedId}
            span={selectedSpan}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </section>
  );
}

export const AgentMessageTraceWorkspace = AgentMessageTrace;
