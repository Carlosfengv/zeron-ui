"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertAction, AlertTitle } from "@zeron/ui/alert";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { MenuItem } from "@zeron/ui/menu-item";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { resolveArtifactLabels } from "./artifact-labels";
import { ArtifactTabs } from "./artifact-tabs";
import { ArtifactPreview, ArtifactPreviewBoundary } from "./artifact-preview";
import { artifactReviewStatus, artifactText, artifactVersionKey, artifactViews, downloadArtifact, getPendingReviewResources, safeArtifactUrl } from "./artifact-utils";
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
  const reviewStatus = artifactReviewStatus(resource);
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
      {reviewStatus && <span className="shrink-0 text-label text-fg-muted">{labels[reviewStatus]}</span>}
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

export function ArtifactPanel({ resources, activeId, defaultActiveId, onActiveIdChange, onClose, onCloseMany, addAction, onReview, onReference, onRetry, renderPreview, labels: overrides, locale, className, ...props }: ArtifactPanelProps) {
  const labels = resolveArtifactLabels(locale, overrides);
  const [selectedId, setSelectedId] = useState(defaultActiveId ?? resources[0]?.id);
  const requested = activeId === undefined ? selectedId : activeId;
  const active = resources.find((resource) => resource.id === requested) ?? resources[0];
  const [reviewing, setReviewing] = useState(false);
  const [reviewErrors, setReviewErrors] = useState<string[]>([]);
  const reviewLock = useRef(false);
  const root = useRef<HTMLElement>(null);
  const resolvedId = active?.id;
  const Previous = useIcon("chevron-left");
  const Next = useIcon("chevron-right");
  const Down = useIcon("chevron-down");
  const More = useIcon("ellipsis");
  const Check = useIcon("check");
  useEffect(() => {
    if (activeId === undefined) setSelectedId(resolvedId);
  }, [activeId, resolvedId]);

  const select = (id: string) => {
    if (activeId === undefined) setSelectedId(id);
    onActiveIdChange?.(id);
  };
  const focusTab = (id?: string) => requestAnimationFrame(() => {
    const tab = Array.from(root.current?.querySelectorAll<HTMLElement>("[data-artifact-id]") ?? []).find((node) => node.dataset.artifactId === id);
    if (tab) tab.focus();
    else root.current?.querySelector<HTMLElement>("button")?.focus();
  });
  const closable = !!(onClose || onCloseMany);
  const close = (items: readonly ArtifactResource[]) => {
    if (!closable || !items.length) return;
    const ids = new Set(items.map((item) => item.id));
    const index = resources.findIndex((item) => item.id === active?.id);
    const next = active && !ids.has(active.id) ? active
      : resources.slice(index + 1).find((item) => !ids.has(item.id)) ?? resources.slice(0, index).reverse().find((item) => !ids.has(item.id));
    if (onCloseMany) onCloseMany(items);
    else items.forEach((item) => onClose?.(item));
    if (next && next.id !== active?.id) select(next.id);
    focusTab(next?.id);
  };
  const pending = getPendingReviewResources(resources);
  const pendingIndex = pending.findIndex((resource) => resource.id === active?.id);
  const currentPending = pending[pendingIndex];
  const failed = pending.filter((resource) => reviewErrors.includes(artifactVersionKey(resource)));
  const navigatePending = (direction: -1 | 1) => {
    if (!pending.length) return;
    const index = pendingIndex < 0 ? (direction === 1 ? 0 : pending.length - 1) : (pendingIndex + direction + pending.length) % pending.length;
    select(pending[index].id);
  };
  const review = async (items: readonly ArtifactResource[], decision: ArtifactReviewDecision) => {
    if (!onReview || reviewLock.current || !items.length) return;
    reviewLock.current = true;
    setReviewing(true);
    const itemKeys = new Set(items.map(artifactVersionKey));
    const pendingKeys = new Set(pending.map(artifactVersionKey));
    setReviewErrors((current) => current.filter((key) => pendingKeys.has(key) && !itemKeys.has(key)));
    try {
      const results = await Promise.allSettled(items.map((resource) => Promise.resolve().then(() => onReview(resource, decision))));
      const errors = items.filter((_, index) => results[index].status === "rejected").map(artifactVersionKey);
      setReviewErrors((current) => [...current, ...errors]);
    } finally { reviewLock.current = false; setReviewing(false); }
  };

  return <section {...props} ref={root} aria-label={props["aria-label"] ?? labels.panel} data-slot="artifact-panel" className={cn("flex size-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-floating text-fg-default", className)}>
    {active ? <Tabs value={active.id} onValueChange={select} variant="segment" color="default" className="flex min-h-0 flex-1 flex-col">
      <ArtifactTabs resources={resources} activeId={active.id} labels={labels} onSelect={select} onClose={closable ? (resource) => close([resource]) : undefined}
        onCloseOthers={() => close(resources.filter((resource) => resource.id !== active.id))} onCloseAll={() => close(resources)} addAction={addAction} />
      {resources.map((resource) => <ArtifactTabPanel key={artifactVersionKey(resource)} resource={resource} active={resource.id === active.id} labels={labels} onReference={onReference} onRetry={onRetry} renderPreview={renderPreview} />)}
    </Tabs> : <>
      {addAction && <div className="flex shrink-0 items-center border-b-hairline border-border bg-surface-floating p-2">{addAction}</div>}
      <div className="flex flex-1 items-center justify-center p-6"><Empty reason="first-use" scope="inline" density="compact"><EmptyHeader><EmptyTitle>{labels.empty}</EmptyTitle><EmptyDescription>{labels.emptyDescription}</EmptyDescription></EmptyHeader></Empty></div>
    </>}
    {onReview && pending.length > 0 && <div data-slot="artifact-review-bar" className="shrink-0 p-3">
      <Alert status="info" role="group" aria-busy={reviewing} className="flex flex-wrap justify-between gap-2">
        <AlertTitle>
          <DropdownMenu>
            <DropdownTrigger render={<Button variant="ghost" trailingIcon={Down} aria-label={labels.reviewList}><span role="status">{reviewing ? labels.reviewing : labels.remaining(pending.length)}</span></Button>} />
            <DropdownContent align="start" aria-label={labels.reviewList} checkedIndex={pendingIndex < 0 ? undefined : pendingIndex}>
              {pending.map((resource, index) => <MenuItem key={artifactVersionKey(resource)} index={index} label={resource.name} title={resource.path ?? resource.name} checked={resource.id === active?.id}
                trailing={failed.includes(resource) ? <span className="text-label text-fg-danger">{labels.failed}</span> : undefined} onSelect={() => { select(resource.id); focusTab(resource.id); }} />)}
            </DropdownContent>
          </DropdownMenu>
        </AlertTitle>
        <AlertAction className="mt-0 flex-wrap">
          <Button variant="tertiary" iconOnly aria-label={labels.previousPending} disabled={pending.length < 2 && !!currentPending} onClick={() => navigatePending(-1)}><Previous aria-hidden /></Button>
          <Button variant="tertiary" iconOnly aria-label={labels.nextPending} disabled={pending.length < 2 && !!currentPending} onClick={() => navigatePending(1)}><Next aria-hidden /></Button>
          {currentPending ? <>
            <Button variant="ghost" disabled={reviewing} onClick={() => void review([currentPending], "reject")}>{labels.reject}</Button>
            <Button variant="neutral" leadingIcon={Check} disabled={reviewing} onClick={() => void review([currentPending], "accept")}>{labels.accept}</Button>
          </> : <Button variant="neutral" onClick={() => navigatePending(1)}>{labels.startReview}</Button>}
          <DropdownMenu>
            <DropdownTrigger render={<Button variant="tertiary" iconOnly aria-label={labels.reviewActions} disabled={reviewing}><More aria-hidden /></Button>} />
            <DropdownContent align="end">
              <MenuItem index={0} label={labels.rejectAll} disabled={reviewing} onSelect={() => void review(pending, "reject")} />
              <MenuItem index={1} label={labels.acceptAll} disabled={reviewing} onSelect={() => void review(pending, "accept")} />
            </DropdownContent>
          </DropdownMenu>
        </AlertAction>
      </Alert>
    </div>}
    {failed.length > 0 && <div className="shrink-0 px-3 pb-3"><InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent className="break-words">{labels.reviewFailed} {failed.map((resource) => resource.name).join(", ")}</InlineNoticeContent></InlineNotice></div>}
  </section>;
}
