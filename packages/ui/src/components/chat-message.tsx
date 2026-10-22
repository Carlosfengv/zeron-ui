"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { cn } from "#system/utils";
import { spring } from "#system/springs";
import { useTouchPrimary } from "#hooks/use-touch-primary";
import { ChatMessageAttachments } from "#components/chat-message/attachments";

interface ChatMessageProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Who sent the message. Drives alignment and bubble colour:
   *  `user` → right-aligned emphasis bubble, `assistant` → left-aligned plain text. */
  from: "user" | "assistant";
  /** Local file cards with a thumbnail and visible filename above the bubble. */
  files?: File[];
  /** Custom attachment content, including persisted remote files. */
  attachments?: ReactNode;
  /** Side length of each attachment thumbnail in pixels. Defaults to 64. */
  thumbnailSize?: number;
  /** Timestamp shown in the hover-revealed meta row, before the actions.
   *  User-message only — ignored on assistant replies. Caller pre-formats it
   *  (e.g. `"Wednesday 6:08 PM"`). */
  time?: ReactNode;
  /** Persistent identity above the message body, for example ChatMessageAuthor. */
  header?: ReactNode;
  /** Icon-only action buttons shown in the hover-revealed meta row (e.g. copy,
   *  edit, regenerate). Rendered next to the timestamp. */
  actions?: ReactNode;
  /** Additional metadata beside the actions, for example ChatMessageMeta.
   * Shares action visibility and wraps within the message width. */
  meta?: ReactNode;
  /** Keep actions visible for the latest reply or a custom touch layout. */
  actionsVisibility?: "auto" | "always";
  /** Message body. When omitted the text bubble is dropped (attachment-only message). */
  children?: ReactNode;
}

// ─── ChatMessage ──────────────────────────────────────────────────────────
// A single transcript entry with baked-in entrance + layout motion. Pairs with
// InputMessage's onSend: render one per sent/received message. `layout="position"`
// lets earlier messages slide up smoothly when a new one is appended.
/**
 * One message: role layout, body and optional identity, attachment and action slots.
 * Independent of ChatThread; the host owns message data and action callbacks.
 * Use ChatThread with ChatUserMessage/ChatAssistantMessage for conversation coordination.
 */
const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  (
    { from, files, attachments, thumbnailSize = 64, time, header, actions, meta, actionsVisibility = "auto", children, className, ...props },
    ref
  ) => {
    const isUser = from === "user";
    // Hover-reveal is unreachable on touch — keep the meta row visible there.
    const isTouch = useTouchPrimary();
    const reduceMotion = useReducedMotion();
    // Timestamps are a user-message affordance; assistant replies show actions only.
    const showTime = isUser && time != null;

    return (
      <motion.div
        ref={ref}
        data-slot="chat-message"
        layout="position"
        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={reduceMotion ? { duration: 0 } : spring.moderate}
        style={{ transformOrigin: isUser ? "bottom right" : "bottom left" }}
        className={cn(
          "group flex min-w-0 flex-col gap-1.5",
          isUser ? "max-w-[80%] items-end self-end" : "w-full max-w-full items-start self-start",
          className
        )}
        {...props}
      >
        {header}
        {attachments}
        {files && files.length > 0 && (
          <ChatMessageAttachments files={files} thumbnailSize={thumbnailSize} align={isUser ? "end" : "start"} />
        )}
        {children != null && children !== "" && (
          <div
            data-slot="chat-message-body"
            className={cn(
              "min-w-0 max-w-full py-2 text-body whitespace-pre-wrap break-words",
              // User keeps the bubble chrome (rounded fill + horizontal padding);
              // the assistant reply is flush-left plain text with no background.
              isUser
                ? cn(
                    "rounded-lg",
                    // `text-pretty` is reserved for settled user bubbles. On the
                    // assistant reply it's left off on purpose: `text-wrap: pretty`
                    // re-balances the last lines on every content change, so a
                    // word-by-word stream visibly reflows earlier words to new
                    // lines. Default (normal) wrapping appends left-to-right and
                    // stays put as the text grows.
                    "px-3.5 text-pretty bg-emphasis text-fg-default"
                  )
                : "w-full text-fg-default"
            )}
          >
            {children}
          </div>
        )}
        {(showTime || actions != null || meta != null) && (
          // Meta row: timestamp + icon-only actions. Always rendered (so it
          // reserves its height and the gap between bubbles never shifts) but
          // hidden until the message is hovered or an action is focused.
          // The timestamp is a user-message affordance only — assistant replies
          // show their actions alone. User rows read date → icons left-to-right.
          <div
            data-slot="chat-message-footer"
            className={cn(
              "flex min-w-0 max-w-full flex-wrap items-center gap-2 px-1 text-label leading-none text-fg-muted select-none",
              !isTouch && actionsVisibility !== "always" && [
                "opacity-0 pointer-events-none transition-opacity duration-moderate",
                "group-hover:opacity-100 group-hover:pointer-events-auto",
                "group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
              ]
            )}
          >
            {showTime && <span className="tabular-nums">{time}</span>}
            {actions != null && (
              <span className="flex min-w-0 max-w-full flex-wrap items-center gap-x-0.5 gap-y-1">{actions}</span>
            )}
            {meta != null && (
              <span className={cn("min-w-0 max-w-full", actions != null && "ml-1")}>
                {meta}
              </span>
            )}
          </div>
        )}
      </motion.div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

export { ChatMessage };
export type { ChatMessageProps };
export {
  ChatMessageAction,
  ChatMessageCopy,
  ChatMessageBranchSwitch,
} from "./chat-message/actions";
export type {
  ChatMessageActionProps,
  ChatMessageCopyProps,
  ChatMessageBranch,
  ChatMessageBranchSwitchProps,
} from "./chat-message/actions";
export { ChatMessageAttachment, ChatMessageAttachments } from "./chat-message/attachments";
export type {
  ChatMessageFile,
  ChatMessageAttachmentProps,
  ChatMessageAttachmentsProps,
} from "./chat-message/attachments";
export { ChatMessageEditor } from "./chat-message/editor";
export type { ChatMessageEditorProps } from "./chat-message/editor";
export { ChatMessageMeta } from "./chat-message/meta";
export type { ChatMessageMetrics, ChatMessageMetaProps } from "./chat-message/meta";
export { ChatMessageAuthor } from "./chat-message/author";
export type { ChatMessageAuthorProps } from "./chat-message/author";
export { ChatScrollToLatest, CHAT_SCROLL_FOLLOW_THRESHOLD } from "./chat-message/scroll-to-latest";
export type { ChatScrollToLatestProps } from "./chat-message/scroll-to-latest";
export default ChatMessage;
