"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { FileType } from "@zeron/ui/file-type";
import { MenuItem } from "@zeron/ui/menu-item";
import { TabItem, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import type { ArtifactLabels, ArtifactPanelProps, ArtifactResource } from "./chat-workspace-types";

/** Keep the selected resource visible and fit complete tabs in their original order. */
export function visibleArtifactIds(resources: readonly ArtifactResource[], activeId: string, widths: readonly number[], available: number, moreWidth: number, gap: number): Set<string> {
  if (available <= 0 || widths.length !== resources.length || widths.some((width) => width <= 0)) return new Set(resources.map((resource) => resource.id));
  if (widths.reduce((sum, width) => sum + width, 0) + Math.max(0, resources.length - 1) * gap <= available) return new Set(resources.map((resource) => resource.id));
  const activeIndex = Math.max(0, resources.findIndex((resource) => resource.id === activeId));
  const visible = new Set([resources[activeIndex].id]);
  let used = widths[activeIndex];
  const budget = available - moreWidth;
  resources.forEach((resource, index) => {
    if (index !== activeIndex && used + gap + widths[index] <= budget) {
      visible.add(resource.id);
      used += gap + widths[index];
    }
  });
  return visible;
}

export function ArtifactTabs({ resources, activeId, labels, onSelect, onClose, addAction }: {
  resources: readonly ArtifactResource[];
  activeId: string;
  labels: ArtifactLabels;
  onSelect: (id: string) => void;
} & Pick<ArtifactPanelProps, "onClose" | "addAction">) {
  const availableRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ available: 0, widths: [] as number[], moreWidth: 0, gap: 0 });
  const Globe = useIcon("globe");
  const More = useIcon("ellipsis");
  const closable = !!onClose;
  // Content and review updates do not change tab geometry (for example while a reply streams).
  const measurementKey = JSON.stringify(resources.map(({ id, name, kind }) => [id, name, kind]));
  useLayoutEffect(() => {
    const available = availableRef.current;
    const measurement = measureRef.current;
    const more = moreRef.current;
    if (!available || !measurement || !more) return;
    const measure = () => {
      const widths = Array.from(measurement.querySelectorAll<HTMLElement>("[data-measure-artifact]")).map((tab) => (tab.closest<HTMLElement>('[data-slot="closable-tab"]') ?? tab).getBoundingClientRect().width);
      const gap = parseFloat(getComputedStyle(measurement).columnGap) || 0;
      const actionGap = parseFloat(getComputedStyle(available).columnGap) || 0;
      const next = { available: available.clientWidth, widths, gap, moreWidth: more.getBoundingClientRect().width + actionGap };
      setLayout((current) => current.available === next.available && current.moreWidth === next.moreWidth && current.gap === gap && current.widths.length === widths.length && current.widths.every((width, index) => width === widths[index]) ? current : next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(available);
    observer.observe(measurement);
    observer.observe(more);
    return () => observer.disconnect();
  }, [measurementKey, activeId, closable]);
  const visible = visibleArtifactIds(resources, activeId, layout.widths, layout.available, layout.moreWidth, layout.gap);
  const leading = (resource: ArtifactResource) => resource.kind === "url" ? <Globe size={16} aria-hidden /> : <FileType fileName={resource.name} variant="mono" size="mini" aria-hidden />;
  const focusSelected = (id: string) => requestAnimationFrame(() => {
    Array.from(availableRef.current?.querySelectorAll<HTMLElement>("[data-artifact-id]") ?? []).find((tab) => tab.dataset.artifactId === id)?.focus();
  });
  return <div data-slot="artifact-tab-bar" className="relative flex shrink-0 items-center gap-2 border-b-hairline border-border bg-surface-floating p-2">
    <div ref={availableRef} className="flex min-w-0 flex-1 items-center gap-2">
      <div className="min-w-0 flex-1">
        <TabsList aria-label={labels.resources}>
          {resources.filter((resource) => visible.has(resource.id)).map((resource) => <TabItem key={resource.id} value={resource.id} label={resource.name} title={resource.name} data-artifact-id={resource.id} leading={leading(resource)}
            closeLabel={labels.close(resource.name)} onClose={onClose ? () => onClose(resource) : undefined}
            onKeyDown={(event) => { if (onClose && event.key === "Delete") { event.preventDefault(); onClose(resource); } }} />)}
        </TabsList>
      </div>
      {visible.size < resources.length && <DropdownMenu>
        <DropdownTrigger render={<Button iconOnly size="sm" variant="tertiary" aria-label={labels.more}><More aria-hidden /></Button>} />
        <DropdownContent align="end" aria-label={labels.resources} checkedIndex={resources.findIndex((resource) => resource.id === activeId)}>
          {resources.map((resource, index) => <MenuItem key={resource.id} index={index} label={resource.name} leading={leading(resource)} checked={resource.id === activeId}
            onSelect={() => { onSelect(resource.id); focusSelected(resource.id); }} />)}
        </DropdownContent>
      </DropdownMenu>}
    </div>
    {addAction && <div className="shrink-0">{addAction}</div>}
    {/* Measure the same public tabs offscreen; this copy is inert and never navigable. */}
    <div aria-hidden inert className="pointer-events-none invisible absolute inset-0 overflow-hidden">
      <div className="flex w-max items-center">
      <Tabs value={activeId} variant="segment" color="default">
        <TabsList ref={measureRef}>
          {resources.map((resource) => <TabItem key={resource.id} value={resource.id} label={resource.name} data-measure-artifact leading={leading(resource)} onClose={onClose ? () => {} : undefined} />)}
        </TabsList>
      </Tabs>
      <div ref={moreRef}><Button iconOnly size="sm" variant="tertiary" tabIndex={-1}><More aria-hidden /></Button></div>
      </div>
    </div>
  </div>;
}
