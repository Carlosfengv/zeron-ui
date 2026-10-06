"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FloatingPreviewControls } from "./FloatingPreviewControls";

const PreviewToolbarContext = createContext<{
  target: HTMLDivElement | null;
  setTarget: (target: HTMLDivElement | null) => void;
  floating: boolean;
} | null>(null);

/** Each preview owns its slot. Demo state stays with the mounted demo. */
export function PreviewToolbarProvider({ children, floating = false }: { children: ReactNode; floating?: boolean }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  const value = useMemo(() => ({ target, setTarget, floating }), [target, floating]);
  return <PreviewToolbarContext.Provider value={value}>{children}</PreviewToolbarContext.Provider>;
}

export function PreviewToolbarSlot({ className }: { className?: string }) {
  const toolbar = useContext(PreviewToolbarContext);
  return <div ref={toolbar?.setTarget} className={toolbar?.floating ? "pointer-events-none fixed inset-0 z-popover empty:hidden" : className} data-slot="preview-demo-settings" data-floating={toolbar?.floating || undefined} />;
}

export function usePreviewToolbarFloating() {
  return useContext(PreviewToolbarContext)?.floating ?? false;
}

export function PreviewToolbarPortal({ children, onDragStart }: { children: ReactNode; onDragStart?: () => void }) {
  const toolbar = useContext(PreviewToolbarContext);
  if (!toolbar) return children;
  return toolbar.target ? createPortal(toolbar.floating ? <FloatingPreviewControls onDragStart={onDragStart}>{children}</FloatingPreviewControls> : children, toolbar.target) : null;
}
