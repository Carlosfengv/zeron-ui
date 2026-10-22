"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { CHAT_SCROLL_FOLLOW_THRESHOLD } from "#components/chat-message";
import type { ThreadEntry } from "./context";

/** One scroll owner. Reading history pauses following until the viewport returns to latest. */
export function useThreadScroll(
  entries: ThreadEntry[],
  revision: unknown,
  loadingOlder: boolean,
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [viewportNode, setViewportNode] = useState<HTMLDivElement | null>(null);
  const [contentNode, setContentNode] = useState<HTMLDivElement | null>(null);
  const bindViewport = useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    setViewportNode(node);
  }, []);
  const bindContent = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    setContentNode(node);
  }, []);
  const spacerRef = useRef<HTMLDivElement>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const mode = useRef<"bottom" | "turn" | "paused">("bottom");
  const pinnedId = useRef<string | null>(null);
  const pinnedSeen = useRef(false);
  const anchor = useRef<{ id: string; offset: number } | null>(null);
  const loadingRef = useRef(loadingOlder);
  loadingRef.current = loadingOlder;
  const [away, setAway] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const updateActive = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const users = entriesRef.current.filter((entry) => entry.role === "user");
    const current =
      users.findLast(
        (entry) => entry.element.offsetTop <= viewport.scrollTop + 64,
      ) ?? users[0];
    setActiveId(current?.id ?? null);
  }, []);

  const captureAnchor = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const visible = entriesRef.current.find(
      (entry) =>
        entry.element.offsetTop + entry.element.offsetHeight >
        viewport.scrollTop,
    );
    if (visible)
      anchor.current = {
        id: visible.id,
        offset: visible.element.offsetTop - viewport.scrollTop,
      };
  }, []);

  const writeTop = useCallback(
    (top: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewport.scrollTop = Math.max(0, top);
      updateActive();
    },
    [updateActive],
  );

  const follow = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const spacer = spacerRef.current;
    if (
      !viewport ||
      !content ||
      !spacer ||
      loadingRef.current ||
      anchor.current
    )
      return;
    const target = entriesRef.current.find(
      (entry) => entry.id === pinnedId.current,
    );
    if (mode.current === "turn" && target) {
      const naturalHeight = content.scrollHeight - spacer.offsetHeight;
      const trailing = Math.max(
        0,
        viewport.clientHeight - (naturalHeight - target.element.offsetTop),
      );
      if (Math.abs(spacer.offsetHeight - trailing) > 1)
        spacer.style.height = `${trailing}px`;
      writeTop(
        Math.max(
          target.element.offsetTop,
          naturalHeight - viewport.clientHeight,
        ),
      );
    } else if (mode.current === "bottom") {
      writeTop(viewport.scrollHeight);
    }
  }, [writeTop]);

  const pin = useCallback(
    (id: string) => {
      pinnedId.current = id;
      pinnedSeen.current = entriesRef.current.some((entry) => entry.id === id);
      mode.current = "turn";
      setAway(false);
      follow();
    },
    [follow],
  );

  const latest = useCallback(() => {
    anchor.current = null;
    mode.current = "bottom";
    setAway(false);
    // Existing turn space is retained so finishing a short response never jumps.
    writeTop(viewportRef.current?.scrollHeight ?? 0);
  }, [writeTop]);

  const jump = useCallback(
    (id: string) => {
      const entry = entriesRef.current.find((item) => item.id === id);
      if (!entry) return;
      mode.current = "paused";
      setAway(true);
      writeTop(entry.element.offsetTop);
      entry.element.focus({ preventScroll: true });
    },
    [writeTop],
  );

  const onScroll = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const atBottom =
      viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <
      CHAT_SCROLL_FOLLOW_THRESHOLD;
    if (!atBottom) mode.current = "paused";
    else if (mode.current === "paused") mode.current = "bottom";
    setAway(!atBottom);
    if (anchor.current && mode.current === "paused") captureAnchor();
    updateActive();
  }, [captureAnchor, updateActive]);

  const onUserIntent = useCallback(() => {
    const viewport = viewportRef.current;
    if (
      viewport &&
      viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop >=
        CHAT_SCROLL_FOLLOW_THRESHOLD
    ) {
      mode.current = "paused";
      setAway(true);
    }
  }, []);

  useLayoutEffect(() => {
    if (
      pinnedId.current &&
      entries.some((entry) => entry.id === pinnedId.current)
    )
      pinnedSeen.current = true;
    if (
      pinnedId.current &&
      pinnedSeen.current &&
      !entries.some((entry) => entry.id === pinnedId.current)
    ) {
      pinnedId.current = null;
      pinnedSeen.current = false;
      mode.current = "bottom";
      if (spacerRef.current) spacerRef.current.style.height = "0px";
    }
    if (anchor.current && !loadingOlder) {
      const saved = anchor.current;
      const entry = entries.find((item) => item.id === saved.id);
      if (entry) writeTop(entry.element.offsetTop - saved.offset);
      anchor.current = null;
      mode.current = "paused";
      setAway(true);
    } else {
      follow();
    }
    updateActive();
  }, [entries, revision, loadingOlder, follow, updateActive, writeTop]);

  useLayoutEffect(() => {
    const content = contentNode;
    const viewport = viewportNode;
    if (!content || !viewport) return;
    const observer = new ResizeObserver(follow);
    observer.observe(content);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [follow, contentNode, viewportNode]);

  return {
    viewportRef,
    contentRef,
    bindViewport,
    bindContent,
    spacerRef,
    away,
    activeId,
    onScroll,
    onUserIntent,
    pin,
    jump,
    latest,
    captureAnchor,
  };
}
