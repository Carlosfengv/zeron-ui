"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FunnelChart, type FunnelStage } from "@zeron/ui/funnel-chart";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";

const basicCode = `"use client";

import { useState } from "react";
import { FunnelChart, type FunnelStage } from "@/components/ui/funnel-chart";

const data: FunnelStage[] = [
  { label: "Visits", value: 12000 },
  { label: "Signups", value: 7200 },
  { label: "Activated", value: 3600 },
  { label: "Paid", value: 1200 },
];

export default function Example() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const formatValue = new Intl.NumberFormat("en-US").format;
  const highlighted = hoveredIndex === null ? null : data[hoveredIndex];
  return (
    <div className="w-full max-w-3xl">
      <FunnelChart data={data} formatValue={formatValue} hoveredIndex={hoveredIndex} onHoverChange={setHoveredIndex} />
      <p className="mt-4 text-label text-fg-muted">
        {highlighted ? highlighted.label + ": " + formatValue(highlighted.value) : "Hover a stage, or focus the chart and use the arrow keys."}
      </p>
    </div>
  );
}`;

const stagesCode = `const data = [
  { label: "Visits", value: 12000 },
  { label: "Signups", value: 7200 },
  { label: "Activated", value: 3600 },
  { label: "Paid", value: 1200 },
];`;

const verticalCode = `"use client";

import { FunnelChart } from "@/components/ui/funnel-chart";

${stagesCode}

export default function Example() {
  return (
    <div className="w-full max-w-64">
      <FunnelChart data={data} orientation="vertical" labelLayout="grouped" />
    </div>
  );
}`;

const straightCode = `"use client";

import { FunnelChart } from "@/components/ui/funnel-chart";

${stagesCode}

export default function Example() {
  return (
    <div className="w-full max-w-3xl">
      <FunnelChart data={data} edges="straight" grid labelLayout="grouped" labelAlign="end" />
    </div>
  );
}`;

const fillsCode = `"use client";

import { FunnelChart } from "@/components/ui/funnel-chart";

${stagesCode}

const gradient = [
  { offset: 0, color: "var(--chart-1)" },
  { offset: 1, color: "var(--chart-2)" },
];

export default function Example() {
  return (
    <div className="flex w-full flex-col gap-8">
      <FunnelChart data={data.map(stage => ({ ...stage, gradient }))} />
      <FunnelChart data={data} renderPattern={(id, color) => (
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 0 6 L 6 0" stroke={color} strokeWidth="2" />
        </pattern>
      )} />
    </div>
  );
}`;

const props: Omit<PropDef, "description">[] = [
  { name: "data", type: "FunnelStage[]" },
  { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"' },
  { name: "color", type: "string", default: "var(--chart-1)" },
  { name: "layers", type: "number", default: "3" },
  { name: "gap", type: "number", default: "4" },
  { name: "edges", type: '"curved" | "straight"', default: '"curved"' },
  { name: "showValues / showPercentage / showLabels", type: "boolean", default: "true" },
  { name: "hoveredIndex", type: "number | null" },
  { name: "onHoverChange", type: "(index: number | null) => void" },
  { name: "formatValue", type: "(value: number) => string", default: 'Intl.NumberFormat("en-US").format' },
  { name: "formatPercentage", type: "(pct: number) => string", default: 'Math.round(pct) + "%"' },
  { name: "staggerDelay", type: "number", default: "0.12" },
  { name: "enterTransition", type: "Transition", default: "1.1s tween" },
  { name: "renderPattern", type: "(id: string, color: string) => ReactNode" },
  { name: "labelLayout", type: '"spread" | "grouped"', default: '"spread"' },
  { name: "labelOrientation", type: '"vertical" | "horizontal"' },
  { name: "labelAlign", type: '"center" | "start" | "end"', default: '"center"' },
  { name: "grid", type: "boolean | { bands?, bandColor?, lines?, lineColor?, lineOpacity?, lineWidth? }", default: "false" },
  { name: "className / style", type: "string / CSSProperties" },
  { name: "series", type: "FunnelSeries[]" },
];

export default function FunnelChartDoc() {
  const t = useTranslations("funnelChart");
  const locale = useLocale();
  const data: FunnelStage[] = [
    { label: t("visits"), value: 12000 },
    { label: t("signups"), value: 7200 },
    { label: t("activated"), value: 3600 },
    { label: t("paid"), value: 1200 },
  ];
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const numberFormatter = new Intl.NumberFormat(locale);
  const formatValue = (value: number) => numberFormatter.format(value);
  const gradientData = data.map((stage) => ({ ...stage, gradient: [
    { offset: 0, color: "var(--chart-1)" },
    { offset: 1, color: "var(--chart-2)" },
  ] }));

  return (
    <DocPage title="FunnelChart" slug="funnel-chart" installSlug="funnel-chart chart-primitives" description={t("description")}>
      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode} padding="responsive" preservePreview>
          <div className="w-full max-w-3xl">
            <FunnelChart data={data} formatValue={formatValue} hoveredIndex={hoveredIndex} onHoverChange={setHoveredIndex} />
            <p className="mt-4 text-label text-fg-muted">{hoveredIndex === null ? t("hint") : t("highlighted", { label: data[hoveredIndex].label, value: formatValue(data[hoveredIndex].value) })}</p>
          </div>
        </ComponentPreview>
        <ChartDataTable caption={t("tableCaption")} columns={[t("stage"), t("value"), t("share")]}
          rows={data.map((stage, index) => ({ id: String(index), label: stage.label, values: [formatValue(stage.value), `${Math.round(stage.value / data[0].value * 100)}%`] }))}
          summary={t("tableSummary")} />
      </DocSection>

      <DocSection title={t("layouts")}>
        <ComponentPreview title={t("vertical")} code={verticalCode} padding="responsive">
          <div className="w-full max-w-64">
            <FunnelChart data={data} orientation="vertical" labelLayout="grouped" formatValue={formatValue} />
          </div>
        </ComponentPreview>
        <ComponentPreview title={t("straight")} code={straightCode} padding="responsive">
          <div className="w-full max-w-3xl">
            <FunnelChart data={data} edges="straight" grid labelLayout="grouped" labelAlign="end" formatValue={formatValue} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("fills")}>
        <ComponentPreview code={fillsCode} padding="responsive">
          <div className="flex w-full flex-col gap-8">
            <FunnelChart data={gradientData} formatValue={formatValue} />
            <FunnelChart data={data} formatValue={formatValue} renderPattern={(id, color) => (
              <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse"><path d="M 0 6 L 6 0" stroke={color} strokeWidth="2" /></pattern>
            )} />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("behavior")}>
        <div className="space-y-2 text-body text-fg-muted"><p>{t("percentageBehavior")}</p><p>{t("keyboardBehavior")}</p><p>{t("dataBehavior")}</p><p>{t("motionBehavior")}</p><p>{t("stageBehavior")}</p><p>{t("stackedBehavior")}</p></div>
      </DocSection>
      <DocSection title={t("api")}><PropsTable props={props.map((prop, index) => ({ ...prop, description: t(`p${index}`) }))} /></DocSection>
    </DocPage>
  );
}
