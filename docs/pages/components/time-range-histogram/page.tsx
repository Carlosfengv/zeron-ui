"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  TimeRangeHistogram,
  type TimeRangeHistogramDatum,
  type TimeRangeHistogramRange,
  type TimeRangeHistogramSeries,
} from "@zeron/ui/time-range-histogram";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";

const HOUR_IN_MS = 60 * 60 * 1000;
const demoStart = Date.UTC(2026, 7, 20, 0, 0, 0);

const basicCode = `import { useState } from "react";
import { TimeRangeHistogram } from "@zeron/ui/time-range-histogram";

const [range, setRange] = useState({
  start: buckets.at(-12).start,
  end: buckets.at(-1).end,
});

<TimeRangeHistogram
  ariaLabel="Request volume time range"
  data={buckets}
  series={series}
  value={range}
  onValueChange={setRange}
  formatRange={({ start, end }) =>
    \`\${formatDate(start)} – \${formatDate(end)}\`
  }
  instruction="Drag the selection to move the range"
/>`;

const props: PropDef[] = [
  { name: "ariaLabel", type: "string", description: "Accessible name for the interactive range selector." },
  { name: "data", type: "TimeRangeHistogramDatum[]", description: "Ordered, non-overlapping buckets with start, end, label, and series values." },
  { name: "series", type: "TimeRangeHistogramSeries[]", description: "Series keys, labels, active colors, and optional inactive colors." },
  { name: "value", type: "TimeRangeHistogramRange", description: "Controlled start and end timestamps for the selected range." },
  { name: "onValueChange", type: "(value) => void", description: "Called when pointer or keyboard interaction commits a new bucket-aligned range." },
  { name: "formatRange", type: "(value) => string", description: "Formats the selected range announced by assistive technology." },
  { name: "formatValue", type: "(value, series) => ReactNode", description: "Formats each series value in the tooltip." },
  { name: "rangeStartLabel", type: "ReactNode", description: "Overrides the label beneath the first bucket." },
  { name: "rangeEndLabel", type: "ReactNode", description: "Overrides the label beneath the last bucket." },
  { name: "instruction", type: "ReactNode", description: "Optional visible pointer and keyboard interaction hint." },
  { name: "emptyContent", type: "ReactNode", description: "Content rendered when data contains no buckets." },
  { name: "disabled", type: "boolean", default: "false", description: "Disables pointer and keyboard selection without hiding the histogram." },
  { name: "chartClassName", type: "string", description: "Class applied to the fixed-height chart container." },
];

export default function TimeRangeHistogramDoc() {
  const locale = useLocale();
  const t = useTranslations("timeRangeHistogram");
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short", timeZone: "UTC" }),
    [locale],
  );
  const data = useMemo<TimeRangeHistogramDatum[]>(
    () => Array.from({ length: 48 }, (_, index) => {
      const start = demoStart + index * HOUR_IN_MS;
      const end = start + HOUR_IN_MS;
      return {
        start,
        end,
        label: dateFormatter.format(start),
        success: 34 + (index * 17 % 41),
        warning: index % 5 === 0 ? 7 + index % 4 : 2 + index % 5,
        error: index % 11 === 0 ? 6 : 1 + index % 3,
      };
    }),
    [dateFormatter],
  );
  const series = useMemo<readonly TimeRangeHistogramSeries[]>(() => [
    { dataKey: "success", label: t("success"), color: "var(--brand)", inactiveColor: "var(--surface-raised)" },
    { dataKey: "warning", label: t("warning"), color: "var(--warning-border)", inactiveColor: "var(--surface-base)" },
    { dataKey: "error", label: t("error"), color: "var(--danger-border)", inactiveColor: "var(--surface-raised)" },
  ], [t]);
  const [range, setRange] = useState<TimeRangeHistogramRange>({
    start: demoStart + 36 * HOUR_IN_MS,
    end: demoStart + 48 * HOUR_IN_MS,
  });
  const formatRange = (value: TimeRangeHistogramRange) => `${dateFormatter.format(value.start)} – ${dateFormatter.format(value.end)}`;
  const localizedProps = props.map((prop, index) => ({ ...prop, description: t(`p${index}`) }));

  return (
    <DocPage title="TimeRangeHistogram" slug="time-range-histogram" description={t("description")}>
      <DocSection title={t("interactiveRange")}>
        <ComponentPreview code={basicCode} minHeightClass="min-h-0" padding="none">
          <div className="w-full overflow-hidden rounded-xl border border-border bg-surface-floating">
            <div className="flex flex-col gap-2 border-b border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-body font-medium text-fg-default">{t("requestVolume")}</h3>
                <p className="mt-0.5 text-label text-fg-muted">{formatRange(range)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-label text-fg-muted">
                {series.map((item) => (
                  <span className="flex items-center gap-1.5" key={item.dataKey}>
                    <span aria-hidden className="size-2 rounded-[2px]" style={{ background: item.color }} />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-3">
              <TimeRangeHistogram
                ariaLabel={t("ariaLabel")}
                data={data}
                formatRange={formatRange}
                formatValue={(value) => t("requests", { count: value })}
                instruction={t("instruction")}
                onValueChange={setRange}
                rangeEndLabel={dateFormatter.format(data.at(-1)?.end ?? demoStart)}
                rangeStartLabel={dateFormatter.format(data[0]?.start ?? demoStart)}
                series={series}
                value={range}
              />
            </div>
          </div>
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("behavior")}>
        <div className="max-w-3xl space-y-2 text-body leading-6 text-fg-muted">
          <p>{t("behaviorPointer")}</p>
          <p>{t("behaviorKeyboard")}</p>
          <p>{t("behaviorData")}</p>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={localizedProps} />
      </DocSection>
    </DocPage>
  );
}
