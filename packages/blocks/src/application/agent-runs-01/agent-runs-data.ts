import type {
  AgentRun,
  AgentRunsData,
  AgentRunsLabels,
  AgentRunsMode,
} from "./agent-runs-types";

export const usageKinds = [
  "input",
  "output",
  "cacheRead",
  "cacheWrite",
] as const;
const nonnegative = (value: number) => Number.isFinite(value) && value >= 0;
const unique = (items: readonly { id: string }[]) =>
  items.every((item) => item.id.trim()) &&
  new Set(items.map((item) => item.id)).size === items.length;
export const runCost = (run: AgentRun) =>
  run.usage === null
    ? null
    : usageKinds.reduce((sum, kind) => sum + run.usage![kind].cost, 0);
export const runTokens = (run: AgentRun) =>
  run.usage === null
    ? null
    : usageKinds.reduce((sum, kind) => sum + run.usage![kind].tokens, 0);
export const runDuration = (run: AgentRun, end: number) =>
  (run.endedAt ?? end) - run.startedAt;
export function cacheRatio(run: AgentRun) {
  if (!run.usage) return null;
  const input = run.usage.input.tokens + run.usage.cacheRead.tokens;
  return input > 0 ? run.usage.cacheRead.tokens / input : null;
}
export function validateAgentRunsData(data: AgentRunsData) {
  if (
    !data.id.trim() ||
    !data.project.name.trim() ||
    !/^[A-Z]{3}$/.test(data.currency) ||
    !Number.isFinite(new Date(data.start).getTime()) ||
    !Number.isFinite(new Date(data.end).getTime()) ||
    data.end <= data.start ||
    !unique(data.agents) ||
    !unique(data.models) ||
    !unique(data.runs) ||
    [...data.agents, ...data.models].some(
      (item) =>
        !Number.isInteger(item.colorIndex) ||
        item.colorIndex < 1 ||
        item.colorIndex > 5,
    )
  )
    return false;
  const agents = new Set(data.agents.map((agent) => agent.id));
  const models = new Set(data.models.map((model) => model.id));
  for (const run of data.runs) {
    if (
      !agents.has(run.agentId) ||
      (run.modelId !== undefined && !models.has(run.modelId)) ||
      !["running", "completed", "cancelled", "failed"].includes(run.status) ||
      !Number.isFinite(run.startedAt) ||
      run.startedAt < data.start ||
      run.startedAt > data.end ||
      (run.status === "running"
        ? run.endedAt !== null
        : run.endedAt === null) ||
      (run.endedAt !== null &&
        (!Number.isFinite(run.endedAt) ||
          run.endedAt < run.startedAt ||
          run.endedAt > data.end)) ||
      (run.cacheSavings !== undefined && !nonnegative(run.cacheSavings))
    )
      return false;
    if (
      run.usage !== null &&
      (!run.modelId ||
        usageKinds.some(
          (kind) =>
            !run.usage?.[kind] ||
            !Number.isSafeInteger(run.usage[kind].tokens) ||
            run.usage[kind].tokens < 0 ||
            !nonnegative(run.usage[kind].cost),
        ))
    )
      return false;
  }
  const summary = summarizeAgentRuns(data.runs, data.end);
  return (
    Number.isFinite(summary.cost) &&
    Number.isSafeInteger(summary.tokens) &&
    Number.isFinite(summary.duration)
  );
}
export function summarizeAgentRuns(runs: readonly AgentRun[], end: number) {
  const agentCosts = new Map<string, number>();
  const modelCosts = new Map<string, number>();
  let cost = 0,
    tokens = 0,
    output = 0,
    cacheRead = 0,
    input = 0,
    duration = 0,
    active = 0,
    cancelled = 0,
    unreported = 0;
  for (const run of runs) {
    duration += runDuration(run, end);
    if (run.status === "running") active += 1;
    if (run.status === "cancelled") cancelled += 1;
    if (!run.usage) {
      unreported += 1;
      continue;
    }
    const reportedCost = runCost(run)!;
    cost += reportedCost;
    tokens += runTokens(run)!;
    agentCosts.set(
      run.agentId,
      (agentCosts.get(run.agentId) ?? 0) + reportedCost,
    );
    if (run.modelId !== undefined)
      modelCosts.set(
        run.modelId,
        (modelCosts.get(run.modelId) ?? 0) + reportedCost,
      );
    output += run.usage.output.tokens;
    cacheRead += run.usage.cacheRead.tokens;
    input += run.usage.input.tokens;
  }
  return {
    cost,
    tokens,
    output,
    duration,
    active,
    cancelled,
    unreported,
    agentCosts,
    modelCosts,
    cacheRatio: input + cacheRead > 0 ? cacheRead / (input + cacheRead) : null,
  };
}
/** A cumulative step is recorded at completion, or the reporting-window end for active usage. */
export function agentRunsChartData(data: AgentRunsData, mode: AgentRunsMode) {
  const events = data.runs
    .filter((run) => run.usage !== null)
    .map((run) => ({ date: run.endedAt ?? data.end, cost: runCost(run)! }))
    .sort((a, b) => a.date - b.date);
  if (!events.length) return [];
  if (mode === "per-run")
    return events.map((event) => ({ date: event.date, value: event.cost }));
  const points = [{ date: data.start, value: 0 }];
  let cost = 0;
  for (const event of events) {
    cost += event.cost;
    if (points[points.length - 1].date === event.date)
      points[points.length - 1].value = cost;
    else points.push({ date: event.date, value: cost });
  }
  if (points[points.length - 1].date !== data.end)
    points.push({ date: data.end, value: cost });
  return points;
}
export function createAgentRunsFormatters(
  locale: string,
  timeZone: string,
  currency: string,
  labels: AgentRunsLabels,
) {
  let resolvedLocale = locale,
    resolvedZone = timeZone;
  try {
    new Intl.NumberFormat(locale);
  } catch {
    resolvedLocale = "en-US";
  }
  try {
    new Intl.DateTimeFormat(resolvedLocale, { timeZone }).format(0);
  } catch {
    resolvedZone = "UTC";
  }
  const number = new Intl.NumberFormat(resolvedLocale);
  const compact = new Intl.NumberFormat(resolvedLocale, {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  const money = new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "USD",
  });
  const minorUnit = 10 ** -(money.resolvedOptions().maximumFractionDigits ?? 2);
  const preciseMoney = new Intl.NumberFormat(resolvedLocale, {
    style: "currency",
    currency: money.resolvedOptions().currency,
    maximumSignificantDigits: 4,
  });
  const percent = new Intl.NumberFormat(resolvedLocale, {
    style: "percent",
    maximumFractionDigits: 0,
  });
  const date = new Intl.DateTimeFormat(resolvedLocale, {
    timeZone: resolvedZone,
    month: "short",
    day: "numeric",
  });
  const fullDate = new Intl.DateTimeFormat(resolvedLocale, {
    timeZone: resolvedZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = new Intl.DateTimeFormat(resolvedLocale, {
    timeZone: resolvedZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const timeWithSeconds = new Intl.DateTimeFormat(resolvedLocale, {
    timeZone: resolvedZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const day = new Intl.DateTimeFormat("en-CA", {
    timeZone: resolvedZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return {
    number: number.format,
    compact: compact.format,
    money: (value: number) =>
      value !== 0 && Math.abs(value) < minorUnit
        ? preciseMoney.format(value)
        : money.format(value),
    axisMoney: preciseMoney.format,
    percent: percent.format,
    date: (value: number | Date) => date.format(value),
    fullDate: (value: number) => fullDate.format(value),
    time: (value: number) => time.format(value),
    timeWithSeconds: (value: number) => timeWithSeconds.format(value),
    day: (value: number) => day.format(value),
    duration: (ms: number) =>
      ms < 60_000
        ? labels.underMinute
        : labels.duration(
            number.format(Math.floor(ms / 3_600_000)),
            number.format(Math.floor(ms / 60_000) % 60),
          ),
  };
}
export type AgentRunsFormatters = ReturnType<typeof createAgentRunsFormatters>;
