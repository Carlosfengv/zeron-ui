import type { ResourceCostLabels } from "./resource-cost-types";

export const resourceCostZhLabels: ResourceCostLabels = {
  title: "算力资源清单", monthlyCost: "月度成本", readyIn: "最长交付", atRisk: "风险资源", export: "导出",
  search: "搜索资源名称或编号…", clearSearch: "清除搜索", depth: "层级", collapse: "收起", all: "全部",
  availability: "资源状态", allStatuses: "全部状态", display: "显示", reorderColumns: "拖动以调整列顺序", reorderColumn: (name) => `调整 ${name} 的列顺序`, resource: "资源", code: "编号", quantity: "数量",
  unitCost: "月单价", totalCost: "月度成本", available: "可用", reserved: "已预留", provisioning: "交付中", limited: "库存紧张",
  expand: "展开", collapseRow: "收起", actions: "资源操作", inspect: "查看资源详情", empty: "暂无资源", noResults: "没有匹配的资源",
  reset: "重置筛选", loading: "正在加载资源…", error: "资源加载失败", invalid: "资源配置无效，请检查编号、类型、数量、单价、币种和语言。", retry: "重试",
  resources: (count) => `${count} 项资源`, days: (count) => count === 0 ? "即刻" : `${count} 天`,
  share: (percent) => `占整体月度成本 ${percent}`, filtered: "筛选结果保留父级路径，汇总与占比仍按完整清单计算。",
};

export const resourceCostEnLabels: ResourceCostLabels = {
  title: "Compute resources", monthlyCost: "Monthly cost", readyIn: "Ready in", atRisk: "At risk", export: "Export",
  search: "Search resources or IDs…", clearSearch: "Clear search", depth: "Depth", collapse: "Collapse", all: "All",
  availability: "Availability", allStatuses: "All statuses", display: "Display", reorderColumns: "Drag to reorder columns", reorderColumn: (name) => `Reorder ${name}`, resource: "Resource", code: "ID", quantity: "Qty",
  unitCost: "Unit / month", totalCost: "Monthly cost", available: "Available", reserved: "Reserved", provisioning: "Provisioning", limited: "Limited capacity",
  expand: "Expand", collapseRow: "Collapse", actions: "Resource actions", inspect: "Inspect resource", empty: "No resources yet", noResults: "No matching resources",
  reset: "Reset filters", loading: "Loading resources…", error: "Unable to load resources", invalid: "Invalid resource configuration. Check IDs, types, quantities, prices, currency and locale.", retry: "Retry",
  resources: (count) => `${count} resources`, days: (count) => count === 0 ? "Now" : `${count}d`,
  share: (percent) => `${percent} of the complete monthly cost`, filtered: "Matches keep their ancestors. Totals and shares refer to the complete resource list.",
};
