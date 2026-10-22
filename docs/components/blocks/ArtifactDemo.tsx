"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type { ArtifactDocument } from "@zeron/ui/artifact-preview-panel";
import { ArtifactWorkspace, GeneratedArtifactCard, createArtifactDemoDocuments, createPricingArtifactHtml } from "@zeron/blocks/artifact-01";
import { ChatAssistantMessage, ChatUserMessage, chatThreadZhLabels } from "@zeron/ui/chat-thread";
import { createModelSelectorDemoModels, modelSelectorDemoValue } from "@zeron/blocks/model-selector-01";
import { Button } from "@zeron/ui/button";
import { ChatMessageAttachments } from "@zeron/ui/chat-message";
import { InputMessage } from "@zeron/ui/input-message";
import { useIcon } from "@zeron/ui/system/icon-context";
import { ChatDemoContextControl, ChatDemoModelControls, ChatDemoResponseContent } from "./ChatDemoParts";

interface DemoMessage { id: string; role: "user" | "assistant"; text: string; artifactId?: string; revisionId?: string; files?: File[] }
interface DemoJob { artifactId: string; revisionId: string; content: string; messageId: string; reply: string }

function initialMessages(zh: boolean): DemoMessage[] {
  return [
    { id: "request", role: "user", text: zh ? "帮我搭建一个包含三种方案的定价页面。" : "Build a pricing page with three plans" },
    { id: "reply", role: "assistant", text: zh ? "定价页面已生成，中间的团队方案作为推荐选项突出展示。\n\n可以切换代码与预览，也可以继续修改，并随时对比和恢复历史版本。" : "Here’s a clean pricing page with three plans. The middle plan is highlighted as the default choice.\n\nAsk for changes to create a new version. You can compare revisions or return to an earlier one.", artifactId: "pricing", revisionId: "pricing-v1" },
  ];
}

export function ArtifactDemo() {
  const locale = useLocale();
  return <ArtifactDemoContent key={locale} locale={locale} />;
}

