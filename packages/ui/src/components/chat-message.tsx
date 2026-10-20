"use client";

import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "#system/utils";
import { spring } from "#system/springs";
import { useTouchPrimary } from "#hooks/use-touch-primary";
import { FileThumbnail } from "#components/file-thumbnail";

interface ChatMessageProps
  extends Omit<HTMLMotionProps<"div">, "children"> {
  /** Who sent the message. Drives alignment and bubble colour:
   *  `user` → right-aligned emphasis bubble, `assistant` → left-aligned plain text. */
  from: "user" | "assistant";
  /** Optional attachments rendered as square thumbnails above the bubble. */
  files?: File[];
  /** Side length of each attachment thumbnail in pixels. Defaults to 64. */
  thumbnailSize?: number;
  /** Timestamp shown in the hover-revealed meta row, before the actions.
   *  User-message only — ignored on assistant replies. Caller pre-formats it
   *  (e.g. `"Wednesday 6:08 PM"`). */
  time?: ReactNode;
  /** Persistent identity above the message body. */
  header?: ReactNode;
  /** Keep reply actions visible independently of hover. */
  actionsVisibility?: "auto" | "always";
  /** Icon-only action buttons shown in the hover-revealed meta row (e.g. copy,
   *  edit, regenerate). Rendered next to the timestamp. */
  actions?: ReactNode;
  /** Message body. When omitted the text bubble is dropped (attachment-only message). */
  children?: ReactNode;
}

// ─── ChatMessage ──────────────────────────────────────────────────────────
// A single transcript entry with baked-in entrance + layout motion. Pairs with
// InputMessage's onSend: render one per sent/received message. `layout="position"`
// lets earlier messages slide up smoothly when a new one is appended.
const ChatMessage = forwardRef<HTMLDivElement, ChatMessageProps>(
  (
    { from, files, thumbnailSize = 64, time, header, actions, actionsVisibility = "auto", children, className, ...props },
    ref
  ) => {
    const isUser = from === "user";
    // Hover-reveal is unreachable on touch — keep the meta row visible there.
    const isTouch = useTouchPrimary();
    // Timestamps are a user-message affordance; assistant replies show actions only.
    const showTime = isUser && time != null;

    return (
      <motion.div
        ref={ref}
        data-slot="chat-message"
        layout="position"
        initial={{ opacity: 0, y: 8, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={spring.moderate}
        style={{ transformOrigin: isUser ? "bottom right" : "bottom left" }}
        className={cn(
          "group flex min-w-0 flex-col gap-1.5",
          isUser ? "max-w-[80%] items-end self-end" : "w-full max-w-full items-start self-start",
          className
        )}
        {...props}
      >
        {header}
        {files && files.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-1.5",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {files.map((file, i) => (
              <FileThumbnail
                key={`${file.name}-${file.size}-${file.lastModified}-${i}`}
                file={file}
                size={thumbnailSize}
              />
            ))}
          </div>
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
        {(showTime || actions != null) && (
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
          </div>
        )}
      </motion.div>
    );
  }
);

ChatMessage.displayName = "ChatMessage";

export { ChatMessage };
export type { ChatMessageProps };
export { ChatScrollToLatest, CHAT_SCROLL_FOLLOW_THRESHOLD } from "./chat-message/scroll-to-latest";
export type { ChatScrollToLatestProps } from "./chat-message/scroll-to-latest";
export { ChatMessageAction, ChatMessageCopy } from "./chat-message/actions";
export type { ChatMessageActionProps, ChatMessageCopyProps } from "./chat-message/actions";
export { ChatMessageAuthor } from "./chat-message/author";
export type { ChatMessageAuthorProps } from "./chat-message/author";
export default ChatMessage;
