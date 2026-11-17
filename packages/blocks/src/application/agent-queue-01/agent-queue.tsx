"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { MinusSignIcon, Robot01Icon, SparklesIcon, Wrench01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { ButtonGroup, ButtonGroupText } from "@zeron/ui/button-group";
import { MetricCard } from "@zeron/ui/metric-card";
import { Popover, PopoverClose, PopoverContent, PopoverTitle, PopoverTrigger } from "@zeron/ui/popover";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { spring } from "@zeron/ui/system/springs";
import { SurfaceProvider } from "@zeron/ui/system/surface-context";
import { cn } from "@zeron/ui/system/utils";
import { compareWaitingJobs, getDepthPoints, getJobProgress, getQueueMetrics } from "./agent-queue-data";
import { AgentQueueDepth } from "./agent-queue-depth";
import { agentQueueEnglishLabels } from "./agent-queue-labels";
import type { AgentQueueJob, AgentQueueLabels, AgentQueueProps, AgentQueueRateLimit, AgentQueueWorker } from "./agent-queue-types";
import styles from "./agent-queue.module.css";

const Minus: IconComponent = (props) => <HugeiconsIcon icon={MinusSignIcon} {...props} />;
const kindIcons = { llm: SparklesIcon, tool: Wrench01Icon, agent: Robot01Icon };

function JobIcon({ job }: { job: AgentQueueJob }) {
  const Human = useIcon("user");
  return <span aria-hidden="true" className={styles.jobIcon} data-kind={job.kind}>
    {job.icon ?? (job.kind === "human" ? <Human size={12} /> : <HugeiconsIcon icon={kindIcons[job.kind]} size={12} />)}
  </span>;
}

function Result({ status, count, label }: { status: "done" | "failed"; count: number; label: string }) {
  const Check = useIcon("check");
  const Cross = useIcon("x");
  const failed = status === "failed";
  const Icon = failed ? Cross : Check;
  return <MetricCard
    className="self-stretch"
    label={label}
    labelClassName="text-label"
    value={count}
    valueClassName="text-title font-medium"
    tone={failed ? "critical" : "default"}
    leading={<span aria-hidden="true" className={cn("grid size-5 shrink-0 place-items-center rounded-sm", failed ? "bg-danger-surface-subtle text-fg-danger" : "bg-success-surface text-fg-success")}><Icon size={12} /></span>}
  />;
}

