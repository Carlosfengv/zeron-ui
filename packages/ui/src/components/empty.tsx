"use client";

import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type SVGProps,
} from "react";
import { cn } from "#system/utils";

export type EmptyReason =
  | "first-use"
  | "no-data"
  | "no-results"
  | "no-filter-results"
  | "no-condition-results"
  | "empty-group"
  | "informational";

export type EmptyScope = "page" | "section" | "inline";
export type EmptyDensity = "compact" | "default" | "comfortable";
export type EmptyAlign = "center" | "start";

interface EmptyContextValue {
  align: EmptyAlign;
  density: EmptyDensity;
  scope: EmptyScope;
}

const EmptyContext = createContext<EmptyContextValue>({
  align: "center",
  density: "default",
  scope: "section",
});

const scopeClasses: Record<EmptyScope, string> = {
  page:
    "min-h-[min(60vh,36rem)] px-6 py-12 sm:px-10 sm:py-16",
  section: "min-h-60 px-6 py-8",
  inline: "min-h-32 px-4 py-5",
};

const densityClasses: Record<EmptyDensity, string> = {
  compact: "gap-3",
  default: "gap-5",
  comfortable: "gap-7",
};

export interface EmptyProps extends ComponentPropsWithoutRef<"div"> {
  /** Why the confirmed empty state is being shown. Used for styling and instrumentation. */
  reason: EmptyReason;
  /** The amount of surrounding product UI replaced by this empty state. */
  scope?: EmptyScope;
  /** Controls the vertical rhythm without changing the semantic scope. */
  density?: EmptyDensity;
  /** Start alignment is recommended for educational page-level zero states. */
  align?: EmptyAlign;
  /** Opts a dynamic empty result into a polite live region. Static empty states stay silent. */
  announce?: boolean;
}

/**
 * A composable placeholder for confirmed zero-data states.
 *
 * Empty intentionally does not infer loading, error, permission, or setup
 * states. Resolve those before rendering it. Static content is silent to
 * assistive technology unless announce is explicitly enabled.
 */
const Empty = forwardRef<HTMLDivElement, EmptyProps>(
  (
    {
      reason,
      scope = "section",
      density = "default",
      align = "center",
      announce = false,
      role,
      "aria-live": ariaLive,
      className,
      children,
      ...props
    },
    ref
  ) => (
    <EmptyContext.Provider value={{ align, density, scope }}>
      <div
        ref={ref}
        role={role ?? (announce ? "status" : undefined)}
        aria-live={ariaLive ?? (announce ? "polite" : undefined)}
        data-slot="empty"
        data-reason={reason}
        data-scope={scope}
        data-density={density}
        data-align={align}
        className={cn(
          "flex w-full min-w-0 flex-col justify-center text-fg-default [container-type:inline-size]",
          scopeClasses[scope],
          densityClasses[density],
          align === "center"
            ? "items-center text-center"
            : "items-start text-left",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </EmptyContext.Provider>
  )
);

Empty.displayName = "Empty";

export type EmptyMediaVariant = "icon" | "illustration" | "custom";

export interface EmptyMediaProps extends ComponentPropsWithoutRef<"div"> {
  variant?: EmptyMediaVariant;
  /** Decorative media is removed from the accessibility tree by default. */
  decorative?: boolean;
}

/** Icon, built-in illustration, uploaded image, or another custom visual. */
const EmptyMedia = forwardRef<HTMLDivElement, EmptyMediaProps>(
  (
    {
      variant = "illustration",
      decorative = true,
      className,
      ...props
    },
    ref
  ) => {
    const { density, scope } = useContext(EmptyContext);
    const isCompact = density === "compact" || scope === "inline";

    return (
      <div
        ref={ref}
        aria-hidden={decorative ? true : undefined}
        data-slot="empty-media"
        data-variant={variant}
        className={cn(
          "flex shrink-0 items-center justify-center text-fg-subtle",
          variant === "icon" &&
            (isCompact
              ? "size-8 [&_svg]:size-6"
              : "size-10 [&_svg]:size-7"),
          variant === "illustration" &&
            (scope === "page"
              ? "h-auto w-full max-w-60 [&_svg]:h-auto [&_svg]:w-full"
              : scope === "section"
                ? "h-auto w-full max-w-36 [&_svg]:h-auto [&_svg]:w-full"
                : "h-auto w-full max-w-16 [&_svg]:h-auto [&_svg]:w-full"),
          variant === "custom" &&
            "max-w-full overflow-hidden [&_img]:max-h-44 [&_img]:max-w-full [&_img]:object-contain",
          className
        )}
        {...props}
      />
    );
  }
);

EmptyMedia.displayName = "EmptyMedia";

export type EmptyHeaderProps = ComponentPropsWithoutRef<"div">;

/** Groups the title and its supporting explanation. */
const EmptyHeader = forwardRef<HTMLDivElement, EmptyHeaderProps>(
  ({ className, ...props }, ref) => {
    const { align, scope } = useContext(EmptyContext);

    return (
      <div
        ref={ref}
        data-slot="empty-header"
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          scope === "page"
            ? "max-w-xl"
            : scope === "section"
              ? "max-w-md"
              : "max-w-sm",
          align === "center" ? "items-center" : "items-start",
          className
        )}
        {...props}
      />
    );
  }
);

