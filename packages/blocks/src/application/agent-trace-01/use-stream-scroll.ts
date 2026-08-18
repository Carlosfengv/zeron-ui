"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";

const FOLLOW_THRESHOLD = 24;

function isAtBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= FOLLOW_THRESHOLD;
}

/** Keeps a live transcript pinned only until the reader deliberately scrolls away. */
export function useStreamScroll(signature: string) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const [showBackToBottom, setShowBackToBottom] = useState(false);

  const scrollToBottom = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
    pinned.current = true;
    setShowBackToBottom(false);
  }, []);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || !pinned.current) return;
    element.scrollTop = element.scrollHeight;
  }, [signature]);

  const onScroll = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const nextPinned = isAtBottom(element);
    pinned.current = nextPinned;
    setShowBackToBottom(!nextPinned);
  }, []);

  return { ref, onScroll, scrollToBottom, showBackToBottom };
}
