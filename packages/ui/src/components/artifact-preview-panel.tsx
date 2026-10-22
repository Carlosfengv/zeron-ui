"use client";

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "#components/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "#components/dropdown";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "#components/empty";
import { InlineNotice, InlineNoticeContent } from "#components/inline-notice";
import { MenuItem } from "#components/menu-item";
import { Tabs, TabsList, TabItem, TabPanel } from "#components/tabs";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";
import { resolveArtifactPreviewLabels } from "./artifact-preview-panel/labels";
import type { ArtifactDocument, ArtifactPreviewLabels, ArtifactPreviewPanelProps, ArtifactRevision } from "./artifact-preview-panel/types";

const Content = lazy(() => import("./artifact-preview-panel/content").then((module) => ({ default: module.ArtifactContent })));

class PreviewBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function RevisionSurface({ artifact, revision, previous, labels, restoring, onRestore, onRetry }: {
  artifact: ArtifactDocument; revision: ArtifactRevision; previous?: ArtifactRevision; labels: ArtifactPreviewLabels;
  restoring: boolean; onRestore?: () => void; onRetry?: () => void;
}) {
  const [view, setView] = useState("preview");
  const [refresh, setRefresh] = useState(0);
  const [notice, setNotice] = useState("");
  const [copying, setCopying] = useState(false);
  const copyLock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const Copy = useIcon("copy");
  const Download = useIcon("arrow-down");
  const Refresh = useIcon("rotate-ccw");
  const streaming = revision.status === "streaming";
  const failed = revision.status === "error";
  const canPreview = artifact.kind !== "code";
  const activeView = streaming || failed || !canPreview && view === "preview" ? "code" : view;
  const [visitedViews, setVisitedViews] = useState<string[]>([]);
  useEffect(() => {
    setVisitedViews((current) => current.includes(activeView) ? current : [...current, activeView]);
  }, [activeView]);
  const copy = async () => {
    if (copyLock.current) return;
    copyLock.current = true;
    setCopying(true);
    try { await navigator.clipboard.writeText(revision.content); if (mounted.current) setNotice(labels.copied); }
    catch { if (mounted.current) setNotice(labels.copyFailed); }
    finally { copyLock.current = false; if (mounted.current) setCopying(false); }
  };
  const download = () => {
    try {
      const type = artifact.kind === "html" ? "text/html" : artifact.kind === "markdown" ? "text/markdown" : "text/plain";
      const url = URL.createObjectURL(new Blob([revision.content], { type: `${type};charset=utf-8` }));
      const link = document.createElement("a");
      link.href = url; link.download = artifact.filename; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { setNotice(labels.downloadFailed); }
  };
  return <>
    <Tabs value={activeView} onValueChange={setView} variant="segment" color="neutral" className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-hairline border-border px-3 py-2">
        <TabsList aria-label={artifact.title}>
          <TabItem value="code" label={labels.code} />
          {canPreview && <TabItem value="preview" label={labels.preview} disabled={streaming || failed} />}
          {previous && <TabItem value="changes" label={labels.changes} disabled={streaming || failed} />}
        </TabsList>
        <div className="flex items-center gap-1">
          {canPreview && <Button size="sm" variant="ghost" iconOnly aria-label={labels.refresh} disabled={streaming || failed || activeView !== "preview"} onClick={() => setRefresh((value) => value + 1)}><Refresh aria-hidden /></Button>}
          <Button size="sm" variant="ghost" iconOnly aria-label={labels.copy} disabled={streaming || failed || copying} onClick={() => void copy()}><Copy aria-hidden /></Button>
          <Button size="sm" variant="ghost" iconOnly aria-label={`${labels.download} ${artifact.filename}`} disabled={streaming || failed} onClick={download}><Download aria-hidden /></Button>
        </div>
      </div>
      {notice && <p role="status" className="px-4 py-2 text-label text-fg-muted">{notice}</p>}
      {failed ? <div className="p-4"><InlineNotice><InlineNoticeContent><span role="alert">{revision.error ?? labels.failed}</span>{onRetry && <Button size="sm" variant="ghost" onClick={onRetry}>{labels.retry}</Button>}</InlineNoticeContent></InlineNotice></div> :
        (["code", "preview", "changes"] as const).filter((item) => item === "code" || item === "preview" && canPreview || item === "changes" && previous).map((item) => <TabPanel key={item} value={item} keepMounted className={cn("min-h-0 min-w-0 flex-1 overflow-auto", activeView !== item && "hidden")}>
          {(!streaming || item === "code") && (activeView === item || visitedViews.includes(item)) && <PreviewBoundary key={item === "preview" ? refresh : 0} fallback={<div className="p-4" role="alert">{labels.failed}</div>}>
            {item === "preview" && artifact.kind === "html" ? <iframe title={`${artifact.title} — ${labels.preview}`} srcDoc={revision.content} sandbox="allow-scripts" referrerPolicy="no-referrer" className="block size-full border-0 bg-surface-floating" /> :
              <Suspense fallback={<p role="status" className="p-4 text-body text-fg-muted">{labels.loading}</p>}><Content artifact={artifact} revision={revision} previous={previous} view={item} /></Suspense>}
          </PreviewBoundary>}
        </TabPanel>)}
    </Tabs>
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t-hairline border-border px-4 py-2 text-label text-fg-muted">
      <span role="status">{streaming ? labels.writing : failed ? labels.failed : labels.ready} · {labels.lines(revision.content ? revision.content.split("\n").length : 0)}</span>
      {onRestore && <Button size="sm" variant="secondary" loading={restoring} disabled={streaming || failed} onClick={onRestore}>{restoring ? labels.restoring : labels.restore}</Button>}
    </div>
  </>;
}

export function ArtifactPreviewPanel({ artifact, revisionId, onRevisionChange, onRestore, onRetry, onClose, locale, labels: overrides, className, ...props }: ArtifactPreviewPanelProps) {
  const labels = resolveArtifactPreviewLabels(locale, overrides);
  const [selected, setSelected] = useState<{ documentId: string; revisionId: string } | null>(null);
  const latest = artifact?.revisions.at(-1);
  const requested = revisionId ?? (selected?.documentId === artifact?.id ? selected?.revisionId : undefined);
  const revision = artifact?.revisions.find((item) => item.id === requested) ?? latest;
  const index = artifact?.revisions.findIndex((item) => item === revision) ?? -1;
  const root = useRef<HTMLElement>(null);
  const restoreLock = useRef(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<{ key: string; text: string } | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const Down = useIcon("chevron-down");
  const Close = useIcon("x");
  const Expand = useIcon("monitor");
  const currentKey = JSON.stringify([artifact?.id, revision?.id]);
  useEffect(() => { setSelected(null); }, [artifact?.id]);
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  const select = (id: string) => {
    if (revisionId === undefined && artifact) setSelected({ documentId: artifact.id, revisionId: id });
    onRevisionChange?.(id);
  };
  const restore = async () => {
    if (!artifact || !revision || !onRestore || restoreLock.current) return;
    restoreLock.current = true; setRestoring(true); setRestoreError(null);
    try {
      await onRestore(artifact, revision);
      if (revisionId === undefined) setSelected((current) =>
        current?.documentId === artifact.id && current.revisionId === revision.id ? null : current);
    }
    catch { setRestoreError({ key: currentKey, text: labels.restoreFailed }); }
    finally { restoreLock.current = false; setRestoring(false); }
  };
  const expand = async () => {
    setFullscreenError(false);
    try { if (document.fullscreenElement === root.current) await document.exitFullscreen(); else await root.current?.requestFullscreen(); }
    catch { setFullscreenError(true); }
  };
  const close = async () => {
    if (document.fullscreenElement === root.current) await document.exitFullscreen().catch(() => {});
    onClose?.();
  };
  return <section {...props} ref={root} aria-label={props["aria-label"] ?? labels.panel} data-slot="artifact-panel" data-artifact-kind="generated" className={cn("flex size-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-floating text-fg-default", className)}>
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-hairline border-border px-4 py-2">
      <div className="min-w-0 flex-1"><h2 className="truncate text-label font-medium" title={artifact?.title}>{artifact?.title ?? labels.panel}</h2>{artifact && <p className="truncate font-mono text-label text-fg-muted" title={artifact.filename}>{artifact.filename}</p>}</div>
      {artifact && revision && <DropdownMenu>
        <DropdownTrigger render={<Button size="sm" variant="ghost" trailingIcon={Down} aria-label={labels.version(index + 1, artifact.revisions.length)}>v{index + 1}</Button>} />
        <DropdownContent align="end" aria-label={labels.versions} checkedIndex={index}>{artifact.revisions.map((item, position) => <MenuItem key={item.id} index={position} label={item.label ?? `v${position + 1}`} trailing={position === artifact.revisions.length - 1 ? <span className="text-label text-fg-muted">{labels.latest}</span> : undefined} checked={item.id === revision.id} onSelect={() => select(item.id)} />)}</DropdownContent>
      </DropdownMenu>}
      <Button size="sm" variant="ghost" iconOnly aria-label={fullscreen ? labels.collapse : labels.expand} onClick={() => void expand()}><Expand aria-hidden /></Button>
      {onClose && <Button size="sm" variant="ghost" iconOnly aria-label={labels.close} onClick={() => void close()}><Close aria-hidden /></Button>}
    </div>
    {fullscreenError && <p role="alert" className="px-4 py-2 text-label text-fg-danger">{labels.expandFailed}</p>}
    {restoreError?.key === currentKey && <p role="alert" className="px-4 py-2 text-label text-fg-danger">{restoreError.text}</p>}
    {artifact && revision ? <RevisionSurface key={currentKey} artifact={artifact} revision={revision} previous={artifact.revisions[index - 1]} labels={labels} restoring={restoring}
      onRestore={onRestore && revision !== latest ? () => void restore() : undefined} onRetry={onRetry ? () => onRetry(artifact, revision) : undefined} /> :
      <div className="flex flex-1 items-center justify-center p-6"><Empty reason="first-use" scope="inline" density="compact"><EmptyHeader><EmptyTitle>{labels.empty}</EmptyTitle><EmptyDescription>{labels.emptyDescription}</EmptyDescription></EmptyHeader></Empty></div>}
  </section>;
}

export { artifactPreviewEnLabels, artifactPreviewZhLabels } from "./artifact-preview-panel/labels";
export type { ArtifactRevision, ArtifactDocument, ArtifactPreviewLabels, ArtifactPreviewPanelProps } from "./artifact-preview-panel/types";
