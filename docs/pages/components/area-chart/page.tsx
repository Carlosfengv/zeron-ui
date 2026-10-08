"use client";

import { useId, useState } from "react";
import { AreaChart, Area, PatternArea } from "@zeron/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip, PatternLines, ChartLegend } from "@zeron/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@zeron/ui/chart-brush";
import { Button } from "@zeron/ui/button";
import { useLocale, useTranslations } from "next-intl";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";

const data = [
  {
    "date": "2026-10-01",
    "requests": 120,
    "comparison": 80,
    "latency": 28
  },
  {
    "date": "2026-10-02",
    "requests": 210,
    "comparison": 140,
    "latency": 34
  },
  {
    "date": "2026-10-03",
    "requests": 170,
    "comparison": 110,
    "latency": 31
  },
  {
    "date": "2026-10-04",
    "requests": 320,
    "comparison": 220,
    "latency": 42
  },
  {
    "date": "2026-10-05",
    "requests": 280,
    "comparison": 200,
    "latency": 37
  },
  {
    "date": "2026-10-06",
    "requests": 390,
    "comparison": 270,
    "latency": 48
  },
  {
    "date": "2026-10-07",
    "requests": 340,
    "comparison": 240,
    "latency": 44
  }
];

const basicCode = `"use client";

import { useId, useState } from "react";
import { AreaChart, Area, PatternArea } from "@/components/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip, PatternLines, ChartLegend } from "@/components/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@/components/ui/chart-brush";
import { Button } from "@/components/ui/button";

const data = [
  {
    "date": "2026-10-01",
    "requests": 120,
    "comparison": 80,
    "latency": 28
  },
  {
    "date": "2026-10-02",
    "requests": 210,
    "comparison": 140,
    "latency": 34
  },
  {
    "date": "2026-10-03",
    "requests": 170,
    "comparison": 110,
    "latency": 31
  },
  {
    "date": "2026-10-04",
    "requests": 320,
    "comparison": 220,
    "latency": 42
  },
  {
    "date": "2026-10-05",
    "requests": 280,
    "comparison": 200,
    "latency": 37
  },
  {
    "date": "2026-10-06",
    "requests": 390,
    "comparison": 270,
    "latency": 48
  },
  {
    "date": "2026-10-07",
    "requests": 340,
    "comparison": 240,
    "latency": 44
  }
];

export default function Example() {
  return <AreaChart data={data}><Grid horizontal /><Area dataKey="requests" /><XAxis /><YAxis /><ChartTooltip /></AreaChart>;
}`;

function BasicDemo() {
  return <AreaChart data={data}><Grid horizontal /><Area dataKey="requests" /><XAxis /><YAxis /><ChartTooltip /></AreaChart>;
}

const comparisonCode = `"use client";

import { useId, useState } from "react";
import { AreaChart, Area, PatternArea } from "@/components/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip, PatternLines, ChartLegend } from "@/components/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@/components/ui/chart-brush";
import { Button } from "@/components/ui/button";

const data = [
  {
    "date": "2026-10-01",
    "requests": 120,
    "comparison": 80,
    "latency": 28
  },
  {
    "date": "2026-10-02",
    "requests": 210,
    "comparison": 140,
    "latency": 34
  },
  {
    "date": "2026-10-03",
    "requests": 170,
    "comparison": 110,
    "latency": 31
  },
  {
    "date": "2026-10-04",
    "requests": 320,
    "comparison": 220,
    "latency": 42
  },
  {
    "date": "2026-10-05",
    "requests": 280,
    "comparison": 200,
    "latency": 37
  },
  {
    "date": "2026-10-06",
    "requests": 390,
    "comparison": 270,
    "latency": 48
  },
  {
    "date": "2026-10-07",
    "requests": 340,
    "comparison": 240,
    "latency": 44
  }
];

export default function Example() {
  return <div className="w-full">
    <AreaChart data={data}><Grid horizontal />
      <Area dataKey="requests" fill="var(--chart-1)" /><Area dataKey="comparison" fill="var(--chart-2)" />
      <Area dataKey="latency" yAxisId="latency" fill="var(--chart-3)" fillOpacity={0} />
      <XAxis /><YAxis /><YAxis yAxisId="latency" orientation="right" formatValue={value => value + "ms"} /><ChartTooltip />
    </AreaChart>
    <ChartLegend layout="inline" overflow="collapse"
      renderOverflowLabel={(count, expanded) => expanded ? "Show less" : "+" + count + " more"}
      items={[{ label: "Requests", value: 340, color: "var(--chart-1)" }, { label: "Comparison", value: 240, color: "var(--chart-2)" }, { label: "Latency", value: 44, color: "var(--chart-3)" }]} />
  </div>;
}`;

