"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import { useIcon } from "@zeron/icons/context";
import { Tabs, TabsList, TabItem } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { Switch } from "@zeron/ui/switch";
import { Button } from "@zeron/ui/button";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { PortalContainerProvider } from "@zeron/ui/system/portal-container-context";
import { cn } from "@zeron/ui/system/utils";

const InspectOverlay = dynamic(() =>
  import("@docs/components/playground/InspectOverlay").then((module) => module.InspectOverlay)
);

export interface PlaybackButton {
  icon: ReactNode;
  tooltip: string;
  onClick: () => void;
}

interface ComponentPreviewProps {
  className?: string;
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
  align?: "center" | "top" | "bottom";
  /** Show the Inspect toggle (pixel rulers + box-model inspector). Defaults to
   *  true; set false for previews where an overlay would get in the way. */
  inspectable?: boolean;
  /** Let the live preview expand to the browser's native full-screen mode. */
  fullScreenable?: boolean;
  /** A dedicated, chrome-free preview URL. When provided, the preview action
   *  opens this URL in a separate tab instead of requesting native fullscreen. */
  standaloneHref?: string;
  /** Stretch the preview and its active panel to fill the available height. */
  fill?: boolean;
  /** Allow wheel or trackpad scrolling to continue to the document after the
   *  live preview reaches its top or bottom edge. */
  allowScrollChaining?: boolean;
  /** Render the preview in a browser-like frame. Intended for full block demos. */
  browserFrame?: boolean;
  children: ReactNode;
}

export function ComponentPreview({
  className,
  title,
  code,
  onReplay,
  playbackButton,
  padding = "default",
  minHeightClass = "min-h-[120px]",
  align = "center",
  inspectable = true,
  fullScreenable = false,
  standaloneHref,
  fill = false,
  allowScrollChaining = false,
  browserFrame = false,
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
  const ReplayIcon = useIcon("rotate-ccw");
  const SearchIcon = useIcon("search");
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

    import("@docs/lib/highlight")
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
        className={cn(
          "relative flex w-full flex-col gap-0 duration-moderate ease-out has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-fg-default/40",
          browserFrame
            ? "overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating shadow-control"
            : "rounded-3xl bg-surface-raised p-2",
          fill && "h-full min-h-0",
          isFullscreen && "h-svh w-screen rounded-none",
          className,
        )}
      >
      {/* Tab bar — min-height reserves the playback button's height (h-10 + pt-3)
          so the header doesn't shift when the button mounts/unmounts. A hairline
          along the bottom separates it from the preview/code below. Its own
          opaque background sits above the inspect overlay (z-40 > z-30) so the
          ruler ticks tuck cleanly under it. */}
      <div
        className={cn(
          "relative z-40 flex shrink-0 items-center justify-between gap-1",
          browserFrame
            ? "h-11 border-b border-border-subtle bg-surface-floating px-3 sm:grid sm:grid-cols-[minmax(6rem,1fr)_auto_minmax(6rem,1fr)] sm:px-4"
            : "px-1.5 py-1",
        )}
      >
        <div className={cn("flex min-w-0 items-center gap-1", browserFrame && "sm:justify-self-start")}>
          {browserFrame && (
            <div aria-hidden="true" className="flex shrink-0 items-center gap-2">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" />
              <span className="size-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="size-2.5 rounded-full bg-[#28c840]" />
            </div>
          )}
          {title && !browserFrame && (
            <span className="truncate px-4 py-2.5 text-fg-default font-semibold">
              {title}
            </span>
          )}
          {!browserFrame && (
            <Tabs value={String(tab)} onValueChange={(value) => setTab(Number(value))} variant="segment">
              <TabsList activationMode="manual">
                <TabItem value="0" label={t("preview")} />
                <TabItem value="1" label={t("code")} />
              </TabsList>
            </Tabs>
          )}
        </div>
        {browserFrame && title && (
          <div className="hidden max-w-[24rem] items-center gap-2 truncate rounded-full bg-surface-raised px-3 py-1.5 text-label text-fg-muted sm:flex">
            <SearchIcon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={1.5} />
            <span className="truncate">block preview / {title.replace(/\.tsx$/, "")}</span>
          </div>
        )}
        <div className={cn("ml-auto flex shrink-0 items-center gap-1", browserFrame && "sm:ml-0 sm:justify-self-end")}>
          {browserFrame && (
            <Tabs value={String(tab)} onValueChange={(value) => setTab(Number(value))} variant="segment">
              <TabsList activationMode="manual">
                <TabItem value="0" label={t("preview")} />
                <TabItem value="1" label={t("code")} />
              </TabsList>
            </Tabs>
          )}
          {inspectable && tab === 0 && (
            <Switch
              label={t("inspect")}
              checked={inspect}
              onToggle={() => setInspect((v) => !v)}
              className="h-8 px-2 rounded-lg"
            />
          )}
          {standaloneHref && (
            <Tooltip content={t("openStandalone")} side="top">
              <Button
                asChild
                variant="ghost"
                iconOnly
                size="sm"
                className="h-8 w-8"
              >
                <a
                  aria-label={t("openStandalone")}
                  href={standaloneHref}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 3h7v7M21 3l-9 9M11 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                  </svg>
                </a>
              </Button>
            </Tooltip>
          )}
          {fullScreenable && !standaloneHref && tab === 0 && (
            <Tooltip content={isFullscreen ? t("exitFullscreen") : t("fullscreen")} side="top">
              <Button
                variant="ghost"
                iconOnly
                size="sm"
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
                iconOnly
                size="lg"
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
        className={cn(
          "overflow-hidden",
          browserFrame ? "rounded-none border-0" : "rounded-2xl border-[0.5px] border-border",
          (isFullscreen || fill) && "flex min-h-0 flex-1 flex-col",
        )}
      >
        {tab === 0 ? (
          <div
            ref={previewRef}
            data-slot="component-preview-content"
            data-fullscreen={isFullscreen || undefined}
            className={cn(
              "group/preview-content relative flex justify-center bg-surface-floating",
              isFullscreen || fill
                ? cn(
                  "min-h-0 flex-1 overflow-y-auto [&>*]:min-h-full [&>*]:w-full [&>*]:min-w-0",
                  !allowScrollChaining && "overscroll-contain",
                )
                : minHeightClass,
              align === "bottom" ? "items-end" : align === "top" ? "items-start" : "items-center",
              padding === "none"
                ? "p-0"
                : padding === "compact"
                  ? "px-3 py-3"
                  : padding === "responsive"
                    ? "px-4 py-4 sm:px-8 sm:py-12"
                    : "px-8 py-12"
            )}
          >
            {children}
          </div>
        ) : html ? (
          <div
            className={`overflow-auto bg-surface-floating text-label [&_pre]:m-0 [&_pre]:p-4 ${fill ? "min-h-0 flex-1 [&_pre]:min-h-full" : minHeightClass.replace("min-h-", "[&_pre]:min-h-")}`}
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
