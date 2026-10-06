"use client";

import { useId, useRef, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { SegmentedBar } from "@zeron/ui/chart-primitives";
import { Container, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup, InfoItemLeading, InfoItemTitle, InfoItemTrailing } from "@zeron/ui/info-item";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Separator } from "@zeron/ui/separator";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import type { FileUploadItem, FileUploadLabels, FileUploadProps } from "./file-upload-types";

export function formatUploadSize(bytes: number): string {
  const value = Math.max(0, Number.isFinite(bytes) ? bytes : 0);
  if (value < 1_000) return `${Math.round(value)} B`;
  if (value < 1_000_000) return `${Number((value / 1_000).toFixed(1))} KB`;
  return `${Number((value / 1_000_000).toFixed(1))} MB`;
}

export function uploadPercentage(item: FileUploadItem): number {
  if (item.status === "complete") return 100;
  if (!Number.isFinite(item.size) || item.size <= 0 || !Number.isFinite(item.uploadedBytes)) return 0;
  return Math.round(Math.min(1, Math.max(0, item.uploadedBytes / item.size)) * 100);
}

const defaultLabels: FileUploadLabels = {
  title: "Upload files", drop: "Drag and drop or", browse: "browse files",
  maxSize: (size) => `MAX FILE SIZE: ${size}`, complete: "COMPLETE", uploading: "UPLOADING…",
  uploadingAction: "Uploading…", queued: "QUEUED", failed: "UPLOAD FAILED", removeAll: "REMOVE ALL",
  remove: (name) => `Remove ${name}`, cancel: (name) => `Cancel upload of ${name}`,
  retry: (name) => `Retry ${name}`, done: "Done",
  tooLarge: (name, size) => `${name} exceeds the ${size} limit.`,
  selectionFailed: "Files could not be added. Please try again.",
};

function UploadProgress({ item }: { item: FileUploadItem }) {
  const value = uploadPercentage(item);
  return <div className="flex min-w-0 items-center gap-3">
    <SegmentedBar mode="capacity" total={100} segments={[{ id: item.id, label: item.name, value, color: "var(--brand)" }]} valueText={`${item.name}: ${value}%`} aria-label={item.name} />
    <span className="w-10 shrink-0 text-right tabular-nums">{value}%</span>
  </div>;
}

function UploadFileRow({ item, labels, onRemove, onRetry, disabled }: {
  item: FileUploadItem; labels: FileUploadLabels; onRemove?: (id: string) => void;
  onRetry?: (id: string) => void; disabled: boolean;
}) {
  const File = useIcon("file-text"); const Check = useIcon("check");
  const Trash = useIcon("trash"); const Close = useIcon("x"); const Retry = useIcon("rotate-ccw");
  const dot = item.name.lastIndexOf(".");
  const extension = dot > 0 ? item.name.slice(dot + 1).toLowerCase() : "";
  const complete = item.status === "complete";
  const failed = item.status === "error";
  const status = complete ? labels.complete : failed ? labels.failed : item.status === "queued" ? labels.queued : labels.uploading;
  return <InfoItem>
    <InfoItemLeading aria-hidden="true"><File /></InfoItemLeading>
    <InfoItemContent>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <InfoItemTitle className="break-words">{item.name}</InfoItemTitle>
        <Badge size="sm" color={extension === "pdf" ? "red" : extension === "fig" ? "purple" : "blue"}>{extension.slice(0, 5).toUpperCase() || "FILE"}</Badge>
      </div>
      <InfoItemDescription>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>{complete ? formatUploadSize(item.size) : `${formatUploadSize(Math.min(Math.max(0, item.uploadedBytes), Math.max(0, item.size)))} OF ${formatUploadSize(item.size)}`}</span>
          <span aria-hidden="true">/</span>
          {complete || failed ? <Badge variant="plain" status={complete ? "success" : "danger"} size="sm" leadingIcon={complete ? <Check /> : undefined}>{status}</Badge> : <span>{status}</span>}
        </div>
      </InfoItemDescription>
      {!complete && !failed && <InfoItemDescription><UploadProgress item={item} /></InfoItemDescription>}
      {failed && item.error && <InfoItemDescription><span className="text-fg-danger">{item.error}</span></InfoItemDescription>}
    </InfoItemContent>
    <InfoItemTrailing>
      {failed && onRetry && <Button type="button" variant="ghost" size="sm" iconOnly disabled={disabled} aria-label={labels.retry(item.name)} onClick={() => onRetry(item.id)}><Retry /></Button>}
      <Button type="button" variant="ghost" size="sm" iconOnly disabled={disabled || !onRemove} aria-label={complete || failed ? labels.remove(item.name) : labels.cancel(item.name)} onClick={() => onRemove?.(item.id)}>{complete ? <Trash /> : <Close />}</Button>
    </InfoItemTrailing>
  </InfoItem>;
}

