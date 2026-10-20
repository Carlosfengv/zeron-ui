"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertAction, AlertTitle } from "@zeron/ui/alert";
import { Button } from "@zeron/ui/button";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { resolveArtifactLabels } from "./artifact-labels";
import { ArtifactTabs } from "./artifact-tabs";
import { ArtifactPreview, ArtifactPreviewBoundary } from "./artifact-preview";
import { artifactText, artifactVersionKey, artifactViews, downloadArtifact, getPendingReviewResources, safeArtifactUrl } from "./artifact-utils";
import type { ArtifactLabels, ArtifactPanelProps, ArtifactResource, ArtifactReviewDecision, ArtifactView } from "./chat-workspace-types";

function ArtifactSurface({ resource, labels, onReference, onRetry, renderPreview }: {
  resource: ArtifactResource; labels: ArtifactLabels;
} & Pick<ArtifactPanelProps, "onReference" | "onRetry" | "renderPreview">) {
  const views = artifactViews(resource);
  const [selectedView, setView] = useState<ArtifactView>(views[0]);
  const view = views.includes(selectedView) ? selectedView : views[0];
  const [split, setSplit] = useState(false);
  const [notice, setNotice] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const actionLock = useRef(false);
  const Link = useIcon("link");
  const Copy = useIcon("copy");
  const text = artifactText(resource);
  const url = "url" in resource ? safeArtifactUrl(resource.url, resource.kind === "url") : undefined;
  const downloadable = resource.kind !== "url" && ("content" in resource || url || safeArtifactUrl(resource.downloadUrl));
  const run = async (action: () => void | Promise<void>, success: string, failed: string) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setActionBusy(true);
    setNotice("");
    try { await action(); setNotice(success); } catch { setNotice(failed); }
    finally { actionLock.current = false; setActionBusy(false); }
  };
  return <>
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b-hairline border-border px-4 py-2">
      <span className="min-w-0 flex-1 truncate font-mono text-label text-fg-muted" title={resource.path ?? resource.name}>{resource.path ?? resource.name}</span>
      <div className="flex flex-wrap items-center gap-1">
        {text !== undefined && <Button size="xs" variant="ghost" leadingIcon={Copy} disabled={actionBusy} onClick={() => void run(() => navigator.clipboard.writeText(text), labels.copied, labels.copyFailed)}>{labels.copy}</Button>}
        {downloadable && <Button size="xs" variant="ghost" onClick={() => downloadArtifact(resource)}>{labels.download}</Button>}
        {url && <Button size="xs" variant="ghost" asChild><a href={url} target="_blank" rel="noopener noreferrer">{labels.openExternal}</a></Button>}
        {onReference && <Button size="xs" variant="ghost" leadingIcon={Link} disabled={actionBusy} onClick={() => void run(() => onReference(resource), labels.referenced, labels.referenceFailed)}>{labels.reference}</Button>}
      </div>
    </div>
    {(views.length > 1 || view === "diff") && <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-hairline border-border px-4 py-2">
      <Tabs value={view} onValueChange={(value) => setView(value as ArtifactView)} variant="segment" color="neutral">
        <TabsList aria-label={resource.name}>{views.map((item) => <TabItem key={item} value={item} label={labels[item]} />)}</TabsList>
      </Tabs>
      {view === "diff" && <Button variant="ghost" size="xs" aria-pressed={split} onClick={() => setSplit(!split)}>{split ? labels.split : labels.unified}</Button>}
    </div>}
    {notice && <div className="px-4 py-2 text-label text-fg-muted" role="status">{notice}</div>}
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto" data-slot="artifact-viewport" tabIndex={0} aria-label={`${labels.preview}: ${resource.name}`}>
      <ArtifactPreviewBoundary key={`${view}:${split}:${resource.status ?? "ready"}`} labels={labels}>
        <ArtifactPreview resource={resource} view={view} split={split} labels={labels} renderPreview={renderPreview}
          onRetry={onRetry ? () => void run(() => onRetry(resource), "", labels.failed) : undefined} />
      </ArtifactPreviewBoundary>
    </div>
  </>;
}

