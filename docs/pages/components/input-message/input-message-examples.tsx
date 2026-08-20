"use client";

import { useEffect, useRef, useState } from "react";
import { InputMessage } from "@zeron/ui/input-message";
import { ChatMessage } from "@zeron/ui/chat-message";
import { Button } from "@zeron/ui/button";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { useIcon } from "@zeron/icons/context";
import { ClaudeCode } from "@lobehub/icons";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { DocSection } from "@docs/components/content/DocPage";
import { QueuedChatDemo } from "./queued-chat-demo";

const basicCode = `import { useState } from "react";
import { InputMessage } from "./components";

const [value, setValue] = useState("");

<InputMessage
  value={value}
  onValueChange={setValue}
  onSend={(text) => console.log("send:", text)}
/>`;

const attachmentsCode = `import { useEffect, useRef, useState } from "react";
import { InputMessage, ChatMessage } from "./components";

type Msg = { from: "user" | "assistant"; text: string; files?: File[] };

const [value, setValue] = useState("");
const [files, setFiles] = useState<File[]>([]);
const [messages, setMessages] = useState<Msg[]>([]);

// Pre-fill the composer with a real image + PDF. Images use object-cover;
// PDFs render their first page via pdfjs. Both show the × remove button.
useEffect(() => {
  Promise.all([
    fetch("/sample-avatar.png")
      .then((r) => r.blob())
      .then((b) => new File([b], "sample-avatar.png", { type: "image/png" })),
    fetch("/Receipt-2581-4039-8265.pdf")
      .then((r) => r.blob())
      .then((b) => new File([b], "Receipt-2581-4039-8265.pdf", { type: "application/pdf" })),
  ]).then(setFiles);
}, []);

// Float the composer over the history: measure its height to reserve scroll
// padding, and keep the transcript pinned to the bottom as it grows.
const inputRef = useRef<HTMLDivElement>(null);
const [inputH, setInputH] = useState(0);
useEffect(() => {
  const el = inputRef.current;
  if (!el) return;
  const ro = new ResizeObserver(() => setInputH(el.offsetHeight));
  ro.observe(el);
  setInputH(el.offsetHeight);
  return () => ro.disconnect();
}, []);

const scrollRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const el = scrollRef.current;
  if (el) el.scrollTop = el.scrollHeight;
}, [messages, inputH]);

<div className="relative w-full h-[440px]">
  <div ref={scrollRef} className="absolute inset-0 overflow-y-auto scrollbar-hide">
    <div
      className="flex min-h-full flex-col justify-start gap-2"
      style={{ paddingBottom: inputH + 12 }}
    >
      {messages.map((m, i) => (
        <ChatMessage key={i} from={m.from} files={m.files}>
          {m.text}
        </ChatMessage>
      ))}
    </div>
  </div>
  <InputMessage
    ref={inputRef}
    className="absolute inset-x-0 bottom-0"
    value={value}
    onValueChange={setValue}
    files={files}
    onFilesChange={setFiles}
    // Send pushes the message along with its attachments into the transcript.
    onSend={(text, attachments) => {
      if (!text && attachments.length === 0) return;
      setMessages((prev) => [
        ...prev,
        { from: "user", text, files: attachments },
      ]);
      setValue("");
      setFiles([]);
    }}
  />
</div>`;