EmptyHeader.displayName = "EmptyHeader";

export interface EmptyTitleProps extends ComponentPropsWithoutRef<"h3"> {
  /** Select the heading level that follows the surrounding page structure. */
  as?: "h2" | "h3" | "h4";
}

/** A concise statement of the empty result. */
const EmptyTitle = forwardRef<HTMLHeadingElement, EmptyTitleProps>(
  ({ as: TitleElement = "h3", className, ...props }, ref) => {
    const { density, scope } = useContext(EmptyContext);

    return (
      <TitleElement
        ref={ref}
        data-slot="empty-title"
        className={cn(
          "text-pretty text-fg-default",
          scope === "page" && density !== "compact"
            ? "text-title font-semibold"
            : scope === "inline"
              ? "text-body font-medium"
              : "text-body font-semibold",
          className
        )}
        {...props}
      />
    );
  }
);

EmptyTitle.displayName = "EmptyTitle";

export type EmptyDescriptionProps = ComponentPropsWithoutRef<"p">;

/** One or two sentences that explain the absence and the useful next step. */
const EmptyDescription = forwardRef<
  HTMLParagraphElement,
  EmptyDescriptionProps
>(({ className, ...props }, ref) => {
  const { scope } = useContext(EmptyContext);

  return (
    <p
      ref={ref}
      data-slot="empty-description"
      className={cn(
        "text-pretty text-fg-muted",
        scope === "inline" ? "text-label leading-5" : "text-body leading-6",
        className
      )}
      {...props}
    />
  );
});

EmptyDescription.displayName = "EmptyDescription";

export type EmptyContentProps = ComponentPropsWithoutRef<"div">;

/** Optional content such as search, upload, templates, or a filled-state preview. */
const EmptyContent = forwardRef<HTMLDivElement, EmptyContentProps>(
  ({ className, ...props }, ref) => {
    const { align, scope } = useContext(EmptyContext);

    return (
      <div
        ref={ref}
        data-slot="empty-content"
        className={cn(
          "flex w-full min-w-0 flex-col gap-3",
          scope === "page"
            ? "max-w-xl"
            : scope === "section"
              ? "max-w-md"
              : "max-w-sm",
          align === "center" ? "items-center" : "items-start",
          className
        )}
        {...props}
      />
    );
  }
);

EmptyContent.displayName = "EmptyContent";

export type EmptyActionsProps = ComponentPropsWithoutRef<"div">;

/** One primary and, when useful, one secondary action. */
const EmptyActions = forwardRef<HTMLDivElement, EmptyActionsProps>(
  ({ className, ...props }, ref) => {
    const { align } = useContext(EmptyContext);

    return (
      <div
        ref={ref}
        data-slot="empty-actions"
        className={cn(
          "flex max-w-full flex-wrap items-center gap-2 [&>*]:max-w-full",
          align === "center" ? "justify-center" : "justify-start",
          className
        )}
        {...props}
      />
    );
  }
);

EmptyActions.displayName = "EmptyActions";

export type EmptyHelpProps = ComponentPropsWithoutRef<"div">;

