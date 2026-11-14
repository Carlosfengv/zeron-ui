"use client";

import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from "react";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@zeron/ui/popover";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { FallbackBranches } from "./fallback-chain-branches";
import { fallbackChainEnglishLabels } from "./fallback-chain-labels";
import type {
  FallbackAttempt,
  FallbackAttemptStatus,
  FallbackChainDetail,
  FallbackChainProps,
} from "./fallback-chain-types";
import styles from "./fallback-chain.module.css";

const badgeTones: Record<FallbackAttemptStatus, BadgeStatus> = {
  waiting: "neutral", trying: "info", failed: "danger", answered: "success", skipped: "neutral",
};

const segments = Array.from({ length: 40 }, (_, index) => index);

function nonnegative(value?: number) {
  return value !== undefined && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function useAttemptClock(startedAt: number | undefined, now: number | undefined) {
  const [clock, setClock] = useState<{ startedAt: number; time: number }>();
  useEffect(() => {
    if (startedAt === undefined || now !== undefined) return;
    const tick = () => setClock({ startedAt, time: Date.now() });
    const initial = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 100);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [now, startedAt]);
  return now ?? (clock && clock.startedAt === startedAt ? clock.time : startedAt) ?? 0;
}

function elapsed(attempt: FallbackAttempt, now: number) {
  const recorded = nonnegative(attempt.durationMs);
  const startedAt = nonnegative(attempt.startedAt);
  if (recorded === undefined && attempt.status === "trying" && startedAt !== undefined) {
    return Math.max(0, now - startedAt);
  }
  return recorded;
}

function Details({ name, subtitle, icon, badge, text, rows }: {
  name: string;
  subtitle?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  text?: string;
  rows: readonly FallbackChainDetail[];
}) {
  return <div className={styles.details}>
    <div className={styles.detailHeader}>
      {icon && <span className={styles.detailIcon} aria-hidden="true">{icon}</span>}
      <div className={styles.detailName}>
        <PopoverTitle className={styles.detailTitle} render={<strong />}>{name}</PopoverTitle>
        {subtitle && <span>{subtitle}</span>}
      </div>
      {badge}
    </div>
    {text && <p className={styles.quote}>{text}</p>}
    {rows.length > 0 && <dl className={styles.detailRows}>
      {rows.map(({ label, value }, index) => <div key={index}>
        <dt>{label}</dt><dd>{value}</dd>
      </div>)}
    </dl>}
  </div>;
}

function NodeDetails({ children, content }: { children: ReactElement; content: ReactNode }) {
  return <Popover trigger="hover">
    <PopoverTrigger render={children} />
    <PopoverContent sideOffset={8} className={styles.detailPopover}>{content}</PopoverContent>
  </Popover>;
}

export function FallbackChain({
  attempts, title, route, request, response, now, onRetry,
  labels = fallbackChainEnglishLabels, locale = "en", className,
}: FallbackChainProps) {
  const RouteIcon = useIcon("corner-down-right");
  const MessageIcon = useIcon("message-circle");
  const ClockIcon = useIcon("clock");
  const RetryIcon = useIcon("rotate-ccw");
  const tryingIndex = attempts.findIndex((attempt) => attempt.status === "trying");
  const trying = attempts[tryingIndex];
  const liveStart = nonnegative(trying?.durationMs) === undefined ? nonnegative(trying?.startedAt) : undefined;
  const clock = useAttemptClock(liveStart, nonnegative(now));
  const answered = attempts.find((attempt) => attempt.status === "answered");
  const hasModels = attempts.length > 0;
  const exhausted = attempts.some(({ status }) => status === "failed")
    && attempts.every(({ status }) => status === "failed" || status === "skipped");
  const allSkipped = hasModels && attempts.every(({ status }) => status === "skipped");
  const tried = attempts.filter(({ status }) => status !== "waiting" && status !== "skipped").length;
  const nextIndex = tryingIndex < 0 ? -1 : attempts.findIndex(({ status }, index) => index > tryingIndex && status === "waiting");
  const summaryStatus = answered ? "answered" : exhausted ? "failed" : allSkipped ? "skipped" : trying ? "trying" : "waiting";
  const summaryText = summaryStatus === "trying" ? labels.attempt(tryingIndex + 1, attempts.length)
    : exhausted ? labels.exhausted : labels[summaryStatus];
  const formatters = useMemo(() => ({
    ms: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    s: new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    usd: new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 4 }),
  }), [locale]);

  function duration(value: number) {
    return value < 1000
      ? labels.duration(formatters.ms.format(value), "ms")
      : labels.duration(formatters.s.format(value / 1000), "s");
  }

  function cost(value: number) {
    return value > 0 && value < 0.0001
      ? `<${formatters.usd.format(0.0001)}`
      : formatters.usd.format(value);
  }

  const totalTime = duration(attempts.reduce((total, attempt) => total + (elapsed(attempt, clock) ?? 0), 0));
  const totalCost = cost(attempts.reduce((total, attempt) => total + (nonnegative(attempt.costUsd) ?? 0), 0));
  const outputTokens = nonnegative(answered?.outputTokens);
  const output = outputTokens === undefined ? undefined : labels.tokens(formatters.ms.format(outputTokens));
  const responseStatus = summaryStatus === "trying" ? "waiting" : summaryStatus;
  const responseText = output ?? (exhausted ? labels.exhausted
    : responseStatus === "waiting" ? labels.responseWaiting : labels[responseStatus]);
  const responseDetails = <Details name={response?.name ?? labels.response}
    subtitle={answered ? labels.fromModel(answered.model) : responseText}
    icon={response?.icon}
    badge={<Badge size="sm" status={badgeTones[responseStatus]}>
      {labels[responseStatus]}
    </Badge>}
    text={answered ? response?.text : undefined}
    rows={[
      { label: labels.totalTime, value: totalTime },
      { label: labels.totalCost, value: totalCost },
      { label: labels.attempts, value: labels.attemptCount(tried, attempts.length) },
      ...(output !== undefined ? [{ label: labels.output, value: output }] : []),
      ...(response?.details ?? []),
    ]} />;

  return <section className={cn(styles.chain, className)} data-slot="fallback-chain" aria-label={title ?? labels.request}>
    <header className={styles.header}>
      <span className={styles.title}>{title ?? labels.request}</span>
      <div className={styles.summary}>
        <span className={styles.state} data-status={summaryStatus} role="status">
          <span className={styles.dot} aria-hidden="true" />
          {summaryText}
        </span>
        <span className={styles.metric}><ClockIcon size={12} aria-hidden="true" />{totalTime}</span>
        <span className={styles.metric}>{totalCost}</span>
        {hasModels && <Popover>
          <PopoverTrigger className={styles.compactResponse} data-status={summaryStatus}
            aria-label={`${labels.response}: ${responseText}`}>
            <MessageIcon size={14} aria-hidden="true" />
          </PopoverTrigger>
          <PopoverContent className={styles.detailPopover}>{responseDetails}</PopoverContent>
        </Popover>}
        {exhausted && onRetry && <Button variant="secondary" size="xs" leadingIcon={RetryIcon} onClick={onRetry}>{labels.retry}</Button>}
      </div>
    </header>
    {hasModels ? <div className={styles.flow}>
      <NodeDetails content={
        <Details name={request?.name ?? labels.request} subtitle={route} icon={request?.icon} text={request?.text}
          rows={[...(request?.details ?? []), { label: labels.attempts, value: labels.attemptCount(tried, attempts.length) }]} />
      }>
        <button type="button" className={cn(styles.endpoint, styles.request)}>
          <span className={styles.endpointIcon} aria-hidden="true"><RouteIcon size={15} /></span>
          <span className={styles.endpointText}>
            <strong>{labels.request}</strong>
            {route && <span className={styles.route} title={route}>{route}</span>}
          </span>
        </button>
      </NodeDetails>
      <FallbackBranches attempts={attempts} layout="incoming" />
      <FallbackBranches attempts={attempts} layout="tree" />
      <ol className={styles.models} role="list" aria-label={labels.models}>
        {attempts.map((attempt, index) => {
          const time = elapsed(attempt, clock);
          const timeLabel = time === undefined ? undefined : duration(time);
          const costUsd = nonnegative(attempt.costUsd);
          const costLabel = costUsd === undefined ? undefined : cost(costUsd);
          const budget = nonnegative(attempt.timeoutMs);
          const progress = budget && time !== undefined
            ? Math.round(Math.min(1, time / budget) * segments.length)
            : attempt.status === "answered" ? segments.length : 0;
          const statusLabel = index === nextIndex ? labels.upNext : labels[attempt.status];
          const tokens = nonnegative(attempt.outputTokens);
          const detail = attempt.status === "answered" && tokens !== undefined
            ? labels.tokens(formatters.ms.format(tokens)) : attempt.reason;
          const statusText = detail ? `${statusLabel} · ${detail}` : statusLabel;
          const displayStatus = attempt.reason && attempt.status === "failed" ? attempt.reason : statusText;
          const rows: FallbackChainDetail[] = [{ label: labels.model, value: attempt.model }];
          const budgetLabel = budget ? labels.timeBudget(timeLabel, duration(budget)) : timeLabel;
          if (budgetLabel !== undefined) rows.push({ label: labels.time, value: budgetLabel });
          if (costLabel !== undefined) rows.push({ label: labels.cost, value: costLabel });
          rows.push(...(attempt.details ?? []));
          if (attempt.reason) rows.push({ label: labels.why, value: attempt.reason });

          return <li key={attempt.id}>
            <NodeDetails content={
              <Details name={attempt.provider ?? attempt.model} subtitle={attempt.region}
                icon={attempt.providerIcon ?? attempt.icon}
                badge={<Badge size="sm" status={badgeTones[attempt.status]}>{labels[attempt.status]}</Badge>} rows={rows} />
            }>
              <button type="button" className={styles.model} data-status={attempt.status}
                aria-label={[attempt.model, attempt.provider, statusText, timeLabel, costLabel].filter(Boolean).join(" · ")}>
                <span className={styles.logo} aria-hidden="true">
                  {attempt.icon}<span className={styles.order} data-icon={attempt.icon != null || undefined}>{index + 1}</span>
                </span>
                <span className={styles.modelText}>
                  <span className={styles.modelHeading}>
                    <strong title={attempt.model}>{attempt.model}</strong>
                    {attempt.provider && <span className={styles.provider} title={attempt.provider}>{attempt.provider}</span>}
                  </span>
                  <span className={styles.modelStatus} title={displayStatus}>{displayStatus}</span>
                </span>
                <span className={styles.modelMetrics}>
                  <span>{timeLabel ?? "–"}</span>
                  {costLabel !== undefined && <span>{costLabel}</span>}
                </span>
                <span className={styles.segments} aria-hidden="true">
                  {segments.map((segment) => <i key={segment} data-filled={segment < progress || undefined} />)}
                </span>
              </button>
            </NodeDetails>
          </li>;
        })}
      </ol>
      <FallbackBranches attempts={attempts} layout="outgoing" />
      <NodeDetails content={responseDetails}>
        <button type="button" className={cn(styles.endpoint, styles.response)} data-status={responseStatus}>
          <span className={styles.endpointIcon} aria-hidden="true"><MessageIcon size={15} /></span>
          <span className={styles.endpointText}>
            <strong>{labels.response}</strong>
            <span title={responseText}>{responseText}</span>
          </span>
        </button>
      </NodeDetails>
    </div> : <div className={styles.empty}>{labels.noAttempts}</div>}
  </section>;
}
