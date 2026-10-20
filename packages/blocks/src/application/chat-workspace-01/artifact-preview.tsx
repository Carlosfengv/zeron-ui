"use client";

import { Component, lazy, Suspense, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@zeron/ui/button";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@zeron/ui/empty";
import { FileType } from "@zeron/ui/file-type";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { safeArtifactUrl } from "./artifact-utils";
import type { ArtifactLabels, ArtifactPanelProps, ArtifactResource, ArtifactView } from "./chat-workspace-types";

const CodePreview = lazy(() => import("./artifact-code-preview").then((module) => ({ default: module.ArtifactCodePreview })));

function PreviewNotice({ children }: { children: ReactNode }) {
  return <div className="p-4"><InlineNotice><InlineNoticeContent>{children}</InlineNoticeContent></InlineNotice></div>;
}

function ImagePreview({ resource, labels }: { resource: Extract<ArtifactResource, { kind: "image" }>; labels: ArtifactLabels }) {
  const viewport = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  // Null tracks the container; numeric values are absolute image scales.
  const [zoom, setZoom] = useState<number | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const hintId = useId();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const url = safeArtifactUrl(resource.url);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const measure = () => setBounds({ width: node.clientWidth, height: node.clientHeight });
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const fit = dimensions.width && bounds.width ? Math.min(Math.max(1, bounds.width - 48) / dimensions.width, Math.max(1, bounds.height - 48) / dimensions.height, 1) : 1;
  const scale = zoom ?? fit;
  const imageReady = !!url && !failed && dimensions.width > 0;
  const canPan = imageReady && (dimensions.width * scale + 48 > bounds.width || dimensions.height * scale + 48 > bounds.height);
  const resetZoom = (value: number | null) => {
    setZoom(value);
    if (viewport.current) { viewport.current.scrollLeft = 0; viewport.current.scrollTop = 0; }
  };
  const stopDrag = () => {
    const current = drag.current;
    drag.current = null;
    if (current && viewport.current?.hasPointerCapture?.(current.id)) viewport.current.releasePointerCapture(current.id);
    setDragging(false);
  };
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-hairline border-border px-4 py-2">
      <span className="text-label text-fg-muted">{dimensions.width ? `${dimensions.width} × ${dimensions.height}` : labels.preview}</span>
      <div className="flex flex-wrap items-center gap-1">
        <Button variant="ghost" iconOnly aria-label={labels.zoomOut} disabled={scale <= 0.05 || !imageReady} onClick={() => setZoom(Math.max(0.05, scale / 1.25))}>−</Button>
        <span className="w-12 text-center text-label tabular-nums" aria-live="polite">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" iconOnly aria-label={labels.zoomIn} disabled={scale >= 8 || !imageReady} onClick={() => setZoom(Math.min(8, Math.max(0.05, scale * 1.25)))}>+</Button>
        <Button variant="ghost" aria-pressed={zoom === 1} disabled={!imageReady} onClick={() => resetZoom(1)}>{labels.actualSize}</Button>
        <Button variant="ghost" aria-pressed={zoom === null} disabled={!imageReady} onClick={() => resetZoom(null)}>{labels.fit}</Button>
      </div>
    </div>
    <p id={hintId} className="sr-only">{labels.panImage}</p>
    <div ref={viewport} data-slot="artifact-image-viewport" className={`relative min-h-0 flex-1 overflow-auto bg-surface-raised ${canPan ? dragging ? "cursor-grabbing" : "cursor-grab" : ""}`} tabIndex={0} aria-label={`${labels.preview}: ${resource.name}`} aria-describedby={hintId}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse" || event.button !== 0 || !dimensions.width || !canPan) return;
        const node = event.currentTarget;
        event.preventDefault();
        node.focus();
        node.setPointerCapture(event.pointerId);
        drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: node.scrollLeft, top: node.scrollTop };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start || start.id !== event.pointerId) return;
        event.currentTarget.scrollLeft = start.left + start.x - event.clientX;
        event.currentTarget.scrollTop = start.top + start.y - event.clientY;
      }}
      onPointerUp={(event) => {
        if (drag.current?.id !== event.pointerId) return;
        stopDrag();
      }} onPointerCancel={stopDrag} onLostPointerCapture={stopDrag}>
      {!url ? <PreviewNotice>{labels.unavailableUrl}</PreviewNotice> : failed ? <PreviewNotice><span>{labels.failed} </span><Button size="sm" variant="ghost" onClick={() => { setFailed(false); setDimensions({ width: 0, height: 0 }); setAttempt((value) => value + 1); }}>{labels.retry}</Button></PreviewNotice> :
        <div className="grid min-h-full min-w-full w-max place-items-center p-6">
          {!dimensions.width && <span role="status" className="text-label text-fg-muted">{labels.loading}</span>}
          {/* eslint-disable-next-line @next/next/no-img-element -- natural dimensions drive the zoomable viewer. */}
          <img key={attempt} src={url} alt={resource.alt ?? resource.name} draggable={false} className="block max-w-none"
            style={{ width: dimensions.width ? dimensions.width * scale : undefined, height: dimensions.height ? dimensions.height * scale : undefined, visibility: dimensions.width ? "visible" : "hidden" }}
            onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => { stopDrag(); setFailed(true); }} />
        </div>}
    </div>
  </div>;
}

