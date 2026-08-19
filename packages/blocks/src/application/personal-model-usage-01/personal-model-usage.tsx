"use client";

import { PersonalSettings, type PersonalSettingsProps } from "../personal-settings-01";

export type PersonalModelUsageProps = Omit<PersonalSettingsProps, "defaultView" | "lockedNavigation">;

/** A standalone personal model-usage page with contextual, read-only navigation. */
export function PersonalModelUsage(props: PersonalModelUsageProps) {
  return <PersonalSettings defaultView="modelUsage" lockedNavigation {...props} />;
}
