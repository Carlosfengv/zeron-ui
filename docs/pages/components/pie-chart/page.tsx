"use client";

import { useId, useState } from "react";
import { PieChart, PieSlice, PieCenter, PieCenterShell } from "@zeron/ui/pie-chart";
import { ChartLegend, LinearGradient, PatternLines } from "@zeron/ui/chart-core";
import { Button } from "@zeron/ui/button";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { useLocale, useTranslations } from "next-intl";

const data = [
  {
    "label": "Direct",
    "value": 340,
    "color": "var(--chart-1)"
  },
  {
    "label": "Search",
    "value": 240,
    "color": "var(--chart-2)"
  },
  {
    "label": "Referral",
    "value": 180,
    "color": "var(--chart-3)"
  },
  {
    "label": "Social",
    "value": 130,
    "color": "var(--chart-4)"
  },
  {
    "label": "Email",
    "value": 110,
    "color": "var(--chart-5)"
  }
];



function BasicDemo() { const [hovered, setHovered] = useState<number | null>(null); return <div className="mx-auto w-full max-w-sm"><div className="flex justify-center"><PieChart size={180} data={data} hoveredIndex={hovered} onHoverChange={setHovered}>{data.map((item,index) => <PieSlice key={item.label} index={index} />)}</PieChart></div><ChartLegend layout="inline" overflow="collapse" items={data.map(item => ({label:item.label,value:item.value,color:item.color}))} hoveredIndex={hovered} onHover={setHovered} /></div>; }

const distributionData = [
  { label: "Gateway", value: 48, color: "var(--chart-1)" },
  { label: "Functions", value: 28, color: "var(--chart-2)" },
  { label: "Storage", value: 16, color: "var(--chart-3)" },
  { label: "Database", value: 8, color: "var(--chart-4)" },
];

function DonutDemo({
  partial = false,
  allocatedLabel = "Allocated / 100",
  unassignedLabel = "Unassigned",
  viewDataLabel = "View data",
  locale = "en",
}: {
  partial?: boolean;
  allocatedLabel?: string;
  unassignedLabel?: string;
  viewDataLabel?: string;
  locale?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const chartSize = 180;
  const outerRadius = chartSize / 2 - 10;
  const innerRadius = outerRadius * (88 / 118);
  // D3's automatic pad radius is hypot(innerRadius, outerRadius).
  // Convert the 2px chord gap into radians for the 180px demo.
  const padRadius = Math.hypot(innerRadius, outerRadius);
  const padAngle = padRadius > 0 ? 2 * Math.asin(Math.min(1, 1 / padRadius)) : 0;
  const total = 100;
  const assignedData = partial ? distributionData.slice(0, 3) : distributionData;
  const assigned = assignedData.reduce((sum, item) => sum + item.value, 0);
  // The remainder participates in geometry so percentages keep the explicit total.
  const items = [
    ...assignedData,
    ...(assigned < total
      ? [{ label: unassignedLabel, value: total - assigned, color: "var(--muted)" }]
      : []),
  ];
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-2xl gap-4">
    <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row">
      <div className="shrink-0">
        <PieChart size={180} data={items} innerRadius={innerRadius} padAngle={padAngle} cornerRadius={4} hoveredIndex={hovered} onHoverChange={setHovered}>
          {items.map((item, index) => <PieSlice key={item.label} index={index} />)}
          <PieCenter defaultLabel={allocatedLabel}>
            {({ value, label, isHovered }) => (
              <div className="flex flex-col items-center gap-1 text-center">
                <strong className="text-heading tabular-nums">{format.format(isHovered ? value : assigned)}</strong>
                <span className="text-label text-fg-muted">{isHovered ? label : allocatedLabel}</span>
              </div>
            )}
          </PieCenter>
        </PieChart>
      </div>
      <ChartLegend
        className="w-full min-w-0 sm:flex-1"
        layout="stack"
        overflow="wrap"
        items={items}
        hoveredIndex={hovered}
        onHover={setHovered}
        formatValue={(value) => `${format.format(value)} · ${percent.format(value / total)}`}
      />
    </div>
    <ChartDataTable caption={allocatedLabel} summary={viewDataLabel} columns={["Service", "Value"]} rows={items.map(item => ({ id: item.label, label: item.label, values: [item.value] }))} />
    </div>
  );
}

