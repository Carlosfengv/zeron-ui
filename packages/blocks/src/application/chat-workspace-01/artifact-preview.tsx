"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
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
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const url = safeArtifactUrl(resource.url);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const measure = () => setBounds({ width: node.clientWidth, height: node.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const fit = dimensions.width && bounds.width ? Math.min(Math.max(1, bounds.width - 48) / dimensions.width, Math.max(1, bounds.height - 48) / dimensions.height, 1) : 1;
  return <div className="flex min-h-0 flex-1 flex-col">
    <div className="flex shrink-0 items-center justify-between gap-3 border-b-hairline border-border px-4 py-2">
      <span className="text-label text-fg-muted">{dimensions.width ? `${dimensions.width} × ${dimensions.height}` : labels.preview}</span>
      <div className="flex items-center gap-2">
        <Button size="xs" variant="ghost" iconOnly aria-label={labels.zoomOut} disabled={zoom <= 0.25 || !dimensions.width} onClick={() => setZoom((value) => Math.max(0.25, value / 1.25))}>−</Button>
        <span className="w-12 text-center text-label tabular-nums">{Math.round(fit * zoom * 100)}%</span>
        <Button size="xs" variant="ghost" iconOnly aria-label={labels.zoomIn} disabled={zoom >= 8 || !dimensions.width} onClick={() => setZoom((value) => Math.min(8, value * 1.25))}>+</Button>
        <Button size="xs" variant="ghost" onClick={() => setZoom(1)}>{labels.fit}</Button>
      </div>
    </div>
    <div ref={viewport} className="relative min-h-0 flex-1 overflow-auto bg-surface-raised" tabIndex={0} aria-label={`${labels.preview}: ${resource.name}`}>
      {!url ? <PreviewNotice>{labels.unavailableUrl}</PreviewNotice> : failed ? <PreviewNotice><span>{labels.failed} </span><Button size="sm" variant="ghost" onClick={() => { setFailed(false); setDimensions({ width: 0, height: 0 }); setAttempt((value) => value + 1); }}>{labels.retry}</Button></PreviewNotice> :
        <div className="grid min-h-full min-w-full w-max place-items-center p-6">
          {!dimensions.width && <span role="status" className="text-label text-fg-muted">{labels.loading}</span>}
          {/* eslint-disable-next-line @next/next/no-img-element -- natural dimensions drive the zoomable viewer. */}
          <img key={attempt} src={url} alt={resource.alt ?? resource.name} draggable={false} className="block max-w-none"
            style={{ width: dimensions.width ? dimensions.width * fit * zoom : undefined, height: dimensions.height ? dimensions.height * fit * zoom : undefined, visibility: dimensions.width ? "visible" : "hidden" }}
            onLoad={(event) => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} onError={() => setFailed(true)} />
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
