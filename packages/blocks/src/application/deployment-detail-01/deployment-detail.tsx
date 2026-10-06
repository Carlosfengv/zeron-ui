"use client";

import { Alert, AlertTitle, AlertAction } from "@zeron/ui/alert";

/* eslint-disable @next/next/no-img-element -- This React Registry block accepts host images without requiring Next.js. */

import { useRef, useState, type ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Card, CardFooter } from "@zeron/ui/card";
import { DropdownMenu, DropdownTrigger, DropdownContent } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemLeading, InfoItemTitle } from "@zeron/ui/info-item";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";
import { Skeleton } from "@zeron/ui/skeleton";
import { StatusOverview } from "@zeron/ui/status-overview";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { deploymentDate, deploymentDuration, deploymentHref, deploymentIssues, validNumber } from "./deployment-detail-data";
import type { DeploymentDetailData, DeploymentDetailLabels, DeploymentDetailProps, DeploymentStage, DeploymentStageStatus } from "./deployment-detail-types";

const defaults: DeploymentDetailLabels = {
  title: "部署详情", share: "分享", sharing: "分享中…", copied: "链接已复制", copyError: "复制失败，请重试",
  visit: "访问", environment: "环境", status: "状态", created: "创建时间", duration: "部署耗时", completed: "完成于",
  domains: "域名", moreDomains: "更多域名", source: "来源", stages: "部署状态", ready: "已就绪", building: "构建中",
  queued: "排队中", error: "失败", cancelled: "已取消", unknown: "未知", success: "已完成", running: "进行中",
  pending: "待执行", warning: "有警告", noPreview: "暂无网站预览", noDomains: "尚未分配域名", noSource: "暂无来源信息", noStages: "暂无部署阶段",
  errors: "错误", warnings: "警告", checksPassed: "所有检查已通过", checksUnknown: "检查结果待更新", investigate: "排查问题",
  logs: "查看构建日志", more: "更多操作", copyCommit: "复制提交哈希", retry: "重试", loading: "正在加载部署详情", unavailable: "部署详情加载失败",
  stale: "当前显示上次快照，等待更新", actionError: "操作失败，请重试",
};
const stageTone = { success: "success", running: "info", pending: "neutral", warning: "warning", error: "danger", unknown: "neutral" } as const;
const deploymentTone = { ready: "success", building: "info", queued: "neutral", error: "danger", cancelled: "neutral", unknown: "neutral" } as const;