function ComparisonDemo() {
  const t = useTranslations("areaChart");
  return <div className="w-full">
    <AreaChart data={data}><Grid horizontal />
      <Area dataKey="requests" fill="var(--chart-1)" /><Area dataKey="comparison" fill="var(--chart-2)" />
      <Area dataKey="latency" yAxisId="latency" fill="var(--chart-3)" fillOpacity={0} />
      <XAxis /><YAxis /><YAxis yAxisId="latency" orientation="right" formatValue={value => value + "ms"} /><ChartTooltip />
    </AreaChart>
    <ChartLegend layout="inline" overflow="collapse"
      renderOverflowLabel={(count, expanded) => expanded ? t("legendLess") : t("legendMore", { count })}
      items={[{ label: t("requests"), value: 340, color: "var(--chart-1)" }, { label: t("comparisonLabel"), value: 240, color: "var(--chart-2)" }, { label: t("latency"), value: 44, color: "var(--chart-3)" }]} />
  </div>;
}

const stylingCode = `"use client";

import { useId, useState } from "react";
import { AreaChart, Area, PatternArea } from "@/components/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip, PatternLines, ChartLegend } from "@/components/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@/components/ui/chart-brush";
import { Button } from "@/components/ui/button";

const data = [
  {
    "date": "2026-10-01",
    "requests": 120,
    "comparison": 80,
    "latency": 28
  },
  {
    "date": "2026-10-02",
    "requests": 210,
    "comparison": 140,
    "latency": 34
  },
  {
    "date": "2026-10-03",
    "requests": 170,
    "comparison": 110,
    "latency": 31
  },
  {
    "date": "2026-10-04",
    "requests": 320,
    "comparison": 220,
    "latency": 42
  },
  {
    "date": "2026-10-05",
    "requests": 280,
    "comparison": 200,
    "latency": 37
  },
  {
    "date": "2026-10-06",
    "requests": 390,
    "comparison": 270,
    "latency": 48
  },
  {
    "date": "2026-10-07",
    "requests": 340,
    "comparison": 240,
    "latency": 44
  }
];

export default function Example() {
  const patternId = "area-pattern-" + useId().replace(/:/g, "");
  return <div className="flex w-full flex-col gap-6">
    <AreaChart data={data}><Grid horizontal /><Area dataKey="requests" fadeEdges gradientSpan={0.6} showMarkers dashFromIndex={5} /><XAxis /><YAxis /><ChartTooltip /></AreaChart>
    <AreaChart data={data}><PatternLines id={patternId} width={6} height={6} stroke="var(--chart-2)" strokeWidth={1} orientation={["diagonal"]} />
      <Grid horizontal /><PatternArea dataKey="requests" fill={"url(#" + patternId + ")"} /><Area dataKey="requests" fill="var(--chart-2)" fillOpacity={0} /><XAxis /><YAxis /><ChartTooltip />
    </AreaChart>
  </div>;
}`;

