"use client";

import { PersonalSettings, type PersonalSettingsProps } from "../personal-settings-01";

export type PersonalUsageProps = Omit<PersonalSettingsProps, "defaultView" | "lockedNavigation">;

/** A standalone personal activity dashboard with contextual, read-only navigation. */
export function PersonalUsage(props: PersonalUsageProps) {
  return <PersonalSettings defaultView="usage" lockedNavigation {...props} />;
}
