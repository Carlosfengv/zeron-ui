"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { ChatAssistantMessage, ChatDivider, ChatUserMessage, chatThreadZhLabels } from "@zeron/ui/chat-thread";
import { createChatThreadDemoData, createChatThreadDemoReply, type ChatThreadDemoMessage } from "@zeron/blocks/chat-thread-01";
import { ArtifactPanel, getPendingReviewResources, type ArtifactResource, type ArtifactReviewDecision } from "@zeron/ui/artifact-panel";
import { ArtifactCard, ChatWorkspace, createChatWorkspaceDemoResources } from "@zeron/blocks/chat-workspace-01";
import { createModelSelectorDemoModels, modelSelectorDemoValue } from "@zeron/blocks/model-selector-01";
import { Button } from "@zeron/ui/button";
import { ChatMessageAttachments } from "@zeron/ui/chat-message";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { FileType } from "@zeron/ui/file-type";
import { InputMessage } from "@zeron/ui/input-message";
import { MenuItem } from "@zeron/ui/menu-item";
import { useIcon } from "@zeron/ui/system/icon-context";
import { ChatDemoContextControl, ChatDemoModelControls, ChatDemoResponseContent } from "./ChatDemoParts";
import { ChatWorkspaceSessionMenu } from "./ChatWorkspaceSessionMenu";

type WorkspaceDemoMessage = Pick<ChatThreadDemoMessage, "id" | "role" | "text" | "localFiles" | "model" | "modelId" | "provider" | "metrics" | "reasoning" | "feedback" | "stopped"> & {
  parentId?: string;
  resources?: ArtifactResource[];
  artifactIds?: string[];
};

function createWorkspaceMessages(locale: string, resources: readonly ArtifactResource[]): WorkspaceDemoMessage[] {
  const zh = locale.startsWith("zh");
  const reply = createChatThreadDemoData(locale).messages.find((message) => message.role === "assistant");
  return [
    { id: "request", role: "user", text: zh ? "为设置页增加浅色、深色和跟随系统选项，记住我的选择。同时补充说明文档和界面预览。" : "Add Light, Dark and System options to settings and remember my choice. Include a guide and a preview of the interface." },
    { ...reply, id: "result", parentId: "request", role: "assistant", artifactIds: resources.map((resource) => resource.id),
      text: zh ? "已补齐主题逻辑与使用说明，并附上设计稿和可交互页面。\n\n**2 项变更**可审阅；文档、图片和网页可以在同一面板中查看。" : "The theme logic and guide are ready, together with a design and an interactive page.\n\n**2 changes** are ready for review. Read the guide, inspect the design, and try the page in the same panel.",
      reasoning: zh ? "检查主题状态、持久化逻辑和系统偏好，并补齐使用说明与页面预览。" : "Check theme state, persistence and system preferences, then include a guide and a page preview." },
  ];
}

function ArtifactAddMenu({ resources, onOpen, locale }: { resources: readonly ArtifactResource[]; onOpen: (resource: ArtifactResource) => void; locale: string }) {
  const Plus = useIcon("plus");
  const Globe = useIcon("globe");
  return <DropdownMenu>
    <DropdownTrigger render={<Button iconOnly variant="tertiary" aria-label={locale === "zh-CN" ? "打开内容" : "Open content"}><Plus aria-hidden /></Button>} />
    <DropdownContent align="end">{resources.map((resource, index) => <MenuItem key={resource.id} index={index} label={resource.name}
      leading={resource.kind === "url" ? <Globe aria-hidden /> : <FileType fileName={resource.name} variant="mono" size="mini" aria-hidden />}
      onSelect={() => onOpen(resource)} />)}</DropdownContent>
  </DropdownMenu>;
}

function useDemoArtifacts(locale: string) {
  const [resources, setResources] = useState(() => createChatWorkspaceDemoResources(locale));
  const [openIds, setOpenIds] = useState(() => resources.map((resource) => resource.id));
  const [activeId, setActiveId] = useState("theme");
  const review = async (resource: ArtifactResource, decision: ArtifactReviewDecision) => {
    // A real host commits the file operation before resolving this callback.
    await new Promise((resolve) => setTimeout(resolve, 250));
    setResources((current) => current.map((item) => item.id === resource.id && item.version === resource.version && "review" in item ? { ...item, review: decision === "accept" ? "accepted" : "rejected" } : item));
  };
  const open = (resource: ArtifactResource) => {
    setOpenIds((current) => current.includes(resource.id) ? current : [...current, resource.id]);
    setActiveId(resource.id);
  };
  const openResources = useMemo(() => {
    const byId = new Map(resources.map((resource) => [resource.id, resource]));
    return openIds.flatMap((id) => { const resource = byId.get(id); return resource ? [resource] : []; });
  }, [resources, openIds]);
  const closeMany = (items: readonly ArtifactResource[]) => {
    const ids = new Set(items.map((resource) => resource.id));
    setOpenIds((current) => current.filter((id) => !ids.has(id)));
  };
  return { resources, openResources, activeId, setActiveId, review, open, closeMany };
}

