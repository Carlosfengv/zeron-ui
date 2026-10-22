"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import {
  ChatMessage,
  ChatMessageAction,
  ChatMessageCopy,
  ChatMessageBranchSwitch,
  ChatMessageAttachments,
  ChatMessageEditor,
  ChatMessageMeta,
  ChatMessageAuthor,
  type ChatMessageBranch,
  type ChatMessageFile,
} from "#components/chat-message";
import { HugeiconsIcon } from "@hugeicons/react";
import ThumbsUpIcon from "@hugeicons/core-free-icons/ThumbsUpIcon";
import ThumbsDownIcon from "@hugeicons/core-free-icons/ThumbsDownIcon";
import { Button } from "#components/button";
import { InlineNotice, InlineNoticeContent } from "#components/inline-notice";
import { Separator } from "#components/separator";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverFooter,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "#components/popover";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";
import { useThread } from "./context";
import type {
  ChatAssistantMessageProps,
  ChatCheckpointData,
  ChatUserMessageProps,
} from "./types";

function useMessageEntry(
  id: string,
  role: "user" | "assistant",
  text = "",
  checkpoint?: ChatCheckpointData,
) {
  const context = useThread();
  const ref = useRef<HTMLElement>(null);
  const { register } = context;
  const checkpointRef = useRef(checkpoint);
  checkpointRef.current = checkpoint;
  const checkpointKey = JSON.stringify(checkpoint);
  useLayoutEffect(() => {
    if (ref.current)
      return register({
        id,
        role,
        text,
        element: ref.current,
        checkpoint: checkpointRef.current,
      });
  }, [register, id, role, text, checkpointKey]);
  const start = context.entries.findIndex(
    (entry) => entry.id === context.restorePreview,
  );
  const index = context.entries.findIndex((entry) => entry.id === id);
  return { ref, dimmed: start >= 0 && index >= start, context };
}

// Keep the original public names and context behavior for existing consumers.
/** @deprecated Compatibility alias. Use ChatMessageAction from @zeron/ui/chat-message. */
export const ChatAction = ChatMessageAction;

/** @deprecated Compatibility adapter. Use ChatMessageCopy from @zeron/ui/chat-message and pass labels explicitly. This adapter inherits thread labels. */
export function ChatCopy({ text }: { text: string }) {
  const { labels } = useThread();
  return <ChatMessageCopy text={text} labels={labels} />;
}

/** @deprecated Compatibility adapter. Use ChatMessageBranchSwitch from @zeron/ui/chat-message with labels and disabled. This adapter inherits thread labels. */
export function ChatBranchSwitch(props: { branch: ChatMessageBranch; disabled?: boolean }) {
  const { labels } = useThread();
  return <ChatMessageBranchSwitch {...props} labels={labels} />;
}

/** @deprecated Compatibility adapter. Use ChatMessageAttachments from @zeron/ui/chat-message with a label. This adapter inherits the thread conversation label. */
export function ChatAttachments({ files }: { files: readonly ChatMessageFile[] }) {
  const { labels } = useThread();
  return <ChatMessageAttachments files={files} label={labels.conversation} />;
}

/** @deprecated Compatibility adapter. Use ChatMessageEditor from @zeron/ui/chat-message with labels and disabled. This adapter inherits thread labels and busy/pending state. */
export function ChatEditor(props: { text: string; onSave: (text: string) => void | Promise<void>; onCancel: () => void }) {
  const { labels, busy, pending } = useThread();
  return <ChatMessageEditor {...props} disabled={busy || pending} labels={labels} />;
}

