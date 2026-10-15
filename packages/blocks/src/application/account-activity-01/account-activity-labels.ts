import type { AccountActivityLabels } from "./account-activity-types";

export const accountActivityDefaultLabels: AccountActivityLabels = {
  matrix: "Matrix", weeks: "Weeks", range: "Range", accounts: "By Account", views: "Activity view",
  allAccounts: "All Accounts", accountFilter: "Filter accounts", all: "All days", weekdays: "Weekdays", weekends: "Weekends", dayFilter: "Filter days",
  active: "Accounts active", averageActive: "avg accounts active", dayProfile: "Day profile", ranOut: "Ran out", locked: "Locked", neverLocked: "Never locked",
  weekday: "Weekday", weekend: "Weekend", missing: "Dotted: no reading.", quiet: "Quiet", quietActivity: "Quiet", busiestHour: "Busiest hour",
  typicalWeek: "Typical week", averageHour: "avg per hour", night: "Night, 00–07", peak: "Peak", windowFilling: "Window filling",
  usageWindows: "Usage per window", usageWindowsHint: "How full each limit window got", windowPeak: "Window peak", hitLimit: "Hit the limit", thisWindow: "This window",
  selectedDays: "Selected days", selectRange: "Selected date range", rangeHint: "Drag across the lanes to change the range", accountHint: "Click a name to toggle it.",
  scaleHint: "Each row has its own scale. Averages skip locked hours.", empty: "No activity readings in this selection.", loading: "Loading account activity…",
  error: "Account activity could not be loaded.", retry: "Try again", unknown: "No reading",
  busiest: (time, day) => `Busiest ${time} · ${day}`,
  summary: (events, days, weekdayEvents) => `${events} run-outs in ${days} days, ${weekdayEvents} on weekdays`,
  rangeSummary: (accounts) => `${accounts} accounts`, runOuts: (count) => `${count} run-out${count === 1 ? "" : "s"}`,
  lockedHours: (hours) => `Locked ${hours} h`, accountSummary: (name, time) => `${name} runs out around ${time}`,
  weekAverage: (weeks) => `Mean of ${weeks} weeks`,
};
