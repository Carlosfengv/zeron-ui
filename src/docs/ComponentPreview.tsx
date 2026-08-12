"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useShape } from "@/lib/shape-context";
import { useIcon } from "@/lib/icon-context";
import { Tabs, TabsList, TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { PortalContainerProvider } from "@/lib/portal-container-context";

const InspectOverlay = dynamic(() =>
  import("./InspectOverlay").then((module) => module.InspectOverlay)
);

export interface PlaybackButton {
  icon: ReactNode;
  tooltip: string;
  onClick: () => void;
}

interface ComponentPreviewProps {
  title?: string;
  code: string;
  /** Legacy replay callback */
  onReplay?: () => void;
  /** Custom playback button (overrides onReplay) */
  playbackButton?: PlaybackButton;
  /** Padding around the preview content. Use "compact" when the demo
   *  is a self-contained block that already supplies its own breathing
   *  room (dialogs, full-bleed cards). "responsive" is compact on mobile
   *  and default on desktop — for big demos that feel cramped on phones.
   *  "none" removes the padding entirely so the demo bleeds to the
   *  preview frame (full-width tables, scroll areas).
   *  Defaults to "default". */
  padding?: "default" | "compact" | "responsive" | "none";
  /** Override the minimum height of the preview area. Accepts any Tailwind
   *  min-height class (e.g. `min-h-[280px]`). Defaults to `min-h-[120px]`.
   *  Useful when a demo opens floating UI (popovers, dropdowns) that needs
   *  vertical room. */
  minHeightClass?: string;
  /** Vertical alignment of the preview content. Defaults to "center". */
  align?: "center" | "bottom";
  /** Show the Inspect toggle (pixel rulers + box-model inspector). Defaults to
   *  true; set false for previews where an overlay would get in the way. */
  inspectable?: boolean;
  /** Let the live preview expand to the browser's native full-screen mode. */
  fullScreenable?: boolean;
  children: ReactNode;
}

export function ComponentPreview({
  title,
  code,
  onReplay,
  playbackButton,
  padding = "default",
  minHeightClass = "min-h-[120px]",
  align = "center",
  inspectable = true,
  fullScreenable = false,
  children,
}: ComponentPreviewProps) {
  const t = useTranslations("preview");
  const [tab, setTab] = useState(0);
  const [inspect, setInspect] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [highlighted, setHighlighted] = useState<{
    code: string;
    html: string;
  } | null>(null);
  const [highlightFailedFor, setHighlightFailedFor] = useState<string | null>(null);
  const shape = useShape();
  const ReplayIcon = useIcon("rotate-ccw");
  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameElement, setFrameElement] = useState<HTMLDivElement | null>(null);
  const setFrameRef = useCallback((node: HTMLDivElement | null) => {
    frameRef.current = node;
    setFrameElement(node);
  }, []);

  const toggleFullscreen = () => {
    const frame = frameRef.current;
    if (!frame) return;

    if (document.fullscreenElement === frame) {
      void document.exitFullscreen().catch(() => {});
      return;
    }

    void frame.requestFullscreen().catch(() => {});
  };

  const html = highlighted?.code === code ? highlighted.html : "";

  // Syntax highlighting is intentionally absent from the initial page load.
  // Load Shiki only when the Code tab is opened, then reuse the result while
  // this preview stays mounted. highlight() also maintains a module-level cache
  // so revisiting a page does not repeat the work.
  useEffect(() => {
    if (tab !== 1 || html) return;

    let cancelled = false;

    import("./highlight")
      .then(({ highlight }) => highlight(code))
      .then((result) => {
        if (!cancelled) {
          setHighlightFailedFor(null);
          setHighlighted({ code, html: result });
        }
      })
      .catch(() => {
        if (!cancelled) setHighlightFailedFor(code);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, code, html]);

  useEffect(() => {
    if (!fullScreenable) return;
    const syncFullscreenState = () => setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [fullScreenable]);

  const showButton = !!playbackButton || !!onReplay;
  // Inspect only applies to the live Preview tab. When on, reserve a strip at
  // the top/left of the frame for the rulers (so they sit above the toggles and
  // fit the outer border without overlapping the header or content).
  const inspecting = inspectable && inspect && tab === 0;

  return (
    <PortalContainerProvider value={isFullscreen ? frameElement : null}>
      <div
        ref={setFrameRef}
        className={`relative flex flex-col gap-0 w-full border border-border-subtle transition-[border-color] duration-moderate ease-out has-[:focus-visible]:border-fg-default/40 ${shape.container} ${isFullscreen ? "h-svh w-screen rounded-none" : ""}`}
      >
      {/* Tab bar — min-height reserves the playback button's height (h-10 + pt-3)
          so the header doesn't shift when the button mounts/unmounts. A hairline
          along the bottom separates it from the preview/code below. Its own
          opaque background sits above the inspect overlay (z-40 > z-30) so the
          ruler ticks tuck cleanly under it. */}
      <div
        className="relative z-40 flex items-center gap-0 px-3 py-3 min-h-[52px] border-b border-border-subtle bg-surface-base"
        style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      >
        {title && (
          <span
            className="px-4 py-2.5 text-fg-default mr-auto font-semibold"
          >
            {title}
          </span>
        )}
        <Tabs value={String(tab)} onValueChange={(value) => setTab(Number(value))} variant="segment">
          <TabsList activationMode="manual">
            <TabItem value="0" label={t("preview")} />
            <TabItem value="1" label={t("code")} />
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-1">
          {inspectable && tab === 0 && (
            <Switch
              label={t("inspect")}
              checked={inspect}
              onToggle={() => setInspect((v) => !v)}
              className="h-8 px-2 rounded-control"
            />
          )}
          {fullScreenable && tab === 0 && (
            <Tooltip content={isFullscreen ? t("exitFullscreen") : t("fullscreen")} side="top">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={isFullscreen ? t("exitFullscreen") : t("fullscreen")}
                onClick={toggleFullscreen}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" />
                </svg>
              </Button>
            </Tooltip>
          )}
          {showButton && (
            <Tooltip content={playbackButton?.tooltip ?? t("replayAnimation")} side="top">
              <Button
                variant="ghost"
                size="icon"
                onClick={playbackButton?.onClick ?? onReplay}
                className="h-10 w-10 text-fg-muted/60"
                aria-label={playbackButton?.tooltip ?? t("replayAnimation")}
              >
                {playbackButton?.icon ?? <ReplayIcon size={16} strokeWidth={1.5} />}
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Content. Wrapped so its rectangular bottom corners get clipped
          to the outer container's rounded shape (rounded-xl / rounded-3xl
          depending on shape). overflow-hidden alone on the outer would
          re-clip the Tabs focus ring above; this scoped clipper
          uses `border-bottom-*-radius: inherit` so it adopts whichever
          shape is active, and leaves the top corners square (the tab
          bar sits above, well below the outer's curved top edge). */}
      <div
        className={`overflow-hidden ${isFullscreen ? "flex flex-1 flex-col" : ""}`}
        style={{
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
        }}
      >
        {tab === 0 ? (
          <div
            ref={previewRef}
            data-slot="component-preview-content"
            data-fullscreen={isFullscreen || undefined}
            className={`group/preview-content relative flex ${isFullscreen ? "flex-1" : ""} ${align === "bottom" ? "items-end" : "items-center"} justify-center ${minHeightClass} bg-surface-floating ${
              padding === "none"
                ? "p-0"
                : padding === "compact"
                  ? "px-3 py-3"
                  : padding === "responsive"
                    ? "px-4 py-4 sm:px-8 sm:py-12"
                    : "px-8 py-12"
            }`}
          >
            {children}
          </div>
        ) : html ? (
          <div
            className={`overflow-auto text-label [&_pre]:m-0 [&_pre]:p-4 ${minHeightClass.replace("min-h-", "[&_pre]:min-h-")} [&_.shiki]:!bg-transparent`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : highlightFailedFor === code ? (
          <pre
            className={`m-0 overflow-auto p-4 text-label text-fg-default ${minHeightClass}`}
          >
            <code>{code.trim()}</code>
          </pre>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-center text-label text-fg-muted ${minHeightClass}`}
          >
            {t("highlighting")}
          </div>
        )}
      </div>

      {/* Inspector — sits over the whole frame so its rulers reach the outer
          border and clear the header toggles. Fades in/out with the toggle. */}
      <AnimatePresence>
        {inspecting && (
          <InspectOverlay key="inspect" frameRef={frameRef} contentRef={previewRef} />
        )}
      </AnimatePresence>
      </div>
    </PortalContainerProvider>
  );
}