export function ChatCheckpoint({
  messageId,
  checkpoint,
}: {
  messageId: string;
  checkpoint: ChatCheckpointData;
}) {
  const context = useThread();
  const { labels } = context;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoredRef = useRef(false);
  const descriptionId = useId();
  const Pin = useIcon("pin");
  const index = context.entries.findIndex((entry) => entry.id === messageId);
  const ownFiles = [...new Set(checkpoint.files ?? [])];
  const files = [
    ...new Set(
      index < 0
        ? ownFiles
        : context.entries
            .slice(index)
            .flatMap((entry) => entry.checkpoint?.files ?? []),
    ),
  ];
  const affected = index < 0 ? 0 : context.entries.length - index;
  const { previewRestore } = context;
  useEffect(() => {
    if (!open) return;
    previewRestore(messageId);
    return () => previewRestore(null);
  }, [open, messageId, previewRestore]);
  const canRestore = !!context.restore;
  return (
    <div className="flex min-w-0 items-center gap-3 text-label text-fg-muted">
      <Separator
        tone="subtle"
        role="none"
        className="min-w-3 w-auto flex-1"
        aria-hidden="true"
      />
      <Pin size={12} />
      <span id={descriptionId} className="min-w-0 truncate">
        {checkpoint.label ?? labels.checkpoint}
        {ownFiles.length > 0 && ` · ${labels.changedFiles(ownFiles.length)}`}
      </span>
      {canRestore && (
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (!context.pending) {
              restoredRef.current = false;
              setOpen(next);
            }
          }}
        >
          <PopoverTrigger
            ref={triggerRef}
            render={
              <Button
                variant="ghost"
                size="xs"
                disabled={context.busy || context.pending}
                aria-label={`${labels.restore}: ${context.entries[index]?.text ?? checkpoint.label ?? labels.checkpoint}`}
                aria-describedby={descriptionId}
              >
                {labels.restore}
              </Button>
            }
          />
          <PopoverContent
            align="end"
            className="max-w-xs"
            finalFocus={() =>
              restoredRef.current ? false : triggerRef.current
            }
          >
            <PopoverHeader>
              <PopoverTitle>{labels.restoreTitle}</PopoverTitle>
              <PopoverDescription>{labels.restoreImpact(affected, files.length)}</PopoverDescription>
            </PopoverHeader>
            {files.length > 0 && (
              <ul className="my-3 max-h-32 overflow-auto text-label text-fg-muted">
                {files.map((file) => (
                  <li key={file} className="break-all font-mono">
                    {file}
                  </li>
                ))}
              </ul>
            )}
            <PopoverFooter className="flex-col items-stretch">
              {files.length > 0 && (
                <Button
                  size="sm"
                  variant="neutral"
                  loading={context.pending}
                  disabled={context.pending}
                  onClick={async () => {
                    restoredRef.current = true;
                    if (await context.restore?.(checkpoint.id, true)) {
                      setOpen(false);
                    } else {
                      restoredRef.current = false;
                    }
                  }}
                >
                  {context.pending ? labels.restoring : labels.restoreCode}
                </Button>
              )}
              <Button
                size="sm"
                variant={files.length ? "secondary" : "neutral"}
                disabled={context.pending}
                onClick={async () => {
                  restoredRef.current = true;
                  if (await context.restore?.(checkpoint.id, false)) {
                    setOpen(false);
                  } else {
                    restoredRef.current = false;
                  }
                }}
              >
                {labels.restoreConversation}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={context.pending}
                onClick={() => setOpen(false)}
              >
                {labels.cancel}
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      )}
      <Separator
        tone="subtle"
        role="none"
        className="min-w-3 w-auto flex-1"
        aria-hidden="true"
      />
    </div>
  );
}

/** Thread-aware user entry: registers its ID and composes the standalone message primitives. */
export function ChatUserMessage({
  id,
  text,
  files,
  attachments,
  time,
  pin = false,
  branch,
  checkpoint,
  onEdit,
  className,
  ...props
}: ChatUserMessageProps) {
  const { ref, dimmed, context } = useMessageEntry(
    id,
    "user",
    text,
    checkpoint,
  );
  const [editing, setEditing] = useState(false);
  const Edit = useIcon("pencil");
  const pinMessage = context.pin;
  useLayoutEffect(() => {
    if (pin) pinMessage(id);
  }, [pin, id, pinMessage]);
  let formattedTime: string | undefined;
  if (time && Number.isFinite(time.getTime())) {
    try {
      formattedTime = new Intl.DateTimeFormat(context.locale, {
        hour: "numeric",
        minute: "2-digit",
      }).format(time);
    } catch {
      formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(time);
    }
  }
  const cancel = () => {
    setEditing(false);
    requestAnimationFrame(() => ref.current?.focus({ preventScroll: true }));
  };
  const disabled = context.busy || context.pending;
  return (
    <article
      ref={ref}
      tabIndex={-1}
      data-thread-message={id}
      className={cn(
        "min-w-0 space-y-3 rounded-lg outline-none transition-opacity duration-moderate motion-reduce:transition-none focus-visible:ring-1 focus-visible:ring-focus-ring",
        dimmed && "opacity-40",
        className,
      )}
      {...props}
    >
      {checkpoint && <ChatCheckpoint messageId={id} checkpoint={checkpoint} />}
      {editing ? (
        <ChatMessageEditor text={text} onSave={onEdit!} onCancel={cancel} disabled={disabled} labels={context.labels} />
      ) : (
        <div className="flex flex-col items-end">
          <ChatMessage
            from="user"
            time={formattedTime}
            attachments={
              attachments ??
              (files?.length ? <ChatMessageAttachments files={files} label={context.labels.conversation} /> : undefined)
            }
            actions={
              <>
                <ChatMessageCopy text={text} labels={context.labels} />
                {onEdit && (
                  <ChatMessageAction
                    label={context.labels.edit}
                    disabled={disabled}
                    onClick={() => setEditing(true)}
                  >
                    <Edit />
                  </ChatMessageAction>
                )}
                {branch && (
                  <ChatMessageBranchSwitch branch={branch} disabled={disabled} labels={context.labels} />
                )}
              </>
            }
          >
            {text || undefined}
          </ChatMessage>
        </div>
      )}
    </article>
  );
}

