"use client";

import {
  useRef,
  useEffect,
  useMemo,
  createContext,
  useContext,
  forwardRef,
  type ReactNode,
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "#components/skeleton";
import { cn } from "#system/utils";
import { spring } from "#system/springs";
import { useProximityHover } from "#hooks/use-proximity-hover";

// ── Context ──────────────────────────────────────────────

interface TableContextValue {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  variant: "plain" | "bordered";
  size: "sm" | "md";
}

const TableContext = createContext<TableContextValue | null>(null);

// ── Table ────────────────────────────────────────────────

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
  /** A framed content table or the default unframed table. */
  variant?: "plain" | "bordered";
  /** Compact or standard table typography. */
  size?: "sm" | "md";
  /** External layout classes applied to the wrapper, not the table element. */
  containerClassName?: string;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ children, className, variant = "plain", size = "md", containerClassName, ...props }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const {
      activeIndex,
      itemRects,
      sessionRef,
      handlers,
      registerItem,
      measureItems,
    } = useProximityHover(containerRef);

    useEffect(() => {
      measureItems();
    }, [measureItems, children]);

    const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;

    const contextValue = useMemo(
      () => ({ registerItem, activeIndex, variant, size }),
      [registerItem, activeIndex, variant, size]
    );

    return (
      <TableContext.Provider value={contextValue}>
        <div
          ref={containerRef}
          data-slot="table-container"
          className={cn(
            "relative",
            variant === "bordered" && "max-w-full overflow-x-auto rounded-md border border-border",
            containerClassName
          )}
          onMouseEnter={handlers.onMouseEnter}
          onMouseMove={handlers.onMouseMove}
          onMouseLeave={handlers.onMouseLeave}
        >
          {/* Hover background */}
          <AnimatePresence>
            {activeRect && (
              <motion.div
                key={sessionRef.current}
                className="absolute bg-hover pointer-events-none"
                initial={{
                  opacity: 0,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                animate={{
                  opacity: 1,
                  top: activeRect.top,
                  left: activeRect.left,
                  width: activeRect.width,
                  height: activeRect.height,
                }}
                exit={{ opacity: 0, transition: spring.fast.exit }}
                transition={{
                  ...spring.fast,
                  opacity: { duration: spring.fast.duration },
                }}
              />
            )}
          </AnimatePresence>

          <table
            ref={ref}
            data-slot="table"
            className={cn(
              "w-full border-collapse",
              size === "sm" ? "text-label" : "text-body",
              variant === "bordered" && "text-left",
              className
            )}
            {...props}
          >
            {children}
          </table>
        </div>
      </TableContext.Provider>
    );
  }
);

Table.displayName = "Table";

// ── TableHeader ──────────────────────────────────────────

const TableHeader = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const ctx = useContext(TableContext);
  return (
    <thead
      ref={ref}
      data-slot="table-header"
      className={cn(ctx?.variant === "bordered" && "bg-surface-raised text-fg-default", className)}
      {...props}
    />
  );
});

TableHeader.displayName = "TableHeader";

// ── TableBody ────────────────────────────────────────────

const TableBody = forwardRef<
  HTMLTableSectionElement,
  HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    data-slot="table-body"
    className={cn("[&>tr:last-child]:border-b-0", className)}
    {...props}
  />
));

TableBody.displayName = "TableBody";

// ── TableSkeletonBody ───────────────────────────────────

export interface TableSkeletonBodyProps
  extends Omit<HTMLAttributes<HTMLTableSectionElement>, "children"> {
  /** Number of cells rendered in each placeholder row. */
  columns: number;
  /** Number of placeholder rows. @default 5 */
  rows?: number;
  /** Additional classes applied to every placeholder cell. */
  cellClassName?: string;
  /** Customizes cell attributes, for example sticky positioning and width. */
  getCellProps?: (
    rowIndex: number,
    columnIndex: number
  ) => Omit<TdHTMLAttributes<HTMLTableCellElement>, "children">;
  /** Replaces the default text-line Skeleton for a particular cell. */
  renderCell?: (rowIndex: number, columnIndex: number) => ReactNode;
}

