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

const HOUR = 60 * 60 * 1000;
const timelineStart = Date.UTC(2026, 7, 24, 15, 0, 0);

const timelineItems: readonly StatusTimelineItem[] = Array.from({ length: 72 }, (_, index) => ({
  id: `hour-${index}`,
  status: index === 18 || index === 47 ? "degraded" : index === 48 ? "empty" : "operational",
  ariaLabel: `Hour ${index + 1}: ${index === 18 || index === 47 ? "degraded" : index === 48 ? "no sample" : "operational"}`,
}));

const nodeItems: readonly NodeStatusItem[] = [
  { id: "us-east-1", status: "operational", ariaLabel: "US East, operational, 24 ms", tooltip: "US East · 24 ms" },
  { id: "us-west-1", status: "operational", ariaLabel: "US West, operational, 31 ms", tooltip: "US West · 31 ms" },
  { id: "eu-west-1", status: "degraded", ariaLabel: "EU West, degraded, 142 ms", tooltip: "EU West · 142 ms" },
  { id: "ap-south-1", status: "maintenance", ariaLabel: "AP South, in maintenance", tooltip: "AP South · maintenance" },
  { id: "sa-east-1", status: "down", ariaLabel: "SA East, unavailable", tooltip: "SA East · unavailable" },
  { id: "ca-central-1", status: "unknown", ariaLabel: "Canada Central, status unknown", tooltip: "Canada Central · status unknown" },
];

const denseNodeItems: readonly NodeStatusItem[] = Array.from({ length: 200 }, (_, index) => ({
  id: `node-${index + 1}`,
  status: index % 29 === 0 ? "down" : index % 13 === 0 ? "degraded" : "operational",
  ariaLabel: `Node ${index + 1}: ${index % 29 === 0 ? "down" : index % 13 === 0 ? "degraded" : "operational"}`,
}));

const basicCode = `import { StatusOverview } from "@zeron/ui/status-overview";

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
      { at: end, label: "Now" },
    ],
  }}
/>`;

const nodesCode = `<StatusOverview
  ariaLabel="Current global node status"
  label="Node status"
  summary={{ label: "Operational", value: "26 / 28", status: "degraded" }}
  emptyContent="No nodes"
  content={{ type: "nodes", items: nodes, footer: "28 nodes" }}
/>`;

const props: PropDef[] = [
  { name: "ariaLabel", type: "string", description: "" },
  { name: "label", type: "ReactNode", description: "" },
  { name: "rangeLabel", type: "ReactNode", description: "" },
  { name: "summary", type: "StatusOverviewSummary", description: "" },
  { name: "content", type: "StatusOverviewContent", description: "" },
  { name: "emptyContent", type: "ReactNode", description: "" },
  { name: "state", type: '"ready" | "loading" | "stale" | "unavailable" | "error"', default: '"ready"', description: "" },
  { name: "statusMessage", type: "ReactNode", description: "" },
];

export default function StatusOverviewDoc() {
  const t = useTranslations("statusOverview");
  const localizedProps = useMemo(() => props.map((prop, index) => ({ ...prop, description: t(`p${index}`) })), [t]);
  const end = timelineStart + timelineItems.length * HOUR;

  return (
    <DocPage title="StatusOverview" slug="status-overview" description={t("description")}>
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

      <DocSection title={t("nodes")}>
        <ComponentPreview code={nodesCode} minHeightClass="min-h-0">
          <StatusOverview
            ariaLabel={t("nodesAria")}
            className="w-full"
            content={{ type: "nodes", items: nodeItems, footer: t("nodeCount", { count: 6 }) }}
            emptyContent={t("empty")}
            label={t("nodeStatus")}
            summary={{ label: t("operational"), value: "4 / 6", status: "degraded" }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("states")}>
        <div className="grid gap-3 lg:grid-cols-2">
          <StatusOverview ariaLabel={t("loadingAria")} className="w-full" content={{ type: "nodes", items: nodeItems }} emptyContent={t("empty")} label={t("nodeStatus")} state="loading" summary={{ label: t("operational"), value: "4 / 6", status: "operational" }} />
          <StatusOverview ariaLabel={t("staleAria")} className="w-full" content={{ type: "nodes", items: nodeItems }} emptyContent={t("empty")} label={t("nodeStatus")} state="stale" statusMessage={t("staleMessage")} summary={{ label: t("operational"), value: "4 / 6", status: "degraded" }} />
          <StatusOverview ariaLabel={t("emptyAria")} className="w-full" content={{ type: "nodes", items: [] }} emptyContent={t("empty")} label={t("nodeStatus")} />
          <StatusOverview ariaLabel={t("errorAria")} className="w-full" content={{ type: "nodes", items: nodeItems }} emptyContent={t("empty")} label={t("nodeStatus")} state="error" statusMessage={t("errorMessage")} />
        </div>
      </DocSection>

      <DocSection title={t("denseNodes")}>
        <ComponentPreview code={`<StatusOverview content={{ type: "nodes", items: twoHundredNodes }} ... />`} minHeightClass="min-h-0">
          <StatusOverview
            ariaLabel={t("denseAria")}
            className="w-full"
            content={{ type: "nodes", items: denseNodeItems, footer: t("nodeCount", { count: 200 }) }}
            emptyContent={t("empty")}
            label={t("nodeStatus")}
            summary={{ label: t("operational"), value: "179 / 200", status: "degraded" }}
          />
        </ComponentPreview>
      </DocSection>

      <DocSection title={t("dataBoundary")}>
        <div className="max-w-3xl space-y-2 text-body leading-6 text-fg-muted">
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
