"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import type { GroupedDataTableDemoItem } from "@zeron/blocks/grouped-data-table-01";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DonutSummary } from "@zeron/ui/chart";
import { DataTableColumnHeader } from "@zeron/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemLeading, InfoItemTitle } from "@zeron/ui/info-item";
import { useIcon } from "@zeron/ui/system/icon-context";

export const cloudResourceKinds = ["inference", "training", "gpu", "compute", "storage"] as const;
export const cloudResourceStatuses = ["running", "pending", "scaling", "maintenance", "stopped"] as const;
type Translate = (key: string, values?: Record<string, string | number>) => string;
const statusTones: Record<GroupedDataTableDemoItem["status"], BadgeStatus> = {
  running: "success", pending: "neutral", scaling: "info", maintenance: "warning", stopped: "neutral",
};
const workspaceColors = {
  modelPlatform: "violet", algorithmTeam: "blue", searchTeam: "amber", dataPlatform: "gray", cloudOps: "green",
} as const;

/** Documentation-only composition shared by the two resource demos. */
export function useCloudResourceDemoColumns(
  t: Translate,
  onInspect: (item: GroupedDataTableDemoItem) => void,
  dimensionColumns: "kind" | "all" = "kind",
) {
  const More = useIcon("ellipsis");
  const Brain = useIcon("brain");
  const Rocket = useIcon("rocket");
  const Pool = useIcon("square-library");
  const Compute = useIcon("monitor");
  const Storage = useIcon("folder");

  return useMemo<ColumnDef<GroupedDataTableDemoItem, unknown>[]>(() => {
    const icons = { inference: Brain, training: Rocket, gpu: Pool, compute: Compute, storage: Storage };
    const labels = {
      ascending: t("ascending"), descending: t("descending"),
      resetSorting: t("resetSorting"), hideColumn: t("hideColumn"),
    };
    return [
      {
        id: "name",
        // Keep stable grouping accessors while searching displayed, localized values.
        accessorFn: (item) => [item.name, item.id, item.spec, t(item.provider), t(item.kind), t(item.status)].join(" "),
        header: ({ column }) => <DataTableColumnHeader column={column} label={t("name")} labels={labels} />,
        enableHiding: false,
        meta: { label: t("name") },
        cell: ({ row }) => {
          const Icon = icons[row.original.kind];
          return <InfoItem className="min-w-64 px-0 py-1">
            <InfoItemLeading><Icon aria-hidden /></InfoItemLeading>
            <InfoItemContent><InfoItemTitle>{row.original.name}</InfoItemTitle><InfoItemDescription>{row.original.spec}</InfoItemDescription></InfoItemContent>
          </InfoItem>;
        },
      },
      { accessorKey: "provider", header: t("provider"), enableHiding: dimensionColumns !== "all", meta: { label: t("provider") }, cell: ({ row }) => t(row.original.provider) },
      {
        id: "workspace", accessorFn: (item) => t(item.workspace), header: t("workspace"), meta: { label: t("workspace") },
        cell: ({ row }) => <Badge size="sm" variant="dot" color={workspaceColors[row.original.workspace]}>{t(row.original.workspace)}</Badge>,
      },
      { id: "region", accessorFn: (item) => t(item.region), header: t("region"), meta: { label: t("region") } },
      {
        accessorKey: "capacity", header: t("capacity"), meta: { label: t("capacity") },
        cell: ({ row }) => <span className="tabular-nums">{t(row.original.capacityUnit, { count: row.original.capacity })}</span>,
      },
      {
        accessorKey: "utilization",
        header: ({ column }) => <DataTableColumnHeader column={column} label={t("utilization")} labels={labels} />,
        meta: { label: t("utilization") },
        cell: ({ row }) => <div className="flex items-center gap-2">
          <DonutSummary className="size-7 shrink-0" total={100} segments={[{ id: row.id, label: t("utilization"), value: row.original.utilization, color: "var(--fg-default)" }]} aria-label={`${t("utilization")} ${row.original.utilization}%`} />
          <span className="tabular-nums text-fg-default">{row.original.utilization}%</span>
        </div>,
      },
      {
        accessorKey: "status", header: t("status"), enableHiding: dimensionColumns !== "all", meta: { label: t("status") },
        filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)),
        cell: ({ row }) => <Badge size="sm" status={statusTones[row.original.status]}>{t(row.original.status)}</Badge>,
      },
      { accessorKey: "kind", header: t("kind"), enableHiding: false, meta: { label: t("kind") }, enableGlobalFilter: false, cell: ({ row }) => t(row.original.kind) },
      {
        id: "actions", header: () => <span className="sr-only">{t("inspect")}</span>, enableHiding: false,
        cell: ({ row }) => <Button aria-label={`${t("inspect")} ${row.original.name}`} iconOnly onClick={() => onInspect(row.original)} size="sm" variant="ghost"><More aria-hidden /></Button>,
      },
    ];
  }, [t, onInspect, dimensionColumns, More, Brain, Rocket, Pool, Compute, Storage]);
}

export function CloudResourceDemoDetails({ item, onClose, t }: {
  item: GroupedDataTableDemoItem | null;
  onClose: () => void;
  t: Translate;
}) {
  const fields = item ? [
    [t("identifier"), item.id], [t("kind"), t(item.kind)], [t("provider"), t(item.provider)],
    [t("workspace"), t(item.workspace)], [t("region"), t(item.region)],
    [t("capacity"), t(item.capacityUnit, { count: item.capacity })],
    [t("utilization"), `${item.utilization}%`], [t("status"), t(item.status)],
  ] : [];
  return <Dialog open={item !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <DialogContent>
      <DialogHeader><DialogTitle>{item?.name}</DialogTitle><DialogDescription>{item?.spec}</DialogDescription></DialogHeader>
      {item && <dl className="space-y-3 text-body">{fields.map(([label, value]) => <div key={label} className="flex justify-between gap-3">
        <dt className="shrink-0 text-fg-muted">{label}</dt>
        <dd className="min-w-0 break-words text-right text-fg-default">{value}</dd>
      </div>)}</dl>}
    </DialogContent>
  </Dialog>;
}
