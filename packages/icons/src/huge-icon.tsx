import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { ComponentType, SVGProps } from "react";

export interface HugeIconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  secondaryColor?: string;
  disableSecondaryOpacity?: boolean;
}

export type HugeIconComponent = ComponentType<HugeIconProps>;

export interface CreateHugeIconOptions {
  /** Only stroke icon sets should accept a caller-supplied stroke width. */
  adjustableStrokeWidth?: boolean;
}

/** Adapts a HugeIcons definition to the component shape used throughout the UI. */
export function createHugeIcon(
  icon: unknown,
  { adjustableStrokeWidth = true }: CreateHugeIconOptions = {}
): HugeIconComponent {
  function HugeIcon({ size = 24, strokeWidth, ...props }: HugeIconProps) {
    return (
      <HugeiconsIcon
        icon={icon as IconSvgElement}
        size={size}
        {...(adjustableStrokeWidth && strokeWidth !== undefined ? { strokeWidth } : {})}
        {...props}
      />
    );
  }

  HugeIcon.displayName = "HugeIcon";
  return HugeIcon;
}
