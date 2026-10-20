"use client";

import { useState } from "react";
import { NextIntlClientProvider, useLocale, useMessages, useTranslations } from "next-intl";
import en from "@docs/content/en/blocks/grouped-data-table-02.json";
import zh from "@docs/content/zh-CN/blocks/grouped-data-table-02.json";
import { SectionedDataTable, sectionedDataTableDemoItems, sectionedDataTableEnLabels, sectionedDataTableZhLabels, type SectionedDataTableDemoItem, type SectionedDataTableDimension } from "@zeron/blocks/grouped-data-table-02";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DataTableFacetedFilter } from "@zeron/ui/data-table";
import { useIcon } from "@zeron/ui/system/icon-context";
import { DemoSettingsMenu } from "./DemoSettingsMenu";
import { CloudResourceDemoDetails, cloudResourceKinds as kinds, cloudResourceStatuses as statuses, useCloudResourceDemoColumns } from "./CloudResourceTableDemoShared";

type DemoState = "ready" | "loading" | "empty" | "error";

export function SectionedDataTableDemo() {
  const locale = useLocale();
  const messages = useMessages();
  return <NextIntlClientProvider locale={locale} messages={{ ...messages, sectionedDataTableDemo: locale === "en" ? en.sectionedDataTableDemo : zh.sectionedDataTableDemo }}>
    <SectionedDataTableDemoContent />
  </NextIntlClientProvider>;
}

function SectionedDataTableDemoContent() {
  const locale = useLocale();
  const t = useTranslations("sectionedDataTableDemo");
  const [items, setItems] = useState(sectionedDataTableDemoItems);
  const [state, setState] = useState<DemoState>("ready");
  const [selected, setSelected] = useState<SectionedDataTableDemoItem | null>(null);
  const Plus = useIcon("plus");
  const dimensions: [SectionedDataTableDimension, ...SectionedDataTableDimension[]] = [
    { columnId: "status", label: t("status"), groups: statuses.map((value, index) => ({ value, label: t(value), description: t(`${value}Description`), color: (["green", "gray", "blue", "amber", "gray"] as const)[index] })) },
    { columnId: "kind", label: t("kind"), groups: kinds.map((value, index) => ({ value, label: t(value), description: t(`${value}Description`), color: (["violet", "blue", "amber", "gray", "green"] as const)[index] })) },
    { columnId: "provider", label: t("provider"), groups: (["privateCloud", "aliyun", "tencentCloud", "aws"] as const).map((value, index) => ({ value, label: t(value), color: (["violet", "amber", "blue", "gray"] as const)[index] })) },
  ];
  const addResource = (group?: { columnId: string; value: string }) => {
    const template = sectionedDataTableDemoItems.find((item) =>
      group?.columnId === "status" ? item.status === group.value :
      group?.columnId === "kind" ? item.kind === group.value :
      group?.columnId === "provider" ? item.provider === group.value : false,
    ) ?? sectionedDataTableDemoItems[0];
    setItems((current) => [...current, {
      ...template, id: `resource-sample-${current.length + 1}`,
      name: t("sampleResource", { number: current.length + 1 }),
    }]);
  };
  const columns = useCloudResourceDemoColumns(t, setSelected, "all");

  return <div className="h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-6">
    <div className="mx-auto w-full max-w-screen-2xl space-y-3">
      <SectionedDataTable
        actions={<Button disabled={state !== "ready"} leadingIcon={Plus} onClick={() => addResource()}>{t("addSample")}</Button>}
        activeRowId={selected?.id}
        columns={columns}
        data={state === "empty" ? [] : items}
        description={t("description")}
        getRowId={(item) => item.id}
        dimensions={dimensions}
        onAddToGroup={addResource}
        renderStats={({ rows }) => <><Badge>{t("resourceCount", { count: rows.length })}</Badge><Badge status="warning">{t("attentionCount", { count: rows.filter((row) => row.original.status === "maintenance" || row.original.status === "pending").length })}</Badge></>}
        renderSummary={({ rows }) => kinds.map((value) => <Badge key={value} variant="plain">{t(value)} · {rows.filter((row) => row.original.kind === value).length}</Badge>)}
        labels={{
          ...(locale === "en" ? sectionedDataTableEnLabels : sectionedDataTableZhLabels),
          search: t("search"), searchPlaceholder: t("searchPlaceholder"),
          empty: t("emptyResources"), noResults: t("noResources"), loading: t("loadingResources"), error: t("errorResources"),
          results: (matching, total) => t("resourceResults", { matching, total }),
        }}
        onRetry={() => setState("ready")}
        onRowActivate={setSelected}
        renderFilters={(table) => <DataTableFacetedFilter column={table.getColumn("status")!} title={t("status")} labels={{ clearFilters: t("clearFilters") }} multiple options={statuses.map((value) => ({ value, label: t(value) }))} />}
        state={state === "empty" ? "ready" : state}
        title={t("title")}
      />
      <p className="text-center text-label text-fg-subtle">{t("exampleNote")}</p>
    </div>
    <DemoSettingsMenu<DemoState> value={state} onChange={setState} options={(["ready", "loading", "empty", "error"] as const).map((value) => ({ value, label: t(value) }))} />
    <CloudResourceDemoDetails item={selected} onClose={() => setSelected(null)} t={t} />
  </div>;
}
