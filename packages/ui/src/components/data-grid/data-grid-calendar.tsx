"use client";

import * as React from "react";
import {
  type ClassNames,
  type DayButton,
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker";
import { cn } from "#system/utils";
import { createIconSlot } from "#system/icon-context";
import { buttonVariants, type ButtonProps } from "../button";

const ChevronDownIcon = createIconSlot("chevron-down");
const ChevronLeftIcon = createIconSlot("chevron-left");
const ChevronRightIcon = createIconSlot("chevron-right");

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  showWeekNumber = false,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: ButtonProps["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();
  const calendarClassNames: Partial<ClassNames> = {
    ...defaultClassNames,
    root: defaultClassNames.root,
    months: cn(
      "relative flex flex-col gap-4 md:flex-row",
      defaultClassNames.months,
    ),
    month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
    nav: cn(
      "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
      defaultClassNames.nav,
    ),
    button_previous: cn(
      buttonVariants({ variant: buttonVariant }),
      "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
      defaultClassNames.button_previous,
    ),
    button_next: cn(
      buttonVariants({ variant: buttonVariant }),
      "size-(--cell-size) p-0 select-none aria-disabled:opacity-50",
      defaultClassNames.button_next,
    ),
    month_caption: cn(
      "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
      defaultClassNames.month_caption,
    ),
    dropdowns: cn(
      "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-body font-medium",
      defaultClassNames.dropdowns,
    ),
    dropdown_root: cn(
      "relative rounded-lg border border-input shadow-control has-[select:focus-visible]:ring-1 has-[select:focus-visible]:ring-focus-ring",
      defaultClassNames.dropdown_root,
    ),
    dropdown: cn(
      "absolute inset-0 bg-surface-floating opacity-0",
      defaultClassNames.dropdown,
    ),
    caption_label: cn(
      "select-none font-medium",
      captionLayout === "label"
        ? "text-body"
        : "flex h-8 items-center gap-1 rounded-lg pl-2 pr-1 text-body [&>svg]:size-3.5 [&>svg]:text-fg-muted",
      defaultClassNames.caption_label,
    ),
    month_grid: cn(
      "w-full table-fixed border-separate border-spacing-x-0 border-spacing-y-2",
      defaultClassNames.month_grid,
    ),
    weekdays: defaultClassNames.weekdays,
    weekday: cn(
      "h-(--cell-size) w-(--cell-size) rounded-lg text-label font-normal text-fg-muted select-none",
      defaultClassNames.weekday,
    ),
    week: defaultClassNames.week,
    week_number_header: cn(
      "w-(--cell-size) select-none",
      defaultClassNames.week_number_header,
    ),
    week_number: cn(
      "text-label text-fg-muted select-none",
      defaultClassNames.week_number,
    ),
    day: cn(
      "group/day relative h-auto w-(--cell-size) p-0 text-center align-middle select-none",
      showWeekNumber
        ? "[&:nth-child(2)[data-selected=true]]:rounded-l-lg [&:nth-child(2)[data-selected=true]>button]:rounded-l-lg [&:nth-child(2):has(button[data-range-end=true])]:after:hidden"
        : "[&:first-child[data-selected=true]]:rounded-l-lg [&:first-child[data-selected=true]>button]:rounded-l-lg [&:first-child:has(button[data-range-end=true])]:after:hidden",
      "[&:last-child[data-selected=true]]:rounded-r-lg [&:last-child[data-selected=true]>button]:rounded-r-lg [&:last-child:has(button[data-range-start=true])]:before:hidden",
      defaultClassNames.day,
    ),
    range_start: cn(
      "isolate before:absolute before:inset-y-0 before:right-0 before:z-0 before:w-1/2 before:bg-[color-mix(in_oklch,var(--brand)_16%,transparent)] before:content-[''] [&:has(button[data-range-end=true])]:before:hidden",
      defaultClassNames.range_start,
    ),
    range_middle: cn(
      "rounded-none bg-[color-mix(in_oklch,var(--brand)_16%,transparent)]",
      defaultClassNames.range_middle,
    ),
    range_end: cn(
      "isolate after:absolute after:inset-y-0 after:left-0 after:z-0 after:w-1/2 after:bg-[color-mix(in_oklch,var(--brand)_16%,transparent)] after:content-[''] [&:has(button[data-range-start=true])]:after:hidden",
      defaultClassNames.range_end,
    ),
    today: cn(
      "rounded-lg text-fg-default [&:not([data-selected=true])]:bg-emphasis",
      defaultClassNames.today,
    ),
    outside: cn(
      "text-fg-muted aria-selected:text-fg-muted",
      defaultClassNames.outside,
    ),
    disabled: cn(
      "text-fg-muted opacity-50",
      defaultClassNames.disabled,
    ),
    hidden: cn("invisible", defaultClassNames.hidden),
  };

  for (const key of Object.keys(classNames ?? {}) as Array<keyof ClassNames>) {
    calendarClassNames[key] = cn(calendarClassNames[key], classNames?.[key]);
  }

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      showWeekNumber={showWeekNumber}
      className={cn(
        "w-fit group/calendar bg-surface-base p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className,
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={calendarClassNames}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon className={cn("size-4", className)} {...props} />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const singleSelection = modifiers.selected
    && !modifiers.range_start
    && !modifiers.range_end
    && !modifiers.range_middle;

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      data-day={day.isoDate}
      data-selected={modifiers.selected}
      data-selected-single={singleSelection}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative z-10 flex aspect-square w-full min-w-(--cell-size) cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent p-0 text-label font-normal leading-none outline-none select-none transition-colors duration-fast hover:bg-hover disabled:pointer-events-none",
        "focus-visible:ring-1 focus-visible:ring-focus-ring group-data-[focused=true]/day:ring-1 group-data-[focused=true]/day:ring-focus-ring",
        "data-[selected-single=true]:bg-brand data-[selected-single=true]:text-fg-on-primary-action data-[selected-single=true]:hover:bg-brand-hover",
        "data-[range-start=true]:rounded-lg data-[range-start=true]:bg-brand data-[range-start=true]:text-fg-on-primary-action data-[range-start=true]:hover:bg-brand-hover",
        "data-[range-end=true]:rounded-lg data-[range-end=true]:bg-brand data-[range-end=true]:text-fg-on-primary-action data-[range-end=true]:hover:bg-brand-hover",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:text-fg-brand data-[range-middle=true]:hover:bg-transparent",
        className,
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
