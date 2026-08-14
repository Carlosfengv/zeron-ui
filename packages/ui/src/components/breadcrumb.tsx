"use client";

import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { useEffect, useRef, useState } from "react";
import type * as React from "react";
import {
  DropdownContent,
  DropdownMenu,
  DropdownTrigger,
} from "#components/dropdown";
import { MenuItem } from "#components/menu-item";
import { cn } from "#system/utils";
import { useIcon } from "#system/icon-context";

type BreadcrumbProps = React.ComponentProps<"nav">;

function Breadcrumb({ className, ...props }: BreadcrumbProps) {
  return (
    <nav
      aria-label="breadcrumb"
      className={cn(className)}
      data-slot="breadcrumb"
      {...props}
    />
  );
}

type BreadcrumbListProps = React.ComponentProps<"ol">;

function BreadcrumbList({ className, ...props }: BreadcrumbListProps) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-1.5 break-words text-body text-fg-muted sm:gap-2.5",
        className
      )}
      data-slot="breadcrumb-list"
      {...props}
    />
  );
}

type BreadcrumbItemProps = React.ComponentProps<"li">;

function BreadcrumbItem({ className, ...props }: BreadcrumbItemProps) {
  return (
    <li
      className={cn("inline-flex min-w-0 items-center gap-1.5", className)}
      data-slot="breadcrumb-item"
      {...props}
    />
  );
}

type BreadcrumbLinkProps = useRender.ComponentProps<"a">;

function BreadcrumbLink({
  className,
  render,
  ...props
}: BreadcrumbLinkProps) {
  return useRender({
    defaultTagName: "a",
    props: mergeProps<"a">(
      {
        className: cn(
          "rounded-lg outline-none transition-colors duration-fast hover:text-fg-default focus-visible:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring",
          className
        ),
      },
      props
    ),
    render,
    state: { slot: "breadcrumb-link" },
  });
}

interface BreadcrumbResource {
  value: string;
  label: string;
  disabled?: boolean;
}

interface BreadcrumbPageProps extends Omit<React.ComponentProps<"span">, "ref"> {
  /** Optional 20px visual marker displayed before the current page label. */
  icon?: React.ReactNode;
  /** Resources available at the current breadcrumb level. When supplied, the
   * current page becomes a menu trigger for switching between them. */
  resources?: readonly BreadcrumbResource[];
  /** Controlled resource value. */
  value?: string;
  /** Initially selected resource for uncontrolled usage. */
  defaultValue?: string;
  /** Called after the user selects a resource. */
  onValueChange?: (value: string) => void;
}

function BreadcrumbPage({
  children,
  className,
  icon,
  resources,
  value,
  defaultValue,
  onValueChange,
  onPointerEnter,
  onPointerLeave,
  ...props
}: BreadcrumbPageProps) {
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? resources?.[0]?.value ?? ""
  );
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasResources = Boolean(resources?.length);
  const selectedValue = value ?? internalValue;
  const selectedResource = resources?.find(
    (resource) => resource.value === selectedValue
  ) ?? resources?.[0];
  const selectedIndex = selectedResource
    ? resources?.indexOf(selectedResource)
    : undefined;
  const label = selectedResource?.label ?? children;
  const iconSlot = icon ? (
    <span
      aria-hidden="true"
      className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded [&>img]:size-full [&>img]:object-cover [&>svg]:size-full"
      data-slot="breadcrumb-page-icon"
    >
      {icon}
    </span>
  ) : null;

  const cancelClose = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => cancelClose, []);

  if (hasResources && resources && selectedResource) {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownTrigger
          render={
            <button
              type="button"
              aria-current="page"
              onPointerEnter={(event) => {
                onPointerEnter?.(
                  event as unknown as React.PointerEvent<HTMLSpanElement>
                );
                if (event.pointerType !== "mouse") return;
                cancelClose();
                setOpen(true);
              }}
              onPointerLeave={(event) => {
                onPointerLeave?.(
                  event as unknown as React.PointerEvent<HTMLSpanElement>
                );
                if (event.pointerType === "mouse") scheduleClose();
              }}
              className={cn(
                "inline-flex min-w-0 items-center gap-1 rounded-lg font-medium text-fg-default outline-none transition-colors duration-fast hover:text-fg-brand focus-visible:ring-1 focus-visible:ring-focus-ring",
                className
              )}
              data-slot="breadcrumb-page"
              {...props}
            >
              {iconSlot}
              <span className="truncate">{label}</span>
              <span
                aria-hidden="true"
                className="size-0 shrink-0 border-x-[3.5px] border-x-transparent border-t-[5px] border-t-current"
              />
            </button>
          }
        />
        <DropdownContent
          align="start"
          checkedIndex={selectedIndex}
          className="max-h-72 w-56 overflow-y-auto"
          onPointerEnter={cancelClose}
          onPointerLeave={scheduleClose}
        >
          {resources.map((resource, index) => (
            <MenuItem
              key={resource.value}
              index={index}
              label={resource.label}
              checked={resource.value === selectedResource.value}
              disabled={resource.disabled}
              onSelect={() => {
                if (value === undefined) setInternalValue(resource.value);
                onValueChange?.(resource.value);
              }}
            />
          ))}
        </DropdownContent>
      </DropdownMenu>
    );
  }

  return (
    <span
      aria-current="page"
      className={cn(
        "inline-flex min-w-0 items-center gap-1.5 font-medium text-fg-default",
        className
      )}
      data-slot="breadcrumb-page"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      {...props}
    >
      {iconSlot}
      <span className="truncate">{children}</span>
    </span>
  );
}

type BreadcrumbSeparatorProps = React.ComponentProps<"li">;

function BreadcrumbSeparator({
  children,
  className,
  ...props
}: BreadcrumbSeparatorProps) {
  const ChevronRight = useIcon("chevron-right");

  return (
    <li
      aria-hidden="true"
      className={cn("shrink-0 [&>svg]:size-3.5", className)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRight strokeWidth={1.5} />}
    </li>
  );
}

type BreadcrumbEllipsisProps = React.ComponentProps<"span">;

function BreadcrumbEllipsis({
  className,
  ...props
}: BreadcrumbEllipsisProps) {
  const Ellipsis = useIcon("ellipsis");

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center",
        className
      )}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <Ellipsis size={16} strokeWidth={1.5} />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
};
export type {
  BreadcrumbResource,
  BreadcrumbEllipsisProps,
  BreadcrumbItemProps,
  BreadcrumbLinkProps,
  BreadcrumbListProps,
  BreadcrumbPageProps,
  BreadcrumbProps,
  BreadcrumbSeparatorProps,
};