const actionsCode = `import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { InputMessage, ChatMessage, Button, Dropdown, MenuItem, Tooltip } from "./components";
import { useIcon } from "@zeron/icons/context";

const MODELS = ["Sonnet 5", "Sonnet 4.6", "Sonnet 4.5", "Haiku 4"] as const;

const [value, setValue] = useState("");
const [messages, setMessages] = useState<{ text: string; files: File[] }[]>([]);
const [files, setFiles] = useState<File[]>([]);
const [modelOpen, setModelOpen] = useState(false);
const [attachOpen, setAttachOpen] = useState(false);
const [model, setModel] = useState<typeof MODELS[number]>("Sonnet 5");

const modelRef = useRef<HTMLDivElement>(null);
const attachRef = useRef<HTMLDivElement>(null);
const scrollRef = useRef<HTMLDivElement>(null);
const inputRef = useRef<HTMLDivElement>(null);
const [inputH, setInputH] = useState(0);

useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (modelRef.current && !modelRef.current.contains(e.target as Node))
      setModelOpen(false);
    if (attachRef.current && !attachRef.current.contains(e.target as Node))
      setAttachOpen(false);
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, []);

// Measure the floating composer so we can reserve scroll padding under it.
useEffect(() => {
  const el = inputRef.current;
  if (!el) return;
  const ro = new ResizeObserver(() => setInputH(el.offsetHeight));
  ro.observe(el);
  setInputH(el.offsetHeight);
  return () => ro.disconnect();
}, []);

// Keep the history pinned to the latest message as it grows.
useEffect(() => {
  const el = scrollRef.current;
  if (el) el.scrollTop = el.scrollHeight;
}, [messages, inputH]);

const PlusIcon = useIcon("plus");
const ChevronDownIcon = useIcon("chevron-down");
const ImageIcon = useIcon("image");
const FileTextIcon = useIcon("square-library");

<div className="relative w-full h-[440px]">
  <div ref={scrollRef} className="absolute inset-0 overflow-y-auto scrollbar-hide">
    <div
      className="flex min-h-full flex-col justify-start gap-2"
      style={{ paddingBottom: inputH + 12 }}
    >
      {messages.map((m, i) => (
        <ChatMessage key={i} from="user" files={m.files}>
          {m.text}
        </ChatMessage>
      ))}
    </div>
  </div>
  <InputMessage
    ref={inputRef}
    className="absolute inset-x-0 bottom-0"
    value={value}
    onValueChange={setValue}
    files={files}
    onFilesChange={setFiles}
    onSend={(text, attachments) => {
      setMessages((prev) => [...prev, { text, files: attachments }]);
      setValue("");
      setFiles([]);
    }}
    // Drag-and-drop works on the whole container. Click + to choose a type.
    leftSlot={({ openFilePicker }) => (
    <div ref={attachRef} className="relative">
      <Tooltip content="Add" side="top">
        <Button
          variant="ghost"
          iconOnly
          size="sm"
          aria-label="Attach files"
          active={attachOpen}
          onClick={() => setAttachOpen((o) => !o)}
        >
          <PlusIcon />
        </Button>
      </Tooltip>
      <AnimatePresence>
        {attachOpen && (
          <motion.div
            className="absolute bottom-full mb-2 left-0 z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
            transition={spring.fast}
          >
            <Dropdown>
              <MenuItem
                index={0}
                label="Image"
                icon={ImageIcon}
                onSelect={() => {
                  setAttachOpen(false);
                  openFilePicker("image/png,image/jpeg");
                }}
              />
              <MenuItem
                index={1}
                label="PDF"
                icon={FileTextIcon}
                onSelect={() => {
                  setAttachOpen(false);
                  openFilePicker("application/pdf");
                }}
              />
            </Dropdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )}
  rightSlot={
    <div ref={modelRef} className="relative">
      <Tooltip content="Select model" side="top">
        <Button
          variant="ghost"
          size="sm"
          trailingIcon={ChevronDownIcon}
          active={modelOpen}
          onClick={() => setModelOpen((o) => !o)}
        >
          {model}
        </Button>
      </Tooltip>
      <AnimatePresence>
        {modelOpen && (
          <motion.div
            className="absolute bottom-full mb-2 right-0 z-10"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }}
            transition={spring.fast}
          >
            <Dropdown checkedIndex={MODELS.indexOf(model)}>
              {MODELS.map((name, i) => (
                <MenuItem
                  key={name}
                  index={i}
                  label={name}
                  checked={name === model}
                  onSelect={() => {
                    setModel(name);
                    setModelOpen(false);
                  }}
                />
              ))}
            </Dropdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  }
  />
</div>`;

