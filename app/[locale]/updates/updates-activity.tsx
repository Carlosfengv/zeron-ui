"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Container, ContainerBody } from "@zeron/ui/container";
import { TooltipBox } from "@zeron/ui/chart-core";
import { HeatmapChart, HeatmapCells, HeatmapLegend, useHeatmap, useHeatmapInteraction } from "@zeron/ui/heatmap-chart";
import type { AppLocale } from "@/app/_i18n/routing";
import { activityDateKey, formatActivityDate, type buildCommitActivity } from "@docs/lib/commit-activity";
import { updatesCopy as copy } from "./updates-copy";

type Activity = ReturnType<typeof buildCommitActivity>;

// Localized calendar labels compose the public heatmap geometry. Commit
// timestamps remain untouched; only these calendar-bin dates use UTC.
function ActivityAxes({ locale, year }: { locale: AppLocale; year: string }) {
  const { data, xScale, yScale, binHeight, gap, width, margin } = useHeatmap();
  const month = new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "short" });
  const weekday = new Intl.DateTimeFormat(locale, { timeZone: "UTC", weekday: "short" });
  let lastMonth = "";
  let lastX = -Infinity;
  return <g className="fill-current text-label text-fg-subtle" pointerEvents="none">
    {data.map((column, index) => {
      const bin = column.bins.find(bin => activityDateKey(bin.date) >= `${year}-01-01` && activityDateKey(bin.date) <= `${year}-12-31`);
      if (!bin) return null;
      const key = activityDateKey(bin.date).slice(0, 7);
      if (key === lastMonth) return null;
      lastMonth = key;
      const x = xScale(index);
      if (x - lastX < 36 || x + margin.left + 32 > width) return null;
      lastX = x;
      return <text key={key} x={x} y={-10}>{month.format(bin.date)}</text>;
    })}
    {[1, 3, 5].map(row => {
      const date = data[0]?.bins[row]?.date;
      return date ? <text dominantBaseline="middle" key={row} textAnchor="end" x={-8} y={yScale(row) + (binHeight - gap) / 2}>{weekday.format(date)}</text> : null;
    })}
  </g>;
}

function ActivitySelection({ date }: { date: string | null }) {
  const { data, xScale, yScale, binWidth, binHeight, gap } = useHeatmap();
  if (!date) return null;
  return <g pointerEvents="none">
    {data.flatMap((column, x) => column.bins.map((bin, y) => activityDateKey(bin.date) === date ?
      <rect data-slot="updates-activity-selection" fill="none" height={binHeight - gap} key={date} rx={2} stroke="var(--fg-default)" strokeWidth={2} width={binWidth - gap} x={xScale(x)} y={yScale(y)} /> : null))}
  </g>;
}

function ActivityTooltip({ locale, scrollRef, frameRef, viewport }: {
  locale: AppLocale;
  scrollRef: RefObject<HTMLDivElement | null>;
  frameRef: RefObject<HTMLDivElement | null>;
  viewport: { width: number; scrollLeft: number };
}) {
  const { width, height } = useHeatmap();
  const { tooltipData } = useHeatmapInteraction();
  const x = tooltipData?.x;
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || x === undefined) return;
    if (x < scroll.scrollLeft + 40) scroll.scrollLeft = Math.max(0, x - 40);
    else if (x > scroll.scrollLeft + scroll.clientWidth - 16) scroll.scrollLeft = x - scroll.clientWidth + 16;
  }, [scrollRef, x]);
  if (!tooltipData) return null;
  const text = copy[locale === "en" ? "en" : "zh"];
  return <TooltipBox animate={false} containerHeight={height} containerRef={frameRef} containerWidth={viewport.width || width} visible x={tooltipData.x - viewport.scrollLeft} y={tooltipData.y}>
    <div className="space-y-1 px-3 py-2.5 text-label">
      <p className="font-medium text-fg-default">{formatActivityDate(activityDateKey(tooltipData.date), locale)}</p>
      <p className="text-fg-muted">{text.activityCommits.replace("{count}", String(tooltipData.count))}</p>
    </div>
  </TooltipBox>;
}

export function UpdatesActivity({ activity, complete, locale, selectedDate, onSelectDate }: {
  activity: Activity;
  complete: boolean;
  locale: AppLocale;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}) {
  const text = copy[locale === "en" ? "en" : "zh"];
  const scrollRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 0, scrollLeft: 0 });
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll || !complete) return;
    const column = activity.columns.findIndex(column => column.bins.some(bin => activityDateKey(bin.date) === activity.through));
    const measureViewport = () => setViewport(previous => previous.width === scroll.clientWidth && previous.scrollLeft === scroll.scrollLeft ? previous : { width: scroll.clientWidth, scrollLeft: scroll.scrollLeft });
    const positionCalendar = () => {
      if (scroll.scrollWidth <= scroll.clientWidth) return;
      const cellWidth = (scroll.scrollWidth - 36) / activity.columns.length;
      scroll.scrollLeft = Math.max(0, 36 + (column + 2) * cellWidth - scroll.clientWidth);
    };
    positionCalendar();
    measureViewport();
    const observer = new ResizeObserver(() => { positionCalendar(); measureViewport(); });
    observer.observe(scroll);
    scroll.addEventListener("scroll", measureViewport, { passive: true });
    return () => { observer.disconnect(); scroll.removeEventListener("scroll", measureViewport); };
  }, [activity.columns, activity.through, complete]);
  return <Container className="mt-6" data-slot="updates-activity">
    <ContainerBody className="overflow-visible p-5">
      <figure aria-labelledby="updates-activity-title" className="min-w-0 space-y-5">
        <figcaption className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h2 className="text-title font-semibold text-fg-default" id="updates-activity-title">{text.activity} <span className="text-fg-subtle">{activity.year}</span></h2>
          {complete && <p className="flex flex-wrap gap-x-4 gap-y-1 text-label text-fg-muted">
            <span>{text.activityCommits.replace("{count}", String(activity.total))}</span>
            <span>{text.activityDays.replace("{count}", String(activity.activeDays))}</span>
          </p>}
          {!complete && <p className="w-full text-label text-fg-muted">{text.activityUnavailable}</p>}
        </figcaption>
        {complete && <div className="w-full min-w-0 space-y-3">
          <div className="relative" ref={frameRef}><div className="overflow-x-auto" ref={scrollRef}><div className="min-w-[720px]">
          <HeatmapChart animate={false} data={activity.columns} margin={{ left: 36, right: 0 }} onCellSelect={bin => onSelectDate(activityDateKey(bin.date))}>
            <HeatmapCells hideGhostCells={false} inactiveOpacity={1} />
            <ActivityAxes locale={locale} year={activity.year} />
            <ActivitySelection date={selectedDate} />
            <ActivityTooltip frameRef={frameRef} locale={locale} scrollRef={scrollRef} viewport={viewport} />
          </HeatmapChart>
          </div></div></div>
          <HeatmapLegend interactive={false} lessLabel={text.less} moreLabel={text.more} />
        </div>}
      </figure>
    </ContainerBody>
  </Container>;
}
