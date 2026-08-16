import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "#system/utils";

/** Visual intent for an inline notice. This does not assign an ARIA live-region role. */
export type InlineNoticeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger";

export type InlineNoticeVariant = "subtle" | "emphasized";

const toneClasses: Record<InlineNoticeTone, string> = {
  neutral: "bg-neutral-status-surface text-fg-neutral-status",
  info: "bg-info-surface text-fg-info",
  success: "bg-success-surface text-fg-success",
  warning: "bg-warning-surface text-fg-warning",
  danger: "bg-danger-surface text-fg-danger",
};

type InlineNoticeBaseProps = ComponentPropsWithoutRef<"span">;

/**
 * Subtle notices use a quiet raised surface and let their children communicate
 * category or status. Emphasized notices require a semantic tone for the whole
 * container.
 */
export type InlineNoticeProps = InlineNoticeBaseProps &
  (
    | {
        variant?: "subtle";
        tone?: never;
      }
    | {
        variant: "emphasized";
        tone: InlineNoticeTone;
      }
  );

/**
 * A compact, composable notice that sits inside prose, rows, and other tight layouts.
 *
 * The default subtle variant is a neutral raised surface designed to compose
 * with Badge or other phrasing content. The component is intentionally silent
 * to assistive technology; consumers opt into live-region semantics.
 */
const InlineNotice = forwardRef<HTMLSpanElement, InlineNoticeProps>(
  ({ variant = "subtle", tone, className, ...props }, ref) => {
    const isEmphasized = variant === "emphasized";

    return (
      <span
        ref={ref}
        data-slot="inline-notice"
        data-variant={variant}
        data-tone={tone}
        className={cn(
          "inline-flex max-w-full items-start gap-1.5 rounded-xl py-1 pr-2 pl-1 align-middle text-body leading-5",
          isEmphasized && tone
            ? toneClasses[tone]
            : "bg-surface-raised text-fg-default",
          className
        )}
        {...props}
      />
    );
  }
);

InlineNotice.displayName = "InlineNotice";

export type InlineNoticeContentProps = ComponentPropsWithoutRef<"span">;

/** The flexible message area. It may contain simple phrasing content such as links or code. */
const InlineNoticeContent = forwardRef<
  HTMLSpanElement,
  InlineNoticeContentProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-slot="inline-notice-content"
    className={cn("min-w-0", className)}
    {...props}
  />
));

InlineNoticeContent.displayName = "InlineNoticeContent";

export type InlineNoticeActionProps = ComponentPropsWithoutRef<"span">;

/** Optional trailing slot for a compact link or text action. */
const InlineNoticeAction = forwardRef<
  HTMLSpanElement,
  InlineNoticeActionProps
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-slot="inline-notice-action"
    className={cn(
      "inline-flex min-h-5 shrink-0 items-center font-medium",
      "[&_a]:underline [&_a]:decoration-current/35 [&_a]:underline-offset-2",
      "[&_button]:font-medium [&_button]:underline [&_button]:decoration-current/35 [&_button]:underline-offset-2",
      className
    )}
    {...props}
  />
));

InlineNoticeAction.displayName = "InlineNoticeAction";

export {
  InlineNotice,
  InlineNoticeAction,
  InlineNoticeContent,
};
