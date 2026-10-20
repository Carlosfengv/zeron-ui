"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import {
  ChatAssistantMessage,
  ChatDivider,
  ChatThread,
  ChatUserMessage,
  ChatAttachments,
  chatThreadZhLabels,
  createChatThreadDemoData,
  createChatThreadDemoReply,
  getChatThreadDemoPath,
  type ChatThreadDemoMessage,
  type ChatThreadDemoState,
} from "@zeron/blocks/chat-thread-01";
import {
  createModelSelectorDemoModels,
  modelSelectorDemoValue,
} from "@zeron/blocks/model-selector-01";
import { Button } from "@zeron/ui/button";
import { InputMessage, type QueuedMessage } from "@zeron/ui/input-message";
import { CodeDiff } from "@zeron/ui/code-block";
import { ChatMessageAttachments } from "@zeron/ui/chat-message";
import { useIcon } from "@zeron/ui/system/icon-context";
import { ChatDemoContextControl, ChatDemoModelControls, ChatDemoResponseContent } from "./ChatDemoParts";

const testCode =
  'import { act, renderHook } from "@testing-library/react";\nimport { expect, it, vi } from "vitest";\n\nimport { useDebouncedValue } from "./use-debounced-value";\n\nit("waits for a pause before updating", () => {\n  vi.useFakeTimers();\n  const { result, rerender } = renderHook(\n    ({ value }) => useDebouncedValue(value, 250),\n    { initialProps: { value: "r" } }\n  );\n  rerender({ value: "re" });\n  expect(result.current).toBe("r");\n  act(() => vi.advanceTimersByTime(250));\n  expect(result.current).toBe("re");\n  vi.useRealTimers();\n});\n';

