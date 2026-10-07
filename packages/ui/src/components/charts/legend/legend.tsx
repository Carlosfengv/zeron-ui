"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  useState,
} from "react";
import { cn } from "#system/utils";
import {
  type LegendItemData,
  LegendItemProvider,
  LegendProvider,
} from "./legend-context";
import { LegendLayout, type LegendLayoutOptions } from "./legend-layout";

export interface LegendProps extends LegendLayoutOptions {
  /** Legend items data */
  items: LegendItemData[];
  /** Controlled hover state */
  hoveredIndex?: number | null;
  /** Hover state change callback */
  onHoverChange?: (index: number | null) => void;
  /** Title shown above the legend */
  title?: string;
  /** Title class name */
  titleClassName?: string;
  /** Container class name */
  className?: string;
  /** Children - should contain a single LegendItem that will be mapped for each item */
  children: ReactElement;
}

export function Legend({
  items,
  hoveredIndex: controlledHoveredIndex,
  onHoverChange,
  title,
  titleClassName = "text-body font-semibold",
  className = "",
  children,
  layout,
  overflow,
  maxVisibleItems,
  renderOverflowLabel,
}: LegendProps) {
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<
    number | null
  >(null);

  // Controlled or uncontrolled hover state
  const isControlled = controlledHoveredIndex !== undefined;
  const hoveredIndex = isControlled
    ? controlledHoveredIndex
    : internalHoveredIndex;
  const setHoveredIndex = (index: number | null) => {
    if (isControlled) {
      onHoverChange?.(index);
    } else {
      setInternalHoveredIndex(index);
    }
  };

  const contextValue = {
    items,
    hoveredIndex,
    setHoveredIndex,
    layout,
  };

  return (
    <LegendProvider value={contextValue}>
      <div data-slot="legend" className={cn("flex min-w-0 flex-col gap-2", className)}>
        {title && (
          <h3 className={cn("mb-1 text-fg-default", titleClassName)}>
            {title}
          </h3>
        )}
        <LegendLayout layout={layout} overflow={overflow} maxVisibleItems={maxVisibleItems} renderOverflowLabel={renderOverflowLabel} items={items.map((item, index) => {
          const isHovered = hoveredIndex === index;
          const isFaded = hoveredIndex !== null && hoveredIndex !== index;
          const percentage = item.maxValue
            ? (item.value / item.maxValue) * 100
            : 0;

          const itemContext = {
            item,
            index,
            isHovered,
            isFaded,
            percentage,
          };

          // Clone the child element for each item
          if (isValidElement(children)) {
            return (
              <LegendItemProvider key={item.label} value={itemContext}>
                {cloneElement(children)}
              </LegendItemProvider>
            );
          }

          return null;
        })} />
      </div>
    </LegendProvider>
  );
}

Legend.displayName = "Legend";
