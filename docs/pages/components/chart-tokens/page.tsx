"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/app/_i18n/navigation";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ChartLegend, SegmentedBar, chartColor, type ChartColorIndex } from "@zeron/ui/chart-primitives";
import { CodeBlock } from "@zeron/ui/code-block";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { componentColorTokens } from "@zeron/ui/tokens/semantic-tokens.mjs";

type ChartToken = { name: string; light: string; dark: string };
const palette: ChartToken[] = componentColorTokens.filter((token: ChartToken) => /^chart-[1-7]$/.test(token.name));
const paletteCode = `import { ChartLegend, SegmentedBar, chartColor } from "@zeron/ui/chart-primitives";

const segments = [1, 2, 3, 4, 5, 6, 7].map((index) => ({
  id: \`chart-\${index}\`, label: \`chart-\${index}\`, value: 20,
  color: chartColor(index as 1 | 2 | 3 | 4 | 5 | 6 | 7),
}));

export function ChartPalette() {
  return <div className="grid gap-4">
    <SegmentedBar mode="distribution" total={140}
      segments={segments} valueText="Seven chart slots, 20 each" />
    <ChartLegend items={segments} />
  </div>;
}`;
const configCode = `import { ChartContainer, type ChartConfig } from "@zeron/ui/chart";
import { chartColor, chartSeriesColor } from "@zeron/ui/chart-primitives";
import { Area, AreaChart } from "recharts";

const config = {
  requests: { label: "Requests", color: chartColor(1) },
  comparison: { label: "Comparison", color: chartColor(2) },
} satisfies ChartConfig;

export function RequestsChart() {
  return <ChartContainer config={config} className="h-52 min-h-0">
    <AreaChart data={[{ requests: 12, comparison: 8 }]}>
      <Area dataKey="requests" stroke="var(--color-requests)"
        fill="var(--color-requests)" fillOpacity={0.12} />
      <Area dataKey="comparison" stroke="var(--color-comparison)"
        fill="var(--color-comparison)" fillOpacity={0.12} />
    </AreaChart>
  </ChartContainer>;
}

const providerColor = chartSeriesColor("provider-id", { colorIndex: 3 });
const dynamicColor = chartSeriesColor("stable-entity-id");`;
const themeCode = `:root {
${palette.map((token) => `  --${token.name}: ${token.light};`).join("\n")}
}

.dark {
${palette.map((token) => `  --${token.name}: ${token.dark};`).join("\n")}
}

@theme inline {
${palette.map((token) => `  --color-${token.name}: var(--${token.name});`).join("\n")}
}`;

