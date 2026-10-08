"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  StatusOverview,
  type NodeStatusItem,
  type StatusTimelineItem,
} from "@zeron/ui/status-overview";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { InstallCommand } from "@docs/components/content/InstallCommand";
import { StatusBarChartBasicDemo, statusBarChartBasicCode, useStatusBarChartDemoTimeline } from "@docs/components/charts/status-bar-chart-basic-demo";

const HOUR = 60 * 60 * 1000;
const timelineStart = Date.UTC(2026, 7, 24, 15, 0, 0);

const timelineItems: readonly StatusTimelineItem[] = Array.from({ length: 72 }, (_, index) => ({
  id: `hour-${index}`,
  status: index === 18 || index === 47 ? "degraded" : index === 48 ? "empty" : "operational",
  ariaLabel: `Hour ${index + 1}: ${index === 18 || index === 47 ? "degraded" : index === 48 ? "no sample" : "operational"}`,
}));

const denseNodeItems: readonly NodeStatusItem[] = Array.from({ length: 200 }, (_, index) => ({
  id: `node-${index + 1}`,
  status: index % 29 === 0 ? "down" : index % 13 === 0 ? "degraded" : "operational",
  ariaLabel: `Node ${index + 1}: ${index % 29 === 0 ? "down" : index % 13 === 0 ? "degraded" : "operational"}`,
}));
const denseOperationalCount = denseNodeItems.filter((item) => item.status === "operational").length;

const basicCode = `"use client";

import { StatusOverview, type StatusTimelineItem } from "@/components/ui/status-overview";

const hour = 60 * 60 * 1000;
const start = Date.UTC(2026, 7, 24, 15);
const hourlyItems: StatusTimelineItem[] = Array.from({ length: 72 }, (_, index) => ({
  id: "hour-" + index,
  status: index === 18 || index === 47 ? "degraded" : index === 48 ? "empty" : "operational",
  ariaLabel: "Hour " + (index + 1) + ": " + (index === 18 || index === 47 ? "degraded" : index === 48 ? "no sample" : "operational"),
}));
const end = start + hourlyItems.length * hour;

export default function Example() {
  return (
<StatusOverview
  ariaLabel="API availability over the last three days"
  label="Availability over the last 3 days"
  rangeLabel="Aug 24, 3 PM – Aug 27, 3 PM"
  summary={{ label: "Availability", value: "99.91%", status: "operational" }}
  emptyContent="No availability data"
  content={{
    type: "timeline",
    start,
    end,
    items: hourlyItems,
    markers: [
      { at: start, label: "Mon" },
      { at: start + 24 * hour, label: "Tue" },
      { at: start + 48 * hour, label: "Wed" },
      { at: end, label: "Now" },
    ],
  }}
/>
  );
}`;

const activityCode = `"use client";

import { StatusOverview, type StatusTimelineItem } from "@/components/ui/status-overview";

const start = Date.UTC(2026, 7, 24, 15);
const items: StatusTimelineItem[] = Array.from({ length: 60 }, (_, index) => {
  const status = index === 23 ? "down" : index === 38 ? "degraded" : index === 51 ? "unknown" : index % 4 === 0 ? "operational" : "empty";
  return { id: "minute-" + index, status, ariaLabel: "Minute " + (index + 1) + ": " + status };
});

export default function Example() {
  return <StatusOverview variant="activity" className="w-full" label="Gateway" summary={{ label: "Requests", value: "148" }} ariaLabel="Gateway service activity" emptyContent="No activity data" content={{ type: "timeline", start, end: start + 60 * 60 * 1000, items }} />;
}`;

const denseNodesCode = `"use client";

import { StatusOverview, type NodeStatusItem } from "@/components/ui/status-overview";

const items: NodeStatusItem[] = Array.from({ length: 200 }, (_, index) => {
  const status = index % 29 === 0 ? "down" : index % 13 === 0 ? "degraded" : "operational";
  return { id: "node-" + (index + 1), status, ariaLabel: "Node " + (index + 1) + ": " + status };
});
const operational = items.filter(item => item.status === "operational").length;

export default function Example() {
  return <StatusOverview className="w-full" label="Node status" ariaLabel="Two hundred current nodes" emptyContent="No status data" summary={{ label: "Operational", value: operational + " / " + items.length, status: "degraded" }} content={{ type: "nodes", items, footer: items.length + " nodes" }} />;
}`;

const props: PropDef[] = [
  { name: "ariaLabel", type: "string", description: "" },
  { name: "label", type: "ReactNode", description: "" },
  { name: "rangeLabel", type: "ReactNode", description: "" },
  { name: "summary", type: "StatusOverviewSummary", description: "" },
  { name: "content", type: "StatusOverviewContent", description: "" },
  { name: "emptyContent", type: "ReactNode", description: "" },
  { name: "state", type: '"ready" | "loading" | "stale" | "unavailable" | "error"', default: '"ready"', description: "" },
  { name: "statusMessage", type: "ReactNode", description: "" },
  { name: "variant", type: '"card" | "activity" | "chart"', default: '"card"', description: "" },
  { name: "trailing", type: "ReactNode", description: "" },
  { name: "chartColors", type: "StatusOverviewChartColors", description: "" },
];