/** Thread-aware assistant entry: coordinates streaming/actions around ChatMessage. */
export function ChatAssistantMessage({
  id,
  children,
  text,
  streaming = false,
  last = false,
  meta,
  model,
  modelLogo,
  provider,
  metrics,
  branch,
  feedback = null,
  onFeedback,
  onRetry,
  error,
  stopped = false,
  className,
  ...props
}: ChatAssistantMessageProps) {
  const { ref, dimmed, context } = useMessageEntry(id, "assistant", text);
  const [notice, setNotice] = useState("");
  const Retry = useIcon("rotate-ccw");
  const disabled = context.busy || context.pending;
  return (
    <article
      ref={ref}
      tabIndex={-1}
      data-thread-message={id}
      className={cn(
        "min-w-0 rounded-lg outline-none transition-opacity duration-moderate motion-reduce:transition-none focus-visible:ring-1 focus-visible:ring-focus-ring",
        dimmed && "opacity-40",
        className,
      )}
      {...props}
    >
      <ChatMessage
        from="assistant"
        actionsVisibility={last || !!error ? "always" : "auto"}
        header={<ChatMessageAuthor model={model} logo={modelLogo} provider={provider} />}
        meta={
          !streaming && (meta != null || metrics) ? (
            <ChatMessageMeta model={meta} metrics={metrics} locale={context.locale} />
          ) : undefined
        }
        actions={
          !streaming ? (
            <>
              {text != null && <ChatMessageCopy text={text} labels={context.labels} />}
              {onRetry && (
                <ChatMessageAction
                  label={context.labels.retry}
                  disabled={disabled}
                  onClick={onRetry}
                >
                  <Retry />
                </ChatMessageAction>
              )}
              {onFeedback && !error && (
                <>
                  {(["up", "down"] as const).map((rating) => (
                    <ChatMessageAction
                      key={rating}
                      label={
                        rating === "up"
                          ? context.labels.good
                          : context.labels.bad
                      }
                      pressed={feedback === rating}
                      disabled={disabled}
                      onClick={() => {
                        onFeedback(feedback === rating ? null : rating);
                        setNotice(context.labels.rated);
                      }}
                    >
                      <HugeiconsIcon
                        icon={rating === "up" ? ThumbsUpIcon : ThumbsDownIcon}
                        size={16}
                      />
                    </ChatMessageAction>
                  ))}
                </>
              )}
              {branch && (
                <ChatMessageBranchSwitch branch={branch} disabled={disabled} labels={context.labels} />
              )}
            </>
          ) : undefined
        }
      >
        {children ?? text}
        {error && (
          <div className="mt-3">
            <InlineNotice role="alert" variant="emphasized" tone="danger">
              <InlineNoticeContent>{error}</InlineNoticeContent>
            </InlineNotice>
          </div>
        )}
        {stopped && (
          <div className="mt-2">
            <InlineNotice>
              <InlineNoticeContent>{context.labels.stopped}</InlineNoticeContent>
            </InlineNotice>
          </div>
        )}
      </ChatMessage>
      <span role="status" className="sr-only">
        {notice}
      </span>
    </article>
  );
}

export function ChatDivider({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="separator"
      className={cn(
        "flex items-center gap-3 text-label text-fg-muted",
        className,
      )}
      {...props}
    >
      <Separator role="none" aria-hidden="true" tone="subtle" className="w-auto flex-1" />
      <span>{children}</span>
      <Separator role="none" aria-hidden="true" tone="subtle" className="w-auto flex-1" />
    </div>
  );
}