function StylingDemo() {
  const patternId = "area-pattern-" + useId().replace(/:/g, "");
  return <div className="flex w-full flex-col gap-6">
    <AreaChart data={data}><Grid horizontal /><Area dataKey="requests" fadeEdges gradientSpan={0.6} showMarkers dashFromIndex={5} /><XAxis /><YAxis /><ChartTooltip /></AreaChart>
    <AreaChart data={data}><PatternLines id={patternId} width={6} height={6} stroke="var(--chart-2)" strokeWidth={1} orientation={["diagonal"]} />
      <Grid horizontal /><PatternArea dataKey="requests" fill={"url(#" + patternId + ")"} /><Area dataKey="requests" fill="var(--chart-2)" fillOpacity={0} /><XAxis /><YAxis /><ChartTooltip />
    </AreaChart>
  </div>;
}

const loadingCode = `"use client";

import { useId, useState } from "react";
import { AreaChart, Area, PatternArea } from "@/components/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip, PatternLines, ChartLegend } from "@/components/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@/components/ui/chart-brush";
import { Button } from "@/components/ui/button";

const data = [
  {
    "date": "2026-10-01",
    "requests": 120,
    "comparison": 80,
    "latency": 28
  },
  {
    "date": "2026-10-02",
    "requests": 210,
    "comparison": 140,
    "latency": 34
  },
  {
    "date": "2026-10-03",
    "requests": 170,
    "comparison": 110,
    "latency": 31
  },
  {
    "date": "2026-10-04",
    "requests": 320,
    "comparison": 220,
    "latency": 42
  },
  {
    "date": "2026-10-05",
    "requests": 280,
    "comparison": 200,
    "latency": 37
  },
  {
    "date": "2026-10-06",
    "requests": 390,
    "comparison": 270,
    "latency": 48
  },
  {
    "date": "2026-10-07",
    "requests": 340,
    "comparison": 240,
    "latency": 44
  }
];

export default function Example() {
  const [loading, setLoading] = useState(true);
  const [replay, setReplay] = useState(0);
  return <div className="w-full"><div className="flex gap-2">
    <Button size="sm" variant="secondary" onClick={() => setLoading(value => !value)}>Toggle loading</Button>
    <Button size="sm" variant="secondary" onClick={() => setReplay(value => value + 1)}>Replay</Button></div>
    <AreaChart data={data} status={loading ? "loading" : "ready"} loadingLabel="Loading requests" revealSignature={String(replay)}>
      <Grid horizontal /><Area dataKey="requests" loadingStyle="sweep" /><XAxis /><YAxis /><ChartTooltip />
    </AreaChart>
  </div>;
}`;

function LoadingDemo() {
  const t = useTranslations("areaChart");
  const [loading, setLoading] = useState(true);
  const [replay, setReplay] = useState(0);
  return <div className="w-full"><div className="flex gap-2">
    <Button size="sm" variant="secondary" onClick={() => setLoading(value => !value)}>{t("toggleLoading")}</Button>
    <Button size="sm" variant="secondary" onClick={() => setReplay(value => value + 1)}>{t("replay")}</Button></div>
    <AreaChart data={data} status={loading ? "loading" : "ready"} loadingLabel={t("loadingLabel")} revealSignature={String(replay)}>
      <Grid horizontal /><Area dataKey="requests" loadingStyle="sweep" /><XAxis /><YAxis /><ChartTooltip />
    </AreaChart>
  </div>;
}

