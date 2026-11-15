import type { AgentQueueDepthSample, AgentQueueJob, AgentQueueRateLimit, AgentQueueWorker } from "@zeron/blocks/agent-queue-01";

type DemoJob = AgentQueueJob & { duration: number; elapsed: number };

export interface QueueDemoState {
  now: number;
  jobs: DemoJob[];
  history: AgentQueueDepthSample[];
  limits: AgentQueueRateLimit[];
  nextArrival: number;
  sequence: number;
  concurrency: number;
  paused: boolean;
  totals: { done: number; failed: number };
}

const seedTime = 100_000;
const step = 250;
const titles = [
  ["Summarize support ticket #2481", "总结支持工单 #2481", "llm"],
  ["Embed 240 documents", "为 240 份文档生成向量", "tool"],
  ["Draft reply · Acme", "起草 Acme 回复", "llm"],
  ["Search docs for refunds", "检索退款文档", "tool"],
  ["Triage new GitHub issues", "分流新的 GitHub Issue", "agent"],
  ["Translate release notes", "翻译版本说明", "llm"],
  ["Review onboarding email", "审核引导邮件", "human"],
  ["Update roadmap page", "更新路线图页面", "tool"],
  ["Classify support emails", "归类支持邮件", "llm"],
  ["Run the evaluation suite", "运行评估套件", "agent"],
] as const;

export function compareDemoJobs(first: DemoJob, second: DemoJob) {
  return Number(second.priority === "high") - Number(first.priority === "high")
    || (first.queueOrder ?? 0) - (second.queueOrder ?? 0) || first.enqueuedAt - second.enqueuedAt;
}

function makeJob(sequence: number, enqueuedAt: number, chinese: boolean): DemoJob {
  const [name, localized, kind] = titles[sequence % titles.length];
  return {
    id: `job-${sequence}`, name: chinese ? localized : name, kind, status: "queued", enqueuedAt,
    priority: sequence % 11 === 2 ? "high" : "normal", duration: 4250 + (sequence * 293 % 5500), elapsed: 0,
    attempt: 1, maxAttempts: 3,
  };
}

export function createQueueDemo(chinese: boolean, workers: readonly AgentQueueWorker[]): QueueDemoState {
  const history = [6, 9, 13, 16, 14, 12, 8, 9, 5, 3, 4, 1, 0, 2, 0, 0, 2, 9, 12, 14,
    12, 10, 8, 6, 5, 4, 2, 4, 1, 2, 0, 4, 3, 4, 5, 7, 15, 17, 20, 17, 16, 12, 11, 9, 6, 7, 4, 6, 4, 5, 4];
  const recent = Array.from({ length: 72 }, (_, index): DemoJob => {
    const endedAt = seedTime - 300 - index * 810;
    const startedAt = endedAt - 5_000;
    return { ...makeJob(index, startedAt - (index % 6 ? 2400 : 13_000), chinese), startedAt, endedAt, status: index % 31 === 0 ? "failed" : "done" };
  });
  const active = Array.from({ length: 8 }, (_, index): DemoJob => {
    const job = makeJob(72 + index, seedTime - 8_000 + index * 990, chinese);
    if (index >= 4) return job;
    const elapsed = 2200 + index * 610;
    return { ...job, status: "running", startedAt: seedTime - elapsed, worker: workers[index].id, elapsed, progress: elapsed / job.duration };
  });
  const label = chinese ? "模型服务请求速率限制" : "Provider request rate limit";
  return {
    now: seedTime, jobs: [...recent, ...active], history: history.map((depth, index) => ({ at: seedTime - 96_000 + index * 1920, depth })),
    limits: [{ from: 4_000, until: 10_000, label }, { from: 34_000, until: 43_000, label }, { from: 68_000, until: 77_000, label }],
    nextArrival: seedTime + 1_250, sequence: 80, concurrency: 4, paused: false, totals: { done: 131, failed: 3 },
  };
}

export function tickQueueDemo(state: QueueDemoState, chinese: boolean, workers: readonly AgentQueueWorker[]): QueueDemoState {
  const now = state.now + step;
  const cycle = (now - seedTime) % 42_000;
  const limited = cycle >= 11_000 && cycle < 20_000;
  const stalled = state.paused || limited;
  const totals = { ...state.totals };
  let sequence = state.sequence;
  let nextArrival = state.nextArrival;
  let limits = state.limits;
  if (cycle === 11_000) {
    const label = chinese ? "模型服务请求速率限制" : "Provider request rate limit";
    limits = [...limits.filter((limit) => limit.until > now - 96_000), { from: now, until: now + 9_000, label }];
  }

  const jobs = state.jobs.filter((job) => job.endedAt === undefined || job.endedAt > now - 96_000).map((job): DemoJob => {
    if (stalled || job.status !== "running") return job;
    const elapsed = job.elapsed + step;
    if (elapsed < job.duration) return { ...job, elapsed, progress: elapsed / job.duration };
    const index = Number(job.id.slice(4));
    if (index % 23 === 0 && job.attempt === 1) {
      return { ...job, status: "queued", attempt: 2, enqueuedAt: now, startedAt: undefined, worker: undefined, elapsed: 0, progress: undefined };
    }
    const status = index % 17 === 0 ? "failed" : "done";
    totals[status]++;
    return { ...job, status, elapsed, progress: 1, endedAt: now };
  });

  if (now >= nextArrival) {
    if (jobs.filter((job) => job.status === "queued").length < 26) jobs.push(makeJob(sequence++, now, chinese));
    nextArrival = now + (limited ? 500 : 2300 + sequence % 3 * 200);
  }

  if (!stalled) {
    const occupied = new Set(jobs.filter((job) => job.status === "running").map((job) => job.worker));
    const waiting = jobs.filter((job) => job.status === "queued").sort(compareDemoJobs);
    for (const worker of workers.slice(0, state.concurrency)) {
      if (occupied.has(worker.id) || waiting.length === 0) continue;
      const job = waiting.shift()!;
      jobs[jobs.indexOf(job)] = { ...job, worker: worker.id, status: "running", startedAt: now, progress: 0 };
    }
  }

  const history = now % 1000 === 0
    ? [...state.history.filter((sample) => sample.at >= now - 100_000), { at: now, depth: jobs.filter((job) => job.status === "queued").length }]
    : state.history;
  return { ...state, now, jobs, history, limits, nextArrival, sequence, totals };
}
