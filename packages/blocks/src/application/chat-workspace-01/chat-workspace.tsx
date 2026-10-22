"use client";

import { useEffect, useId, useRef, useState, type Ref } from "react";
import { ChatThread } from "@zeron/ui/chat-thread";
import { Button } from "@zeron/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, type ResizablePanelProps } from "@zeron/ui/resizable";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { resolveArtifactLabels } from "@zeron/ui/artifact-panel/labels";
import type { ChatWorkspaceProps } from "./chat-workspace-types";

type PanelHandle = NonNullable<ResizablePanelProps["panelRef"]> extends Ref<infer T> ? T : never;

export function ChatWorkspace({
  artifacts, title, headerActions, panelOpen, defaultPanelOpen = true, onPanelOpenChange,
  activePane, defaultActivePane = "chat", onActivePaneChange,
  chatDefaultSize = "38%", chatMinSize = "280px", artifactMinSize = "320px",
  onLayoutChanged, workspaceLabels, className, ...threadProps
}: ChatWorkspaceProps) {
  const labels = resolveArtifactLabels(threadProps.locale, workspaceLabels);
  const [internalOpen, setInternalOpen] = useState(defaultPanelOpen);
  const [internalPane, setInternalPane] = useState(defaultActivePane);
  const open = panelOpen ?? internalOpen;
  const pane = activePane ?? internalPane;
  const [wide, setWide] = useState(true);
  const root = useRef<HTMLDivElement>(null);
  const chat = useRef<PanelHandle>(null);
  const desktopSize = useRef(chatDefaultSize);
  const chatId = useId();
  const artifactId = useId();
  const CollapseIcon = useIcon("layout-align-right");
  const ExpandIcon = useIcon("layout-align-left");
  const PanelIcon = open ? CollapseIcon : ExpandIcon;

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setWide(node.clientWidth >= 760));
    setWide(node.clientWidth >= 760);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    chat.current?.resize(wide ? open ? desktopSize.current : "100%" : open && pane === "artifacts" ? "0%" : "100%");
  }, [wide, open, pane]);

  const setOpen = (next: boolean) => {
    if (panelOpen === undefined) setInternalOpen(next);
    onPanelOpenChange?.(next);
  };
  const setPane = (next: "chat" | "artifacts") => {
    if (activePane === undefined) setInternalPane(next);
    onActivePaneChange?.(next);
    if (next === "artifacts") setOpen(true);
  };
  const hideChat = !wide && open && pane === "artifacts";
  const hideArtifacts = !open || (!wide && pane === "chat");
  useEffect(() => {
    if (!hideChat) return;
    const frame = requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[data-slot="artifact-panel"] [role="tab"][aria-selected="true"]')?.focus());
    return () => cancelAnimationFrame(frame);
  }, [hideChat]);

  return <div ref={root} data-block="chat-workspace-01" data-layout={wide ? "horizontal" : "single"} className={cn("flex size-full min-h-0 min-w-0 flex-col overflow-hidden bg-surface-floating text-fg-default", className)}>
    <div className="flex shrink-0 items-center justify-between gap-3 border-b-hairline border-border px-4 py-2">
      <span data-slot="workspace-title" className="min-w-0 flex-1 truncate text-body font-medium" title={title ?? labels.workspace}>{title ?? labels.workspace}</span>
      <div className="flex shrink-0 items-center gap-1">
      {headerActions}
      {wide ? <Button variant="ghost" iconOnly aria-label={open ? labels.hidePanel : labels.showPanel} aria-expanded={open} aria-controls={artifactId} onClick={() => setOpen(!open)}><PanelIcon aria-hidden /></Button> :
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" active={!hideChat} aria-pressed={!hideChat} onClick={() => setPane("chat")}>{labels.conversation}</Button>
          <Button variant="ghost" size="sm" active={hideChat} aria-pressed={hideChat} onClick={() => setPane("artifacts")}>{labels.preview}</Button>
        </div>}
      </div>
    </div>
    <ResizablePanelGroup orientation="horizontal" disabled={!wide || !open} aria-label={labels.workspace} className="min-h-0 flex-1"
      onLayoutChanged={(layout, meta) => {
        if (meta.isUserInteraction && wide && open && layout[chatId] > 10 && layout[chatId] < 90) desktopSize.current = `${layout[chatId]}%`;
        onLayoutChanged?.(layout, meta);
      }}>
      <ResizablePanel id={chatId} panelRef={chat} defaultSize={chatDefaultSize} minSize={wide && open ? chatMinSize : "0%"} className={cn("overflow-hidden", hideChat && "invisible")} inert={hideChat} aria-hidden={hideChat || undefined}>
        <ChatThread {...threadProps} />
      </ResizablePanel>
      <ResizableHandle withHandle aria-label={labels.resize} className={(!wide || !open) ? "hidden" : undefined} />
      <ResizablePanel id={artifactId} minSize={wide && open ? artifactMinSize : "0%"} className={cn("overflow-hidden", hideArtifacts && "invisible")} inert={hideArtifacts} aria-hidden={hideArtifacts || undefined}>
        {artifacts}
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>;
}
