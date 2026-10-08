import type { WebsiteAnalyticsData, WebsiteAnalyticsPoint, WebsiteAnalyticsRange } from "./website-analytics-types";

const dailyVisitors = [1130, 1135, 1220, 1260, 1330, 1070, 1010, 1250, 1290, 1310, 1410, 1450, 1090, 1060, 1330, 1280, 1340, 1410, 1410, 1100, 1060, 1240, 1240, 1310, 1340, 1380, 1090, 1010, 1250, 1280];

/** Fixed, illustrative data. No analytics service is queried. */
export function createWebsiteAnalyticsDemoData(range: WebsiteAnalyticsRange = "30d"): WebsiteAnalyticsData {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const scale = 36686 / dailyVisitors.reduce((sum, value) => sum + value, 0);
  const month = dailyVisitors.map((value) => Math.round(value * scale));
  month[month.length - 1] += 36686 - month.reduce((sum, value) => sum + value, 0);
  const registrations = month.map((value) => Math.round(value * 1746 / 36686));
  registrations[registrations.length - 1] += 1746 - registrations.reduce((sum, value) => sum + value, 0);
  const priorVisitors = month.map((value) => Math.round(value / 1.117));
  const priorSignups = registrations.map((value) => Math.round(value / 1.151));
  priorVisitors[29] += Math.round(36686 / 1.117) - priorVisitors.reduce((sum, value) => sum + value, 0);
  priorSignups[29] += Math.round(1746 / 1.151) - priorSignups.reduce((sum, value) => sum + value, 0);
  const trend: WebsiteAnalyticsPoint[] = Array.from({ length: days }, (_, index) => {
    const day = days === 7 ? 23 + index : index % 30;
    const visitors = month[day];
    const signups = registrations[day];
    const previousVisitors = priorVisitors[day];
    const previousSignups = priorSignups[day];
    return {
      date: new Date(Date.UTC(2026, 8, 30 - days + 1 + index)).toISOString(),
      visitors, signups, conversion: signups / visitors, bounceRate: 0.406,
      comparison: { visitors: previousVisitors, signups: previousSignups, conversion: previousSignups / previousVisitors, bounceRate: 0.413 },
    };
  });
  const visitors = trend.reduce((sum, point) => sum + (point.visitors ?? 0), 0);
  const signups = trend.reduce((sum, point) => sum + (point.signups ?? 0), 0);
  const previousVisitors = trend.reduce((sum, point) => sum + (point.comparison?.visitors ?? 0), 0);
  const previousSignups = trend.reduce((sum, point) => sum + (point.comparison?.signups ?? 0), 0);
  const multiplier = visitors / 36686;
  return {
    range, trend,
    metrics: {
      visitors: { value: visitors, change: visitors / previousVisitors - 1 },
      signups: { value: signups, change: signups / previousSignups - 1 },
      conversion: { value: signups / visitors, change: signups / visitors - previousSignups / previousVisitors },
      bounceRate: { value: 0.406, change: -0.007 },
    },
    pages: [
      { id: "home", label: "/", visitors: Math.round(11373 * multiplier) },
      { id: "pricing", label: "/pricing", visitors: Math.round(6237 * multiplier) },
      { id: "docs", label: "/docs/getting-started", visitors: Math.round(4402 * multiplier) },
      { id: "blog", label: "/blog/usage-based-billing", visitors: Math.round(2935 * multiplier) },
      { id: "changelog", label: "/changelog", visitors: Math.round(1834 * multiplier) },
    ],
    sources: [
      { id: "direct", label: "Direct", visitors: Math.round(13941 * multiplier) },
      { id: "google", label: "Google", visitors: Math.round(10639 * multiplier) },
      { id: "hacker-news", label: "Hacker News", visitors: Math.round(4035 * multiplier) },
      { id: "x", label: "X", visitors: Math.round(2935 * multiplier) },
      { id: "newsletter", label: "Newsletter", visitors: Math.round(2201 * multiplier) },
    ],
  };
}
