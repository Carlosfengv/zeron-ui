"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "#components/button";
import { ChatScrollToLatest } from "#components/chat-message";
import { Empty, EmptyHeader, EmptyTitle } from "#components/empty";
import { InlineNotice, InlineNoticeContent } from "#components/inline-notice";
import { ScrollArea } from "#components/scroll-area";
import { MessageNavigation } from "#components/message-navigation";
import { Markdown } from "#components/markdown";
import { toast } from "#components/toast";
import { cn } from "#system/utils";
import { SurfaceProvider } from "#system/surface-context";
import { ThreadContext, type ThreadEntry } from "./chat-thread/context";
import { chatThreadEnLabels } from "./chat-thread/labels";
import type { ChatThreadProps } from "./chat-thread/types";
import { useThreadScroll } from "./chat-thread/use-thread-scroll";

/**
 * Conversation coordination: registered message entries, scrolling, history,
 * navigation, checkpoint requests and a persistent composer slot.
 * Compose ChatUserMessage/ChatAssistantMessage, which reuse ChatMessage and
 * register stable IDs. A bare ChatMessage does not register a thread entry.
 * The host owns message/version data, model requests and persistence.
 */
export function ChatThread({
  children,
  composer,
  empty,
  busy = false,
  hasOlder = false,
  loadingOlder = false,
  onLoadOlder,
  bookmarkedIds,
  onBookmarkChange,
  bookmarkLabels,
  onRestore,
  composerRef,
  labels: overrides,
  locale = "en-US",
  className,
  ...props
}: ChatThreadProps) {
  const labels = useMemo(
    () => ({ ...chatThreadEnLabels, ...overrides }),
    [overrides],
  );
  const [entries, setEntries] = useState<ThreadEntry[]>([]);
  const [loadPending, setLoadPending] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [restorePreview, previewRestore] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const mutationLock = useRef(false);
  const loadLock = useRef(false);
  const olderBusy = loadingOlder || loadPending;
  const olderBusyRef = useRef(olderBusy);
  olderBusyRef.current = olderBusy;
  const scroll = useThreadScroll(entries, children, olderBusy);
  const isEmpty = entries.length === 0;

  const register = useCallback((entry: ThreadEntry) => {
    setEntries((current) =>
      [...current.filter((item) => item.id !== entry.id), entry].sort((a, b) =>
        a.element.compareDocumentPosition(b.element) &
        Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      ),
    );
    return () =>
      setEntries((current) =>
        current.filter((item) => item.element !== entry.element),
      );
  }, []);

  const restore = useCallback(
    async (id: string, code: boolean) => {
      if (!onRestore || busy || olderBusy || loadLock.current || mutationLock.current) return false;
      mutationLock.current = true;
      setPending(true);
      try {
        const result = await onRestore(id, { code });
        previewRestore(null);
        // The checkpoint and its focus manager can unmount when the host commits.
        // Restore editor focus after that cleanup, using the public editor ref.
        requestAnimationFrame(() => {
          const textarea = composerRef?.current;
          textarea?.focus({ preventScroll: true });
          textarea?.setSelectionRange(
            textarea.value.length,
            textarea.value.length,
          );
        });
        const undo = result?.undo;
        toast.success(
          labels.restored,
          undo
            ? {
                action: {
                  label: labels.undo,
                  dismissOnClick: false,
                  onClick: async (notification) => {
                    if (mutationLock.current || loadLock.current || olderBusyRef.current) return;
                    mutationLock.current = true;
                    setPending(true);
                    try {
                      await undo();
                      toast.dismiss(notification.id);
                      toast.success(labels.undone);
                    } catch {
                      toast.error(labels.undoFailed);
                    } finally {
                      mutationLock.current = false;
                      setPending(false);
                    }
                  },
                },
              }
            : undefined,
        );
        return true;
      } catch {
        toast.error(labels.restoreFailed);
        return false;
      } finally {
        mutationLock.current = false;
        setPending(false);
      }
    },
    [onRestore, busy, olderBusy, composerRef, labels],
  );

  const loadOlder = async () => {
    if (!onLoadOlder || olderBusy || loadLock.current || mutationLock.current) return;
    loadLock.current = true;
    scroll.captureAnchor();
    setLoadPending(true);
    setLoadError(false);
    try {
      await onLoadOlder();
    } catch {
      setLoadError(true);
    } finally {
      loadLock.current = false;
      setLoadPending(false);
    }
  };

  const context = useMemo(
    () => ({
      labels,
      locale,
      busy: busy || olderBusy,
      pending,
      entries,
      restorePreview,
      previewRestore,
      register,
      pin: scroll.pin,
      restore: onRestore ? restore : undefined,
    }),
    [
      labels,
      locale,
      busy,
      olderBusy,
      pending,
      entries,
      restorePreview,
      register,
      scroll.pin,
      onRestore,
      restore,
    ],
  );
  const navigationItems = useMemo(() => {
    const bookmarks = new Set(bookmarkedIds);
    return entries.flatMap((entry, index) => {
      if (entry.role !== "user") return [];
      const next = entries[index + 1];
      return [{
        id: entry.id,
        label: entry.text || labels.conversation,
        bookmarked: bookmarks.has(entry.id),
        description: next?.role === "assistant" && next.text
          ? <Markdown text={next.text.slice(0, 640).split(/\n\s*\n/, 1)[0]} codeVariant="plain" /> : undefined,
      }];
    });
  }, [entries, bookmarkedIds, labels.conversation]);

  return (
    <ThreadContext.Provider value={context}>
      <SurfaceProvider role="floating">
      <div
        className={cn(
          "@container/thread relative flex h-full min-h-0 w-full flex-col bg-surface-floating text-fg-default",
          className,
        )}
        data-slot="chat-thread"
        {...props}
      >
        <ScrollArea
          className={cn("min-h-0 flex-1", isEmpty && "hidden")}
          contentProps={{ style: { minWidth: 0 } }}
          onWheelCapture={scroll.onUserIntent}
          onTouchStartCapture={scroll.onUserIntent}
          onPointerDownCapture={scroll.onUserIntent}
          onKeyDownCapture={(event) => {
            if (
              [
                "ArrowUp",
                "ArrowDown",
                "PageUp",
                "PageDown",
                "Home",
                "End",
                " ",
              ].includes(event.key)
            )
              scroll.onUserIntent();
          }}
          viewportRef={scroll.bindViewport}
          viewportClassName="overscroll-contain"
          viewportProps={{
            role: "region",
            "aria-label": labels.conversation,
            tabIndex: 0,
            onScroll: scroll.onScroll,
            style: { overflowAnchor: "none" },
          }}
        >
          <div
            ref={scroll.bindContent}
            className="relative mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-6 pt-4 @sm/thread:px-8"
          >
            {hasOlder && onLoadOlder && (
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadOlder}
                  disabled={olderBusy || pending}
                  loading={olderBusy}
                >
                  {olderBusy ? labels.loadingOlder : labels.loadOlder}
                </Button>
                {loadError && (
                  <InlineNotice role="alert" variant="emphasized" tone="danger">
                    <InlineNoticeContent>{labels.loadFailed}</InlineNoticeContent>
                  </InlineNotice>
                )}
              </div>
            )}
            <div
              role="log"
              aria-label={labels.conversation}
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={busy || olderBusy || pending}
              className="flex min-w-0 flex-col gap-6"
            >
              {children}
            </div>
            <div
              ref={scroll.spacerRef}
              aria-hidden="true"
              className="shrink-0"
            />
          </div>
        </ScrollArea>
        <div
          className={cn(
            "items-end justify-center px-6 pb-7 text-center",
            isEmpty ? "flex flex-1" : "hidden",
          )}
        >
          {empty ?? (
            <Empty reason="first-use" scope="inline" density="compact">
              <EmptyHeader><EmptyTitle as="h2">{labels.empty}</EmptyTitle></EmptyHeader>
            </Empty>
          )}
        </div>
        <div
          className="relative mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 pt-2 @sm/thread:px-8"
          data-slot="chat-thread-composer"
        >
          {scroll.away && !isEmpty && (
            <ChatScrollToLatest className="bottom-full pb-4" label={labels.latest} onClick={scroll.latest} />
          )}
          {composer}
        </div>
        <div aria-hidden="true" className={isEmpty ? "flex-1" : "hidden"} />
        {navigationItems.length > 0 && (
          <MessageNavigation
            label={labels.navigation}
            activeId={scroll.activeId}
            onSelect={scroll.jump}
            onBookmarkChange={onBookmarkChange}
            bookmarkLabels={bookmarkLabels}
            getItemLabel={(item, index) => labels.message(index + 1, item.label)}
            items={navigationItems}
            className="absolute right-1 top-1/2 z-raised hidden max-h-64 -translate-y-1/2 @3xl/thread:flex"
          />
        )}
      </div>
      </SurfaceProvider>
    </ThreadContext.Provider>
  );
}

export { ChatAssistantMessage, ChatCheckpoint, ChatDivider, ChatUserMessage } from "./chat-thread/messages";
// Compatibility adapters; prefer the corresponding ChatMessage* primitives in new compositions.
export { ChatAction, ChatAttachments, ChatBranchSwitch, ChatCopy, ChatEditor } from "./chat-thread/messages";
export { ChatMarkdown } from "./chat-thread/markdown";
export { chatThreadEnLabels, chatThreadZhLabels } from "./chat-thread/labels";
export { splitThreadHistory } from "./chat-thread/history";
export type { ChatAssistantMessageProps, ChatBranch, ChatCheckpointData, ChatFile, ChatRestoreResult, ChatResponseMetrics, ChatThreadLabels, ChatThreadProps, ChatUserMessageProps } from "./chat-thread/types";
