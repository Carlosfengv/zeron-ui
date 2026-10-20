"use client";

import { useState } from "react";
import { NextIntlClientProvider, useLocale, useMessages, useTranslations } from "next-intl";
import en from "@docs/content/en/blocks/grouped-data-table-01.json";
import zh from "@docs/content/zh-CN/blocks/grouped-data-table-01.json";
import { GroupedDataTable, groupedDataTableDemoItems, groupedDataTableEnLabels, groupedDataTableZhLabels, type GroupedDataTableDemoItem, type GroupedDataTableGroup } from "@zeron/blocks/grouped-data-table-01";
import { Button } from "@zeron/ui/button";
import { DataTableFacetedFilter } from "@zeron/ui/data-table";
import { useIcon } from "@zeron/ui/system/icon-context";
import { DemoSettingsMenu } from "./DemoSettingsMenu";
import { CloudResourceDemoDetails, cloudResourceKinds as kinds, cloudResourceStatuses as statuses, useCloudResourceDemoColumns } from "./CloudResourceTableDemoShared";

type DemoState = "ready" | "loading" | "empty" | "error";

export function GroupedDataTableDemo() {
  const locale = useLocale();
  const messages = useMessages();
  return <NextIntlClientProvider locale={locale} messages={{ ...messages, groupedDataTableDemo: locale === "en" ? en.groupedDataTableDemo : zh.groupedDataTableDemo }}>
    <GroupedDataTableDemoContent />
  </NextIntlClientProvider>;
}

function GroupedDataTableDemoContent() {
  const locale = useLocale();
  const t = useTranslations("groupedDataTableDemo");
  const [items, setItems] = useState(groupedDataTableDemoItems);
  const [state, setState] = useState<DemoState>("ready");
  const [selected, setSelected] = useState<GroupedDataTableDemoItem | null>(null);
  const Plus = useIcon("plus");
  const groups: GroupedDataTableGroup[] = kinds.map((value, index) => ({ value, label: t(value), description: t(`${value}Description`), color: (["violet", "blue", "amber", "gray", "green"] as const)[index] }));
  const columns = useCloudResourceDemoColumns(t, setSelected);

  return <div className="h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-6">
    <div className="mx-auto w-full max-w-screen-2xl space-y-3">
      <GroupedDataTable
        actions={<Button disabled={state !== "ready"} leadingIcon={Plus} onClick={() => setItems((current) => [...current, { ...groupedDataTableDemoItems[0], id: `infer-sample-${current.length + 1}`, name: t("sampleResource", { number: current.length + 1 }) }])}>{t("addSample")}</Button>}
        activeRowId={selected?.id}
        columns={columns}
        data={state === "empty" ? [] : items}
        description={t("description")}
        getRowId={(item) => item.id}
        groupBy="kind"
        groups={groups}
        labels={{
          ...(locale === "en" ? groupedDataTableEnLabels : groupedDataTableZhLabels),
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
