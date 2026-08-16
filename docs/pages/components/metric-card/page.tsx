"use client";

import { MetricCard } from "@zeron/ui/metric-card";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { VariantPlayground } from "@docs/components/playground/variant-playground";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const basicCode = `import { MetricCard } from "@zeron/ui/metric-card";

<MetricCard
  label="Gateway calls"
  value={12482}
  meta="Last 24 hours"
/>`;

const breakdownCode = `<MetricCard
  label="Completion rate"
  value={99.1}
  unit="%"
  tone="positive"
  content={{
    type: "breakdown",
    layout: "grid",
    items: [
      { label: "Succeeded", value: 12370, tone: "positive" },
      { label: "Failed", value: 112, tone: "critical" },
    ],
  }}
/>`;

const visualizationCode = `<MetricCard
  label="Model TTFT p95"
  value={1.28}
  unit="s"
  meta="7,814 samples"
  content={{
    type: "visualization",
    chart: "line",
    data: Array.from({ length: 24 }, (_, hour) => ({
      label: String(hour).padStart(2, "0") + ":00",
      value: 0.96 + (hour % 6) * 0.06,
    })),
    accessibleLabel: "TTFT p95 trend over the selected period",
  }}
/>`;

const barCode = `<MetricCard
  label="Model cost"
  value={126.43}
  unit="USD"
  content={{
    type: "visualization",
    chart: "bar",
    data: Array.from({ length: 24 }, (_, hour) => ({
      label: String(hour).padStart(2, "0") + ":00",
      value: 12 + ((hour * 7) % 19),
    })),
    accessibleLabel: "Daily model cost",
  }}
/>`;

const dashboardCardClass = [
  "w-full self-stretch rounded-lg border-[0.5px] border-border bg-surface-floating px-3 py-2",
  "[&_[data-slot=metric-card-label]]:text-label [&_[data-slot=metric-card-label]]:leading-5 [&_[data-slot=metric-card-label]]:!text-fg-default/40",
  "[&_[data-slot=metric-card-value-row]>span:first-child]:text-base [&_[data-slot=metric-card-value-row]>span:first-child]:leading-6 [&_[data-slot=metric-card-value-row]>span:first-child]:!text-fg-default/80",
  "[&_[data-slot=metric-card-breakdown]_span:first-child]:!text-fg-default/40 [&_[data-slot=metric-card-breakdown]_span:last-child]:!text-fg-default/80",
].join(" ");

const dashboardCode = `const dashboardCardClass = [
  "w-full self-stretch rounded-lg border-[0.5px] border-border bg-surface-floating px-3 py-2",
  "[&_[data-slot=metric-card-label]]:text-label [&_[data-slot=metric-card-label]]:leading-5 [&_[data-slot=metric-card-label]]:!text-fg-default/40",
  "[&_[data-slot=metric-card-value-row]>span:first-child]:text-base [&_[data-slot=metric-card-value-row]>span:first-child]:leading-6 [&_[data-slot=metric-card-value-row]>span:first-child]:!text-fg-default/80",
  "[&_[data-slot=metric-card-breakdown]_span:first-child]:!text-fg-default/40 [&_[data-slot=metric-card-breakdown]_span:last-child]:!text-fg-default/80",
].join(" ");

<div className="w-full">
  <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
    <MetricCard
      className={dashboardCardClass}
      label="会话数量"
      value="2,482"
      separator
      content={{
        type: "breakdown",
        items: [
          { label: "进行中的", value: 128 },
          { label: "较上期", value: "+8.2%" },
        ],
      }}
    />
    {/* 其余卡片使用相同结构 */}
  </div>
</div>`;

const props: PropDef[] = [
  { name: "label", type: "string", description: "The metric being measured." },
  { name: "value", type: "string | number", description: "The primary metric result." },
  { name: "unit", type: "string", description: "A separately formatted unit displayed with the primary value." },
  { name: "meta", type: "string", description: "Optional context such as sample size, token count, or update time." },
  { name: "footer", type: "ReactNode", description: "Optional supporting content below the metric value, such as a period-over-period comparison." },
  { name: "tone", type: '"default" | "positive" | "warning" | "critical"', default: '"default"', description: "Semantic emphasis for the primary value." },
  { name: "content", type: "MetricCardContent", default: '{ type: "none" }', description: "Optional breakdown or micro chart; charts require at least 24 finite data points." },
  { name: "separator", type: "boolean", default: "false", description: "Renders a horizontal separator before supporting content." },
  { name: "state", type: '"ready" | "loading" | "unavailable" | "stale" | "error"', default: '"ready"', description: "Controls data availability and loading presentation." },
  { name: "statusMessage", type: "ReactNode", description: "Optional explanation for stale, unavailable, or failed data." },
  { name: "action", type: "ReactNode", description: "Optional action rendered above the whole-card action layer." },
  { name: "interactive", type: "boolean", description: "Enables the supplied whole-card action; inferred from onClick by default." },
  { name: "onClick", type: "() => void", description: "Makes the whole card an accessible button." },
  { name: "actionLabel", type: "string", description: "Accessible label for the whole-card action." },
];

