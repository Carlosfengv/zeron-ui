"use client";

import { PersonalSettings, type PersonalSettingsProps } from "../personal-settings-01";

export type ResourceSettingsProps = Omit<PersonalSettingsProps, "defaultView" | "lockedNavigation">;

/** A standalone model-service settings page with contextual, read-only navigation. */
export function ResourceSettings(props: ResourceSettingsProps) {
  return <PersonalSettings defaultView="models" lockedNavigation {...props} />;
}
