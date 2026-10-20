import type { SectionedDataTableLabels } from "./sectioned-data-table-types";

export const sectionedDataTableZhLabels: SectionedDataTableLabels = {
  title: "多维分组表格", groupBy: "分组依据", search: "搜索记录", searchPlaceholder: "搜索记录…",
  expandGroup: (label) => `展开 ${label}`, collapseGroup: (label) => `收起 ${label}`,
  showMore: (count, label) => `显示 ${label} 的另外 ${count} 条`, showLess: (label) => `收起 ${label} 的更多记录`,
  addToGroup: (label) => `添加到 ${label}`, results: (matching, total) => `${matching} 条匹配，共 ${total} 条记录`,
  clearFilters: "清空筛选", empty: "暂无记录", noResults: "没有匹配的记录", loading: "正在加载记录。",
  error: "记录加载失败，请重试。", retry: "重试", ungrouped: "未分组",
  customizeColumns: "自定义列", dragToReorder: "拖动调整列顺序", reorderAndToggle: "调整列顺序与显隐",
  showColumn: (label) => `显示 ${label} 列`, reorderColumn: (label) => `调整 ${label} 列顺序`,
};

export const sectionedDataTableEnLabels: SectionedDataTableLabels = {
  title: "Sectioned table", groupBy: "Group by", search: "Search records", searchPlaceholder: "Search records…",
  expandGroup: (label) => `Expand ${label}`, collapseGroup: (label) => `Collapse ${label}`,
  showMore: (count, label) => `Show ${count} more in ${label}`, showLess: (label) => `Show less in ${label}`,
  addToGroup: (label) => `Add to ${label}`, results: (matching, total) => `${matching} matching of ${total} records`,
  clearFilters: "Clear filters", empty: "No records yet", noResults: "No matching records", loading: "Loading records.",
  error: "Unable to load records. Try again.", retry: "Retry", ungrouped: "Ungrouped",
  customizeColumns: "Customize columns", dragToReorder: "Drag to reorder columns", reorderAndToggle: "Reorder and toggle columns",
  showColumn: (label) => `Show ${label} column`, reorderColumn: (label) => `Reorder ${label} column`,
};