const brushCode = `"use client";

import { useId, useState } from "react";
import { AreaChart, Area, PatternArea } from "@/components/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip, PatternLines, ChartLegend } from "@/components/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@/components/ui/chart-brush";
import { Button } from "@/components/ui/button";

const data = [
  {
    "date": "2026-10-01",
    "requests": 120,
    "comparison": 80,
    "latency": 28
  },
  {
    "date": "2026-10-02",
    "requests": 210,
    "comparison": 140,
    "latency": 34
  },
  {
    "date": "2026-10-03",
    "requests": 170,
    "comparison": 110,
    "latency": 31
  },
  {
    "date": "2026-10-04",
    "requests": 320,
    "comparison": 220,
    "latency": 42
  },
  {
    "date": "2026-10-05",
    "requests": 280,
    "comparison": 200,
    "latency": 37
  },
  {
    "date": "2026-10-06",
    "requests": 390,
    "comparison": 270,
    "latency": 48
  },
  {
    "date": "2026-10-07",
    "requests": 340,
    "comparison": 240,
    "latency": 44
  }
];

export default function Example() {
  const [selection, setSelection] = useState<ChartBrushSelection | null>({ start: new Date(data[1].date), end: new Date(data[5].date) });
  return <div className="w-full"><div className="flex gap-2">
    <Button size="sm" variant="secondary" onClick={() => setSelection({ start: new Date(data[2].date), end: new Date(data[4].date) })}>Middle range</Button>
    <Button size="sm" variant="secondary" onClick={() => setSelection(null)}>Clear</Button></div>
    <AreaChart data={data} xDomain={selection ? [selection.start, selection.end] : undefined} xDomainSlotCount={data.length}>
      <Grid horizontal /><Area dataKey="requests" fadeEdges /><XAxis /><YAxis /><ChartTooltip />
    </AreaChart>
    <AreaChart data={data} style={{ height: 80, aspectRatio: "auto" }} margin={{ top: 8, bottom: 8 }} animationDuration={0}>
      <Area dataKey="requests" showHighlight={false} /><ChartBrush selection={selection} onSelectionChange={setSelection} blurPx={0} fadeOuterEdges={false} />
    </AreaChart>
  </div>;
}`;

function BrushDemo() {
  const t = useTranslations("areaChart");
  const [selection, setSelection] = useState<ChartBrushSelection | null>({ start: new Date(data[1].date), end: new Date(data[5].date) });
  return <div className="w-full"><div className="flex gap-2">
    <Button size="sm" variant="secondary" onClick={() => setSelection({ start: new Date(data[2].date), end: new Date(data[4].date) })}>{t("middleRange")}</Button>
    <Button size="sm" variant="secondary" onClick={() => setSelection(null)}>{t("clear")}</Button></div>
    <AreaChart data={data} xDomain={selection ? [selection.start, selection.end] : undefined} xDomainSlotCount={data.length}>
      <Grid horizontal /><Area dataKey="requests" fadeEdges /><XAxis /><YAxis /><ChartTooltip />
    </AreaChart>
    <AreaChart data={data} style={{ height: 80, aspectRatio: "auto" }} margin={{ top: 8, bottom: 8 }} animationDuration={0}>
      <Area dataKey="requests" showHighlight={false} /><ChartBrush selection={selection} onSelectionChange={setSelection} blurPx={0} fadeOuterEdges={false} />
    </AreaChart>
  </div>;
}

