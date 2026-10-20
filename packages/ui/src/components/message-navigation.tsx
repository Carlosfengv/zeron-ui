"use client";

import { useCallback, useId, useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import Bookmark02Icon from "@hugeicons/core-free-icons/Bookmark02Icon";
import { Button } from "#components/button";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger, type PopoverSide } from "#components/popover";
import { Tooltip } from "#components/tooltip";
import { createHugeIcon } from "#system/huge-icon";
import type { IconComponent } from "#system/icon-context";
import { cn } from "#system/utils";

export interface MessageNavigationItem {
  id: string;
  label: string;
  /** A short response excerpt, rendered only while its preview is open. */
  description?: ReactNode;
  /** Controlled by the host; clicking only requests a change. */
  bookmarked?: boolean;
  bookmarkDisabled?: boolean;
  /** Additional host-owned actions, displayed before the bookmark button. */
  actions?: ReactNode;
}

export interface MessageNavigationBookmarkLabels {
  bookmark: string;
  unbookmark: string;
  /** Accessible description of a bookmarked navigation item. */
  bookmarked?: string;
}

export interface MessageNavigationProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect"> {
  items: readonly MessageNavigationItem[];
  activeId?: string | null;
  onSelect: (id: string) => void;
  /** Omit to hide the bookmark button. */
  onBookmarkChange?: (id: string, bookmarked: boolean) => void;
  bookmarkLabels?: Partial<MessageNavigationBookmarkLabels>;
  bookmarkIcon?: IconComponent;
  label?: string;
  getItemLabel?: (item: MessageNavigationItem, index: number) => string;
  /** Shared edge of the short lines, matching the rail's placement in its host. */
  align?: "left" | "right";
  previewSide?: Extract<PopoverSide, "left" | "right">;
}

const markerWidths = ["w-2", "w-3", "w-4", "w-5"] as const;
const DefaultBookmarkIcon = createHugeIcon(Bookmark02Icon);

