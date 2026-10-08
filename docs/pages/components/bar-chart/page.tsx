"use client";

import { useId, useMemo, useState } from "react";
import { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from "@zeron/ui/bar-chart";
import { AreaChart, Area } from "@zeron/ui/area-chart";
import { ChartBrush, type ChartBrushSelection } from "@zeron/ui/chart-brush";
import { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from "@zeron/ui/chart-core";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { useLocale, useTranslations } from "next-intl";

const data = [
  {
    "name": "Mon",
    "requests": 120,
    "comparison": 80
  },
  {
    "name": "Tue",
    "requests": 210,
    "comparison": 140
  },
  {
    "name": "Wed",
    "requests": 170,
    "comparison": 110
  },
  {
    "name": "Thu",
    "requests": 320,
    "comparison": 220
  },
  {
    "name": "Fri",
    "requests": 280,
    "comparison": 200
  },
  {
    "name": "Sat",
    "requests": 390,
    "comparison": 270
  },
  {
    "name": "Sun",
    "requests": 340,
    "comparison": 240
  }
];

const timeData = data.map((row, index) => ({
  date: Date.UTC(2026, 9, index + 1),
  requests: row.requests,
}));

function BrushDemo() {
  const t = useTranslations("barchart");
  const locale = useLocale();
  const dateFormat = useMemo(() => new Intl.DateTimeFormat(locale, {
    month: "short", day: "numeric", timeZone: "UTC",
  }), [locale]);
  const [selection, setSelection] = useState<ChartBrushSelection | null>({
    start: new Date(timeData[1].date), end: new Date(timeData[5].date),
  });
  const visibleData = useMemo(() => timeData
    .filter(row => !selection || (row.date >= selection.start.getTime() && row.date <= selection.end.getTime()))
    .map(row => ({ ...row, name: dateFormat.format(row.date) })), [selection, dateFormat]);

  return <div className="w-full space-y-4">
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={() => setSelection({ start: new Date(timeData[2].date), end: new Date(timeData[4].date) })}>{t("middleRange")}</Button>
      <Button size="sm" variant="secondary" onClick={() => setSelection(null)}>{t("clearRange")}</Button>
    </div>
    <p role="status" aria-live="polite" className="text-label text-fg-muted">{t("rangeStatus", {
      start: dateFormat.format(selection?.start ?? timeData[0].date),
      end: dateFormat.format(selection?.end ?? timeData[timeData.length - 1].date),
      count: visibleData.length,
    })}</p>
    {visibleData.length ? <BarChart data={visibleData} className="h-64" aspectRatio="auto" animationDuration={0}>
      <Grid horizontal /><Bar dataKey="requests" /><BarXAxis maxLabels={3} /><YAxis /><ChartTooltip />
    </BarChart> : <div className="flex h-64 items-center"><Empty reason="no-filter-results" scope="inline"><EmptyDescription>{t("rangeEmpty")}</EmptyDescription></Empty></div>}
    <AreaChart data={timeData} style={{ height: 80, aspectRatio: "auto" }} margin={{ top: 8, bottom: 8 }} animationDuration={0} yDomainTween={false}>
      <Area dataKey="requests" animate={false} showHighlight={false} fadeEdges={false} />
      <ChartBrush selection={selection} onSelectionChange={setSelection} blurPx={0} fadeOuterEdges={false} />
    </AreaChart>
    <ChartDataTable caption={t("rangeDataCaption")} summary={t("viewData")} columns={[t("dateColumn"), t("requestsColumn")]} rows={visibleData.map(row => ({ id: String(row.date), label: row.name, values: [row.requests] }))} />
  </div>;
}



function BasicDemo() { return <BarChart data={data}><Grid horizontal /><Bar dataKey="requests" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }

function HorizontalDemo() { return <BarChart data={data} orientation="horizontal"><Bar dataKey="requests" lineCap="butt" /><BarYAxis /><ChartTooltip showCrosshair={false} /></BarChart>; }

function GroupedDemo() { return <div className="w-full"><BarChart data={data}><Grid horizontal /><Bar dataKey="requests" fill="var(--chart-1)" /><Bar dataKey="comparison" fill="var(--chart-2)" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart><ChartLegend layout="inline" overflow="collapse" items={[{label:"Requests",value:340,color:"var(--chart-1)"},{label:"Comparison",value:240,color:"var(--chart-2)"}]} /></div>; }

function StackedDemo() { return <BarChart data={data} stacked stackGap={3}><Grid horizontal /><Bar dataKey="requests" fill="var(--chart-1)" stackGap={3} /><Bar dataKey="comparison" fill="var(--chart-2)" stackGap={3} /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }

function FillsDemo() { const id = useId().replace(/:/g, ""); return <BarChart data={data}><LinearGradient id={id + "-gradient"} from="var(--chart-1)" to="var(--chart-2)" /><PatternLines id={id + "-pattern"} height={6} width={6} stroke="var(--chart-3)" strokeWidth={1} orientation={["diagonal"]} /><Bar dataKey="requests" fill={"url(#" + id + "-gradient)"} stroke="var(--chart-1)" animationType="fade" /><Bar dataKey="comparison" fill={"url(#" + id + "-pattern)"} stroke="var(--chart-3)" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }

function SquaresDemo() { return <BarChart data={data} barWidth={14} squareSnap={{squareGap:3,fit:true}}><BarColumnTrack squareGap={3} squareFit /><BarSquares dataKey="requests" squareGap={3} squareFit /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }


function LoadingDemo() { const [loading, setLoading] = useState(false); const [replay, setReplay] = useState(0); return <div className="w-full"><div className="flex flex-wrap gap-2"><Button size="sm" variant="secondary" onClick={() => setLoading(v => !v)}>Toggle loading</Button><Button size="sm" variant="secondary" onClick={() => setReplay(v => v + 1)}>Replay</Button></div><BarChart data={loading ? [] : data} status={loading ? "loading" : "ready"} revealSignature={String(replay)}><Bar dataKey="requests" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart></div>; }

const basicCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from \"@/components/ui/bar-chart\";\nimport { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"name\": \"Mon\",\n    \"requests\": 120,\n    \"comparison\": 80\n  },\n  {\n    \"name\": \"Tue\",\n    \"requests\": 210,\n    \"comparison\": 140\n  },\n  {\n    \"name\": \"Wed\",\n    \"requests\": 170,\n    \"comparison\": 110\n  },\n  {\n    \"name\": \"Thu\",\n    \"requests\": 320,\n    \"comparison\": 220\n  },\n  {\n    \"name\": \"Fri\",\n    \"requests\": 280,\n    \"comparison\": 200\n  },\n  {\n    \"name\": \"Sat\",\n    \"requests\": 390,\n    \"comparison\": 270\n  },\n  {\n    \"name\": \"Sun\",\n    \"requests\": 340,\n    \"comparison\": 240\n  }\n];\n\n\n\nfunction BasicDemo() { return <BarChart data={data}><Grid horizontal /><Bar dataKey=\"requests\" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }\n\nexport default function Example() { return <BasicDemo />; }\n";
const horizontalCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from \"@/components/ui/bar-chart\";\nimport { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"name\": \"Mon\",\n    \"requests\": 120,\n    \"comparison\": 80\n  },\n  {\n    \"name\": \"Tue\",\n    \"requests\": 210,\n    \"comparison\": 140\n  },\n  {\n    \"name\": \"Wed\",\n    \"requests\": 170,\n    \"comparison\": 110\n  },\n  {\n    \"name\": \"Thu\",\n    \"requests\": 320,\n    \"comparison\": 220\n  },\n  {\n    \"name\": \"Fri\",\n    \"requests\": 280,\n    \"comparison\": 200\n  },\n  {\n    \"name\": \"Sat\",\n    \"requests\": 390,\n    \"comparison\": 270\n  },\n  {\n    \"name\": \"Sun\",\n    \"requests\": 340,\n    \"comparison\": 240\n  }\n];\n\n\n\nfunction HorizontalDemo() { return <BarChart data={data} orientation=\"horizontal\"><Bar dataKey=\"requests\" lineCap=\"butt\" /><BarYAxis /><ChartTooltip showCrosshair={false} /></BarChart>; }\n\nexport default function Example() { return <HorizontalDemo />; }\n";
const groupedCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from \"@/components/ui/bar-chart\";\nimport { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"name\": \"Mon\",\n    \"requests\": 120,\n    \"comparison\": 80\n  },\n  {\n    \"name\": \"Tue\",\n    \"requests\": 210,\n    \"comparison\": 140\n  },\n  {\n    \"name\": \"Wed\",\n    \"requests\": 170,\n    \"comparison\": 110\n  },\n  {\n    \"name\": \"Thu\",\n    \"requests\": 320,\n    \"comparison\": 220\n  },\n  {\n    \"name\": \"Fri\",\n    \"requests\": 280,\n    \"comparison\": 200\n  },\n  {\n    \"name\": \"Sat\",\n    \"requests\": 390,\n    \"comparison\": 270\n  },\n  {\n    \"name\": \"Sun\",\n    \"requests\": 340,\n    \"comparison\": 240\n  }\n];\n\n\n\nfunction GroupedDemo() { return <div className=\"w-full\"><BarChart data={data}><Grid horizontal /><Bar dataKey=\"requests\" fill=\"var(--chart-1)\" /><Bar dataKey=\"comparison\" fill=\"var(--chart-2)\" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart><ChartLegend layout=\"inline\" overflow=\"collapse\" items={[{label:\"Requests\",value:340,color:\"var(--chart-1)\"},{label:\"Comparison\",value:240,color:\"var(--chart-2)\"}]} /></div>; }\n\nexport default function Example() { return <GroupedDemo />; }\n";
const stackedCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from \"@/components/ui/bar-chart\";\nimport { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"name\": \"Mon\",\n    \"requests\": 120,\n    \"comparison\": 80\n  },\n  {\n    \"name\": \"Tue\",\n    \"requests\": 210,\n    \"comparison\": 140\n  },\n  {\n    \"name\": \"Wed\",\n    \"requests\": 170,\n    \"comparison\": 110\n  },\n  {\n    \"name\": \"Thu\",\n    \"requests\": 320,\n    \"comparison\": 220\n  },\n  {\n    \"name\": \"Fri\",\n    \"requests\": 280,\n    \"comparison\": 200\n  },\n  {\n    \"name\": \"Sat\",\n    \"requests\": 390,\n    \"comparison\": 270\n  },\n  {\n    \"name\": \"Sun\",\n    \"requests\": 340,\n    \"comparison\": 240\n  }\n];\n\n\n\nfunction StackedDemo() { return <BarChart data={data} stacked stackGap={3}><Grid horizontal /><Bar dataKey=\"requests\" fill=\"var(--chart-1)\" stackGap={3} /><Bar dataKey=\"comparison\" fill=\"var(--chart-2)\" stackGap={3} /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }\n\nexport default function Example() { return <StackedDemo />; }\n";
const fillsCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from \"@/components/ui/bar-chart\";\nimport { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"name\": \"Mon\",\n    \"requests\": 120,\n    \"comparison\": 80\n  },\n  {\n    \"name\": \"Tue\",\n    \"requests\": 210,\n    \"comparison\": 140\n  },\n  {\n    \"name\": \"Wed\",\n    \"requests\": 170,\n    \"comparison\": 110\n  },\n  {\n    \"name\": \"Thu\",\n    \"requests\": 320,\n    \"comparison\": 220\n  },\n  {\n    \"name\": \"Fri\",\n    \"requests\": 280,\n    \"comparison\": 200\n  },\n  {\n    \"name\": \"Sat\",\n    \"requests\": 390,\n    \"comparison\": 270\n  },\n  {\n    \"name\": \"Sun\",\n    \"requests\": 340,\n    \"comparison\": 240\n  }\n];\n\n\n\nfunction FillsDemo() { const id = useId().replace(/:/g, \"\"); return <BarChart data={data}><LinearGradient id={id + \"-gradient\"} from=\"var(--chart-1)\" to=\"var(--chart-2)\" /><PatternLines id={id + \"-pattern\"} height={6} width={6} stroke=\"var(--chart-3)\" strokeWidth={1} orientation={[\"diagonal\"]} /><Bar dataKey=\"requests\" fill={\"url(#\" + id + \"-gradient)\"} stroke=\"var(--chart-1)\" animationType=\"fade\" /><Bar dataKey=\"comparison\" fill={\"url(#\" + id + \"-pattern)\"} stroke=\"var(--chart-3)\" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }\n\nexport default function Example() { return <FillsDemo />; }\n";
const squaresCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from \"@/components/ui/bar-chart\";\nimport { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"name\": \"Mon\",\n    \"requests\": 120,\n    \"comparison\": 80\n  },\n  {\n    \"name\": \"Tue\",\n    \"requests\": 210,\n    \"comparison\": 140\n  },\n  {\n    \"name\": \"Wed\",\n    \"requests\": 170,\n    \"comparison\": 110\n  },\n  {\n    \"name\": \"Thu\",\n    \"requests\": 320,\n    \"comparison\": 220\n  },\n  {\n    \"name\": \"Fri\",\n    \"requests\": 280,\n    \"comparison\": 200\n  },\n  {\n    \"name\": \"Sat\",\n    \"requests\": 390,\n    \"comparison\": 270\n  },\n  {\n    \"name\": \"Sun\",\n    \"requests\": 340,\n    \"comparison\": 240\n  }\n];\n\n\n\nfunction SquaresDemo() { return <BarChart data={data} barWidth={14} squareSnap={{squareGap:3,fit:true}}><BarColumnTrack squareGap={3} squareFit /><BarSquares dataKey=\"requests\" squareGap={3} squareFit /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }\n\nexport default function Example() { return <SquaresDemo />; }\n";
const loadingCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { BarChart, Bar, BarSquares, BarColumnTrack, BarXAxis, BarYAxis } from \"@/components/ui/bar-chart\";\nimport { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"name\": \"Mon\",\n    \"requests\": 120,\n    \"comparison\": 80\n  },\n  {\n    \"name\": \"Tue\",\n    \"requests\": 210,\n    \"comparison\": 140\n  },\n  {\n    \"name\": \"Wed\",\n    \"requests\": 170,\n    \"comparison\": 110\n  },\n  {\n    \"name\": \"Thu\",\n    \"requests\": 320,\n    \"comparison\": 220\n  },\n  {\n    \"name\": \"Fri\",\n    \"requests\": 280,\n    \"comparison\": 200\n  },\n  {\n    \"name\": \"Sat\",\n    \"requests\": 390,\n    \"comparison\": 270\n  },\n  {\n    \"name\": \"Sun\",\n    \"requests\": 340,\n    \"comparison\": 240\n  }\n];\n\n\n\nfunction LoadingDemo() { const [loading, setLoading] = useState(false); const [replay, setReplay] = useState(0); return <div className=\"w-full\"><div className=\"flex flex-wrap gap-2\"><Button size=\"sm\" variant=\"secondary\" onClick={() => setLoading(v => !v)}>Toggle loading</Button><Button size=\"sm\" variant=\"secondary\" onClick={() => setReplay(v => v + 1)}>Replay</Button></div><BarChart data={loading ? [] : data} status={loading ? \"loading\" : \"ready\"} revealSignature={String(replay)}><Bar dataKey=\"requests\" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart></div>; }\n\nexport default function Example() { return <LoadingDemo />; }\n";

const brushCode = "\"use client\";\n\nimport { useMemo, useState } from \"react\";\nimport { BarChart, Bar, BarXAxis } from \"@/components/ui/bar-chart\";\nimport { AreaChart, Area } from \"@/components/ui/area-chart\";\nimport { ChartBrush, type ChartBrushSelection } from \"@/components/ui/chart-brush\";\nimport { Grid, YAxis, ChartTooltip } from \"@/components/ui/chart-core\";\nimport { ChartDataTable } from \"@/components/ui/chart-primitives\";\nimport { Button } from \"@/components/ui/button\";\nimport { Empty, EmptyDescription } from \"@/components/ui/empty\";\n\nconst timeData = [120, 210, 170, 320, 280, 390, 340].map((requests, index) => ({\n  date: Date.UTC(2026, 9, index + 1),\n  requests,\n}));\nconst dateFormat = new Intl.DateTimeFormat(\"en\", {\n  month: \"short\", day: \"numeric\", timeZone: \"UTC\",\n});\n\nexport default function Example() {\n  const [selection, setSelection] = useState<ChartBrushSelection | null>({\n    start: new Date(timeData[1].date), end: new Date(timeData[5].date),\n  });\n  const visibleData = useMemo(() => timeData\n    .filter(row => !selection || (row.date >= selection.start.getTime() && row.date <= selection.end.getTime()))\n    .map(row => ({ ...row, name: dateFormat.format(row.date) })), [selection]);\n\n  return <div className=\"w-full space-y-4\">\n    <div className=\"flex flex-wrap gap-2\">\n      <Button size=\"sm\" variant=\"secondary\" onClick={() => setSelection({\n        start: new Date(timeData[2].date), end: new Date(timeData[4].date),\n      })}>Middle range</Button>\n      <Button size=\"sm\" variant=\"secondary\" onClick={() => setSelection(null)}>Clear range</Button>\n    </div>\n    <p role=\"status\" aria-live=\"polite\" className=\"text-label text-fg-muted\">\n      {dateFormat.format(selection?.start ?? timeData[0].date)} to {dateFormat.format(selection?.end ?? timeData[timeData.length - 1].date)} · {visibleData.length} observations\n    </p>\n    {visibleData.length ? <BarChart data={visibleData} className=\"h-64\" aspectRatio=\"auto\" animationDuration={0}>\n      <Grid horizontal /><Bar dataKey=\"requests\" /><BarXAxis maxLabels={3} /><YAxis /><ChartTooltip />\n    </BarChart> : <div className=\"flex h-64 items-center\">\n      <Empty reason=\"no-filter-results\" scope=\"inline\"><EmptyDescription>No observations in this time range</EmptyDescription></Empty>\n    </div>}\n    <AreaChart data={timeData} style={{ height: 80, aspectRatio: \"auto\" }} margin={{ top: 8, bottom: 8 }} animationDuration={0} yDomainTween={false}>\n      <Area dataKey=\"requests\" animate={false} showHighlight={false} fadeEdges={false} />\n      <ChartBrush selection={selection} onSelectionChange={setSelection} blurPx={0} fadeOuterEdges={false} />\n    </AreaChart>\n    <ChartDataTable caption=\"Observations in the selected range\" summary=\"View source data\" columns={[\"Date\", \"Requests\"]} rows={visibleData.map(row => ({\n      id: String(row.date), label: row.name, values: [row.requests],\n    }))} />\n  </div>;\n}\n";

import api from "./api.json";

export default function BarChartDoc() {
  const t = useTranslations("barchart");
  return <DocPage title="BarChart" slug="bar-chart" installSlug="bar-chart area-chart chart-brush chart-primitives button empty" description={t("description")}>
    <DocSection title={t("basic") }><figure aria-label={t("basic")} className="min-w-0 w-full"><ComponentPreview code={basicCode} padding="responsive" preservePreview><BasicDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("horizontal") }><figure aria-label={t("horizontal")} className="min-w-0 w-full"><ComponentPreview code={horizontalCode} padding="responsive" preservePreview><HorizontalDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("grouped") }><figure aria-label={t("grouped")} className="min-w-0 w-full"><ComponentPreview code={groupedCode} padding="responsive" preservePreview><GroupedDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("stacked") }><figure aria-label={t("stacked")} className="min-w-0 w-full"><ComponentPreview code={stackedCode} padding="responsive" preservePreview><StackedDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("fills") }><figure aria-label={t("fills")} className="min-w-0 w-full"><ComponentPreview code={fillsCode} padding="responsive" preservePreview><FillsDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("squares") }><figure aria-label={t("squares")} className="min-w-0 w-full"><ComponentPreview code={squaresCode} padding="responsive" preservePreview><SquaresDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("loading") }><figure aria-label={t("loading")} className="min-w-0 w-full"><ComponentPreview code={loadingCode} padding="responsive" preservePreview><LoadingDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("brush")}><figure aria-label={t("brush")} className="min-w-0 w-full"><ComponentPreview code={brushCode} padding="responsive" preservePreview><BrushDemo /></ComponentPreview></figure><p className="mt-3 text-body text-fg-muted">{t("brushDescription")}</p></DocSection>
    <ChartDataTable caption={t("dataCaption")} summary={t("viewData")} columns={["Category","Requests","Comparison"]} rows={data.map((row,index) => ({id:String(index),label:row.name,values:[row.requests,row.comparison]}))} />
    <DocSection title={t("behavior")}><div className="space-y-2 text-body text-fg-muted"><p>{t("contract")}</p><p>{t("keyboard")}</p><p>{t("compatibility")}</p></div></DocSection>
    <DocSection title={t("api")}><PropsTable props={api} /></DocSection>
  </DocPage>;
}
