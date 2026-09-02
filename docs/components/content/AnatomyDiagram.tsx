"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { cn } from "@zeron/ui/system/utils";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocSection } from "@docs/components/content/DocPage";

export type AnatomySide = "top" | "bottom";

export interface AnatomyItem {
  /** Human-readable part name shown by the callout. */
  label: string;
  /** Selector resolved inside the rendered example. */
  target: string;
  /** Which side of the component receives the callout. */
  side: AnatomySide;
  /** 0 is the outer row; 1 moves the label closer to the component. */
  level?: 0 | 1;
  /** Fine-tune the preferred label position without changing its anchor. */
  offsetX?: number;
}

interface MeasuredItem extends AnatomyItem {
  anchorX: number;
  anchorY: number;
  labelX: number;
  labelY: number;
}

interface DiagramLayout {
  width: number;
  height: number;
  items: MeasuredItem[];
}

export interface AnatomyDiagramProps {
  items: readonly AnatomyItem[];
  /** Accessible name for the figure. */
  label: string;
  /** Optional selector for the component boundary where callout dots land. */
  boundaryTarget?: string;
  /** Remove product styling while retaining the measured component geometry. */
  wireframe?: boolean;
  /** Diagram height. Defaults to a compact 192px. */
  height?: CSSProperties["height"];
  className?: string;
  children: ReactNode;
}

export interface LocalizedAnatomyLabel {
  en: string;
  zh: string;
}

export interface LocalizedAnatomyItem extends Omit<AnatomyItem, "label"> {
  label: string | LocalizedAnatomyLabel;
}

interface AnatomySectionProps
  extends Omit<AnatomyDiagramProps, "items" | "label"> {
  code: string;
  component: string;
  items: readonly LocalizedAnatomyItem[];
}

const LABEL_GAP = 18;
const DIAGRAM_PADDING = 12;

function estimatedLabelWidth(label: string) {
  const width = Array.from(label).reduce(
    (total, character) => total + (/[^\u0000-\u00ff]/.test(character) ? 13 : 7.2),
    0,
  );
  return Math.min(184, Math.max(56, width + 12));
}

function distributeLabels(
  candidates: Array<{ index: number; desiredX: number; width: number }>,
  diagramWidth: number,
) {
  if (candidates.length === 0) return new Map<number, number>();

  const sorted = [...candidates].sort((a, b) => a.desiredX - b.desiredX);
  const positions = sorted.map((candidate) => {
    const half = candidate.width / 2;
    return Math.min(
      diagramWidth - DIAGRAM_PADDING - half,
      Math.max(DIAGRAM_PADDING + half, candidate.desiredX),
    );
  });

  for (let index = 1; index < sorted.length; index += 1) {
    const minimum =
      positions[index - 1] +
      sorted[index - 1].width / 2 +
      LABEL_GAP +
      sorted[index].width / 2;
    positions[index] = Math.max(positions[index], minimum);
  }

  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const half = sorted[index].width / 2;
    const maximum = index === sorted.length - 1
      ? diagramWidth - DIAGRAM_PADDING - half
      : positions[index + 1] -
        sorted[index + 1].width / 2 -
        LABEL_GAP -
        half;
    positions[index] = Math.min(positions[index], maximum);
  }

  return new Map(sorted.map((candidate, index) => [candidate.index, positions[index]]));
}

