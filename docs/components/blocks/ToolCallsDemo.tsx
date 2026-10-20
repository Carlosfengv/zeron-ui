"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ToolCallsThread, createToolCallsDemoParts, toolCallsZhLabels, type ToolCallStatus, type ToolCallsPart } from "@zeron/blocks/tool-calls-01";
import { chatThreadZhLabels } from "@zeron/blocks/chat-thread-01";
import { Button } from "@zeron/ui/button";
import { InputMessage } from "@zeron/ui/input-message";
import { useIcon } from "@zeron/ui/system/icon-context";

export function ToolCallsDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [phase, setPhase] = useState(5);
  const [terminal, setTerminal] = useState<ToolCallStatus>("completed");
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState<string | null>(null);
  const [run, setRun] = useState(0);
  const [stopped, setStopped] = useState(false);
  const editor = useRef<HTMLTextAreaElement>(null);
  const Replay = useIcon("rotate-ccw");
  const busy = phase < 7 && !stopped;
  useEffect(() => {
    if (stopped || phase === 5 || phase >= 7) return;
    const timer = setTimeout(() => setPhase((current) => current + 1), phase === 6 ? 1400 : 650);
    return () => clearTimeout(timer);
  }, [phase, run, stopped]);
  const reset = () => { setStopped(false); setTerminal("completed"); setPhase(0); setRun((value) => value + 1); };
  let parts = createToolCallsDemoParts(locale, phase, terminal);
  if (stopped) {
    parts = parts.map((part): ToolCallsPart => part.kind === "text" ? { ...part, streaming: false }
      : { ...part, items: part.items.map((call) => ["queued", "running", "approval-required"].includes(call.status) ? { ...call, status: "cancelled" } : call) });
    parts.push({ id: "stopped", kind: "text", text: zh ? "已停止本次演示，保留已完成的工具记录。" : "Demo stopped. Completed tool activity has been kept." });
  }
  return <div className="flex h-full min-h-0 w-full flex-col bg-surface-floating">
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-4 py-3 text-label sm:px-6">
      <span className="font-medium">{zh ? "工具调用" : "Tool Calls"}</span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" leadingIcon={Replay} onClick={reset}>{zh ? "重播" : "Replay"}</Button>
        <Button variant="ghost" size="sm" onClick={() => { setStopped(false); setTerminal("failed"); setPhase(7); }}>{zh ? "失败示例" : "Error example"}</Button>
      </div>
    </header>
    <ToolCallsThread key={run} prompt={prompt ?? (zh ? "输入时搜索有些卡顿，能帮我修复吗？" : "Search lags when I type. Can you fix it?")}
      parts={parts} locale={locale} labels={zh ? chatThreadZhLabels : undefined}
      userMessageProps={{ pin: phase === 0 }} assistantMessageProps={{ model: "Search assistant", provider: zh ? "本地演示" : "Local demo" }}
      toolCallsProps={{ labels: zh ? toolCallsZhLabels : undefined,
        onApproval: (_call, decision) => { setTerminal(decision === "allow" ? "completed" : "denied"); setPhase(decision === "allow" ? 6 : 7); },
        onRetry: () => { setStopped(false); setTerminal("completed"); setPhase(6); },
      }} composerRef={editor} composer={<InputMessage textareaRef={editor} layout="compact" minRows={1} maxRows={4}
        value={draft} onValueChange={setDraft} status={busy ? "streaming" : "idle"}
        placeholder={zh ? "继续排查搜索问题…" : "Continue investigating search…"} textareaProps={{ "aria-label": zh ? "消息" : "Message" }}
        sendLabel={zh ? "发送消息" : "Send message"}
        onStop={() => setStopped(true)}
        onSend={(text) => { setPrompt(text); setDraft(""); reset(); }}
        disclaimer={zh ? "本地演示 · 工具、文件变更和测试结果均为模拟数据" : "Local demo · Tool calls, file changes and test results are simulated"} />} />
  </div>;
}
