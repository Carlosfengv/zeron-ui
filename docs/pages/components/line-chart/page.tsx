"use client";

import { useId, useState } from "react";
import { LineChart, Line } from "@zeron/ui/line-chart";
import { Grid, XAxis, YAxis, ChartTooltip, ChartLegend } from "@zeron/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@zeron/ui/chart-brush";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { useTranslations } from "next-intl";

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



function BasicDemo() { return <LineChart data={data}><Grid horizontal /><Line dataKey="requests" /><XAxis /><YAxis /><ChartTooltip /></LineChart>; }

function SeriesDemo() { return <div className="w-full"><LineChart data={data}><Grid horizontal /><Line dataKey="requests" stroke="var(--chart-1)" /><Line dataKey="comparison" stroke="var(--chart-2)" /><Line dataKey="latency" yAxisId="latency" stroke="var(--chart-3)" /><XAxis /><YAxis /><YAxis yAxisId="latency" orientation="right" formatValue={v => v + "ms"} /><ChartTooltip /></LineChart><ChartLegend layout="inline" overflow="collapse" items={[{label:"Requests",value:340,color:"var(--chart-1)"},{label:"Comparison",value:240,color:"var(--chart-2)"},{label:"Latency",value:44,color:"var(--chart-3)"}]} /></div>; }

function MarkersDemo() { const id = useId(); return <LineChart data={data}><Grid horizontal /><Line dataKey="requests" showMarkers markers={{radius:4,ringGap:2}} dashFromIndex={4} fadeEdges="left" /><XAxis /><YAxis /><ChartTooltip dotVariant="ring" /><defs><title id={id}>Projection from Oct 5</title></defs></LineChart>; }

function LoadingDemo() { const [loading, setLoading] = useState(false); const [replay, setReplay] = useState(0); return <div className="w-full"><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setLoading(v => !v)}>Toggle loading</Button><Button size="sm" variant="secondary" onClick={() => setReplay(v => v + 1)}>Replay</Button></div><LineChart data={data} status={loading ? "loading" : "ready"} loadingLabel="Loading requests" revealSignature={String(replay)}><Grid horizontal /><Line dataKey="requests" loadingStyle="sweep" /><XAxis /><YAxis /><ChartTooltip /></LineChart></div>; }

function BrushDemo() { const [selection, setSelection] = useState<ChartBrushSelection | null>({start:new Date(data[1].date),end:new Date(data[5].date)}); return <div className="w-full"><Button size="sm" variant="secondary" onClick={() => setSelection(null)}>Clear range</Button><LineChart data={data} xDomain={selection ? [selection.start,selection.end] : undefined} xDomainSlotCount={data.length}><Grid horizontal /><Line dataKey="requests" /><XAxis /><YAxis /><ChartTooltip /></LineChart><LineChart data={data} animationDuration={0} margin={{top:8,bottom:8}} style={{height:80,aspectRatio:"auto"}}><Line dataKey="requests" showHighlight={false} fadeEdges={false} /><ChartBrush selection={selection} onSelectionChange={setSelection} /></LineChart></div>; }

const basicCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { LineChart, Line } from \"@/components/ui/line-chart\";\nimport { Grid, XAxis, YAxis, ChartTooltip, ChartLegend } from \"@/components/ui/chart-core\";\nimport { ChartBrush, type ChartBrushSelection } from \"@/components/ui/chart-brush\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"date\": \"2026-10-01\",\n    \"requests\": 120,\n    \"comparison\": 80,\n    \"latency\": 28\n  },\n  {\n    \"date\": \"2026-10-02\",\n    \"requests\": 210,\n    \"comparison\": 140,\n    \"latency\": 34\n  },\n  {\n    \"date\": \"2026-10-03\",\n    \"requests\": 170,\n    \"comparison\": 110,\n    \"latency\": 31\n  },\n  {\n    \"date\": \"2026-10-04\",\n    \"requests\": 320,\n    \"comparison\": 220,\n    \"latency\": 42\n  },\n  {\n    \"date\": \"2026-10-05\",\n    \"requests\": 280,\n    \"comparison\": 200,\n    \"latency\": 37\n  },\n  {\n    \"date\": \"2026-10-06\",\n    \"requests\": 390,\n    \"comparison\": 270,\n    \"latency\": 48\n  },\n  {\n    \"date\": \"2026-10-07\",\n    \"requests\": 340,\n    \"comparison\": 240,\n    \"latency\": 44\n  }\n];\n\n\n\nfunction BasicDemo() { return <LineChart data={data}><Grid horizontal /><Line dataKey=\"requests\" /><XAxis /><YAxis /><ChartTooltip /></LineChart>; }\n\nexport default function Example() { return <BasicDemo />; }\n";
const seriesCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { LineChart, Line } from \"@/components/ui/line-chart\";\nimport { Grid, XAxis, YAxis, ChartTooltip, ChartLegend } from \"@/components/ui/chart-core\";\nimport { ChartBrush, type ChartBrushSelection } from \"@/components/ui/chart-brush\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"date\": \"2026-10-01\",\n    \"requests\": 120,\n    \"comparison\": 80,\n    \"latency\": 28\n  },\n  {\n    \"date\": \"2026-10-02\",\n    \"requests\": 210,\n    \"comparison\": 140,\n    \"latency\": 34\n  },\n  {\n    \"date\": \"2026-10-03\",\n    \"requests\": 170,\n    \"comparison\": 110,\n    \"latency\": 31\n  },\n  {\n    \"date\": \"2026-10-04\",\n    \"requests\": 320,\n    \"comparison\": 220,\n    \"latency\": 42\n  },\n  {\n    \"date\": \"2026-10-05\",\n    \"requests\": 280,\n    \"comparison\": 200,\n    \"latency\": 37\n  },\n  {\n    \"date\": \"2026-10-06\",\n    \"requests\": 390,\n    \"comparison\": 270,\n    \"latency\": 48\n  },\n  {\n    \"date\": \"2026-10-07\",\n    \"requests\": 340,\n    \"comparison\": 240,\n    \"latency\": 44\n  }\n];\n\n\n\nfunction SeriesDemo() { return <div className=\"w-full\"><LineChart data={data}><Grid horizontal /><Line dataKey=\"requests\" stroke=\"var(--chart-1)\" /><Line dataKey=\"comparison\" stroke=\"var(--chart-2)\" /><Line dataKey=\"latency\" yAxisId=\"latency\" stroke=\"var(--chart-3)\" /><XAxis /><YAxis /><YAxis yAxisId=\"latency\" orientation=\"right\" formatValue={v => v + \"ms\"} /><ChartTooltip /></LineChart><ChartLegend layout=\"inline\" overflow=\"collapse\" items={[{label:\"Requests\",value:340,color:\"var(--chart-1)\"},{label:\"Comparison\",value:240,color:\"var(--chart-2)\"},{label:\"Latency\",value:44,color:\"var(--chart-3)\"}]} /></div>; }\n\nexport default function Example() { return <SeriesDemo />; }\n";
const markersCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { LineChart, Line } from \"@/components/ui/line-chart\";\nimport { Grid, XAxis, YAxis, ChartTooltip, ChartLegend } from \"@/components/ui/chart-core\";\nimport { ChartBrush, type ChartBrushSelection } from \"@/components/ui/chart-brush\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"date\": \"2026-10-01\",\n    \"requests\": 120,\n    \"comparison\": 80,\n    \"latency\": 28\n  },\n  {\n    \"date\": \"2026-10-02\",\n    \"requests\": 210,\n    \"comparison\": 140,\n    \"latency\": 34\n  },\n  {\n    \"date\": \"2026-10-03\",\n    \"requests\": 170,\n    \"comparison\": 110,\n    \"latency\": 31\n  },\n  {\n    \"date\": \"2026-10-04\",\n    \"requests\": 320,\n    \"comparison\": 220,\n    \"latency\": 42\n  },\n  {\n    \"date\": \"2026-10-05\",\n    \"requests\": 280,\n    \"comparison\": 200,\n    \"latency\": 37\n  },\n  {\n    \"date\": \"2026-10-06\",\n    \"requests\": 390,\n    \"comparison\": 270,\n    \"latency\": 48\n  },\n  {\n    \"date\": \"2026-10-07\",\n    \"requests\": 340,\n    \"comparison\": 240,\n    \"latency\": 44\n  }\n];\n\n\n\nfunction MarkersDemo() { const id = useId(); return <LineChart data={data}><Grid horizontal /><Line dataKey=\"requests\" showMarkers markers={{radius:4,ringGap:2}} dashFromIndex={4} fadeEdges=\"left\" /><XAxis /><YAxis /><ChartTooltip dotVariant=\"ring\" /><defs><title id={id}>Projection from Oct 5</title></defs></LineChart>; }\n\nexport default function Example() { return <MarkersDemo />; }\n";
const loadingCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { LineChart, Line } from \"@/components/ui/line-chart\";\nimport { Grid, XAxis, YAxis, ChartTooltip, ChartLegend } from \"@/components/ui/chart-core\";\nimport { ChartBrush, type ChartBrushSelection } from \"@/components/ui/chart-brush\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"date\": \"2026-10-01\",\n    \"requests\": 120,\n    \"comparison\": 80,\n    \"latency\": 28\n  },\n  {\n    \"date\": \"2026-10-02\",\n    \"requests\": 210,\n    \"comparison\": 140,\n    \"latency\": 34\n  },\n  {\n    \"date\": \"2026-10-03\",\n    \"requests\": 170,\n    \"comparison\": 110,\n    \"latency\": 31\n  },\n  {\n    \"date\": \"2026-10-04\",\n    \"requests\": 320,\n    \"comparison\": 220,\n    \"latency\": 42\n  },\n  {\n    \"date\": \"2026-10-05\",\n    \"requests\": 280,\n    \"comparison\": 200,\n    \"latency\": 37\n  },\n  {\n    \"date\": \"2026-10-06\",\n    \"requests\": 390,\n    \"comparison\": 270,\n    \"latency\": 48\n  },\n  {\n    \"date\": \"2026-10-07\",\n    \"requests\": 340,\n    \"comparison\": 240,\n    \"latency\": 44\n  }\n];\n\n\n\nfunction LoadingDemo() { const [loading, setLoading] = useState(false); const [replay, setReplay] = useState(0); return <div className=\"w-full\"><div className=\"flex flex-wrap gap-2\"><Button size=\"sm\" variant=\"secondary\" onClick={() => setLoading(v => !v)}>Toggle loading</Button><Button size=\"sm\" variant=\"secondary\" onClick={() => setReplay(v => v + 1)}>Replay</Button></div><LineChart data={data} status={loading ? \"loading\" : \"ready\"} loadingLabel=\"Loading requests\" revealSignature={String(replay)}><Grid horizontal /><Line dataKey=\"requests\" loadingStyle=\"sweep\" /><XAxis /><YAxis /><ChartTooltip /></LineChart></div>; }\n\nexport default function Example() { return <LoadingDemo />; }\n";
const brushCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { LineChart, Line } from \"@/components/ui/line-chart\";\nimport { Grid, XAxis, YAxis, ChartTooltip, ChartLegend } from \"@/components/ui/chart-core\";\nimport { ChartBrush, type ChartBrushSelection } from \"@/components/ui/chart-brush\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"date\": \"2026-10-01\",\n    \"requests\": 120,\n    \"comparison\": 80,\n    \"latency\": 28\n  },\n  {\n    \"date\": \"2026-10-02\",\n    \"requests\": 210,\n    \"comparison\": 140,\n    \"latency\": 34\n  },\n  {\n    \"date\": \"2026-10-03\",\n    \"requests\": 170,\n    \"comparison\": 110,\n    \"latency\": 31\n  },\n  {\n    \"date\": \"2026-10-04\",\n    \"requests\": 320,\n    \"comparison\": 220,\n    \"latency\": 42\n  },\n  {\n    \"date\": \"2026-10-05\",\n    \"requests\": 280,\n    \"comparison\": 200,\n    \"latency\": 37\n  },\n  {\n    \"date\": \"2026-10-06\",\n    \"requests\": 390,\n    \"comparison\": 270,\n    \"latency\": 48\n  },\n  {\n    \"date\": \"2026-10-07\",\n    \"requests\": 340,\n    \"comparison\": 240,\n    \"latency\": 44\n  }\n];\n\n\n\nfunction BrushDemo() { const [selection, setSelection] = useState<ChartBrushSelection | null>({start:new Date(data[1].date),end:new Date(data[5].date)}); return <div className=\"w-full\"><Button size=\"sm\" variant=\"secondary\" onClick={() => setSelection(null)}>Clear range</Button><LineChart data={data} xDomain={selection ? [selection.start,selection.end] : undefined} xDomainSlotCount={data.length}><Grid horizontal /><Line dataKey=\"requests\" /><XAxis /><YAxis /><ChartTooltip /></LineChart><LineChart data={data} animationDuration={0} margin={{top:8,bottom:8}} style={{height:80,aspectRatio:\"auto\"}}><Line dataKey=\"requests\" showHighlight={false} fadeEdges={false} /><ChartBrush selection={selection} onSelectionChange={setSelection} /></LineChart></div>; }\n\nexport default function Example() { return <BrushDemo />; }\n";