/** Compact turn markers. The host owns the transcript, current position and jump behavior. */
export function MessageNavigation({ items, activeId, onSelect, label = "Messages", getItemLabel,
  onBookmarkChange, bookmarkLabels, bookmarkIcon: BookmarkIcon = DefaultBookmarkIcon,
  align = "right", previewSide = "left", className, ...props }: MessageNavigationProps) {
  const copy = { bookmark: "Bookmark message", unbookmark: "Remove bookmark", ...bookmarkLabels,
    bookmarked: bookmarkLabels?.bookmarked ?? "Bookmarked" };
  const [preview, setPreview] = useState<{ id: string | null; open: boolean }>({ id: null, open: false });
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const prefix = useId();
  const previewItem = items.find((item) => item.id === preview.id);
  const itemIds = JSON.stringify(items.map((item) => item.id));
  const triggerId = (id: string) => `${prefix}-${encodeURIComponent(id)}`;
  const listRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const tabStop = items.find((item) => item.id === focusedId)?.id
    ?? items.find((item) => item.id === activeId)?.id ?? items[0]?.id;

  const reveal = useCallback((id: string) => {
    const list = listRef.current;
    const button = buttons.current.get(id);
    if (!list || !button) return;
    const top = button.offsetTop;
    const bottom = top + button.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, []);

  useLayoutEffect(() => {
    if (activeId) reveal(activeId);
  }, [activeId, itemIds, reveal]);

  useLayoutEffect(() => {
    if (preview.id && !previewItem) setPreview({ id: null, open: false });
  }, [preview.id, previewItem]);

  if (!items.length) return null;
  return (
    <nav data-slot="message-navigation" data-align={align} aria-label={label} className={cn("flex min-h-0 w-10 flex-col items-center", className)} {...props}>
      <span id={`${prefix}-bookmarked`} className="sr-only">{copy.bookmarked}</span>
      <Popover trigger="hover" hoverDelay={80} closeDelay={120} open={preview.open && !!previewItem}
        triggerId={previewItem ? triggerId(previewItem.id) : null}
        onOpenChange={(next, details) => {
          // A press navigates immediately; it must not toggle the preview.
          if (details.reason === "trigger-press") return;
          const id = details.trigger?.getAttribute("data-message-id");
          if (next && id) setPreview({ id, open: true });
          else if (!next) {
            if (details.reason === "escape-key" && preview.id) {
              buttons.current.get(preview.id)?.focus({ preventScroll: true });
            }
            setPreview((current) => ({ ...current, open: false }));
          }
        }}>
        <div ref={listRef} className="relative max-h-full w-full overflow-y-auto overscroll-contain py-2 [scrollbar-width:none]">
          {items.map((item, index) => {
            const active = item.id === activeId;
            const open = preview.open && preview.id === item.id;
            const width = markerWidths[Math.min(3, Math.floor(item.label.length / 16))];
            return (
              <PopoverTrigger
                key={item.id}
                id={triggerId(item.id)}
                data-message-id={item.id}
                ref={(node) => { if (node) buttons.current.set(item.id, node); else buttons.current.delete(item.id); }}
                data-slot="message-navigation-item"
                data-bookmarked={item.bookmarked ? "" : undefined}
                aria-label={getItemLabel?.(item, index) ?? item.label}
                aria-describedby={item.bookmarked ? `${prefix}-bookmarked` : undefined}
                aria-current={active ? "location" : undefined}
                tabIndex={item.id === tabStop ? 0 : -1}
                className={cn(
                  "group/message-marker flex h-3 w-full cursor-pointer items-center rounded-sm px-2.5 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring",
                  align === "right" ? "justify-end" : "justify-start",
                )}
                onFocus={() => { setFocusedId(item.id); setPreview({ id: item.id, open: true }); reveal(item.id); }}
                onKeyDown={(event) => {
                  const next = event.key === "ArrowDown" ? Math.min(index + 1, items.length - 1)
                    : event.key === "ArrowUp" ? Math.max(index - 1, 0)
                      : event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : null;
                  if (next != null) {
                    event.preventDefault();
                    buttons.current.get(items[next].id)?.focus({ preventScroll: true });
                  }
                }}
                onClick={() => { setPreview((current) => ({ ...current, open: false })); onSelect(item.id); }}>
                <span data-slot="message-navigation-marker" aria-hidden="true" className={cn(
                  "relative block h-0.5 shrink-0 transition-[width,background-color] duration-fast motion-reduce:transition-none",
                  active || open ? "w-5" : width,
                  item.bookmarked ? "bg-fg-brand" : active || open ? "bg-fg-default"
                    : "bg-fg-subtle/50 group-hover/message-marker:bg-fg-default group-focus-visible/message-marker:bg-fg-default",
                )}>
                  {item.bookmarked && <span data-slot="message-navigation-bookmark-marker" className={cn(
                    "absolute top-1/2 size-1 -translate-y-1/2 rounded-full bg-fg-brand",
                    align === "right" ? "-left-2" : "-right-2",
                  )} />}
                </span>
              </PopoverTrigger>
            );
          })}
        </div>
        <PopoverContent side={previewSide} sideOffset={12} initialFocus={false} finalFocus={false}
          className="w-80 max-w-[calc(100vw-4rem)]">
          {previewItem && <div data-slot="message-navigation-preview" className="space-y-2">
            <div className="flex min-w-0 items-center gap-3">
              <PopoverTitle className="min-w-0 flex-1 font-medium">
                <span className="block truncate">{previewItem.label}</span>
              </PopoverTitle>
              {(previewItem.actions != null || onBookmarkChange) && <div className="flex shrink-0 items-center gap-1">
                {previewItem.actions}
                {onBookmarkChange && <Tooltip content={previewItem.bookmarked ? copy.unbookmark : copy.bookmark}>
                  <Button type="button" variant="ghost" size="xs" iconOnly
                    active={!!previewItem.bookmarked} disabled={previewItem.bookmarkDisabled}
                    aria-label={copy.bookmark} aria-pressed={!!previewItem.bookmarked}
                    onClick={() => onBookmarkChange(previewItem.id, !previewItem.bookmarked)}>
                    <BookmarkIcon aria-hidden="true" fill={previewItem.bookmarked ? "currentColor" : "none"} />
                  </Button>
                </Tooltip>}
              </div>}
            </div>
            {previewItem.description != null && (
              <div className="line-clamp-3 whitespace-normal break-words text-body text-fg-muted">{previewItem.description}</div>
            )}
          </div>}
        </PopoverContent>
      </Popover>
    </nav>
  );
}