export default function StatusBarChartDoc() {
  const t = useTranslations("statusOverview");
  const common = useTranslations("common");
  const stateTimeline = useStatusBarChartDemoTimeline("API");
  const localizedProps = useMemo(() => props.map((prop, index) => ({ ...prop, description: t(`p${index}`) })), [t]);
  const end = timelineStart + timelineItems.length * HOUR;

  return (
    <DocPage title="StatusBarChart" slug="status-overview" description={t("description")} showInstall={false}>
      <DocSection title={common("installation")}>
        <InstallCommand value="npx zeron-ui add status-overview button" />
        <p className="text-label text-fg-muted">{t("actionsInstallation")}</p>
      </DocSection>
      <p className="text-label text-fg-muted">{t("implementation")}</p>
      <DocSection title={t("basic")}>
        <ComponentPreview coverSource code={statusBarChartBasicCode} minHeightClass="min-h-0">
          <StatusBarChartBasicDemo />
        </ComponentPreview>
        <p className="text-label text-fg-muted">{t("basicBody")}</p>
      </DocSection>
      <DocSection title={t("timeline")}>
        <ComponentPreview code={basicCode} minHeightClass="min-h-0">
          <StatusOverview
            ariaLabel={t("timelineAria")}
            className="w-full"
            content={{
              type: "timeline",
              start: timelineStart,
              end,
              items: timelineItems,
              markers: [
                { at: timelineStart, label: t("monday") },
                { at: timelineStart + 24 * HOUR, label: t("tuesday") },
                { at: timelineStart + 48 * HOUR, label: t("wednesday") },
                { at: end, label: t("now") },
              ],
            }}
            emptyContent={t("empty")}
            label={t("availability")}
            rangeLabel={t("range")}
            summary={{ label: t("availability"), value: "99.91%", status: "operational" }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("activity")}>
        <ComponentPreview code={activityCode} minHeightClass="min-h-0">
          <StatusOverview variant="activity" className="w-full" label="Gateway" ariaLabel={t("activityAria")} emptyContent={t("empty")}
            summary={{ label: t("requests"), value: "148" }}
            content={{ type: "timeline", start: timelineStart, end: timelineStart + 60 * 60 * 1000,
              items: Array.from({ length: 60 }, (_, index) => ({ id: `minute-${index}`, status: index === 23 ? "down" : index === 38 ? "degraded" : index === 51 ? "unknown" : index % 4 === 0 ? "operational" : "empty", ariaLabel: t("activityItem", { minute: index + 1, status: t(index === 23 ? "failed" : index === 38 ? "warning" : index === 51 ? "unknown" : index % 4 === 0 ? "operational" : "idle") }) })) }} />
        </ComponentPreview>
        <p className="text-body text-fg-muted">{t("activityBody")}</p>
      </DocSection>

      <DocSection title={t("states")}>
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="text-label font-medium text-fg-muted">{t("loadingState")}</p>
            <StatusOverview variant="chart" ariaLabel={t("loadingAria")} className="w-full" content={stateTimeline} emptyContent={t("empty")} label="API" state="loading" summary={{ label: t("currentStatus"), value: t("operational") }} />
          </div>
          <div className="space-y-4">
            <p className="text-label font-medium text-fg-muted">{t("staleState")}</p>
            <StatusOverview variant="chart" ariaLabel={t("staleAria")} className="w-full" content={stateTimeline} emptyContent={t("empty")} label="API" state="stale" statusMessage={t("staleMessage")} summary={{ label: t("currentStatus"), value: t("operational") }} />
          </div>
          <div className="space-y-4">
            <p className="text-label font-medium text-fg-muted">{t("emptyState")}</p>
            <StatusOverview variant="chart" ariaLabel={t("emptyAria")} className="w-full" content={{ ...stateTimeline, items: [] }} emptyContent={t("empty")} label="API" />
          </div>
          <div className="space-y-4">
            <p className="text-label font-medium text-fg-muted">{t("errorState")}</p>
            <StatusOverview variant="chart" ariaLabel={t("errorAria")} className="w-full" content={stateTimeline} emptyContent={t("empty")} label="API" state="error" statusMessage={t("errorMessage")} />
          </div>
        </div>
      </DocSection>

      <DocSection title={t("denseNodes")}>
        <ComponentPreview code={denseNodesCode} minHeightClass="min-h-0">
          <StatusOverview
            ariaLabel={t("denseAria")}
            className="w-full"
            content={{ type: "nodes", items: denseNodeItems, footer: t("nodeCount", { count: 200 }) }}
            emptyContent={t("empty")}
            label={t("nodeStatus")}
            summary={{ label: t("operational"), value: `${denseOperationalCount} / ${denseNodeItems.length}`, status: "degraded" }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("dataBoundary")}>
        <div className="max-w-3xl space-y-2 text-body text-fg-muted">
          <p>{t("chartMeaning")}</p>
          <p>{t("dataBoundaryBody")}</p>
          <p>{t("keyboard")}</p>
        </div>
      </DocSection>

      <DocSection title={t("apiReference")}>
        <PropsTable props={localizedProps} />
      </DocSection>
    </DocPage>
  );
}