function FillsDemo({ locale = "en", totalLabel = "Total" }: { locale?: string; totalLabel?: string }) {
  const id = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState<number | null>(null);
  const outerRadius = 180 / 2 - 10;
  const innerRadius = outerRadius * (88 / 118);
  const padAngle = 2 * Math.asin(1 / Math.hypot(innerRadius, outerRadius));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-2xl gap-4">
      <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row">
        <div className="shrink-0">
          <PieChart size={180} data={data} innerRadius={innerRadius} padAngle={padAngle} cornerRadius={4} hoveredIndex={hovered} onHoverChange={setHovered}>
            <LinearGradient id={id + "-gradient"} from="var(--chart-1)" to="var(--chart-2)" />
            <PatternLines id={id + "-pattern"} height={6} width={6} stroke="var(--chart-3)" strokeWidth={1} orientation={["diagonal"]} />
            {data.map((item, index) => (
              <PieSlice key={item.label} index={index} fill={index === 0 ? "url(#" + id + "-gradient)" : index === 2 ? "url(#" + id + "-pattern)" : undefined} hoverEffect="none" />
            ))}
            <PieCenter defaultLabel={totalLabel}>
              {({ value, label }) => (
                <div className="flex flex-col items-center gap-1 text-center">
                  <strong className="text-heading tabular-nums">{format.format(value)}</strong>
                  <span className="text-label text-fg-muted">{label}</span>
                </div>
              )}
            </PieCenter>
          </PieChart>
        </div>
        <ChartLegend
          className="w-full min-w-0 sm:flex-1"
          layout="stack"
          overflow="wrap"
          items={data}
          hoveredIndex={hovered}
          onHover={setHovered}
          formatValue={(value) => `${format.format(value)} · ${percent.format(value / total)}`}
        />
      </div>
    </div>
  );
}

function ScrubDemo({ locale = "en", totalLabel = "Total", changeLabel = "Change geometry" }: { locale?: string; totalLabel?: string; changeLabel?: string }) {
  const [half, setHalf] = useState(false);
  const outerRadius = 180 / 2 - 10;
  const innerRadius = outerRadius * (88 / 118);
  const padAngle = 2 * Math.asin(1 / Math.hypot(innerRadius, outerRadius));
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const percent = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });

  return (
    <div className="mx-auto grid w-full min-w-0 max-w-2xl gap-4">
      <Button className="justify-self-start" size="sm" variant="secondary" onClick={() => setHalf(value => !value)}>{changeLabel}</Button>
      <div className="flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row">
        <div className="shrink-0">
          <PieChart size={180} data={data} innerRadius={innerRadius} padAngle={padAngle} cornerRadius={4} geometryScrubbing endAngle={half ? Math.PI / 2 : 3 * Math.PI / 2}>
            {data.map((item, index) => <PieSlice key={item.label} index={index} />)}
            <PieCenter defaultLabel={totalLabel}>
              {({ value, label }) => (
                <div className="flex flex-col items-center gap-1 text-center">
                  <strong className="text-heading tabular-nums">{format.format(value)}</strong>
                  <span className="text-label text-fg-muted">{label}</span>
                </div>
              )}
            </PieCenter>
          </PieChart>
        </div>
        <ChartLegend
          className="w-full min-w-0 sm:flex-1"
          layout="stack"
          overflow="wrap"
          items={data}
          formatValue={(value) => `${format.format(value)} · ${percent.format(value / total)}`}
        />
      </div>
    </div>
  );
}

