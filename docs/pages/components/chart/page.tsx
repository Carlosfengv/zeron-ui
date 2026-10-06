"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DonutSummary, TimeSeriesChart } from "@zeron/ui/chart";
import { ChartLegend, chartSeriesColor, createChartNumberFormatter } from "@zeron/ui/chart-primitives";
import { Button } from "@zeron/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";

export default function ChartDoc() {
  const t = useTranslations("chart");
  const [scenario, setScenario] = useState("ready");
  const [timeZone, setTimeZone] = useState("Asia/Shanghai");
  const [reversed, setReversed] = useState(false);
  const [wideWindow, setWideWindow] = useState(false);
  const scenarios = ["ready", "empty", "zero", "single", "gap", "partial"];
  const start = Date.UTC(2026, 9, 5);
  const step = wideWindow ? 86400000 : 3600000;
  const data = scenario === "empty" ? [] : Array.from({ length: scenario === "single" ? 1 : 5 }, (_, index) => ({ timestamp: start + index * step, values: { requests: scenario === "gap" && index === 2 ? null : scenario === "zero" ? 0 : [12, 28, 19, 43, 31][index] } }));
  const items = (scenario === "empty" ? [] : [{ id: "gateway", label: t("gateway"), value: scenario === "zero" ? 0 : 72 }, { id: "functions", label: t("longName"), value: scenario === "partial" ? null : scenario === "zero" ? 0 : 28 }]);
  const segments = reversed ? [...items].reverse() : items;
  const total = scenario === "empty" || scenario === "zero" ? 0 : 100;
  const format = createChartNumberFormatter("zh-CN");
  return <DocPage title="Chart" slug="chart" description={t("description")}>
    <DocSection title={t("examples")}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={scenario} onValueChange={(value) => value && setScenario(value)}><SelectTrigger aria-label={t("scenario")} /><SelectContent>{scenarios.map((value) => <SelectItem key={value} value={value} label={t(value)}>{t(value)}</SelectItem>)}</SelectContent></Select>
        <Select value={timeZone} onValueChange={(value) => value && setTimeZone(value)}><SelectTrigger aria-label={t("timeZone")} /><SelectContent><SelectItem value="Asia/Shanghai" label="Asia/Shanghai">Asia/Shanghai</SelectItem><SelectItem value="UTC" label="UTC">UTC</SelectItem></SelectContent></Select>
        <Button variant="secondary" onClick={() => setReversed(!reversed)}>{t("reorder")}</Button>
        <Button variant="secondary" onClick={() => setWideWindow(!wideWindow)}>{wideWindow ? t("intraday") : t("daily")}</Button>
      </div>
      <ComponentPreview code={'<TimeSeriesChart data={data} series={[{ id: "requests", label: "Requests" }]} locale="en" timeZone="UTC" label="Requests" />'}>
        <div className="w-full min-w-0"><TimeSeriesChart data={data} series={[{ id: "requests", label: t("requests"), color: "var(--brand)" }]} locale="zh-CN" timeZone={timeZone} domain={[start, start + step * 5]} label={t("requests")} dataSummary={t("viewData")} /></div>
      </ComponentPreview>
      <ComponentPreview code={'<DonutSummary segments={segments} total={100} aria-label="Distribution" center="100" />'}>
        <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row"><DonutSummary className="shrink-0" segments={segments} total={total} aria-label={`${t("distribution")} ${total}${scenario === "partial" ? ` · ${t("incomplete")}` : ""}`} center={<><strong className="text-heading">{total}</strong><span className="text-label text-fg-subtle">{t("total")}</span></>} /><ChartLegend className="w-full min-w-0 sm:flex-1" items={segments.map((item) => ({ ...item, color: chartSeriesColor(item.id), value: format(item.value), ratio: scenario === "partial" || total === 0 ? "—" : createChartNumberFormatter("zh-CN", { style: "percent" })(item.value! / total) }))} /></div>
      </ComponentPreview>
      {scenario === "partial" && <p className="text-label text-fg-warning">{t("incomplete")}</p>}
    </DocSection>
    <DocSection title={t("contract")}><p className="text-body text-fg-muted">{t("guidance")}</p></DocSection>
  </DocPage>;
}
