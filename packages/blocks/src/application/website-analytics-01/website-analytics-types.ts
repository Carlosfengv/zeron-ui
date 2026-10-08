export type WebsiteAnalyticsRange = "7d" | "30d" | "90d";
export type WebsiteAnalyticsMetric = "visitors" | "signups" | "conversion" | "bounceRate";

export interface WebsiteAnalyticsSummary {
  value: number | null;
  /** Counts: relative change as a ratio. Rates: absolute change as a ratio (0.001 = 0.1 percentage points). */
  change: number | null;
}

export interface WebsiteAnalyticsPoint {
  /** ISO date or timestamp, including the offset when a time is supplied. */
  date: string;
  visitors: number | null;
  signups: number | null;
  /** Rates are ratios in [0, 1]. */
  conversion: number | null;
  bounceRate: number | null;
  /** Previous-period buckets aligned by the host to this point. Missing values stay unknown. */
  comparison?: Partial<Record<WebsiteAnalyticsMetric, number | null>>;
}

export interface WebsiteAnalyticsRanking {
  id: string;
  label: string;
  visitors: number | null;
}

export interface WebsiteAnalyticsData {
  /** Used to avoid displaying the previous range's response under a new range label. */
  range: WebsiteAnalyticsRange;
  metrics: Record<WebsiteAnalyticsMetric, WebsiteAnalyticsSummary>;
  trend: WebsiteAnalyticsPoint[];
  pages: WebsiteAnalyticsRanking[];
  sources: WebsiteAnalyticsRanking[];
}

export interface WebsiteAnalyticsLabels {
  title: string;
  visitors: string;
  signups: string;
  conversion: string;
  bounceRate: string;
  range: string;
  range7d: string;
  range30d: string;
  range90d: string;
  compare: string;
  previousPeriod: string;
  export: string;
  topPages: string;
  sources: string;
  date: string;
  viewData: string;
  points: string;
  selected: string;
  empty: string;
  loading: string;
  error: string;
  retry: string;
}

export interface WebsiteAnalyticsContext {
  range: WebsiteAnalyticsRange;
  metric: WebsiteAnalyticsMetric;
  compare: boolean;
}
