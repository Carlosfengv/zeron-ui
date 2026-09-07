"use client";

import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#system/utils";

const avatarVariants = cva(
  "group/avatar relative flex shrink-0 select-none after:pointer-events-none after:absolute after:inset-0 after:border after:border-border",
  {
    variants: {
      size: {
        sm: "size-6",
        default: "size-8",
        lg: "size-10",
      },
      shape: {
        circle: "rounded-full after:rounded-full",
        rounded: "rounded-xl after:rounded-xl",
      },
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
    },
  }
);

type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>;
type AvatarShape = NonNullable<VariantProps<typeof avatarVariants>["shape"]>;

interface AvatarProps
  extends Omit<AvatarPrimitive.Root.Props, "className" | "ref"> {
  className?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
}

interface AvatarImageProps
  extends Omit<AvatarPrimitive.Image.Props, "className" | "ref"> {
  className?: string;
}

interface AvatarFallbackProps
  extends Omit<AvatarPrimitive.Fallback.Props, "className" | "ref"> {
  className?: string;
}

type AvatarBadgeProps = ComponentPropsWithoutRef<"span">;
type AvatarGroupProps = ComponentPropsWithoutRef<"div">;
type AvatarGroupCountProps = ComponentPropsWithoutRef<"div">;

interface AvatarWithDetailsProps
  extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  /** Avatar content, typically an `Avatar` component. */
  avatar: ReactNode;
  /** Primary user or account label. */
  name: ReactNode;
  /** Optional secondary user detail, such as a role or email address. */
  description?: ReactNode;
  /** Optional trailing content beside the name, typically a `Badge`. */
  badge?: ReactNode;
}

const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ className, size = "default", shape = "circle", ...props }, ref) => (
    <AvatarPrimitive.Root
      ref={ref}
      data-slot="avatar"
      data-size={size}
      data-shape={shape}
      className={cn(avatarVariants({ size, shape }), className)}
      {...props}
    />
  )
);

Avatar.displayName = "Avatar";

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Image
      ref={ref}
      data-slot="avatar-image"
      className={cn(
        "absolute inset-0 aspect-square size-full object-cover group-data-[shape=circle]/avatar:rounded-full group-data-[shape=rounded]/avatar:rounded-xl",
        "data-[loading]:invisible data-[error]:invisible",
        className
      )}
      {...props}
    />
  )
);

AvatarImage.displayName = "AvatarImage";

const AvatarFallback = forwardRef<HTMLSpanElement, AvatarFallbackProps>(
  ({ className, ...props }, ref) => (
    <AvatarPrimitive.Fallback
      ref={ref}
      data-slot="avatar-fallback"
      className={cn(
        "absolute inset-0 flex size-full items-center justify-center bg-muted text-label text-fg-muted group-data-[shape=circle]/avatar:rounded-full group-data-[shape=rounded]/avatar:rounded-xl group-data-[size=lg]/avatar:text-body",
        className
      )}
      {...props}
    />
  )
);

AvatarFallback.displayName = "AvatarFallback";

const AvatarBadge = forwardRef<HTMLSpanElement, AvatarBadgeProps>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="avatar-badge"
      className={cn(
        "absolute end-0 bottom-0 z-content inline-flex items-center justify-center rounded-full bg-brand text-fg-on-brand ring-2 ring-surface-floating select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
);

AvatarBadge.displayName = "AvatarBadge";

const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 rtl:space-x-reverse *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-surface-floating",
        className
      )}
      {...props}
    />
  )
);

AvatarGroup.displayName = "AvatarGroup";

const AvatarGroupCount = forwardRef<HTMLDivElement, AvatarGroupCountProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-label text-fg-muted ring-2 ring-surface-floating group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 group-has-data-[size=lg]/avatar-group:text-body [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
);

AvatarGroupCount.displayName = "AvatarGroupCount";

const AvatarWithDetails = forwardRef<HTMLDivElement, AvatarWithDetailsProps>(
  (
    { avatar, name, description, badge, className, ...props },
    ref
  ) => (
    <div
      ref={ref}
      data-slot="avatar-with-details"
      className={cn("flex min-w-0 items-center gap-2.5", className)}
      {...props}
    >
      <div data-slot="avatar-with-details-avatar" className="shrink-0">
        {avatar}
      </div>
      <div
        data-slot="avatar-with-details-content"
        className="min-w-0 flex-1"
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <div
            data-slot="avatar-with-details-name"
            className="min-w-0 truncate text-body font-semibold leading-5 text-fg-default"
          >
            {name}
          </div>
          {badge != null ? (
            <div data-slot="avatar-with-details-badge" className="shrink-0">
              {badge}
            </div>
          ) : null}
        </div>
        {description != null ? (
          <div
            data-slot="avatar-with-details-description"
            className="mt-0.5 min-w-0 truncate text-label leading-4 text-fg-muted"
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>
  )
);

AvatarWithDetails.displayName = "AvatarWithDetails";

export {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  AvatarWithDetails,
  avatarVariants,
};
export type {
  AvatarBadgeProps,
  AvatarFallbackProps,
  AvatarGroupCountProps,
  AvatarGroupProps,
  AvatarImageProps,
  AvatarProps,
  AvatarShape,
  AvatarSize,
  AvatarWithDetailsProps,
};