export function ChatThreadDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [data, setData] = useState<ChatThreadDemoState>(() =>
    createChatThreadDemoData(locale),
  );
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [remoteFiles, setRemoteFiles] = useState<
    ChatThreadDemoMessage["files"]
  >([]);
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [run, setRun] = useState<{ id: string; text: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const [pinId, setPinId] = useState<string | null>("slot-question-3");
  const [hasOlder, setHasOlder] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [holdQueue, setHoldQueue] = useState(false);
  const [model, setModel] = useState(modelSelectorDemoValue);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextNotice, setContextNotice] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const revision = useRef(0);
  const timing = useRef<{ id: string; startedAt: number } | null>(null);
  const models = useMemo(() => createModelSelectorDemoModels(locale), [locale]);
  const visible = getChatThreadDemoPath(data);
  const busy = run !== null;
  const Plus = useIcon("plus");
  const Replay = useIcon("rotate-ccw");

  useEffect(() => {
    if (!run) return;
    setThinking(true);
    const startedAt = performance.now();
    timing.current = { id: run.id, startedAt };
    let ttftMs: number | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timer = setTimeout(() => {
      setThinking(false);
      let length = 0;
      interval = setInterval(() => {
        length = Math.min(length + 9, run.text.length);
        const elapsed = performance.now() - startedAt;
        ttftMs ??= elapsed;
        setData((current) => ({
          ...current,
          messages: current.messages.map((message) =>
            message.id === run.id
              ? { ...message, text: run.text.slice(0, length), metrics: { ...message.metrics, ttftMs, outputTokens: Math.ceil(length / 3), durationMs: elapsed } }
              : message,
          ),
        }));
        if (length === run.text.length) {
          clearInterval(interval);
          setRun(null);
        }
      }, 32);
    }, 600);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [run]);

  const reset = (empty: boolean) => {
    revision.current++;
    setHoldQueue(true);
    setRun(null);
    setBookmarkedIds([]);
    setData(
      empty
        ? { messages: [], selection: {} }
        : createChatThreadDemoData(locale),
    );
    setDraft("");
    setFiles([]);
    setRemoteFiles([]);
    setQueue([]);
    setPinId(empty ? null : "slot-question-3");
    setHasOlder(!empty);
    setContextOpen(false);
  };

  const respond = (user: ChatThreadDemoMessage, next: ChatThreadDemoState) => {
    const id = crypto.randomUUID();
    // The local Auto fixture resolves to Sonnet; record the actual reply identity.
    const responseModel = models.find((item) => item.id === (model.modelId === "auto" ? "sonnet-5.5" : model.modelId));
    setData({
      ...next,
      messages: [
        ...next.messages,
        {
          id,
          slotId: `reply-${user.id}`,
          parentId: user.id,
          role: "assistant",
          text: "",
          model: responseModel?.name,
          modelId: responseModel?.id,
          provider: responseModel ? "Anthropic" : undefined,
          metrics: { inputTokens: Math.ceil(next.messages.reduce((sum, message) => sum + message.text.length, 0) / 3) },
        },
      ],
      selection: { ...next.selection, [user.id]: id },
    });
    const prompt = user.text || [...(user.files ?? []), ...(user.localFiles ?? [])].map((file) => file.name).join(", ");
    setRun({ id, text: createChatThreadDemoReply(prompt, locale) });
  };

  const send = (text: string, attached: File[]) => {
    revision.current++;
    setHoldQueue(false);
    const parentId = visible.at(-1)?.id ?? null;
    const id = crypto.randomUUID();
    const user: ChatThreadDemoMessage = {
      id,
      slotId: `user-${id}`,
      parentId,
      role: "user",
      text,
      localFiles: attached,
      files: [...(remoteFiles ?? [])],
      checkpoint: { id: `checkpoint-${id}` },
    };
    const next = {
      messages: [...data.messages, user],
      selection: { ...data.selection, [parentId ?? "root"]: id },
    };
    respond(user, next);
    setDraft("");
    setFiles([]);
    setRemoteFiles([]);
    setPinId(user.slotId);
  };

  const edit = (message: ChatThreadDemoMessage, text: string) => {
    revision.current++;
    setHoldQueue(true);
    const id = crypto.randomUUID();
    const user = {
      ...message,
      id,
      text,
      checkpoint: { id: `checkpoint-${id}` },
    };
    respond(user, {
      messages: [...data.messages, user],
      selection: { ...data.selection, [message.parentId ?? "root"]: id },
    });
  };

  const retry = (message: ChatThreadDemoMessage) => {
    const user = data.messages.find((item) => item.id === message.parentId);
    if (!user) return;
    revision.current++;
    setHoldQueue(true);
    respond(user, data);
  };

  const branch = (message: ChatThreadDemoMessage) => {
    const siblings = data.messages.filter(
      (item) => item.parentId === message.parentId,
    );
    return {
      count: siblings.length,
      index: siblings.findIndex((item) => item.id === message.id),
      onChange: (index: number) => {
        revision.current++;
        setHoldQueue(true);
        setData((current) => ({
          ...current,
          selection: {
            ...current.selection,
            [message.parentId ?? "root"]: siblings[index].id,
          },
        }));
      },
    };
  };

  const restore = async (checkpointId: string, options: { code: boolean }) => {
    const message = visible.find(
      (item) => item.checkpoint?.id === checkpointId,
    );
    if (!message) throw new Error("Checkpoint unavailable");
    const snapshot = { data, draft, files, remoteFiles, queue, hasOlder };
    setMutating(true);
    setHoldQueue(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 250));
      setData({
        ...data,
        selection: { ...data.selection, [message.parentId ?? "root"]: null },
      });
      setDraft(message.text);
      setFiles(message.localFiles ?? []);
      setRemoteFiles(message.files ?? []);
      setQueue([]);
      if (options.code)
        setContextNotice(
          zh
            ? "本地演示：已模拟还原文件；未修改磁盘文件。"
            : "Local demo: file restoration simulated; no disk files changed.",
        );
      const restoredRevision = ++revision.current;
      return {
        undo: async () => {
          if (revision.current !== restoredRevision)
            throw new Error("Conversation changed after restore");
          revision.current++;
          setHoldQueue(true);
          setData(snapshot.data);
          setDraft(snapshot.draft);
          setFiles(snapshot.files);
          setRemoteFiles(snapshot.remoteFiles);
          setQueue(snapshot.queue);
          setHasOlder(snapshot.hasOlder);
        },
      };
    } finally {
      setMutating(false);
    }
  };

  const loadOlder = async () => {
    const requestRevision = revision.current;
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (requestRevision !== revision.current) return;
    revision.current++;
    setData((current) => ({
      messages: [
        {
          id: "older-user",
          slotId: "slot-older-user",
          parentId: null,
          role: "user",
          text: zh
            ? "一起检查搜索体验。"
            : "Let’s review the search experience.",
        },
        {
          id: "older-assistant",
          slotId: "slot-older-assistant",
          parentId: "older-user",
          role: "assistant",
          model: "Sonnet 5.5",
          modelId: "sonnet-5.5",
          provider: "Anthropic",
          text: zh
            ? "先看看输入延迟和请求频率。"
            : "Start with input latency and request frequency.",
        },
        ...current.messages.map((message) =>
          message.parentId === null
            ? { ...message, parentId: "older-assistant" }
            : message,
        ),
      ],
      selection: {
        ...current.selection,
        root: "older-user",
        "older-user": "older-assistant",
        "older-assistant":
          current.selection.root === undefined
            ? "question-1"
            : current.selection.root,
      },
    }));
    setHasOlder(false);
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-surface-floating">
      <header className="flex shrink-0 items-center justify-between gap-2 px-4 py-3 text-label sm:px-6">
        <span className="font-medium">Chat Thread</span>
        <div className="flex flex-wrap justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={Replay}
            disabled={mutating}
            onClick={() => reset(false)}
          >
            {zh ? "重播" : "Replay"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={
              busy ||
              mutating ||
              !visible.some((message) => message.role === "assistant")
            }
            onClick={() => {
              const last = visible.findLast(
                (message) => message.role === "assistant",
              );
              setData((current) => ({
                ...current,
                messages: current.messages.map((message) =>
                  message.id === last?.id
                    ? {
                        ...message,
                        error: zh
                          ? "连接中断，已保留回复内容。"
                          : "Connection lost. Your response has been kept.",
                      }
                    : message,
                ),
              }));
            }}
          >
            {zh ? "失败示例" : "Error example"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            leadingIcon={Plus}
            disabled={mutating}
            onClick={() => reset(true)}
          >
            {zh ? "新对话" : "New chat"}
          </Button>
        </div>
      </header>
      <ChatThread
        bookmarkedIds={bookmarkedIds}
        onBookmarkChange={(id, bookmarked) => setBookmarkedIds((current) => bookmarked
          ? [...new Set([...current, id])] : current.filter((item) => item !== id))}
        bookmarkLabels={zh ? { bookmark: "收藏消息", unbookmark: "取消收藏", bookmarked: "已收藏" } : undefined}
        labels={zh ? chatThreadZhLabels : undefined}
        locale={locale}
        busy={busy || mutating}
        hasOlder={hasOlder}
        onLoadOlder={loadOlder}
        onRestore={restore}
        composerRef={textareaRef}
        composer={
          <>
            {!!remoteFiles?.length && (
              <div className="mb-2 flex items-center justify-end gap-2">
                <ChatAttachments files={remoteFiles} />
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setRemoteFiles([])}
                >
                  {zh ? "移除附件" : "Remove attachments"}
                </Button>
              </div>
            )}
            <InputMessage
              textareaRef={textareaRef}
              value={draft}
              onValueChange={setDraft}
              files={files}
              onFilesChange={setFiles}
              accept="image/*,application/pdf,application/json,.txt"
              layout="compact"
              minRows={1}
              maxRows={6}
              placeholder={zh ? "继续提问…" : "Ask a follow-up…"}
              textareaProps={{ "aria-label": zh ? "消息" : "Message" }}
              sendLabel={zh ? "发送消息" : "Send message"}
              disabled={mutating}
              status={busy ? "streaming" : "idle"}
              onStop={() => {
                setData((current) => ({
                  ...current,
                  messages: current.messages.map((message) =>
                    message.id === run?.id
                      ? { ...message, stopped: true, metrics: { ...message.metrics, durationMs: timing.current?.id === message.id ? performance.now() - timing.current.startedAt : message.metrics?.durationMs } }
                      : message,
                  ),
                }));
                setRun(null);
              }}
              queue={queue}
              onQueueChange={setQueue}
              autoDispatchQueue={!holdQueue && !mutating}
              history={visible
                .filter((message) => message.role === "user")
                .map((message) => message.text)}
              onSend={send}
              leftSlot={({ openFilePicker }) => (
                <ChatDemoModelControls models={models} value={model} onValueChange={setModel} locale={locale} onAttach={() => openFilePicker()} />
              )}
              rightSlot={
                <ChatDemoContextControl locale={locale} open={contextOpen} onOpenChange={setContextOpen} notice={contextNotice}
                  onCompact={() => setContextNotice(zh ? "本地演示：已模拟压缩历史。" : "Local demo: history compaction simulated.")} />
              }
              disclaimer={
                zh
                  ? "本地交互演示 · 回复、上下文和文件恢复均为模拟数据"
                  : "Local demo · Replies, context and file restoration are simulated"
              }
            />
          </>
        }
      >
        {visible.length > 0 && (
          <ChatDivider>{zh ? "今天" : "Today"}</ChatDivider>
        )}
        {visible.map((message, index) =>
          message.role === "user" ? (
            <ChatUserMessage
              key={message.slotId}
              id={message.slotId}
              text={message.text}
              files={message.files}
              attachments={
                message.localFiles?.length ? (
                  <ChatMessageAttachments files={[...(message.files ?? []), ...message.localFiles]} label={zh ? "附件" : "Attachments"} />
                ) : undefined
              }
              checkpoint={message.checkpoint}
              time={new Date("2026-10-20T01:38:00Z")}
              pin={pinId === message.slotId}
              branch={branch(message)}
              onEdit={(text) => edit(message, text)}
            />
          ) : (
            <ChatAssistantMessage
              key={message.slotId}
              id={message.slotId}
              text={message.text}
              streaming={run?.id === message.id}
              last={index === visible.length - 1}
              branch={branch(message)}
              feedback={message.feedback}
              onFeedback={(feedback) =>
                setData((current) => ({
                  ...current,
                  messages: current.messages.map((item) =>
                    item.id === message.id ? { ...item, feedback } : item,
                  ),
                }))
              }
              onRetry={() => retry(message)}
              error={message.error}
              stopped={message.stopped}
              model={message.model}
              modelLogo={models.find((item) => item.id === message.modelId)?.icon}
              provider={message.provider}
              metrics={message.metrics}
            >
              <ChatDemoResponseContent locale={locale} text={message.text} streaming={run?.id === message.id} thinking={run?.id === message.id && thinking}
                reasoning={message.reasoning ? { description: message.reasoning, label: zh ? "分析搜索性能" : "Analyzed search performance", summary: zh ? "搜索一次，读取一个文件" : "Searched once, read a file", files: ["search.tsx", "hooks/use-results.ts"] } : undefined}>
                  {message.diff && (
                    <div className="mt-3">
                      <CodeDiff
                        oldFile={{
                          name: "hooks/use-debounced-value.test.ts",
                          contents: "",
                        }}
                        newFile={{
                          name: "hooks/use-debounced-value.test.ts",
                          contents: testCode,
                        }}
                      />
                    </div>
                  )}
              </ChatDemoResponseContent>
            </ChatAssistantMessage>
          ),
        )}
      </ChatThread>
    </div>
  );
}
