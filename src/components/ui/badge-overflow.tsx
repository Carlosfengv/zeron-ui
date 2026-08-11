"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import * as React from "react";
import { useComposedRefs } from "@/lib/compose-refs";
import { cn } from "@/lib/utils";
import { useShape } from "@/lib/shape-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { selectItemClassName } from "@/components/ui/select";

interface GetBadgeLabel<T> {
  /** Returns the text label used for rendering, measuring, and default keys. */
  getBadgeLabel: (item: T) => string;
}

type BadgeOverflowElement = HTMLDivElement;

type BadgeOverflowProps<T = string> = Omit<
  useRender.ComponentProps<"div">,
  "children"
> &
  (T extends object ? GetBadgeLabel<T> : Partial<GetBadgeLabel<T>>) & {
    /** Ordered items to fit into the available lines. */
    items: T[];
    /** Maximum number of visible badge rows. */
    lineCount?: number;
    /** Returns a stable React key. Labels are used by default. */
    getBadgeKey?: (item: T, label: string) => React.Key;
    /** Renders each visible badge. */
    renderBadge: (item: T, label: string) => React.ReactNode;
    /** Renders the final hidden-count badge. */
    renderOverflow?: (count: number) => React.ReactNode;
  };

function BadgeOverflow<T = string>(props: BadgeOverflowProps<T>) {
  const {
    items,
    getBadgeLabel: getBadgeLabelProp,
    getBadgeKey: getBadgeKeyProp,
    lineCount: lineCountProp = 1,
    render,
    renderBadge,
    renderOverflow,
    className,
    style,
    ref,
    ...rootProps
  } = props;
  const shape = useShape();
  const lineCount = Math.max(1, Math.floor(lineCountProp));

  const getBadgeLabel = React.useCallback(
    (item: T): string => {
      if (typeof item === "object" && item !== null && !getBadgeLabelProp) {
        throw new Error(
          "`getBadgeLabel` is required when using an array of objects"
        );
      }

      return getBadgeLabelProp ? getBadgeLabelProp(item) : String(item);
    },
    [getBadgeLabelProp]
  );

  const getBadgeKey = React.useCallback(
    (item: T): React.Key => {
      const label = getBadgeLabel(item);
      return getBadgeKeyProp ? getBadgeKeyProp(item, label) : label;
    },
    [getBadgeKeyProp, getBadgeLabel]
  );

  const rootRef = React.useRef<BadgeOverflowElement | null>(null);
  const measureRef = React.useRef<HTMLDivElement | null>(null);
  const composedRef = useComposedRefs(ref, rootRef);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [badgeGap, setBadgeGap] = React.useState(4);
  const [badgeHeight, setBadgeHeight] = React.useState(20);
  const [overflowBadgeWidth, setOverflowBadgeWidth] = React.useState(40);
  const [isMeasured, setIsMeasured] = React.useState(false);
  const [badgeWidths, setBadgeWidths] = React.useState<Map<number, number>>(
    new Map()
  );

  React.useLayoutEffect(() => {
    if (!rootRef.current || !measureRef.current) return;

    function measureContainer() {
      if (!rootRef.current || !measureRef.current) return;

      const computedStyle = getComputedStyle(rootRef.current);
      const gap = parseFloat(computedStyle.gap) || 4;
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
      const widthMap = new Map<number, number>();
      const measureChildren = measureRef.current.children;

      for (let index = 0; index < items.length; index++) {
        const child = measureChildren[index] as HTMLElement | undefined;
        if (child) widthMap.set(index, child.offsetWidth);
      }

      const firstBadge = measureChildren[0] as HTMLElement | undefined;
      const overflowBadge = measureChildren[items.length] as
        | HTMLElement
        | undefined;

      setBadgeGap(gap);
      setBadgeWidths(widthMap);
      setBadgeHeight(firstBadge?.offsetHeight || 20);
      setOverflowBadgeWidth(overflowBadge?.offsetWidth || 40);
      setContainerWidth(
        rootRef.current.clientWidth - paddingLeft - paddingRight
      );
      setIsMeasured(true);
    }

    measureContainer();

    const resizeObserver = new ResizeObserver(measureContainer);
    resizeObserver.observe(rootRef.current);
    return () => resizeObserver.disconnect();
  }, [items, getBadgeLabel, renderBadge, renderOverflow]);

  const placeholderHeight = React.useMemo(
    () => badgeHeight * lineCount + badgeGap * (lineCount - 1),
    [badgeHeight, badgeGap, lineCount]
  );

  const { visibleItems, hiddenCount } = React.useMemo(() => {
    if (!containerWidth || items.length === 0 || badgeWidths.size === 0) {
      return { visibleItems: items, hiddenCount: 0 };
    }

    let currentLineWidth = 0;
    let currentLine = 1;
    const visible: T[] = [];

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const badgeWidth = badgeWidths.get(index);

      if (item === undefined || !badgeWidth) continue;

      const widthWithGap = badgeWidth + badgeGap;
      const isLastLine = currentLine === lineCount;
      const hasMoreItems = index < items.length - 1;
      const availableWidth =
        isLastLine && hasMoreItems
          ? containerWidth - overflowBadgeWidth - badgeGap
          : containerWidth;

      if (currentLineWidth + widthWithGap <= availableWidth) {
        currentLineWidth += widthWithGap;
        visible.push(item);
      } else if (currentLine < lineCount) {
        currentLine++;
        currentLineWidth = widthWithGap;
        visible.push(item);
      } else {
        break;
      }
    }

    return {
      visibleItems: visible,
      hiddenCount: Math.max(0, items.length - visible.length),
    };
  }, [
    items,
    containerWidth,
    lineCount,
    badgeGap,
    overflowBadgeWidth,
    badgeWidths,
  ]);

  const fallbackItems = React.useMemo(
    () =>
      items.slice(
        0,
        Math.min(items.length, lineCount * 3 - (lineCount > 1 ? 1 : 0))
      ),
    [items, lineCount]
  );

  const overflow = (count: number) =>
    renderOverflow ? (
      renderOverflow(count)
    ) : (
      <div className="inline-flex h-5 shrink-0 items-center rounded-md border border-border px-1.5 text-xs font-semibold text-foreground">
        +{count}
      </div>
    );

  const overflowTrigger = (count: number) => (
    <Popover trigger="hover" hoverDelay={120} closeDelay={160}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Show all ${items.length} badges (${count} hidden)`}
            className={cn(
              "inline-flex shrink-0 cursor-pointer appearance-none border-0 bg-transparent p-0 text-inherit outline-none",
              "focus-visible:ring-1 focus-visible:ring-[color:var(--focus-ring,#6B97FF)]",
              shape.item
            )}
          >
            {overflow(count)}
          </button>
        }
      />
      <PopoverContent
        align="center"
        side="bottom"
        sideOffset={6}
        className="w-max max-w-[min(90vw,360px)] p-1"
      >
        <div
          role="list"
          aria-label="All badges"
          className="flex max-h-[calc(var(--spacing-control-md)*5+0.5rem)] min-w-44 flex-col gap-0.5 overflow-y-auto overscroll-contain"
        >
          {items.map((item) => (
            <div
              role="listitem"
              key={getBadgeKey(item)}
              className={cn(
                selectItemClassName,
                shape.item,
                "w-full cursor-default text-muted-foreground hover:bg-hover hover:text-foreground"
              )}
            >
              {renderBadge(item, getBadgeLabel(item))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  const children = isMeasured ? (
    <>
      {visibleItems.map((item) => (
        <React.Fragment key={getBadgeKey(item)}>
          {renderBadge(item, getBadgeLabel(item))}
        </React.Fragment>
      ))}
      {hiddenCount > 0 && overflowTrigger(hiddenCount)}
    </>
  ) : (
    fallbackItems.map((item) => (
      <React.Fragment key={getBadgeKey(item)}>
        {renderBadge(item, getBadgeLabel(item))}
      </React.Fragment>
    ))
  );

  const element = useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        ref: composedRef,
        className: cn("flex flex-wrap", className),
        style: {
          gap: badgeGap,
          minHeight: isMeasured ? undefined : placeholderHeight,
          ...style,
        },
        children,
      },
      rootProps
    ),
    state: { slot: "badge-overflow" },
  });

  return (
    <>
      <div
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute flex flex-wrap"
        style={{ gap: badgeGap }}
      >
        {items.map((item) => (
          <React.Fragment key={getBadgeKey(item)}>
            {renderBadge(item, getBadgeLabel(item))}
          </React.Fragment>
        ))}
        {overflow(Math.max(99, items.length))}
      </div>
      {element}
    </>
  );
}

export { BadgeOverflow };
export type { BadgeOverflowProps };