function CenterDemo() { const [value, setValue] = useState(1000); return <div className="flex w-full flex-col items-center gap-4"><div className="flex size-45 items-center justify-center"><PieCenterShell centerValue={value} contextSize={180} innerRadiusPx={70} defaultLabel="Total" /></div><Button size="sm" variant="secondary" onClick={() => setValue(v => v + 100)}>Add 100</Button></div>; }

const basicCode = "\"use client\";\n\nimport { useState } from \"react\";\nimport { PieChart, PieSlice } from \"@/components/ui/pie-chart\";\nimport { ChartLegend } from \"@/components/ui/chart-core\";\n\nconst data = [\n  {\n    \"label\": \"Direct\",\n    \"value\": 340,\n    \"color\": \"var(--chart-1)\"\n  },\n  {\n    \"label\": \"Search\",\n    \"value\": 240,\n    \"color\": \"var(--chart-2)\"\n  },\n  {\n    \"label\": \"Referral\",\n    \"value\": 180,\n    \"color\": \"var(--chart-3)\"\n  },\n  {\n    \"label\": \"Social\",\n    \"value\": 130,\n    \"color\": \"var(--chart-4)\"\n  },\n  {\n    \"label\": \"Email\",\n    \"value\": 110,\n    \"color\": \"var(--chart-5)\"\n  }\n];\n\nfunction BasicDemo() { const [hovered, setHovered] = useState<number | null>(null); return <div className=\"mx-auto w-full max-w-sm\"><div className=\"flex justify-center\"><PieChart size={180} data={data} hoveredIndex={hovered} onHoverChange={setHovered}>{data.map((item,index) => <PieSlice key={item.label} index={index} />)}</PieChart></div><ChartLegend layout=\"inline\" overflow=\"collapse\" items={data.map(item => ({label:item.label,value:item.value,color:item.color}))} hoveredIndex={hovered} onHover={setHovered} /></div>; }\n\nexport default function Example() { return <BasicDemo />; }\n";
const donutCode = "\"use client\";\n\nimport { useState } from \"react\";\nimport { PieChart, PieSlice, PieCenter } from \"@/components/ui/pie-chart\";\nimport { ChartLegend } from \"@/components/ui/chart-core\";\nimport { ChartDataTable } from \"@/components/ui/chart-primitives\";\n\nconst distributionData = [\n  { label: \"Gateway\", value: 48, color: \"var(--chart-1)\" },\n  { label: \"Functions\", value: 28, color: \"var(--chart-2)\" },\n  { label: \"Storage\", value: 16, color: \"var(--chart-3)\" },\n  { label: \"Database\", value: 8, color: \"var(--chart-4)\" },\n];\n\nfunction DonutDemo({\n  partial = false,\n  allocatedLabel = \"Allocated / 100\",\n  unassignedLabel = \"Unassigned\",\n  viewDataLabel = \"View data\",\n  locale = \"en\",\n}: {\n  partial?: boolean;\n  allocatedLabel?: string;\n  unassignedLabel?: string;\n  viewDataLabel?: string;\n  locale?: string;\n}) {\n  const [hovered, setHovered] = useState<number | null>(null);\n  const chartSize = 180;\n  const outerRadius = chartSize / 2 - 10;\n  const innerRadius = outerRadius * (88 / 118);\n  // D3's automatic pad radius is hypot(innerRadius, outerRadius).\n  // Convert the 2px chord gap into radians for the 180px demo.\n  const padRadius = Math.hypot(innerRadius, outerRadius);\n  const padAngle = padRadius > 0 ? 2 * Math.asin(Math.min(1, 1 / padRadius)) : 0;\n  const total = 100;\n  const assignedData = partial ? distributionData.slice(0, 3) : distributionData;\n  const assigned = assignedData.reduce((sum, item) => sum + item.value, 0);\n  // The remainder participates in geometry so percentages keep the explicit total.\n  const items = [\n    ...assignedData,\n    ...(assigned < total\n      ? [{ label: unassignedLabel, value: total - assigned, color: \"var(--muted)\" }]\n      : []),\n  ];\n  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });\n  const percent = new Intl.NumberFormat(locale, { style: \"percent\", maximumFractionDigits: 0 });\n\n  return (\n    <div className=\"mx-auto grid w-full min-w-0 max-w-2xl gap-4\">\n    <div className=\"flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row\">\n      <div className=\"shrink-0\">\n        <PieChart size={180} data={items} innerRadius={innerRadius} padAngle={padAngle} cornerRadius={4} hoveredIndex={hovered} onHoverChange={setHovered}>\n          {items.map((item, index) => <PieSlice key={item.label} index={index} />)}\n          <PieCenter defaultLabel={allocatedLabel}>\n            {({ value, label, isHovered }) => (\n              <div className=\"flex flex-col items-center gap-1 text-center\">\n                <strong className=\"text-heading tabular-nums\">{format.format(isHovered ? value : assigned)}</strong>\n                <span className=\"text-label text-fg-muted\">{isHovered ? label : allocatedLabel}</span>\n              </div>\n            )}\n          </PieCenter>\n        </PieChart>\n      </div>\n      <ChartLegend\n        className=\"w-full min-w-0 sm:flex-1\"\n        layout=\"stack\"\n        overflow=\"wrap\"\n        items={items}\n        hoveredIndex={hovered}\n        onHover={setHovered}\n        formatValue={(value) => `${format.format(value)} · ${percent.format(value / total)}`}\n      />\n    </div>\n    <ChartDataTable caption={allocatedLabel} summary={viewDataLabel} columns={[\"Service\", \"Value\"]} rows={items.map(item => ({ id: item.label, label: item.label, values: [item.value] }))} />\n    </div>\n  );\n}\n\nexport default function Example() { return <DonutDemo />; }\n";
const remainderCode = "\"use client\";\n\nimport { useState } from \"react\";\nimport { PieChart, PieSlice, PieCenter } from \"@/components/ui/pie-chart\";\nimport { ChartLegend } from \"@/components/ui/chart-core\";\nimport { ChartDataTable } from \"@/components/ui/chart-primitives\";\n\nconst distributionData = [\n  { label: \"Gateway\", value: 48, color: \"var(--chart-1)\" },\n  { label: \"Functions\", value: 28, color: \"var(--chart-2)\" },\n  { label: \"Storage\", value: 16, color: \"var(--chart-3)\" },\n  { label: \"Database\", value: 8, color: \"var(--chart-4)\" },\n];\n\nfunction DonutDemo({\n  partial = false,\n  allocatedLabel = \"Allocated / 100\",\n  unassignedLabel = \"Unassigned\",\n  viewDataLabel = \"View data\",\n  locale = \"en\",\n}: {\n  partial?: boolean;\n  allocatedLabel?: string;\n  unassignedLabel?: string;\n  viewDataLabel?: string;\n  locale?: string;\n}) {\n  const [hovered, setHovered] = useState<number | null>(null);\n  const chartSize = 180;\n  const outerRadius = chartSize / 2 - 10;\n  const innerRadius = outerRadius * (88 / 118);\n  // D3's automatic pad radius is hypot(innerRadius, outerRadius).\n  // Convert the 2px chord gap into radians for the 180px demo.\n  const padRadius = Math.hypot(innerRadius, outerRadius);\n  const padAngle = padRadius > 0 ? 2 * Math.asin(Math.min(1, 1 / padRadius)) : 0;\n  const total = 100;\n  const assignedData = partial ? distributionData.slice(0, 3) : distributionData;\n  const assigned = assignedData.reduce((sum, item) => sum + item.value, 0);\n  // The remainder participates in geometry so percentages keep the explicit total.\n  const items = [\n    ...assignedData,\n    ...(assigned < total\n      ? [{ label: unassignedLabel, value: total - assigned, color: \"var(--muted)\" }]\n      : []),\n  ];\n  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });\n  const percent = new Intl.NumberFormat(locale, { style: \"percent\", maximumFractionDigits: 0 });\n\n  return (\n    <div className=\"mx-auto grid w-full min-w-0 max-w-2xl gap-4\">\n    <div className=\"flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row\">\n      <div className=\"shrink-0\">\n        <PieChart size={180} data={items} innerRadius={innerRadius} padAngle={padAngle} cornerRadius={4} hoveredIndex={hovered} onHoverChange={setHovered}>\n          {items.map((item, index) => <PieSlice key={item.label} index={index} />)}\n          <PieCenter defaultLabel={allocatedLabel}>\n            {({ value, label, isHovered }) => (\n              <div className=\"flex flex-col items-center gap-1 text-center\">\n                <strong className=\"text-heading tabular-nums\">{format.format(isHovered ? value : assigned)}</strong>\n                <span className=\"text-label text-fg-muted\">{isHovered ? label : allocatedLabel}</span>\n              </div>\n            )}\n          </PieCenter>\n        </PieChart>\n      </div>\n      <ChartLegend\n        className=\"w-full min-w-0 sm:flex-1\"\n        layout=\"stack\"\n        overflow=\"wrap\"\n        items={items}\n        hoveredIndex={hovered}\n        onHover={setHovered}\n        formatValue={(value) => `${format.format(value)} · ${percent.format(value / total)}`}\n      />\n    </div>\n    <ChartDataTable caption={allocatedLabel} summary={viewDataLabel} columns={[\"Service\", \"Value\"]} rows={items.map(item => ({ id: item.label, label: item.label, values: [item.value] }))} />\n    </div>\n  );\n}\n\nexport default function Example() { return <DonutDemo partial />; }\n";
const fillsCode = "\"use client\";\n\nimport { useId, useState } from \"react\";\nimport { PieChart, PieSlice, PieCenter } from \"@/components/ui/pie-chart\";\nimport { ChartLegend, LinearGradient, PatternLines } from \"@/components/ui/chart-core\";\n\nconst data = [\n  {\n    \"label\": \"Direct\",\n    \"value\": 340,\n    \"color\": \"var(--chart-1)\"\n  },\n  {\n    \"label\": \"Search\",\n    \"value\": 240,\n    \"color\": \"var(--chart-2)\"\n  },\n  {\n    \"label\": \"Referral\",\n    \"value\": 180,\n    \"color\": \"var(--chart-3)\"\n  },\n  {\n    \"label\": \"Social\",\n    \"value\": 130,\n    \"color\": \"var(--chart-4)\"\n  },\n  {\n    \"label\": \"Email\",\n    \"value\": 110,\n    \"color\": \"var(--chart-5)\"\n  }\n];\n\nfunction FillsDemo({ locale = \"en\", totalLabel = \"Total\" }: { locale?: string; totalLabel?: string }) {\n  const id = useId().replace(/:/g, \"\");\n  const [hovered, setHovered] = useState<number | null>(null);\n  const outerRadius = 180 / 2 - 10;\n  const innerRadius = outerRadius * (88 / 118);\n  const padAngle = 2 * Math.asin(1 / Math.hypot(innerRadius, outerRadius));\n  const total = data.reduce((sum, item) => sum + item.value, 0);\n  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });\n  const percent = new Intl.NumberFormat(locale, { style: \"percent\", maximumFractionDigits: 0 });\n\n  return (\n    <div className=\"mx-auto grid w-full min-w-0 max-w-2xl gap-4\">\n      <div className=\"flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row\">\n        <div className=\"shrink-0\">\n          <PieChart size={180} data={data} innerRadius={innerRadius} padAngle={padAngle} cornerRadius={4} hoveredIndex={hovered} onHoverChange={setHovered}>\n            <LinearGradient id={id + \"-gradient\"} from=\"var(--chart-1)\" to=\"var(--chart-2)\" />\n            <PatternLines id={id + \"-pattern\"} height={6} width={6} stroke=\"var(--chart-3)\" strokeWidth={1} orientation={[\"diagonal\"]} />\n            {data.map((item, index) => (\n              <PieSlice key={item.label} index={index} fill={index === 0 ? \"url(#\" + id + \"-gradient)\" : index === 2 ? \"url(#\" + id + \"-pattern)\" : undefined} hoverEffect=\"none\" />\n            ))}\n            <PieCenter defaultLabel={totalLabel}>\n              {({ value, label }) => (\n                <div className=\"flex flex-col items-center gap-1 text-center\">\n                  <strong className=\"text-heading tabular-nums\">{format.format(value)}</strong>\n                  <span className=\"text-label text-fg-muted\">{label}</span>\n                </div>\n              )}\n            </PieCenter>\n          </PieChart>\n        </div>\n        <ChartLegend\n          className=\"w-full min-w-0 sm:flex-1\"\n          layout=\"stack\"\n          overflow=\"wrap\"\n          items={data}\n          hoveredIndex={hovered}\n          onHover={setHovered}\n          formatValue={(value) => `${format.format(value)} · ${percent.format(value / total)}`}\n        />\n      </div>\n    </div>\n  );\n}\n\nexport default function Example() { return <FillsDemo />; }\n";
const scrubCode = "\"use client\";\n\nimport { useState } from \"react\";\nimport { PieChart, PieSlice, PieCenter } from \"@/components/ui/pie-chart\";\nimport { ChartLegend } from \"@/components/ui/chart-core\";\nimport { Button } from \"@/components/ui/button\";\n\nconst data = [\n  {\n    \"label\": \"Direct\",\n    \"value\": 340,\n    \"color\": \"var(--chart-1)\"\n  },\n  {\n    \"label\": \"Search\",\n    \"value\": 240,\n    \"color\": \"var(--chart-2)\"\n  },\n  {\n    \"label\": \"Referral\",\n    \"value\": 180,\n    \"color\": \"var(--chart-3)\"\n  },\n  {\n    \"label\": \"Social\",\n    \"value\": 130,\n    \"color\": \"var(--chart-4)\"\n  },\n  {\n    \"label\": \"Email\",\n    \"value\": 110,\n    \"color\": \"var(--chart-5)\"\n  }\n];\n\nfunction ScrubDemo({ locale = \"en\", totalLabel = \"Total\", changeLabel = \"Change geometry\" }: { locale?: string; totalLabel?: string; changeLabel?: string }) {\n  const [half, setHalf] = useState(false);\n  const outerRadius = 180 / 2 - 10;\n  const innerRadius = outerRadius * (88 / 118);\n  const padAngle = 2 * Math.asin(1 / Math.hypot(innerRadius, outerRadius));\n  const total = data.reduce((sum, item) => sum + item.value, 0);\n  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });\n  const percent = new Intl.NumberFormat(locale, { style: \"percent\", maximumFractionDigits: 0 });\n\n  return (\n    <div className=\"mx-auto grid w-full min-w-0 max-w-2xl gap-4\">\n      <Button className=\"justify-self-start\" size=\"sm\" variant=\"secondary\" onClick={() => setHalf(value => !value)}>{changeLabel}</Button>\n      <div className=\"flex w-full min-w-0 flex-col items-center gap-6 sm:flex-row\">\n        <div className=\"shrink-0\">\n          <PieChart size={180} data={data} innerRadius={innerRadius} padAngle={padAngle} cornerRadius={4} geometryScrubbing endAngle={half ? Math.PI / 2 : 3 * Math.PI / 2}>\n            {data.map((item, index) => <PieSlice key={item.label} index={index} />)}\n            <PieCenter defaultLabel={totalLabel}>\n              {({ value, label }) => (\n                <div className=\"flex flex-col items-center gap-1 text-center\">\n                  <strong className=\"text-heading tabular-nums\">{format.format(value)}</strong>\n                  <span className=\"text-label text-fg-muted\">{label}</span>\n                </div>\n              )}\n            </PieCenter>\n          </PieChart>\n        </div>\n        <ChartLegend\n          className=\"w-full min-w-0 sm:flex-1\"\n          layout=\"stack\"\n          overflow=\"wrap\"\n          items={data}\n          formatValue={(value) => `${format.format(value)} · ${percent.format(value / total)}`}\n        />\n      </div>\n    </div>\n  );\n}\n\nexport default function Example() { return <ScrubDemo />; }\n";
const centerCode = "\"use client\";\n\nimport { useState } from \"react\";\nimport { PieCenterShell } from \"@/components/ui/pie-chart\";\nimport { Button } from \"@/components/ui/button\";\n\nfunction CenterDemo() { const [value, setValue] = useState(1000); return <div className=\"flex w-full flex-col items-center gap-4\"><div className=\"flex size-45 items-center justify-center\"><PieCenterShell centerValue={value} contextSize={180} innerRadiusPx={70} defaultLabel=\"Total\" /></div><Button size=\"sm\" variant=\"secondary\" onClick={() => setValue(v => v + 100)}>Add 100</Button></div>; }\n\nexport default function Example() { return <CenterDemo />; }\n";