function NoData({ children }: { children: ReactNode }) {
  return <Empty reason="no-data" scope="inline" density="compact"><EmptyDescription>{children}</EmptyDescription></Empty>;
}
function Fact({ label, value, icon }: { label: string; value: ReactNode; icon: IconName }) {
  const Icon = useIcon(icon);
  return <InfoItem className="px-0 py-2"><InfoItemLeading><Icon /></InfoItemLeading><InfoItemContent><InfoItemDescription>{label}</InfoItemDescription><InfoItemTitle className="flex min-w-0 flex-wrap items-center gap-2 break-all">{value}</InfoItemTitle></InfoItemContent></InfoItem>;
}
function Metric({ label, value, icon = "file", locale }: { label: string; value: number | null; icon?: IconName; locale: string }) {
  const Icon = useIcon(icon);
  return <Tooltip content={label}><Badge><span className="flex items-center gap-1.5"><Icon size={14} /><span>{validNumber(value) ? new Intl.NumberFormat(locale).format(value) : "—"}</span><span className="sr-only">{label}</span></span></Badge></Tooltip>;
}
function StageResult({ status, labels }: { status: DeploymentStageStatus; labels: DeploymentDetailLabels }) {
  const Check = useIcon("check");
  const Warning = useIcon("circle-x");
  const Loader = useIcon("loader");
  const Clock = useIcon("clock");
  const Unknown = useIcon("circle");
  const Icon = status === "success" ? Check : status === "error" || status === "warning" ? Warning : status === "running" ? Loader : status === "pending" ? Clock : Unknown;
  return <Badge variant="plain" status={stageTone[status]} role="img" aria-label={labels[status]} leadingIcon={<span className={status === "running" ? "inline-flex animate-spin motion-reduce:animate-none" : "inline-flex"}><Icon size={16} /></span>} />;
}
function StageRow({ stage, labels, locale, onOpen, pending, disabled }: { stage: DeploymentStage; labels: DeploymentDetailLabels; locale: string; onOpen?: () => void; pending: boolean; disabled: boolean }) {
  const Play = useIcon("play");
  const Warning = useIcon("circle-x");
  const issues = stage.issues ?? [];
  const errors = issues.filter((issue) => issue.severity === "error").length;
  const warnings = issues.filter((issue) => issue.severity === "warning").length;
  const details = <>
    {stage.metrics?.map((metric) => <Metric key={metric.id} {...metric} locale={locale} />)}
    {errors > 0 && <Badge status="danger"><span className="flex items-center gap-1"><Warning size={14} />{errors}<span className="sr-only">{labels.errors}</span></span></Badge>}
    {warnings > 0 && <Badge status="warning"><span className="flex items-center gap-1"><Warning size={14} />{warnings}<span className="sr-only">{labels.warnings}</span></span></Badge>}
    {stage.actionLabel && (stage.kind === "build" ? <Button size="xs" variant="secondary" leadingIcon={Play}>{stage.actionLabel}</Button> : onOpen && <Button size="xs" variant="secondary" onClick={onOpen} disabled={disabled} loading={pending}>{stage.actionLabel}</Button>)}
    <span className="min-w-16 text-right font-mono text-label tabular-nums text-fg-muted">{deploymentDuration(stage.durationMs, locale)}</span>
    <Tooltip content={labels[stage.status]}><span><StageResult status={stage.status} labels={labels} /></span></Tooltip>
  </>;
  // A metrics-only summary is a different business row; it has no invented activity rail.
  if (stage.kind === "summary") return <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3"><span className="font-mono text-label text-fg-subtle">{stage.label}</span><div className="flex min-w-0 flex-wrap items-center justify-end gap-2">{details}</div></div>;
  return <StatusOverview className="py-3" variant="activity" ariaLabel={stage.label} label={stage.label} emptyContent={labels.unknown}
    content={stage.timeline ? { type: "timeline", ...stage.timeline, items: stage.segments } : { type: "nodes", items: stage.segments }} trailing={details} />;
}