const leftOnlyCode = `import { useState } from "react";
import { InputMessage } from "./components";
import { Button } from "./components";
import { useIcon } from "@zeron/icons/context";

const [value, setValue] = useState("");
const PlusIcon = useIcon("plus");

<InputMessage
  value={value}
  onValueChange={setValue}
  leftSlot={
    <Button iconOnly variant="ghost" size="sm" aria-label="Attach">
      <PlusIcon />
    </Button>
  }
/>`;

const rightOnlyCode = `import { useState } from "react";
import { InputMessage } from "./components";
import { Button } from "./components";
import { useIcon } from "@zeron/icons/context";

const [value, setValue] = useState("");
const ChevronDownIcon = useIcon("chevron-down");

<InputMessage
  value={value}
  onValueChange={setValue}
  rightSlot={
    <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>
      Sonnet 4.6
    </Button>
  }
/>`;

const sendHandlerCode = `import { useState } from "react";
import { InputMessage, ChatMessage } from "./components";

const [value, setValue] = useState("");
const [messages, setMessages] = useState<string[]>([]);

<div className="flex flex-col gap-3">
  {messages.length > 0 && (
    <div className="flex flex-col gap-2">
      {messages.map((m, i) => (
        <ChatMessage key={i} from="user">
          {m}
        </ChatMessage>
      ))}
    </div>
  )}
  <InputMessage
    value={value}
    onValueChange={setValue}
    onSend={(text) => {
      if (text) setMessages((prev) => [...prev, text]);
      setValue("");
    }}
  />
</div>`;

