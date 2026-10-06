import type { SupportAnalyticsLabels } from "./support-analytics-types";

export const supportAnalyticsLabels: SupportAnalyticsLabels = {
  title: "客服工单分析", description: "分析当前窗口内创建的工单、服务水平和处理状态。", range: "统计范围",
  "this-week": "本周", "last-30-days": "最近 30 天", "last-12-weeks": "最近 12 周",
  all: "全部", email: "邮件", "live-chat": "在线聊天", "in-app": "应用内", social: "社交渠道",
  open: "未解决", resolved: "已解决", channels: "工单渠道", views: "工单状态",
  total: "工单总量", compare: "与上期比较", average: "平均", trend: "趋势", actual: "实际值", previous: "上期比较",
  "first-reply": "首次回复时间", resolution: "解决时间", "first-contact": "首次联系解决率",
  waiting: "当前等待时长", "sla-breach": "SLA 超时比例", reopened: "重开率",
  target: "目标", met: "达标", missed: "未达标", samples: "样本", recent: "最近工单",
  low: "低", normal: "普通", urgent: "紧急", more: "更多操作", refresh: "刷新", export: "导出当前快照",
  queue: "打开工单队列", details: "查看工单", resolve: "标记已解决", resolving: "正在解决",
  updated: "更新于", loading: "正在加载工单分析", refreshing: "正在刷新数据", stale: "当前数据已过期，显示上次快照。",
  error: "无法加载工单分析", actionError: "操作失败，请重试。", retry: "重试",
  empty: "暂无趋势数据", noTickets: "当前筛选下没有工单", unknown: "—", incomplete: "趋势数据不完整，平均值不可用。",
  values: "查看图表数据", date: "时间", count: "工单数", points: "个百分点",
};

export const supportAnalyticsEnglishLabels: SupportAnalyticsLabels = {
  title: "Support analytics", description: "Tickets created in this window, their service levels and current status.", range: "Time range",
  "this-week": "This week", "last-30-days": "Last 30 days", "last-12-weeks": "Last 12 weeks",
  all: "All", email: "Email", "live-chat": "Live chat", "in-app": "In-app", social: "Social",
  open: "Open", resolved: "Resolved", channels: "Ticket channel", views: "Ticket status",
  total: "Total tickets", compare: "vs previous period", average: "AVG", trend: "Trend", actual: "Actual", previous: "vs prev",
  "first-reply": "First reply time", resolution: "Time to resolve", "first-contact": "First-contact resolution",
  waiting: "Current wait time", "sla-breach": "SLA breach rate", reopened: "Reopened",
  target: "Target", met: "Within", missed: "Missing", samples: "samples", recent: "Recent tickets",
  low: "Low", normal: "Normal", urgent: "Urgent", more: "More actions", refresh: "Refresh", export: "Export snapshot",
  queue: "Open ticket queue", details: "View ticket", resolve: "Mark as resolved", resolving: "Resolving",
  updated: "Updated", loading: "Loading support analytics", refreshing: "Refreshing data", stale: "Showing an out-of-date snapshot.",
  error: "Unable to load support analytics", actionError: "This action failed. Please try again.", retry: "Retry",
  empty: "No trend data", noTickets: "No tickets match these filters", unknown: "—", incomplete: "Incomplete trend data; average unavailable.",
  values: "View chart data", date: "Date", count: "Tickets", points: "pp",
};
