import type { UsageTimelineLabels } from "./usage-timeline-types";

export const usageTimelineEnLabels: UsageTimelineLabels = {
  title: "Account usage timeline", account: "Account", limits: "Limits · Used", today: "Today", previous: "Previous period", next: "Next period",
  period: "Quota window", weekly: "Weekly", fiveHour: "5-Hour", cycle: "Cycle", measure: "Usage display", used: "Used", left: "Left",
  now: "Now", ended: "Ended", nextWindow: "Next", currentWindow: "Current window", timePassed: "Time passed", earlier: "Earlier",
  expiry: "Banked reset expires", reset: "Reset early", plenty: "Plenty left", low: "Running low", out: "Almost out",
  disconnected: "Disconnected", noWindow: "No window data", empty: "No accounts to display", loading: "Loading account usage…",
  error: "Could not load account usage.", invalid: "Account usage data is invalid.", retry: "Try again",
  accountCount: (count) => `${count} ${count === 1 ? "account" : "accounts"}`, dayCount: (count) => `${count} ${count === 1 ? "day" : "days"}`,
};

export const usageTimelineZhLabels: UsageTimelineLabels = {
  title: "账户用量时间线", account: "账户", limits: "限额 · 已用", today: "今天", previous: "上一时段", next: "下一时段",
  period: "额度周期", weekly: "每周", fiveHour: "5 小时", cycle: "计费周期", measure: "用量显示", used: "已用", left: "剩余",
  now: "现在", ended: "已结束", nextWindow: "下个周期", currentWindow: "当前周期", timePassed: "已过时间", earlier: "历史周期",
  expiry: "累计重置到期", reset: "提前重置", plenty: "余量充足", low: "余量偏低", out: "即将耗尽",
  disconnected: "连接已断开", noWindow: "暂无该周期数据", empty: "暂无账户", loading: "正在加载账户用量…",
  error: "暂时无法获取账户用量。", invalid: "账户用量数据无效。", retry: "重试",
  accountCount: (count) => `${count} 个账户`, dayCount: (count) => `${count} 天`,
};