import api from "./api.json";

export default function LineChartDoc() {
  const t = useTranslations("linechart");
  return <DocPage title="LineChart" slug="line-chart" installSlug="line-chart chart-primitives button chart-brush" description={t("description")}>
    <DocSection title={t("basic") }><figure aria-label={t("basic")} className="min-w-0 w-full"><ComponentPreview code={basicCode} padding="responsive" preservePreview><BasicDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("series") }><figure aria-label={t("series")} className="min-w-0 w-full"><ComponentPreview code={seriesCode} padding="responsive" preservePreview><SeriesDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("markers") }><figure aria-label={t("markers")} className="min-w-0 w-full"><ComponentPreview code={markersCode} padding="responsive" preservePreview><MarkersDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("loading") }><figure aria-label={t("loading")} className="min-w-0 w-full"><ComponentPreview code={loadingCode} padding="responsive" preservePreview><LoadingDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("brush") }><figure aria-label={t("brush")} className="min-w-0 w-full"><ComponentPreview code={brushCode} padding="responsive" preservePreview><BrushDemo /></ComponentPreview></figure></DocSection>
    <ChartDataTable caption={t("dataCaption")} summary={t("viewData")} columns={["Date","Requests","Comparison","Latency (ms)"]} rows={data.map((row,index) => ({id:String(index),label:row.date,values:[row.requests,row.comparison,row.latency]}))} />
    <DocSection title={t("behavior")}><div className="space-y-2 text-body text-fg-muted"><p>{t("contract")}</p><p>{t("keyboard")}</p><p>{t("compatibility")}</p></div></DocSection>
    <DocSection title={t("api")}><PropsTable props={api} /></DocSection>
  </DocPage>;
}
