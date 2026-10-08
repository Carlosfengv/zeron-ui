"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@zeron/ui/button";
import { StatusOverview, type StatusTimelineItem } from "@zeron/ui/status-overview";

const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 7, 21);
const DAYS = 48;
const services = ["API", "Website"] as const;
const legendClasses = { operational: "bg-chart-1", degraded: "bg-chart-2", outage: "bg-chart-3" } as const;

export function useStatusBarChartDemoTimeline(service: typeof services[number], incident = false) {
  const locale = useLocale();
  const t = useTranslations("statusOverview");
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone: "UTC" });
  const items: StatusTimelineItem[] = Array.from({ length: DAYS }, (_, index) => {
    const simulated = service === "API" && incident && index >= DAYS - 3;
    const status = simulated ? index === DAYS - 2 ? "down" : "degraded" : service === "API" && index === 8 ? "degraded" : "operational";
    const period = date.format(START + index * DAY);
    const statusLabel = t(status === "down" ? "outage" : status);
    const details = simulated ? t("incidentDetails", { date: period }) : t(status === "degraded" ? "degradedDetails" : "operationalDetails");
    return { id: `${service}-${index}`, status, ariaLabel: `${service} · ${period} · ${statusLabel} · ${details}`, tooltip: <div className="space-y-1"><p className="text-fg-muted">{period}</p><p className="flex items-center gap-2"><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${legendClasses[status === "down" ? "outage" : status]}`} />{statusLabel}</p><p className="text-fg-muted">{details}</p></div> };
  });
  return { type: "timeline" as const, start: START, end: START + DAYS * DAY, items, footer: <div className="flex justify-between gap-3"><span>{date.format(START)}</span><span>{date.format(START + (DAYS - 1) * DAY)}</span></div> };
}

export function StatusBarChartBasicDemo() {
  const t = useTranslations("statusOverview");
  const [incident, setIncident] = useState(false);
  const [replay, setReplay] = useState(0);
  const apiTimeline = useStatusBarChartDemoTimeline("API", incident);
  const websiteTimeline = useStatusBarChartDemoTimeline("Website");

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body text-fg-muted">{t("historyDays", { count: DAYS })}</p>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => setReplay((value) => value + 1)}>{t("replay")}</Button>
          <Button variant="ghost" size="sm" aria-pressed={incident} onClick={() => setIncident((value) => !value)}>{t(incident ? "resolveIncident" : "simulateIncident")}</Button>
        </div>
      </div>
      {services.map((service, serviceIndex) => (
          <div key={service} className={serviceIndex ? "border-t-hairline border-border-subtle pt-6" : undefined}>
            <StatusOverview
              key={`${service}-${replay}`}
              variant="chart"
              label={service}
              ariaLabel={t("historyAria", { service, count: DAYS })}
              summary={{ label: t("currentStatus"), value: t(service === "API" && incident ? "degraded" : "operational") }}
              emptyContent={t("empty")}
              content={service === "API" ? apiTimeline : websiteTimeline}
            />
          </div>
      ))}
      <ul aria-label={t("statusLegend")} className="flex flex-wrap gap-x-5 gap-y-2 text-body text-fg-muted">
        {(["operational", "degraded", "outage"] as const).map((status) => <li key={status} className="flex items-center gap-2"><span aria-hidden className={`h-3 w-1.5 rounded-full ${legendClasses[status]}`} />{t(status)}</li>)}
      </ul>
      <span role="status" className="sr-only">{incident ? t("incidentAnnouncement") : ""}</span>
    </div>
  );
}

export const statusBarChartBasicCode = `"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StatusOverview, type StatusTimelineItem } from "@/components/ui/status-overview";

const day = 86400000;
const start = Date.UTC(2026, 7, 21);
const days = 48;
const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" });
const legend = [
  { label: "Operational", color: "bg-chart-1" },
  { label: "Degraded", color: "bg-chart-2" },
  { label: "Outage", color: "bg-chart-3" },
];

export default function Example() {
  const [incident, setIncident] = useState(false);
  const [replay, setReplay] = useState(0);
  return <div className="w-full min-w-0 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-body text-fg-muted">48 days of status</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => setReplay(value => value + 1)}>Replay</Button>
        <Button variant="ghost" size="sm" aria-pressed={incident} onClick={() => setIncident(value => !value)}>{incident ? "Resolve incident" : "Simulate incident"}</Button>
      </div>
    </div>
    {(["API", "Website"] as const).map((service, serviceIndex) => {
      const items: StatusTimelineItem[] = Array.from({ length: days }, (_, index) => {
        const simulated = service === "API" && incident && index >= days - 3;
        const status = simulated ? index === days - 2 ? "down" : "degraded" : service === "API" && index === 8 ? "degraded" : "operational";
        const period = date.format(start + index * day);
        const label = status === "down" ? "Outage" : status === "degraded" ? "Degraded" : "Operational";
        const details = simulated ? "Simulated incident on " + period + "." : status === "degraded" ? "Elevated response times for 12 minutes." : "All checks passed.";
        const color = status === "down" ? "bg-chart-3" : status === "degraded" ? "bg-chart-2" : "bg-chart-1";
        return { id: service + "-" + index, status, ariaLabel: service + " · " + period + " · " + label + " · " + details, tooltip: <div className="space-y-1"><p className="text-fg-muted">{period}</p><p className="flex items-center gap-2"><span aria-hidden className={"h-1.5 w-1.5 rounded-full " + color} />{label}</p><p className="text-fg-muted">{details}</p></div> };
      });
      return <div key={service} className={serviceIndex ? "border-t-hairline border-border-subtle pt-6" : undefined}>
        <StatusOverview key={service + "-" + replay} variant="chart" label={service} ariaLabel={service + " status over 48 days"} summary={{ label: "Current status", value: service === "API" && incident ? "Degraded" : "Operational" }} emptyContent="No status data" content={{ type: "timeline", start, end: start + days * day, items, footer: <div className="flex justify-between gap-3"><span>{date.format(start)}</span><span>{date.format(start + (days - 1) * day)}</span></div> }} />
      </div>;
    })}
    <ul aria-label="Status legend" className="flex flex-wrap gap-x-5 gap-y-2 text-body text-fg-muted">
      {legend.map(item => <li key={item.label} className="flex items-center gap-2"><span aria-hidden className={"h-3 w-1.5 rounded-full " + item.color} />{item.label}</li>)}
    </ul>
    <span role="status" className="sr-only">{incident ? "Simulated API incident from Oct 5 to Oct 7." : ""}</span>
  </div>;
}`;
