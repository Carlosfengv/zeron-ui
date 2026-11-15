import type { AgentQueueDepthSample, AgentQueueJob } from "./agent-queue-types";

const priorityOrder = { high: 0, normal: 1, low: 2 };

export function compareWaitingJobs(first: AgentQueueJob, second: AgentQueueJob) {
  return priorityOrder[first.priority ?? "normal"] - priorityOrder[second.priority ?? "normal"]
    || (first.queueOrder ?? 0) - (second.queueOrder ?? 0)
    || first.enqueuedAt - second.enqueuedAt;
}

export function getJobProgress(job: AgentQueueJob, now: number) {
  const progress = job.progress ?? (job.estimate && job.estimate > 0 && job.startedAt !== undefined
    ? Math.min(0.99, (now - job.startedAt) / job.estimate)
    : undefined);
  return progress !== undefined && Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : undefined;
}

export function getQueueMetrics(jobs: readonly AgentQueueJob[], now: number, windowMs: number) {
  const metrics = { throughput: 0, done: 0, failed: 0, waitP95: undefined as number | undefined };
  const waits: number[] = [];
  for (const job of jobs) {
    if (job.status === "done" || job.status === "failed") {
      metrics[job.status]++;
      if (job.endedAt !== undefined && job.endedAt > now - 60_000 && job.endedAt <= now) metrics.throughput++;
    }
    if (job.status !== "queued" && job.startedAt !== undefined && job.startedAt >= now - windowMs && job.startedAt <= now) {
      waits.push(Math.max(0, job.startedAt - job.enqueuedAt));
    }
  }
  waits.sort((a, b) => a - b);
  metrics.waitP95 = waits[Math.ceil(waits.length * 0.95) - 1];
  return metrics;
}

export function getDepthPoints(
  jobs: readonly AgentQueueJob[], history: readonly AgentQueueDepthSample[] | undefined,
  from: number, now: number, waiting: number,
): AgentQueueDepthSample[] {
  let depth = 0;
  const points: AgentQueueDepthSample[] = [];
  if (history) {
    for (const sample of history.slice().sort((a, b) => a.at - b.at)) {
      if (sample.at <= from) depth = sample.depth;
      else if (sample.at < now) points.push(sample);
    }
  } else {
    const changes = new Map<number, number>();
    const addChange = (at: number, change: number) => {
      if (at <= from) depth += change;
      else if (at < now) changes.set(at, (changes.get(at) ?? 0) + change);
    };
    for (const job of jobs) {
      const exit = job.status === "queued" ? Infinity : job.startedAt ?? job.endedAt ?? job.enqueuedAt;
      if (exit <= Math.max(from, job.enqueuedAt) || job.enqueuedAt >= now) continue;
      addChange(job.enqueuedAt, 1);
      addChange(exit, -1);
    }
    let current = depth;
    for (const [at, change] of Array.from(changes).sort(([a], [b]) => a - b)) {
      current += change;
      points.push({ at, depth: current });
    }
  }
  return [{ at: from, depth }, ...points, { at: now, depth: waiting }];
}
