import type { HeatmapColumn } from "@zeron/ui/heatmap-chart";
import type { CommitHistoryEntry } from "./commit-history.server";

export function commitDateKey(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

// These UTC dates encode calendar identity, not the original commit instant.
// Using UTC arithmetic also keeps DST transitions and SSR hydration stable.
export const activityDateKey = (date: Date) => date.toISOString().slice(0, 10);
export const activityDate = (key: string) => new Date(`${key}T00:00:00Z`);

export function formatActivityDate(key: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", year: "numeric", month: locale === "zh-CN" ? "long" : "short", day: "numeric" }).format(activityDate(key));
}

export function buildCommitActivity(commits: CommitHistoryEntry[], asOf: string, timeZone: string) {
  const through = commitDateKey(new Date(asOf), timeZone);
  const year = through.slice(0, 4);
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const startDate = activityDate(start);
  const groups = new Map<string, CommitHistoryEntry[]>();
  const seen = new Set<string>();
  const cutoff = Date.parse(asOf);
  const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  for (const commit of [...commits].sort((a, b) => Date.parse(b.committedAt) - Date.parse(a.committedAt))) {
    const timestamp = Date.parse(commit.committedAt);
    if (!Number.isFinite(timestamp) || timestamp > cutoff || seen.has(commit.id)) continue;
    seen.add(commit.id);
    const parts = dateFormatter.formatToParts(new Date(timestamp));
    const date = ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-");
    if (date < start || date > through) continue;
    const group = groups.get(date);
    if (group) group.push(commit);
    else groups.set(date, [commit]);
  }
  const cursor = new Date(startDate);
  cursor.setUTCDate(cursor.getUTCDate() - cursor.getUTCDay());
  const columns: HeatmapColumn[] = [];
  while (activityDateKey(cursor) <= end) {
    columns.push({ bin: columns.length, bins: Array.from({ length: 7 }, (_, bin) => {
      const date = new Date(cursor);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      const key = activityDateKey(date);
      return { bin, date, count: key < start || key > through ? -1 : groups.get(key)?.length ?? 0 };
    }) });
  }
  return { columns, groups, start, end, through, year, total: [...groups.values()].reduce((total, group) => total + group.length, 0), activeDays: groups.size };
}
