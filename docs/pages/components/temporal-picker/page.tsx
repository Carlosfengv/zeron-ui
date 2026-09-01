"use client";

import * as React from "react";
import {
  DatePicker,
  DateRangePicker,
  TimePicker,
  TimeRangePicker,
  assertISODate,
  assertISOTime,
  type DateRangeValue,
  type ISODateString,
  type ISOTimeString,
  type TimeRangeValue,
} from "@zeron/ui/temporal-picker";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

const timeCode = `import { useState } from "react";
import { TimePicker, TimeRangePicker } from "@zeron/ui/temporal-picker";

function Example() {
  const [single, setSingle] = useState();
  const [range, setRange] = useState();

  return (
    <>
      <TimePicker
        value={single}
        onValueChange={setSingle}
        formatValue={(value) => value.slice(0, 5)}
      />
      <TimeRangePicker
        value={range}
        onValueChange={setRange}
        formatValue={({ from, to }) => \`\${from} → \${to}\`}
      />
    </>
  );
}`;

const dateCode = `import { DatePicker, DateRangePicker } from "@zeron/ui/temporal-picker";

<DatePicker
  value={single}
  onValueChange={setSingle}
  formatValue={(value) => value.replaceAll("-", "/")}
/>
<DateRangePicker
  commitMode="apply"
  value={range}
  onValueChange={setRange}
  formatValue={({ from, to }) =>
    \`\${from.replaceAll("-", "/")} → \${to.replaceAll("-", "/")}\`
  }
/>`;

const formatValueCode = `import { DatePicker, TimePicker } from "@zeron/ui/temporal-picker";

<DatePicker
  value={date}
  onValueChange={setDate}
  formatValue={(value) => value.replaceAll("-", "/")}
/>

<TimePicker
  value={time}
  onValueChange={setTime}
  formatValue={(value) => value.slice(0, 5).replace(":", "h")}
/>`;

const pickerProps: PropDef[] = [
  { name: "value", type: "ISO value | range", description: "Controlled committed value. Date and time pickers expose branded ISO strings; range pickers expose { from, to }." },
  { name: "defaultValue", type: "ISO value | range", description: "Initial committed value for uncontrolled use." },
  { name: "onValueChange", type: "(value, context) => void", description: "Called only when a value is committed. Context identifies calendar, time-field, preset, Apply, or Clear." },
  { name: "commitMode", type: '"complete" | "apply"', default: '"complete" for single values', description: "Complete commits a valid selection immediately; Apply retains a local draft until confirmation." },
  { name: "presentation", type: '"auto" | "popover" | "drawer" | "inline"', default: '"auto"', description: "Auto uses a popover on larger pointer devices and a drawer on touch or narrow screens." },
  { name: "presets", type: "TemporalPreset[]", description: "Named values resolved once on activation. A preset may be drafted or committed independently of closeOnCommit." },
  { name: "locale", type: "BCP 47 string", default: '"en-US"', description: "Controls displayed date and time formatting plus the calendar language tag." },
  { name: "now", type: "() => Date", description: "Injects the reference instant used when resolving relative presets." },
  { name: "disabled / readOnly", type: "boolean", default: "false", description: "Disabled blocks interaction; read-only renders the committed summary without an editable trigger." },
  { name: "formatValue", type: "(value, timeZone?) => ReactNode", description: "Formats only the committed value shown by the trigger or read-only summary. It does not change the emitted ISO value." },
];

function ValuePreview({ value }: { value: unknown }) {
  return (
    <code className="block min-h-8 overflow-x-auto border-t border-border-subtle pt-2 text-label text-fg-muted">
      {value === undefined ? "—" : JSON.stringify(value)}
    </code>
  );
}

function PickerCase({
  children,
  description,
  label,
  value,
}: {
  children: React.ReactNode;
  description: string;
  label: string;
  value: unknown;
}) {
  return (
    <section className="grid min-w-0 content-start gap-3">
      <div className="space-y-1">
        <h3 className="text-body font-semibold text-fg-default">{label}</h3>
        <p className="text-label leading-5 text-fg-muted">{description}</p>
      </div>
      <div className="flex min-h-9 items-start">{children}</div>
      <ValuePreview value={value} />
    </section>
  );
}

