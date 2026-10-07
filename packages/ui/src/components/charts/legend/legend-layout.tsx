"use client";

import { type ReactNode, useId, useLayoutEffect, useRef, useState } from "react";
import { cn } from "#system/utils";

export interface LegendLayoutOptions {
  /** One item per row or compact items alongside each other. Default: stack */
  layout?: "stack" | "inline";
  /** Wrap items or collapse the ones that do not fit. Default: wrap */
  overflow?: "wrap" | "collapse";
  /** Optional item limit while collapsed; only used with overflow=collapse. */
  maxVisibleItems?: number;
  /** Customize/localize the expand and collapse button. */
  renderOverflowLabel?: (hiddenCount: number, expanded: boolean) => ReactNode;
}

function itemLimit(length: number, limit?: number) {
  return limit === undefined || !Number.isFinite(limit)
    ? length : Math.max(0, Math.min(length, Math.floor(limit)));
}

/** Reserve the disclosure button before admitting each complete label/value pair. */
export function fitLegendItems(widths: number[], available: number, disclosureWidth: number, gap: number, limit?: number) {
  const maximum = itemLimit(widths.length, limit);
  const total = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, widths.length - 1) * gap;
  if (maximum === widths.length && total <= available) return maximum;
  let used = 0;
  let count = 0;
  for (const width of widths.slice(0, maximum)) {
    const next = used + (count > 0 ? gap : 0) + width;
    if (next + gap + disclosureWidth > available) break;
    used = next;
    count += 1;
  }
  return count;
}

const disclosureClass = "max-w-full shrink-0 rounded-lg px-2 py-1.5 text-body text-fg-muted break-words hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring";
const defaultOverflowLabel = (count: number, expanded: boolean) => expanded ? "Show less" : `+${count} more`;

export function LegendLayout({
  items,
  layout = "stack",
  overflow = "wrap",
  maxVisibleItems,
  renderOverflowLabel = defaultOverflowLabel,
}: LegendLayoutOptions & { items: ReactNode[] }) {
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const focusDisclosure = useRef(false);
  const focusLayout = useRef(false);
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const [measuredCount, setMeasuredCount] = useState(items.length);
  const limit = itemLimit(items.length, maxVisibleItems);
  const count = overflow === "collapse" ? Math.min(limit, layout === "inline" ? measuredCount : limit) : items.length;
  const hiddenCount = items.length - count;
  const visibleCount = expanded || overflow !== "collapse" ? items.length : count;

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || layout !== "inline" || overflow !== "collapse") return;
    const nodes = [...row.querySelectorAll<HTMLElement>(":scope > [data-slot=legend-layout-item]")];
    const measure = () => {
      if (row.clientWidth <= 0) return;
      const gap = Number.parseFloat(getComputedStyle(row).columnGap) || 0;
      const next = fitLegendItems(nodes.map(node => node.offsetWidth), row.clientWidth, measureRef.current?.offsetWidth ?? 0, gap, maxVisibleItems);
      if (!expanded && nodes.slice(next).some(node => node.contains(document.activeElement))) focusDisclosure.current = true;
      if (next === items.length && buttonRef.current === document.activeElement) focusLayout.current = true;
      setMeasuredCount(previous => previous === next ? previous : next);
    };
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    [row, ...nodes, measureRef.current].forEach(node => { if (node) observer?.observe(node); });
    let active = true;
    document.fonts?.ready.then(() => { if (active) measure(); });
    return () => { active = false; observer?.disconnect(); };
  }, [items, layout, overflow, maxVisibleItems, expanded, renderOverflowLabel]);

  useLayoutEffect(() => {
    if (focusDisclosure.current) {
      buttonRef.current?.focus();
      focusDisclosure.current = false;
    }
    if (focusLayout.current) {
      rowRef.current?.focus();
      focusLayout.current = false;
    }
  }, [visibleCount, hiddenCount]);

  return <div
    ref={rowRef}
    id={listId}
    data-slot="legend-layout"
    data-layout={layout}
    data-overflow={overflow}
    tabIndex={-1}
    className={cn("relative flex min-w-0 max-w-full gap-x-4 gap-y-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-focus-ring", layout === "stack" ? "flex-col" : "items-start", layout === "inline" && (overflow === "wrap" || expanded) && "flex-wrap")}
    style={{ overflow: overflow === "collapse" && !expanded ? "hidden" : undefined }}
  >
    {items.map((item, index) => {
      const hidden = index >= visibleCount;
      return <div
        key={index}
        data-slot="legend-layout-item"
        aria-hidden={hidden ? true : undefined}
        inert={hidden ? true : undefined}
        className={cn("min-w-0 max-w-full", layout === "inline" && "shrink-0", hidden && "pointer-events-none invisible absolute")}
        style={hidden ? { top: 0, left: 0 } : undefined}
      >{item}</div>;
    })}
    {overflow === "collapse" && <span ref={measureRef} aria-hidden="true" inert
      className={cn(disclosureClass, "pointer-events-none invisible absolute")}
      style={{ top: 0, left: 0 }}
    >{renderOverflowLabel(items.length, false)}</span>}
    {overflow === "collapse" && hiddenCount > 0 && <button
      ref={buttonRef}
      type="button"
      data-slot="legend-overflow-button"
      aria-expanded={expanded}
      aria-controls={listId}
      className={disclosureClass}
      onClick={() => setExpanded(value => !value)}
    >{renderOverflowLabel(hiddenCount, expanded)}</button>}
  </div>;
}
