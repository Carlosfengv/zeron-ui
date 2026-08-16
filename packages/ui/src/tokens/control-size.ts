export const controlSizes = ["xs", "sm", "md", "lg", "xl"] as const;

export type ControlSize = (typeof controlSizes)[number];

export const controlSizeClasses: Record<ControlSize, string> = {
  xs: "h-control-xs",
  sm: "h-control-sm",
  md: "h-control-md",
  lg: "h-control-lg",
  xl: "h-control-xl",
};

export const controlSizeRecipe = {
  xs: { height: 24, text: "text-label", icon: 12, gap: "gap-1" },
  sm: { height: 28, text: "text-label", icon: 14, gap: "gap-1" },
  md: { height: 32, text: "text-body", icon: 16, gap: "gap-1.5" },
  lg: { height: 36, text: "text-body", icon: 16, gap: "gap-1.5" },
  xl: { height: 40, text: "text-body", icon: 18, gap: "gap-2" },
} as const satisfies Record<ControlSize, {
  height: number;
  text: string;
  icon: number;
  gap: string;
}>;

export const controlButtonPaddingClasses: Record<ControlSize, string> = {
  xs: "px-2",
  sm: "px-2.5",
  md: "px-3",
  lg: "px-3.5",
  xl: "px-4",
};

export const controlFieldPaddingClasses: Record<ControlSize, string> = {
  xs: "px-1.5",
  sm: "px-2",
  md: "px-2.5",
  lg: "px-3",
  xl: "px-3.5",
};