export function FileUpload({ items, onFilesSelected, onRemove, onRemoveAll, onRetry, onDone,
  maxFileSize = 20_000_000, disabled = false, labels: overrides, footerActions, className, ...props }: FileUploadProps) {
  const labels = { ...defaultLabels, ...overrides };
  const Upload = useIcon("upload"); const Trash = useIcon("trash");
  const input = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const selectionGuard = useRef(false);
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blocked = disabled || selecting || !onFilesSelected;
  const uploading = items.some((item) => item.status === "uploading" || item.status === "queued");
  const allComplete = items.length > 0 && items.every((item) => item.status === "complete");
  const limit = Number.isFinite(maxFileSize) && maxFileSize > 0 ? maxFileSize : 20_000_000;

  async function selectFiles(files: File[]) {
    if (disabled || !onFilesSelected || selectionGuard.current || files.length === 0) return;
    const oversized = files.filter((file) => file.size > limit);
    const accepted = files.filter((file) => file.size <= limit);
    setError(oversized.length ? oversized.map((file) => labels.tooLarge(file.name, formatUploadSize(limit))).join(" ") : null);
    if (accepted.length === 0) return;
    selectionGuard.current = true;
    setSelecting(true);
    try { await onFilesSelected(accepted); }
    catch { setError(labels.selectionFailed); }
    finally { selectionGuard.current = false; setSelecting(false); }
  }

  return <Container className={cn("w-full max-w-2xl", className)} aria-labelledby={titleId} {...props}>
    <ContainerHeader>
      <h2 id={titleId} className="text-body font-medium text-fg-default">{labels.title}</h2>
    </ContainerHeader>
    <div
      className={cn("flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-4 py-10 text-center transition-colors duration-fast sm:min-h-56", dragging && !blocked && "border-brand bg-brand/5")}
      onDragEnter={(event) => { event.preventDefault(); if (event.dataTransfer.types.includes("Files")) { dragDepth.current++; setDragging(true); } }}
      onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = blocked ? "none" : "copy"; }}
      onDragLeave={(event) => { event.preventDefault(); dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); }}
      onDrop={(event) => { event.preventDefault(); dragDepth.current = 0; setDragging(false); if (!blocked) void selectFiles(Array.from(event.dataTransfer.files)); }}
    >
      <InfoItemLeading aria-hidden="true"><Upload /></InfoItemLeading>
      <div className="flex flex-wrap items-baseline justify-center gap-x-1.5 gap-y-1 text-body font-medium text-fg-default">
        <span>{labels.drop}</span><Button type="button" variant="link" disabled={blocked} onClick={() => input.current?.click()}>{labels.browse}</Button>
      </div>
      <p className="text-label text-fg-muted">{labels.maxSize(formatUploadSize(limit))}</p>
      <input ref={input} type="file" multiple disabled={blocked} className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { const files = Array.from(event.currentTarget.files ?? []); event.currentTarget.value = ""; void selectFiles(files); }} />
    </div>
    {error && <InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{error}</InlineNoticeContent></InlineNotice>}
    {items.length ? <div className="flex flex-col gap-2" role="list" aria-label={labels.title}>
      {items.map((item) => <InfoItemGroup key={item.id} role="listitem"><UploadFileRow item={item} labels={labels} onRemove={onRemove} onRetry={onRetry} disabled={disabled} /></InfoItemGroup>)}
    </div> : null}
    <ContainerFooter>
      <div className="mr-auto flex min-w-0 items-center gap-2">
        {footerActions && <>{footerActions}<Separator orientation="vertical" /></>}
        <Button type="button" variant="ghost" leadingIcon={Trash} disabled={disabled || !items.length || !onRemoveAll} onClick={onRemoveAll}>{labels.removeAll}</Button>
      </div>
      <Button type="button" variant="secondary" disabled={disabled || !allComplete || !onDone} onClick={onDone}>{uploading ? labels.uploadingAction : labels.done}</Button>
    </ContainerFooter>
  </Container>;
}