export default function MetricCardDoc() {
  const t = useTranslations("metricCard");
  const hourlyTTFT = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}:00`,
    value: 0.96 + ((hour * 5) % 11) * 0.035,
  }));
  const hourlyCost = Array.from({ length: 24 }, (_, hour) => ({
    label: `${String(hour).padStart(2, "0")}:00`,
    value: 12 + ((hour * 7) % 19),
  }));

  return (
    <DocPage
      title="MetricCard"
      slug="metric-card"
      description="A self-sizing card for one key metric, with optional breakdowns, trends, semantic states, and whole-card interaction."
    >
      <DocSection title="Playground">
        <VariantPlayground
          variants={[
            {
              value: "metric",
              label: "Metric",
              code: basicCode,
              preview: <MetricCard className="w-full max-w-sm" label="Gateway calls" value={12482} meta="Last 24 hours" />,
            },
            {
              value: "breakdown",
              label: "Breakdown",
              code: breakdownCode,
              preview: <MetricCard className="w-full max-w-sm" label="Completion rate" value={99.1} unit="%" tone="positive" content={{ type: "breakdown", layout: "grid", items: [{ label: "Succeeded", value: 12370, tone: "positive" }, { label: "Failed", value: 112, tone: "critical" }] }} />,
            },
            {
              value: "stale",
              label: "Stale",
              code: `<MetricCard label="Model cost" value={126.43} unit="USD" state="stale" statusMessage="Updated 8 min ago" />`,
              preview: <MetricCard className="w-full max-w-sm" label="Model cost" value={126.43} unit="USD" state="stale" statusMessage="Updated 8 min ago" />,
            },
          ]}
        />
      </DocSection>

      <DocSection title={t("basic")}>
        <ComponentPreview code={basicCode}>
          <MetricCard className="w-full max-w-sm" label="Gateway calls" value={12482} meta="Last 24 hours" />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("breakdown")}>
        <ComponentPreview code={breakdownCode}>
          <MetricCard
            className="w-full max-w-sm"
            label="Completion rate"
            value={99.1}
            unit="%"
            tone="positive"
            content={{
              type: "breakdown",
              layout: "grid",
              items: [
                { label: "Succeeded", value: 12370, tone: "positive" },
                { label: "Failed", value: 112, tone: "critical" },
                { label: "Retried", value: 482 },
                { label: "Rerouted", value: 182 },
              ],
            }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title="Dashboard metrics">
        <ComponentPreview code={dashboardCode}>
          <div className="w-full">
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                className={dashboardCardClass}
                label="会话数量"
                value="2,482"
                separator
                content={{
                  type: "breakdown",
                  items: [
                    { label: "进行中的", value: 128 },
                    { label: "较上期", value: "+8.2%" },
                  ],
                }}
              />
              <MetricCard
                className={dashboardCardClass}
                label="任务最终完成率"
                value="98.10%"
                separator
                content={{
                  type: "breakdown",
                  items: [
                    { label: "成功", value: "8,567" },
                    { label: "失败&取消", value: 114 },
                  ],
                }}
              />
              <MetricCard
                className={dashboardCardClass}
                label="会话累计成本"
                value="¥1,871.60"
                separator
                content={{
                  type: "breakdown",
                  items: [
                    { label: "高成本会话", value: 23 },
                    { label: "异常会话", value: 37 },
                  ],
                }}
              />
            </div>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("visualization")}>
        <ComponentPreview code={visualizationCode}>
          <MetricCard
            className="w-full max-w-sm"
            label="Model TTFT p95"
            value={1.28}
            unit="s"
            meta="7,814 samples"
            content={{
              type: "visualization",
              chart: "line",
              data: hourlyTTFT,
              accessibleLabel: "TTFT p95 trend over the selected period",
            }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("barChart")}>
        <ComponentPreview code={barCode}>
          <MetricCard
            className="w-full max-w-sm"
            label="Model cost"
            value={126.43}
            unit="USD"
            content={{
              type: "visualization",
              chart: "bar",
              data: hourlyCost,
              accessibleLabel: "Daily model cost",
            }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("states")}>
        <ComponentPreview code={'<MetricCard label="Model cost" value={126.43} unit="USD" state="stale" statusMessage="Updated 8 min ago" />'}>
          <div className="grid w-full gap-3 sm:grid-cols-2">
            <MetricCard label="Gateway calls" value={12482} state="loading" />
            <MetricCard label="Model cost" value={126.43} unit="USD" state="stale" statusMessage="Updated 8 min ago" />
            <MetricCard label="Exception calls" value={0} state="unavailable" statusMessage="No data source connected" />
            <MetricCard label="Completion rate" value={0} state="error" statusMessage="Metric could not be loaded" />
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={props} />
      </DocSection>
    </DocPage>
  );
}
