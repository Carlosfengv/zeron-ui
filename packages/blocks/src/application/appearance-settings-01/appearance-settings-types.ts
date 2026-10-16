import type { ComponentPropsWithoutRef } from "react";

export type AppearanceTheme = "light" | "dark" | "system";
export type AppearanceAccent = "brand" | "blue" | "violet" | "teal" | "rose" | "gray";
export type AppearanceDensity = "comfortable" | "compact";
export type AppearanceMotion = "system" | "reduce" | "full";

export interface AppearanceSettingsValue {
  theme: AppearanceTheme;
  accent: AppearanceAccent;
  sidebarDensity: AppearanceDensity;
  taskDensity: AppearanceDensity;
  motion: AppearanceMotion;
}

export interface AppearanceSettingsLabels {
  title: string;
  description: string;
  theme: string;
  light: string;
  dark: string;
  system: string;
  accentColor: string;
  accent: string;
  accentDescription: string;
  accentNames: Record<AppearanceAccent, string>;
  density: string;
  sidebarDensity: string;
  sidebarDescription: string;
  taskDisplay: string;
  taskDescription: string;
  comfortable: string;
  compact: string;
  motion: string;
  motionDescription: string;
  followSystem: string;
  reduceMotion: string;
  fullMotion: string;
}

export interface AppearanceSettingsProps extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  /** The host owns applying and persisting these preferences. */
  value: AppearanceSettingsValue;
  onValueChange?: (value: AppearanceSettingsValue) => void;
  disabled?: boolean;
  labels?: Partial<AppearanceSettingsLabels>;
}
