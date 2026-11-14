"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AgentRun, agentRunChineseLabels, type AgentRunNode } from "@zeron/blocks/agent-run-01";
import { Button } from "@zeron/ui/button";
import { useIcon } from "@zeron/ui/system/icon-context";
import { createAgentRunDemos } from "./agent-run-demo-data";

type Playback = "playing" | "paused" | "stopped";

function updatePlayback(node: AgentRunNode, playback: Playback, messages: ReadonlyMap<string, string>, sender: string): AgentRunNode {
  const message = messages.get(node.id);
  const status = playback !== "playing" && node.status === "working" ? playback : node.status;
  return {
    ...node,
    status,
    handoff: message ? { from: sender, summary: message } : node.handoff,
    children: node.children?.map((child) => updatePlayback(child, playback, messages, sender)),
  };
}

export function AgentRunDemo({ catalog = false }: { catalog?: boolean }) {
  const locale = useLocale();
  const chinese = locale.startsWith("zh");
  const timelines = useMemo(() => createAgentRunDemos(chinese), [chinese]);
  const [runId, setRunId] = useState(timelines[0][0].id);
  const [replayCount, setReplayCount] = useState(0);
  const [frame, setFrame] = useState(0);
  const [playback, setPlayback] = useState<Playback>("playing");
  const [messages, setMessages] = useState(() => new Map<string, string>());
  const Replay = useIcon("rotate-ccw");
  const runs = timelines.map(([initial]) => ({ id: initial.id, title: initial.title }));
  const timeline = timelines.find(([initial]) => initial.id === runId) ?? timelines[0];
  const snapshot = timeline[Math.min(catalog ? 4 : frame, timeline.length - 1)];
  const labels = chinese ? agentRunChineseLabels : undefined;

  useEffect(() => {
    if (catalog || playback !== "playing" || frame >= timeline.length - 1) return;
    const timer = window.setTimeout(() => setFrame(frame + 1), 2700);
    return () => window.clearTimeout(timer);
  }, [catalog, frame, playback, replayCount, timeline]);

  function switchRun(id: string) {
    setRunId(id);
    setFrame(0);
    setMessages(new Map());
    setPlayback("playing");
  }

  function restartRun() {
    switchRun(runId);
    setReplayCount((current) => current + 1);
  }

  return <div className="h-full min-h-0 overflow-auto bg-surface-base">
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col justify-center">
      {catalog ? <AgentRun run={snapshot} labels={labels} locale={locale} /> : <>
        <AgentRun key={replayCount} run={{ ...snapshot, root: snapshot.root && updatePlayback(snapshot.root, playback, messages, chinese ? "你" : "You") }}
          runs={runs} onRunChange={switchRun} labels={labels} locale={locale}
          onControl={(_, __, action) => setPlayback(action === "pause" ? "paused" : action === "stop" ? "stopped" : "playing")}
          onMessage={(_, nodeId, message) => setMessages((current) => new Map(current).set(nodeId, message))} />
        <div className="flex justify-end px-4 sm:px-8">
          <Button type="button" variant="ghost" size="sm" iconOnly aria-label={chinese ? "重播任务" : "Replay run"} onClick={restartRun}><Replay /></Button>
        </div>
      </>}
    </div>
  </div>;
}
