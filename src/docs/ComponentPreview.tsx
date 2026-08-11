"use client";

import { useState, useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { routeKeyboardOnMouseDown } from "@/docs/click-to-focus";
import { useShape } from "@/lib/shape-context";
import { useIcon } from "@/lib/icon-context";
import { Tabs, TabsList, TabItem } from "@/components/ui/tabs";
import { Tooltip } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

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
  children,
}: ComponentPreviewProps) {
  const t = useTranslations("preview");
  const [tab, setTab] = useState(0);
  const [inspect, setInspect] = useState(false);
  const [highlighted, setHighlighted] = useState<{
    code: string;
    html: string;
  } | null>(null);
  const [highlightFailedFor, setHighlightFailedFor] = useState<string | null>(null);
  const shape = useShape();
  const ReplayIcon = useIcon("rotate-ccw");
  const previewRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Clicking an empty part of the preview routes keyboard control into the demo
  // (focuses its first interactive element); :focus-within then shows the
  // contrasted border. Clicking outside / Tab away hands keys back to the page.
  const handlePreviewMouseDown = (e: MouseEvent<HTMLDivElement>) =>
    routeKeyboardOnMouseDown(e, previewRef.current);

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

  const showButton = !!playbackButton || !!onReplay;
  // Inspect only applies to the live Preview tab. When on, reserve a strip at
  // the top/left of the frame for the rulers (so they sit above the toggles and
  // fit the outer border without overlapping the header or content).
  const inspecting = inspectable && inspect && tab === 0;

  return (
    <div
      ref={frameRef}
      className={`relative flex flex-col gap-0 w-full border border-border/60 transition-[border-color] duration-150 ease-out focus-within:border-foreground/40 ${shape.container}`}
    >
      {/* Tab bar — min-height reserves the playback button's height (h-10 + pt-3)
          so the header doesn't shift when the button mounts/unmounts. A hairline
          along the bottom separates it from the preview/code below. Its own
          opaque background sits above the inspect overlay (z-40 > z-30) so the
          ruler ticks tuck cleanly under it. */}
      <div
        className="relative z-40 flex items-center gap-0 px-3 py-3 min-h-[52px] border-b border-border/60 bg-background"
        style={{ borderTopLeftRadius: "inherit", borderTopRightRadius: "inherit" }}
      >
        {title && (
          <span
            className="px-4 py-2.5 text-foreground mr-auto font-semibold"
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
              className="h-8 px-2 rounded-md"
            />
          )}
          {showButton && (
            <Tooltip content={playbackButton?.tooltip ?? t("replayAnimation")} side="top">
              <button
                onClick={playbackButton?.onClick ?? onReplay}
                className={`w-10 h-10 flex items-center justify-center ${shape.button} text-muted-foreground/60 hover:text-foreground hover:bg-hover transition-colors duration-100 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]`}
                aria-label={playbackButton?.tooltip ?? t("replayAnimation")}
              >
                {playbackButton?.icon ?? <ReplayIcon size={16} strokeWidth={1.5} />}
              </button>
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
        className="overflow-hidden"
        style={{
          borderBottomLeftRadius: "inherit",
          borderBottomRightRadius: "inherit",
        }}
      >
        {tab === 0 ? (
          <div
            ref={previewRef}
            onMouseDown={handlePreviewMouseDown}
            className={`relative flex ${align === "bottom" ? "items-end" : "items-center"} justify-center ${minHeightClass} bg-background ${
              padding === "none"
                ? ""
                : padding === "compact"
                  ? "px-4 py-4"
                  : padding === "responsive"
                    ? "px-4 py-4 sm:px-8 sm:py-12"
                    : "px-8 py-12"
            }`}
          >
            {children}
          </div>
        ) : html ? (
          <div
            className={`overflow-auto text-[13px] [&_pre]:m-0 [&_pre]:p-4 ${minHeightClass.replace("min-h-", "[&_pre]:min-h-")} [&_.shiki]:!bg-transparent`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : highlightFailedFor === code ? (
          <pre
            className={`m-0 overflow-auto p-4 text-[13px] text-foreground ${minHeightClass}`}
          >
            <code>{code.trim()}</code>
          </pre>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center justify-center text-[13px] text-muted-foreground ${minHeightClass}`}
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
  );
}
