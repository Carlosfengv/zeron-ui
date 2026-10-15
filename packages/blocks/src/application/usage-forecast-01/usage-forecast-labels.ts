import type { UsageForecastLabels } from "./usage-forecast-types";

export const usageForecastEnLabels: Required<UsageForecastLabels> = {
  title: (count) => count ? `${count} ${count === 1 ? "account runs" : "accounts run"} out before reset` : "All accounts on track",
  summary: (name, time, duration) => `${name} first, ${time}, then locked ${duration}`,
  healthySummary: "Your current pace stays within the available quota.",
  pendingSummary: "Some accounts need more usage data or reconnection before they can be forecast.",
  forecast: "Forecast", table: "Table", view: "Usage view", account: "Account", used: "Used", pace: "Pace",
  outcome: "Runs out / at reset", resets: "Resets", now: "Now", reset: "Reset", runsOut: "Runs out",
  atReset: "at reset", locked: "Locked before reset", even: "even", currentPace: "Current pace", evenPace: "Even pace",
  recentPace: "Recent pace", perDay: "pp used per day", allowed: (value) => `Allowed: ${value} pp a day`,
  usedIn: (used, elapsed) => `Used ${used} in ${elapsed} of the window`,
  projectedUse: "Projected use", under: "under", newWindow: "New window, no forecast",
  assumption: "Assumes the pace holds.", selectRow: "Select a row for detail.", sortHint: "Select a header to sort, a row for detail.",
  within: "Within allowance", over: "Over", allowedPerDay: "Allowed per day", unknown: "Unknown", tooEarly: "Too early to forecast",
  reconnect: "Reconnect to forecast", empty: "No accounts to forecast", noHistory: "No usage history available.",
  noRecentUsage: "No recent daily usage available.", noForecast: "No forecast available for this account.",
  invalid: "Check account IDs, usage percentages and current quota windows.", retry: "Try again", loading: "Loading accounts…",
  days: "days", hours: "h", in: "in",
};

export const usageForecastZhLabels: Required<UsageForecastLabels> = {
  title: (count) => count ? `${count} 个账户将在重置前耗尽额度` : "所有账户用量正常",
  summary: (name, time, duration) => `${name} 最先耗尽于${time}，随后停用 ${duration}`,
  healthySummary: "按当前使用速度，所有账户都能用到额度重置。",
  pendingSummary: "部分账户需要更多用量数据或重新连接后才能预测。",
  forecast: "预测", table: "表格", view: "用量视图", account: "账户", used: "已用", pace: "使用速度",
  outcome: "耗尽时间 / 重置时用量", resets: "重置时间", now: "现在", reset: "重置", runsOut: "耗尽于",
  atReset: "重置时", locked: "重置前停用", even: "均速", currentPace: "当前速度", evenPace: "平均速度",
  recentPace: "近期用量", perDay: "每日消耗百分点", allowed: (value) => `每日可用：${value} 个百分点`,
  usedIn: (used, elapsed) => `已用 ${used}，当前周期已过 ${elapsed}`,
  projectedUse: "预计用量", under: "低于", newWindow: "新周期，暂无预测",
  assumption: "假设使用速度保持不变。", selectRow: "选择账户查看详情。", sortHint: "点击表头排序，选择账户查看详情。",
  within: "额度内", over: "超出", allowedPerDay: "每日可用", unknown: "未知", tooEarly: "数据不足，暂无法预测",
  reconnect: "重新连接以预测", empty: "暂无可预测的账户", noHistory: "暂无历史用量。",
  noRecentUsage: "暂无近期每日用量。", noForecast: "该账户暂无预测数据。",
  invalid: "请检查账户 ID、用量百分比和当前额度周期。", retry: "重试", loading: "正在加载账户…",
  days: "天", hours: "小时", in: "剩余",
};