export function AnatomyDiagram({
  items,
  label,
  boundaryTarget,
  wireframe = true,
  height = 192,
  className,
  children,
}: AnatomyDiagramProps) {
  const containerRef = useRef<HTMLElement>(null);
  const exampleRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef(0);
  const [layout, setLayout] = useState<DiagramLayout | null>(null);

  const measure = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      const example = exampleRef.current;
      if (!container || !example) return;

      const containerRect = container.getBoundingClientRect();
      const boundary = boundaryTarget
        ? example.querySelector<HTMLElement>(boundaryTarget)
        : example.firstElementChild as HTMLElement | null;
      if (!boundary) return;

      if (wireframe) {
        example
          .querySelectorAll<HTMLElement>("[data-anatomy-boundary]")
          .forEach((element) => element.removeAttribute("data-anatomy-boundary"));
        boundary.setAttribute("data-anatomy-boundary", "");
      }

      const boundaryRect = boundary.getBoundingClientRect();
      const labelEdge = Math.min(28, Math.max(20, containerRect.height * 0.12));
      const labelRowGap = Math.min(52, Math.max(30, containerRect.height * 0.18));
      const measured = items.flatMap((item, index) => {
        const target = example.querySelector<HTMLElement>(item.target);
        if (!target) return [];
        const targetRect = target.getBoundingClientRect();
        const anchorX = targetRect.left - containerRect.left + targetRect.width / 2;
        return [{
          ...item,
          index,
          anchorX,
          anchorY: item.side === "top"
            ? boundaryRect.top - containerRect.top
            : boundaryRect.bottom - containerRect.top,
        }];
      });

      const labelPositions = new Map<number, number>();
      for (const side of ["top", "bottom"] as const) {
        for (const level of [0, 1] as const) {
          const row = measured
            .filter((item) => item.side === side && (item.level ?? 0) === level)
            .map((item) => ({
              index: item.index,
              desiredX: item.anchorX + (item.offsetX ?? 0),
              width: estimatedLabelWidth(item.label),
            }));
          distributeLabels(row, containerRect.width).forEach((value, key) => {
            labelPositions.set(key, value);
          });
        }
      }

      setLayout({
        width: containerRect.width,
        height: containerRect.height,
        items: measured.map((item) => ({
          ...item,
          labelX: labelPositions.get(item.index) ?? item.anchorX,
          labelY: item.side === "top"
            ? labelEdge + (item.level ?? 0) * labelRowGap
            : containerRect.height - labelEdge - (item.level ?? 0) * labelRowGap,
        })),
      });
    });
  }, [boundaryTarget, items, wireframe]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const example = exampleRef.current;
    if (!container || !example) return;

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(container);
    resizeObserver.observe(example);
    Array.from(example.querySelectorAll<HTMLElement>("*")).forEach((element) => {
      resizeObserver.observe(element);
    });

    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(example, { childList: true, subtree: true });
    void document.fonts?.ready.then(measure);

    return () => {
      cancelAnimationFrame(frameRef.current);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [measure]);

  return (
    <figure
      ref={containerRef}
      aria-label={label}
      className={cn(
        "relative w-full min-w-0 overflow-hidden text-fg-subtle",
        className,
      )}
      style={{ height }}
    >
      <div
        ref={exampleRef}
        data-anatomy-wireframe={wireframe || undefined}
        className={cn(
          "absolute left-1/2 top-1/2 z-content -translate-x-1/2 -translate-y-1/2",
          wireframe && [
            "pointer-events-none select-none",
            "[&_*]:!animate-none [&_*]:!transition-none",
            "[&_*]:!border-transparent [&_*]:!bg-transparent [&_*]:!shadow-none",
            "[&_*]:!text-fg-subtle",
            "[&_[data-anatomy-boundary]]:!border [&_[data-anatomy-boundary]]:!border-solid [&_[data-anatomy-boundary]]:!border-fg-subtle/60",
            "[&_[data-slot=checkbox]]:!border-fg-subtle/60",
            "[&_[data-slot=radio-group-item]]:!border-fg-subtle/60",
            "[&_[data-slot=switch-control]]:!border-fg-subtle/60",
            "[&_[data-slot=switch-thumb]]:!border [&_[data-slot=switch-thumb]]:!border-solid [&_[data-slot=switch-thumb]]:!border-fg-subtle/60",
            "[&_[data-slot=color-picker-swatch]]:!border [&_[data-slot=color-picker-swatch]]:!border-solid [&_[data-slot=color-picker-swatch]]:!border-fg-subtle/60",
            "[&_[data-slot=slider-thumb]>span:first-child]:!border [&_[data-slot=slider-thumb]>span:first-child]:!border-solid [&_[data-slot=slider-thumb]>span:first-child]:!border-fg-subtle/60",
            "[&_[data-slot=button-group-separator]]:!bg-fg-subtle/60",
          ],
        )}
      >
        {children}
      </div>

      {layout && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 size-full overflow-visible"
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          preserveAspectRatio="none"
        >
          {layout.items.map((item, index) => {
            const labelLineY = item.side === "top" ? item.labelY + 14 : item.labelY - 20;
            const elbowY = item.side === "top" ? item.anchorY - 18 : item.anchorY + 18;
            return (
              <g key={`${item.target}-${index}`}>
                <polyline
                  points={`${item.labelX},${labelLineY} ${item.labelX},${elbowY} ${item.anchorX},${elbowY} ${item.anchorX},${item.anchorY}`}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.5"
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                />
                <circle
                  cx={item.anchorX}
                  cy={item.anchorY}
                  r="3"
                  fill="currentColor"
                  fillOpacity="0.72"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={item.labelX}
                  y={item.labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current text-label font-normal"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      )}

      <figcaption className="sr-only">{label}</figcaption>
      <ul className="sr-only">
        {items.map((item) => <li key={`${item.target}-${item.label}`}>{item.label}</li>)}
      </ul>
    </figure>
  );
}

/** Shared documentation wrapper with locale-aware labels and compact chrome. */
export function AnatomySection({
  code,
  component,
  items,
  ...diagramProps
}: AnatomySectionProps) {
  const isChinese = useLocale().toLowerCase().startsWith("zh");
  const localizedItems = useMemo(() => items.map((item) => ({
    ...item,
    label: typeof item.label === "string"
      ? item.label
      : isChinese
        ? item.label.zh
        : item.label.en,
  })), [isChinese, items]);

  return (
    <DocSection title={isChinese ? "结构" : "Anatomy"}>
      <ComponentPreview code={code} inspectable={false} padding="none">
        <AnatomyDiagram
          {...diagramProps}
          items={localizedItems}
          label={isChinese ? `${component} 结构图` : `${component} anatomy`}
        />
      </ComponentPreview>
    </DocSection>
  );
}
