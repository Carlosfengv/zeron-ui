"use client";

import type { MouseEventHandler } from "react";
import { Button } from "#components/button";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";

/** Distance in pixels at which a conversation is considered to be at its latest content. */
export const CHAT_SCROLL_FOLLOW_THRESHOLD = 24;

export interface ChatScrollToLatestProps {
  onClick: MouseEventHandler<HTMLButtonElement>;
  label?: string;
  locale?: string;
  disabled?: boolean;
  /** Position the overlay relative to the host's scroll region or composer. */
  className?: string;
}

/** Shared navigation affordance. The host owns visibility, scrolling and following. */
export function ChatScrollToLatest({ onClick, label, locale = "en", disabled, className }: ChatScrollToLatestProps) {
  const ArrowDown = useIcon("arrow-down");
  return (
    <div data-slot="chat-scroll-to-latest" className={cn("pointer-events-none absolute inset-x-0 bottom-4 z-raised flex justify-center", className)}>
      <Button type="button" variant="tertiary" size="sm" leadingIcon={ArrowDown} disabled={disabled} onClick={onClick} className="pointer-events-auto">
        {label ?? (locale.startsWith("zh") ? "回到最新内容" : "Scroll to latest")}
      </Button>
    </div>
  );
}
