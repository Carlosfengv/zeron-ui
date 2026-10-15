"use client";

import { useLocale } from "next-intl";
import Cursor from "@lobehub/icons/es/Cursor";
import Claude from "@lobehub/icons/es/Claude";
import Gemini from "@lobehub/icons/es/Gemini";
import OpenAI from "@lobehub/icons/es/OpenAI";
import Grok from "@lobehub/icons/es/Grok";
import Copilot from "@lobehub/icons/es/Copilot";
import Antigravity from "@lobehub/icons/es/Antigravity";
import { AccountActivity, accountActivityDemoData, type AccountActivityLabels } from "@zeron/blocks/account-activity-01";

const logos = { cursor: <Cursor size={16} />, "cursor-2": <Cursor size={16} />, "claude-max": <Claude.Color size={16} />,
  "claude-pro": <Claude.Color size={16} />, google: <Gemini.Color size={16} />, "codex-plus": <OpenAI size={15} />,
  "codex-pro": <OpenAI size={15} />, grok: <Grok size={16} />, "grok-heavy": <Grok size={16} />, copilot: <Copilot size={16} />, antigravity: <Antigravity.Color size={16} /> };
const data = { ...accountActivityDemoData, accounts: accountActivityDemoData.accounts.map((account) => ({ ...account, logo: logos[account.id as keyof typeof logos] })) };
const chineseLabels: AccountActivityLabels = {
  matrix: "矩阵", weeks: "周视图", range: "时间范围", accounts: "按账号", views: "活动视图", allAccounts: "全部账号", accountFilter: "筛选账号",
  all: "全部日期", weekdays: "工作日", weekends: "周末", dayFilter: "筛选日期类型", active: "活跃账号", averageActive: "平均活跃账号数", dayProfile: "日内分布",
  ranOut: "额度耗尽", locked: "已锁定", neverLocked: "从未锁定", weekday: "工作日", weekend: "周末", missing: "圆点：暂无读数。", quiet: "无锁定事件", quietActivity: "低活跃", busiestHour: "最忙时段",
  typicalWeek: "典型一周", averageHour: "每小时平均值", night: "夜间，00–07 时", peak: "峰值", windowFilling: "周期额度使用", usageWindows: "各周期用量", usageWindowsHint: "每个额度周期达到的最高使用比例",
  windowPeak: "周期峰值", hitLimit: "达到上限", thisWindow: "当前周期", selectedDays: "已选日期", selectRange: "选择日期范围", rangeHint: "在图表上拖动以调整时间范围", accountHint: "点击账号名称以显示或隐藏。",
  scaleHint: "每行使用独立色阶；平均值不计入锁定时段。", empty: "当前筛选范围内暂无活动读数。", loading: "正在加载账号活动…", error: "账号活动加载失败。", retry: "重试", unknown: "暂无读数",
  busiest: (time, day) => `${day} ${time} 最繁忙`, summary: (events, days, weekdays) => `${days} 天内 ${events} 次额度耗尽，其中 ${weekdays} 次发生在工作日`,
  rangeSummary: (count) => `${count} 个账号`, runOuts: (count) => `${count} 次额度耗尽`, lockedHours: (hours) => `锁定 ${hours} 小时`,
  accountSummary: (name, time) => `${name} 通常在 ${time} 耗尽额度`, weekAverage: (weeks) => `${weeks} 周的平均值`,
};

export function AccountActivityDemo() {
  const chinese = useLocale() === "zh-CN";
  return <div className="h-full min-h-0 overflow-auto bg-surface-base p-4 sm:p-8">
    <div className="mx-auto max-w-7xl"><AccountActivity data={data} locale={chinese ? "zh-CN" : "en-US"} labels={chinese ? chineseLabels : undefined} /></div>
  </div>;
}