const props = [
  {
    "name": "AreaChart.data / xDataKey",
    "type": "Record<string, unknown>[] / string",
    "default": "date"
  },
  {
    "name": "margin / aspectRatio",
    "type": "Partial<Margin> / string",
    "default": "40px each / 2 / 1"
  },
  {
    "name": "animationDuration / animationEasing",
    "type": "number / string",
    "default": "1100ms / cubic-bezier(0.85, 0, 0.15, 1)"
  },
  {
    "name": "enterTransition / revealSignature",
    "type": "Transition / string",
    "default": "—"
  },
  {
    "name": "status / loadingLabel / onPhaseChange",
    "type": "loading | ready / string / callback",
    "default": "ready"
  },
  {
    "name": "yDomainTween / yDomainTweenDuration",
    "type": "boolean / number",
    "default": "true / 500ms"
  },
  {
    "name": "xDomain / xDomainSlotCount / tweenYDomainOnXDomainChange",
    "type": "[Date, Date] / number / boolean",
    "default": "undefined / undefined / false"
  },
  {
    "name": "children / className / style",
    "type": "ReactNode / string / CSSProperties",
    "default": "—"
  },
  {
    "name": "Area.dataKey / yAxisId / stackId",
    "type": "string / string | number / string | number",
    "default": "left / undefined"
  },
  {
    "name": "fill / stroke / strokeWidth",
    "type": "string / string / number",
    "default": "var(--chart-1) / fill / 2"
  },
  {
    "name": "fillOpacity / gradientToOpacity / gradientSpan",
    "type": "number",
    "default": "0.4 / 0 / 1"
  },
  {
    "name": "curve / animate",
    "type": "CurveFactory / boolean",
    "default": "curveMonotoneX / true"
  },
  {
    "name": "fadeEdges",
    "type": "boolean | left | right",
    "default": "false"
  },
  {
    "name": "showLine / showHighlight / showMarkers",
    "type": "boolean",
    "default": "true / true / false"
  },
  {
    "name": "markers",
    "type": "SeriesPointMarkerStyle",
    "default": "—"
  },
  {
    "name": "dashFromIndex / dashArray",
    "type": "number / string",
    "default": "undefined / 6,4"
  },
  {
    "name": "loading / loadingPulseMode / loadingStyle",
    "type": "boolean / loop | exit | enter / pulse | sweep",
    "default": "phase / phase / pulse"
  },
  {
    "name": "loadingStroke / loadingStrokeOpacity",
    "type": "string / number",
    "default": "var(--fg-default) / 0.5"
  },
  {
    "name": "PatternArea.dataKey / fill / curve",
    "type": "string / string / CurveFactory",
    "default": "curveMonotoneX"
  },
  {
    "name": "ChartBrush.selection / initialSelection",
    "type": "ChartBrushSelection | null",
    "default": "undefined"
  },
  {
    "name": "ChartBrush.onSelectionChange",
    "type": "(selection: ChartBrushSelection | null) => void",
    "default": "—"
  },
  {
    "name": "ChartBrush.blurPx / fadeOuterEdges",
    "type": "number / boolean",
    "default": "0 / false"
  },
  {
    "name": "ChartLegend / Legend.layout / overflow",
    "type": "stack | inline / wrap | collapse",
    "default": "stack / wrap"
  },
  {
    "name": "maxVisibleItems / renderOverflowLabel",
    "type": "number / (hiddenCount, expanded) => ReactNode",
    "default": "undefined / +n more, Show less"
  }
];

export default function AreaChartDoc() {
  const t = useTranslations("areaChart");
  const formatValue = new Intl.NumberFormat(useLocale()).format;
  return <DocPage title="AreaChart" slug="area-chart" installSlug="area-chart chart-brush chart-primitives button" description={t("description")}>
    <DocSection title={t("basic")}><ComponentPreview code={basicCode} padding="responsive" preservePreview><BasicDemo /></ComponentPreview>
      <ChartDataTable caption={t("dataCaption")} summary={t("viewData")} columns={[t("date"), t("requests"), t("comparisonLabel"), t("latency")]}
        rows={data.map(row => ({ id: row.date, label: row.date, values: [formatValue(row.requests), formatValue(row.comparison), formatValue(row.latency) + "ms"] }))} />
    </DocSection>
    <DocSection title={t("comparison")}><ComponentPreview code={comparisonCode} padding="responsive" preservePreview><ComparisonDemo /></ComponentPreview>
      <p className="text-body text-fg-muted">{t("overlap")}</p>
    </DocSection>
    <DocSection title={t("styling")}><ComponentPreview code={stylingCode} padding="responsive" preservePreview><StylingDemo /></ComponentPreview>
    </DocSection>
    <DocSection title={t("loading")}><ComponentPreview code={loadingCode} padding="responsive" preservePreview><LoadingDemo /></ComponentPreview>
    </DocSection>
    <DocSection title={t("brush")}><ComponentPreview code={brushCode} padding="responsive" preservePreview><BrushDemo /></ComponentPreview>
    </DocSection>
    <DocSection title={t("behavior")}><div className="space-y-2 text-body text-fg-muted"><p>{t("dataBehavior")}</p><p>{t("keyboardBehavior")}</p><p>{t("motionBehavior")}</p><p>{t("brushBehavior")}</p><p>{t("compatibility")}</p></div></DocSection>
    <DocSection title={t("api")}><PropsTable props={props.map((prop, index) => ({ ...prop, description: t(`p${index}`) }))} /></DocSection>
  </DocPage>;
}
