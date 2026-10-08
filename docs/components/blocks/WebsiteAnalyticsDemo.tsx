"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { WebsiteAnalytics, createWebsiteAnalyticsDemoData, websiteAnalyticsLabels, websiteAnalyticsEnglishLabels, type WebsiteAnalyticsContext, type WebsiteAnalyticsRange } from "@zeron/blocks/website-analytics-01";

export function WebsiteAnalyticsDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const [range, setRange] = useState<WebsiteAnalyticsRange>("30d");
  const data = useMemo(() => createWebsiteAnalyticsDemoData(range), [range]);

  function exportData(context: WebsiteAnalyticsContext) {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ demonstration: true, context, data }, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `website-analytics-${range}-demo.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="flex h-full min-h-0 w-full overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="m-auto w-full max-w-6xl space-y-4">
      <WebsiteAnalytics data={data} site="example.com" range={range} onRangeChange={setRange} onExport={exportData} labels={zh ? websiteAnalyticsLabels : websiteAnalyticsEnglishLabels} locale={locale} timeZone="UTC" />
      <p className="px-2 text-label text-fg-subtle">{zh ? "固定示例数据 · 时间范围、指标和同期对比可切换，导出包含当前示例快照。" : "Fixed example data · switch periods, metrics and comparison; export the current example snapshot."}</p>
    </div>
  </div>;
}