/**
 * A semantic tbody that preserves a table's columns and row height while its
 * data is loading. Set aria-busy on the surrounding Table or region.
 */
const TableSkeletonBody = forwardRef<
  HTMLTableSectionElement,
  TableSkeletonBodyProps
>(
  (
    {
      columns,
      rows = 5,
      cellClassName,
      getCellProps,
      renderCell,
      className,
      "aria-hidden": ariaHidden = true,
      ...props
    },
    ref
  ) => {
    const columnCount = Math.max(1, Math.floor(columns));
    const rowCount = Math.max(1, Math.floor(rows));

    return (
      <tbody
        ref={ref}
        aria-hidden={ariaHidden}
        data-slot="table-skeleton-body"
        className={cn("[&>tr:last-child]:border-b-0", className)}
        {...props}
      >
        {Array.from({ length: rowCount }, (_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columnCount }, (_, columnIndex) => {
              const cellProps = getCellProps?.(rowIndex, columnIndex);
              const customCell = renderCell?.(rowIndex, columnIndex);

              return (
                <TableCell
                  {...cellProps}
                  key={columnIndex}
                  className={cn(cellClassName, cellProps?.className)}
                >
                  {customCell === undefined ? (
                    <Skeleton
                      className={cn(
                        "h-5",
                        columnIndex === 0
                          ? "w-3/4"
                          : columnIndex === columnCount - 1
                            ? "w-1/2"
                            : "w-2/3"
                      )}
                    />
                  ) : customCell}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </tbody>
    );
  }
);

TableSkeletonBody.displayName = "TableSkeletonBody";

// ── TableRow ─────────────────────────────────────────────

interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  index?: number;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ index, className, style, ...props }, ref) => {
    const internalRef = useRef<HTMLTableRowElement>(null);
    const ctx = useContext(TableContext);

    useEffect(() => {
      if (index === undefined || !ctx) return;
      ctx.registerItem(index, internalRef.current);
      return () => ctx.registerItem(index, null);
    }, [index, ctx]);

    const isBodyRow = index !== undefined;
    const activeIdx = ctx?.activeIndex ?? null;
    const hideBorder = activeIdx !== null && (
      (isBodyRow && (index === activeIdx || index === activeIdx - 1)) ||
      (!isBodyRow && activeIdx === 0)
    );

    return (
      <tr
        data-slot="table-row"
        ref={(node) => {
          (internalRef as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
        }}
        data-proximity-index={index}
        className={cn(
          "group/row relative z-content border-b transition-[border-color] duration-fast",
          hideBorder ? "border-border" : "border-border",
          isBodyRow && activeIdx === index && "is-active",
          className,
          isBodyRow ? "font-normal" : "font-medium"
        )}
        style={style}
        {...props}
      />
    );
  }
);

TableRow.displayName = "TableRow";

// ── TableHead ────────────────────────────────────────────

const TableHead = forwardRef<
  HTMLTableCellElement,
  ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const ctx = useContext(TableContext);
  return (
    <th
      ref={ref}
      data-slot="table-head"
      className={cn(
        "px-3 py-2 text-left text-fg-default",
        ctx?.size === "sm" ? "text-label" : "text-body",
        ctx?.variant === "bordered" ? "font-semibold" : "font-medium",
        className
      )}
      {...props}
    />
  );
});

TableHead.displayName = "TableHead";

// ── TableCell ────────────────────────────────────────────

const TableCell = forwardRef<
  HTMLTableCellElement,
  TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => {
  const ctx = useContext(TableContext);
  return (
    <td
      ref={ref}
      data-slot="table-cell"
      className={cn(
        "px-3 py-2 transition-colors duration-fast group-[.is-active]/row:text-fg-default",
        ctx?.variant === "bordered" ? "font-normal text-fg-default" : "text-fg-muted",
        className
      )}
      {...props}
    />
  );
});

TableCell.displayName = "TableCell";

// ── Exports ──────────────────────────────────────────────

export {
  Table,
  TableHeader,
  TableBody,
  TableSkeletonBody,
  TableRow,
  TableHead,
  TableCell,
};
