"use client";

import * as React from "react";
import { Button } from "#components/button";
import { MobileDrawer } from "#components/mobile-drawer";
import { Popover, PopoverContent, PopoverTrigger } from "#components/popover";
import { useTouchPrimary } from "#hooks/use-touch-primary";
import { useComposedRefs } from "#system/compose-refs";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";
import type { ControlSize } from "../../tokens/control-size";
import type { TemporalPickerPresentation } from "./temporal-types";

interface TemporalPickerShellProps {
  ariaDescribedBy?: string;
  ariaLabel: string;
  ariaLabelledBy?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  icon?: "calendar" | "clock";
  inline?: boolean;
  isOpen: boolean;
  onRequestClose: () => void;
  onRequestOpen: () => void;
  presentation?: TemporalPickerPresentation;
  readOnly?: boolean;
  size?: ControlSize;
  summary: React.ReactNode;
  triggerRef?: React.ForwardedRef<HTMLButtonElement>;
  triggerId?: string;
}

function useResolvedPresentation(
  requested: TemporalPickerPresentation,
  isOpen: boolean,
): Exclude<TemporalPickerPresentation, "auto"> {
  const touchPrimary = useTouchPrimary();
  const [isNarrow, setIsNarrow] = React.useState(false);
  const [resolved, setResolved] = React.useState<Exclude<TemporalPickerPresentation, "auto">>("popover");

  React.useEffect(() => {
    const update = () => setIsNarrow(window.innerWidth <= 767);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  React.useEffect(() => {
    if (isOpen) return;
    if (requested === "auto") setResolved(touchPrimary || isNarrow ? "drawer" : "popover");
    else setResolved(requested);
  }, [isNarrow, isOpen, requested, touchPrimary]);

  return requested === "auto" ? resolved : requested;
}

export const TemporalPickerShell = React.forwardRef<HTMLButtonElement, TemporalPickerShellProps>(function TemporalPickerShell({
  ariaDescribedBy,
  ariaLabel,
  ariaLabelledBy,
  children,
  className,
  disabled,
  icon = "calendar",
  isOpen,
  onRequestClose,
  onRequestOpen,
  presentation = "auto",
  readOnly,
  size = "md",
  summary,
  triggerRef,
  triggerId,
}, forwardedRef) {
  const internalTriggerRef = React.useRef<HTMLButtonElement>(null);
  const composedTriggerRef = useComposedRefs(triggerRef, forwardedRef, internalTriggerRef);
  const Calendar = useIcon("calendar");
  const Clock = useIcon("clock");
  const ChevronDown = useIcon("chevron-down");
  const Icon = icon === "clock" ? Clock : Calendar;
  const resolvedPresentation = useResolvedPresentation(presentation, isOpen);
  const trigger = readOnly ? (
    <span className={cn("inline-flex min-w-0 items-center gap-2 px-2.5 text-body text-fg-muted", className)}>{summary}</span>
  ) : (
    <Button
      data-slot="temporal-picker-trigger"
      ref={composedTriggerRef}
      active={isOpen}
      aria-describedby={ariaDescribedBy}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn("min-w-0 max-w-full justify-between", className)}
      disabled={disabled}
      id={triggerId}
      leadingIcon={Icon}
      onClick={onRequestOpen}
      size={size}
      trailingIcon={ChevronDown}
      type="button"
      variant="tertiary"
    >
      <span data-slot="temporal-picker-value" className="min-w-0 truncate">{summary}</span>
    </Button>
  );

  if (readOnly) return trigger;
  if (resolvedPresentation === "inline") {
    return (
      <div className={cn("flex min-w-0 flex-col gap-2", className)} data-slot="temporal-picker-inline">
        {children}
      </div>
    );
  }
  if (resolvedPresentation === "drawer") {
    return (
      <>
        {trigger}
        <MobileDrawer
          ariaLabel={ariaLabel}
          onClose={onRequestClose}
          open={isOpen}
          panelClassName="!w-[min(100vw,31rem)] p-0"
          side="end"
          triggerRef={internalTriggerRef}
        >
          <div className="flex min-h-full flex-col" data-slot="temporal-picker-drawer">{children}</div>
        </MobileDrawer>
      </>
    );
  }
  return (
    <Popover open={isOpen} onOpenChange={(nextOpen) => nextOpen ? onRequestOpen() : onRequestClose()}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="start" className="w-fit min-w-0 max-w-[92vw] p-0" sideOffset={6}>
        <div data-slot="temporal-picker-popover">{children}</div>
      </PopoverContent>
    </Popover>
  );
});

interface TemporalPickerActionsProps {
  applyDisabled?: boolean;
  clearable?: boolean;
  messages: { apply: string; cancel: string; clear: string };
  onApply: () => void;
  onCancel: () => void;
  onClear: () => void;
  showApply: boolean;
}

export function TemporalPickerActions({
  applyDisabled,
  clearable = true,
  messages,
  onApply,
  onCancel,
  onClear,
  showApply,
}: TemporalPickerActionsProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-3 py-2.5" data-slot="temporal-picker-actions">
      <Button disabled={!clearable} onClick={onClear} size="sm" type="button" variant="ghost">{messages.clear}</Button>
      <div className="flex items-center gap-1.5">
        <Button onClick={onCancel} size="sm" type="button" variant="ghost">{messages.cancel}</Button>
        {showApply && <Button disabled={applyDisabled} onClick={onApply} size="sm" type="button" variant="primary">{messages.apply}</Button>}
      </div>
    </div>
  );
}
