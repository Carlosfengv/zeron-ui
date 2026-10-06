"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChartLegend, SegmentedBar, createChartNumberFormatter } from "@zeron/ui/chart-primitives";
import { Button } from "@zeron/ui/button";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";

export default function ChartPrimitivesDoc() {
  const t = useTranslations("chartPrimitives");
  const [overflow, setOverflow] = useState(false);
  const [reversed, setReversed] = useState(false);
  const items = [{ id: "files", label: t("files"), value: overflow ? 140 : 54 }, { id: "backup", label: t("longName"), value: 26 }];
  const segments = reversed ? [...items].reverse() : items;
  const used = items.reduce((sum, item) => sum + item.value, 0);
  const format = createChartNumberFormatter("zh-CN", { style: "percent" });
  return <DocPage title="Chart Primitives" slug="chart-primitives" description={t("description")}>
    <DocSection title={t("examples")}>
      <div className="mb-4 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => setOverflow(!overflow)}>{overflow ? t("restore") : t("overflow")}</Button><Button variant="secondary" onClick={() => setReversed(!reversed)}>{t("reorder")}</Button></div>
      <ComponentPreview code={'<SegmentedBar mode="capacity" total={100} segments={segments} valueText="80 / 100 GB" />'}>
        <div className="grid w-full min-w-0 gap-4"><p className="text-body tabular-nums text-fg-default">{used} / 100 GB · {format(used / 100)}</p><SegmentedBar mode="capacity" total={100} segments={segments} valueText={`${used} / 100 GB`} /><ChartLegend items={segments.map((item) => ({ ...item, value: `${item.value} GB` }))} /></div>
      </ComponentPreview>
      <ComponentPreview code={'<SegmentedBar mode="distribution" total={100} segments={segments} valueText="Known 80, uncovered 20" />'}>
        <div className="grid w-full min-w-0 gap-3"><p className="text-label text-fg-muted">{t("uncovered")}</p><SegmentedBar mode="distribution" total={100} segments={[{ id: "known", label: t("known"), value: 80, color: "var(--fg-success)" }]} valueText={t("uncovered")} /></div>
      </ComponentPreview>
    </DocSection>
    <DocSection title={t("contract")}><p className="text-body text-fg-muted">{t("guidance")}</p></DocSection>
  </DocPage>;
}