function JobDetails({ job, worker, position, waiting, elapsed, progress, labels, onPromote, onCancel, close }: {
  job: AgentQueueJob;
  worker?: AgentQueueWorker;
  position: number;
  waiting: number;
  elapsed: string;
  progress?: number;
  labels: AgentQueueLabels;
  onPromote: AgentQueueProps["onPromote"];
  onCancel: AgentQueueProps["onCancel"];
  close: () => void;
}) {
  const Cross = useIcon("x");
  const Up = useIcon("arrow-up");
  const queued = job.status === "queued";
  const status = job.status === "queued" ? labels.waiting : labels[job.status];
  const priority = job.priority ?? "normal";
  const attempt = job.attempt ?? 1;
  const fields = [[status, elapsed], [labels.priority, labels.priorities[priority]]];
  if (queued) fields.splice(1, 0, [labels.position, labels.outOf(position, waiting)]);
  if (job.status === "running" && progress !== undefined) fields.splice(1, 0, [labels.running, `${Math.round(progress * 100)}%`]);
  if (worker) fields.push([labels.workers, worker.name]);
  if (job.attempt !== undefined || job.maxAttempts !== undefined) fields.push([labels.attempt, job.maxAttempts ? labels.outOf(attempt, job.maxAttempts) : `${attempt}`]);
  const canPromote = onPromote && queued && position > 1;
  const canCancel = onCancel && (queued || job.status === "running");

  return <PopoverContent align="start" sideOffset={5} className={styles.details}>
    <header className="flex items-start gap-2">
      <JobIcon job={job} />
      <div className="min-w-0 flex-1">
        <PopoverTitle className="break-words">{job.name}</PopoverTitle>
        <p className="text-label text-fg-subtle">{labels.kinds[job.kind]}</p>
      </div>
      <Badge size="sm" status={queued ? "neutral" : job.status === "failed" ? "danger" : job.status === "done" ? "success" : "info"}>{status}</Badge>
      <PopoverClose render={<Button size="xs" variant="ghost" iconOnly aria-label={labels.closeDetails}><Cross aria-hidden="true" /></Button>} />
    </header>
    {job.detail != null && <div className="break-words text-label text-fg-muted">{job.detail}</div>}
    {job.error && <p className="break-words text-label text-fg-danger">{job.error}</p>}
    <dl className={cn(styles.detailMetrics, "bg-surface-floating")}>
      {fields.map(([label, value], index) => <div key={index}><dt className={styles.caption}>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    {(canPromote || canCancel) && <div className="flex flex-wrap gap-2">
      {canPromote && <Button size="xs" variant="tertiary" leadingIcon={Up} onClick={() => onPromote(job)}>{labels.promote}</Button>}
      {canCancel && <Button size="xs" variant="tertiary" leadingIcon={Cross} onClick={() => { close(); onCancel(job); }}>{labels.cancel}</Button>}
    </div>}
  </PopoverContent>;
}

export function AgentQueue({
  jobs, workers, now: suppliedNow, paused = false, onPausedChange, onConcurrencyChange, minConcurrency = 1,
  maxConcurrency = 8, rateLimits = [], backpressure, windowMs = 120_000, depthHistory, totals,
  openId, defaultOpenId = null, onOpenChange, onPromote, onCancel, title, name, labels: suppliedLabels, className,
}: AgentQueueProps) {
  const labels = { ...agentQueueEnglishLabels, ...suppliedLabels };
  const id = useId();
  const reducedMotion = useReducedMotion();
  const Play = useIcon("play");
  const Pause = useIcon("pause");
  const Plus = useIcon("plus");
  const Brain = useIcon("brain");
  const Up = useIcon("arrow-up");
  const [clock, setClock] = useState<number>();
  const [localOpen, setLocalOpen] = useState(defaultOpenId);
  const [focusId, setFocusId] = useState<string | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const previous = useRef<{ limited: boolean; above: boolean; failed: number; attempts: Map<string, number> } | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const needsClock = jobs.length > 0 || rateLimits.length > 0 || Boolean(depthHistory?.length);

  useEffect(() => {
    if (suppliedNow !== undefined) return;
    const tick = () => setClock(Date.now());
    tick();
    if (!needsClock) return;
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [suppliedNow, needsClock]);

  const now = suppliedNow ?? clock ?? 0;
  const historyWindow = Number.isFinite(windowMs) && windowMs > 0 ? windowMs : 120_000;
  const from = now - historyWindow;
  const waiting = useMemo(() => jobs.filter((job) => job.status === "queued").sort(compareWaitingJobs), [jobs]);
  const workersById = new Map(workers.map((worker) => [worker.id, worker]));
  const jobsByWorker = new Map<string, AgentQueueJob>();
  const unassigned: AgentQueueJob[] = [];
  for (const job of jobs) {
    if (job.status !== "running") continue;
    if (job.worker && workersById.has(job.worker) && !jobsByWorker.has(job.worker)) jobsByWorker.set(job.worker, job);
    else unassigned.push(job);
  }
  const running = workers.flatMap((worker) => jobsByWorker.get(worker.id) ?? []).concat(unassigned);
  const navigable = [...running, ...waiting];
  const selected = navigable.find((job) => job.id === (openId === undefined ? localOpen : openId));
  const tabbable = navigable.find((job) => job.id === focusId) ?? selected ?? navigable[0];
  const limits = rateLimits.filter((limit) => limit.from < now && limit.until > from && limit.until > limit.from);
  const activeLimit = rateLimits.reduce<AgentQueueRateLimit | undefined>((active, limit) => (
    limit.from <= now && now < limit.until && (!active || limit.until > active.until) ? limit : active
  ), undefined);
  const stalled = paused || Boolean(activeLimit);
  const threshold = backpressure !== undefined && Number.isFinite(backpressure) && backpressure >= 0 ? backpressure : undefined;
  const above = threshold !== undefined && waiting.length > threshold;
  const metrics = getQueueMetrics(jobs, now, historyWindow);
  const failed = totals?.failed ?? metrics.failed;
  const points = getDepthPoints(jobs, depthHistory, from, now, waiting.length);
  const [pauseTime, setPauseTime] = useState<number>();

  useEffect(() => {
    setPauseTime((time) => paused ? time ?? now : undefined);
  }, [now, paused]);

  useEffect(() => {
    const prior = previous.current;
    const attempts = new Map(jobs.map((job) => [job.id, job.attempt ?? 1]));
    previous.current = { limited: Boolean(activeLimit), above, failed, attempts };
    if (!prior) return;
    const messages: string[] = [];
    if (Boolean(activeLimit) !== prior.limited) {
      messages.push(activeLimit ? labels.rateLimited(labels.duration(activeLimit.until - now)) : labels.rateLimitLifted);
    }
    if (above && !prior.above && threshold !== undefined) messages.push(labels.backpressure(threshold));
    if (failed > prior.failed) messages.push(labels.failures(failed));
    for (const job of waiting) {
      const earlier = prior.attempts.get(job.id);
      if (earlier !== undefined && job.attempt && job.attempt > earlier) messages.push(`${job.name}: ${labels.retry(job.attempt)}`);
    }
    if (messages.length) setAnnouncement(messages.join(". "));
  }, [activeLimit, above, failed, jobs, labels, now, threshold, waiting]);

  function jobProgress(job: AgentQueueJob) {
    const stoppedAt = Math.min(now, pauseTime ?? now, activeLimit?.from ?? now);
    return getJobProgress(job, stoppedAt);
  }

  function changeOpen(job?: AgentQueueJob) {
    if (openId === undefined) setLocalOpen(job?.id ?? null);
    onOpenChange?.(job?.id ?? null, job);
  }

  function handleJobKey(event: KeyboardEvent<HTMLButtonElement>, job: AgentQueueJob) {
    const index = navigable.indexOf(job);
    let next: number;
    switch (event.key) {
      case "ArrowDown": case "ArrowRight": next = Math.min(index + 1, navigable.length - 1); break;
      case "ArrowUp": case "ArrowLeft": next = Math.max(index - 1, 0); break;
      case "Home": next = 0; break;
      case "End": next = navigable.length - 1; break;
      default: return;
    }
    event.preventDefault();
    triggerRefs.current.get(navigable[next].id)?.focus();
  }

  function triggerId(job: AgentQueueJob) {
    return `${id}-job-${encodeURIComponent(job.id)}`;
  }

  function jobElapsed(job: AgentQueueJob) {
    return labels.duration(Math.max(0, now - (job.status === "queued" ? job.enqueuedAt : job.startedAt ?? job.enqueuedAt)));
  }

  function renderJob(job: AgentQueueJob, position?: number) {
    const elapsed = jobElapsed(job);
    const progress = position === undefined ? jobProgress(job) : undefined;
    const status = position === undefined ? labels.running : labels.waiting;
    const description = [job.name, labels.kinds[job.kind], `${status} ${elapsed}`];
    if (position !== undefined) description.push(`${labels.position} ${labels.outOf(position, waiting.length)}`);
    if (progress !== undefined) description.push(`${Math.round(progress * 100)}%`);
    if (job.priority === "high") description.push(`${labels.priority} ${labels.priorities.high}`);
    if (job.attempt && job.attempt > 1) description.push(labels.retry(job.attempt));

    return <PopoverTrigger
      id={triggerId(job)}
      ref={(element) => {
        if (element) triggerRefs.current.set(job.id, element);
        else triggerRefs.current.delete(job.id);
      }}
      data-job-id={job.id}
      tabIndex={tabbable?.id === job.id ? 0 : -1}
      onFocus={() => setFocusId(job.id)}
      onKeyDown={(event) => handleJobKey(event, job)}
      aria-label={description.join(", ")}
      render={<Button asChild size="sm" variant="tertiary" active={selected?.id === job.id}
        className={cn("w-full focus-visible:z-control", styles.jobButton)} contentClassName="static w-full" labelClassName="w-full">
        <motion.button type="button" layout={reducedMotion ? false : "position"} layoutId={reducedMotion ? undefined : triggerId(job)} transition={spring.slow}>
          {progress !== undefined && <span className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progress} data-kind={job.kind}
              data-stalled={stalled || undefined} style={{ transform: `scaleX(${progress})` }} />
          </span>}
          <span className={styles.jobContent} aria-hidden="true">
            <JobIcon job={job} />
            <span className={styles.jobName} dir="auto">{job.name}</span>
            {job.priority === "high" && <span className={styles.priority}><Up size={10} /></span>}
            {job.attempt !== undefined && job.attempt > 1 && <span className={styles.retry}>{labels.retry(job.attempt)}</span>}
            <span className={styles.elapsed}>{elapsed}</span>
          </span>
        </motion.button>
      </Button>}
    />;
  }

  const panelTitle = title ?? labels.title;
  const mode = activeLimit ? labels.rateLimited(labels.duration(activeLimit.until - now)) : paused ? labels.paused : labels.live;

  return <SurfaceProvider role="floating"><section aria-labelledby={`${id}-title`} className={cn(styles.panel, className)} data-block="agent-queue">
    <header className={styles.header}>
      <div className={styles.heading}>
        <h2 id={`${id}-title`} className={styles.title}>{panelTitle}</h2>
        {name && <span className={styles.queueName} title={name}>{name}</span>}
        <Badge size="sm" status={activeLimit ? "warning" : paused ? "neutral" : "info"} title={activeLimit?.label}>
          {mode}
        </Badge>
      </div>
      {(onPausedChange || onConcurrencyChange) && <div className={styles.controls}>
        {onPausedChange && <Button size="sm" variant="tertiary" leadingIcon={paused ? Play : Pause} aria-pressed={paused} onClick={() => onPausedChange(!paused)}>
          {paused ? labels.resume : labels.pause}
        </Button>}
        {onConcurrencyChange && <ButtonGroup aria-label={labels.workers}>
          <Button size="sm" variant="tertiary" iconOnly aria-label={labels.decrease} disabled={workers.length <= minConcurrency} onClick={() => onConcurrencyChange(workers.length - 1)}><Minus aria-hidden="true" /></Button>
          <ButtonGroupText><output aria-label={labels.workers}>{workers.length}</output></ButtonGroupText>
          <Button size="sm" variant="tertiary" iconOnly aria-label={labels.increase} disabled={workers.length >= maxConcurrency} onClick={() => onConcurrencyChange(workers.length + 1)}><Plus aria-hidden="true" /></Button>
        </ButtonGroup>}
      </div>}
    </header>

    <dl className={styles.metrics}>
      <div><dt className={styles.caption}>{labels.waiting}</dt><dd className={above ? "text-fg-warning" : undefined}>{waiting.length}</dd></div>
      <div><dt className={styles.caption}>{labels.running}</dt><dd>{running.length}<span>/{workers.length}</span></dd></div>
      <div><dt className={styles.caption}>{labels.throughput}</dt><dd>{metrics.throughput}<span>{labels.perMinute}</span></dd></div>
      <div><dt className={styles.caption}>{labels.waitP95}</dt><dd>{metrics.waitP95 === undefined ? "—" : labels.duration(metrics.waitP95)}</dd></div>
    </dl>

    <Popover open={Boolean(selected)} triggerId={selected ? triggerId(selected) : null} onOpenChange={(open, details) => {
      const next = open ? navigable.find((job) => job.id === (details.trigger as HTMLElement | undefined)?.dataset.jobId) : undefined;
      if (!open || next) changeOpen(next);
    }}>
      <div className={styles.flow}>
        <div className={styles.queue}>
          <h3 className={styles.caption}>{panelTitle}{" "}<b>{waiting.length}</b></h3>
          {waiting.length ? <ScrollArea className="mt-2.5" viewportClassName={cn("h-auto", styles.queueViewport)} viewportProps={{ tabIndex: -1 }}>
            <ol className={styles.waiting}>
              {waiting.map((job, index) => <li key={job.id}>{renderJob(job, index + 1)}</li>)}
            </ol>
          </ScrollArea> : <p className={styles.queueEmpty}>{labels.empty}</p>}
        </div>

        <div className={styles.workers}>
          <h3 className={styles.caption}>{labels.workers}{" "}<b>{jobsByWorker.size}/{workers.length}</b></h3>
          <ul className={styles.slots}>
            {workers.map((worker) => {
              const job = jobsByWorker.get(worker.id);
              return <li className={styles.slot} key={worker.id}>
                <span className={styles.worker} title={worker.name}>
                  <span className={styles.workerIcon} aria-hidden="true">{worker.icon ?? <Brain size={14} />}</span>
                  <span className={styles.workerName}>{worker.name}</span>
                  <span className={styles.mobileWorkerName}>{worker.name}</span>
                </span>
                {job ? renderJob(job) : <span className={styles.rail}>{stalled ? labels.paused : labels.idle}</span>}
              </li>;
            })}
            {unassigned.map((job) => <li className={styles.slot} key={`unassigned-${job.id}`}>
              <span className={styles.worker} title={labels.unassigned}>
                <span className={styles.workerIcon} aria-hidden="true"><Brain size={14} /></span>
                <span className={styles.workerName}>{labels.unassigned}</span><span className={styles.mobileWorkerName}>{labels.unassigned}</span>
              </span>
              {renderJob(job)}
            </li>)}
          </ul>
        </div>
        <div className={styles.results}>
          <Result status="done" count={totals?.done ?? metrics.done} label={labels.done} />
          <Result status="failed" count={failed} label={labels.failed} />
        </div>
      </div>
      {selected && <JobDetails job={selected} worker={selected.worker ? workersById.get(selected.worker) : undefined}
        waiting={waiting.length} position={waiting.indexOf(selected) + 1} elapsed={jobElapsed(selected)}
        progress={jobProgress(selected)} labels={labels} onPromote={onPromote} onCancel={onCancel} close={() => changeOpen()} />}
    </Popover>

    <AgentQueueDepth points={points} from={from} now={now} limits={limits} backpressure={threshold} labels={labels} />
    <span className="sr-only" role="status">{announcement}</span>
  </section></SurfaceProvider>;
}
