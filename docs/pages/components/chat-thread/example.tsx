"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ChatThread, ChatUserMessage, ChatAssistantMessage, ChatMarkdown, ChatDivider, chatThreadZhLabels, splitThreadHistory } from "@zeron/ui/chat-thread";
import { InputMessage } from "@zeron/ui/input-message";

type Message = { id: string; role: "user" | "assistant"; text: string; stopped?: boolean; feedback?: "up" | "down" | null };
function initialMessages(zh: boolean): Message[] {
  return [
    { id: "question", role: "user", text: zh ? "单条消息和会话分别负责什么？" : "What belongs to a message and to a conversation?" },
    { id: "answer", role: "assistant", text: zh ? "**ChatMessage** 管理单条消息的呈现。**ChatThread** 协调会话滚动与历史，通过消息包装组件注册 ID，通过 `composer` 接入输入框；数据和请求由宿主维护。" : "**ChatMessage** presents one message. **ChatThread** coordinates scrolling and history, registers IDs through its message wrappers, and accepts an editor through `composer`. The host owns data and requests." },
  ];
}

export function ChatThreadExample() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [messages, setMessages] = useState<Message[]>(() => initialMessages(zh));
  const [draft, setDraft] = useState("");
  const [run, setRun] = useState<{ id: string; text: string } | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!run) return;
    let length = 0;
    const timer = setInterval(() => {
      length = Math.min(length + 4, run.text.length);
      setMessages((current) => current.map((message) => message.id === run.id ? { ...message, text: run.text.slice(0, length) } : message));
      if (length === run.text.length) { clearInterval(timer); setRun(null); }
    }, 100);
    return () => clearInterval(timer);
  }, [run]);
  function reply(id: string) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, text: "", stopped: false } : message));
    setRun({ id, text: zh ? "这是宿主本地模拟的流式回复。你可以停止生成、重试、复制或评价；组件本身不请求模型。" : "This reply streams from a local host simulation. Stop, retry, copy or rate it; the component does not contact a model." });
  }
  function send(text: string) {
    if (run) return;
    const id = crypto.randomUUID();
    setMessages((current) => [...current, { id: `question-${id}`, role: "user", text }, { id, role: "assistant", text: "" }]);
    setDraft("");
    reply(id);
  }
  return <div className="h-96 w-full min-w-0">
    <ChatThread locale={locale} labels={zh ? chatThreadZhLabels : undefined} busy={!!run} composerRef={editor}
      composer={<InputMessage layout="compact" textareaRef={editor} value={draft} onValueChange={setDraft} status={run ? "streaming" : "idle"}
        placeholder={zh ? "输入消息，体验本地流式回复…" : "Send a message to try local streaming…"}
        onSend={send} onStop={() => { if (run) setMessages((current) => current.map((message) => message.id === run.id ? { ...message, stopped: true } : message)); setRun(null); }} />}>
      <ChatDivider>{zh ? "本地交互示例" : "Local interactive example"}</ChatDivider>
      {messages.map((message, index) => message.role === "user" ? <ChatUserMessage key={message.id} id={message.id} text={message.text} pin={index === messages.length - 2 && !!run} /> :
        <ChatAssistantMessage key={message.id} id={message.id} text={message.text} streaming={run?.id === message.id} stopped={message.stopped} last={index === messages.length - 1}
          model={zh ? "示例助手" : "Example assistant"} feedback={message.feedback} onFeedback={(feedback) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, feedback } : item))}
          onRetry={() => reply(message.id)}><ChatMarkdown text={message.text} streaming={run?.id === message.id} /></ChatAssistantMessage>)}
    </ChatThread>
  </div>;
}

export function ChatThreadHistoryExample() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [messages, setMessages] = useState<Message[]>(() => [...initialMessages(zh),
    { id: "checkpoint", role: "user", text: zh ? "继续调整排版" : "Continue refining the layout" },
    { id: "revision", role: "assistant", text: zh ? "此轮保留了一个可恢复的检查点。" : "This turn includes a restorable checkpoint." }]);
  const [draft, setDraft] = useState("");
  const [hasOlder, setHasOlder] = useState(true);
  const attempts = useRef(0);
  const revision = useRef(0);
  const editor = useRef<HTMLTextAreaElement>(null);
  return <div className="h-144 w-full min-w-0">
    <ChatThread locale={locale} labels={zh ? chatThreadZhLabels : undefined} composerRef={editor} hasOlder={hasOlder}
      onLoadOlder={async () => {
        if (attempts.current++ === 0) throw new Error("Local demo: retry history loading");
        revision.current++;
        setMessages((current) => [{ id: "older", role: "user", text: zh ? "更早的会话记录" : "An earlier conversation turn" }, ...current]);
        setHasOlder(false);
      }}
      onRestore={async (id) => {
        const previous = messages;
        const previousDraft = draft;
        const { kept, removed } = splitThreadHistory(messages, id);
        setMessages(kept); setDraft(removed[0]?.text ?? "");
        const restoredAt = ++revision.current;
        return { undo: () => {
          if (revision.current !== restoredAt) throw new Error("The host snapshot changed");
          revision.current++; setMessages(previous); setDraft(previousDraft);
        } };
      }}
      composer={<InputMessage layout="compact" textareaRef={editor} value={draft} onValueChange={(value) => { revision.current++; setDraft(value); }} autoDispatchQueue={false}
        placeholder={zh ? "恢复后的消息会回填到这里" : "Restored messages return to this draft"}
        onSend={(text) => { revision.current++; setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text }]); setDraft(""); }} />}>
      {messages.map((message) => message.role === "user" ? <ChatUserMessage key={message.id} id={message.id} text={message.text}
        checkpoint={message.id === "checkpoint" ? { id: message.id, files: ["src/example.ts"] } : undefined} /> :
        <ChatAssistantMessage key={message.id} id={message.id} text={message.text}><ChatMarkdown text={message.text} /></ChatAssistantMessage>)}
    </ChatThread>
  </div>;
}