function WebPreview({ resource, labels }: { resource: Extract<ArtifactResource, { kind: "url" }>; labels: ArtifactLabels }) {
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  const url = safeArtifactUrl(resource.url, true);
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex shrink-0 items-center gap-2 border-b-hairline border-border px-4 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-label text-fg-muted" title={url}>{url ?? labels.unavailableUrl}</span>
      <Button size="xs" variant="ghost" disabled={!url} onClick={() => { setLoading(true); setAttempt((value) => value + 1); }}>{labels.refresh}</Button>
    </div>
    <p className="shrink-0 px-4 py-2 text-label text-fg-muted">{labels.webNotice}</p>
    {url ? <div className="relative min-h-0 flex-1">
      {loading && <span role="status" className="absolute left-4 top-3 text-label text-fg-muted">{labels.loading}</span>}
      <iframe key={attempt} src={url} title={resource.name} sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" className="size-full border-0 bg-surface-floating" onLoad={() => setLoading(false)} />
    </div> : <PreviewNotice>{labels.unavailableUrl}</PreviewNotice>}
  </div>;
}

export function ArtifactPreview({ resource, view, split, labels, renderPreview, onRetry }: {
  resource: ArtifactResource; view: ArtifactView; split: boolean; labels: ArtifactLabels;
  renderPreview?: ArtifactPanelProps["renderPreview"]; onRetry?: () => void;
}) {
  if (resource.status === "loading") return <PreviewNotice><span role="status">{labels.loading}</span></PreviewNotice>;
  if (resource.status === "error") return <PreviewNotice><span role="alert">{resource.error ?? labels.failed}</span>{onRetry && <Button variant="ghost" size="sm" onClick={onRetry}>{labels.retry}</Button>}</PreviewNotice>;
  const custom = renderPreview?.(resource);
  if (custom !== undefined) return custom;
  if ("content" in resource) return <Suspense fallback={<PreviewNotice>{labels.loading}</PreviewNotice>}><CodePreview resource={resource} view={view} split={split} /></Suspense>;
  if (resource.kind === "image") return <ImagePreview key={resource.url} resource={resource} labels={labels} />;
  if (resource.kind === "url") return <WebPreview key={resource.url} resource={resource} labels={labels} />;
  return <div className="flex flex-1 items-center justify-center p-6"><Empty reason="no-data" scope="inline" density="compact">
    <FileType fileName={resource.name} size="xl" />
    <EmptyHeader><EmptyTitle>{resource.name}</EmptyTitle><EmptyDescription>{labels.unsupported}</EmptyDescription></EmptyHeader>
    <p className="text-label text-fg-muted">{[resource.mimeType, resource.size !== undefined && `${resource.size.toLocaleString()} B`].filter(Boolean).join(" · ")}</p>
  </Empty></div>;
}

export class ArtifactPreviewBoundary extends Component<{ children: ReactNode; labels: ArtifactLabels }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <PreviewNotice><span role="alert">{this.props.labels.failed}</span><Button size="sm" variant="ghost" onClick={() => this.setState({ failed: false })}>{this.props.labels.retry}</Button></PreviewNotice> : this.props.children;
  }
}
