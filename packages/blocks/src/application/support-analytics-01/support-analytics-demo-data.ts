import type { SupportAnalyticsChannel, SupportAnalyticsMetric, SupportAnalyticsQuery, SupportAnalyticsSnapshot, SupportAnalyticsView, SupportTicket } from "./support-analytics-types";

const day = 86400000;
const totals = {
  "this-week": [622, 396, 190, 110],
  "last-30-days": [2577, 1610, 751, 431],
  "last-12-weeks": [4251, 3112, 3380, 2768],
};
const openCounts = { "this-week": [72, 47, 24, 12], "last-30-days": [291, 191, 87, 49], "last-12-weeks": [580, 420, 451, 371] };
const channels = ["email", "live-chat", "in-app", "social"] as const;
const names = ["Greta Hoffmann", "Jonas Weber", "Mateusz Kowalski", "Dev Malhotra", "Lily Hayes", "Kai Chen", "Noah Williams", "Sofia Costa"];

export interface SupportAnalyticsDemoRecord extends SupportTicket {
  firstReplyMs: number;
  resolutionMs: number | null;
  firstContact: boolean;
  reopened: boolean;
}
export interface SupportAnalyticsDemoOptions { resolvedTicketIds?: readonly string[]; revision?: number; empty?: boolean }

/** Fixed, synthetic records. Aggregates are recalculated from the full fixture, never its four-row preview. */
export function createSupportAnalyticsDemoRecords(query: SupportAnalyticsQuery, options: SupportAnalyticsDemoOptions = {}): SupportAnalyticsDemoRecord[] {
  if (options.empty) return [];
  const length = query.range === "this-week" ? 7 : query.range === "last-30-days" ? 30 : 12;
  const bucketMs = query.range === "last-12-weeks" ? day * 7 : day;
  // Complete weeks in Asia/Shanghai; the demo clock is fixed at the end of September 13.
  const end = Date.UTC(2026, 8, 13, 16);
  const start = end - length * bucketMs;
  const resolved = new Set(options.resolvedTicketIds);
  return channels.flatMap((channel, channelIndex) => {
    if (query.channel !== "all" && channel !== query.channel) return [];
    const total = totals[query.range][channelIndex];
    const open = openCounts[query.range][channelIndex];
    const weights = Array.from({ length }, (_, index) => query.range === "last-12-weeks" ? 0.85 + index * 0.025 : 1.35 - index / length * 0.65);
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const bucketCounts = weights.map((weight) => Math.floor(total * weight / weightTotal));
    const remainder = total - bucketCounts.reduce((sum, count) => sum + count, 0);
    for (let index = 0; index < remainder; index += 1) bucketCounts[index % length] += 1;
    const replyFactors = bucketCounts.map((_, index) => 1 + Math.sin(index * 1.8) * 0.16 - index / length * 0.08);
    const replyMeanFactor = bucketCounts.reduce((sum, count, index) => sum + count * replyFactors[index], 0) / total;
    let index = 0;
    return bucketCounts.flatMap((_, reverseIndex) => {
      const bucketIndex = length - 1 - reverseIndex;
      return Array.from({ length: bucketCounts[bucketIndex] }, (_, position) => {
        const i = index++;
        const id = `${query.range}:${channel}:${i}`;
        const newlyResolved = resolved.has(id);
        const status = i < open && !newlyResolved ? "open" : "resolved";
        const firstReplyMs = (channel === "live-chat" ? 5 : channel === "email" ? 60 : channel === "in-app" ? 35 : 50) * 60000 * replyFactors[bucketIndex] / replyMeanFactor;
        const resolutionMs = status === "resolved" ? (newlyResolved ? 45 : channel === "live-chat" ? 48 : 413) * 60000 : null;
        return { id, number: `#HD-${3370 + channelIndex * 20000 + i}`, customer: names[i % names.length], subject: ["Billing question", "Account access", "Workspace settings", "API connection"][i % 4], channel, status, priority: i % 11 === 1 ? "urgent" : i % 5 === 2 ? "low" : "normal",
          createdAt: start + bucketIndex * bucketMs + (bucketMs * (1 - (position + 1) / (bucketCounts[bucketIndex] + 1))), canResolve: true,
          firstReplyMs, resolutionMs, firstContact: newlyResolved || ((i - open) * 37) % (total - open) < Math.round((total - open) * 0.728), reopened: i >= open && ((i - open) * 43) % (total - open) < Math.round((total - open) * 0.063),
        } satisfies SupportAnalyticsDemoRecord;
      });
    });
  }).sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
}