const queuedCode = `import { useEffect, useRef, useState } from "react";
import {
  InputMessage, ChatMessage, ThinkingIndicator, FileThumbnail, type QueuedMessage,
} from "./components";

type Turn = { from: "user" | "assistant"; text: string; thinking?: boolean };

const [value, setValue] = useState("");
const [queue, setQueue] = useState<QueuedMessage[]>([]);
const [status, setStatus] = useState<"idle" | "streaming">("idle");
const [chat, setChat] = useState<Turn[]>([]);
const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

// Stand-in for a real assistant: append the user turn plus an assistant
// placeholder in its "thinking" state, hold there for a beat, then stream the
// reply in word-by-word. The final streaming→idle edge releases the next
// queued message.
const respond = (text: string) => {
  const reply = \`Replying to "\${text}". A fuller answer that streams in…\`;
  setChat((c) => [...c, { from: "user", text }, { from: "assistant", text: "", thinking: true }]);
  setStatus("streaming");

  const words = reply.split(" ");
  timers.current.push(setTimeout(() => {
    words.forEach((_, i) => {
      timers.current.push(setTimeout(() => {
        setChat((c) => c.map((m, k) =>
          k === c.length - 1
            ? { from: "assistant", text: words.slice(0, i + 1).join(" ") }
            : m
        ));
        if (i === words.length - 1) setStatus("idle");
      }, i * 150));
    });
  }, 4000)); // think before streaming
};

useEffect(() => () => timers.current.forEach(clearTimeout), []);

<>
  {chat.map((m, i) =>
    m.thinking ? (
      <ChatMessage key={i} from="assistant">
        <ThinkingIndicator showIcon={false} className="px-0 py-0" />
      </ChatMessage>
    ) : (
      <ChatMessage key={i} from={m.from}>{m.text}</ChatMessage>
    )
  )}

  {/* Render the queue yourself as a Sonner-style stack overlaying just above
      the composer: a fixed-height pile that fans out on hover. Front card
      (queue[0]) is next to dispatch. Double-click edits, × removes. */}
  {queue.length > 0 && (
    <div
      className="absolute inset-x-0 z-10"
      style={{ bottom: inputHeight + 8, height: hovered ? expandedH : collapsedH }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {queue.map((item, i) => {
        const peek = Math.min(i, 2);
        const t = hovered
          ? { y: -i * (CARD_H + 8), scale: 1, opacity: 1 }
          : { y: -peek * 12, scale: 1 - peek * 0.05, opacity: i <= 2 ? 1 : 0 };
        return (
          <motion.div
            key={item.id}
            animate={t}
            transition={{ type: "spring", duration: 0.16 }}
            style={{ height: CARD_H, transformOrigin: "bottom center", zIndex: 100 - i }}
            onDoubleClick={() => { setValue(item.text); setQueue((q) => q.filter((x) => x.id !== item.id)); }}
            className="absolute bottom-0 left-7 right-7 flex items-center gap-2 rounded-full bg-emphasis px-3.5 text-body text-fg-muted shadow-floating"
          >
            {/* Attachments: small thumbnails (1 or many; +N past 3). */}
            {item.files.length > 0 && (
              <div className="flex shrink-0 items-center gap-1">
                {item.files.slice(0, 3).map((f, fi) => (
                  <FileThumbnail key={fi} file={f} size={28} className="rounded-lg" />
                ))}
                {item.files.length > 3 && <span>+{item.files.length - 3}</span>}
              </div>
            )}
            <span className="min-w-0 flex-1 truncate">{item.text}</span>
            <button onClick={() => { setValue(item.text); setQueue((q) => q.filter((x) => x.id !== item.id)); }} aria-label="Edit queued message">✎</button>
            <button onClick={() => setQueue((q) => q.filter((x) => x.id !== item.id))} aria-label="Remove queued message">
              ✕
            </button>
          </motion.div>
        );
      })}
    </div>
  )}

  <InputMessage
    value={value}
    onValueChange={setValue}
    status={status}
    queue={queue}
    onQueueChange={setQueue}
    showQueue={false} // render the queue yourself (full-width rows above) instead
    // Sent user turns, oldest first — ArrowUp/ArrowDown recall them.
    history={chat.filter((m) => m.from === "user").map((m) => m.text)}
    // While idle this sends; the component also calls onSend itself to
    // auto-dispatch the head of the queue on each streaming→idle edge.
    onSend={(text) => { if (text) respond(text); setValue(""); }}
    // Stop ends the current response; returning to idle immediately releases
    // the next queued message.
    onStop={() => { timers.current.forEach(clearTimeout); setStatus("idle"); }}
    placeholder="Send while I'm responding to queue a message…"
  />
</>

// Queue interactions: double-click (or Enter/F2) a row to edit it back into
// the composer, × (or Delete) to remove, drag or Alt+↑/↓ to reorder.`;

const disabledCode = `import { InputMessage } from "./components";

<InputMessage
  value="This composer is disabled"
  onValueChange={() => {}}
  disabled
/>`;

const agentComposerCode = `import { useState } from "react";
import { ClaudeCode } from "@lobehub/icons";
import {
  Button,
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
  InputMessage,
  MenuItem,
} from "./components";

const [draft, setDraft] = useState("");

<div className="w-full max-w-[768px]">
  <InputMessage
    value={draft}
    onValueChange={setDraft}
    placeholder="可以向 Zeron 询问任何事情。输入 @ 使用连接应用或者提及文件。输入 / 可以指定技能"
    leftSlot={<AgentActions />}
    rightSlot={<Button variant="ghost" iconOnly size="sm"><MicIcon /></Button>}
    footer={<AgentContextControls />}
    disclaimer="内容由 AI 生成，请核实重要信息"
  />
</div>`;

const agentModels = ["自动选择", "Claude Sonnet 4.6", "Claude Haiku 4.5"];
const agentWorkspaces = ["选择工作目录", "~/Projects/zeron", "~/Projects/atlas"];
const agentPermissions = ["默认权限", "仅限工作目录", "完全访问"];

