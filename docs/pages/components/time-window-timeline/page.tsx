"use client";

import { useTranslations } from "next-intl";
import { TimeWindowTimeline, type TimeWindowGroup } from "@zeron/ui/time-window-timeline";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";

const DAY = 86_400_000;
const start = Date.UTC(2026, 9, 12);
const groups: TimeWindowGroup[] = [{ id: "compute", label: "Compute pools", rows: [
  { id: "training", label: "Training pool", intervals: [
    { id: "past", start: start - DAY, end: start + DAY, label: "Ended Oct 13", ariaLabel: "Previous window ended October 13", variant: "earlier" },
    { id: "current", start: start + DAY, end: start + DAY * 5, label: "32% used · Oct 13", ariaLabel: "Training pool: 32% used, October 13–17", value: 32, tone: "success" },
    { id: "next", start: start + DAY * 5, end: start + DAY * 9, label: "Next · Oct 21", ariaLabel: "Next window: October 17–21", variant: "next" },
  ], markers: [{ id: "reset", at: start + DAY, label: "Reset early, October 13" }] },
  { id: "inference", label: "Inference pool", intervals: [{ id: "current", start, end: start + DAY * 6, label: "84% used · Oct 12", ariaLabel: "Inference pool: 84% used, October 12–18", value: 84, tone: "warning" }] },
] }];
const ticks = Array.from({ length: 7 }, (_, index) => ({ id: String(index), start: start + DAY * index, end: start + DAY * (index + 1), label: `Oct ${12 + index}` }));
const code = `import { TimeWindowTimeline } from "@/components/ui/time-window-timeline";

const day = 86_400_000;
const start = Date.UTC(2026, 9, 12);
const ticks = Array.from({ length: 7 }, (_, i) => ({
  id: String(i), start: start + day * i, end: start + day * (i + 1),
  label: "Oct " + (12 + i),
}));
const groups = [{ id: "compute", label: "Compute", rows: [{
  id: "training", label: "Training pool", intervals: [{
    id: "current", start, end: start + day * 6,
    label: "32% used", ariaLabel: "Training pool: 32% used", value: 32,
  }],
}] }];

export default function Example() {
  return <TimeWindowTimeline ariaLabel="Compute quota windows"
    start={start} end={start + day * 7} now={start + day * 3.4}
    ticks={ticks} groups={groups} labelHeader="Resource" />;
}`;

export default function TimeWindowTimelineDoc() {
  const t = useTranslations("timeWindowTimeline");
  return <DocPage title="TimeWindowTimeline" slug="time-window-timeline" installSlug="time-window-timeline" description={t("description")}>
    <DocSection title={t("basic")}><ComponentPreview code={code} padding="compact" preservePreview coverSource>
      <TimeWindowTimeline ariaLabel="Compute quota windows" start={start} end={start + DAY * 7} now={start + DAY * 3.4} ticks={ticks} groups={groups} labelHeader="Resource" labelWidth={180} minTrackWidth={560} />
    </ComponentPreview></DocSection>
    <DocSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></DocSection>
    <DocSection title={t("api")}><PropsTable props={[
      { name: "ariaLabel", type: "string", description: "Required accessible region and table name." },
      { name: "start / end", type: "number", description: "Required visible range in epoch milliseconds; end is exclusive." },
      { name: "ticks", type: "readonly TimeWindowTick[]", description: "Required ordered non-overlapping intervals and React labels." },
      { name: "groups", type: "readonly TimeWindowGroup[]", description: "Required group labels, row labels, intervals, optional reset/expiry markers and muted state." },
      { name: "now / nowLabel", type: "number / string", description: "Snapshot time and localized label. The line hides outside the range." },
      { name: "labelHeader", type: "ReactNode", description: "Label-track heading." },
      { name: "labelWidth / minTrackWidth", type: "number", default: "300 / 840", description: "Label width and minimum time-track width in CSS pixels." },
      { name: "emptyContent / invalidContent", type: "ReactNode", description: "Host-owned empty and validation messages." },
    ]} /></DocSection>
  </DocPage>;
}
