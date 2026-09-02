"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ReactNode,
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
  | "preview"
  | "search"
  | "filter"
  | "inbox"
  | "analytics";

export type EmptyIllustrationMediaFit = "contain" | "cover";

type EmptyIllustrationAccessibility =
  | { decorative?: true; label?: never }
  | { decorative: false; label: string };

type EmptyIllustrationBaseProps = Omit<
  SVGProps<SVGSVGElement>,
  "children"
> & EmptyIllustrationAccessibility;

type EmptyIllustrationStaticProps = EmptyIllustrationBaseProps & {
  variant?: Exclude<EmptyIllustrationVariant, "preview">;
  media?: never;
  mediaClassName?: never;
  mediaFit?: never;
};

type EmptyIllustrationPreviewProps = EmptyIllustrationBaseProps & {
  variant: "preview";
  /** Decorative icon or image rendered on the perspective-mapped front card. */
  media: ReactNode;
  /** Controls how an img element fills the perspective media plane. */
  mediaFit?: EmptyIllustrationMediaFit;
  /** Styles the normalized media plane before perspective mapping. */
  mediaClassName?: string;
};

export type EmptyIllustrationProps =
  | EmptyIllustrationStaticProps
  | EmptyIllustrationPreviewProps;

/** Exact vector geometry exported from Figma node 1:96. */
const previewSidePath =
  "M41.8059 2.09455C41.003 1.68616 39.9716 1.72092 38.8503 2.28853L7.93709 18.0426C5.39674 19.3369 3.33402 22.8949 3.33402 25.9822V63.6023C3.33402 65.3259 3.97086 66.5373 4.97452 67.0564L1.88741 65.4852C0.883753 64.973 0.246914 63.7549 0.246914 62.0313V24.4108C0.246914 21.3168 2.30963 17.7657 4.84998 16.4712L35.7632 0.71727C36.8914 0.142751 37.9227 0.114899 38.7187 0.523294L41.8059 2.09455Z";
const previewFacePath =
  "M38.7187 0.523253C39.7224 1.03555 40.3592 2.25392 40.3592 3.97748V41.5979C40.3592 44.692 38.2965 48.2428 35.7562 49.5372L4.84306 65.2915C3.71477 65.8661 2.68336 65.8936 1.88741 65.4852C0.883654 64.973 0.246914 63.7546 0.246914 62.031V24.4109C0.246914 21.3168 2.30963 17.7657 4.84998 16.4713L35.7631 0.717327C36.8914 0.142809 37.9228 0.114858 38.7187 0.523253Z";