function AgentComposerDemo() {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [model, setModel] = useState(0);
  const [workspace, setWorkspace] = useState(0);
  const [permission, setPermission] = useState(0);
  const [recording, setRecording] = useState(false);
  const ImageIcon = useIcon("image");
  const MicIcon = useIcon("mic");
  const FolderIcon = useIcon("folder");
  const ShieldIcon = useIcon("shield");
  const ChevronDownIcon = useIcon("chevron-down");
  const contextControls = (
    <>
      <DropdownMenu>
        <DropdownTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leadingIcon={FolderIcon}
              trailingIcon={ChevronDownIcon}
              className="rounded-lg text-fg-subtle"
            >
              {agentWorkspaces[workspace]}
            </Button>
          }
        />
        <DropdownContent checkedIndex={workspace}>
          {agentWorkspaces.map((item, index) => (
            <MenuItem
              key={item}
              index={index}
              label={item}
              checked={workspace === index}
              onSelect={() => setWorkspace(index)}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leadingIcon={ShieldIcon}
              trailingIcon={ChevronDownIcon}
              className="rounded-lg text-fg-subtle"
            >
              {agentPermissions[permission]}
            </Button>
          }
        />
        <DropdownContent checkedIndex={permission}>
          {agentPermissions.map((item, index) => (
            <MenuItem
              key={item}
              index={index}
              label={item}
              checked={permission === index}
              onSelect={() => setPermission(index)}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
    </>
  );

  return (
    <div className="w-full max-w-[768px]">
      <InputMessage
        composerClassName="shadow-[0_3px_8px_rgb(37_40_46_/_0.1)]"
        value={value}
        onValueChange={setValue}
        onSend={() => {
          setValue("");
          setFiles([]);
        }}
        files={files}
        onFilesChange={setFiles}
        placeholder="可以向 Zeron 询问任何事情。输入 @ 使用连接应用或者提及文件。输入 / 可以指定技能"
        leftSlot={({ openFilePicker }) => (
          <>
            <Button
              type="button"
              variant="ghost"
              iconOnly
              size="sm"
              className="rounded-xl bg-hover"
              onClick={() => openFilePicker("image/*")}
              aria-label="添加图片"
            >
              <ImageIcon />
            </Button>
            <DropdownMenu>
              <DropdownTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl bg-[rgba(217,119,87,0.12)] text-fg-default"
                    trailingIcon={ChevronDownIcon}
                  >
                    <ClaudeCode size={16} />
                    {agentModels[model]}
                  </Button>
                }
              />
              <DropdownContent checkedIndex={model}>
                {agentModels.map((item, index) => (
                  <MenuItem
                    key={item}
                    index={index}
                    label={item}
                    checked={model === index}
                    onSelect={() => setModel(index)}
                  />
                ))}
              </DropdownContent>
            </DropdownMenu>
          </>
        )}
        rightSlot={
          <Button
            type="button"
            variant="ghost"
            iconOnly
            size="sm"
            className="rounded-lg"
            active={recording}
            onClick={() => setRecording((current) => !current)}
            aria-label={recording ? "停止语音输入" : "开始语音输入"}
            aria-pressed={recording}
          >
            <MicIcon />
          </Button>
        }
        footer={contextControls}
        disclaimer="内容由 AI 生成，请核实重要信息"
      />
    </div>
  );
}

const inputMessageProps: PropDef[] = [
  { name: "value", type: "string", description: "Controlled textarea value." },
  { name: "onValueChange", type: "(value: string) => void", description: "Called with the new value on every textarea change." },
  { name: "onSend", type: "(value: string, files: File[]) => void", description: "Fires on Enter (without Shift) or send-button click. Receives the trimmed value and the currently-attached files. Skipped when the value is empty and no files are attached." },
  { name: "placeholder", type: "string", default: '"Ask me anything…"', description: "Placeholder shown when the value is empty. While a file is being dragged over the component (and attachments are enabled), the placeholder swaps to “Drop files here to add to chat”." },
  { name: "leftSlot", type: "ReactNode | (ctx) => ReactNode", description: "Content rendered in the bottom-left action area. May be a render-fn that receives `{ openFilePicker, files }` — `openFilePicker(acceptOverride?)` opens the native file picker (optionally scoped to a subset of accept types, e.g. `\"image/*\"`)." },
  { name: "rightSlot", type: "ReactNode | (ctx) => ReactNode", description: "Content rendered in the bottom-right action area, before the built-in send button. Same render-fn shape as `leftSlot`." },
  { name: "footer", type: "ReactNode", description: "Session-level controls rendered below the editor card, such as workspace and permission selectors." },
  { name: "disclaimer", type: "ReactNode", description: "Optional content rendered beneath the composer shell, typically an AI-output disclaimer." },
  { name: "composerClassName", type: "string", description: "Extra classes for the floating editor card inside the agent-composer shell." },
  { name: "footerClassName", type: "string", description: "Extra classes for the footer that contains `footer`." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables the textarea, send button, and drag-and-drop." },
  { name: "minRows", type: "number", default: "1", description: "Minimum visible rows before the textarea grows." },
  { name: "maxRows", type: "number", default: "8", description: "Maximum visible rows before the textarea starts to scroll." },
  { name: "clickToFocus", type: "boolean", default: "true", description: "When true, clicking anywhere on the surrounding container (outside of buttons / links / inputs) focuses the textarea." },
  { name: "sendLabel", type: "string", default: '"Send"', description: "Accessible label for the send button." },
  { name: "sendVariant", type: '"primary" | "neutral"', default: '"neutral"', description: "Visual treatment for the built-in send button. The agent-composer default is neutral; use primary for a branded send action." },
  { name: "layout", type: '"compact" | "expanded"', default: '"expanded"', description: "Expanded layout is the agent-composer default: it gives the textarea the available card height and pins actions to the bottom. Use compact for a content-sized editor." },
  { name: "files", type: "File[]", description: "Controlled list of attached files. Pair with `onFilesChange` to enable drag-and-drop and the file-picker slot helper. When omitted, attachment behavior is disabled." },
  { name: "onFilesChange", type: "(files: File[]) => void", description: "Called when files are added (drag-drop or picker) or removed via the preview tile’s × button. Duplicate drops of the same file (same name + size + lastModified) are silently de-duplicated." },
  { name: "accept", type: "string", default: '"image/png,image/jpeg,application/pdf"', description: "Accepted MIME types as a comma-separated string. Used by both the file picker and the drag-and-drop filter." },
  { name: "maxFiles", type: "number", description: "Maximum number of attached files. Extra files beyond this limit are dropped." },
  { name: "filePreviewSize", type: "number", default: "80", description: "Side length (in pixels) of each preview tile. Images use object-cover; PDFs render the first page via pdfjs; other types fall back to a centered icon." },
  { name: "textareaProps", type: "TextareaHTMLAttributes", description: "Extra props forwarded to the underlying textarea (value, onChange, onKeyDown, disabled and placeholder are controlled by the component)." },
  { name: "status", type: '"idle" | "streaming"', description: "Assistant response state. When \"streaming\", the send button becomes a Stop control (empty draft) or a Queue action (non-empty draft). On the streaming→idle edge the next queued message auto-dispatches via onSend. Leave undefined for the legacy send-immediately behavior." },
  { name: "onStop", type: "() => void", description: "Fires when the Stop control is pressed (streaming + empty draft). Halt the current response and set status to \"idle\" — that edge immediately dispatches the next queued message." },
  { name: "queue", type: "QueuedMessage[]", description: "Controlled queue of pending messages, rendered as reorderable rows above the textarea. Double-click (or Enter/F2) edits a row back into the composer; the × (or Delete) removes it; drag — or Alt+↑/↓ — reorders. Requires status to be controlled." },
  { name: "onQueueChange", type: "(queue: QueuedMessage[]) => void", description: "Called whenever the queue changes — enqueue, edit, delete, reorder, or auto-dispatch. Each QueuedMessage is { id, text, files }." },
  { name: "showQueue", type: "boolean", default: "true", description: "Render the built-in reorderable queue rows above the textarea. Set to false to suppress them and render the queue yourself (e.g. as full-width rows above the composer) — enqueue and auto-dispatch still run." },
  { name: "history", type: "string[]", default: "[]", description: "Previously-sent messages, oldest first. With the textarea focused, ArrowUp (caret on the first line) recalls the previous message and walks backward; ArrowDown (caret on the last line) walks forward toward the in-progress draft. Editing or sending exits history mode." },
];

export function InputMessageExamples() {
  const [basicValue, setBasicValue] = useState("");
  const [leftValue, setLeftValue] = useState("");
  const [rightValue, setRightValue] = useState("");
  const [handlerValue, setHandlerValue] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  // "Attachments" demo: a composer pre-filled with a real image + PDF, loaded
  // from public assets at mount. Sending pushes the message (with its
  // attachments) into a transcript and an assistant reply follows.
  const [attachValue, setAttachValue] = useState("");
  const [attachFiles, setAttachFiles] = useState<File[]>([]);
  const [attachMessages, setAttachMessages] = useState<
    { from: "user" | "assistant"; text: string; files?: File[] }[]
  >([]);
  // Keep the originally-loaded files so "Reset" can re-fill the composer.
  const initialAttachFiles = useRef<File[]>([]);
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/sample-avatar.png")
        .then((r) => r.blob())
        .then((b) => new File([b], "sample-avatar.png", { type: b.type || "image/png" })),
      fetch("/Receipt-2581-4039-8265.pdf")
        .then((r) => r.blob())
        .then(
          (b) =>
            new File([b], "Receipt-2581-4039-8265.pdf", {
              type: b.type || "application/pdf",
            })
        ),
    ])
      .then((files) => {
        if (cancelled) return;
        initialAttachFiles.current = files;
        setAttachFiles(files);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const resetAttachDemo = () => {
    setAttachMessages([]);
    setAttachValue("");
    setAttachFiles(initialAttachFiles.current);
  };

  // Same floating-composer treatment as the main Example: measure the composer
  // to reserve scroll padding, and keep the transcript pinned to the bottom.
  const attachInputRef = useRef<HTMLDivElement>(null);
  const [attachInputH, setAttachInputH] = useState(0);
  useEffect(() => {
    const el = attachInputRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setAttachInputH(el.offsetHeight));
    ro.observe(el);
    setAttachInputH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const attachScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = attachScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [attachMessages, attachInputH]);

  const PlusIcon = useIcon("plus");
  const ChevronDownIcon = useIcon("chevron-down");
  const ResetIcon = useIcon("rotate-ccw");

  return (
    <>
      <DocSection title="Playground">
        <VariantPlayground
          minHeightClass="min-h-[280px]"
          variants={[
            { value: "basic", label: "Basic", code: basicCode, preview: <div className="w-full max-w-xl"><InputMessage value={basicValue} onValueChange={setBasicValue} onSend={() => setBasicValue("")} /></div> },
            { value: "left-slot", label: "Left slot", code: leftOnlyCode, preview: <div className="w-full max-w-xl"><InputMessage value={leftValue} onValueChange={setLeftValue} onSend={() => setLeftValue("")} leftSlot={<Button iconOnly variant="ghost" size="sm" aria-label="Attach"><PlusIcon /></Button>} /></div> },
            { value: "disabled", label: "Disabled", code: disabledCode, preview: <div className="w-full max-w-xl"><InputMessage value="This composer is disabled" onValueChange={() => {}} disabled /></div> },
          ]}
        />
      </DocSection>

      <DocSection title="Example">
        <QueuedChatDemo
          code={actionsCode}
          rich
          minHeightClass="h-[560px]"
          placeholder="Ask me anything…"
        />
      </DocSection>

      <DocSection title="Basic">
        <ComponentPreview code={basicCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value={basicValue}
              onValueChange={setBasicValue}
              onSend={() => setBasicValue("")}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Attachments">
        <ComponentPreview
          code={attachmentsCode}
          minHeightClass="h-[440px]"
          align="bottom"
          padding="compact"
          playbackButton={
            attachMessages.length > 0
              ? {
                  icon: <ResetIcon size={16} strokeWidth={1.5} />,
                  tooltip: "Reset",
                  onClick: resetAttachDemo,
                }
              : undefined
          }
        >
          <div className="relative w-full self-stretch">
            <div
              ref={attachScrollRef}
              className="absolute inset-0 overflow-y-auto scrollbar-hide"
            >
              <div
                className="flex min-h-full flex-col justify-start gap-2"
                style={{ paddingBottom: attachInputH + 12 }}
              >
                {attachMessages.map((m, i) => (
                  <ChatMessage key={i} from={m.from} files={m.files}>
                    {m.text}
                  </ChatMessage>
                ))}
              </div>
            </div>
            <InputMessage
              ref={attachInputRef}
              className="absolute inset-x-0 bottom-0"
              value={attachValue}
              onValueChange={setAttachValue}
              files={attachFiles}
              onFilesChange={setAttachFiles}
              onSend={(text, attachments) => {
                if (!text && attachments.length === 0) return;
                setAttachMessages((prev) => [
                  ...prev,
                  { from: "user", text, files: attachments },
                ]);
                setAttachValue("");
                setAttachFiles([]);
              }}
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Agent composer">
        <ComponentPreview code={agentComposerCode} minHeightClass="min-h-[300px]">
          <AgentComposerDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Queued messages">
        <QueuedChatDemo code={queuedCode} />
      </DocSection>

      <DocSection title="Left Slot Only">
        <ComponentPreview code={leftOnlyCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value={leftValue}
              onValueChange={setLeftValue}
              onSend={() => setLeftValue("")}
              leftSlot={
                <Button iconOnly variant="ghost" size="sm" aria-label="Attach">
                  <PlusIcon />
                </Button>
              }
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Right Slot Only">
        <ComponentPreview code={rightOnlyCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value={rightValue}
              onValueChange={setRightValue}
              onSend={() => setRightValue("")}
              rightSlot={
                <Button variant="ghost" size="sm" trailingIcon={ChevronDownIcon}>
                  Sonnet 4.6
                </Button>
              }
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Send Handler">
        <ComponentPreview
          code={sendHandlerCode}
          minHeightClass="min-h-[280px]"
          playbackButton={
            messages.length > 0
              ? {
                  icon: <ResetIcon size={16} strokeWidth={1.5} />,
                  tooltip: "Clear messages",
                  onClick: () => setMessages([]),
                }
              : undefined
          }
        >
          <div className="w-full max-w-xl flex flex-col gap-3">
            {messages.length > 0 && (
              <div className="flex flex-col gap-2">
                {messages.map((m, i) => (
                  <ChatMessage key={i} from="user">
                    {m}
                  </ChatMessage>
                ))}
              </div>
            )}
            <InputMessage
              value={handlerValue}
              onValueChange={setHandlerValue}
              onSend={(text) => {
                if (text) setMessages((prev) => [...prev, text]);
                setHandlerValue("");
              }}
              placeholder="Press Enter to send. Shift+Enter for newline."
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="Disabled">
        <ComponentPreview code={disabledCode} minHeightClass="min-h-[280px]">
          <div className="w-full max-w-xl">
            <InputMessage
              value="This composer is disabled"
              onValueChange={() => {}}
              disabled
            />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title="API Reference">
        <PropsTable props={inputMessageProps} />
      </DocSection>
    </>
  );
}