import api from "./api.json";

export default function PieChartDoc() {
  const t = useTranslations("piechart");
  const locale = useLocale();
  return <DocPage title="PieChart" slug="pie-chart" installSlug="pie-chart chart-primitives button" description={t("description")}>
    <DocSection title={t("basic") }><figure aria-label={t("basic")} className="min-w-0 w-full"><ComponentPreview code={basicCode} padding="responsive" preservePreview><BasicDemo /></ComponentPreview></figure></DocSection>
    <DocSection title={t("donut") }><p className="text-body text-fg-muted">{t("donutDescription")}</p><figure aria-label={t("donut")} className="min-w-0 w-full"><ComponentPreview code={donutCode} padding="responsive" preservePreview><DonutDemo locale={locale} allocatedLabel={t("allocated")} unassignedLabel={t("unassigned")} viewDataLabel={t("viewData")} /></ComponentPreview></figure></DocSection>
    <DocSection title={t("remainder")}><p className="text-body text-fg-muted">{t("remainderDescription")}</p><figure aria-label={t("remainder")} className="min-w-0 w-full"><ComponentPreview code={remainderCode} padding="responsive" preservePreview><DonutDemo partial locale={locale} allocatedLabel={t("allocated")} unassignedLabel={t("unassigned")} viewDataLabel={t("viewData")} /></ComponentPreview></figure></DocSection>
    <DocSection title={t("fills") }><figure aria-label={t("fills")} className="min-w-0 w-full"><ComponentPreview code={fillsCode} padding="responsive" preservePreview><FillsDemo locale={locale} totalLabel={t("total")} /></ComponentPreview></figure></DocSection>
    <DocSection title={t("scrub") }><figure aria-label={t("scrub")} className="min-w-0 w-full"><ComponentPreview code={scrubCode} padding="responsive" preservePreview><ScrubDemo locale={locale} totalLabel={t("total")} changeLabel={t("changeGeometry")} /></ComponentPreview></figure></DocSection>
    <DocSection title={t("center") }><figure aria-label={t("center")} className="min-w-0 w-full"><ComponentPreview code={centerCode} padding="responsive" preservePreview><CenterDemo /></ComponentPreview></figure></DocSection>
    <ChartDataTable caption={t("dataCaption")} summary={t("viewData")} columns={["Source","Value"]} rows={data.map((row,index) => ({id:String(index),label:row.label,values:[row.value]}))} />
    <DocSection title={t("behavior")}><div className="space-y-2 text-body text-fg-muted"><p>{t("contract")}</p><p>{t("keyboard")}</p><p>{t("compatibility")}</p></div></DocSection>
    <DocSection title={t("api")}><PropsTable props={api} /></DocSection>
  </DocPage>;
}
