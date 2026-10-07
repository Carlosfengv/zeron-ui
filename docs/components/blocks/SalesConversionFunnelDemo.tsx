"use client";

import { useLocale } from "next-intl";
import { SalesConversionFunnel, salesFunnelDemoStages, salesFunnelDemoTeams } from "@zeron/blocks/sales-conversion-funnel-01";
import { Button } from "@zeron/ui/button";
import { DropdownMenu, DropdownTrigger, DropdownContent } from "@zeron/ui/dropdown";
import { useIcon } from "@zeron/ui/system/icon-context";
import { MenuItem } from "@zeron/ui/menu-item";

export function SalesConversionFunnelDemo() {
  const locale = useLocale();
  const zh = locale.startsWith("zh");
  const Ellipsis = useIcon("ellipsis");
  const stageNames = ["线索", "联系", "报价", "成交"];
  const teams = salesFunnelDemoTeams.map((team, index) => ({ ...team, label: zh ? `团队 ${index + 1}` : team.label }));
  const stages = salesFunnelDemoStages.map((stage, index) => ({ ...stage, label: zh ? stageNames[index] : stage.label }));

  function exportData() {
    const snapshot = { demonstration: true, teams, stages };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = "sales-conversion-funnel-demo.json";
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <div className="flex h-full min-h-0 w-full items-center justify-center overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="my-auto w-full max-w-4xl space-y-4">
      <SalesConversionFunnel stages={stages} teams={teams} locale={locale} title={zh ? "销售转化漏斗" : "Sales Conversion Funnel"}
        labels={zh ? { deals: "成交", conversionRate: "转化率", teams: "团队", empty: "暂无线索", invalid: "漏斗数据缺失或无效" } : undefined}
        actions={<DropdownMenu><DropdownTrigger render={<Button iconOnly variant="ghost" size="sm" aria-label={zh ? "漏斗操作" : "Funnel actions"}><Ellipsis aria-hidden="true" /></Button>} /><DropdownContent align="end"><MenuItem index={0} label={zh ? "导出示例数据" : "Export example data"} onSelect={exportData} /></DropdownContent></DropdownMenu>} />
      <p className="text-label text-fg-subtle">{zh ? "示例数据 · 团队拆分为演示值，面积按实际数值比例绘制。" : "Example data · team breakdowns are illustrative; areas follow actual value proportions."}</p>
    </div>
  </div>;
}
