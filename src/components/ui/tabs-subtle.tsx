"use client";

import {
  Children,
  forwardRef,
  isValidElement,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabItem, type TabBadge } from "@/components/ui/tabs";

/**
 * @deprecated Use <Tabs variant="segment">. This wrapper preserves the
 * index-based API for installed projects while delegating all tab interaction
 * and animation to the unified Tabs component.
 */
interface TabsSubtleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  children: ReactNode;
  selectedIndex: number;
  onSelect: (index: number) => void;
  idPrefix?: string;
  activeLabel?: boolean;
}

const TabsSubtle = forwardRef<HTMLDivElement, TabsSubtleProps>(
  (
    { children, selectedIndex, onSelect, idPrefix, activeLabel = false, className, ...props },
    ref
  ) => {
    const tabItems = Children.map(children, (child) => {
      if (!isValidElement<TabsSubtleItemProps>(child)) return child;
      const { index, ...itemProps } = child.props;
      return (
        <TabItem
          key={child.key}
          value={String(index)}
          id={idPrefix ? `${idPrefix}-tab-${index}` : undefined}
          aria-controls={idPrefix ? `${idPrefix}-panel-${index}` : undefined}
          {...itemProps}
        />
      );
    });

    return (
      <Tabs
        value={String(selectedIndex)}
        onValueChange={(value) => onSelect(Number(value))}
        variant="segment"
      >
        <TabsList
          ref={ref}
          activationMode="manual"
          labelVisibility={activeLabel ? "active" : "all"}
          className={className}
          {...props}
        >
          {tabItems}
        </TabsList>
      </Tabs>
    );
  }
);

TabsSubtle.displayName = "TabsSubtle";

interface TabsSubtleItemProps extends HTMLAttributes<HTMLButtonElement> {
  icon?: IconComponent;
  label: string;
  badge?: TabBadge;
  index: number;
}

const TabsSubtleItem = forwardRef<HTMLButtonElement, TabsSubtleItemProps>(
  ({ index, ...props }, ref) => (
    <TabItem ref={ref} value={String(index)} {...props} />
  )
);

TabsSubtleItem.displayName = "TabsSubtleItem";

interface TabsSubtlePanelProps extends HTMLAttributes<HTMLDivElement> {
  index: number;
  selectedIndex: number;
  idPrefix: string;
  children: ReactNode;
}

/**
 * @deprecated Keep panels inside the unified <Tabs> root with <TabPanel>.
 * This remains for the legacy external-panel layout.
 */
const TabsSubtlePanel = forwardRef<HTMLDivElement, TabsSubtlePanelProps>(
  ({ index, selectedIndex, idPrefix, children, className, ...props }, ref) => {
    const isSelected = selectedIndex === index;

    return (
      <div
        ref={ref}
        id={`${idPrefix}-panel-${index}`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-tab-${index}`}
        hidden={!isSelected}
        tabIndex={-1}
        className={cn("outline-none", className)}
        {...props}
      >
        {isSelected && children}
      </div>
    );
  }
);

TabsSubtlePanel.displayName = "TabsSubtlePanel";

export { TabsSubtle, TabsSubtleItem, TabsSubtlePanel };
export type { TabsSubtleProps, TabsSubtleItemProps, TabsSubtlePanelProps };
export default TabsSubtle;
