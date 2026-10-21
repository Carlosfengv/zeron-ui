"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { animate } from "framer-motion";
import { spring } from "@zeron/ui/system/springs";
import type { AgentMessageTraceRow } from "./agent-message-trace-model";

export type TraceRowPresenceData = {
  visibleIds: ReadonlySet<string>;
  reduceMotion: boolean;
};

/** Shared disclosure behavior for the inspector and live virtualized trees. */
export function useTraceRowMotion(
  rows: readonly AgentMessageTraceRow[],
  totalHeight: number,
  viewportRef: RefObject<HTMLDivElement | null>,
  reduceMotion: boolean,
) {
  const visibleIds = useMemo(() => new Set(rows.map((row) => row.node.span.id)), [rows]);
  const previousVisibleIds = useRef(visibleIds);
  useEffect(() => { previousVisibleIds.current = visibleIds; }, [visibleIds]);
  const presenceData = useMemo(() => ({ visibleIds, reduceMotion }), [visibleIds, reduceMotion]);
  const [heldHeight, setHeldHeight] = useState(totalHeight);
  const scrollMotion = useRef<{ stop: () => void } | null>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || reduceMotion || totalHeight >= heldHeight) {
      setHeldHeight(totalHeight);
      return;
    }
    // Keep the old range while rows move, preventing native scroll clamping.
    const maxScroll = Math.max(0, totalHeight - viewport.clientHeight);
    if (viewport.scrollTop > maxScroll) {
      const controls = animate(viewport.scrollTop, maxScroll, {
        ...spring.moderate,
        onUpdate: (value) => { viewport.scrollTop = value; },
        onComplete: () => { scrollMotion.current = null; setHeldHeight(totalHeight); },
      });
      scrollMotion.current = controls;
      return () => { controls.stop(); scrollMotion.current = null; };
    }
    const timer = window.setTimeout(() => setHeldHeight(totalHeight), spring.moderate.duration * 1000);
    return () => window.clearTimeout(timer);
  }, [totalHeight, heldHeight, reduceMotion, viewportRef]);

  const interruptScrollMotion = () => {
    if (!scrollMotion.current) return;
    scrollMotion.current.stop();
    scrollMotion.current = null;
    setHeldHeight(totalHeight);
  };

  return { previousVisibleIds, presenceData, heldHeight, interruptScrollMotion };
}
