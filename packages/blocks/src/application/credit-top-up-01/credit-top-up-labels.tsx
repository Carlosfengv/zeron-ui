import type { CreditTopUpLabels } from "./credit-top-up-types";

export const creditTopUpEnLabels: CreditTopUpLabels = {
  title: "Add credits", activity: "Recent activity", credits: "credits", remaining: "Left", packages: "Credit packages",
  cancel: "Cancel", selectPackage: "Select a package", loading: "Loading credit usage…", emptyUsage: "No recent activity.",
  emptyHistory: "No trend data.", emptyPackages: "No credit packages available.", invalid: "Credit usage or package data is invalid.",
  loadError: "Could not load credit usage.", confirmError: "Could not continue. Please try again.", retry: "Try again", lessThanDay: "Less than a day", historyColumn: "Day",
  usedIn: period => `Used in ${period}`, usageTotal: (used, total) => `${used} of ${total}`,
  forecast: (daily, runsOut, resets) => <>This week your agents used <strong className="font-medium text-fg-default">{daily} credits a day</strong>. At that pace, monthly credits run out on <strong className="font-medium text-fg-default">{runsOut}</strong>, before they reset on <strong className="font-medium text-fg-default">{resets}</strong>.</>,
  sufficient: (daily, resets) => <>Your agents used <strong className="font-medium text-fg-default">{daily} credits a day</strong>. Your monthly credits are expected to last until the reset on <strong className="font-medium text-fg-default">{resets}</strong>.</>,
  idle: resets => `No recent daily usage. Your monthly credits reset on ${resets}.`,
  packageCredits: credits => `${credits} credits`, coverage: (days, pastReset) => `About ${days} ${days === "1" ? "day" : "days"}${pastReset ? ", past the reset" : ""}`,
  confirm: (credits, price) => `Add ${credits} · ${price}`,
};

export const creditTopUpZhLabels: CreditTopUpLabels = {
  title: "添加额度", activity: "近期用量", credits: "额度", remaining: "剩余", packages: "充值套餐",
  cancel: "取消", selectPackage: "请选择套餐", loading: "正在加载额度用量…", emptyUsage: "暂无近期用量。",
  emptyHistory: "暂无趋势数据。", emptyPackages: "暂无可用充值套餐。", invalid: "额度用量或套餐数据无效。",
  loadError: "额度用量加载失败。", confirmError: "暂时无法继续，请重试。", retry: "重试", lessThanDay: "不足 1 天", historyColumn: "日期",
  usedIn: period => `${period}已用`, usageTotal: (used, total) => `${used} / ${total}`,
  forecast: (daily, runsOut, resets) => <>本周智能体平均每天使用 <strong className="font-medium text-fg-default">{daily} 额度</strong>。按此速度，月度额度将在 <strong className="font-medium text-fg-default">{runsOut}</strong> 耗尽，早于 <strong className="font-medium text-fg-default">{resets}</strong> 的重置时间。</>,
  sufficient: (daily, resets) => <>智能体平均每天使用 <strong className="font-medium text-fg-default">{daily} 额度</strong>，预计月度额度可用至 <strong className="font-medium text-fg-default">{resets}</strong> 重置。</>,
  idle: resets => `近期暂无日均用量，月度额度将于 ${resets} 重置。`,
  packageCredits: credits => `${credits} 额度`, coverage: (days, pastReset) => `约 ${days} 天${pastReset ? "，可用至下次重置后" : ""}`,
  confirm: (credits, price) => `添加 ${credits} · ${price}`,
};