export default function ChartTokensDoc() {
  const t = useTranslations("chartTokens");
  const segments = palette.map((token) => ({ id: token.name, label: token.name, value: 20, color: chartColor(Number(token.name.at(-1)) as ChartColorIndex) }));
  const supportingStyles = [
    { name: "--border", type: t("gridRole"), description: t("gridUsage") },
    { name: "--fg-subtle", type: t("axisRole"), description: t("axisUsage") },
    { name: "--fg-default / --fg-muted", type: t("textRole"), description: t("textUsage") },
    { name: "--muted", type: t("trackRole"), description: t("trackUsage") },
    { name: "--radius-sm / rounded-sm", type: t("radiusRole"), description: t("radiusUsage") },
    { name: "--spacing × 0.5 / gap-0.5", type: t("gapRole"), description: t("gapUsage") },
    { name: "--surface-floating / --border / shadow-floating", type: t("tooltipRole"), description: t("tooltipUsage") },
    { name: "--focus-ring", type: t("focusRole"), description: t("focusUsage") },
  ];
  const resourceCategories = [
    { name: t("normal"), type: "normal / brand", default: "--chart-1", description: t("blue") },
    { name: t("warning"), type: "warning / warning", default: "--chart-3", description: t("amber") },
    { name: t("critical"), type: "critical / danger", default: "--chart-5", description: t("violet") },
    { name: t("unknown"), type: "unknown / neutral", default: "--chart-2", description: t("cyan") },
  ];

  return <DocPage title="Chart Tokens" slug="chart-tokens" showInstall={false} description={t("description")}>
    <DocSection title={t("paletteTitle")}>
      <p className="text-body text-fg-muted">{t("paletteBody")}</p>
      <div data-component-cover-source>
        <ComponentPreview code={paletteCode}>
          <div className="grid w-full min-w-0 gap-4">
            <SegmentedBar mode="distribution" total={140} segments={segments} valueText={t("paletteLabel")} />
            <ChartLegend className="grid-cols-1 sm:grid-cols-4 xl:grid-cols-7" items={segments} />
          </div>
        </ComponentPreview>
      </div>
      <ScrollArea orientation="horizontal" viewportClassName="scroll-fade-x" className="w-full">
        <table className="w-full min-w-[640px] border-collapse text-left text-label">
          <thead><tr className="border-b border-border text-fg-default">
            {[t("token"), t("light"), t("dark"), t("usage")].map((label) => <th key={label} className="px-3 py-2 font-semibold">{label}</th>)}
          </tr></thead>
          <tbody>{palette.map((token, index) => <tr key={token.name} className="border-b border-border">
            <td className="px-3 py-3 font-mono text-fg-default">--{token.name}</td>
            {[token.light, token.dark].map((value, themeIndex) => <td key={themeIndex} className="px-3 py-3">
              <span className="flex items-center gap-2"><span aria-hidden="true" className="size-4 shrink-0 rounded-sm" style={{ backgroundColor: value }} /><code className="text-fg-default">{value}</code></span>
            </td>)}
            <td className="px-3 py-3 text-fg-muted">{t(`slot${index + 1}`)}</td>
          </tr>)}</tbody>
        </table>
      </ScrollArea>
    </DocSection>

    <DocSection title={t("layersTitle")}>
      <p className="text-body text-fg-muted">{t("layersBody")}</p>
      <PropsTable labels={{ prop: t("token"), type: t("layer"), default: t("token"), description: t("usage") }} props={[
        { name: "--chart-1 … --chart-7", type: t("globalLayer"), description: t("globalUsage") },
        { name: "--color-chart-1 … --color-chart-7", type: t("utilityLayer"), description: t("utilityUsage") },
        { name: "--color-<series>", type: t("instanceLayer"), description: t("instanceUsage") },
      ]} />
    </DocSection>

    <DocSection title={t("identityTitle")}>
      <p className="text-body text-fg-muted">{t("identityBody")}</p>
      <CodeBlock file={{ name: "chart-series.tsx", lang: "tsx", contents: configCode }} />
      <p className="text-body text-fg-muted">{t("priority")}</p>
    </DocSection>

    <DocSection title={t("structureTitle")}>
      <p className="text-body text-fg-muted">{t("structureBody")}</p>
      <PropsTable labels={{ prop: t("token"), type: t("role"), default: t("token"), description: t("usage") }} props={supportingStyles} />
      <p className="text-body text-fg-muted">{t("parameters")}</p>
      <p className="text-body text-fg-muted">{t("segmentedGeometry")}</p>
      <p className="text-body text-fg-muted">{t("statusBody")}</p>
    </DocSection>

    <DocSection title={t("resourcesTitle")}>
      <p className="text-body text-fg-muted">{t("resourcesBody")}</p>
      <PropsTable labels={{ prop: t("category"), type: "tone · ResourceStatusAll / ResourceMetricList", default: t("token"), description: t("usage") }} props={resourceCategories} />
    </DocSection>

    <DocSection title={t("maintenanceTitle")}>
      <p className="text-body text-fg-muted">{t("maintenanceBody")}</p>
      <p className="text-body text-fg-muted">{t("consumerBody")}</p>
      <CodeBlock file={{ name: "chart-theme.css", lang: "css", contents: themeCode }} />
    </DocSection>

    <DocSection title={t("relatedTitle")}>
      <nav className="flex flex-wrap gap-4 text-body" aria-label={t("relatedTitle")}>
        <Link className="text-fg-brand hover:underline" href="/docs/components/semantic-tokens">{t("semanticLink")}</Link>
        <Link className="text-fg-brand hover:underline" href="/docs/components/chart">{t("chartLink")}</Link>
        <Link className="text-fg-brand hover:underline" href="/docs/components/chart-primitives">{t("primitivesLink")}</Link>
      </nav>
    </DocSection>
  </DocPage>;
}
