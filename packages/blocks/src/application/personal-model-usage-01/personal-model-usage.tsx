"use client";

import { PersonalSettings, type PersonalSettingsProps } from "../personal-settings-01";

export type PersonalModelUsageProps = Omit<PersonalSettingsProps, "defaultView" | "enabledViews" | "lockedNavigation">;

/** A standalone personal model workspace with usage analysis and call logs. */
export function PersonalModelUsage(props: PersonalModelUsageProps) {
  return <PersonalSettings defaultView="modelUsage" enabledViews={["modelUsage", "callLogs"]} lockedNavigation {...props} />;
}