export function ChatWorkspaceDemo() {
  const locale = useLocale();
  return <WorkspaceDemo key={locale} locale={locale} />;
}

function WorkspaceDemo({ locale }: { locale: string }) {
  const zh = locale === "zh-CN";
  const artifacts = useDemoArtifacts(locale);
  const pending = getPendingReviewResources(artifacts.resources);
  const firstPending = pending[0];
  const ArrowRight = useIcon("arrow-right");
  const workspace = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [sessionTitle, setSessionTitle] = useState("session title");
  const [files, setFiles] = useState<File[]>([]);
  const models = useMemo(() => createModelSelectorDemoModels(locale), [locale]);
  const [model, setModel] = useState(modelSelectorDemoValue);
  const [panelOpen, setPanelOpen] = useState(true);
  const [pane, setPane] = useState<"chat" | "artifacts">("chat");
  const [references, setReferences] = useState<ArtifactResource[]>([]);
  const [messages, setMessages] = useState(() => createWorkspaceMessages(locale, artifacts.resources));
  const [stream, setStream] = useState<{ id: string; text: string } | null>(null);
  const [thinking, setThinking] = useState(false);
  const timing = useRef<{ id: string; startedAt: number } | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!stream) return;
    setThinking(true);
    const startedAt = performance.now();
    timing.current = { id: stream.id, startedAt };
    let ttftMs: number | undefined;
    let interval: ReturnType<typeof setInterval> | undefined;
    const timer = setTimeout(() => {
      setThinking(false);
      let length = 0;
      interval = setInterval(() => {
        length = Math.min(length + 9, stream.text.length);
        const elapsed = performance.now() - startedAt;
        ttftMs ??= elapsed;
        setMessages((current) => current.map((message) => message.id === stream.id ? { ...message, text: stream.text.slice(0, length), metrics: { ...message.metrics, ttftMs, outputTokens: Math.ceil(length / 3), durationMs: elapsed } } : message));
        if (length === stream.text.length) { clearInterval(interval); setStream(null); }
      }, 32);
    }, 600);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [stream]);
  // Like ChatThreadDemo, Auto records the model that actually produced the reply.
  const responseModel = models.find((item) => item.id === (model.modelId === "auto" ? "sonnet-5.5" : model.modelId));
  const responseIdentity = { model: responseModel?.name, modelId: responseModel?.id, provider: responseModel ? "Anthropic" : undefined };
  const stop = () => {
    setMessages((current) => current.map((message) => message.id === stream?.id ? { ...message, stopped: true, metrics: { ...message.metrics, durationMs: timing.current?.id === message.id ? performance.now() - timing.current.startedAt : message.metrics?.durationMs } } : message));
    setThinking(false);
    setStream(null);
  };
  const retry = (message: WorkspaceDemoMessage) => {
    const user = messages.find((item) => item.id === message.parentId);
    if (!user || stream) return;
    setMessages((current) => current.map((item) => item.id === message.id ? { ...item, ...responseIdentity, text: "", stopped: false, feedback: null, metrics: { inputTokens: Math.ceil(current.slice(0, current.indexOf(item)).reduce((sum, entry) => sum + entry.text.length, 0) / 3) } } : item));
    setStream({ id: message.id, text: createChatThreadDemoReply(user.text, locale) });
  };
  const open = (resource: ArtifactResource) => { artifacts.open(resource); setPanelOpen(true); setPane("artifacts"); };
  const openFirstPending = () => {
    if (!firstPending) return;
    open(firstPending);
    requestAnimationFrame(() => {
      Array.from(workspace.current?.querySelectorAll<HTMLElement>("[data-artifact-id]") ?? []).find((tab) => tab.dataset.artifactId === firstPending.id)?.focus();
    });
  };
  const closeMany = (items: readonly ArtifactResource[]) => {
    artifacts.closeMany(items);
    if (items.length === artifacts.openResources.length) {
      setPanelOpen(false);
      setPane("chat");
      requestAnimationFrame(() => editor.current?.focus());
    }
  };
  const reference = (resource: ArtifactResource) => {
    setReferences((current) => current.some((item) => item.id === resource.id && item.version === resource.version) ? current : [...current, resource]);
    setPane("chat");
    requestAnimationFrame(() => editor.current?.focus());
  };
  return <div ref={workspace} className="h-full min-h-0 w-full">
    <ChatWorkspace title={sessionTitle} locale={locale} labels={zh ? chatThreadZhLabels : undefined}
      headerActions={<ChatWorkspaceSessionMenu title={sessionTitle} onTitleChange={setSessionTitle} messages={messages} locale={locale} />}
      panelOpen={panelOpen} onPanelOpenChange={setPanelOpen} activePane={pane} onActivePaneChange={setPane} busy={!!stream} composerRef={editor}
      artifacts={<ArtifactPanel locale={locale} resources={artifacts.openResources} activeId={artifacts.activeId} onActiveIdChange={artifacts.setActiveId} onCloseMany={closeMany} onReview={artifacts.review} onReference={reference}
        addAction={<ArtifactAddMenu resources={artifacts.resources} onOpen={open} locale={locale} />} />}
      composer={<>
        {references.length > 0 && <div className="mb-2 flex flex-wrap items-center gap-1" aria-label={zh ? "草稿引用" : "Draft references"}>{references.map((resource) => <Button key={`${resource.id}:${resource.version}`} size="xs" variant="secondary" aria-label={`${zh ? "移除引用" : "Remove reference"}: ${resource.name}`} onClick={() => setReferences((current) => current.filter((item) => item !== resource))}>{resource.name} ×</Button>)}</div>}
        <InputMessage layout="compact" value={draft} onValueChange={setDraft} textareaRef={editor} status={stream ? "streaming" : "idle"}
          files={files} onFilesChange={setFiles} accept="image/*,application/pdf,application/json,.txt" minRows={1} maxRows={6}
          history={messages.filter((message) => message.role === "user").map((message) => message.text)}
          leftSlot={({ openFilePicker }) => <ChatDemoModelControls models={models} value={model} onValueChange={setModel} locale={locale} onAttach={() => openFilePicker()} />}
          rightSlot={<ChatDemoContextControl locale={locale} />}
          header={firstPending && <>
            <span role="status" className="flex min-h-control-md min-w-0 flex-1 items-center text-body text-fg-muted">{zh ? `还有 ${pending.length} 项待审阅确认的内容` : `${pending.length} ${pending.length === 1 ? "item needs" : "items need"} review confirmation`}</span>
            <Button type="button" variant="ghost" iconOnly aria-label={zh ? `查看第一项待审阅内容：${firstPending.name}` : `Review first pending item: ${firstPending.name}`} onClick={openFirstPending}><ArrowRight aria-hidden /></Button>
          </>}
          placeholder={zh ? "针对这些内容继续提问…" : "Ask about these changes…"} sendLabel={zh ? "发送" : "Send"}
          onStop={stop}
          onSend={(text, attached) => {
            const id = crypto.randomUUID();
            setMessages((current) => [...current.map((message) => message.id === stream?.id ? { ...message, stopped: true } : message),
              { id: `user-${id}`, role: "user", text, resources: references, localFiles: attached },
              { id, parentId: `user-${id}`, role: "assistant", text: "", ...responseIdentity, metrics: { inputTokens: Math.ceil((current.reduce((sum, message) => sum + message.text.length, 0) + text.length) / 3) } }]);
            setReferences([]); setDraft(""); setFiles([]);
            setStream({ id, text: createChatThreadDemoReply(text, locale) });
          }} disclaimer={zh ? "本地演示 · 回复和审阅为模拟数据" : "Local demo · Replies and review actions are simulated"} />
      </>}>
      <ChatDivider>{zh ? "今天" : "Today"}</ChatDivider>
      {messages.map((message, index) => message.role === "user" ? <ChatUserMessage key={message.id} id={message.id} text={message.text} pin={index === messages.length - 2} time={new Date("2026-10-20T01:38:00Z")}
        attachments={message.localFiles?.length || message.resources?.length ? <>{!!message.localFiles?.length && <ChatMessageAttachments files={message.localFiles} label={zh ? "附件" : "Attachments"} />}{!!message.resources?.length && <ArtifactCard locale={locale} resources={message.resources} onOpen={open} />}</> : undefined} /> :
        <ChatAssistantMessage key={message.id} id={message.id} text={message.text} streaming={stream?.id === message.id} last={index === messages.length - 1}
          model={message.model} modelLogo={models.find((item) => item.id === message.modelId)?.icon} provider={message.provider} metrics={message.metrics} stopped={message.stopped}
          feedback={message.feedback} onFeedback={(feedback) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, feedback } : item))} onRetry={() => retry(message)}>
          <ChatDemoResponseContent locale={locale} text={message.text} streaming={stream?.id === message.id} thinking={stream?.id === message.id && thinking}
            reasoning={message.reasoning ? { description: message.reasoning, label: zh ? "检查主题与预览" : "Checked theme and previews", summary: zh ? "读取两个文件" : "Read two files", files: ["src/lib/theme.ts", "docs/README.md"] } : undefined}>
            {message.artifactIds && <div className="mt-4"><ArtifactCard locale={locale} title={zh ? "本次产出 · 5 项内容" : "Created in this turn · 5 items"} resources={artifacts.resources.filter((resource) => message.artifactIds?.includes(resource.id))} onOpen={open} /></div>}
          </ChatDemoResponseContent>
        </ChatAssistantMessage>)}
    </ChatWorkspace>
  </div>;
}

export function ArtifactPanelDemo() {
  const locale = useLocale();
  return <StandalonePanelDemo key={locale} locale={locale} />;
}

function StandalonePanelDemo({ locale }: { locale: string }) {
  const artifacts = useDemoArtifacts(locale);
  return <div className="h-[560px] min-w-0 overflow-hidden rounded-xl border-hairline border-border">
    <ArtifactPanel locale={locale} resources={artifacts.openResources} activeId={artifacts.activeId} onActiveIdChange={artifacts.setActiveId} onReview={artifacts.review} onCloseMany={artifacts.closeMany}
      addAction={<ArtifactAddMenu resources={artifacts.resources} onOpen={artifacts.open} locale={locale} />} />
  </div>;
}