function ArtifactDemoContent({ locale }: { locale: string }) {
  const zh = locale.startsWith("zh");
  const [documents, setDocuments] = useState(() => createArtifactDemoDocuments(locale).filter((document) => document.id === "pricing"));
  const [messages, setMessages] = useState(() => initialMessages(zh));
  const [activeId, setActiveId] = useState("pricing");
  const [revisionId, setRevisionId] = useState("pricing-v1");
  const [panelOpen, setPanelOpen] = useState(true);
  const [pane, setPane] = useState<"chat" | "artifacts">("chat");
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [job, setJob] = useState<DemoJob | null>(null);
  const lock = useRef(false);
  const jobs = useRef(new Map<string, DemoJob>());
  const editor = useRef<HTMLTextAreaElement>(null);
  const models = useMemo(() => createModelSelectorDemoModels(locale), [locale]);
  const [model, setModel] = useState(modelSelectorDemoValue);
  const Replay = useIcon("rotate-ccw");
  const active = documents.find((document) => document.id === activeId) ?? null;
  const pricing = documents.find((document) => document.id === "pricing")!;
  const hasYearly = pricing.revisions.at(-1)?.content.includes("function billing(") ?? false;
  const hasSavings = pricing.revisions.at(-1)?.content.includes("Save 17% yearly") ?? false;

  useEffect(() => {
    if (!job) return;
    let length = 0;
    const timer = setInterval(() => {
      length = Math.min(length + 140, job.content.length);
      setDocuments((current) => current.map((document) => document.id === job.artifactId ? { ...document, revisions: document.revisions.map((revision) => revision.id === job.revisionId ? { ...revision, content: job.content.slice(0, length), status: length === job.content.length ? "ready" : "streaming" } : revision) } : document));
      if (length === job.content.length) {
        clearInterval(timer);
        setMessages((current) => current.map((message) => message.id === job.messageId ? { ...message, text: job.reply } : message));
        lock.current = false; setJob(null);
      }
    }, 32);
    return () => clearInterval(timer);
  }, [job]);

  const open = (document: ArtifactDocument, version: string) => {
    setActiveId(document.id); setRevisionId(version); setPanelOpen(true); setPane("artifacts");
  };
  const start = (prompt: string, attached: File[] = []) => {
    if (lock.current || !prompt.trim() && !attached.length) return;
    prompt = prompt.trim() || (zh ? "生成一个定价页示例。" : "Generate a pricing page example.");
    lock.current = true;
    const kind = /launch|plan|发布|计划/i.test(prompt) ? "launch" : /debounce|hook|防抖/i.test(prompt) ? "debounce" : "pricing";
    const document = documents.find((item) => item.id === kind) ?? { ...createArtifactDemoDocuments(locale).find((item) => item.id === kind)!, revisions: [] };
    const revisionId = crypto.randomUUID();
    const messageId = crypto.randomUUID();
    const content = kind === "pricing" ? createPricingArtifactHtml(true, hasYearly || /savings|badge|优惠|徽标/i.test(prompt)) : createArtifactDemoDocuments(locale).find((item) => item.id === kind)!.revisions[0].content;
    const reply = kind === "pricing" ? zh ? "已为定价页加入月付与年付切换，年付可节省两个月费用。可以在预览中试用，或查看代码变更。" : "The pricing page now includes monthly and yearly billing. Yearly pricing includes two months free. Try it in the preview or compare the code changes."
      : kind === "launch" ? zh ? "发布计划已整理好，包含目标、时间安排和发布前检查清单。" : "Your launch plan includes goals, a timeline and a release checklist."
        : zh ? "这是一个支持泛型的 debounce hook，输入更新或组件卸载时会清理定时器。" : "Here’s a typed debounce hook that cleans up its timer when the input changes or the component unmounts.";
    const nextJob = { artifactId: kind, revisionId, content, messageId, reply };
    jobs.current.set(revisionId, nextJob);
    setDocuments((current) => [...current.filter((item) => item.id !== kind), { ...document, revisions: [...document.revisions, { id: revisionId, content: "", status: "streaming" }] }]);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: prompt, files: attached }, { id: messageId, role: "assistant", text: zh ? "正在生成内容…" : "Writing your artifact…", artifactId: kind, revisionId }]);
    setDraft(""); setFiles([]); open(document, revisionId); setJob(nextJob);
  };
  const stop = () => {
    if (!job) return;
    setDocuments((current) => current.map((document) => document.id === job.artifactId ? { ...document, revisions: document.revisions.map((revision) => revision.id === job.revisionId ? { ...revision, status: "error", error: zh ? "生成已停止，点击重试以重新生成。" : "Generation stopped. Retry to generate this version again." } : revision) } : document));
    setMessages((current) => current.map((message) => message.id === job.messageId ? { ...message, text: zh ? "已停止生成。可从预览面板重试。" : "Generation stopped. Retry from the preview panel." } : message));
    lock.current = false; setJob(null);
  };
  const replay = () => {
    lock.current = false; setJob(null); jobs.current.clear();
    setDocuments(createArtifactDemoDocuments(locale).filter((document) => document.id === "pricing")); setMessages(initialMessages(zh));
    setActiveId("pricing"); setRevisionId("pricing-v1"); setPanelOpen(true); setPane("chat"); setDraft(""); setFiles([]);
  };
  const suggestions = [
    zh ? hasYearly ? hasSavings ? "查看定价页" : "增加年付优惠徽标" : "增加月付和年付切换" : hasYearly ? hasSavings ? "Open pricing page" : "Add a savings badge" : "Add a yearly toggle",
    zh ? "写一份发布计划" : "Write a launch plan",
    zh ? "写一个 debounce hook" : "Write a debounce hook",
  ];
  return <ArtifactWorkspace title={zh ? "Artifact · 内容创作" : "Artifact · Create together"} locale={locale} labels={zh ? chatThreadZhLabels : undefined}
    artifact={active} chatDefaultSize="34%" panelOpen={panelOpen} onPanelOpenChange={setPanelOpen} activePane={pane} onActivePaneChange={setPane} busy={!!job} composerRef={editor}
    previewProps={{ revisionId, onRevisionChange: setRevisionId,
      onClose: () => { setPanelOpen(false); setPane("chat"); requestAnimationFrame(() => editor.current?.focus()); },
      onRetry: (_, revision) => {
        const retry = jobs.current.get(revision.id);
        if (!retry || lock.current) return;
        lock.current = true;
        setDocuments((current) => current.map((document) => document.id === retry.artifactId ? { ...document, revisions: document.revisions.map((item) => item.id === revision.id ? { ...item, content: "", status: "streaming", error: undefined } : item) } : document));
        setJob(retry);
      },
      onRestore: (document, revision) => {
        if (lock.current) throw new Error("Generation in progress");
        const id = crypto.randomUUID();
        setDocuments((current) => current.map((item) => item.id === document.id ? { ...item, revisions: [...item.revisions, { ...revision, id, label: undefined }] } : item));
        setRevisionId(id);
        setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", text: zh ? "已将所选版本恢复为新修订，原有历史仍可查看。" : "Restored the selected version as a new revision. Your history is still available.", artifactId: document.id, revisionId: id }]);
      },
    }}
    composer={<>
      <div className="mb-3 flex flex-wrap gap-2">{suggestions.map((suggestion, index) => <Button key={suggestion} size="sm" variant="tertiary" disabled={!!job} onClick={() => index === 0 && hasSavings ? open(pricing, pricing.revisions.at(-1)!.id) : start(suggestion)}>{suggestion}</Button>)}</div>
      <InputMessage layout="compact" value={draft} onValueChange={setDraft} textareaRef={editor} files={files} onFilesChange={setFiles} minRows={1} maxRows={5} status={job ? "streaming" : "idle"} onStop={stop}
        placeholder={zh ? "描述想生成的内容，或提出修改…" : "Ask for an artifact or a change…"} sendLabel={zh ? "发送" : "Send"} onSend={start}
        leftSlot={({ openFilePicker }) => <ChatDemoModelControls models={models} value={model} onValueChange={setModel} locale={locale} onAttach={() => openFilePicker()} />} rightSlot={<ChatDemoContextControl locale={locale} />}
        disclaimer={zh ? "本地演示 · 按预设生成定价页、发布计划与 Hook" : "Local demo · Pricing, launch plan and hook use preset content"} />
    </>}>
    <div className="mb-4 flex justify-end"><Button size="sm" variant="ghost" leadingIcon={Replay} onClick={replay}>{zh ? "重新演示" : "Replay"}</Button></div>
    {messages.map((message, index) => message.role === "user" ? <ChatUserMessage key={message.id} id={message.id} text={message.text} pin={index === messages.length - 2} attachments={message.files?.length ? <ChatMessageAttachments files={message.files} label={zh ? "附件" : "Attachments"} /> : undefined} /> :
      <ChatAssistantMessage key={message.id} id={message.id} text={message.text} last={index === messages.length - 1} streaming={job?.messageId === message.id}>
        <ChatDemoResponseContent locale={locale} text={message.text} streaming={job?.messageId === message.id}>
          {message.artifactId && <div className="mt-4"><GeneratedArtifactCard artifact={documents.find((document) => document.id === message.artifactId)!} revisionId={message.revisionId} locale={locale} onOpen={open} /></div>}
        </ChatDemoResponseContent>
      </ChatAssistantMessage>)}
  </ArtifactWorkspace>;
}