export function DeploymentDetail(props: DeploymentDetailProps) {
  return <DeploymentDetailState key={props.data.id} {...props} />;
}
function DeploymentDetailState({ data, state = "ready", statusMessage, actions, labels: suppliedLabels, locale = "zh-CN", timeZone = "Asia/Shanghai", now, className, ...props }: DeploymentDetailProps) {
  const labels = { ...defaults, ...suppliedLabels };
  const Share = useIcon("link");
  const Arrow = useIcon("arrow-right");
  const Globe = useIcon("globe");
  const Branch = useIcon("doc-stepper");
  const Commit = useIcon("dot");
  const Chevron = useIcon("chevron-down");
  const More = useIcon("ellipsis");
  const Logs = useIcon("file-text");
  const Copy = useIcon("copy");
  const [pending, setPending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);
  const [failedPreview, setFailedPreview] = useState<string | null>(null);
  const inFlight = useRef(false);
  const alive = useRef(true);
  // Ref callbacks avoid an old deployment's completion updating a remounted block.
  const ready = state === "ready" || state === "stale";
  const shareHref = deploymentHref(data.shareUrl ?? data.url);
  const issues = deploymentIssues(data);
  const custom = data.domains.filter((domain) => domain.kind === "custom");
  const otherDomains = data.domains.filter((domain) => domain.kind !== "custom");
  const busy = pending !== null;

  async function perform(key: string, action: () => void | Promise<void>, success?: string) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(key);
    setFeedback(null);
    try {
      await action();
      if (alive.current && success) setFeedback({ message: success, error: false });
    } catch {
      if (alive.current) setFeedback({ message: key === "commit" || (key === "share" && !actions?.onShare) ? labels.copyError : labels.actionError, error: true });
    } finally {
      inFlight.current = false;
      if (alive.current) setPending(null);
    }
  }
  function domainLink(domain: DeploymentDetailData["domains"][number]) {
    const href = deploymentHref(domain.url);
    const Icon = domain.kind === "custom" ? Globe : domain.kind === "branch" ? Branch : Commit;
    return <Tooltip key={domain.id} content={domain.name}>{href ? <Button asChild size="xs" variant="secondary" leadingIcon={Icon} className="max-w-full"><a href={href} target="_blank" rel="noopener noreferrer"><span className="block max-w-48 truncate @lg:max-w-64">{domain.name}</span></a></Button> : <Badge><span className="block max-w-48 truncate @lg:max-w-64">{domain.name}</span></Badge>}</Tooltip>;
  }
  return <Card {...props} ref={(node) => { alive.current = node !== null; }} data-slot="deployment-detail" data-state={state} aria-busy={state === "loading" || busy || undefined}
    className={cn("@container w-full max-w-3xl overflow-hidden rounded-2xl bg-surface-raised pb-0", className)}>
    <header className="px-5 py-4"><h2 className="text-body font-medium text-fg-default">{labels.title}</h2></header>
    <section className="mx-1 rounded-xl border-hairline border-border bg-surface-floating p-5">
      {state === "loading" ? <div role="status" className="space-y-5"><span className="sr-only">{labels.loading}</span><Skeleton className="h-10 w-2/3" /><Skeleton className="h-44 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-36 w-full" /></div> : state === "error" ? <div className="flex min-w-0 w-full items-center justify-center min-h-60 px-4 py-8"><Alert status="danger" role="group" className="w-full max-w-xl"><AlertTitle>{statusMessage ?? labels.unavailable}</AlertTitle><AlertAction>{actions?.onRetry && <Button variant="secondary" loading={pending === "retry"} disabled={busy} onClick={() => void perform("retry", actions.onRetry!)}>{labels.retry}</Button>}</AlertAction></Alert></div> : <>
        {state === "stale" && <div className="mb-4"><InlineNotice tone="warning" variant="emphasized"><InlineNoticeContent>{statusMessage ?? labels.stale}</InlineNoticeContent></InlineNotice></div>}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-4"><h3 className="min-w-0 max-w-full break-all text-heading font-semibold text-fg-default">{data.name}</h3><div className="flex flex-wrap items-center gap-2">
          {(actions?.onShare || shareHref) && <Button variant="secondary" leadingIcon={Share} loading={pending === "share"} disabled={busy} onClick={() => void perform("share", () => actions?.onShare ? actions.onShare(data) : navigator.clipboard.writeText(new URL(shareHref!, window.location.href).href), actions?.onShare ? undefined : labels.copied)}>{labels.share}</Button>}
          <Button leadingIcon={Arrow}>{labels.visit}</Button>
        </div></div>
        <div className="mt-5 grid min-w-0 items-center gap-5 @lg:grid-cols-2">
          <div className="aspect-video min-w-0 overflow-hidden rounded-lg border-hairline border-border bg-surface-raised">
            {data.preview && failedPreview !== data.preview.src ? <img src={data.preview.src} alt={data.preview.alt} className="size-full object-cover" onError={() => setFailedPreview(data.preview!.src)} /> : <div className="grid h-full place-items-center p-4"><NoData>{labels.noPreview}</NoData></div>}
          </div>
          <div className="min-w-0">
            <Fact label={labels.environment} icon="monitor" value={data.environment} />
            <Fact label={labels.status} icon="circle" value={<Badge status={deploymentTone[data.status]}>{labels[data.status]}</Badge>} />
            <Fact label={labels.created} icon="calendar" value={<><span className="text-label font-normal text-fg-muted">{deploymentDate(data.createdAt, locale, timeZone, now)}</span>{data.creator && <span className="flex min-w-0 items-center gap-1.5"><Avatar size="sm">{data.creator.avatarUrl && <AvatarImage src={data.creator.avatarUrl} alt="" />}<AvatarFallback>{data.creator.name.slice(0, 2)}</AvatarFallback></Avatar><span className="min-w-0 break-all text-label font-medium">{data.creator.name}</span></span>}</>} />
            <Fact label={labels.duration} icon="clock" value={<><span className="font-mono text-label font-normal text-fg-muted">{deploymentDuration(data.durationMs, locale)}</span>{data.completedAt != null && <Tooltip content={labels.completed}><Badge>{deploymentDate(data.completedAt, locale, timeZone, now)}</Badge></Tooltip>}</>} />
          </div>
        </div>
        <div className="mt-5 space-y-4 border-t-hairline border-dashed border-border pt-5">
          <div><h4 className="mb-2 text-label font-normal text-fg-subtle">{labels.domains}</h4><div className="flex min-w-0 flex-wrap items-center gap-2">
            {custom[0] && <div className="flex min-w-0 max-w-full items-center gap-1">{domainLink(custom[0])}{custom.length > 1 && <Popover><PopoverTrigger render={<Button size="xs" variant="secondary" trailingIcon={Chevron} aria-label={`${labels.moreDomains} ${custom.length - 1}`}>+{custom.length - 1}</Button>} /><PopoverContent align="start" className="w-72 max-w-full"><p className="mb-3 text-label text-fg-muted">{labels.moreDomains}</p><div className="flex min-w-0 flex-col items-start gap-2">{custom.slice(1).map(domainLink)}</div></PopoverContent></Popover>}</div>}
            {otherDomains.map(domainLink)}{!data.domains.length && <NoData>{labels.noDomains}</NoData>}
          </div></div>
          <div><h4 className="mb-2 text-label font-normal text-fg-subtle">{labels.source}</h4>{data.source ? <div className="space-y-2 font-mono text-label text-fg-muted">
            <p className="flex items-center gap-2"><Branch size={16} /><span className="min-w-0 break-all">{data.source.branch}</span></p>
            <div className="flex min-w-0 flex-wrap items-center gap-2"><Commit size={16} /><span className="break-all">{data.source.commit}</span><span aria-hidden="true">/</span>{deploymentHref(data.source.url) ? <a className="min-w-0 break-words underline underline-offset-2 hover:text-fg-default focus-visible:outline-focus-ring" href={deploymentHref(data.source.url)} target="_blank" rel="noopener noreferrer">{data.source.message}</a> : <span className="min-w-0 break-words">{data.source.message}</span>}
              {data.source.pullRequest && (deploymentHref(data.source.pullRequest.url) ? <Button asChild size="xs" variant="secondary"><a href={deploymentHref(data.source.pullRequest.url)} target="_blank" rel="noopener noreferrer">#{data.source.pullRequest.number}</a></Button> : <Badge>#{data.source.pullRequest.number}</Badge>)}
            </div>
          </div> : <NoData>{labels.noSource}</NoData>}</div>
        </div>
        <div className="mt-5 border-t-hairline border-dashed border-border pt-5"><h4 className="mb-3 text-body font-medium text-fg-default">{labels.stages}</h4><div className="divide-y divide-border-subtle">
          {data.stages.map((stage) => <StageRow key={stage.id} stage={stage} labels={labels} locale={locale} onOpen={stage.kind !== "build" && actions?.onOpenStage ? () => void perform(`stage:${stage.id}`, () => actions.onOpenStage!(stage, data.id)) : undefined} pending={pending === `stage:${stage.id}`} disabled={busy} />)}
          {!data.stages.length && <NoData>{labels.noStages}</NoData>}
        </div></div>
      </>}
      {feedback && <div className="mt-3"><InlineNotice role={feedback.error ? "alert" : "status"} tone={feedback.error ? "danger" : "success"} variant="emphasized"><InlineNoticeContent>{feedback.message}</InlineNoticeContent></InlineNotice></div>}
    </section>
    {ready && <CardFooter className="flex-wrap justify-between gap-3 px-5 py-4"><div className="flex items-center gap-1">
      {data.source && <DropdownMenu><DropdownTrigger render={<Button iconOnly size="sm" variant="ghost" aria-label={labels.more}><More /></Button>} /><DropdownContent><MenuItem index={0} label={labels.copyCommit} icon={Copy} disabled={busy} onSelect={() => void perform("commit", () => navigator.clipboard.writeText(data.source!.commit), labels.copied)} /></DropdownContent></DropdownMenu>}
      <Tooltip content={labels.logs}><Button iconOnly size="sm" variant="ghost" aria-label={labels.logs}><Logs /></Button></Tooltip>
    </div><div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3"><p className="flex flex-wrap gap-x-2 font-mono text-label text-fg-subtle" role="status">
      {issues.errors || issues.warnings ? <><span className="text-fg-danger">{issues.errors} {labels.errors}</span><span className="text-fg-warning">{issues.warnings} {labels.warnings}</span>{!issues.complete && <span>{labels.checksUnknown}</span>}</> : issues.passed ? labels.checksPassed : labels.checksUnknown}
    </p>{issues.issues.length > 0 && <Button size="sm" variant="secondary">{labels.investigate}</Button>}</div></CardFooter>}
  </Card>;
}
