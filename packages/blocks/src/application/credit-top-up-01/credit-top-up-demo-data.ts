import type { CreditTopUpData } from "./credit-top-up-types";

export function createCreditTopUpDemoData(zh = false): CreditTopUpData {
  const days = zh ? ["周四", "周五", "周六", "周日", "周一", "周二", "周三"] : ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"];
  const history = (values: number[]) => values.map((value, index) => ({ label: days[index], value }));
  return {
    periodLabel: zh ? "10 月" : "October", totalCredits: 2000, averageDailyUsage: 84,
    snapshotAt: Date.UTC(2026, 9, 22), resetsAt: Date.UTC(2026, 10, 1),
    usage: [
      { id: "support", label: zh ? "客服回复" : "Support replies", periodCredits: 702, recentCredits: 270, description: zh ? "平均每天 41 额度" : "41 per day on average", colorIndex: 5, chart: "stem", history: history([41, 41, 38, 41, 34, 42, 33]) },
      { id: "code", label: zh ? "代码审查" : "Code review", periodCredits: 389, recentCredits: 216, description: zh ? "比上月多 82 额度" : "82 more than last month", colorIndex: 1, chart: "area", history: history([24, 49, 85, 119, 153, 190, 216]) },
      { id: "research", label: zh ? "研究" : "Research", periodCredits: 230, recentCredits: 102, description: zh ? "11 个 Notion 页面" : "11 Notion pages", colorIndex: 3, chart: "bar", history: history([8, 12, 18, 14, 19, 17, 14]) },
    ],
    packages: [
      { id: "starter", credits: 500, price: 10, currency: "USD" },
      { id: "standard", credits: 1000, price: 20, currency: "USD" },
      { id: "plus", credits: 2500, price: 45, currency: "USD" },
    ],
  };
}
