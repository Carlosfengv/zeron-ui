"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import GeminiColor from "@lobehub/icons/es/Gemini/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import {
  AgentQueue, agentQueueChineseLabels, type AgentQueueJob, type AgentQueueWorker,
} from "@zeron/blocks/agent-queue-01";
import { compareDemoJobs, createQueueDemo, tickQueueDemo } from "./agent-queue-demo-data";

const workers: AgentQueueWorker[] = [
  { id: "sonnet", name: "Sonnet 5.5", icon: <ClaudeColor /> },
  { id: "sol", name: "GPT-6 Sol", icon: <OpenAIMono /> },
  { id: "gemini", name: "Gemini 3.8 Flash", icon: <GeminiColor /> },
  { id: "haiku", name: "Haiku 5", icon: <ClaudeColor /> },
  { id: "opus", name: "Opus 4.8", icon: <ClaudeColor /> },
  { id: "flash", name: "Gemini Flash Lite", icon: <GeminiColor /> },
  { id: "mini", name: "GPT Mini", icon: <OpenAIMono /> },
  { id: "review", name: "Review Agent" },
];

export function AgentQueueDemo({ catalog = false }: { catalog?: boolean }) {
  const chinese = useLocale() === "zh-CN";
  const [state, setState] = useState(() => createQueueDemo(chinese, workers));

  useEffect(() => {
    if (catalog) return;
    const interval = window.setInterval(() => setState((current) => tickQueueDemo(current, chinese, workers)), 250);
    return () => window.clearInterval(interval);
  }, [catalog, chinese]);

  function promote(job: AgentQueueJob) {
    setState((current) => {
      const first = current.jobs.filter((item) => item.status === "queued").sort(compareDemoJobs)[0];
      return { ...current, jobs: current.jobs.map((item) => item.id === job.id && item.status === "queued"
        ? { ...item, priority: "high", queueOrder: (first?.queueOrder ?? 0) - 1 }
        : item) };
    });
  }

  function cancel(job: AgentQueueJob) {
    setState((current) => ({ ...current, jobs: current.jobs.filter((item) => item.id !== job.id || item.status === "done" || item.status === "failed") }));
  }

  function setConcurrency(concurrency: number) {
    const ids = new Set(workers.slice(0, concurrency).map((worker) => worker.id));
    setState((current) => ({ ...current, concurrency, jobs: current.jobs.map((job) => job.status === "running" && !ids.has(job.worker ?? "")
      ? { ...job, status: "queued", worker: undefined, startedAt: undefined, progress: undefined, elapsed: 0 }
      : job) }));
  }

  return <div className="flex h-full min-h-0 w-full overflow-auto bg-surface-base p-3 sm:p-6">
    <div className="m-auto w-full max-w-3xl">
      <AgentQueue name="agent-jobs" jobs={state.jobs} workers={workers.slice(0, state.concurrency)} now={state.now}
        labels={chinese ? agentQueueChineseLabels : undefined} depthHistory={state.history} rateLimits={state.limits}
        totals={state.totals} backpressure={12} windowMs={96_000} paused={state.paused}
        onPausedChange={(paused) => setState((current) => ({ ...current, paused }))}
        onConcurrencyChange={setConcurrency} onPromote={promote} onCancel={cancel} />
    </div>
  </div>;
}