/** A tertiary documentation or support link. */
const EmptyHelp = forwardRef<HTMLDivElement, EmptyHelpProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="empty-help"
      className={cn(
        "text-label leading-5 text-fg-muted",
        "[&_a]:font-medium [&_a]:text-fg-default [&_a]:underline [&_a]:decoration-current/30 [&_a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
);

EmptyHelp.displayName = "EmptyHelp";

export type EmptyIllustrationVariant =
  | "general"
  | "resources"
  | "search"
  | "filter"
  | "inbox"
  | "analytics";

type EmptyIllustrationAccessibility =
  | { decorative?: true; label?: never }
  | { decorative: false; label: string };

export type EmptyIllustrationProps = Omit<
  SVGProps<SVGSVGElement>,
  "children"
> & {
  variant?: EmptyIllustrationVariant;
} & EmptyIllustrationAccessibility;

/** Theme-aware built-in illustrations. Uploaded images can use EmptyMedia directly. */
function EmptyIllustration({
  variant = "general",
  decorative = true,
  label,
  className,
  ...props
}: EmptyIllustrationProps) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      data-slot="empty-illustration"
      data-variant={variant}
      className={cn("text-fg-subtle", className)}
      {...props}
    >
      <path
        d="M28 130.5H212"
        stroke="var(--border-subtle)"
        strokeDasharray="3 6"
      />
      {variant === "general" && (
        <>
          <rect
            x="62"
            y="35"
            width="116"
            height="78"
            rx="13"
            fill="var(--surface-raised)"
            stroke="var(--border)"
          />
          <rect
            x="75"
            y="48"
            width="90"
            height="52"
            rx="9"
            fill="var(--surface-floating)"
            stroke="var(--border)"
          />
          <circle cx="104" cy="74" r="3" fill="currentColor" />
          <circle cx="120" cy="74" r="3" fill="currentColor" />
          <circle cx="136" cy="74" r="3" fill="currentColor" />
          <path d="M91 116H149" stroke="var(--border)" strokeLinecap="round" />
        </>
      )}

      {variant === "resources" && (
        <>
          <path d="M67 58L104 75M173 58L136 75M120 102V122" stroke="var(--border)" />
          <rect x="39" y="37" width="56" height="40" rx="10" fill="var(--surface-raised)" stroke="var(--border)" />
          <rect x="145" y="37" width="56" height="40" rx="10" fill="var(--surface-raised)" stroke="var(--border)" />
          <rect x="88" y="62" width="64" height="48" rx="12" fill="var(--surface-floating)" stroke="var(--border)" />
          <rect x="100" y="75" width="12" height="12" rx="3" fill="var(--brand)" />
          <path d="M119 78H140M119 85H132" stroke="currentColor" strokeLinecap="round" />
          <circle cx="120" cy="126" r="5" fill="var(--surface-floating)" stroke="var(--border)" />
        </>
      )}

      {variant === "search" && (
        <>
          <rect x="47" y="36" width="94" height="82" rx="12" fill="var(--surface-raised)" stroke="var(--border)" />
          <rect x="60" y="49" width="68" height="8" rx="4" fill="var(--surface-floating)" />
          <path d="M62 71H112M62 84H102M62 97H91" stroke="currentColor" strokeLinecap="round" opacity="0.55" />
          <circle cx="151" cy="87" r="28" fill="var(--surface-floating)" stroke="var(--border)" strokeWidth="2" />
          <circle cx="151" cy="87" r="10" stroke="var(--brand)" strokeWidth="3" />
          <path d="M159 95L171 107" stroke="var(--brand)" strokeLinecap="round" strokeWidth="3" />
        </>
      )}

      {variant === "filter" && (
        <>
          <rect x="43" y="41" width="154" height="78" rx="14" fill="var(--surface-raised)" stroke="var(--border)" />
          <path d="M82 62H158L132 87V103L108 111V87L82 62Z" fill="var(--surface-floating)" stroke="var(--border)" />
          <circle cx="167" cy="52" r="6" fill="var(--brand)" />
          <path d="M58 76H75M165 76H182M58 91H84M156 91H182" stroke="currentColor" strokeLinecap="round" opacity="0.45" />
        </>
      )}

      {variant === "inbox" && (
        <>
          <path d="M62 53H178L192 113H48L62 53Z" fill="var(--surface-raised)" stroke="var(--border)" />
          <path d="M49 99H91L100 111H140L149 99H191" fill="var(--surface-floating)" stroke="var(--border)" />
          <path d="M83 45L120 73L157 45" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" opacity="0.55" />
          <path d="M83 45H157V86H83V45Z" fill="var(--surface-floating)" stroke="var(--border)" />
          <path d="M84 47L120 73L156 47" stroke="var(--brand)" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}

      {variant === "analytics" && (
        <>
          <rect x="43" y="31" width="154" height="94" rx="14" fill="var(--surface-raised)" stroke="var(--border)" />
          <path d="M65 102H179M65 52V102" stroke="currentColor" strokeLinecap="round" opacity="0.5" />
          <rect x="79" y="82" width="17" height="20" rx="4" fill="var(--surface-floating)" stroke="var(--border)" />
          <rect x="109" y="68" width="17" height="34" rx="4" fill="var(--surface-floating)" stroke="var(--border)" />
          <rect x="139" y="57" width="17" height="45" rx="4" fill="var(--surface-floating)" stroke="var(--border)" />
          <path d="M76 72L105 59L133 65L166 45" stroke="var(--brand)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          <circle cx="166" cy="45" r="4" fill="var(--brand)" />
        </>
      )}
    </svg>
  );
}

export {
  Empty,
  EmptyActions,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyHelp,
  EmptyIllustration,
  EmptyMedia,
  EmptyTitle,
};