/** Theme-aware built-in illustrations. Uploaded images can use EmptyMedia directly. */
function EmptyIllustration({
  variant = "general",
  decorative = true,
  label,
  media,
  mediaClassName,
  mediaFit = "contain",
  className,
  ...props
}: EmptyIllustrationProps) {
  const illustrationId = useId().replace(/:/g, "");
  const generalFadeId = `empty-general-fade-${illustrationId}`;
  const generalMaskId = `empty-general-mask-${illustrationId}`;
  const previewClipId = `empty-preview-clip-${illustrationId}`;
  const viewBox =
    variant === "general"
      ? "0 0 208 96"
      : variant === "resources"
        ? "0 0 224 112"
        : variant === "preview"
          ? "0 0 72 80"
          : "0 0 240 160";

  return (
    <svg
      viewBox={viewBox}
      fill="none"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      data-slot="empty-illustration"
      data-variant={variant}
      data-media-fit={variant === "preview" ? mediaFit : undefined}
      className={cn("text-fg-subtle", className)}
      {...props}
    >
      {variant === "general" && (
        <>
          <defs>
            <linearGradient
              id={generalFadeId}
              x1="0"
              y1="0"
              x2="0"
              y2="96"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0.6667" stopColor="white" />
              <stop offset="0.8333" stopColor="white" stopOpacity="0.4" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask
              id={generalMaskId}
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="208"
              height="96"
            >
              <rect
                width="208"
                height="96"
                fill={`url(#${generalFadeId})`}
              />
            </mask>
          </defs>
          <g mask={`url(#${generalMaskId})`}>
            <rect
              x="24.25"
              y="0.25"
              width="159.5"
              height="23.5"
              rx="9.75"
              fill="var(--surface-raised)"
              fillOpacity="0.6"
              stroke="var(--border-subtle)"
              strokeOpacity="0.75"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="12.25"
              y="12.25"
              width="183.5"
              height="23.5"
              rx="9.75"
              fill="var(--surface-raised)"
              fillOpacity="0.8"
              stroke="var(--border-subtle)"
              strokeOpacity="0.85"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="0.25"
              y="24.25"
              width="207.5"
              height="63.5"
              rx="9.75"
              fill="var(--surface-floating)"
              stroke="var(--border)"
              strokeOpacity="0.85"
              strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x="16"
              y="40"
              width="32"
              height="32"
              rx="4"
              fill="var(--emphasis)"
            />
            <rect
              x="60"
              y="44"
              width="97.5"
              height="10"
              rx="4"
              fill="var(--emphasis)"
            />
            <rect
              x="60"
              y="60"
              width="65"
              height="8"
              rx="4"
              fill="var(--emphasis)"
              fillOpacity="0.6"
            />
          </g>
        </>
      )}

      {variant !== "general" &&
        variant !== "resources" &&
        variant !== "preview" && (
        <path
          d="M28 130.5H212"
          stroke="var(--border-subtle)"
          strokeDasharray="3 6"
        />
      )}

      {variant === "resources" && (
        <>
          <rect
            x="24.25"
            y="64.25"
            width="175.5"
            height="47.5"
            rx="9.75"
            fill="var(--surface-raised)"
            fillOpacity="0.5"
            stroke="var(--border-subtle)"
            strokeOpacity="0.6"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x="36"
            y="78"
            width="20"
            height="20"
            rx="4"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <rect
            x="66"
            y="78"
            width="120"
            height="8"
            rx="4"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <rect
            x="66"
            y="90"
            width="80"
            height="8"
            rx="4"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <rect
            x="12.25"
            y="48.25"
            width="199.5"
            height="47.5"
            rx="9.75"
            fill="var(--surface-raised)"
            fillOpacity="0.7"
            stroke="var(--border-subtle)"
            strokeOpacity="0.75"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x="24"
            y="62"
            width="20"
            height="20"
            rx="4"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <rect
            x="54"
            y="62"
            width="144"
            height="8"
            rx="4"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <rect
            x="54"
            y="74"
            width="108"
            height="8"
            rx="4"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <rect
            x="0.25"
            y="24.25"
            width="223.5"
            height="55.5"
            rx="9.75"
            fill="var(--surface-floating)"
            stroke="var(--border)"
            strokeOpacity="0.85"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          <rect
            x="14"
            y="38"
            width="28"
            height="28"
            rx="4"
            fill="var(--emphasis)"
          />
          <rect
            x="54"
            y="40"
            width="154"
            height="10"
            rx="4"
            fill="var(--emphasis)"
          />
          <rect
            x="54"
            y="56"
            width="92.398"
            height="8"
            rx="4"
            fill="var(--emphasis)"
            fillOpacity="0.7"
          />
        </>
      )}

      {variant === "preview" && (
        <>
          <defs>
            <clipPath id={previewClipId} clipPathUnits="userSpaceOnUse">
              <path
                d={previewFacePath}
                transform="translate(30.438 13.423)"
              />
            </clipPath>
          </defs>

          <g opacity="0.4">
            <path
              d={previewSidePath}
              transform="translate(0.374 -0.071)"
              fill="var(--surface-raised)"
              stroke="currentColor"
              strokeOpacity="0.333"
              strokeWidth="0.493827"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={previewFacePath}
              transform="translate(3.459 1.495)"
              fill="var(--surface-floating)"
              stroke="currentColor"
              strokeOpacity="0.333"
              strokeWidth="0.493827"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          <g opacity="0.6">
            <path
              d={previewSidePath}
              transform="translate(13.852 5.889)"
              fill="var(--surface-raised)"
              stroke="currentColor"
              strokeOpacity="0.333"
              strokeWidth="0.493827"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={previewFacePath}
              transform="translate(16.938 7.463)"
              fill="var(--surface-floating)"
              stroke="currentColor"
              strokeOpacity="0.333"
              strokeWidth="0.493827"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>

          <g opacity="0.8">
            <path
              d={previewSidePath}
              transform="translate(27.352 11.857)"
              fill="var(--surface-raised)"
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="0.493827"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={previewFacePath}
              transform="translate(30.438 13.423)"
              fill="var(--surface-floating)"
            />
            <g clipPath={`url(#${previewClipId})`}>
              <foreignObject
                width="100"
                height="100"
                transform="matrix(0.3091312 -0.15753973 -0.0000692 0.488202 35.28798 29.8943)"
                pointerEvents="none"
              >
                <div
                  aria-hidden="true"
                  data-slot="empty-illustration-media"
                  className={cn(
                    "flex size-full items-center justify-center overflow-hidden text-fg-subtle",
                    "[&>img]:size-full [&>svg]:size-12 [&>svg]:shrink-0",
                    mediaFit === "cover"
                      ? "[&>img]:object-cover"
                      : "[&>img]:object-contain",
                    mediaClassName
                  )}
                >
                  {media}
                </div>
              </foreignObject>
            </g>
            <path
              d={previewFacePath}
              transform="translate(30.438 13.423)"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.5"
              strokeWidth="0.493827"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
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