function DemoPair({ children }: { children: React.ReactNode }) {
  return <div className="grid w-full gap-6 lg:grid-cols-2 lg:divide-x lg:divide-border-subtle lg:[&>*:nth-child(2)]:pl-6">{children}</div>;
}

function TimeSelectionDemo() {
  const t = useTranslations("temporalPicker");
  const [single, setSingle] = React.useState<ISOTimeString>();
  const [range, setRange] = React.useState<TimeRangeValue>();

  return (
    <DemoPair>
      <PickerCase description={t("singleTimeHint")} label={t("single")} value={single}>
        <TimePicker aria-label={t("chooseTime")} formatValue={(value) => value.slice(0, 5)} onValueChange={setSingle} value={single} />
      </PickerCase>
      <PickerCase description={t("rangeTimeHint")} label={t("range")} value={range}>
        <TimeRangePicker aria-label={t("chooseTimeRange")} commitMode="apply" formatValue={({ from, to }) => `${from} → ${to}`} onValueChange={setRange} value={range} />
      </PickerCase>
    </DemoPair>
  );
}

function DateSelectionDemo() {
  const t = useTranslations("temporalPicker");
  const [single, setSingle] = React.useState<ISODateString>();
  const [range, setRange] = React.useState<DateRangeValue>();
  const todayPreset = React.useMemo(() => ({
    id: "today",
    label: t("today"),
    resolve: ({ now }: { now: Date }) => assertISODate(now.toISOString().slice(0, 10)),
  }), [t]);

  return (
    <DemoPair>
      <PickerCase description={t("singleDateHint")} label={t("single")} value={single}>
        <DatePicker aria-label={t("chooseDate")} formatValue={(value) => value.replaceAll("-", "/")} onValueChange={setSingle} presets={[todayPreset]} value={single} />
      </PickerCase>
      <PickerCase description={t("rangeDateHint")} label={t("range")} value={range}>
        <DateRangePicker aria-label={t("chooseDateRange")} commitMode="apply" formatValue={({ from, to }) => `${from.replaceAll("-", "/")} → ${to.replaceAll("-", "/")}`} onValueChange={setRange} value={range} />
      </PickerCase>
    </DemoPair>
  );
}

function FormatValueDemo() {
  const t = useTranslations("temporalPicker");
  const [date, setDate] = React.useState<ISODateString | undefined>(() => assertISODate("2026-09-10"));
  const [time, setTime] = React.useState<ISOTimeString | undefined>(() => assertISOTime("16:30"));

  return (
    <DemoPair>
      <PickerCase description={t("customDateFormatHint")} label={t("dateFormat")} value={date}>
        <DatePicker formatValue={(value) => value.replaceAll("-", "/")} onValueChange={setDate} value={date} />
      </PickerCase>
      <PickerCase description={t("customTimeFormatHint")} label={t("timeFormat")} value={time}>
        <TimePicker formatValue={(value) => value.slice(0, 5).replace(":", "h")} onValueChange={setTime} value={time} />
      </PickerCase>
    </DemoPair>
  );
}

export default function TemporalPickerDoc() {
  const t = useTranslations("temporalPicker");
  const localizedProps = pickerProps.map((prop, index) => ({ ...prop, description: t(`p${index}`) }));

  return (
    <DocPage description={t("description")} slug="temporal-picker" title="Temporal Picker">
      <DocSection title={t("timeSelection")}>
        <ComponentPreview align="top" code={timeCode} minHeightClass="min-h-[12rem]" padding="compact">
          <TimeSelectionDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("dateSelection")}>
        <ComponentPreview align="top" code={dateCode} minHeightClass="min-h-[12rem]" padding="compact">
          <DateSelectionDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("customTriggerFormat")}>
        <ComponentPreview align="top" code={formatValueCode} minHeightClass="min-h-[12rem]" padding="compact">
          <FormatValueDemo />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("commitment")}>
        <div className="max-w-3xl space-y-2 text-body leading-6 text-fg-muted">
          <p>{t("commitmentBody")}</p>
          <p>{t("timeZoneBody")}</p>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={localizedProps} />
      </DocSection>
    </DocPage>
  );
}
