"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { spring } from "@zeron/ui/system/springs";
import { clampFloatingPosition, nearestFloatingDock, positionForDock, type DockPosition, type Point, type Viewport } from "./floating-preview-position";

interface DragGesture {
  pointerId: number;
  start: Point;
  origin: Point;
  moved: boolean;
}

function visibleViewport(): Viewport {
  const viewport = window.visualViewport;
  return { left: viewport?.offsetLeft ?? 0, top: viewport?.offsetTop ?? 0, width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight };
}

export function FloatingPreviewControls({ children, onDragStart }: { children: ReactNode; onDragStart?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const gesture = useRef<DragGesture | null>(null);
  const dock = useRef<DockPosition>({ edge: "right", fraction: 1 });
  const suppressClick = useRef(false);
  const [positioned, setPositioned] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const reposition = () => {
      const size = element.getBoundingClientRect();
      const position = positionForDock(dock.current, visibleViewport(), size);
      x.stop(); y.stop();
      x.set(position.x); y.set(position.y);
      setPositioned(true);
    };
    reposition();
    const observer = new ResizeObserver(reposition);
    observer.observe(element);
    window.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("resize", reposition);
    window.visualViewport?.addEventListener("scroll", reposition);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("resize", reposition);
      window.visualViewport?.removeEventListener("scroll", reposition);
      x.stop(); y.stop();
    };
  }, [x, y]);

  const finishGesture = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (!drag.moved) return;
    suppressClick.current = true;
    const size = event.currentTarget.getBoundingClientRect();
    const viewport = visibleViewport();
    dock.current = nearestFloatingDock({ x: x.get(), y: y.get() }, viewport, size);
    const position = positionForDock(dock.current, viewport, size);
    const transition = reduceMotion ? { duration: 0 } : spring.moderate;
    animate(x, position.x, transition);
    animate(y, position.y, transition);
  };

  return <motion.div ref={ref} data-slot="floating-preview-controls"
    className="pointer-events-auto absolute left-0 top-0 flex touch-none select-none"
    style={{ x, y, visibility: positioned ? "visible" : "hidden" }}
    onPointerDownCapture={(event) => {
      // Popup events bubble through React portals; only the trigger is draggable.
      if (!event.currentTarget.contains(event.target as Node) || event.button !== 0 || event.isPrimary === false) return;
      const button = (event.target as Element).closest("button");
      if (!button) return;
      event.stopPropagation();
      suppressClick.current = false;
      x.stop(); y.stop();
      gesture.current = { pointerId: event.pointerId, start: { x: event.clientX, y: event.clientY }, origin: { x: x.get(), y: y.get() }, moved: false };
      button.setPointerCapture(event.pointerId);
    }}
    onMouseDownCapture={(event) => {
      if (event.currentTarget.contains(event.target as Node)) event.stopPropagation();
    }}
    onPointerMoveCapture={(event) => {
      const drag = gesture.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.start.x;
      const dy = event.clientY - drag.start.y;
      if (!drag.moved && Math.hypot(dx, dy) < 6) return;
      if (!drag.moved) { drag.moved = true; onDragStart?.(); }
      event.preventDefault(); event.stopPropagation();
      const position = clampFloatingPosition({ x: drag.origin.x + dx, y: drag.origin.y + dy }, visibleViewport(), event.currentTarget.getBoundingClientRect());
      x.set(position.x); y.set(position.y);
    }}
    onPointerUpCapture={finishGesture}
    onPointerCancelCapture={finishGesture}
    onLostPointerCapture={finishGesture}
    onClickCapture={(event) => {
      if (!event.currentTarget.contains(event.target as Node)) return;
      if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
      suppressClick.current = false;
    }}>
    {children}
  </motion.div>;
}