function ArtifactTabPanel({ resource, active, ...props }: {
  resource: ArtifactResource; active: boolean; labels: ArtifactLabels;
} & Pick<ArtifactPanelProps, "onReference" | "onRetry" | "renderPreview">) {
  const [visited, setVisited] = useState(active);
  useEffect(() => { if (active) setVisited(true); }, [active]);
  return <TabPanel value={resource.id} keepMounted className={cn("min-h-0 min-w-0 flex-1 flex-col", active ? "flex" : "hidden")}>
    {(active || visited) && <ArtifactSurface resource={resource} {...props} />}
  </TabPanel>;
}

export function ArtifactPanel({ resources, activeId, defaultActiveId, onActiveIdChange, onClose, addAction, onReview, onReference, onRetry, renderPreview, labels: overrides, locale, className, ...props }: ArtifactPanelProps) {
  const labels = resolveArtifactLabels(locale, overrides);
  const [selectedId, setSelectedId] = useState(defaultActiveId ?? resources[0]?.id);
  const requested = activeId === undefined ? selectedId : activeId;
  const active = resources.find((resource) => resource.id === requested) ?? resources[0];
  const [reviewing, setReviewing] = useState(false);
  const [reviewError, setReviewError] = useState(false);
  const reviewLock = useRef(false);
  const root = useRef<HTMLElement>(null);
  const resolvedId = active?.id;
  useEffect(() => {
    if (activeId === undefined) setSelectedId(resolvedId);
  }, [activeId, resolvedId]);

  const select = (id: string) => {
    if (activeId === undefined) setSelectedId(id);
    onActiveIdChange?.(id);
  };
  const close = (resource: ArtifactResource) => {
    if (!onClose) return;
    const index = resources.indexOf(resource);
    const next = resource.id === active?.id ? resources[index + 1] ?? resources[index - 1] : active;
    onClose(resource);
    if (next && next.id !== active?.id) select(next.id);
    requestAnimationFrame(() => {
      const tab = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-artifact-id]") ?? []).find((node) => node.dataset.artifactId === next?.id);
      tab?.focus();
    });
  };
  const pending = getPendingReviewResources(resources);
  const review = async (items: readonly ArtifactResource[], decision: ArtifactReviewDecision) => {
    if (!onReview || reviewLock.current || !items.length) return;
    reviewLock.current = true;
    setReviewing(true);
    setReviewError(false);
    try {
      const results = await Promise.allSettled(items.map((resource) => Promise.resolve().then(() => onReview(resource, decision))));
      setReviewError(results.some((result) => result.status === "rejected"));
    } finally { reviewLock.current = false; setReviewing(false); }
  };

  return <section {...props} ref={root} aria-label={props["aria-label"] ?? labels.panel} data-slot="artifact-panel" className={cn("flex size-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-floating text-fg-default", className)}>
    {active ? <Tabs value={active.id} onValueChange={select} variant="segment" color="default" className="flex min-h-0 flex-1 flex-col">
      <ArtifactTabs resources={resources} activeId={active.id} labels={labels} onSelect={select} onClose={onClose ? close : undefined} addAction={addAction} />
      {resources.map((resource) => <ArtifactTabPanel key={artifactVersionKey(resource)} resource={resource} active={resource.id === active.id} labels={labels} onReference={onReference} onRetry={onRetry} renderPreview={renderPreview} />)}
    </Tabs> : <>
      {addAction && <div className="flex shrink-0 items-center border-b-hairline border-border bg-surface-floating p-2">{addAction}</div>}
      <div className="flex flex-1 items-center justify-center p-6"><Empty reason="first-use" scope="inline" density="compact"><EmptyHeader><EmptyTitle>{labels.empty}</EmptyTitle><EmptyDescription>{labels.emptyDescription}</EmptyDescription></EmptyHeader></Empty></div>
    </>}
    {onReview && pending.length > 0 && <div data-slot="artifact-review-bar" className="shrink-0 p-3">
      <Alert status="info" role="group" aria-busy={reviewing}>
        <AlertTitle role="status">{reviewing ? labels.reviewing : labels.remaining(pending.length)}</AlertTitle>
        <AlertAction><Button variant="ghost" disabled={reviewing} onClick={() => void review(pending, "reject")}>{labels.rejectAll}</Button><Button variant="neutral" disabled={reviewing} onClick={() => void review(pending, "accept")}>{labels.acceptAll}</Button></AlertAction>
      </Alert>
    </div>}
    {reviewError && <div className="shrink-0 p-3"><InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{labels.reviewFailed}</InlineNoticeContent></InlineNotice></div>}
  </section>;
}