export function createSupportAnalyticsDemoData(query: SupportAnalyticsQuery = { range: "this-week", channel: "all" }, options: SupportAnalyticsDemoOptions = {}): SupportAnalyticsSnapshot {
  const records = createSupportAnalyticsDemoRecords(query, options);
  const length = query.range === "this-week" ? 7 : query.range === "last-30-days" ? 30 : 12;
  const bucketMs = query.range === "last-12-weeks" ? day * 7 : day;
  const end = Date.UTC(2026, 8, 13, 16);
  const start = end - length * bucketMs;
  const buckets = Array.from({ length }, (_, index) => ({ start: start + index * bucketMs, end: start + (index + 1) * bucketMs, count: records.filter((record) => record.createdAt >= start + index * bucketMs && record.createdAt < start + (index + 1) * bucketMs).length }));
  const viewData = (view: SupportAnalyticsView) => {
    const selected = records.filter((record) => view === "all" || record.status === view);
    const definitions = (view === "open" ? ["first-reply", "waiting", "sla-breach"] : view === "resolved" ? ["first-reply", "resolution", "reopened"] : ["first-reply", "resolution", "first-contact"]) as SupportAnalyticsMetric["id"][];
    const metrics = definitions.map((id): SupportAnalyticsMetric => {
      const ratio = ["sla-breach", "reopened", "first-contact"].includes(id);
      const samples = selected.filter((record) => !["resolution", "reopened", "first-contact"].includes(id) || record.status === "resolved");
      const measurement = (record: SupportAnalyticsDemoRecord) => id === "first-reply" ? record.firstReplyMs : id === "waiting" ? end - record.createdAt : id === "resolution" ? record.resolutionMs! : id === "sla-breach" ? Number(end - record.createdAt > 8 * 3600000) : id === "first-contact" ? Number(record.firstContact) : Number(record.reopened);
      const average = (items: readonly SupportAnalyticsDemoRecord[]) => items.length ? items.reduce((sum, record) => sum + measurement(record), 0) / items.length : null;
      const value = average(samples);
      return { id, unit: ratio ? "ratio" : "milliseconds", sampleSize: samples.length, aggregation: ratio ? "ratio" : "mean", value,
        previousValue: value === null ? null : ratio ? Math.max(0, Math.min(1, value - (id === "first-contact" ? 0.034 : 0.007))) : value / (id === "resolution" ? 1.025 : 0.945),
        target: id === "first-reply" ? 45 * 60000 : id === "first-contact" ? 0.7 : ratio ? 0.08 : 8 * 3600000,
        improvementDirection: id === "first-contact" ? "higher" : "lower", comparison: ratio ? "percentage-points" : "relative",
        trend: buckets.map((bucket) => ({ timestamp: bucket.start, value: average(samples.filter((record) => record.createdAt >= bucket.start && record.createdAt < bucket.end)) })),
      };
    });
    return { metrics, recentTickets: selected.slice(0, 4) };
  };
  const views = { all: viewData("all"), open: viewData("open"), resolved: viewData("resolved") };
  const total = records.length;
  return { ...query, id: `demo:${query.range}:${query.channel}`, revision: String(options.revision ?? 0), scopeId: "support-demo", window: { start, end, observedThrough: end, bucketMs }, previousWindow: { start: start - length * bucketMs, end: start }, updatedAt: end,
    total, previousTotal: Math.round(total / (query.channel === "live-chat" ? 1.16 : query.range === "this-week" ? 1.078 : 1.12)),
    counts: { open: records.filter((record) => record.status === "open").length, resolved: records.filter((record) => record.status === "resolved").length }, buckets, views,
  };
}

export const supportAnalyticsDemoData = createSupportAnalyticsDemoData();
export const supportAnalyticsDemoChannels: readonly SupportAnalyticsChannel[] = ["all", ...channels];
